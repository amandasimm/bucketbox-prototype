import { useEffect, useRef, useState } from 'react'
import BucketForm from './BucketForm.jsx'
import { BucketMenu } from './BucketGrid.jsx'
import BucketStrip from './BucketStrip.jsx'
import DeleteBucketDialog from './DeleteBucketDialog.jsx'
import BulkActions from './BulkActions.jsx'
import EmailPane from './EmailPane.jsx'
import EmailRow from './EmailRow.jsx'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import { bucketStyle } from '../utils/bucketColors.js'
import { newestFirst } from '../utils/dates.js'

// One bucket opened up (PRD §5 bucket view, Flow 6; sketch-bucket-view.png): a card that sits
// 16px inside the page, over the home page, so the Today card and buckets just show around it.
// The colored header matches the bucket's tile (dot or emoji, name, count), with its 3-dot menu
// and an X to close on the right. Its emails are on the left, one email open on the right.
// The list works like Today: checkboxes, Select all, Move / Archive / Delete (BUILD-LOG, 2026-10-30).
// With nothing chosen yet, the top email shows but stays unread until it's clicked into (PRD F5).
export default function BucketView({
  bucket,
  emails,
  buckets,
  selectedIds,
  onSelect,
  actions,
  zoneMode,
  emailView,
  onSendReply,
  bucketActions,
}) {
  const bucketEmails = emails
    .filter((email) => email.bucketId === bucket.id && email.removedTo === null)
    .sort(newestFirst)
  const listIds = bucketEmails.map((email) => email.id)
  const chosen = bucketEmails.find((email) => email.id === emailView.openEmailId)
  const shown = chosen ?? bucketEmails[0] ?? null
  const closeRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Same as on the home page: an empty bucket deletes straight away, otherwise ask where
  // its emails go (PRD F2). Either way the view closes, since the bucket is gone.
  function startDelete() {
    setEditing(false)
    if (bucketEmails.length === 0) bucketActions.remove(bucket, { type: 'archive' })
    else setDeleting(true)
  }

  const selectedHere = selectedIds.filter((id) => listIds.includes(id))
  const allSelected = bucketEmails.length > 0 && selectedHere.length === bucketEmails.length
  const someSelected = selectedHere.length > 0 && !allSelected
  const selectAllRef = useRef(null)
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  // Opening the bucket puts keyboard focus on its X, at the top of the new view
  useEffect(() => {
    closeRef.current?.querySelector('button')?.focus()
  }, [bucket.id])

  // Closing returns keyboard focus to the bucket's tile on the home page (BUILD-LOG, 2026-10-31)
  function close() {
    emailView.closeBucket()
    setTimeout(() => {
      document.querySelector(`#bucket-${bucket.id} .bucket-header-button`)?.focus()
    }, 0)
  }

  // Escape closes the bucket, unless something inside it is open first (a menu, the edit
  // form, a dialog, a reply or the compose drawer), which Escape closes instead
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const busy =
        document.querySelector('[role="menu"], dialog[open], .bucket-view-edit, .emoji-popover, .day-picker') ||
        event.target.closest?.('.reply-box, .compose-drawer, form')
      if (!busy) close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  function toggle(id) {
    onSelect(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <section className="bucket-view" style={bucketStyle(bucket.color)} aria-labelledby="bucket-view-name">
      <header className="bucket-view-header">
        {bucket.emoji ? (
          <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span>
        ) : (
          <span className="bucket-swatch" aria-hidden="true" />
        )}
        <h2 id="bucket-view-name" className="bucket-view-name">{bucket.name}</h2>
        <span className="bucket-count" aria-label={`${bucketEmails.length} emails`}>
          {bucketEmails.length}
        </span>
        {/* While dragging, the other buckets appear here as drop targets */}
        <span className="bucket-view-strip">
          <BucketStrip buckets={buckets} currentBucketId={bucket.id} />
        </span>
        <BucketMenu bucket={bucket} onEdit={() => setEditing(true)} onDelete={startDelete} />
        <span ref={closeRef}>
          <IconButton label="Close bucket" tooltipAlign="right" onClick={close}>
            <Icon name="close" size={20} />
          </IconButton>
        </span>
        {/* Edit opens the same form as on the home page, dropping down from the header */}
        {editing && (
          <div className="bucket-view-edit" style={bucketStyle(bucket.color)}>
            <BucketForm
              mode="edit"
              initial={bucket}
              otherNames={buckets.filter((b) => b.id !== bucket.id).map((b) => b.name)}
              onSave={(values) => {
                bucketActions.edit(bucket.id, values)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
              onDelete={startDelete}
            />
          </div>
        )}
      </header>
      {deleting && (
        <DeleteBucketDialog
          bucket={bucket}
          emailCount={bucketEmails.length}
          otherBuckets={buckets.filter((b) => b.id !== bucket.id)}
          onConfirm={(destination) => bucketActions.remove(bucket, destination)}
          onClose={() => setDeleting(false)}
        />
      )}

      <div className="bucket-view-body">
        <section className="bucket-view-list" aria-label={`${bucket.name} emails`}>
          {bucketEmails.length > 0 ? (
            <>
              <div className="list-toolbar">
                <label className="select-all">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="email-checkbox"
                    checked={allSelected}
                    onChange={() => onSelect(allSelected ? [] : listIds)}
                  />
                  {selectedHere.length > 0 ? `${selectedHere.length} selected` : 'Select all'}
                </label>
              </div>
              <ul className="email-list">
                {bucketEmails.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    variant="bucket"
                    selected={selectedIds.includes(email.id)}
                    isOpen={shown?.id === email.id}
                    onToggleSelected={() => toggle(email.id)}
                    onOpen={() => emailView.open(email.id)}
                  />
                ))}
              </ul>
            </>
          ) : (
            <div className="empty-state" role="status">
              <p>This bucket is empty.</p>
            </div>
          )}
          <BulkActions
            selectedCount={selectedHere.length}
            buckets={buckets.filter((b) => b.id !== bucket.id)}
            actions={actions}
            zoneMode={zoneMode}
          />
        </section>

        <div className="bucket-view-pane">
          {shown && (
            <EmailPane
              email={shown}
              listIds={listIds}
              buckets={buckets}
              emailView={emailView}
              onSendReply={onSendReply}
              onContentPointerDown={() => shown.unread && emailView.markRead(shown.id)}
            />
          )}
        </div>
      </div>
    </section>
  )
}
