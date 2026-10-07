import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createKeyboardSource } from '../input/keyboardSource'
import type { TimerInput } from '../input/types'
import type { Penalty } from '../data/types'
import { initialTimerState, timerReducer, type TimerState } from './timerMachine'

const LIVE_PHASES = new Set(['inspecting', 'holding', 'running'])

export interface CompletedSolve {
  timeMs: number
  penalty: Penalty
}

/**
 * Owns the timer state machine, feeds it from the active input source,
 * and runs a rAF clock while something is counting.
 */
export function useTimer(onComplete: (solve: CompletedSolve) => void) {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState)
  const [now, setNow] = useState(() => performance.now())
  const stateRef = useRef<TimerState>(state)
  stateRef.current = state

  const send = useMemo(() => (input: TimerInput) => dispatch({ ...input, at: performance.now() }), [])

  // Input source. Swapping this for createArduinoSource(...) is the only change Web Serial needs.
  useEffect(() => {
    const source = createKeyboardSource(() => stateRef.current.phase === 'running')
    return source.connect(send)
  }, [send])

  // Clock: only runs while there is something to count.
  useEffect(() => {
    if (!LIVE_PHASES.has(state.phase)) return
    let frame = 0
    const loop = () => {
      const t = performance.now()
      setNow(t)
      dispatch({ type: 'tick', at: t })
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [state.phase])

  // Report each finished solve exactly once.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const reported = useRef(0)
  useEffect(() => {
    if (state.completed > reported.current && state.resultMs !== null) {
      reported.current = state.completed
      onCompleteRef.current({ timeMs: state.resultMs, penalty: state.penalty })
    }
  }, [state.completed, state.resultMs, state.penalty])

  return { state, now, send }
}
