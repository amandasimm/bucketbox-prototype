import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import { RulesPreview } from './RulesPanel.jsx'

// Auto-archive suggestions in Declutter (PRD F15; brief item 2; BUILD-LOG 2026-11-22). A calm
// gray-blue banner on Declutter's end screen only, at the top of the right column beside the end
// message (Amanda: on the card screen it was too distracting). Two forms:
// - archive: "You archived several emails from Chase recently. Would you like to tidy up the other
//   31 emails from Chase in your inbox?" with Review & Archive and a text button, Don't suggest
//   this for Chase
// - collect (after archiving): "Automatically collect future emails from Chase in a bucket?" with
//   Create a Chase bucket
// Both close with an X in the top right (not again this run), and use a lightbulb icon, for
// "here's an idea" (Amanda, 2026-11-22).
export function SuggestionBanner({ suggestion, actions, onReview }) {
  const { type, name, senderEmail } = suggestion
  // An X in the top right closes it for this Declutter run (Amanda, 2026-11-22: in place of "Not
  // now" and "No thanks", so the buttons below don't compete)
  const close = (
    <span className="suggestion-close">
      {/* Named "Dismiss" for screen readers, with no hover label (Amanda, 2026-11-22) */}
      <IconButton label="Dismiss" tooltip={null} onClick={() => actions.notNow(senderEmail)}>
        <Icon name="close" size={20} />
      </IconButton>
    </span>
  )
  if (type === 'collect') {
    return (
      <section className="suggestion-banner" aria-label="Suggestion">
        <div className="suggestion-top">
          <p className="suggestion-text">
            <Icon name="lightbulb" size={20} />
            <span>Automatically collect future emails from {name} in a bucket?</span>
          </p>
          {close}
        </div>
        <div className="suggestion-buttons">
          <button type="button" className="filled-button" onClick={() => actions.createBucket(senderEmail, name)}>
            Create a {name} bucket
          </button>
        </div>
      </section>
    )
  }
  const count = suggestion.unsorted.length
  return (
    <section className="suggestion-banner" aria-label="Suggestion">
      <div className="suggestion-top">
        <p className="suggestion-text">
          <Icon name="lightbulb" size={20} />
          <span>
            You archived several emails from {name} recently. Would you like to tidy up the other {count} {count === 1 ? 'email' : 'emails'} from {name} in your inbox?
          </span>
        </p>
        {close}
      </div>
      {/* One main action and a text-only one (Amanda, 2026-11-22) */}
      <div className="suggestion-buttons">
        <button type="button" className="filled-button" onClick={onReview}>
          Review &amp; Archive
        </button>
        <button type="button" className="text-button" onClick={() => actions.hide(senderEmail, name)}>
          Don't suggest this for {name}
        </button>
      </div>
    </section>
  )
}

// "Review & Archive": a panel that slides in over Declutter (Amanda), with the same list as the
// rules panel's "Already in your inbox": the sender's unsorted emails from any day, 10 to a page,
// none selected to start, Select all. "Archive 3" archives the chosen ones (one step; Undo brings
// them back). Cancel, the X or Escape closes it without archiving.
export function ArchiveReviewPanel({ suggestion, onArchive, onClose }) {
  const { name, unsorted } = suggestion
  const [selectedIds, setSelectedIds] = useState([])
  const selected = selectedIds.filter((id) => unsorted.some((email) => email.id === id))
  const panelRef = useRef(null)
  const titleRef = useRef(null)
  const ids = useId()

  // Open: the heading takes focus. Close: focus goes back to Review & Archive (or the screen).
  useEffect(() => {
    const opener = document.activeElement
    titleRef.current?.focus({ preventScroll: true })
    return () => setTimeout(() => (opener?.isConnected ? opener.focus() : null), 0)
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return (
    <aside
      ref={panelRef}
      className="rules-panel archive-review"
      // Not about a bucket, so neutral gray-blue instead of a bucket's colors
      style={{ '--bucket-color': 'var(--card-stroke)', '--bucket-header': 'var(--md-sys-color-surface-container)' }}
      aria-labelledby={`${ids}-title`}
    >
      <header className="rules-panel-header">
        <Icon name="archive" size={20} />
        <h2 id={`${ids}-title`} className="rules-panel-title" tabIndex={-1} ref={titleRef}>
          Tidy up emails from {name}
        </h2>
        <IconButton label="Close without archiving" tooltip="Close" tooltipAlign="right" onClick={onClose}>
          <Icon name="close" size={20} />
        </IconButton>
      </header>
      <div className="rules-panel-scroll">
        <RulesPreview
          matches={unsorted}
          selected={selected}
          title="Already in your inbox"
          hint={`${unsorted.length} unsorted ${unsorted.length === 1 ? 'email' : 'emails'} from ${name}. Select the ones to archive. You can undo this.`}
          onToggle={(id) => setSelectedIds(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])}
          onSelectAll={(all) => setSelectedIds(all ? unsorted.map((email) => email.id) : [])}
        />
      </div>
      <footer className="rules-panel-footer">
        <button type="button" className="text-button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="filled-button" disabled={selected.length === 0} onClick={() => onArchive(selected)}>
          {selected.length === 0 ? 'Archive' : `Archive ${selected.length}`}
        </button>
      </footer>
    </aside>
  )
}
