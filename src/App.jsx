import { useState } from 'react'
import GmailShell from './components/GmailShell.jsx'
import HomePage from './components/HomePage.jsx'
import { mockEmails } from './data/mockEmails.js'
import { startingBuckets } from './data/startingSetup.js'
import { receivedAt } from './utils/dates.js'

// Everything lives in memory only: a page reload starts fresh (CLAUDE.md §5).
const startingEmails = mockEmails.map((email) => ({
  ...email,
  receivedAt: receivedAt(email.dayOffset, email.time),
}))

export default function App() {
  // true = Bucketbox, false = the plain Gmail view (PRD §5 toggle)
  const [prototypeOn, setPrototypeOn] = useState(true)
  const [emails] = useState(startingEmails)
  const [buckets] = useState(startingBuckets)

  // Gmail's Inbox count: unread emails still in the inbox (bucketed emails have left it).
  // Hidden in Bucketbox, which only shows per-day counts (BUILD-LOG, 2026-10-29).
  const inboxUnread = prototypeOn
    ? 0
    : emails.filter((email) => email.bucketId === null && email.unread).length

  return (
    <GmailShell
      inboxUnread={inboxUnread}
      prototypeOn={prototypeOn}
      onTogglePrototype={() => setPrototypeOn((on) => !on)}
    >
      {prototypeOn ? (
        <HomePage emails={emails} buckets={buckets} dayOffset={0} />
      ) : (
        <div className="stage-placeholder">The plain Gmail view arrives in Stage 10.</div>
      )}
    </GmailShell>
  )
}
