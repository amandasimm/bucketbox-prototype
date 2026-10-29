import { useState } from 'react'
import GmailShell from './components/GmailShell.jsx'
import HomePage from './components/HomePage.jsx'
import { mockEmails } from './data/mockEmails.js'
import { startingBuckets } from './data/startingSetup.js'
import { receivedAt } from './utils/dates.js'

// Everything lives in memory only: a page reload starts fresh (CLAUDE.md §5).
// Each email has bucketId (null = unsorted) and removedTo (null, 'archive' or 'trash').
const startingEmails = mockEmails.map((email) => ({
  ...email,
  receivedAt: receivedAt(email.dayOffset, email.time),
  removedTo: null,
}))

export default function App() {
  // true = Bucketbox, false = the plain Gmail view (PRD §5 toggle)
  const [prototypeOn, setPrototypeOn] = useState(true)
  const [emails, setEmails] = useState(startingEmails)
  const [buckets] = useState(startingBuckets)
  const [selectedIds, setSelectedIds] = useState([])
  // Undo covers the last action only (PRD F8): { label, before, after, undone }
  const [lastAction, setLastAction] = useState(null)
  // A new key restarts the toast's timer even when the message repeats
  const [toast, setToast] = useState(null)

  function showToast(message) {
    setToast({ message, key: Date.now() })
  }

  function applyToSelected(label, change) {
    const after = emails.map((email) => (selectedIds.includes(email.id) ? { ...email, ...change } : email))
    setLastAction({ label, before: emails, after, undone: false })
    setEmails(after)
    setSelectedIds([])
    showToast(label)
  }

  // Toast wording (BUILD-LOG, 2026-10-29): "Archived 3", "Deleted 3", "Moved 3 to Priority"
  const actions = {
    archive: () => applyToSelected(`Archived ${selectedIds.length}`, { removedTo: 'archive' }),
    delete: () => applyToSelected(`Deleted ${selectedIds.length}`, { removedTo: 'trash' }),
    move: (bucket) => applyToSelected(`Moved ${selectedIds.length} to ${bucket.name}`, { bucketId: bucket.id }),
  }

  const history = {
    canUndo: lastAction !== null && !lastAction.undone,
    canRedo: lastAction !== null && lastAction.undone,
    label: lastAction?.label,
    undo() {
      setEmails(lastAction.before)
      setLastAction({ ...lastAction, undone: true })
      setSelectedIds([])
      showToast(`Undone: ${lastAction.label}`)
    },
    redo() {
      setEmails(lastAction.after)
      setLastAction({ ...lastAction, undone: false })
      setSelectedIds([])
      showToast(`Redone: ${lastAction.label}`)
    },
  }

  // Gmail's Inbox count: unread emails still in the inbox (bucketed or removed emails have left it).
  // Hidden in Bucketbox, which only shows per-day counts (BUILD-LOG, 2026-10-29).
  const inboxUnread = prototypeOn
    ? 0
    : emails.filter((email) => email.bucketId === null && email.removedTo === null && email.unread).length

  return (
    <GmailShell
      inboxUnread={inboxUnread}
      prototypeOn={prototypeOn}
      onTogglePrototype={() => setPrototypeOn((on) => !on)}
    >
      {prototypeOn ? (
        <HomePage
          emails={emails}
          buckets={buckets}
          dayOffset={0}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          actions={actions}
          history={history}
          toast={toast}
        />
      ) : (
        <div className="stage-placeholder">The plain Gmail view arrives in Stage 10.</div>
      )}
    </GmailShell>
  )
}
