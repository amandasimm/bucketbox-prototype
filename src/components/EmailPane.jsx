import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import InertButton from './InertButton.jsx'
import ReplyArea from './ReplyArea.jsx'
import { formatMessageTime, receivedAt } from '../utils/dates.js'

// Gmail's "Move to" list for the open email (PRD F4, F5)
function MoveToButton({ buckets, onMove }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector('button')?.focus()
    function onPointerDown(event) {
      if (!wrapRef.current.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
        wrapRef.current.querySelector('.icon-button')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  return (
    <div className="pane-menu-wrap" ref={wrapRef}>
      <IconButton label="Move to" onClick={() => setOpen(!open)}>
        <Icon name="drive_file_move" size={20} />
      </IconButton>
      {open && (
        <div className="pane-menu" role="menu" aria-label="Move to" ref={menuRef}>
          <p className="move-menu-title" aria-hidden="true">Move to</p>
          {buckets.length === 0 && <p className="move-menu-empty">No other buckets</p>}
          {buckets.map((bucket) => (
            <button
              key={bucket.id}
              type="button"
              role="menuitem"
              className="move-menu-item"
              onClick={() => {
                setOpen(false)
                onMove(bucket)
              }}
            >
              {bucket.emoji ? (
                <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span>
              ) : (
                <span className="bucket-swatch" style={{ background: bucket.color }} aria-hidden="true" />
              )}
              {bucket.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// A sender's avatar: their first letter, or for your own messages ("me") the account icon
// from the top right of the header, drawn lighter (BUILD-LOG, 2026-10-30)
function Avatar({ from }) {
  if (from === 'me') {
    return (
      <span className="thread-avatar is-me" aria-hidden="true">
        <Icon name="account_circle" size={32} />
      </span>
    )
  }
  return <span className="thread-avatar" aria-hidden="true">{from.charAt(0).toUpperCase()}</span>
}

// The messages in an email, oldest first. A single email is a thread of one.
function threadMessages(email) {
  if (email.messages) return email.messages
  return [{ from: email.sender, dayOffset: email.dayOffset, time: email.time, body: email.body }]
}

// Gmail-style thread: older messages are one line each (sender, first words, time) and
// open when clicked; the newest is fully open (BUILD-LOG, 2026-10-30).
function Thread({ email }) {
  const messages = threadMessages(email)
  const [expanded, setExpanded] = useState([])
  const last = messages.length - 1

  return (
    <ol className="thread">
      {messages.map((message, index) => {
        const isOpen = index === last || expanded.includes(index)
        const when = formatMessageTime(receivedAt(message.dayOffset, message.time))
        const from = message.from === 'me' ? 'me' : message.from
        const address = message.from === email.sender ? email.senderEmail : null
        if (!isOpen) {
          return (
            <li key={index} className="thread-message is-collapsed">
              <button type="button" className="thread-collapsed" onClick={() => setExpanded([...expanded, index])}>
                <Avatar from={from} />
                <span className="thread-from">{from}</span>
                <span className="thread-snippet">{message.body}</span>
                <span className="thread-time">{when}</span>
              </button>
            </li>
          )
        }
        return (
          <li key={index} className="thread-message">
            <div className="thread-header">
              <Avatar from={from} />
              <span className="thread-from">
                {from}
                {address && <span className="thread-address"> &lt;{address}&gt;</span>}
              </span>
              <span className="thread-time">{when}</span>
            </div>
            <p className="thread-body">{message.body}</p>
            {index === last && email.attachments.length > 0 && (
              <div className="email-attachments">
                {email.attachments.map((name) => (
                  <span key={name} className="attachment-chip">
                    <Icon name="attach_file" size={16} />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

// One open email with Gmail's toolbar above it (PRD F5). Used by the Today drawer and the
// opened bucket. listIds is the list the email sits in, so the pane can move to the next one.
// Real: Archive, junk, Delete, Mark as unread, Move to, Reply. The other icons are visible
// but inert (BUILD-LOG, 2026-10-30).
export default function EmailPane({ email, listIds, buckets, emailView, onSendReply, onClose, onContentPointerDown, titleRef }) {
  const otherBuckets = buckets.filter((bucket) => bucket.id !== email.bucketId)

  return (
    <article className="email-pane" aria-labelledby={`pane-subject-${email.id}`}>
      <div className="pane-toolbar" role="toolbar" aria-label="Email actions">
        <IconButton label="Archive" onClick={() => emailView.archive(email, listIds)}>
          <Icon name="archive" size={20} />
        </IconButton>
        <IconButton label="Mark as junk" onClick={() => emailView.junk(email, listIds)}>
          <Icon name="report" size={20} />
        </IconButton>
        <IconButton label="Delete" onClick={() => emailView.delete(email, listIds)}>
          <Icon name="delete" size={20} />
        </IconButton>
        <span className="pane-toolbar-divider" aria-hidden="true" />
        <IconButton label="Mark as unread" onClick={() => emailView.markUnread(email)}>
          <Icon name="mark_email_unread" size={20} />
        </IconButton>
        <InertButton label="Remind me" className="icon-button">
          <Icon name="schedule" size={20} />
        </InertButton>
        <InertButton label="Add to tasks" className="icon-button">
          <Icon name="add_task" size={20} />
        </InertButton>
        <span className="pane-toolbar-divider" aria-hidden="true" />
        <MoveToButton buckets={otherBuckets} onMove={(bucket) => emailView.move(email, listIds, bucket)} />
        <InertButton label="Labels" className="icon-button">
          <Icon name="label" size={20} />
        </InertButton>
        <InertButton label="More" className="icon-button">
          <Icon name="more_vert" size={20} />
        </InertButton>
        {onClose && (
          <span className="pane-close">
            <IconButton label="Close email" tooltipAlign="right" onClick={onClose}>
              <Icon name="close" size={20} />
            </IconButton>
          </span>
        )}
      </div>

      {/* Clicking into the email counts as reading it (PRD F5 default pane) */}
      <div className="pane-content" onPointerDown={onContentPointerDown}>
        <h2 id={`pane-subject-${email.id}`} className="pane-subject" tabIndex={-1} ref={titleRef}>
          {email.subject}
        </h2>
        <Thread key={`thread-${email.id}`} email={email} />
        <hr className="pane-divider" />
        {/* A new email starts with the buttons again, not a half-written reply */}
        <ReplyArea key={`reply-${email.id}`} email={email} onSendReply={onSendReply} />
      </div>
    </article>
  )
}
