import type { Penalty, Solve } from '../data/types'

/** Times are truncated to hundredths, as on a competition display. */
export function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 10))
  const cs = total % 100
  const s = Math.floor(total / 100) % 60
  const m = Math.floor(total / 6000)
  const csStr = cs.toString().padStart(2, '0')
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}.${csStr}`
  return `${s}.${csStr}`
}

export function effectiveMs(solve: Pick<Solve, 'timeMs' | 'penalty'>): number {
  if (solve.penalty === 'DNF') return Infinity
  return solve.timeMs + (solve.penalty === '+2' ? 2000 : 0)
}

export function formatSolve(solve: { timeMs: number; penalty: Penalty }): string {
  if (solve.penalty === 'DNF') return 'DNF'
  return formatMs(effectiveMs(solve)) + (solve.penalty === '+2' ? '+' : '')
}

/** For stat values that may be missing (not enough solves) or DNF. */
export function formatStat(ms: number | null): string {
  if (ms === null) return '—'
  if (!Number.isFinite(ms)) return 'DNF'
  return formatMs(ms)
}

export function padSolveNumber(n: number): string {
  return n.toString().padStart(3, '0')
}
