import type { Penalty, Solve } from '../data/types'

export type Precision = 2 | 3

/** Times are truncated, as on a competition display: 2 decimals, or 3 for millisecond-accurate Arduino times. */
export function formatMs(ms: number, precision: Precision = 2): string {
  const unit = precision === 3 ? 1 : 10
  const perSecond = precision === 3 ? 1000 : 100
  const total = Math.max(0, Math.floor(ms / unit))
  const frac = total % perSecond
  const s = Math.floor(total / perSecond) % 60
  const m = Math.floor(total / (perSecond * 60))
  const fracStr = frac.toString().padStart(precision, '0')
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}.${fracStr}`
  return `${s}.${fracStr}`
}

export function precisionOf(solve: Pick<Solve, 'source'>): Precision {
  return solve.source === 'arduino' ? 3 : 2
}

export function effectiveMs(solve: Pick<Solve, 'timeMs' | 'penalty'>): number {
  if (solve.penalty === 'DNF') return Infinity
  return solve.timeMs + (solve.penalty === '+2' ? 2000 : 0)
}

export function formatSolve(solve: { timeMs: number; penalty: Penalty; source?: Solve['source'] }): string {
  if (solve.penalty === 'DNF') return 'DNF'
  return formatMs(effectiveMs(solve), precisionOf(solve)) + (solve.penalty === '+2' ? '+' : '')
}

/** For stat values that may be missing (not enough solves) or DNF. */
export function formatStat(ms: number | null, precision: Precision = 2): string {
  if (ms === null) return '—'
  if (!Number.isFinite(ms)) return 'DNF'
  return formatMs(ms, precision)
}

export function padSolveNumber(n: number): string {
  return n.toString().padStart(3, '0')
}
