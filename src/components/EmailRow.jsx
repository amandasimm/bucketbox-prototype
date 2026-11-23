import { useLayoutEffect, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useDragMotion } from './DragMotion.jsx'
import Icon from './Icon.jsx'
import { formatShortDate, formatTime } from '../utils/dates.js'
import { MatchesTag, isNotSorted } from './ConflictBanner.jsx'

// One email in a list, stacked like Gmail's mobile rows (BUILD-LOG, 2026-10-28):
// sender and time on top, then subject, preview and attachments.
// variant:
// - 'today': time, checkbox, preview, always-visible drag handle (PRD F1). The handle's grab
//   area is the whole left strip, including the space under the checkbox, plus the right edge.
// - 'tile': a bucket tile's peek on the home page: date, preview, no checkbox, handle on hover (PRD F2)
// - 'bucket': an opened bucket's list: date, checkbox, preview, always-visible handle
// Clicking the text opens the email (PRD F1: only the handle starts a drag).
// The handle starts a drag with the mouse, or with Space / Enter from the keyboard (PRD F4).
export default function EmailRow({ email, variant = 'today', selected = false, isOpen = false, onToggleSelected, onOpen }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes } = useDraggable({
    id: email.id,
    data: { email, label: `email from ${email.sender}` },
  })
  // Drag and leave animations (BUILD-LOG, 2026-11-13)
  const { ghostIds, leavingIds, arrivedIds } = useDragMotion()
  const isLeaving = leavingIds.includes(email.id)
  const rowRef = useRef(null)
  // Where the pointer went down on the row, so letting go after a drag isn't taken as a click
  const pressedAt = useRef(null)
  // A leaving row closes up: its height is fixed at what it is now, then eased to nothing
  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    if (!isLeaving) {
      row.style.height = ''
      return
    }
    row.style.height = `${row.offsetHeight}px`
    row.getBoundingClientRect() // lets the browser register the starting height
    row.style.height = '0px'
  }, [isLeaving])
  const inTile = variant === 'tile'
  const threadSize = email.messages?.length ?? 1
  // The Today list shows times; in This Week the day heading above gives the date (brief item 5)
  const received = variant === 'today' || variant === 'week' ? formatTime(email.receivedAt) : formatShortDate(email.receivedAt)
  const rowClasses = [
    'email-row',
    email.unread ? 'is-unread' : 'is-read',
    // Sorted into a bucket and not opened yet (PRD F14): a light tint of the bucket's color
    email.isNew && email.bucketId ? 'is-new' : '',
    inTile ? 'in-bucket' : '',
    selected ? 'is-selected' : '',
    isOpen ? 'is-open' : '',
    ghostIds.includes(email.id) ? 'is-drag-ghost' : '',
    isLeaving ? 'is-leaving' : '',
    arrivedIds.includes(email.id) ? 'just-arrived' : '',
  ].join(' ')

  return (
    <li
      className={rowClasses}
      ref={(node) => {
        rowRef.current = node
        setNodeRef(node)
      }}
      data-email-id={email.id}
    >
      {/* Content comes first, so keyboard and screen reader users hear which email it is before
          its controls. The layout still shows the handle and checkbox on the left. */}
      {/* The whole row picks the email up with the mouse (Amanda, 2026-11-22): press and move a
          few pixels to drag; a plain click still opens it. The keyboard keeps using the handle,
          so Enter on the row still opens the email. */}
      <button
        type="button"
        className="email-row-body"
        aria-current={isOpen ? 'true' : undefined}
        onPointerDown={(event) => {
          pressedAt.current = { x: event.clientX, y: event.clientY }
          listeners?.onPointerDown?.(event)
        }}
        onClick={(event) => {
          // A drag that ended back on its own row isn't a click
          const from = pressedAt.current
          pressedAt.current = null
          if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > 4) return
          onOpen?.(event)
        }}
      >
        <span className="email-row-top">
          <span className="email-sender">
            {email.unread && <span className="visually-hidden">Unread. </span>}
            <span className="email-sender-name">{email.sender}</span>
            {threadSize > 1 && <span className="email-thread-size">{threadSize}</span>}
            {email.unread && <span className="unread-dot" aria-hidden="true" />}
          </span>
          <span className="email-received">{received}</span>
        </span>
        {/* Before the subject, where Gmail shows its labels (brief 1g; Amanda, 2026-11-21) */}
        <span className="email-subject">
          {isNotSorted(email) && <MatchesTag email={email} />}
          {email.subject}
        </span>
        {/* Bucket tiles show the preview and attachments too, like the Today list (BUILD-LOG, 2026-11-16) */}
        <span className="email-preview">{email.preview}</span>
        {email.attachments.length > 0 && (
          <span className="email-attachments">
            {email.attachments.map((name) => (
              <span key={name} className="attachment-chip">
                <Icon name="attach_file" size={16} />
                {name}
              </span>
            ))}
          </span>
        )}
      </button>
      {!inTile && (
        <label className="email-checkbox-target">
          <input
            type="checkbox"
            className="email-checkbox"
            checked={selected}
            onChange={onToggleSelected}
            aria-label={`Select email from ${email.sender}: ${email.subject}`}
          />
        </label>
      )}
      <button
        type="button"
        className="drag-handle"
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        aria-label={`Drag email from ${email.sender}`}
      >
        <Icon name="drag_indicator" size={20} />
      </button>
      {/* A second place to grab the email with the mouse: its right edge, the side nearest the
          buckets (BUILD-LOG, 2026-11-16). Keyboard and screen reader users have the handle above. */}
      {!inTile && (
        <span className="drag-edge" {...listeners} aria-hidden="true" />
      )}
    </li>
  )
}
