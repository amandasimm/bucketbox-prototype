import EmailRow from './EmailRow.jsx'
import Icon from './Icon.jsx'
import { newestFirst } from '../utils/dates.js'

// A collapsed bucket: color dot, name, small count, and a scrolling peek of its emails (PRD F2).
function BucketTile({ bucket, emails }) {
  const bucketEmails = emails
    .filter((email) => email.bucketId === bucket.id && email.removedTo === null)
    .sort(newestFirst)

  return (
    <article
      className="bucket-tile"
      style={{ '--bucket-color': bucket.color }}
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
