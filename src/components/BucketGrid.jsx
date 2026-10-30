import { useDndContext, useDroppable } from '@dnd-kit/core'
import DashedOutline from './DashedOutline.jsx'
import EmailRow from './EmailRow.jsx'
import Icon from './Icon.jsx'
import { newestFirst } from '../utils/dates.js'

// A collapsed bucket: color dot, name, small count, and a scrolling peek of its emails (PRD F2).
// While an email is being dragged, the tile shows Amanda's drop-target design: a dashed
// outline and light see-through tint in the bucket's own color, a "+" and the bucket name.
// The tile under the pointer switches to a stronger, solid version (BUILD-LOG, 2026-10-30).
function BucketTile({ bucket, emails }) {
  const { active } = useDndContext()
  // An email can't be dropped back into the bucket it came from
  const isSource = active?.data.current?.email.bucketId === bucket.id
  const showTarget = active !== null && !isSource
  const { setNodeRef, isOver } = useDroppable({
    id: `bucket:${bucket.id}`,
    disabled: isSource,
    data: { target: { type: 'bucket', bucket }, label: `${bucket.name} bucket` },
  })
  const bucketEmails = emails
    .filter((email) => email.bucketId === bucket.id && email.removedTo === null)
    .sort(newestFirst)

  // The target sits on a wrapper around the tile (not inside it), so it can cover the tile's
  // border and rounded corners exactly instead of being clipped inside them
  return (
    <div ref={setNodeRef} className="bucket-slot" style={{ '--bucket-color': bucket.color }}>
      <article
        className={`bucket-tile ${showTarget ? 'is-drop-target' : ''}`}
        aria-labelledby={`bucket-${bucket.id}`}
      >
        <header className="bucket-header">
          <span className="bucket-swatch" style={{ background: bucket.color }} aria-hidden="true" />
          <h3 id={`bucket-${bucket.id}`} className="bucket-name">{bucket.name}</h3>
          <span className="bucket-count" aria-label={`${bucketEmails.length} emails`}>
            {bucketEmails.length}
          </span>
        </header>
        <ul className="email-list bucket-peek">
          {bucketEmails.map((email) => (
            <EmailRow key={email.id} email={email} inBucket />
          ))}
        </ul>
      </article>
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

export default function BucketGrid({ buckets, emails }) {
  return (
    <section className="buckets" aria-label="Buckets">
      <div className="bucket-grid">
        {buckets.map((bucket) => (
          <BucketTile key={bucket.id} bucket={bucket} emails={emails} />
        ))}
      </div>
      <button type="button" className="add-bucket-button">
        <Icon name="add" size={20} />
        Add a Bucket
      </button>
    </section>
  )
}
