import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from './api'
import type { NewSolve, Solve } from './types'
import { summarize, type StatsSummary } from '../lib/stats'

interface SolvesContextValue {
  solves: Solve[]
  stats: StatsSummary
  loading: boolean
  addSolve: (input: NewSolve) => Promise<Solve>
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

  const addSolve = useCallback(async (input: NewSolve) => {
    const saved = await api.saveSolve(input)
    setSolves((prev) => [...prev, saved])
    return saved
  }, [])

  const stats = useMemo(() => summarize(solves), [solves])
  const value = useMemo(() => ({ solves, stats, loading, addSolve }), [solves, stats, loading, addSolve])

  return <SolvesContext.Provider value={value}>{children}</SolvesContext.Provider>
}

export function useSolves(): SolvesContextValue {
  const ctx = useContext(SolvesContext)
  if (!ctx) throw new Error('useSolves must be used inside <SolvesProvider>')
  return ctx
}
