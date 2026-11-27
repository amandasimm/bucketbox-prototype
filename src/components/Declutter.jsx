import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './DragMotion.jsx'
import EmailPane, { Avatar, threadMessages } from './EmailPane.jsx'
import Icon from './Icon.jsx'
import { ArchiveReviewPanel, SuggestionBanner } from './ArchiveSuggestion.jsx'
import IconButton from './IconButton.jsx'
import InertButton from './InertButton.jsx'
import { bucketStyle } from '../utils/bucketColors.js'
import { formatMessageTime, receivedAt } from '../utils/dates.js'
import './Declutter.css'

// Each button shows its arrow key as a keycap, so the keyboard is a visible option without
// pushing anyone toward it (BUILD-LOG, 2026-11-08)
const KEYCAP_ICONS = { up: 'arrow_upward', down: 'arrow_downward', left: 'arrow_back', right: 'arrow_forward' }

// The end screen's button names the day it goes to: "Yesterday", or a short date like "Nov 6"
// (with the year for another year)
export function dayButtonLabel(dayOffset) {
  if (dayOffset === -1) return 'Yesterday'
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  const otherYear = date.getFullYear() !== new Date().getFullYear()
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: otherYear ? 'numeric' : undefined })
}

// A keycap on its own, for the first-time tip
const Keycap = ({ keyName }) => (
  <span className="keycap" aria-hidden="true">
    <Icon name={KEYCAP_ICONS[keyName]} size={14} />
  </span>
)

// The first time Declutter opens in a visit (Amanda, 2026-11-27): a short tip in three chunks, one
// idea at a time, each placed by what it's about. 1: Left and Right, and clicking the email to open
// it, just above the blue buttons (over the Back button, which is off on the first card). 2: the
// bucket pills, just under them. 3: Up and Down, above the Back button. The controls it's about
// glow. Next / Got it moves on, and so does doing it (that step's keys, or a pill), which still
// does its job. Not a modal.
const TIP_STEPS = 3
function KeysTip({ step, onNext }) {
  return (
    <div className={`declutter-tip is-step-${step}`} role="status">
      <p className="declutter-tip-count">
        <span className="visually-hidden">Tip, step </span>
        {step} of {TIP_STEPS}
      </p>
      {step === 1 && (
        <>
          {/* A welcome first (Amanda, 2026-11-27) */}
          <p className="declutter-tip-title">Welcome to Declutter</p>
          <p className="declutter-tip-text">Declutter is a quicker way to get through your inbox. Click the email to open it or use the arrow keys to sort.</p>
          <p className="declutter-tip-line is-keys">
            <Keycap keyName="left" /> <span>Archive</span>
            <Keycap keyName="right" /> <span>Mark as read</span>
          </p>
        </>
      )}
      {step === 2 && (
        <>
          <p className="declutter-tip-line">Move it to a bucket</p>
          <p className="declutter-tip-text">Click a bucket or press its number to move the email there.</p>
        </>
      )}
      {step === 3 && (
        <>
          <p className="declutter-tip-line">
            <Keycap keyName="up" /> <span>Back</span>
            <Keycap keyName="down" /> <span>Next</span>
          </p>
          <p className="declutter-tip-text">Move through your emails.</p>
        </>
      )}
      <button type="button" className="text-button declutter-tip-button" onClick={onNext}>
        {step < TIP_STEPS ? 'Next' : 'Got it'}
      </button>
    </div>
  )
}

