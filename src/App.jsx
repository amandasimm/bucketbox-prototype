import { mockEmails } from './data/mockEmails.js'
import { startingBuckets, emojiGrid, defaultRecentEmojis } from './data/startingSetup.js'

// Stage 0 placeholder: confirms the mock data loaded. Replaced in Stage 1.

function dateForOffset(dayOffset) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function App() {
  const unsorted = mockEmails.filter((email) => email.bucketId === null)
  const offsets = [...new Set(mockEmails.map((email) => email.dayOffset))].sort((a, b) => b - a)

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32, lineHeight: 1.5 }}>
      <h1>Data loaded: {mockEmails.length} emails, {startingBuckets.length} bucket</h1>
      <h2>Unsorted emails by day</h2>
      <ul>
        {offsets.map((offset) => (
          <li key={offset}>
            {offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : `${-offset} days ago`} ({dateForOffset(offset)}):{' '}
            {unsorted.filter((email) => email.dayOffset === offset).length} unsorted
          </li>
        ))}
      </ul>
      <h2>Buckets</h2>
      <ul>
        {startingBuckets.map((bucket) => (
          <li key={bucket.id}>
            {bucket.name}: {mockEmails.filter((email) => email.bucketId === bucket.id).length} emails
          </li>
        ))}
      </ul>
      <h2>Emojis</h2>
      <p>Default three: {defaultRecentEmojis.join(' ')}</p>
      <p>Grid ({emojiGrid.length}): {emojiGrid.join(' ')}</p>
    </main>
  )
}
