import styles from './ScrambleLine.module.css'

/** The scramble, set as discrete moves so it reads at a distance. */
export function ScrambleLine({ scramble, dim = false }: { scramble: string; dim?: boolean }) {
  const moves = scramble.split(' ')
  return (
    <p className={styles.scramble} data-dim={dim || undefined} aria-label={`Scramble: ${scramble}`}>
      {moves.map((move, i) => (
        <span key={`${scramble}-${i}`} className={styles.move} style={{ animationDelay: `${i * 18}ms` }}>
          {move}
        </span>
      ))}
    </p>
  )
}
