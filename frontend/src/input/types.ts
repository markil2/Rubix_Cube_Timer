/**
 * Everything that can drive the timer, regardless of where it comes from.
 *
 * - press / release / cancel come from a human-operated control
 *   (spacebar or touch).
 * - start / stop come from the Arduino's cube sensor: "START" when the cube
 *   is lifted and "STOP:12.347" when it is put back. When the hardware
 *   reports a stop time, it is authoritative over the browser's clock.
 */
export type TimerInput =
  | { type: 'press' }
  | { type: 'release' }
  | { type: 'cancel' }
  | { type: 'start' }
  | { type: 'stop'; timeMs?: number }

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export type InputSourceKind = 'keyboard' | 'arduino'

export interface TimerInputSource {
  readonly kind: InputSourceKind
  /** Start listening; returns a function that stops listening. */
  connect(emit: (input: TimerInput) => void): () => void
}
