import { useEffect, useState } from 'react'
import { Page } from '../components/layout/Page'
import { getProfile } from '../data/api'
import { useSolves } from '../data/SolvesProvider'
import type { Profile } from '../data/types'
import { effectiveMs, formatStat, padSolveNumber } from '../lib/format'
import styles from './ProfilePage.module.css'

const dateFormat = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })

export function ProfilePage() {
  const { stats } = useSolves()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    getProfile().then(setProfile)
  }, [])

  const [first, ...rest] = (profile?.name ?? '—').split(' ')

  const records = [
    { event: 'Single', value: stats.best ? effectiveMs(stats.best) : null, detail: stats.best ? `#${padSolveNumber(stats.best.n)}` : '' },
    { event: 'Average of 5', value: stats.bestAo5, detail: 'rolling' },
    { event: 'Average of 12', value: stats.bestAo12, detail: 'rolling' },
  ]

  return (
    <Page title="Profile">
      <section className={styles.hero}>
        <span className="label">Cuber profile</span>
        <h1 className={`display ${styles.name}`}>
          <span>{first}</span>
          <span className={styles.outline}>{rest.join(' ')}</span>
        </h1>
      </section>

      {profile && (
        <dl className={styles.facts}>
          <div>
            <dt className="label">Handle</dt>
            <dd>@{profile.handle}</dd>
          </div>
          <div>
            <dt className="label">Main event</dt>
            <dd>{profile.mainEvent}</dd>
          </div>
          <div>
            <dt className="label">Cubing since</dt>
            <dd>{dateFormat.format(new Date(profile.since))}</dd>
          </div>
          <div>
            <dt className="label">Solves</dt>
            <dd>{stats.count}</dd>
          </div>
        </dl>
      )}

      <section className={styles.records} aria-labelledby="records-title">
        <h2 id="records-title" className="label">
          Personal records · {profile?.mainEvent ?? '3×3×3'}
        </h2>
        <ol>
          {records.map((r, i) => (
            <li key={r.event} className={styles.record}>
              <span className={styles.rank}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.event}>{r.event}</span>
              <span className={`display ${styles.recordTime}`} data-first={i === 0 || undefined}>
                {formatStat(r.value)}
              </span>
              <span className={`label ${styles.detail}`}>{r.detail}</span>
            </li>
          ))}
        </ol>
        <p className={`label ${styles.note}`}>Accounts and sync arrive with the backend. This profile is local mock data.</p>
      </section>
    </Page>
  )
}
