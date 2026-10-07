import type { InputSourceKind } from '../input/types'

export type Penalty = 'none' | '+2' | 'DNF'

/** Whether a solve has reached the backend. Absent for mock/demo solves. */
export type SyncStatus = 'saving' | 'synced' | 'failed'

export interface Solve {
  id: string
  /** 1-based solve number within the user's history */
  n: number
  /** Raw measured time in milliseconds, before penalties */
  timeMs: number
  penalty: Penalty
  scramble: string
  /** ISO timestamp */
  date: string
  /** Arduino solves carry millisecond precision and are shown to 3 decimals. */
  source?: InputSourceKind
  sync?: SyncStatus
}

/** What the timer hands over when a solve finishes. */
export interface NewSolve {
  timeMs: number
  penalty: Penalty
  scramble: string
  source: InputSourceKind
}

export interface Profile {
  name: string
  handle: string
  location: string
  since: string
  mainEvent: string
}
