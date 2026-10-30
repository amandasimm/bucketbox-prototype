import { useEffect, useRef, useState } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import BucketForm from './BucketForm.jsx'
import DashedOutline from './DashedOutline.jsx'
import DeleteBucketDialog from './DeleteBucketDialog.jsx'
import EmailRow from './EmailRow.jsx'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import { bucketStyle } from '../utils/bucketColors.js'
import { newestFirst } from '../utils/dates.js'

// The bucket's 3-dot menu: Edit bucket and Delete bucket (PRD F2)
export function BucketMenu({ bucket, onEdit, onDelete }) {
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
        setOpen(false)
        wrapRef.current.querySelector('.icon-button')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="bucket-menu-wrap" ref={wrapRef}>
      <IconButton
        label={`Options for the ${bucket.name} bucket`}
        tooltip="Bucket options"
        tooltipAlign="right"
        onClick={() => setOpen(!open)}
      >
        <Icon name="more_vert" size={20} />
      </IconButton>
      {open && (
        <div className="bucket-menu" role="menu" aria-label={`${bucket.name} bucket`} ref={menuRef}>
          <button
            type="button"
            role="menuitem"
            className="move-menu-item"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            <Icon name="edit" size={20} />
            Edit bucket
          </button>
          <button
            type="button"
            role="menuitem"
            className="move-menu-item"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            <Icon name="delete" size={20} />
            Delete bucket
          </button>
        </div>
      )}
    </div>
  )
}

// A collapsed bucket: color dot, name, small count, 3-dot menu, and a scrolling peek of its emails (PRD F2).
// While an email is being dragged, the tile shows Amanda's drop-target design: a dashed
// outline and light see-through tint in the bucket's own color, a "+" and the bucket name.
// The tile under the pointer switches to a stronger, solid version (BUILD-LOG, 2026-10-30).
function BucketTile({ bucket, bucketEmails, editing, children, onEdit, onDelete, onOpenBucket, covered }) {
  const { active } = useDndContext()
  // An email can't be dropped back into the bucket it came from
  const isSource = active?.data.current?.email.bucketId === bucket.id
  // Tiles behind an opened bucket stay out of the way while dragging inside it
  const showTarget = active !== null && !isSource && !covered
  const { setNodeRef, isOver } = useDroppable({
    id: `bucket:${bucket.id}`,
    disabled: isSource || covered,
    data: { target: { type: 'bucket', bucket }, label: `${bucket.name} bucket` },
  })

  // The target sits on a wrapper around the tile (not inside it), so it can cover the tile's
  // border and rounded corners exactly instead of being clipped inside them
  return (
    <div ref={setNodeRef} className="bucket-slot" style={bucketStyle(bucket.color)}>
      {editing ? (
        children
      ) : (
        <>
          <article
            className={`bucket-tile ${showTarget ? 'is-drop-target' : ''}`}
            aria-labelledby={`bucket-${bucket.id}`}
          >
            {/* The whole colored header (dot or emoji, name, count) opens the bucket, but not
                the 3-dot menu, which sits on top of it (PRD §5 bucket view; BUILD-LOG, 2026-10-30) */}
            <header className="bucket-header">
              <h3 id={`bucket-${bucket.id}`} className="bucket-header-title">
                <button
                  type="button"
                  className="bucket-header-button"
                  aria-label={`Open the ${bucket.name} bucket, ${bucketEmails.length} emails`}
                  onClick={() => onOpenBucket(bucket.id)}
                >
                  {/* An emoji, if the bucket has one, takes the color dot's place */}
                  {bucket.emoji ? (
                    <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span>
                  ) : (
                    <span className="bucket-swatch" aria-hidden="true" />
                  )}
                  <span className="bucket-name">{bucket.name}</span>
                  <span className="bucket-count">{bucketEmails.length}</span>
                </button>
              </h3>
            </header>
            <ul className="email-list bucket-peek">
              {bucketEmails.map((email) => (
                <EmailRow
                  key={email.id}
                  email={email}
                  variant="tile"
                  onOpen={() => onOpenBucket(bucket.id, email.id)}
                />
              ))}
            </ul>
          </article>
          <BucketMenu bucket={bucket} onEdit={onEdit} onDelete={onDelete} />
        </>
      )}
      {showTarget && (
        <div className={`drop-target ${isOver ? 'is-over' : ''}`} aria-hidden="true">
          <DashedOutline className="drop-target-outline" inset={1.5} radius={10.5} />
          <span className="drop-target-plus">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <path d="M14 2v24M2 14h24" />
            </svg>
          </span>
          <span className="drop-target-name">{bucket.name}</span>
        </div>
      )}
    </div>
  )
}

