import { useEffect, useRef } from 'react'
import BulkActions from './BulkActions.jsx'
import DayNav, { dayLabel } from './DayNav.jsx'
import DeclutterIcon from './DeclutterIcon.jsx'
import EmailRow from './EmailRow.jsx'
import { newestFirst } from '../utils/dates.js'

// State-aware empty messages (PRD F6; wording is a placeholder, PRD §12 #7)
function emptyMessage(dayOffset, receivedThatDay) {
  if (dayOffset < 0) return 'You cleared this day. Nice work.'
  if (receivedThatDay === 0) return 'Nothing yet, go enjoy your day.'
  return 'Way to go! Your daily inbox is cleared right now.'
}

// The confetti's pieces: where each one flies to (across, up) and its color, from the bucket palette
const CONFETTI = [
  [-46, -30, '#8b5cf6'], [-30, -52, '#ff8d60'], [-10, -62, '#09aba0'], [12, -60, '#ff4f5e'],
  [32, -50, '#ffe594'], [48, -28, '#a6d3ff'], [-54, -4, '#72e721'], [56, -2, '#cbbcff'],
]

// A day's unsorted emails, newest first (PRD F1)
export function unsortedFor(emails, dayOffset) {
  return emails
    .filter((email) => email.dayOffset === dayOffset && email.bucketId === null && email.removedTo === null)
    .sort(newestFirst)
}

// The day's unsorted emails, with the unsorted count (PRD F1), Select all,
// and the Move / Archive / Delete buttons (PRD F7). Clicking an email opens it in the drawer (PRD F5).
export default function TodayList({ emails, buckets, dayOffset, onChangeDay, onDeclutter, selectedIds, onSelect, actions, zoneMode, openEmailId, onOpen, covered }) {
  const dayEmails = emails.filter((email) => email.dayOffset === dayOffset)
  const unsorted = unsortedFor(emails, dayOffset)
  // Days that still have unsorted emails, for the back arrow's dot and the calendar
  const daysWithUnsorted = new Set(
    emails.filter((email) => email.bucketId === null && email.removedTo === null).map((email) => email.dayOffset),
  )
  const unsortedIds = unsorted.map((email) => email.id)
  const selectedHere = selectedIds.filter((id) => unsortedIds.includes(id))

  const allSelected = unsorted.length > 0 && selectedHere.length === unsorted.length
  const someSelected = selectedHere.length > 0 && !allSelected
  const selectAllRef = useRef(null)
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  function toggle(id) {
    onSelect(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <section className="today-list" aria-labelledby="today-heading">
      {/* A date from another year is long, so Declutter may have to shrink to its icon beside it */}
      <header className={`today-header ${dayLabel(dayOffset).length > 14 ? 'has-long-date' : ''}`}>
        <DayNav dayOffset={dayOffset} onChangeDay={onChangeDay} daysWithUnsorted={daysWithUnsorted} />
        {/* Declutter (PRD F13) starts on the day being viewed */}
        <button type="button" id="declutter-button" className="bulk-button declutter-button has-tooltip" onClick={onDeclutter}>
          <DeclutterIcon size={20} />
          <span className="declutter-button-label">Declutter</span>
          <span className="new-badge" aria-hidden="true">New</span>
          <span className="tooltip align-right" aria-hidden="true">Declutter</span>
        </button>
      </header>

      {/* Select all on the left, the day's unsorted count on the right (BUILD-LOG, 2026-10-30) */}
      <div className="list-toolbar">
        {unsorted.length > 0 && (
          <label className="select-all">
            <input
              ref={selectAllRef}
              type="checkbox"
              className="email-checkbox"
              checked={allSelected}
              onChange={() => onSelect(allSelected ? [] : unsortedIds)}
            />
            {selectedHere.length > 0 ? `${selectedHere.length} selected` : 'Select all'}
          </label>
        )}
        <p className="unsorted-count">
          <span className="unsorted-number">{unsorted.length}</span> unsorted
        </p>
      </div>

      {unsorted.length > 0 ? (
        <>
          <ul className="email-list">
            {unsorted.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
                selected={selectedIds.includes(email.id)}
                isOpen={email.id === openEmailId}
                onToggleSelected={() => toggle(email.id)}
                onOpen={() => onOpen(email.id)}
              />
            ))}
          </ul>
        </>
      ) : (
        <div className={`empty-state ${dayEmails.length > 0 ? 'is-cleared' : ''}`} role="status">
          {/* A cleared day gets a small celebration: a party emoji that pops, with a little burst
              of confetti, when the pointer is over the message (BUILD-LOG, 2026-11-16) */}
          {dayEmails.length > 0 && (
            <span className="celebrate" aria-hidden="true">
              <span className="celebrate-emoji">🎉</span>
              {CONFETTI.map(([x, y, color], index) => (
                <span key={index} className="confetti" style={{ '--x': `${x}px`, '--y': `${y}px`, '--color': color, '--delay': `${index * 15}ms` }} />
              ))}
            </span>
          )}
          <p>{emptyMessage(dayOffset, dayEmails.length)}</p>
        </div>
      )}

      <BulkActions selectedCount={selectedHere.length} buckets={buckets} actions={actions} zoneMode={zoneMode} covered={covered} />
    </section>
  )
}
