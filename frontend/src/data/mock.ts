import { generateScramble, seededRandom } from '../lib/scramble'
import type { Penalty, Profile, Solve } from './types'

const SOLVE_COUNT = 127
const PB_INDEX = 88

/**
 * Deterministic mock history: ~127 solves trending from ~14s down to ~12s,
 * a single 9.82 PB, a handful of +2s and one DNF.
 */
function buildMockSolves(): Solve[] {
  const random = seededRandom(27)
  const gaussian = () => {
    const u = 1 - random()
    const v = random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const end = new Date('2026-10-06T19:30:00Z').getTime()
  const span = 34 * 24 * 60 * 60 * 1000

  return Array.from({ length: SOLVE_COUNT }, (_, i) => {
    const progress = i / (SOLVE_COUNT - 1)
    const target = 14.1 - progress * 1.9
    let seconds = target + gaussian() * 1.15
    seconds = Math.min(19.5, Math.max(10.21, seconds))
    if (i === PB_INDEX) seconds = 9.82

    let penalty: Penalty = 'none'
    if (i === 41) penalty = 'DNF'
    else if (i === 17 || i === 63 || i === 102) penalty = '+2'

    return {
      id: `mock-${i + 1}`,
      n: i + 1,
      timeMs: Math.round(seconds * 100) * 10,
      penalty,
      scramble: generateScramble(20, random),
      date: new Date(end - span + progress * span).toISOString(),
    }
  })
}

export const mockSolves: Solve[] = buildMockSolves()

export const mockProfile: Profile = {
  name: 'Guest Cuber',
  handle: 'guest',
  location: 'Local session',
  since: '2026-09-02',
  mainEvent: '3×3×3',
}