export default function BucketGrid({ buckets, emails, bucketActions, onOpenBucket, covered = false }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleting, setDeleting] = useState(null) // the bucket whose confirmation is open
  const addButtonRef = useRef(null)
  const gridRef = useRef(null)
  const bucketCount = useRef(buckets.length)

  // A newly added bucket scrolls into view, so it doesn't appear cut off below the fold
  useEffect(() => {
    if (buckets.length > bucketCount.current) {
      const tiles = gridRef.current?.querySelectorAll('.bucket-slot:not(.add-bucket-slot)')
      tiles?.[tiles.length - 1]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    bucketCount.current = buckets.length
  }, [buckets.length])

  // Wait a moment so the button is visible again before focusing it
  const focusAddButton = () => setTimeout(() => addButtonRef.current?.focus(), 0)

  const emailsIn = (bucket) =>
    emails.filter((email) => email.bucketId === bucket.id && email.removedTo === null).sort(newestFirst)
  const namesExcept = (id) => buckets.filter((bucket) => bucket.id !== id).map((bucket) => bucket.name)

  // An empty bucket deletes straight away; one with emails asks where they go first (PRD F2)
  function startDelete(bucket) {
    setEditingId(null)
    if (emailsIn(bucket).length === 0) {
      bucketActions.remove(bucket, { type: 'archive' })
      focusAddButton()
    } else {
      setDeleting(bucket)
    }
  }

  return (
    <section className="buckets" aria-label="Buckets">
      {buckets.length === 0 && !adding && (
        <p className="buckets-empty">Make your first bucket to start sorting.</p>
      )}
      <div className="bucket-grid" ref={gridRef}>
        {buckets.map((bucket) => (
          <BucketTile
            key={bucket.id}
            bucket={bucket}
            bucketEmails={emailsIn(bucket)}
            editing={editingId === bucket.id}
            onEdit={() => setEditingId(bucket.id)}
            onDelete={() => startDelete(bucket)}
            onOpenBucket={onOpenBucket}
            covered={covered}
          >
            {editingId === bucket.id && (
              <BucketForm
                mode="edit"
                initial={bucket}
                otherNames={namesExcept(bucket.id)}
                onSave={(values) => {
                  bucketActions.edit(bucket.id, values)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
                onDelete={() => startDelete(bucket)}
              />
            )}
          </BucketTile>
        ))}
        {adding && (
          <div className="bucket-slot">
            <BucketForm
              mode="add"
              otherNames={namesExcept(null)}
              onSave={(values) => {
                bucketActions.add(values)
                setAdding(false)
                focusAddButton()
              }}
              onCancel={() => {
                setAdding(false)
                focusAddButton()
              }}
            />
          </div>
        )}
        {/* Sits where the next bucket would go, centered in that space. Hidden while the
            new-bucket form is open, so there's only one way in at a time. */}
        {!adding && (
          <div className="bucket-slot add-bucket-slot">
            <button
              ref={addButtonRef}
              type="button"
              className="add-bucket-button"
              onClick={() => {
                setEditingId(null)
                setAdding(true)
              }}
            >
              <Icon name="add" size={20} />
              Add a Bucket
            </button>
          </div>
        )}
      </div>

      {deleting && (
        <DeleteBucketDialog
          bucket={deleting}
          emailCount={emailsIn(deleting).length}
          otherBuckets={buckets.filter((bucket) => bucket.id !== deleting.id)}
          onConfirm={(destination) => {
            bucketActions.remove(deleting, destination)
            setDeleting(null)
            focusAddButton()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}
