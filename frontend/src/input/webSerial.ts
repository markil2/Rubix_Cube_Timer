/**
 * Minimal Web Serial typings (the API is Chromium-only and not yet in
 * TypeScript's DOM lib) plus the read loop for the Arduino.
 */

export interface SerialPort extends EventTarget {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readonly readable: ReadableStream<Uint8Array> | null
}

interface Serial extends EventTarget {
  requestPort(options?: object): Promise<SerialPort>
  getPorts(): Promise<SerialPort[]>
}

export const ARDUINO_BAUD_RATE = 9600

export function getSerial(): Serial | null {
  const nav = navigator as Navigator & { serial?: Serial }
  return nav.serial ?? null
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

export interface OpenConnection {
  /** Resolves when reading ends: closed by us, device unplugged, or a read error. */
  done: Promise<{ reason: 'closed' | 'lost'; error?: unknown }>
  close(): Promise<void>
}

/** Opens the port and pumps every received chunk into onChunk until closed or lost. */
export async function openSerial(port: SerialPort, onChunk: (chunk: Uint8Array) => void): Promise<OpenConnection> {
  await port.open({ baudRate: ARDUINO_BAUD_RATE })

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  let closing = false

  const done = (async (): Promise<{ reason: 'closed' | 'lost'; error?: unknown }> => {
    let error: unknown
    let ended = false
    // Non-fatal errors (framing, buffer overrun) replace port.readable with a fresh
    // stream, so keep reading. Unplugging makes it null and ends the loop.
    while (port.readable && !closing && !ended) {
      reader = port.readable.getReader()
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) {
            ended = true
            break
          }
          if (value) onChunk(value)
        }
      } catch (e) {
        error = e
      } finally {
        reader.releaseLock()
        reader = null
      }
    }
    try {
      await port.close()
    } catch {
      // Already closed or the device is gone.
    }
    return closing ? { reason: 'closed' } : { reason: 'lost', error }
  })()

  return {
    done,
    async close() {
      closing = true
      try {
        await reader?.cancel()
      } catch {
        // Reader may already be released.
      }
      await done
    },
  }
}
