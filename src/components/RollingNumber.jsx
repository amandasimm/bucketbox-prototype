import { useEffect, useState } from 'react'

// A number that changes like a wipe (BUILD-LOG, 2026-11-13): the old number slides out and the
// new one slides in behind it, upward when it grows and downward when it shrinks. Used for the
// bucket counts only: the unsorted count and Declutter's position change too often for it.
export default function RollingNumber({ value, className = '' }) {
  const [current, setCurrent] = useState(value)
  const [previous, setPrevious] = useState(null)
  if (value !== current) {
    setPrevious(current)
    setCurrent(value)
  }
  // A fallback, in case the browser never reports the end of the slide
  useEffect(() => {
    if (previous === null) return undefined
    const timer = setTimeout(() => setPrevious(null), 400)
    return () => clearTimeout(timer)
  }, [previous, current])
  const way = previous !== null && value < previous ? 'is-down' : 'is-up'
  return (
    <span className={`rolling-number ${className}`}>
      <span key={current} className={previous === null ? '' : `roll-in ${way}`}>
        {current}
      </span>
      {previous !== null && (
        <span key={`was-${current}`} className={`roll-out ${way}`} aria-hidden="true" onAnimationEnd={() => setPrevious(null)}>
          {previous}
        </span>
      )}
    </span>
  )
}
