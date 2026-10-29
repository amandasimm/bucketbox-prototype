import { useEffect, useState } from 'react'

const VISIBLE_FOR_MS = 5000

// A short confirmation after each action (PRD F8). It fades after a few seconds,
// pauses while the pointer is over it, and is read out by screen readers.
export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (toast) setVisible(true)
  }, [toast])

  useEffect(() => {
    if (!visible || paused) return
    const timer = setTimeout(() => setVisible(false), VISIBLE_FOR_MS)
    return () => clearTimeout(timer)
  }, [visible, paused, toast])

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {visible && toast && (
        <div
          key={toast.key}
          className="toast"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
