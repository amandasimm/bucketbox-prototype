import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import EmailPane, { Avatar, threadMessages } from './EmailPane.jsx'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import InertButton from './InertButton.jsx'
import { bucketStyle } from '../utils/bucketColors.js'
import { formatMessageTime, receivedAt } from '../utils/dates.js'
import './Declutter.css'

// A labeled action around the card. Its place matches its arrow key (PRD F13). Like the
// icon buttons, a switched-off one stays focusable.
function ArrowButton({ className, icon, label, keyName, disabled = false, onClick }) {
  return (
    <button
      type="button"
      className={`declutter-action ${className}`}
      aria-label={`${label}, ${keyName} arrow key`}
      aria-keyshortcuts={`Arrow${keyName.charAt(0).toUpperCase()}${keyName.slice(1)}`}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      <Icon name={icon} size={20} />
      {label}
    </button>
  )
}

// Gmail's 3-dot menu on the card. Report spam works like Mark as junk; the others are visible
// but inert. Unsubscribe only shows on mailing-list categories (BUILD-LOG, 2026-10-31).
function CardMenu({ email, onReportSpam }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const menuRef = useRef(null)
  const canUnsubscribe = email.category === 'Promotions' || email.category === 'Social'

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
    <div className="declutter-card-menu" ref={wrapRef}>
      <IconButton label="More" tooltipAlign="right" onClick={() => setOpen(!open)}>
        <Icon name="more_horiz" size={20} />
      </IconButton>
      {open && (
        <div className="pane-menu" role="menu" aria-label="More" ref={menuRef}>
          <InertButton label="Mute" className="move-menu-item" nameOnHover={false}>Mute</InertButton>
          {canUnsubscribe && (
            <InertButton label="Unsubscribe" className="move-menu-item" nameOnHover={false}>Unsubscribe</InertButton>
          )}
          <InertButton label="Block sender" className="move-menu-item" nameOnHover={false}>Block sender</InertButton>
          <button
            type="button"
            role="menuitem"
            className="move-menu-item"
            onClick={() => {
              setOpen(false)
              onReportSpam(email)
            }}
          >
            Report spam
          </button>
        </div>
      )}
    </div>
  )
}

// One email as a card, laid out like Gmail's mobile email view, so it feels like reading it on a
// phone (PRD F13; Amanda's mock). Looking at a card leaves its unread status alone; clicking it
// opens the email. The next card just shows below it, like a rolodex.
function EmailCard({ email, cardRef, onOpen, onReportSpam }) {
  const message = threadMessages(email).at(-1)
  const threadSize = email.messages?.length ?? 1
  const senderRowRef = useRef(null)
  const [menuTop, setMenuTop] = useState(null)

  // Subjects run 1 to 3 lines, so the 3-dot button finds the middle of the sender row on each card
  useLayoutEffect(() => {
    const row = senderRowRef.current
    // Read from the layout, not the screen, so the card's slide-in doesn't throw it off
    setMenuTop(row.offsetParent.offsetTop + row.offsetTop + row.offsetHeight / 2)
  }, [email.id])

  return (
    <div className="declutter-card" style={{ '--menu-top': `${menuTop}px` }}>
      <button
        type="button"
        ref={cardRef}
        className="declutter-card-open"
        aria-label={`Open email. ${email.unread ? 'Unread. ' : ''}${email.sender}: ${email.subject}`}
        onClick={onOpen}
      >
        <span key={email.id} className="declutter-card-content">
          <span className="declutter-subject">{email.subject}</span>
          <span className="declutter-sender-row" ref={senderRowRef}>
            <Avatar from={message.from} />
            <span className="declutter-sender">
              <span className="declutter-sender-name">
                {message.from}
                {threadSize > 1 && <span className="declutter-thread-size">{threadSize}</span>}
                {email.unread && <span className="unread-dot" aria-hidden="true" />}
              </span>
              <span className="declutter-time">{formatMessageTime(receivedAt(message.dayOffset, message.time))}</span>
            </span>
          </span>
          <span className="declutter-body">{message.body}</span>
          {email.attachments.length > 0 && (
            <span className="declutter-attachments">
              {email.attachments.map((name) => (
                <span key={name} className="attachment-chip">
                  <Icon name="attach_file" size={16} />
                  {name}
                </span>
              ))}
            </span>
          )}
        </span>
        <span className="declutter-card-hint">
          <Icon name="open_in_full" size={16} />
          Open to read or reply
        </span>
      </button>
      <CardMenu email={email} onReportSpam={onReportSpam} />
    </div>
  )
}

