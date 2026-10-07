import { mockProfile, mockSolves } from './mock'
import type { NewSolve, Penalty, Profile, Solve } from './types'

/**
 * Data access for the UI. Components only talk to this module.
 *
 * Backend contract (backend/API.md):
 *   POST /api/solves   save a finished solve
 *   GET  /api/solves   newest first, paginated (limit ≤ 100)
 *
 * In dev, Vite proxies /api to the backend (vite.config.ts). In production,
 * set VITE_API_URL to the backend's origin. Set VITE_USE_MOCK=true to run on
 * the built-in demo data with no backend.
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const PAGE_SIZE = 100

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

/** A solve as the backend returns it. */
interface ApiSolve {
  id: string
  time: number
  scramble: string | null
  penalty: '+2' | 'DNF' | null
  createdAt: string
}

export function toSolvePayload(solve: NewSolve): SolvePayload {
  return {
    time: solve.timeMs / 1000,
    scramble: solve.scramble,
    penalty: solve.penalty === 'none' ? null : solve.penalty,
  }
}

/**
 * The backend doesn't record the input source. Keyboard times are stored in
 * hundredths, so a time with a thousandths digit came from the Arduino.
 */
function fromApiSolve(solve: ApiSolve, n: number): Solve {
  const timeMs = Math.round(solve.time * 1000)
  return {
    id: solve.id,
    n,
    timeMs,
    penalty: (solve.penalty ?? 'none') as Penalty,
    scramble: solve.scramble ?? '',
    date: solve.createdAt,
    source: timeMs % 10 === 0 ? 'keyboard' : 'arduino',
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, init)
  } catch {
    throw new ApiError('Backend unreachable')
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      if (body.error?.message) message = body.error.message
    } catch {
      // Not a JSON error body (e.g. the dev proxy's 502 when the backend is down).
    }
    throw new ApiError(message, res.status)
  }
  return (await res.json()) as T
}

/** Persist a finished solve. Resolves with the stored solve; throws ApiError on failure. */
export async function saveSolve(solve: NewSolve): Promise<{ id: string; createdAt: string }> {
  if (USE_MOCK) throw new ApiError('Demo mode: solves are not saved')
  return request<ApiSolve>('/api/solves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSolvePayload(solve)),
  })
}

/** The whole history, oldest first, numbered 1…n. */
export async function getSolves(): Promise<Solve[]> {
  if (USE_MOCK) return [...mockSolves]
  const newestFirst: ApiSolve[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await request<ApiSolve[]>(`/api/solves?limit=${PAGE_SIZE}&offset=${offset}`)
    newestFirst.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return newestFirst.reverse().map((s, i) => fromApiSolve(s, i + 1))
}

/** No profile endpoint yet; this stays local. */
export async function getProfile(): Promise<Profile> {
  return mockProfile
}
