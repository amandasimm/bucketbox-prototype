import { useEffect, useState } from 'react'

const INERT_MESSAGE = 'Not part of this prototype'

// A control that looks real but does nothing (BUILD-LOG, 2026-10-28).
// Hovering shows its name (icon-only controls); clicking shows a gentle note for a moment instead of a pop-up.
export default function InertButton({ label, className = '', tooltipAlign, nameOnHover = true, children }) {
  const [noteVisible, setNoteVisible] = useState(false)

  useEffect(() => {
    if (!noteVisible) return
    const timer = setTimeout(() => setNoteVisible(false), 2500)
    return () => clearTimeout(timer)
  }, [noteVisible])

  return (
    <button
      type="button"
      className={`has-tooltip ${className}`}
      aria-label={label}
      onClick={() => setNoteVisible(true)}
      onMouseLeave={() => setNoteVisible(false)}
    >
      {children}
      <span
        className={`tooltip ${tooltipAlign ? `align-${tooltipAlign}` : ''} ${noteVisible ? 'showing' : ''} ${nameOnHover ? '' : 'no-hover'}`}
        role="status"
      >
        {noteVisible ? INERT_MESSAGE : nameOnHover ? label : ''}
      </span>
    </button>
  )
}
