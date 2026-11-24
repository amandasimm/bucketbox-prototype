import { useEffect, useRef, useState } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import DashedOutline from './DashedOutline.jsx'
import Icon from './Icon.jsx'

// Shown above the buttons the first time someone uses Archive or Delete, instead of a
// pop-up (BUILD-LOG, 2026-10-29). Nothing happens until they confirm.
const FIRST_USE_NOTES = {
  archive: {
    text: 'Archiving takes these emails off your day. They stay in All Mail and come back if someone replies.',
    confirm: 'Archive',
  },
  delete: {
    text: 'Deleting moves these emails to Trash. You can undo it right after.',
    confirm: 'Delete',
  },
}

// The delete zone (PRD F4): replaces the buttons only while an email is being dragged.
// It deletes, or archives once someone picks "Archive instead" (BUILD-LOG, 2026-10-30).
// Calm gray, not red: nothing alarming (PRD §9).
function DeleteZone({ mode }) {
  const verb = mode === 'archive' ? 'archive' : 'delete'
  const { setNodeRef, isOver } = useDroppable({
    id: 'delete-zone',
    data: { target: { type: 'zone' }, label: `the ${verb} zone` },
  })
  return (
    <div ref={setNodeRef} className={`delete-zone ${isOver ? 'is-over' : ''}`}>
      {/* Drawn as a shape so its dashes can match the bucket drop targets */}
      <DashedOutline className="delete-zone-outline" inset={1} radius={23} />
      <span className="delete-zone-circle">
        <Icon name={verb} size={22} />
      </span>
      Drop here to {verb}
    </div>
  )
}

// What the "act on all" note says (All Emails, brief item 5; Amanda, 2026-11-22): when the selection
// includes emails on other pages, Move / Archive / Delete ask first, like Gmail
const allNote = (kind, count, bucket) =>
  kind === 'move'
    ? { text: `Move all ${count} unsorted emails to ${bucket.name}? This includes emails on other pages.`, confirm: `Move ${count}` }
    : { text: `${kind === 'archive' ? 'Archive' : 'Delete'} all ${count} unsorted emails? This includes emails on other pages.`, confirm: `${kind === 'archive' ? 'Archive' : 'Delete'} ${count}` }

// Move / Archive / Delete for the selected emails (PRD F7).
// Always visible, switched off until something is selected.
// confirmAll: the selection reaches beyond the page on screen (All Emails), so every action asks first.
export default function BulkActions({ selectedCount, buckets, actions, zoneMode, covered = false, confirmAll = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  // The note above the buttons: { kind: 'archive' | 'delete' | 'move', bucket?, all? } or null
  const [pendingNote, setPendingNote] = useState(null)
  const [seenNotes, setSeenNotes] = useState({ archive: false, delete: false })
  const footerRef = useRef(null)
  const menuRef = useRef(null)
  const noteConfirmRef = useRef(null)
  const moveButtonRef = useRef(null)

  // A list hidden behind an opened bucket doesn't show its own delete zone
  const dragActive = useDndContext().active !== null && !covered
  // The zone stays for a moment after the drop, so the envelope has somewhere to land
  const [lingering, setLingering] = useState(false)
  useEffect(() => {
    if (dragActive) {
      setLingering(true)
      return undefined
    }
    const timer = setTimeout(() => setLingering(false), 420)
    return () => clearTimeout(timer)
  }, [dragActive])
  const dragging = dragActive || lingering
  const nothingSelected = selectedCount === 0
  const showNote = pendingNote !== null && !nothingSelected

  // Close the Move list on Escape or a click elsewhere
  useEffect(() => {
    if (!menuOpen) return
    menuRef.current?.querySelector('button')?.focus()
    function onPointerDown(event) {
      if (!footerRef.current.contains(event.target)) setMenuOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        moveButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (showNote) noteConfirmRef.current?.focus()
  }, [showNote])

  // Losing the selection (Declutter clears it) closes them too, so they can't reappear later
  useEffect(() => {
    if (!nothingSelected) return
    setMenuOpen(false)
    setPendingNote(null)
  }, [nothingSelected])

  // A drag closes the Move list and any first-use note
  useEffect(() => {
    if (!dragging) return
    setMenuOpen(false)
    setPendingNote(null)
  }, [dragging])

  if (dragging) {
    return (
      <footer className="bulk-actions">
        <DeleteZone mode={zoneMode} />
      </footer>
    )
  }

  function startAction(kind, bucket) {
    setMenuOpen(false)
    if (confirmAll) setPendingNote({ kind, bucket, all: true })
    else if (kind === 'move') actions.move(bucket)
    else if (seenNotes[kind]) actions[kind]()
    else setPendingNote({ kind })
  }

  function confirmNote() {
    const { kind, bucket } = pendingNote
    if (kind !== 'move') setSeenNotes({ ...seenNotes, [kind]: true })
    if (kind === 'move') actions.move(bucket)
    else actions[kind]()
    setPendingNote(null)
  }

  const note = pendingNote && (pendingNote.all ? allNote(pendingNote.kind, selectedCount, pendingNote.bucket) : FIRST_USE_NOTES[pendingNote.kind])

  return (
    <footer className="bulk-actions" ref={footerRef}>
      {showNote && (
        <div
          className="first-use-note"
          role="group"
          aria-label={`About ${note.confirm}`}
          onKeyDown={(event) => event.key === 'Escape' && setPendingNote(null)}
        >
          <p>{note.text}</p>
          <div className="first-use-note-buttons">
            <button type="button" className="text-button" onClick={() => setPendingNote(null)}>
              Cancel
            </button>
            <button type="button" className="filled-button" ref={noteConfirmRef} onClick={confirmNote}>
              {pendingNote.all ? note.confirm : `${note.confirm} ${selectedCount}`}
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="move-menu" role="menu" aria-label="Move to" ref={menuRef}>
          <p className="move-menu-title" aria-hidden="true">Move to</p>
          {buckets.length === 0 && <p className="move-menu-empty">No buckets yet</p>}
          {buckets.map((bucket) => (
            <button
              key={bucket.id}
              type="button"
              role="menuitem"
              className="move-menu-item"
              onClick={() => startAction('move', bucket)}
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

      <button
        type="button"
        className="bulk-button is-move has-tooltip"
        ref={moveButtonRef}
        disabled={nothingSelected}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => {
          setPendingNote(null)
          setMenuOpen(!menuOpen)
        }}
      >
        <Icon name="drive_file_move" size={20} />
        <span className="bulk-label">Move</span>
        <span className="tooltip bulk-tip" aria-hidden="true">Move</span>
      </button>
      <button type="button" className="bulk-button is-archive has-tooltip" disabled={nothingSelected} onClick={() => startAction('archive')}>
        <Icon name="archive" size={20} />
        <span className="bulk-label">Archive</span>
        <span className="tooltip bulk-tip" aria-hidden="true">Archive</span>
      </button>
      <button type="button" className="bulk-button is-delete has-tooltip" disabled={nothingSelected} onClick={() => startAction('delete')}>
        <Icon name="delete" size={20} />
        <span className="bulk-label">Delete</span>
        <span className="tooltip bulk-tip" aria-hidden="true">Delete</span>
      </button>
    </footer>
  )
}
