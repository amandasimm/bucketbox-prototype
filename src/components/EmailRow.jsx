import Icon from './Icon.jsx'
import { formatShortDate, formatTime } from '../utils/dates.js'

// One email in a list, stacked like Gmail's mobile rows (BUILD-LOG, 2026-10-28):
// sender and time on top, then subject, preview and attachments.
// Today rows show the time and an always-visible drag handle; bucket rows show
// the date and only show the handle on hover (PRD F1, F2).
export default function EmailRow({ email, inBucket = false }) {
  const threadSize = email.messages?.length ?? 1
  const received = inBucket ? formatShortDate(email.receivedAt) : formatTime(email.receivedAt)

  return (
    <li className={`email-row ${email.unread ? 'is-unread' : 'is-read'} ${inBucket ? 'in-bucket' : ''}`}>
      <span className="drag-handle" aria-hidden="true">
        <Icon name="drag_indicator" size={20} />
      </span>
      <input
        type="checkbox"
        className="email-checkbox"
        aria-label={`Select email from ${email.sender}: ${email.subject}`}
      />
      <div className="email-row-body">
        <div className="email-row-top">
          <span className="email-sender">
            {email.unread && <span className="visually-hidden">Unread. </span>}
            <span className="email-sender-name">{email.sender}</span>
            {threadSize > 1 && <span className="email-thread-size">{threadSize}</span>}
            {email.unread && <span className="unread-dot" aria-hidden="true" />}
          </span>
          <span className="email-received">{received}</span>
        </div>
        <div className="email-subject">{email.subject}</div>
        {!inBucket && <div className="email-preview">{email.preview}</div>}
        {!inBucket && email.attachments.length > 0 && (
          <div className="email-attachments">
            {email.attachments.map((name) => (
              <span key={name} className="attachment-chip">
                <Icon name="attach_file" size={16} />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