// A labeled action around the card. Its place matches its arrow key (PRD F13). Like the
// icon buttons, a switched-off one stays focusable. onClick hears 'pointer' for a mouse click.
// glow: the first-time tip is about this button.
function ArrowButton({ className = '', label, spokenLabel = label, keyName, disabled = false, onClick, glow = false }) {
  return (
    <button
      type="button"
      className={`declutter-action ${className} ${glow ? 'is-tip-glow' : ''}`}
      aria-label={`${spokenLabel}, ${keyName} arrow key`}
      aria-keyshortcuts={`Arrow${keyName.charAt(0).toUpperCase()}${keyName.slice(1)}`}
      aria-disabled={disabled}
      onClick={disabled ? undefined : (event) => onClick(event.detail > 0 ? 'pointer' : 'keyboard')}
    >
      <span className="keycap" aria-hidden="true">
        <Icon name={KEYCAP_ICONS[keyName]} size={14} />
      </span>
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
// While sorting, the pills move the card into a bucket. On the end screen they open the bucket
// instead, leaving Declutter (Amanda, 2026-11-24).
// tip: the first-time tip's bucket step, shown under the pills while they glow
function BucketBar({ email, buckets, onMove, onOpenBucket, tip = null }) {
  const opening = Boolean(onOpenBucket)
  return (
    <div className={`declutter-bar ${tip ? 'has-tip' : ''}`} role="group" aria-labelledby="declutter-bar-label">
      <span id="declutter-bar-label" className="declutter-bar-label">{opening ? 'Go to:' : 'Move to:'}</span>
      <div className="declutter-bar-scroll">
        <div className="declutter-bar-rows">
          {buckets.length === 0 && <span className="declutter-no-buckets">No buckets yet</span>}
          {buckets.map((bucket, index) => {
            // Number keys (Amanda, 2026-11-27; a small part of PRD F11): the first nine buckets get
            // 1 to 9, in the order shown, with the number as a keycap after the name. Not on the end
            // screen's "Go to:" pills.
            const number = !opening && index < 9 ? String(index + 1) : null
            return (
              <button
                key={bucket.id}
                type="button"
                className={`declutter-pill ${tip ? 'is-tip-glow' : ''}`}
                style={bucketStyle(bucket.color)}
                aria-label={opening ? `Open ${bucket.name}` : `Move to ${bucket.name}${number ? `, key ${number}` : ''}`}
                aria-keyshortcuts={number ?? undefined}
                onClick={() => (opening ? onOpenBucket(bucket) : onMove(email, bucket))}
              >
                {bucket.emoji ? (
                  <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span>
                ) : (
                  <span className="bucket-swatch" aria-hidden="true" />
                )}
                {bucket.name}
                {number && (
                  <span className="keycap declutter-pill-key" aria-hidden="true">
                    {number}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {tip}
      </div>
    </div>
  )
}

// The confirmation message sits where the email card was: progress for this day (Flow 7).
// It only says the day is done when no emails were left behind (CLAUDE.md §7).
function EndMessage({ declutter, headingRef }) {
  const { total, range, endTitle, progress, nextRun, actions } = declutter
  // In the order of the title's outcomes: what left the Today list (cleared, then sorted), then
  // what's still in it (Amanda, 2026-11-24). Four or more show as rows, at any width.
  // Moved emails name their buckets (Amanda, 2026-11-24): one bucket, "moved to Priority"; two or
  // three, "moved to buckets" with a line for each below it (shown as rows); four or more, "moved to
  // 4 buckets", with how many went to each on hover or keyboard focus.
  const buckets = progress.movedTo
  const listBuckets = buckets.length >= 2 && buckets.length <= 3
  const movedLabel = buckets.length === 1 ? `moved to ${buckets[0].bucket.name}` : listBuckets ? 'moved to buckets' : `moved to ${buckets.length} buckets`
  const lines = [
    [progress.archived, 'archived'],
    [progress.deleted, 'deleted'],
    [progress.moved, movedLabel, 'moved'],
    [progress.read, 'marked as read'],
    [progress.left, 'still in the Today list'],
  ].filter(([count]) => count > 0)
  const rows = lines.length >= 4 || listBuckets
  // Bucket names show without their emoji or color dot here (Amanda, 2026-11-25)
  // The title fits the range and what was mostly done, and rotates (src/utils/declutterMessages.js).
  // An empty day or week offers the one before, like the end screen's left button (Amanda, 2026-11-24)
  const offerEarlier = total === 0 && range !== 'all' && nextRun
  const earlierName = nextRun && ['Yesterday', 'Last Week'].includes(nextRun.label) ? nextRun.label.toLowerCase() : nextRun?.label

  return (
    <div className="declutter-card declutter-end">
      <h3 className="declutter-end-title" tabIndex={-1} ref={headingRef}>{endTitle}</h3>
      {offerEarlier && (
        <p className="declutter-end-offer">
          <button type="button" className="inline-link" onClick={() => actions.nextRun(nextRun)}>
            Want to see {earlierName}?
          </button>
        </p>
      )}
      {lines.length > 0 && (
        <ul className={`declutter-end-list ${rows ? 'is-rows' : ''}`}>
          {lines.map(([count, label, kind]) => {
            const breakdown = kind === 'moved' && buckets.length >= 4
            return (
              <li
                key={label}
                className={breakdown ? 'has-tooltip has-breakdown' : undefined}
                tabIndex={breakdown ? 0 : undefined}
                aria-describedby={breakdown ? 'declutter-moved-to' : undefined}
              >
                <span className="declutter-end-count">{count}</span>
                <span>{label}</span>
                {breakdown && (
                  <span className="tooltip declutter-end-tip" id="declutter-moved-to" role="tooltip">
                    {buckets.map(({ bucket, count: n }) => (
                      <span key={bucket.id} className="declutter-end-tip-row">
                        {bucket.name}: {n}
                      </span>
                    ))}
                  </span>
                )}
                {kind === 'moved' && listBuckets && (
                  <ul className="declutter-end-buckets">
                    {buckets.map(({ bucket, count: n }) => (
                      <li key={bucket.id}>
                        <span className="declutter-end-count">{n}</span>
                        <span>{bucket.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Declutter (rapid sort; PRD F13, Flow 7): the viewed day's unsorted emails as a rolodex of cards.
// Up and Down move through them, Left archives, Right marks read, 1 to 9 move to a bucket. Escape or the X leaves at any
// time; what's done stays done and the rest stays in the Today list.
export default function Declutter({ declutter, buckets, onSendReply }) {
  const { dayName, total, position, email, openEmail, hasPrevious, nextRun, actions, emailView, suggestion, suggestionActions, showTip } = declutter
  const atEnd = !email
  // The first-time tip's step: 1, 2, or 0 when it's not showing. It's put away on the end screen.
  const [tipStep, setTipStep] = useState(showTip && email ? 1 : 0)
  const tipShowing = tipStep > 0 && !atEnd && !openEmail
  function nextTip() {
    // With no buckets, the bucket step is skipped
    if (tipStep < TIP_STEPS) setTipStep(tipStep === 1 && buckets.length === 0 ? 3 : tipStep + 1)
    else {
      setTipStep(0)
      actions.tipDone()
    }
  }
  useEffect(() => {
    if (tipStep > 0 && atEnd) {
      setTipStep(0)
      actions.tipDone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atEnd])
  // The auto-archive suggestion's review panel (PRD F15), from the end screen
  const [reviewing, setReviewing] = useState(false)
  const reviewOpen = reviewing && atEnd && suggestion?.type === 'archive'
  const screenRef = useRef(null)
  const cardRef = useRef(null)
  const endHeadingRef = useRef(null)
  const titleRef = useRef(null)

  const startPoint = () => (atEnd ? endHeadingRef.current : cardRef.current)

  // Directional motion (BUILD-LOG, 2026-11-13): the card that's leaving slides the way its key
  // points. Archive goes left, Mark as read right, Next up (the next card rises from the stack),
  // Back down; a card sorted into a bucket shrinks away. A copy of the old card plays the exit.
  const direction = useRef(null)
  const shownEmail = useRef(email)
  const [leavingCard, setLeavingCard] = useState(null)
  const go = (way, action) => (...args) => {
    direction.current = way
    action(...args)
  }
  useLayoutEffect(() => {
    const previous = shownEmail.current
    shownEmail.current = email
    if (previous && email && previous.id !== email.id && !prefersReducedMotion()) {
      const key = Date.now()
      setLeavingCard({ email: previous, way: direction.current ?? 'fade', key })
      // A fallback, in case the browser never reports the animation's end
      setTimeout(() => setLeavingCard((card) => (card?.key === key ? null : card)), 400)
    }
    direction.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email?.id])

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
        if (document.querySelector('[role="menu"]') || reviewOpen || event.target.closest?.('.reply-box')) return
        if (openEmail) actions.close()
        else actions.exit()
        return
      }
      // The flow is paused while an email, a menu or the review panel is open
      if (openEmail || reviewOpen || document.querySelector('[role="menu"]')) return

      if (event.key === 'ArrowUp') go('down', actions.previous)()
      else if (event.key === 'ArrowDown' && !atEnd) go('up', actions.next)()
      else if (event.key === 'ArrowLeft' && !atEnd) go('left', actions.archive)(email)
      else if (event.key === 'ArrowRight' && !atEnd) go('right', actions.markRead)(email)
      // 1 to 9 move the email to that bucket (Amanda, 2026-11-27)
      else if (/^[1-9]$/.test(event.key) && !atEnd && buckets[Number(event.key) - 1]) {
        go('away', actions.move)(email, buckets[Number(event.key) - 1])
        if (tipShowing && tipStep === 2) nextTip()
      }
      // On the end screen, a held key from the last card doesn't carry over and leave it
      else if (event.key === 'ArrowLeft' && nextRun && !event.repeat) actions.nextRun(nextRun)
      else if (event.key === 'ArrowRight' && !event.repeat) actions.exit()
      else return
      event.preventDefault()
      actions.keysUsed()
      // Pressing the tip's own keys moves it along
      if (tipShowing && tipStep === 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) nextTip()
      else if (tipShowing && tipStep === 3 && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) nextTip()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  return (
    <section className="declutter" aria-labelledby="declutter-title" ref={screenRef}>
      {/* The same kind of header as the Today card and an opened bucket: the name on the left,
          the count and the X on the right, progress along its bottom edge (BUILD-LOG, 2026-11-13).
          Screen readers also hear the day. */}
      <header className="declutter-header">
        {/* With an email open, a back arrow returns to its card (like Gmail's reading view) */}
        {openEmail && (
          <IconButton label="Back to the card" tooltipAlign="left" onClick={actions.close}>
            <Icon name="arrow_back" size={20} />
          </IconButton>
        )}
        <h2 id="declutter-title" className="declutter-title">
          Declutter<span className="visually-hidden"> {dayName}</span>
        </h2>
        <p className="declutter-count">{atEnd ? 'Complete' : `${position + 1} of ${total}`}</p>
        {/* The X leaves Declutter; while an email is open, the back arrow takes its place */}
        {!openEmail && (
          <IconButton label="Exit Declutter" tooltipAlign="right" onClick={actions.exit}>
            <Icon name="close" size={20} />
          </IconButton>
        )}
        <div className="declutter-progress" aria-hidden="true">
          <span style={{ width: atEnd ? '100%' : `${((position + 1) / total) * 100}%` }} />
        </div>
      </header>

      {/* The toast already says what just happened; this adds where you are now */}
      <p className="visually-hidden" role="status">
        {!atEnd && !openEmail && `${position + 1} of ${total}. ${email.unread ? 'Unread. ' : ''}${email.sender}: ${email.subject}`}
      </p>

          <div className="declutter-stage" hidden={Boolean(openEmail)}>
            <div className="declutter-reader">
              {atEnd ? (
                // The message on a card; the previous card's bottom edge shows above it, where Back
                // goes (Amanda, 2026-11-24)
                <div className={`declutter-deck is-end ${hasPrevious ? 'has-previous' : ''}`}>
                  <EndMessage declutter={declutter} headingRef={endHeadingRef} />
                </div>
              ) : (
                <div className="declutter-deck has-next">
                  <EmailCard
                    email={email}
                    cardRef={cardRef}
                    onOpen={() => actions.open(email)}
                    onReportSpam={emailView.junk}
                  />
                  {leavingCard && (
                    <div
                      key={leavingCard.key}
                      className={`declutter-card-leaving is-${leavingCard.way}`}
                      aria-hidden="true"
                      inert
                      onAnimationEnd={() => setLeavingCard(null)}
                    >
                      <EmailCard email={leavingCard.email} onOpen={() => {}} onReportSpam={() => {}} />
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* The buttons sit where their arrow keys point, in the same place on the end screen */}
            <div className={`declutter-controls ${atEnd ? 'is-end' : ''}`}>
              {/* Buckets at the top, level with the start of the email; the arrow buttons at the
                  bottom, level with the end of the card (BUILD-LOG, 2026-11-13) */}
              {/* The auto-archive suggestion waits for the end screen, at the top of the right column
                  beside the end message, so it doesn't distract while sorting (Amanda, 2026-11-22) */}
              {suggestion && atEnd && <SuggestionBanner suggestion={suggestion} actions={suggestionActions} onReview={() => setReviewing(true)} />}
              {atEnd ? (
                buckets.length > 0 && <BucketBar buckets={buckets} onOpenBucket={actions.openBucket} />
              ) : (
                <BucketBar
                  email={email}
                  buckets={buckets}
                  onMove={(...args) => {
                    go('away', actions.move)(...args)
                    if (tipShowing && tipStep === 2) nextTip()
                  }}
                  tip={tipShowing && tipStep === 2 && buckets.length > 0 ? <KeysTip step={2} onNext={nextTip} /> : null}
                />
              )}
              <div className="declutter-keys">
                {tipShowing && tipStep !== 2 && <KeysTip step={tipStep} onNext={nextTip} />}
                <ArrowButton
                  className="is-up"
                  label="Back"
                  keyName="up"
                  disabled={!hasPrevious}
                  glow={tipShowing && tipStep === 3}
                  onClick={go('down', actions.previous)}
                />
                {atEnd ? (
                  <div className="declutter-end-buttons">
                    {/* The previous day or week with unsorted emails, or the next chunk of All Emails (Stage 21c) */}
                    {nextRun && (
                      <ArrowButton
                        label={nextRun.label}
                        spokenLabel={nextRun.spoken}
                        keyName="left"
                        onClick={() => actions.nextRun(nextRun)}
                      />
                    )}
                    <ArrowButton className="is-done is-main" label="Done" keyName="right" onClick={actions.exit} />
                  </div>
                ) : (
                  <>
                    <ArrowButton className="is-left is-main" label="Archive" keyName="left" glow={tipShowing && tipStep === 1} onClick={(how) => go('left', actions.archive)(email, how)} />
                    <ArrowButton className="is-right is-main" label="Mark as read" keyName="right" glow={tipShowing && tipStep === 1} onClick={(how) => go('right', actions.markRead)(email, how)} />
                    <ArrowButton className="is-down" label="Next" keyName="down" glow={tipShowing && tipStep === 3} onClick={go('up', actions.next)} />
                  </>
                )}
              </div>
            </div>
          </div>
      {reviewOpen && (
        <ArchiveReviewPanel
          suggestion={suggestion}
          onClose={() => setReviewing(false)}
          onArchive={(ids) => {
            setReviewing(false)
            suggestionActions.archive(ids, suggestion.senderEmail, suggestion.name)
          }}
        />
      )}
      {/* An opened email pauses the flow. It opens in place: the header stays, and the email takes
          the room below it, with the card and controls put away until it's closed (BUILD-LOG, 2026-11-13) */}
      {openEmail && (
        <div className="declutter-open-layer">
          <div className="declutter-open">
            <EmailPane
              email={openEmail}
              listIds={[openEmail.id]}
              buckets={buckets}
              emailView={emailView}
              onSendReply={onSendReply}
              titleRef={titleRef}
            />
          </div>
        </div>
      )}
    </section>
  )
}
