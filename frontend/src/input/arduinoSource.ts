import type { TimerInput } from './types'

/**
 * Parse one line from the Arduino.
 *   START        → start (cube lifted)
 *   STOP:12.347  → stop, time in seconds (cube put back)
 * The JSON form ({"event":"start"} / {"event":"stop","time":12.47}) is also
 * accepted. Anything else returns null and is ignored.
 */
export function parseArduinoLine(raw: string): TimerInput | null {
  const line = raw.trim()
  if (!line) return null

  if (/^START$/i.test(line)) return { type: 'start' }

  const stop = /^STOP:\s*(\d+(?:\.\d+)?)$/i.exec(line)
  if (stop) return stopFromSeconds(Number(stop[1]))

  if (line.startsWith('{')) {
    try {
      const msg = JSON.parse(line) as { event?: unknown; time?: unknown }
      if (msg.event === 'start') return { type: 'start' }
      if (msg.event === 'stop' && typeof msg.time === 'number') return stopFromSeconds(msg.time)
    } catch {
      // Malformed JSON: fall through and ignore.
    }
  }

  return null
}

function stopFromSeconds(seconds: number): TimerInput | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  return { type: 'stop', timeMs: Math.round(seconds * 1000) }
}

/**
 * Reassembles newline-delimited messages from a byte stream that arrives in
 * arbitrary chunks ("STA" + "RT\nSTOP:" + "12.347\n" → "START", "STOP:12.347").
 */
export function createLineSplitter(onLine: (line: string) => void) {
  const decoder = new TextDecoder()
  let buffer = ''

  return {
    push(chunk: Uint8Array) {
      buffer += decoder.decode(chunk, { stream: true })
      let newline = buffer.indexOf('\n')
      while (newline !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, '')
        buffer = buffer.slice(newline + 1)
        onLine(line)
        newline = buffer.indexOf('\n')
      }
      // Guard against a device that never sends a newline.
      if (buffer.length > 1024) buffer = ''
    },
    reset() {
      buffer = ''
    },
  }
}
