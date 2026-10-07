import { motion, useReducedMotion } from 'motion/react'
import { Page } from '../components/layout/Page'
import { Marquee } from '../components/ui/Marquee'
import { useSolves } from '../data/SolvesProvider'
import { formatSolve, padSolveNumber } from '../lib/format'
import styles from './HistoryPage.module.css'

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' })

export function HistoryPage() {
  const { solves, stats, loading } = useSolves()
  const reduced = useReducedMotion()
  const rows = [...solves].reverse()

  return (
    <Page title="History">
      <header className={styles.hero}>
        <Marquee items={['History', 'Every solve', 'History', 'On record']} duration={46} className={styles.marquee} />
        <div className={styles.heroMeta}>
          <span className="label">{stats.count} solves logged</span>
          <span className="label">Newest first</span>
        </div>
      </header>

      <div className={styles.columns} aria-hidden="true">
        <span className="label">No.</span>
        <span className="label">Time</span>
        <span className="label">Scramble</span>
        <span className="label">Date</span>
      </div>

      {loading ? (
        <p className={`label ${styles.empty}`}>Loading solves…</p>
      ) : rows.length === 0 ? (
        <p className={`label ${styles.empty}`}>No solves yet. Your first one lands here.</p>
      ) : (
        <ol className={styles.list}>
          {rows.map((solve, i) => {
            const isBest = stats.best?.id === solve.id
            return (
              <motion.li
                key={solve.id}
                className={styles.row}
                data-best={isBest || undefined}
                data-dnf={solve.penalty === 'DNF' || undefined}
                initial={reduced || i > 14 ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className={`display ${styles.number}`}>{padSolveNumber(solve.n)}</span>
                <span className={`display ${styles.time}`}>
                  {formatSolve(solve)}
                  {isBest && <span className={styles.badge}>PB</span>}
                </span>
                <span className={styles.scramble}>{solve.scramble}</span>
                <span className={styles.date}>
                  <time dateTime={solve.date}>{dateFormat.format(new Date(solve.date))}</time>
                  {solve.sync === 'failed' && <span className={styles.unsynced}>Not synced</span>}
                  {solve.sync === 'saving' && <span className={styles.saving}>Saving…</span>}
                </span>
              </motion.li>
            )
          })}
        </ol>
      )}
    </Page>
  )
}
