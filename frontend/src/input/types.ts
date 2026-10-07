/**
 * Everything that can drive the timer, regardless of where it comes from.
 *
 * - press / release / cancel come from a human-operated control
 *   (spacebar, touch, or a future physical button).
 * - start / stop mirror the Arduino protocol: {"event":"start"} and
 *   {"event":"stop","time":12.47}. When the hardware reports a stop time,
 *   it is authoritative over the browser's clock.
 */
export type TimerInput =
  | { type: 'press' }
  | { type: 'release' }
  | { type: 'cancel' }
  | { type: 'start' }
  | { type: 'stop'; timeMs?: number }

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export interface TimerInputSource {
  readonly kind: 'keyboard' | 'arduino'
  /** Start listening; returns a function that stops listening. */
  connect(emit: (input: TimerInput) => void): () => void
}
