import type { MouseEvent } from 'react'
import type { ConnectionStatus as Status } from '../../input/types'
import styles from './ConnectionStatus.module.css'

const COPY: Record<Status, string> = {
  connected: 'Arduino connected',
  connecting: 'Connecting…',
  disconnected: 'Arduino disconnected',
}

interface Props {
  status: Status
  error?: string | null
  onConnect?: () => void
  onDisconnect?: () => void
}

/** Folio-sized Arduino indicator that doubles as the connect / disconnect control. */
export function ConnectionStatus({ status, error, onConnect, onDisconnect }: Props) {
  const action = status === 'connected' ? 'Disconnect' : status === 'disconnected' ? 'Connect' : null
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Drop focus so the spacebar keeps driving the timer, not this button.
    e.currentTarget.blur()
    if (status === 'connected') onDisconnect?.()
    else if (status === 'disconnected') onConnect?.()
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.status}
        data-status={status}
        onClick={onClick}
        disabled={status === 'connecting'}
        aria-label={`${COPY[status]}${action ? `. ${action} Arduino` : ''}`}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.text}>
          <span>{COPY[status]}</span>
          {action && <span className={styles.action}>{action}</span>}
        </span>
      </button>
      <p className={styles.error} role="status" aria-live="polite">
        {error}
      </p>
    </div>
  )
}
