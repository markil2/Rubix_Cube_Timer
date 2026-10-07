import { AnimatedNumber } from './AnimatedNumber'
import { formatStat } from '../../lib/format'
import styles from './Stat.module.css'

interface Props {
  label: string
  value: number | null
  /** Override formatting, e.g. plain integers for counts. */
  format?: (value: number | null) => string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  accent?: boolean
  note?: string
}

export function Stat({ label, value, format = formatStat, size = 'md', accent = false, note }: Props) {
  return (
    <div className={styles.stat} data-size={size}>
      <dt className={styles.label}>
        {label}
        {note && <span className={styles.note}>{note}</span>}
      </dt>
      <dd className={`display ${styles.value} ${accent ? styles.accent : ''}`}>
        <AnimatedNumber value={value} format={format} />
      </dd>
    </div>
  )
}
