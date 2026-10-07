import styles from './CubeMark.module.css'

/** 3×3 face with one accent sticker — the RubTimer mark. */
export function CubeMark({ className = '' }: { className?: string }) {
  return (
    <span className={`${styles.mark} ${className}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={i === 0 ? styles.accent : undefined} />
      ))}
    </span>
  )
}
