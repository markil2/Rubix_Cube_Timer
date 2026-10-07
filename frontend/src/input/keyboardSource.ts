import type { TimerInput, TimerInputSource } from './types'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Spacebar drives the timer. While a solve is running, any key stops it
 * (as on a stackmat, where either hand comes down). Escape cancels.
 */
export function createKeyboardSource(isRunning: () => boolean): TimerInputSource {
  return {
    kind: 'keyboard',
    connect(emit: (input: TimerInput) => void) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
        if (e.key === 'Escape') {
          emit({ type: 'cancel' })
          return
        }
        if (isRunning()) {
          if (e.key === 'Tab') return
          e.preventDefault()
          if (!e.repeat) emit({ type: 'press' })
          return
        }
        if (e.code !== 'Space') return
        e.preventDefault()
        if (!e.repeat) emit({ type: 'press' })
      }
      const onKeyUp = (e: KeyboardEvent) => {
        if (isTypingTarget(e.target)) return
        if (e.code === 'Space' || isRunning()) {
          e.preventDefault()
          emit({ type: 'release' })
        }
      }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      return () => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
      }
    },
  }
}
