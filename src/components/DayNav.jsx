import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'

// "Today", "Yesterday", or a date with the full month name, like "October 27" (PRD F6).
// A date from another year includes the year: "December 31, 2025" (BUILD-LOG, 2026-10-30).
export function dayLabel(dayOffset) {
  if (dayOffset === 0) return 'Today'
  if (dayOffset === -1) return 'Yesterday'
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  const otherYear = date.getFullYear() !== new Date().getFullYear()
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: otherYear ? 'numeric' : undefined })
}

// Whole days between a date and today (0 = today, -1 = yesterday)
function offsetOf(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return Math.round((day - today) / 86400000)
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const POPOVER_WIDTH = 296

// A small month calendar (PRD F6). Days with unsorted emails get a blue dot (a status,
// not a count); future days are switched off. It floats on top of the page, so the
// Today card's rounded edges can't cut it off.
function DayPicker({ anchorRef, dayOffset, daysWithUnsorted, onPick, onClose }) {
  const selected = new Date()
  selected.setDate(selected.getDate() + dayOffset)
  const [month, setMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1))
  const [position, setPosition] = useState(null)
  const popoverRef = useRef(null)

  useLayoutEffect(() => {
    const box = anchorRef.current.getBoundingClientRect()
    // The icon sits in the card's right corner, so the calendar opens leftward from it
    setPosition({ left: Math.max(8, box.right - POPOVER_WIDTH), top: box.bottom + 6 })
  }, [anchorRef])

  useEffect(() => {
    // Start on the day being viewed (or the first day you can pick, in another month)
    const popover = popoverRef.current
    ;(popover?.querySelector('[aria-current="date"]') ?? popover?.querySelector('.day-picker-day:not(:disabled)'))?.focus()
  }, [position])

  useEffect(() => {
    function onPointerDown(event) {
      if (!popoverRef.current?.contains(event.target) && !anchorRef.current.contains(event.target)) onClose()
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose(true)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [anchorRef, onClose])

  const firstWeekday = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const now = new Date()
  const isThisMonth = month.getFullYear() * 12 + month.getMonth() >= now.getFullYear() * 12 + now.getMonth()
  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), d))

  if (!position) return null
  return createPortal(
    <div
      ref={popoverRef}
      className="day-picker"
      role="dialog"
      aria-label="Choose a day"
      style={{ left: position.left, top: position.top, width: POPOVER_WIDTH }}
    >
      <div className="day-picker-header">
        <span className="day-picker-month">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <IconButton
          label="Previous month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <Icon name="chevron_left" size={20} />
        </IconButton>
        <IconButton
          label="Next month"
          disabled={isThisMonth}
          tooltipAlign="right"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <Icon name="chevron_right" size={20} />
        </IconButton>
      </div>
      <div className="day-picker-grid" role="grid">
        {WEEKDAYS.map((weekday, i) => (
          <span key={`w${i}`} className="day-picker-weekday" aria-hidden="true">
            {weekday}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank${i}`} />
          const offset = offsetOf(date)
          const future = offset > 0
          const hasUnsorted = daysWithUnsorted.has(offset)
          const label = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${
            hasUnsorted ? ', has unsorted emails' : ''
          }`
          return (
            <button
              key={offset}
              type="button"
              className={`day-picker-day ${offset === 0 ? 'is-today' : ''} ${offset === dayOffset ? 'is-selected' : ''}`}
              disabled={future}
              aria-label={label}
              aria-current={offset === dayOffset ? 'date' : undefined}
              onClick={() => onPick(offset)}
            >
              {date.getDate()}
              {hasUnsorted && <span className="day-picker-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}

// Moving between days (PRD F6): ‹ label › on the left, the calendar in the right corner. The next arrow only appears on
// past days. The back arrow shows a small blue dot when the day before still has unsorted
// emails, with a text label so it isn't color-only (BUILD-LOG, 2026-10-30).
export default function DayNav({ dayOffset, onChangeDay, daysWithUnsorted }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const calendarRef = useRef(null)
  const previousLabel = dayLabel(dayOffset - 1)
  const previousHasUnsorted = daysWithUnsorted.has(dayOffset - 1)
  const backLabel = previousHasUnsorted ? `Previous day. ${previousLabel} has unsorted emails` : 'Previous day'

  return (
    <div className="day-nav">
      <span className={`day-nav-back ${previousHasUnsorted ? 'has-waiting' : ''}`}>
        <IconButton label={backLabel} tooltipAlign="left" onClick={() => onChangeDay(dayOffset - 1)}>
          <Icon name="chevron_left" size={22} />
        </IconButton>
        {previousHasUnsorted && <span className="day-nav-dot" aria-hidden="true" />}
      </span>
      <h2 id="today-heading" className="today-label" aria-live="polite">
        {dayLabel(dayOffset)}
      </h2>
      {dayOffset < 0 && (
        <IconButton label="Next day" onClick={() => onChangeDay(dayOffset + 1)}>
          <Icon name="chevron_right" size={22} />
        </IconButton>
      )}
      <span ref={calendarRef} className="day-nav-calendar">
        {/* Its hover label opens leftward, so the card's edge doesn't cut it off */}
        <IconButton label="Choose a day" tooltipAlign="right" onClick={() => setPickerOpen(!pickerOpen)}>
          <Icon name="calendar_month" size={20} />
        </IconButton>
      </span>
      {pickerOpen && (
        <DayPicker
          anchorRef={calendarRef}
          dayOffset={dayOffset}
          daysWithUnsorted={daysWithUnsorted}
          onPick={(offset) => {
            setPickerOpen(false)
            onChangeDay(offset)
          }}
          onClose={(returnFocus) => {
            setPickerOpen(false)
            if (returnFocus) calendarRef.current?.querySelector('button')?.focus()
          }}
        />
      )}
    </div>
  )
}
