import { mockProfile, mockSolves } from './mock'
import type { NewSolve, Profile, Solve } from './types'

/**
 * Data access for the UI. Everything is async so the mock implementation
 * can be swapped for real fetch() calls to the backend without touching
 * components — e.g. getSolves() → GET /api/solves.
 */

let solves: Solve[] = [...mockSolves]

const latency = () => new Promise((resolve) => setTimeout(resolve, 0))

export async function getSolves(): Promise<Solve[]> {
  await latency()
  return [...solves]
}

export async function saveSolve(input: NewSolve): Promise<Solve> {
  await latency()
  const solve: Solve = {
    ...input,
    id: `local-${Date.now()}`,
    n: (solves[solves.length - 1]?.n ?? 0) + 1,
    date: new Date().toISOString(),
  }
  solves = [...solves, solve]
  return solve
}

export async function getProfile(): Promise<Profile> {
  await latency()
  return mockProfile
}
