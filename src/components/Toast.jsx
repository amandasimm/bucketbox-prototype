import { useEffect, useState } from 'react'

const VISIBLE_FOR_MS = 5000
// A toast with a button ("Archive instead", "Pause rule") stays longer, so there's time to read
// it and decide (Amanda, 2026-11-22; it used to stay until the next toast)
const WITH_BUTTON_MS = 15000

// A short confirmation after each action (PRD F8). It fades after a few seconds (15 with a
// button), pauses while the pointer is over it or keyboard focus is in it, and is read out by
// screen readers.
export default function Toast({ toast, onAction }) {
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (toast) setVisible(true)
  }, [toast])

  useEffect(() => {
    if (!visible || paused) return
    const timer = setTimeout(() => setVisible(false), toast?.action ? WITH_BUTTON_MS : VISIBLE_FOR_MS)
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
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <span className="toast-text">
            {toast.message}
            {toast.tip && <span className="toast-tip">{toast.tip}</span>}
          </span>
          {toast.action && (
            <button type="button" className="toast-action" onClick={() => onAction(toast.action)}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
