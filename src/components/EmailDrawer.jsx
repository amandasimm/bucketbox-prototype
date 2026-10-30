import { useEffect, useRef } from 'react'
import EmailPane from './EmailPane.jsx'

// Places a click doesn't count as "outside the drawer": the Today list (so another email can be
// opened), undo/redo, toasts, menus, and Gmail's compose drawer
const STAYS_OPEN = '.email-drawer, .today-list, .page-history, .toast-region, [role="menu"], .compose-drawer, .emoji-popover'

// An email opened from the Today list (PRD §5, F5; sketch-click-email-from-today.png).
// It slides out over the buckets but stops short of the right edge, so the buckets still show.
// The X, Escape, or a click outside it closes it.
export default function EmailDrawer({ email, listIds, buckets, emailView, onSendReply }) {
  const drawerRef = useRef(null)
  const titleRef = useRef(null)

  // Move keyboard focus to the email whenever a different one opens
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [email.id])

  useEffect(() => {
    function close() {
      emailView.close()
      // Hand focus back to the email's row, so keyboard users land where they were
      setTimeout(() => document.querySelector(`[data-email-id="${email.id}"] .email-row-body`)?.focus(), 0)
    }
    function onPointerDown(event) {
      if (!event.target.closest(STAYS_OPEN)) emailView.close()
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      // Escape closes an open menu or the compose drawer first
      if (document.querySelector('[role="menu"]') || event.target.closest?.('.compose-drawer, .reply-box')) return
      close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [email.id, emailView])

  return (
    <div className="email-drawer" ref={drawerRef}>
      <EmailPane
        email={email}
        listIds={listIds}
        buckets={buckets}
        emailView={emailView}
        onSendReply={onSendReply}
        titleRef={titleRef}
        onClose={() => {
          emailView.close()
          setTimeout(() => document.querySelector(`[data-email-id="${email.id}"] .email-row-body`)?.focus(), 0)
        }}
      />
    </div>
  )
}
