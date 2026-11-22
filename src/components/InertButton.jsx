import { useEffect, useState } from 'react'

const INERT_MESSAGE = 'Not part of this prototype'

// A control that looks real but does nothing (BUILD-LOG, 2026-10-28).
// Hovering shows its name (icon-only controls); clicking shows a gentle note for a moment instead of a pop-up.
// onShiftActivate: Shift-click (or Shift+Enter) does something real instead, for the facilitator
// menu on the account icon (brief item 6). A plain click still shows the note.
export default function InertButton({ label, className = '', tooltipAlign, nameOnHover = true, onShiftActivate, children }) {
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
      onClick={(event) => {
        if (event.shiftKey && onShiftActivate) onShiftActivate()
        else setNoteVisible(true)
      }}
      onKeyDown={(event) => {
        if (event.shiftKey && onShiftActivate && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onShiftActivate()
        }
      }}
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
