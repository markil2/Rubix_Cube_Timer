import { Link, NavLink } from 'react-router-dom'
import { CubeMark } from '../ui/CubeMark'
import styles from './Header.module.css'

export const NAV = [
  { to: '/', label: 'Timer' },
  { to: '/history', label: 'History' },
  { to: '/stats', label: 'Stats' },
  { to: '/profile', label: 'Profile' },
] as const

export function Header() {
  return (
    <header className={`${styles.header} focus-fade`}>
      <Link to="/" className={styles.wordmark} aria-label="RubTimer home">
        <CubeMark className={styles.mark} />
        <span>RubTimer</span>
      </Link>
      <nav aria-label="Primary">
        <ul className={styles.nav}>
          {NAV.map((item, i) => (
            <li key={item.to}>
              <NavLink to={item.to} end className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.text}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
