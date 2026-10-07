import type { Penalty } from '../data/types'
import type { InputSourceKind, TimerInput } from '../input/types'

/**
 * idle ──release──▶ inspecting ──press──▶ holding ──(held ≥ HOLD_MS)──▶ ready ──release──▶ running ──press──▶ stopped
 *                       ▲                   │ release (too early)
 *                       └───────────────────┘
 * stopped ──release──▶ idle (key-up from the stopping press is swallowed first)
 *
 * Arduino cube sensor (START = cube lifted, STOP:x = cube put back):
 *   idle/stopped ──START──▶ running ──STOP:x──▶ stopped (x is the official time)
 *   inspecting ──START──▶ inspecting (cube in hand) ──STOP──▶ ready ──START──▶ running
 *   i.e. the first lift/put-down during inspection is the inspection itself;
 *   the next lift starts the solve.
 */
export type Phase = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running' | 'stopped'

export const HOLD_MS = 550
export const INSPECTION_MS = 15_000
export const INSPECTION_DNF_MS = 17_000

export interface TimerState {
  phase: Phase
  inspectionStartedAt: number | null
  holdStartedAt: number | null
  startedAt: number | null
  /** Penalty carried from inspection into the solve. */
  penalty: Penalty
  /** Final result of the last solve. */
  resultMs: number | null
  /** Increments each time a solve completes, so effects can react exactly once. */
  completed: number
  /** Swallow the key-up that follows the press which stopped the timer. */
  awaitingRelease: boolean
  /** The cube was lifted off the sensor during inspection and not yet put back. */
  cubeInHand: boolean
  /** Which input produced the final time of the last solve. */
  resultSource: InputSourceKind
}

export const initialTimerState: TimerState = {
  phase: 'idle',
  inspectionStartedAt: null,
  holdStartedAt: null,
  startedAt: null,
  penalty: 'none',
  resultMs: null,
  completed: 0,
  awaitingRelease: false,
  cubeInHand: false,
  resultSource: 'keyboard',
}

export type TimerAction = (TimerInput | { type: 'tick' }) & { at: number }

export function inspectionPenalty(elapsedMs: number): Penalty {
  if (elapsedMs > INSPECTION_DNF_MS) return 'DNF'
  if (elapsedMs > INSPECTION_MS) return '+2'
  return 'none'
}

function startRunning(state: TimerState, at: number): TimerState {
  const penalty = state.inspectionStartedAt === null ? 'none' : inspectionPenalty(at - state.inspectionStartedAt)
  return { ...state, phase: 'running', startedAt: at, holdStartedAt: null, cubeInHand: false, penalty, resultMs: null }
}

/**
 * A hardware-reported time is authoritative (millisecond precision). Browser
 * clock times are truncated to hundredths, matching what the display shows.
 */
function stop(state: TimerState, at: number, timeMs?: number): TimerState {
  const resultMs = timeMs ?? Math.floor((state.startedAt === null ? 0 : at - state.startedAt) / 10) * 10
  return {
    ...state,
    phase: 'stopped',
    resultMs,
    resultSource: timeMs === undefined ? 'keyboard' : 'arduino',
    inspectionStartedAt: null,
    completed: state.completed + 1,
  }
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  const { at } = action

  switch (action.type) {
    case 'cancel':
      return { ...initialTimerState, completed: state.completed }

    // Arduino sensor events. Duplicates (START while running, STOP with no
    // active solve) are ignored.
    case 'start':
      switch (state.phase) {
        case 'running':
          return state
        case 'inspecting':
        case 'holding':
          // First lift during inspection: the cube is being inspected.
          return state.cubeInHand ? state : { ...state, phase: 'inspecting', holdStartedAt: null, cubeInHand: true }
        default:
          return startRunning(state, at)
      }
    case 'stop':
      if (state.phase === 'running') return stop(state, at, action.timeMs)
      // Cube put back after inspecting: armed, the next lift starts the solve.
      if (state.cubeInHand && (state.phase === 'inspecting' || state.phase === 'holding')) {
        return { ...state, phase: 'ready', holdStartedAt: null, cubeInHand: false }
      }
      return state

    case 'tick':
      if (state.phase === 'holding' && state.holdStartedAt !== null && at - state.holdStartedAt >= HOLD_MS) {
        return { ...state, phase: 'ready' }
      }
      return state

    case 'press':
      switch (state.phase) {
        case 'inspecting':
          return { ...state, phase: 'holding', holdStartedAt: at }
        case 'running':
          return { ...stop(state, at), awaitingRelease: true }
        default:
          return state
      }

    case 'release':
      if (state.awaitingRelease) return { ...state, awaitingRelease: false }
      switch (state.phase) {
        case 'idle':
        case 'stopped':
          return {
            ...state,
            phase: 'inspecting',
            inspectionStartedAt: at,
            holdStartedAt: null,
            startedAt: null,
            penalty: 'none',
            resultMs: null,
            cubeInHand: false,
          }
        case 'holding':
          return { ...state, phase: 'inspecting', holdStartedAt: null }
        case 'ready':
          return startRunning(state, at)
        default:
          return state
      }
  }
}
