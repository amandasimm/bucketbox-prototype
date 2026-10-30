import Icon from './Icon.jsx'
import InertButton from './InertButton.jsx'
import { formatShortDate, formatTime, newestFirst } from '../utils/dates.js'
import { inkOn } from '../utils/bucketColors.js'
import './GmailInbox.css'

// Today's emails show the time, older ones the date, like Gmail
function receivedLabel(email) {
  return email.dayOffset === 0 ? formatTime(email.receivedAt) : formatShortDate(email.receivedAt)
}

// The plain Gmail inbox, shown when Bucketbox is switched off (PRD §5 toggle; BUILD-LOG,
// 2026-10-28 and 2026-10-30). Look-only: a familiar comparison point. It lists every email
// that hasn't been archived or deleted, from every day, newest first, in Gmail's one-line rows.
// Bucketed emails show their bucket as a label chip, since buckets work like Gmail labels.
// Anything done in Bucketbox (archive, move, read) shows up here.
export default function GmailInbox({ emails, buckets }) {
  const inbox = emails.filter((email) => email.removedTo === null).sort(newestFirst)
  const bucketById = Object.fromEntries(buckets.map((bucket) => [bucket.id, bucket]))

  return (
    <section className="gmail-inbox" aria-label="Inbox">
      <div className="gmail-inbox-toolbar">
        <InertButton label="Select" className="gmail-inbox-select">
          <Icon name="check_box_outline_blank" size={20} />
          <Icon name="arrow_drop_down" size={18} />
        </InertButton>
        <InertButton label="Refresh" className="icon-button">
          <Icon name="refresh" size={20} />
        </InertButton>
        <InertButton label="More" className="icon-button">
          <Icon name="more_vert" size={20} />
        </InertButton>
        <span className="gmail-inbox-range">
          1–{inbox.length} of {inbox.length}
        </span>
        <InertButton label="Newer" className="icon-button">
          <Icon name="chevron_left" size={20} />
        </InertButton>
        <InertButton label="Older" className="icon-button" tooltipAlign="right">
          <Icon name="chevron_right" size={20} />
        </InertButton>
      </div>

      <ul className="gmail-inbox-list">
        {inbox.map((email) => {
          const bucket = bucketById[email.bucketId]
          const threadSize = email.messages?.length ?? 1
          return (
            <li key={email.id}>
              <InertButton
                label={`${email.unread ? 'Unread. ' : ''}${email.sender}: ${email.subject}`}
                className={`gmail-inbox-row ${email.unread ? 'is-unread' : 'is-read'}`}
                nameOnHover={false}
              >
                <span className="gmail-inbox-row-main">
                  <Icon name="check_box_outline_blank" size={20} />
                  <Icon name="star" size={20} />
                  <span className="gmail-inbox-sender">
                    {email.sender}
                    {threadSize > 1 && <span className="gmail-inbox-count">{threadSize}</span>}
                  </span>
                  <span className="gmail-inbox-text">
                    {bucket && (
                      <span
                        className="gmail-inbox-label"
                        style={{ background: bucket.color, color: inkOn(bucket.color) }}
                      >
                        {bucket.name}
                      </span>
                    )}
                    <span className="gmail-inbox-subject">{email.subject}</span>
                    <span className="gmail-inbox-preview">{'\u00a0- '}{email.preview}</span>
                  </span>
                  <span className="gmail-inbox-date">{receivedLabel(email)}</span>
                </span>
                {email.attachments.length > 0 && (
                  <span className="gmail-inbox-attachments">
                    {email.attachments.map((name) => (
                      <span key={name} className="attachment-chip">
                        <Icon name="attach_file" size={16} />
                        {name}
                      </span>
                    ))}
                  </span>
                )}
              </InertButton>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
