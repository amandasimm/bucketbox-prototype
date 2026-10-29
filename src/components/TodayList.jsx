import EmailRow from './EmailRow.jsx'
import Icon from './Icon.jsx'
import { formatShortDate, newestFirst } from '../utils/dates.js'

function dayLabel(dayOffset) {
  if (dayOffset === 0) return 'Today'
  if (dayOffset === -1) return 'Yesterday'
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  return formatShortDate(date)
}

// The day's unsorted emails, with a big unsorted count (PRD F1) and the
// Move / Archive / Delete buttons at the bottom (PRD F7). Look only until Stage 4.
export default function TodayList({ emails, dayOffset }) {
  const unsorted = emails
    .filter((email) => email.bucketId === null && email.dayOffset === dayOffset)
    .sort(newestFirst)

  return (
    <section className="today-list" aria-labelledby="today-heading">
      <header className="today-header">
        <h2 id="today-heading" className="today-label">{dayLabel(dayOffset)}</h2>
        <p className="unsorted-count">
          <span className="unsorted-number">{unsorted.length}</span> unsorted
        </p>
      </header>

      <label className="select-all">
        <input type="checkbox" className="email-checkbox" />
        Select all
      </label>

      <ul className="email-list">
        {unsorted.map((email) => (
          <EmailRow key={email.id} email={email} />
        ))}
      </ul>

      <footer className="bulk-actions">
        <button type="button" className="bulk-button" disabled>
          <Icon name="drive_file_move" size={20} />
          Move
        </button>
        <button type="button" className="bulk-button" disabled>
          <Icon name="archive" size={20} />
          Archive
        </button>
        <button type="button" className="bulk-button" disabled>
          <Icon name="delete" size={20} />
          Delete
        </button>
      </footer>
    </section>
  )
}
