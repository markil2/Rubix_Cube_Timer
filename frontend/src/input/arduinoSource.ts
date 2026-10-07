import type { TimerInput, TimerInputSource } from './types'

/**
 * Parse one newline-delimited JSON message from the Arduino.
 *   {"event":"start"}             → start
 *   {"event":"stop","time":12.47} → stop (time in seconds)
 */
export function parseArduinoLine(line: string): TimerInput | null {
  try {
    const msg = JSON.parse(line.trim()) as { event?: string; time?: unknown }
    if (msg.event === 'start') return { type: 'start' }
    if (msg.event === 'stop') {
      const seconds = typeof msg.time === 'number' ? msg.time : undefined
      return { type: 'stop', timeMs: seconds === undefined ? undefined : Math.round(seconds * 1000) }
    }
  } catch {
    // Ignore partial or malformed lines from the serial stream.
  }
  return null
}

/**
 * Placeholder for the Web Serial connection. It implements the same
 * interface as the keyboard source, so wiring it in later means
 * reading lines from the port and passing them through parseArduinoLine —
 * no UI changes.
 */
export function createArduinoSource(readLines: (onLine: (line: string) => void) => () => void): TimerInputSource {
  return {
    kind: 'arduino',
    connect(emit) {
      return readLines((line) => {
        const input = parseArduinoLine(line)
        if (input) emit(input)
      })
    },
  }
}
