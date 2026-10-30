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
  // The delete zone deletes until someone picks "Archive instead" on its first-use toast.
  // There is no visible setting in v1, and a reload resets it (BUILD-LOG, 2026-10-30).
  const [zoneMode, setZoneMode] = useState('trash') // 'trash' | 'archive'
  const [zoneToastSeen, setZoneToastSeen] = useState(false)

  // extras: { action: { label, ids }, sticky } for a toast with a button that stays until the next toast
  function showToast(message, extras = {}) {
    setToast({ message, key: Date.now(), ...extras })
  }

  function applyTo(ids, label, change, toastExtras) {
    const after = emails.map((email) => (ids.includes(email.id) ? { ...email, ...change } : email))
    setLastAction({ label, before: emails, after, undone: false })
    setEmails(after)
    setSelectedIds([])
    if (toastExtras) showToast(toastExtras.message, toastExtras)
    else showToast(label)
  }

  function applyToSelected(label, change) {
    applyTo(selectedIds, label, change)
  }

  // A drop from drag and drop (PRD F4): onto a bucket, or onto the delete zone
  function drop(ids, target) {
    const count = ids.length
    if (target.type === 'bucket') {
      applyTo(ids, `Moved ${count} to ${target.bucket.name}`, { bucketId: target.bucket.id })
    } else if (zoneMode === 'archive') {
      applyTo(ids, `Archived ${count}`, { removedTo: 'archive' })
    } else if (!zoneToastSeen) {
      setZoneToastSeen(true)
      applyTo(ids, `Deleted ${count}`, { removedTo: 'trash' }, {
        message: `${count} ${count === 1 ? 'email' : 'emails'} deleted.`,
        action: { label: 'Archive instead', ids },
        sticky: true,
      })
    } else {
      applyTo(ids, `Deleted ${count}`, { removedTo: 'trash' })
    }
  }

  // "Archive instead" on the delete zone's first-use toast: the dropped emails go to All Mail,
  // and the zone archives from now on. It replaces the drop as the last action, so one undo
  // still brings the emails back to the Today list.
  function archiveInstead(ids) {
    const after = emails.map((email) => (ids.includes(email.id) ? { ...email, removedTo: 'archive' } : email))
    setLastAction({ ...lastAction, label: `Archived ${ids.length}`, after })
    setEmails(after)
    setZoneMode('archive')
    showToast(`Archived ${ids.length}. Dropped emails will be archived from now on.`)
  }

  // Toast wording (BUILD-LOG, 2026-10-29): "Archived 3", "Deleted 3", "Moved 3 to Priority"
  const actions = {
    archive: () => applyToSelected(`Archived ${selectedIds.length}`, { removedTo: 'archive' }),
    delete: () => applyToSelected(`Deleted ${selectedIds.length}`, { removedTo: 'trash' }),
    move: (bucket) => applyToSelected(`Moved ${selectedIds.length} to ${bucket.name}`, { bucketId: bucket.id }),
    drop,
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
          onToastAction={(action) => archiveInstead(action.ids)}
          zoneMode={zoneMode}
        />
      ) : (
        <div className="stage-placeholder">The plain Gmail view arrives in Stage 10.</div>
      )}
    </GmailShell>
  )
}
