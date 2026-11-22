import Icon from './Icon.jsx'

// A calm note that some emails are waiting for a choice (PRD F14; brief 1g; Amanda 2026-11-21):
// neutral colors and an info icon, not a red warning. Review reopens the conflicts pop-up.
// It runs across the top of the home page, so an open email never covers it; the emails themselves
// carry an "Auto-sort: 2 matches" tag (MatchesTag below) instead of a second banner (Amanda, 2026-11-21).
export default function ConflictBanner({ count, onOpen }) {
  if (count === 0) return null
  const text =
    count === 1
      ? '1 email could not be automatically sorted because it matches more than one bucket.'
      : `${count} emails could not be automatically sorted because they match more than one bucket.`
  return (
    <div className="conflict-banner" role="status">
      <Icon name="info" size={20} />
      <span className="conflict-banner-text">{text}</span>
      <button type="button" className="text-button" onClick={onOpen}>
        Review
      </button>
    </div>
  )
}

// Is this email one of them? Still in the Today list, with more than one bucket's rules fitting
export const isNotSorted = (email) => Boolean(email.conflictBucketIds?.length) && email.bucketId === null && email.removedTo === null

// A neutral tag, like Gmail's own label chips, on the email's row and next to its subject when open.
// "Auto-sort: 2 matches" says the rules were involved and why it wasn't sorted (Amanda, 2026-11-21).
// Screen readers hear the full reason.
export function MatchesTag({ email }) {
  const n = email.conflictBucketIds.length
  return (
    <span className="matches-tag">
      <span aria-hidden="true">Auto-sort: {n} matches</span>
      <span className="visually-hidden">Not auto-sorted: matches {n} buckets. </span>
    </span>
  )
}
