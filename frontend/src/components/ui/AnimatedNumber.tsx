import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

interface Props {
  value: number | null
  format: (value: number | null) => string
  duration?: number
  className?: string
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Counts up from 0 on mount, and eases between values when they change. */
export function AnimatedNumber({ value, format, duration = 1100, className }: Props) {
  const reduced = useReducedMotion()
  const animatable = value !== null && Number.isFinite(value)
  const [shown, setShown] = useState<number | null>(animatable && !reduced ? 0 : value)
  const from = useRef(animatable && !reduced ? 0 : value)

  useEffect(() => {
    if (!animatable || reduced) {
      setShown(value)
      from.current = value
      return
    }
    const start = performance.now()
    const origin = from.current !== null && Number.isFinite(from.current) ? from.current : 0
    let frame = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const current = origin + (value - origin) * easeOutExpo(p)
      setShown(current)
      from.current = current
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, animatable, reduced, duration])

  return (
    <span className={className}>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
