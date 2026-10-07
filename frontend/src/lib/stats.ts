import type { Solve } from '../data/types'
import { effectiveMs } from './format'

/** WCA-style average of N: drop the best and worst (5% each side, at least one), mean the rest. */
export function averageOf(solves: Solve[]): number | null {
  const n = solves.length
  if (n < 3) return null
  const trim = Math.max(1, Math.ceil(n * 0.05))
  const sorted = solves.map(effectiveMs).sort((a, b) => a - b)
  const counted = sorted.slice(trim, n - trim)
  if (counted.some((t) => !Number.isFinite(t))) return Infinity
  return counted.reduce((sum, t) => sum + t, 0) / counted.length
}

/** Current average of the most recent `size` solves. */
export function currentAverage(solves: Solve[], size: number): number | null {
  if (solves.length < size) return null
  return averageOf(solves.slice(-size))
}

/** Best rolling average of `size` across the whole history. */
export function bestAverage(solves: Solve[], size: number): number | null {
  let best: number | null = null
  for (let i = 0; i + size <= solves.length; i++) {
    const avg = averageOf(solves.slice(i, i + size))
    if (avg !== null && (best === null || avg < best)) best = avg
  }
  return best
}

export function personalBest(solves: Solve[]): Solve | null {
  let best: Solve | null = null
  for (const s of solves) {
    if (!Number.isFinite(effectiveMs(s))) continue
    if (!best || effectiveMs(s) < effectiveMs(best)) best = s
  }
  return best
}

/** Mean of all non-DNF solves. */
export function mean(solves: Solve[]): number | null {
  const times = solves.map(effectiveMs).filter(Number.isFinite)
  if (times.length === 0) return null
  return times.reduce((sum, t) => sum + t, 0) / times.length
}

export interface StatsSummary {
  count: number
  best: Solve | null
  mean: number | null
  ao5: number | null
  ao12: number | null
  bestAo5: number | null
  bestAo12: number | null
}

export function summarize(solves: Solve[]): StatsSummary {
  return {
    count: solves.length,
    best: personalBest(solves),
    mean: mean(solves),
    ao5: currentAverage(solves, 5),
    ao12: currentAverage(solves, 12),
    bestAo5: bestAverage(solves, 5),
    bestAo12: bestAverage(solves, 12),
  }
}
