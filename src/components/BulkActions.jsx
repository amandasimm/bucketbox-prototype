import { useEffect, useRef, useState } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
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
      <span className="delete-zone-circle">
        <Icon name={verb} size={22} />
      </span>
      Drop here to {verb}
    </div>
  )
}

// Move / Archive / Delete for the selected emails (PRD F7).
// Always visible, switched off until something is selected.
export default function BulkActions({ selectedCount, buckets, actions, zoneMode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingNote, setPendingNote] = useState(null) // 'archive' | 'delete' | null
  const [seenNotes, setSeenNotes] = useState({ archive: false, delete: false })
  const footerRef = useRef(null)
  const menuRef = useRef(null)
  const noteConfirmRef = useRef(null)
  const moveButtonRef = useRef(null)

  const dragging = useDndContext().active !== null
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

  function startAction(kind) {
    setMenuOpen(false)
    if (seenNotes[kind]) actions[kind]()
    else setPendingNote(kind)
  }

  function confirmNote() {
    setSeenNotes({ ...seenNotes, [pendingNote]: true })
    actions[pendingNote]()
    setPendingNote(null)
  }

  return (
    <footer className="bulk-actions" ref={footerRef}>
      {showNote && (
        <div
          className="first-use-note"
          role="group"
          aria-label={`About ${FIRST_USE_NOTES[pendingNote].confirm}`}
          onKeyDown={(event) => event.key === 'Escape' && setPendingNote(null)}
        >
          <p>{FIRST_USE_NOTES[pendingNote].text}</p>
          <div className="first-use-note-buttons">
            <button type="button" className="text-button" onClick={() => setPendingNote(null)}>
              Cancel
            </button>
            <button type="button" className="filled-button" ref={noteConfirmRef} onClick={confirmNote}>
              {FIRST_USE_NOTES[pendingNote].confirm} {selectedCount}
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
              onClick={() => {
                setMenuOpen(false)
                actions.move(bucket)
              }}
            >
              <span className="bucket-swatch" style={{ background: bucket.color }} aria-hidden="true" />
              {bucket.name}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="bulk-button"
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
        Move
      </button>
      <button type="button" className="bulk-button" disabled={nothingSelected} onClick={() => startAction('archive')}>
        <Icon name="archive" size={20} />
        Archive
      </button>
      <button type="button" className="bulk-button" disabled={nothingSelected} onClick={() => startAction('delete')}>
        <Icon name="delete" size={20} />
        Delete
      </button>
    </footer>
  )
}
