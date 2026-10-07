import { mockProfile, mockSolves } from './mock'
import type { NewSolve, Profile, Solve } from './types'

/**
 * Data access for the UI. Components only talk to this module.
 *
 * - saveSolve() is real: POST /api/solves. In dev, Vite proxies /api to the
 *   backend (see vite.config.ts). Set VITE_API_URL to call a backend on
 *   another origin in production.
 * - getSolves() and getProfile() still return mock data until the backend
 *   exposes GET endpoints for them.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

/** Request body for POST /api/solves. */
export interface SolvePayload {
  /** Seconds, as measured (Arduino precision preserved, e.g. 12.347). */
  time: number
  scramble: string
  penalty: '+2' | 'DNF' | null
}

export function toSolvePayload(solve: NewSolve): SolvePayload {
  return {
    time: solve.timeMs / 1000,
    scramble: solve.scramble,
    penalty: solve.penalty === 'none' ? null : solve.penalty,
  }
}

/** Persist a finished solve. Resolves with whatever the backend returns; throws ApiError on failure. */
export async function saveSolve(solve: NewSolve): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/solves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSolvePayload(solve)),
    })
  } catch {
    throw new ApiError('Backend unreachable')
  }
  if (!res.ok) throw new ApiError(`Save failed (${res.status})`, res.status)
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : null
}

export async function getSolves(): Promise<Solve[]> {
  return [...mockSolves]
}

export async function getProfile(): Promise<Profile> {
  return mockProfile
}
