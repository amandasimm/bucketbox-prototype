import { useEffect, useRef } from 'react'
import BulkActions from './BulkActions.jsx'
import EmailRow from './EmailRow.jsx'
import { formatShortDate, newestFirst } from '../utils/dates.js'

function dayLabel(dayOffset) {
  if (dayOffset === 0) return 'Today'
  if (dayOffset === -1) return 'Yesterday'
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  return formatShortDate(date)
}

// State-aware empty messages (PRD F6; wording is a placeholder, PRD §12 #7)
function emptyMessage(dayOffset, receivedThatDay) {
  if (dayOffset < 0) return 'You cleared this day. Nice work.'
  if (receivedThatDay === 0) return 'Nothing yet, go enjoy your day.'
  return 'Way to go! Your daily inbox is cleared right now.'
}

// The day's unsorted emails, with the unsorted count (PRD F1), Select all,
// and the Move / Archive / Delete buttons (PRD F7).
export default function TodayList({ emails, buckets, dayOffset, selectedIds, onSelect, actions }) {
  const dayEmails = emails.filter((email) => email.dayOffset === dayOffset)
  const unsorted = dayEmails
    .filter((email) => email.bucketId === null && email.removedTo === null)
    .sort(newestFirst)
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
      <header className="today-header">
        <h2 id="today-heading" className="today-label">{dayLabel(dayOffset)}</h2>
        <p className="unsorted-count">
          <span className="unsorted-number">{unsorted.length}</span> unsorted
        </p>
      </header>

      {unsorted.length > 0 ? (
        <>
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
          <ul className="email-list">
            {unsorted.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
                selected={selectedIds.includes(email.id)}
                onToggleSelected={() => toggle(email.id)}
              />
            ))}
          </ul>
        </>
      ) : (
        <div className="empty-state" role="status">
          <p>{emptyMessage(dayOffset, dayEmails.length)}</p>
        </div>
      )}

      <BulkActions selectedCount={selectedHere.length} buckets={buckets} actions={actions} />
    </section>
  )
}
