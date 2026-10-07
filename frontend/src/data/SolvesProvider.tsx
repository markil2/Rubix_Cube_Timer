import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as api from './api'
import type { NewSolve, Solve } from './types'
import { summarize, type StatsSummary } from '../lib/stats'
import type { Precision } from '../lib/format'

interface SolvesContextValue {
  solves: Solve[]
  stats: StatsSummary
  /** 3 once any Arduino (millisecond) solve is in the history, so stats match. */
  precision: Precision
  loading: boolean
  /** Set when the history couldn't be loaded from the backend. */
  loadError: string | null
  /** Running on built-in demo data (VITE_USE_MOCK=true). */
  demo: boolean
  reload: () => void
  /** Adds the solve to history immediately, then saves it to the backend. */
  addSolve: (input: NewSolve) => Solve
}

const SolvesContext = createContext<SolvesContextValue | null>(null)

export function SolvesProvider({ children }: { children: ReactNode }) {
  const [solves, setSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const solvesRef = useRef(solves)
  solvesRef.current = solves

  /** POST one solve and record the outcome on it. */
  const sync = useCallback((solve: Solve) => {
    setSolves((prev) => prev.map((s) => (s.id === solve.id ? { ...s, sync: 'saving' } : s)))
    api
      .saveSolve({ timeMs: solve.timeMs, penalty: solve.penalty, scramble: solve.scramble, source: solve.source ?? 'keyboard' })
      .then((saved) =>
        setSolves((prev) => prev.map((s) => (s.id === solve.id ? { ...s, date: saved.createdAt, sync: 'synced' } : s))),
      )
      .catch((e) => {
        console.warn('[api] solve kept locally, not synced:', e instanceof Error ? e.message : e)
        setSolves((prev) => prev.map((s) => (s.id === solve.id ? { ...s, sync: 'failed' } : s)))
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getSolves()
      .then((data) => {
        if (cancelled) return
        // Keep solves recorded while the backend was unreachable, and send them now.
        const pending = solvesRef.current
          .filter((s) => s.sync === 'failed' || s.sync === 'saving')
          .map((s, i) => ({ ...s, n: data.length + i + 1 }))
        setSolves([...data, ...pending])
        setLoadError(null)
        pending.filter((s) => s.sync === 'failed').forEach(sync)
      })
      .catch((e) => {
        if (cancelled) return
        console.warn('[api] could not load solves:', e instanceof Error ? e.message : e)
        setLoadError('Couldn’t reach the server. New solves are kept on this page until it’s back.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [attempt, sync])

  const reload = useCallback(() => setAttempt((a) => a + 1), [])

  const addSolve = useCallback(
    (input: NewSolve) => {
      const solve: Solve = {
        ...input,
        id: `local-${Date.now()}`,
        n: (solves[solves.length - 1]?.n ?? 0) + 1,
        date: new Date().toISOString(),
        sync: 'saving',
      }
      setSolves((prev) => [...prev, solve])
      sync(solve)
      return solve
    },
    [solves, sync],
  )

  const stats = useMemo(() => summarize(solves), [solves])
  const precision: Precision = useMemo(() => (solves.some((s) => s.source === 'arduino') ? 3 : 2), [solves])
  const value = useMemo(
    () => ({ solves, stats, precision, loading, loadError, demo: api.USE_MOCK, reload, addSolve }),
    [solves, stats, precision, loading, loadError, reload, addSolve],
  )

  return <SolvesContext.Provider value={value}>{children}</SolvesContext.Provider>
}

export function useSolves(): SolvesContextValue {
  const ctx = useContext(SolvesContext)
  if (!ctx) throw new Error('useSolves must be used inside <SolvesProvider>')
  return ctx
}
