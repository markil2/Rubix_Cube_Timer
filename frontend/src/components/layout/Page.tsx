import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import styles from './Page.module.css'

const SHUTTER: Variants = {
  enter: { clipPath: 'inset(0% 0% 0% 0%)' },
  idle: {
    clipPath: 'inset(0% 0% 100% 0%)',
    transition: { duration: 0.62, delay: 0.12, ease: [0.65, 0, 0.35, 1] },
  },
  exit: {
    clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'],
    transition: { duration: 0.42, ease: [0.65, 0, 0.35, 1] },
  },
}

const WORD: Variants = {
  enter: { y: '0%' },
  idle: { y: '-30%', transition: { duration: 0.74, delay: 0.12, ease: [0.65, 0, 0.35, 1] } },
  exit: { opacity: 0, transition: { duration: 0 } },
}

/**
 * Route wrapper. Each page enters behind an ink shutter carrying its name
 * in giant type, and leaves as the shutter rises back up from below.
 */
export function Page({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <motion.main className={`${styles.page} ${className}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {children}
      </motion.main>
    )
  }

  return (
    <motion.main className={`${styles.page} ${className}`} initial="enter" animate="idle" exit="exit">
      {children}
      <motion.div className={styles.shutter} variants={SHUTTER} aria-hidden="true">
        <motion.span className={styles.word} variants={WORD}>
          {title}
        </motion.span>
      </motion.div>
    </motion.main>
  )
}
