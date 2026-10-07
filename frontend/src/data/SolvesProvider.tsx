import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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
  /** Adds the solve to history immediately, then saves it to the backend. */
  addSolve: (input: NewSolve) => Solve
}

const SolvesContext = createContext<SolvesContextValue | null>(null)

export function SolvesProvider({ children }: { children: ReactNode }) {
  const [solves, setSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.getSolves().then((data) => {
      if (cancelled) return
      setSolves(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setSync = (id: string, sync: Solve['sync']) =>
    setSolves((prev) => prev.map((s) => (s.id === id ? { ...s, sync } : s)))

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
      api
        .saveSolve(input)
        .then(() => setSync(solve.id, 'synced'))
        .catch((e) => {
          console.warn('[api] solve kept locally, not synced:', e instanceof Error ? e.message : e)
          setSync(solve.id, 'failed')
        })
      return solve
    },
    [solves],
  )

  const stats = useMemo(() => summarize(solves), [solves])
  const precision: Precision = useMemo(() => (solves.some((s) => s.source === 'arduino') ? 3 : 2), [solves])
  const value = useMemo(
    () => ({ solves, stats, precision, loading, addSolve }),
    [solves, stats, precision, loading, addSolve],
  )

  return <SolvesContext.Provider value={value}>{children}</SolvesContext.Provider>
}

export function useSolves(): SolvesContextValue {
  const ctx = useContext(SolvesContext)
  if (!ctx) throw new Error('useSolves must be used inside <SolvesProvider>')
  return ctx
}
