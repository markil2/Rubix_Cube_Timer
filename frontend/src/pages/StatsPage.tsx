import type { CSSProperties } from 'react'
import { Page } from '../components/layout/Page'
import { Marquee } from '../components/ui/Marquee'
import { Stat } from '../components/ui/Stat'
import { useSolves } from '../data/SolvesProvider'
import { effectiveMs, formatSolve, padSolveNumber } from '../lib/format'
import styles from './StatsPage.module.css'

const count = (v: number | null) => (v === null ? '—' : Math.round(v).toString())
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })

export function StatsPage() {
  const { solves, stats } = useSolves()
  const best = stats.best
  const recent = solves.slice(-60)
  const finite = recent.map(effectiveMs).filter(Number.isFinite)
  const min = Math.min(...finite)
  const max = Math.max(...finite)

  return (
    <Page title="Stats">
      <section className={styles.hero}>
        <div className={styles.heroLead}>
          <span className="label">Personal best · single</span>
          {best && (
            <span className={`label ${styles.heroNote}`}>
              Solve #{padSolveNumber(best.n)} · {dateFormat.format(new Date(best.date))}
            </span>
          )}
        </div>
        <dl>
          <Stat label="Personal best" value={best ? effectiveMs(best) : null} size="xl" accent />
        </dl>
      </section>

      <Marquee
        items={solves.slice(-12).map((s) => formatSolve(s))}
        duration={60}
        reverse
        className={styles.band}
      />

      <dl className={styles.grid}>
        <div className={styles.cell}>
          <Stat label="Average" note="all solves" value={stats.mean} size="lg" />
        </div>
        <div className={styles.cell}>
          <Stat label="Solves" value={stats.count} format={count} size="lg" />
        </div>
        <div className={styles.cell}>
          <Stat label="Best of 5" note="ao5" value={stats.bestAo5} size="lg" />
        </div>
        <div className={styles.cell}>
          <Stat label="Best of 12" note="ao12" value={stats.bestAo12} size="lg" />
        </div>
        <div className={styles.cell}>
          <Stat label="Current ao5" value={stats.ao5} size="md" />
        </div>
        <div className={styles.cell}>
          <Stat label="Current ao12" value={stats.ao12} size="md" />
        </div>
      </dl>

      {finite.length > 1 && (
        <section className={styles.trend} aria-label={`Last ${recent.length} solves`}>
          <div className={styles.trendHead}>
            <span className="label">Last {recent.length} solves</span>
            <span className={`label ${styles.trendRange}`}>
              {formatSolve({ timeMs: min, penalty: 'none' })} — {formatSolve({ timeMs: max, penalty: 'none' })}
            </span>
          </div>
          <ol className={styles.bars}>
            {recent.map((s) => {
              const t = effectiveMs(s)
              const dnf = !Number.isFinite(t)
              const h = dnf ? 1 : 0.18 + (0.82 * (t - min)) / (max - min || 1)
              return (
                <li
                  key={s.id}
                  className={styles.bar}
                  data-best={best?.id === s.id || undefined}
                  data-dnf={dnf || undefined}
                  style={{ '--h': h } as CSSProperties}
                  title={`#${padSolveNumber(s.n)} · ${formatSolve(s)}`}
                />
              )
            })}
          </ol>
          <div className={styles.trendFoot}>
            <span className="label">Older</span>
            <span className="label">Shorter bar = faster solve</span>
            <span className="label">Newest</span>
          </div>
        </section>
      )}
    </Page>
  )
}
