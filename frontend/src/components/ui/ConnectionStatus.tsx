import type { ConnectionStatus as Status } from '../../input/types'
import styles from './ConnectionStatus.module.css'

const COPY: Record<Status, string> = {
  connected: 'Arduino connected',
  connecting: 'Connecting',
  disconnected: 'Arduino disconnected',
}

export function ConnectionStatus({ status, detail }: { status: Status; detail?: string }) {
  return (
    <div className={styles.status} data-status={status} role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.text}>
        <span>{COPY[status]}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
    </div>
  )
}
