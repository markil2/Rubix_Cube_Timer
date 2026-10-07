import type { Penalty } from '../data/types'
import type { TimerInput } from '../input/types'

/**
 * idle ──release──▶ inspecting ──press──▶ holding ──(held ≥ HOLD_MS)──▶ ready ──release──▶ running ──press──▶ stopped
 *                       ▲                   │ release (too early)
 *                       └───────────────────┘
 * stopped ──release──▶ idle (key-up from the stopping press is swallowed first)
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
}

export type TimerAction = (TimerInput | { type: 'tick' }) & { at: number }

export function inspectionPenalty(elapsedMs: number): Penalty {
  if (elapsedMs > INSPECTION_DNF_MS) return 'DNF'
  if (elapsedMs > INSPECTION_MS) return '+2'
  return 'none'
}

function startRunning(state: TimerState, at: number): TimerState {
  const penalty = state.inspectionStartedAt === null ? 'none' : inspectionPenalty(at - state.inspectionStartedAt)
  return { ...state, phase: 'running', startedAt: at, holdStartedAt: null, penalty, resultMs: null }
}

function stop(state: TimerState, at: number, timeMs?: number): TimerState {
  const resultMs = timeMs ?? (state.startedAt === null ? 0 : at - state.startedAt)
  return {
    ...state,
    phase: 'stopped',
    resultMs,
    inspectionStartedAt: null,
    completed: state.completed + 1,
  }
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  const { at } = action

  switch (action.type) {
    case 'cancel':
      return { ...initialTimerState, completed: state.completed }

    // Hardware events skip the human hold/ready handshake.
    case 'start':
      return state.phase === 'running' ? state : startRunning(state, at)
    case 'stop':
      return state.phase === 'running' ? stop(state, at, action.timeMs) : state

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
