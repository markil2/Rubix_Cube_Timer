import type { CSSProperties } from 'react'
import styles from './Marquee.module.css'

interface Props {
  items: string[]
  /** Seconds for one full loop. */
  duration?: number
  reverse?: boolean
  outline?: boolean
  className?: string
}

/** Oversized repeated type used as texture. Decorative — hidden from assistive tech. */
export function Marquee({ items, duration = 40, reverse = false, outline = true, className = '' }: Props) {
  const run = (
    <span className={styles.run}>
      {items.map((item, i) => (
        <span key={i} className={styles.item}>
          {item}
          <span className={styles.sep} />
        </span>
      ))}
    </span>
  )
  return (
    <div
      className={`${styles.marquee} ${outline ? styles.outline : ''} ${className}`}
      style={{ '--duration': `${duration}s`, '--direction': reverse ? 'reverse' : 'normal' } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.track}>
        {run}
        {run}
      </div>
    </div>
  )
}
