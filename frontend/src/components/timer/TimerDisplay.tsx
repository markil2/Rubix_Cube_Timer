import type { Phase } from '../../timer/timerMachine'
import styles from './TimerDisplay.module.css'

interface Props {
  phase: Phase
  /** Text to render, e.g. "12.47", "1:02.31", "15", "+2", "DNF". */
  value: string
  /** Changes when the digits should replay their entrance. */
  revealKey: string
  /** Mark the result as a new personal best. */
  record?: boolean
}

/** The centerpiece: giant tabular digits whose color carries the timer state. */
export function TimerDisplay({ phase, value, revealKey, record = false }: Props) {
  const dot = value.lastIndexOf('.')
  const whole = dot === -1 ? value : value.slice(0, dot)
  const fraction = dot === -1 ? '' : value.slice(dot)
  // 12.47 → full size; 12.347 / 1:02.31 → step down so the digits never overflow.
  const length = value.length >= 7 ? 'long' : value.length === 6 ? 'mid' : undefined

  return (
    <div className={styles.wrap} data-phase={phase} data-record={record || undefined} data-length={length}>
      <div key={revealKey} className={`display ${styles.digits}`} aria-live="off">
        <span>{whole}</span>
        {fraction && <span className={styles.fraction}>{fraction}</span>}
      </div>
    </div>
  )
}
