export type Penalty = 'none' | '+2' | 'DNF'

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
}

/** What the timer hands over when a solve finishes; the API assigns id, n and date. */
export interface NewSolve {
  timeMs: number
  penalty: Penalty
  scramble: string
}

export interface Profile {
  name: string
  handle: string
  location: string
  since: string
  mainEvent: string
}
