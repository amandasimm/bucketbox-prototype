import { Fragment, useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import BulkActions from './BulkActions.jsx'
import DayNav, { dayLabel } from './DayNav.jsx'
import DeclutterIcon from './DeclutterIcon.jsx'
import EmailRow from './EmailRow.jsx'
import { newestFirst } from '../utils/dates.js'
import { dayHeading, listFor, receivedIn, weekBounds, weekLabel } from '../utils/range.js'

// State-aware empty messages (PRD F6; wording is a placeholder, PRD §12 #7). This Week has its
// own (placeholders too, Claude, 2026-11-22).
function emptyMessage(dayOffset, receivedThatDay, range) {
  if (range === 'all') return 'Nothing unsorted anywhere. Nice work.'
  if (range === 'week') {
    if (weekBounds(dayOffset).end < 0) return 'You cleared this week. Nice work.'
    if (receivedThatDay === 0) return 'Nothing yet this week, go enjoy your day.'
    return "Way to go! This week's inbox is cleared right now."
  }
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
// range (PRD F6, F10; brief item 5): 'today' shows one day; 'week' the Monday-to-Sunday week, newest
// first under day headings, with the week's count; 'all' every unsorted email in Gmail-style pages,
// with no day arrows or calendar, and the count only if showCount is on (Stage 21b).
export default function TodayList({ emails, buckets, dayOffset, range = 'today', pageSize = 50, showCount = false, onChangeDay, onDeclutter, selectedIds, onSelect, actions, zoneMode, openEmailId, onOpen, covered }) {
  const dayEmails = receivedIn(emails, range, dayOffset)
  const unsorted = listFor(emails, range, dayOffset)
  const week = range === 'week'
  const all = range === 'all'
  // All Emails' pages (PRD F6: Gmail-style, 50 a page to start). Another range shows everything.
  const [pageState, setPage] = useState(0)
  const pages = all ? Math.max(1, Math.ceil(unsorted.length / pageSize)) : 1
  const page = Math.min(pageState, pages - 1)
  const shown = all ? unsorted.slice(page * pageSize, (page + 1) * pageSize) : unsorted
  const shownIds = shown.map((email) => email.id)
  // The count beside Select all; All Emails puts it in the heading instead (Amanda, 2026-11-24)
  const countShown = !all
  // Days that still have unsorted emails, for the back arrow's dot and the calendar
  const daysWithUnsorted = new Set(
    emails.filter((email) => email.bucketId === null && email.removedTo === null).map((email) => email.dayOffset),
  )
  const unsortedIds = unsorted.map((email) => email.id)
  const selectedHere = selectedIds.filter((id) => unsortedIds.includes(id))

  // Select all works on what's on screen; in All Emails, a link then offers everything (like Gmail)
  const pageSelected = shown.length > 0 && shownIds.every((id) => selectedHere.includes(id))
  const allSelected = pageSelected
  const someSelected = selectedHere.length > 0 && !allSelected
  const everySelected = unsorted.length > 0 && selectedHere.length === unsorted.length
  const beyondPage = selectedHere.some((id) => !shownIds.includes(id))
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
      <header className={`today-header ${!all && (week ? weekLabel(dayOffset) : dayLabel(dayOffset)).length > 14 ? 'has-long-date' : ''}`}>
        {/* All Emails has no day arrows or calendar (PRD F6). Its heading is the count, "57 unsorted"
            (Amanda, 2026-11-24), or "All Emails" while the count is hidden */}
        {all ? (
          <h2 id="today-heading" className="today-label">
            {showCount ? `${unsorted.length} unsorted` : 'All Emails'}
          </h2>
        ) : (
          <DayNav dayOffset={dayOffset} onChangeDay={onChangeDay} daysWithUnsorted={daysWithUnsorted} range={range} />
        )}
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
              onChange={() => onSelect(allSelected ? [] : shownIds)}
            />
            {selectedHere.length > 0 ? `${selectedHere.length} selected` : 'Select all'}
          </label>
        )}
        {/* All Emails: Gmail-style "1–50 of 57" with Newer / Older; "of 57" only with the count on */}
        {all && unsorted.length > 0 && (
          <div className="list-pager">
            <span>
              {page * pageSize + 1}–{page * pageSize + shown.length}
              {showCount && ` of ${unsorted.length}`}
            </span>
            <IconButton label="Newer emails" tooltip="Newer" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <Icon name="chevron_left" size={20} />
            </IconButton>
            <IconButton label="Older emails" tooltip="Older" tooltipAlign="right" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
              <Icon name="chevron_right" size={20} />
            </IconButton>
          </div>
        )}
        {countShown && (
          <p className="unsorted-count">
            <span className="unsorted-number">{unsorted.length}</span> unsorted
          </p>
        )}
      </div>
      {/* Gmail's Select all: once a full page is selected and there's more, a link selects everything;
          then the buttons ask before acting on all of them (Amanda, 2026-11-22) */}
      {all && pages > 1 && pageSelected && (
        <p className="select-all-banner" role="status">
          {everySelected ? (
            <>
              All {unsorted.length} unsorted emails are selected.{' '}
              <button type="button" className="inline-link" onClick={() => onSelect([])}>
                Clear selection
              </button>
            </>
          ) : (
            <>
              All {shown.length} on this page are selected.{' '}
              <button type="button" className="inline-link" onClick={() => onSelect(unsortedIds)}>
                {showCount ? `Select all ${unsorted.length} unsorted emails` : 'Select all unsorted emails'}
              </button>
            </>
          )}
        </p>
      )}

      {unsorted.length > 0 ? (
        <>
          <ul className="email-list">
            {shown.map((email, index) => (
              <Fragment key={email.id}>
                {/* This Week: a small heading where each day starts (Amanda, 2026-11-22) */}
                {week && email.dayOffset !== shown[index - 1]?.dayOffset && (
                  <li className="list-day-heading" role="presentation">
                    {/* The day's name, then its date in a lighter weight (Amanda, 2026-11-22) */}
                    <span className="list-day-name">{dayHeading(email.dayOffset).name}</span>{' '}
                    <span className="list-day-date">{dayHeading(email.dayOffset).date}</span>
                  </li>
                )}
                <EmailRow
                  email={email}
                  variant={week ? 'week' : all ? 'all' : 'today'}
                  selected={selectedIds.includes(email.id)}
                  isOpen={email.id === openEmailId}
                  onToggleSelected={() => toggle(email.id)}
                  onOpen={() => onOpen(email.id)}
                />
              </Fragment>
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
          <p>{emptyMessage(dayOffset, dayEmails.length, range)}</p>
        </div>
      )}

      <BulkActions selectedCount={selectedHere.length} buckets={buckets} actions={actions} zoneMode={zoneMode} covered={covered} confirmAll={all && beyondPage} />
    </section>
  )
}
