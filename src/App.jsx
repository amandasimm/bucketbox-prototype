import { useState } from 'react'
import GmailShell from './components/GmailShell.jsx'
import { mockEmails } from './data/mockEmails.js'

export default function App() {
  // true = the new daily inbox view, false = the plain Gmail view (PRD §5 toggle)
  const [prototypeOn, setPrototypeOn] = useState(true)

  // Gmail's Inbox count: unread emails still in the inbox (bucketed emails have left it)
  const inboxUnread = mockEmails.filter((email) => email.bucketId === null && email.unread).length

  return (
    <GmailShell
      inboxUnread={inboxUnread}
      prototypeOn={prototypeOn}
      onTogglePrototype={() => setPrototypeOn((on) => !on)}
    >
      <div className="stage-placeholder">
        {prototypeOn
          ? 'The home page (Today list and buckets) arrives in Stage 2.'
          : 'The plain Gmail view arrives in Stage 10.'}
      </div>
    </GmailShell>
  )
}
