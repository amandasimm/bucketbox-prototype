import { useDraggable } from '@dnd-kit/core'
import Icon from './Icon.jsx'
import { formatShortDate, formatTime } from '../utils/dates.js'

// One email in a list, stacked like Gmail's mobile rows (BUILD-LOG, 2026-10-28):
// sender and time on top, then subject, preview and attachments.
// variant:
// - 'today': time, checkbox, preview, always-visible drag handle (PRD F1)
// - 'tile': a bucket tile's peek on the home page: date, no checkbox or preview, handle on hover (PRD F2)
// - 'bucket': an opened bucket's list: date, checkbox, preview, always-visible handle
// Clicking the text opens the email (PRD F1: only the handle starts a drag).
// The handle starts a drag with the mouse, or with Space / Enter from the keyboard (PRD F4).
export default function EmailRow({ email, variant = 'today', selected = false, isOpen = false, onToggleSelected, onOpen }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes } = useDraggable({
    id: email.id,
    data: { email, label: `email from ${email.sender}` },
  })
  const inTile = variant === 'tile'
  const threadSize = email.messages?.length ?? 1
  const received = variant === 'today' ? formatTime(email.receivedAt) : formatShortDate(email.receivedAt)
  const rowClasses = [
    'email-row',
    email.unread ? 'is-unread' : 'is-read',
    inTile ? 'in-bucket' : '',
    selected ? 'is-selected' : '',
    isOpen ? 'is-open' : '',
  ].join(' ')

  return (
    <li className={rowClasses} ref={setNodeRef} data-email-id={email.id}>
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
      {!inTile && (
        <input
          type="checkbox"
          className="email-checkbox"
          checked={selected}
          onChange={onToggleSelected}
          aria-label={`Select email from ${email.sender}: ${email.subject}`}
        />
      )}
      <button
        type="button"
        className="email-row-body"
        aria-current={isOpen ? 'true' : undefined}
        onClick={onOpen}
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
        <span className="email-subject">{email.subject}</span>
        {!inTile && <span className="email-preview">{email.preview}</span>}
        {!inTile && email.attachments.length > 0 && (
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
    </li>
  )
}
