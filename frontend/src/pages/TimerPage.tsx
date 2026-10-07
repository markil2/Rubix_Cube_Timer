import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Page } from '../components/layout/Page'
import { TimerDisplay } from '../components/timer/TimerDisplay'
import { ScrambleLine } from '../components/timer/ScrambleLine'
import { ConnectionStatus } from '../components/ui/ConnectionStatus'
import { Stat } from '../components/ui/Stat'
import { useSolves } from '../data/SolvesProvider'
import { useDevice } from '../input/DeviceProvider'
import { effectiveMs, formatMs, formatSolve, padSolveNumber } from '../lib/format'
import { generateScramble } from '../lib/scramble'
import { INSPECTION_DNF_MS, INSPECTION_MS, inspectionPenalty, type Phase } from '../timer/timerMachine'
import { useTimer, type CompletedSolve } from '../timer/useTimer'
import styles from './TimerPage.module.css'

const FOCUS_PHASES: Phase[] = ['holding', 'ready', 'running']

const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

export function TimerPage() {
  const { solves, stats, addSolve } = useSolves()
  const device = useDevice()
  const [scramble, setScramble] = useState(() => generateScramble())
  const [lastResult, setLastResult] = useState<{ n: number; record: boolean } | null>(null)
  const [touch] = useState(isTouch)

  const scrambleRef = useRef(scramble)
  scrambleRef.current = scramble
  const bestRef = useRef(stats.best)
  bestRef.current = stats.best

  const handleComplete = useCallback(
    async ({ timeMs, penalty }: CompletedSolve) => {
      const best = bestRef.current
      const time = effectiveMs({ timeMs, penalty })
      const record = Number.isFinite(time) && (!best || time < effectiveMs(best))
      const saved = await addSolve({ timeMs, penalty, scramble: scrambleRef.current })
      setLastResult({ n: saved.n, record })
      setScramble(generateScramble())
    },
    [addSolve],
  )

  const { state, now, send } = useTimer(handleComplete)
  const { phase } = state

  // Focus mode: chrome steps back while the cube is in hand.
  useEffect(() => {
    const root = document.documentElement
    if (FOCUS_PHASES.includes(phase)) root.dataset.focus = 'true'
    else delete root.dataset.focus
    return () => {
      delete root.dataset.focus
    }
  }, [phase])

  // Touch: the whole stage behaves like the spacebar.
  const pointerHandlers = touch
    ? {
        onPointerDown: (e: PointerEvent) => {
          if ((e.target as HTMLElement).closest('a, button')) return
          send({ type: 'press' })
        },
        onPointerUp: () => send({ type: 'release' }),
        onPointerCancel: () => send({ type: 'cancel' }),
      }
    : {}

  const latest = solves[solves.length - 1]
  const nextNumber = (latest?.n ?? 0) + 1
  const inspectionElapsed = state.inspectionStartedAt === null ? 0 : now - state.inspectionStartedAt

  let value: string
  let revealKey: string
  switch (phase) {
    case 'inspecting':
    case 'holding':
    case 'ready': {
      const penalty = inspectionPenalty(inspectionElapsed)
      value =
        penalty === 'DNF' ? 'DNF' : penalty === '+2' ? '+2' : String(Math.ceil((INSPECTION_MS - inspectionElapsed) / 1000))
      revealKey = `inspect-${state.inspectionStartedAt}`
      break
    }
    case 'running':
      value = formatMs(state.startedAt === null ? 0 : now - state.startedAt)
      revealKey = `run-${state.startedAt}`
      break
    case 'stopped':
      value = formatSolve({ timeMs: state.resultMs ?? 0, penalty: state.penalty })
      revealKey = `stop-${state.completed}`
      break
    default:
      value = latest ? formatSolve(latest) : '0.00'
      revealKey = 'idle'
  }

  const record = phase === 'stopped' && !!lastResult?.record
  const inspectionLeft = Math.max(0, INSPECTION_MS - inspectionElapsed)

  const stateLabel: Record<Phase, string> = {
    idle: latest ? `Last solve · #${padSolveNumber(latest.n)}` : 'Ready',
    inspecting: inspectionElapsed > INSPECTION_MS ? 'Over inspection' : 'Inspection',
    holding: 'Hold',
    ready: 'Go',
    running: 'Solving',
    stopped: record ? 'New personal best' : `Solve #${padSolveNumber(lastResult?.n ?? latest?.n ?? 0)} · Saved`,
  }

  const action = touch ? 'Tap' : 'Space'
  const hint: Record<Phase, string> = {
    idle: `${action} — start inspection`,
    inspecting: touch ? 'Hold to get ready' : 'Hold space to get ready',
    holding: 'Keep holding',
    ready: 'Release to start',
    running: touch ? 'Tap to stop' : 'Any key to stop',
    stopped: `${action} — next solve · Esc — reset`,
  }

  return (
    <Page title="Timer" className={styles.page}>
      <div className={styles.stage} data-phase={phase} {...pointerHandlers}>
        <div className={`${styles.folios} focus-fade`}>
          <div className={styles.solveNo}>
            <span className="label">Solve</span>
            <span className={`display ${styles.solveNumber}`}>{padSolveNumber(nextNumber)}</span>
          </div>
          <span className={`label ${styles.event}`}>3×3×3 · Session 01</span>
          <ConnectionStatus status={device.status} detail={device.activeInput === 'keyboard' ? 'Keyboard mode' : undefined} />
        </div>

        <section className={styles.center} aria-label="Timer">
          <div className={styles.timerCol}>
            <p className={styles.state} data-phase={phase} data-record={record || undefined}>
              <span className={styles.stateDot} aria-hidden="true" />
              {stateLabel[phase]}
              {phase === 'inspecting' && inspectionElapsed <= INSPECTION_MS && (
                <span className={styles.inspectionBar} aria-hidden="true">
                  <span style={{ transform: `scaleX(${inspectionLeft / INSPECTION_MS})` }} />
                </span>
              )}
            </p>
            <TimerDisplay phase={phase} value={value} revealKey={revealKey} record={record} />
            <p className={styles.hint} aria-live="polite">
              {hint[phase]}
            </p>
            {inspectionElapsed > INSPECTION_DNF_MS && phase !== 'running' && phase !== 'stopped' && (
              <span className="sr-only">Inspection exceeded 17 seconds; this solve will be a DNF.</span>
            )}
          </div>

          <dl className={`${styles.stats} focus-fade`}>
            <Stat label="Personal best" value={stats.best ? effectiveMs(stats.best) : null} size="md" accent />
            <Stat label="Ao5" note="avg of 5" value={stats.ao5} size="sm" />
            <Stat label="Ao12" note="avg of 12" value={stats.ao12} size="sm" />
          </dl>
        </section>

        <footer className={styles.scrambleBar}>
          <div className={styles.scrambleMeta}>
            <span className="label">Scramble</span>
            <span className={`label ${styles.moveCount}`}>{scramble.split(' ').length} moves</span>
          </div>
          <ScrambleLine scramble={scramble} dim={FOCUS_PHASES.includes(phase)} />
        </footer>
      </div>
    </Page>
  )
}
