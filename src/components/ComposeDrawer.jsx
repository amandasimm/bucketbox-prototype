import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'

// Gmail's compose drawer, bottom right (PRD §5; screenshot-gmail-compose.png and
// screenshot-gmail-compose-collapsed-hover.png). Opened by the nav's Compose button, for new
// messages only; replies happen in place under the email (BUILD-LOG, 2026-10-30).
// It can be minimized to a bar, so people can keep working behind it. Send closes it with a
// toast and never sends anything anywhere (CLAUDE.md §5; BUILD-LOG, 2026-10-30).
export default function ComposeDrawer({ composeActions }) {
  const { compose } = composeActions
  const ids = useId()
  const toRef = useRef(null)
  const bodyRef = useRef(null)
  const [showError, setShowError] = useState(false)
  const title = compose.subject.trim() || 'New Message'

  // Start in To when the drawer opens or is expanded again (not on every keystroke)
  useEffect(() => {
    if (!compose.minimized) toRef.current?.focus()
  }, [compose.minimized])

  function send(event) {
    event.preventDefault()
    if (!compose.to.trim()) {
      setShowError(true)
      toRef.current?.focus()
      return
    }
    composeActions.send()
  }

  if (compose.minimized) {
    return (
      <div className="compose-drawer is-minimized" role="dialog" aria-label={title}>
        <button
          type="button"
          className="compose-bar"
          onClick={() => composeActions.update({ minimized: false })}
          aria-label={`${title}, open`}
        >
          <span className="compose-title">{title}</span>
        </button>
        <IconButton label="Open" onClick={() => composeActions.update({ minimized: false })}>
          <Icon name="open_in_full" size={18} />
        </IconButton>
        <IconButton label="Save and close" tooltipAlign="right" onClick={composeActions.close}>
          <Icon name="close" size={18} />
        </IconButton>
      </div>
    )
  }

  return (
    <form className="compose-drawer" role="dialog" aria-label={title} onSubmit={send}>
      <header className="compose-header">
        <span className="compose-title">{title}</span>
        <IconButton label="Minimize" onClick={() => composeActions.update({ minimized: true })}>
          <Icon name="minimize" size={18} />
        </IconButton>
        <IconButton label="Save and close" tooltipAlign="right" onClick={composeActions.close}>
          <Icon name="close" size={18} />
        </IconButton>
      </header>

      <div className="compose-fields">
        <div className={`text-field ${showError ? 'has-error' : ''}`}>
          <input
            ref={toRef}
            id={`${ids}-to`}
            className="text-field-input"
            value={compose.to}
            placeholder=" "
            autoComplete="off"
            aria-invalid={showError}
            aria-describedby={showError ? `${ids}-error` : undefined}
            onChange={(event) => {
              setShowError(false)
              composeActions.update({ to: event.target.value })
            }}
          />
          <label className="text-field-label" htmlFor={`${ids}-to`}>
            To
          </label>
        </div>
        {showError && (
          <p id={`${ids}-error`} className="bucket-form-error compose-error">
            <Icon name="error" size={16} />
            Add at least one recipient.
          </p>
        )}
        <div className="text-field">
          <input
            id={`${ids}-subject`}
            className="text-field-input"
            value={compose.subject}
            placeholder=" "
            autoComplete="off"
            onChange={(event) => composeActions.update({ subject: event.target.value })}
          />
          <label className="text-field-label" htmlFor={`${ids}-subject`}>
            Subject
          </label>
        </div>
        <textarea
          ref={bodyRef}
          className="compose-body"
          aria-label="Message"
          value={compose.body}
          onChange={(event) => composeActions.update({ body: event.target.value })}
        />
      </div>

      <footer className="compose-footer">
        <button type="submit" className="filled-button compose-send">
          Send
        </button>
        <IconButton label="Discard draft" tooltipAlign="right" onClick={composeActions.close}>
          <Icon name="delete" size={20} />
        </IconButton>
      </footer>
    </form>
  )
}