// The bucket list under the buttons. Sorting is by pill, separate from the arrow keys (PRD F13).
// Pills fill two rows at most; any more scroll sideways, so this sets a width that makes the
// pills split evenly across the two rows (Amanda's review, 2026-10-31).
function BucketBar({ email, buckets, onMove }) {
  const scrollRef = useRef(null)
  const rowsRef = useRef(null)
  const [rowsWidth, setRowsWidth] = useState(null)

  useLayoutEffect(() => {
    const pills = [...rowsRef.current.children].map((pill) => pill.offsetWidth)
    const total = pills.reduce((sum, width) => sum + width + 8, 0)
    const widest = Math.max(0, ...pills)
    setRowsWidth(Math.max(scrollRef.current.clientWidth - 4, Math.ceil(total / 2) + widest)) // 4 = its padding
  }, [buckets])

  return (
    <div className="declutter-bar" role="group" aria-labelledby="declutter-bar-label">
      <span id="declutter-bar-label" className="declutter-bar-label">Move to:</span>
      <div className="declutter-bar-scroll" ref={scrollRef}>
        <div className="declutter-bar-rows" ref={rowsRef} style={{ width: rowsWidth ?? undefined }}>
          {buckets.length === 0 && <span className="declutter-no-buckets">No buckets yet</span>}
          {buckets.map((bucket) => (
            <button
              key={bucket.id}
              type="button"
              className="declutter-pill"
              style={bucketStyle(bucket.color)}
              aria-label={`Move to ${bucket.name}`}
              onClick={() => onMove(email, bucket)}
            >
              {bucket.emoji ? (
                <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span>
              ) : (
                <span className="bucket-swatch" aria-hidden="true" />
              )}
              {bucket.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// The confirmation message sits where the email card was: progress for this day (Flow 7).
// It only says the day is done when no emails were left behind (CLAUDE.md §7).
function EndMessage({ declutter, headingRef }) {
  const { total, dayName, progress } = declutter
  const lines = [
    [progress.archived, 'archived'],
    [progress.moved, 'moved to buckets'],
    [progress.read, 'marked as read'],
    [progress.deleted, 'deleted'],
    [progress.left, 'still in the Today list'],
  ].filter(([count]) => count > 0)
  let message = `${dayName} is Decluttered`
  if (total === 0) message = `Nothing unsorted for ${dayName}`
  else if (progress.left > 0 && progress.read < progress.left) message = `You went through ${dayName}`

  return (
    <div className="declutter-end">
      <h3 className="declutter-end-title" tabIndex={-1} ref={headingRef}>{message}</h3>
      {lines.length > 0 && (
        <ul className="declutter-end-list">
          {lines.map(([count, label]) => (
            <li key={label}>
              <span className="declutter-end-count">{count}</span> {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Declutter (rapid sort; PRD F13, Flow 7): the viewed day's unsorted emails as a rolodex of cards.
// Up and Down move through them, Left archives, Right marks read. Escape or the X leaves at any
// time; what's done stays done and the rest stays in the Today list.
export default function Declutter({ declutter, buckets, onSendReply }) {
  const { dayName, total, position, email, openEmail, hasPrevious, hasNext, previousDay, actions, emailView } = declutter
  const atEnd = !email
  const screenRef = useRef(null)
  const cardRef = useRef(null)
  const endHeadingRef = useRef(null)
  const titleRef = useRef(null)

  const startPoint = () => (atEnd ? endHeadingRef.current : cardRef.current)

  useEffect(() => {
    startPoint()?.focus()
    // Only when this day's Declutter starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keeps the keyboard in place: focus only moves if the control it was on went away or switched
  // off, so someone working from the buttons or Undo stays there
  useEffect(() => {
    if (openEmail) {
      titleRef.current?.focus({ preventScroll: true })
      return
    }
    const active = document.activeElement
    const lost = !active || active === document.body
    const switchedOff = screenRef.current?.contains(active) && active.getAttribute('aria-disabled') === 'true'
    if (lost || switchedOff) startPoint()?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, openEmail, atEnd])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.target.closest?.('input, textarea, [contenteditable], .compose-drawer')) return

      if (event.key === 'Escape') {
        // Escape closes an open menu or a reply first, then the open email, then Declutter
        if (document.querySelector('[role="menu"]') || event.target.closest?.('.reply-box')) return
        if (openEmail) actions.close()
        else actions.exit()
        return
      }
      if (openEmail || document.querySelector('[role="menu"]')) return // the flow is paused

      if (event.key === 'ArrowUp') actions.previous()
      else if (event.key === 'ArrowDown' && !atEnd) actions.next()
      else if (event.key === 'ArrowLeft' && !atEnd) actions.archive(email)
      else if (event.key === 'ArrowRight' && !atEnd) actions.markRead(email)
      else return
      event.preventDefault()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  // A small title, so the email gets the room; screen readers also hear the day
  const title = (
    <h2 id="declutter-title" className="declutter-title">
      Declutter<span className="visually-hidden"> {dayName}</span>
    </h2>
  )

  return (
    <section className="declutter" aria-labelledby="declutter-title" ref={screenRef}>
      <span className="declutter-exit">
        <IconButton label="Exit Declutter" tooltipAlign="right" onClick={actions.exit}>
          <Icon name="close" size={20} />
        </IconButton>
      </span>

      {/* The toast already says what just happened; this adds where you are now */}
      <p className="visually-hidden" role="status">
        {!atEnd && !openEmail && `${position + 1} of ${total}. ${email.unread ? 'Unread. ' : ''}${email.sender}: ${email.subject}`}
      </p>

      {openEmail ? (
        <div className="declutter-open">
          <EmailPane
            email={openEmail}
            listIds={[openEmail.id]}
            buckets={buckets}
            emailView={emailView}
            onSendReply={onSendReply}
            onClose={actions.close}
            titleRef={titleRef}
          />
        </div>
      ) : (
          <div className="declutter-stage">
            <div className="declutter-reader">
              {title}
              <p className="declutter-count">{atEnd ? 'Complete' : `${position + 1} of ${total}`}</p>
              <div className="declutter-progress" aria-hidden="true">
                <span style={{ width: atEnd ? '100%' : `${((position + 1) / total) * 100}%` }} />
              </div>
              {atEnd ? (
                <EndMessage declutter={declutter} headingRef={endHeadingRef} />
              ) : (
                <div className={`declutter-deck ${hasNext ? 'has-next' : ''}`}>
                  <EmailCard
                    email={email}
                    cardRef={cardRef}
                    onOpen={() => actions.open(email)}
                    onReportSpam={emailView.junk}
                  />
                </div>
              )}
            </div>
            {/* The email comes first in the eye's path; the controls sit bottom right. The
                buttons sit where their arrow keys point. */}
            <div className="declutter-controls">
              <div className="declutter-keys">
                <ArrowButton
                  className="is-up"
                  icon="keyboard_arrow_up"
                  label="Previous"
                  keyName="up"
                  disabled={!hasPrevious}
                  onClick={actions.previous}
                />
                {atEnd ? (
                  <div className="declutter-end-buttons">
                    {previousDay !== null && (
                      <button type="button" className="text-button" onClick={() => actions.previousDay(previousDay)}>
                        Declutter Previous Day
                      </button>
                    )}
                    <button type="button" className="filled-button" onClick={actions.exit}>Done</button>
                  </div>
                ) : (
                  <>
                    <ArrowButton className="is-left is-main" icon="keyboard_arrow_left" label="Archive" keyName="left" onClick={() => actions.archive(email)} />
                    <ArrowButton className="is-right is-main" icon="keyboard_arrow_right" label="Mark as read" keyName="right" onClick={() => actions.markRead(email)} />
                    <ArrowButton className="is-down" icon="keyboard_arrow_down" label="Next" keyName="down" onClick={actions.next} />
                  </>
                )}
              </div>
              {/* Holds the bucket list's space on the end screen, so Previous stays put */}
              <div className={atEnd ? 'declutter-bar-holder' : undefined} inert={atEnd ? true : undefined}>
                <BucketBar email={email} buckets={buckets} onMove={actions.move} />
              </div>
            </div>
          </div>
      )}
    </section>
  )
}
