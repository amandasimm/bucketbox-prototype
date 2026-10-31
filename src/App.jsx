import { useState } from 'react'
import { dayLabel } from './components/DayNav.jsx'
import GmailInbox from './components/GmailInbox.jsx'
import GmailShell from './components/GmailShell.jsx'
import HomePage from './components/HomePage.jsx'
import { unsortedFor } from './components/TodayList.jsx'
import { mockEmails } from './data/mockEmails.js'
import { startingBuckets } from './data/startingSetup.js'
import { receivedAt } from './utils/dates.js'

// Everything lives in memory only: a page reload starts fresh (CLAUDE.md §5).
// Each email has bucketId (null = unsorted) and removedTo (null, 'archive', 'trash' or 'junk').
const startingEmails = mockEmails.map((email) => ({
  ...email,
  receivedAt: receivedAt(email.dayOffset, email.time),
  removedTo: null,
}))

const isUnsorted = (email) => email?.bucketId === null && email?.removedTo === null
const patchEmail = (list, id, fields) => list.map((email) => (email.id === id ? { ...email, ...fields } : email))

// The next card after this one that's still unsorted, or the deck's length (the end screen)
function nextCard(list, deck, from) {
  for (let i = from + 1; i < deck.length; i += 1) {
    if (isUnsorted(list.find((email) => email.id === deck[i]))) return i
  }
  return deck.length
}

// The card before this one that's still unsorted, or -1 if there isn't one
function previousCard(list, deck, from) {
  for (let i = from - 1; i >= 0; i -= 1) {
    if (isUnsorted(list.find((email) => email.id === deck[i]))) return i
  }
  return -1
}

export default function App() {
  // true = Bucketbox, false = the plain Gmail view (PRD §5 toggle)
  const [prototypeOn, setPrototypeOn] = useState(true)
  const [emails, setEmails] = useState(startingEmails)
  const [buckets, setBuckets] = useState(startingBuckets)
  const [selectedIds, setSelectedIds] = useState([])
  // Undo covers the last action only (PRD F8): { label, before, after, undone }
  const [lastAction, setLastAction] = useState(null)
  // A new key restarts the toast's timer even when the message repeats
  const [toast, setToast] = useState(null)
  // The delete zone deletes until someone picks "Archive instead" on its first-use toast.
  // There is no visible setting in v1, and a reload resets it (BUILD-LOG, 2026-10-30).
  const [zoneMode, setZoneMode] = useState('trash') // 'trash' | 'archive'
  const [zoneToastSeen, setZoneToastSeen] = useState(false)
  // Where the person is (PRD §5): the home page, or one bucket opened up
  const [view, setView] = useState({ type: 'home' }) // or { type: 'bucket', bucketId }
  // The email open in the Today drawer or the bucket's pane (null = none chosen)
  const [openEmailId, setOpenEmailId] = useState(null)
  // Gmail's compose drawer for new messages (PRD §5): null when closed, or { to, subject, body, minimized }
  const [compose, setCompose] = useState(null)
  // Which day the Today card shows (PRD F6): 0 = today, -1 = yesterday
  const [dayOffset, setDayOffset] = useState(0)
  // Declutter (PRD F13), null when it isn't running. The deck is fixed when a day starts, so the
  // count shows progress, not a moving target. Each step remembers only the fields it changed:
  // { deck, dayOffset, position, openId, steps, undoneSteps }
  const [declutter, setDeclutter] = useState(null)

  // Switching days closes any open email and clears the checkboxes
  function changeDay(offset) {
    setDayOffset(offset)
    setOpenEmailId(null)
    setSelectedIds([])
  }

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

  // A change that isn't an undoable action (reading an email, sending a reply). It's also
  // made to the saved undo/redo snapshots, so undoing something later doesn't reverse it.
  function changeEverywhere(changeEmails) {
    setEmails(changeEmails(emails))
    if (lastAction) {
      setLastAction({ ...lastAction, before: changeEmails(lastAction.before), after: changeEmails(lastAction.after) })
    }
  }

  const markRead = (id) => (list) => list.map((email) => (email.id === id ? { ...email, unread: false } : email))

  // An action on the open email (PRD F5, Flow 6). Afterwards the pane moves on to the next
  // email in the list (or the one before, if this was the last), and that one is read.
  function paneAction(email, listIds, label, change) {
    const index = listIds.indexOf(email.id)
    const nextId = listIds[index + 1] ?? listIds[index - 1] ?? null
    const after = emails.map((e) => {
      if (e.id === email.id) return { ...e, ...change }
      if (e.id === nextId) return { ...e, unread: false }
      return e
    })
    setLastAction({ label, before: emails, after, undone: false })
    setEmails(after)
    setSelectedIds([])
    setOpenEmailId(nextId)
    showToast(label)
  }

  // Opening and acting on single emails (PRD F5)
  const emailView = {
    view,
    openEmailId,
    // Opening an email marks it read
    open(id) {
      setOpenEmailId(id)
      changeEverywhere(markRead(id))
    },
    // The bucket's default pane shows the top email but keeps it unread until it's clicked into
    markRead(id) {
      changeEverywhere(markRead(id))
    },
    close() {
      setOpenEmailId(null)
    },
    openBucket(bucketId, emailId = null) {
      setView({ type: 'bucket', bucketId })
      setSelectedIds([])
      if (emailId) emailView.open(emailId)
      else setOpenEmailId(null)
    },
    closeBucket() {
      setView({ type: 'home' })
      setOpenEmailId(null)
      setSelectedIds([])
    },
    archive: (email, listIds) => paneAction(email, listIds, 'Archived 1', { removedTo: 'archive' }),
    delete: (email, listIds) => paneAction(email, listIds, 'Deleted 1', { removedTo: 'trash' }),
    junk: (email, listIds) => paneAction(email, listIds, 'Marked as junk', { removedTo: 'junk' }),
    move: (email, listIds, bucket) => paneAction(email, listIds, `Moved 1 to ${bucket.name}`, { bucketId: bucket.id }),
    // In the Today drawer this closes the email, like Gmail going back to the inbox.
    // In a bucket the email stays in the pane, unread until it's clicked into again.
    markUnread(email) {
      const after = emails.map((e) => (e.id === email.id ? { ...e, unread: true } : e))
      setLastAction({ label: 'Marked as unread', before: emails, after, undone: false })
      setEmails(after)
      if (view.type === 'home') setOpenEmailId(null)
      showToast('Marked as unread')
    },
  }

  // Reply, from the inline reply box under an open email (Gmail's in-place reply; BUILD-LOG,
  // 2026-10-30). The message is added to the end of the thread as "me". Nothing is sent
  // anywhere (CLAUDE.md §5).
  function sendReply(email, body) {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    changeEverywhere((list) =>
      list.map((e) => {
        if (e.id !== email.id) return e
        // A one-message email becomes a thread: its original message, then the reply
        const earlier = e.messages ?? [{ from: e.sender, dayOffset: e.dayOffset, time: e.time, body: e.body }]
        return { ...e, messages: [...earlier, { from: 'me', dayOffset: 0, time, body }] }
      }),
    )
    showToast('Message sent')
  }

  // Gmail's compose drawer, for new messages only (PRD §5). Send closes it with a toast and
  // never sends anything anywhere (CLAUDE.md §5).
  const composeActions = {
    compose,
    openNew() {
      setCompose({ to: '', subject: '', body: '', minimized: false })
    },
    update(fields) {
      setCompose({ ...compose, ...fields })
    },
    close() {
      setCompose(null)
    },
    send() {
      setCompose(null)
      showToast('Message sent')
    },
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

  // Creating, editing and deleting buckets (PRD F2). These aren't covered by undo.
  const bucketActions = {
    // emoji is optional (null = show the color dot)
    add({ name, color, emoji }) {
      setBuckets([...buckets, { id: `bucket-${Date.now()}`, name, color, emoji }])
    },
    edit(id, { name, color, emoji }) {
      setBuckets(buckets.map((bucket) => (bucket.id === id ? { ...bucket, name, color, emoji } : bucket)))
    },
    // destination: { type: 'archive' | 'trash' | 'bucket', bucketId }
    remove(bucket, destination) {
      const change =
        destination.type === 'bucket'
          ? { bucketId: destination.bucketId }
          : { bucketId: null, removedTo: destination.type }
      setEmails(
        emails.map((email) => {
          if (email.bucketId !== bucket.id) return email
          // Emails already archived or deleted from this bucket just lose the bucket
          return email.removedTo === null ? { ...email, ...change } : { ...email, bucketId: null }
        }),
      )
      setBuckets(buckets.filter((b) => b.id !== bucket.id))
      // Deleting a bucket can't be undone (PRD F2), and undoing an earlier move could
      // put emails back into a bucket that no longer exists, so undo starts over.
      setLastAction(null)
      setSelectedIds([])
      if (view.type === 'bucket' && view.bucketId === bucket.id) emailView.closeBucket()
      showToast(`Deleted the ${bucket.name} bucket`)
    },
  }

  // Declutter (PRD F13, Flow 7). Starts on the given day with a fresh deck, newest first.
  function startDeclutter(day) {
    setDayOffset(day)
    setView({ type: 'home' })
    setOpenEmailId(null)
    setSelectedIds([])
    setDeclutter({
      dayOffset: day,
      deck: unsortedFor(emails, day).map((email) => email.id),
      position: 0,
      openId: null,
      steps: [],
      undoneSteps: [],
    })
  }

  // Stepping back through cards only runs inside one day's Declutter. Leaving it hands the
  // latest step to the usual "last action" undo (BUILD-LOG, 2026-10-31).
  function settleDeclutter() {
    const applied = declutter.steps.at(-1)
    const step = applied ?? declutter.undoneSteps.at(-1)
    if (!step) return
    setLastAction({
      label: step.label,
      before: patchEmail(emails, step.id, step.previous),
      after: patchEmail(emails, step.id, step.change),
      undone: !applied,
    })
  }

  function exitDeclutter() {
    settleDeclutter()
    setDeclutter(null)
    setTimeout(() => document.getElementById('declutter-button')?.focus(), 0)
  }

  // One action on a card. It works like the same action elsewhere, without a first-use note
  function declutterStep(email, label, kind, change, advance = true) {
    const after = patchEmail(emails, email.id, change)
    const previous = Object.fromEntries(Object.keys(change).map((key) => [key, email[key]]))
    const step = { id: email.id, label, kind, change, previous, advance, position: declutter.position }
    setEmails(after)
    setDeclutter({
      ...declutter,
      steps: [...declutter.steps, step],
      undoneSteps: [],
      openId: null,
      position: advance ? nextCard(after, declutter.deck, declutter.position) : declutter.position,
    })
    showToast(label)
  }

  const declutterActions = {
    exit: exitDeclutter,
    previousDay: (day) => {
      settleDeclutter()
      startDeclutter(day)
    },
    next() {
      setDeclutter({ ...declutter, position: nextCard(emails, declutter.deck, declutter.position) })
    },
    previous() {
      const position = previousCard(emails, declutter.deck, declutter.position)
      if (position >= 0) setDeclutter({ ...declutter, position })
    },
    archive: (email) => declutterStep(email, 'Archived 1', 'archive', { removedTo: 'archive' }),
    // An email that's already read stays read and the next card comes up
    markRead(email) {
      if (email.unread) declutterStep(email, 'Marked as read', 'read', { unread: false })
      else declutterActions.next()
    },
    move: (email, bucket) => declutterStep(email, `Moved 1 to ${bucket.name}`, 'move', { bucketId: bucket.id }),
    // Opening a card pauses the flow; closing it returns to the same card
    open(email) {
      setDeclutter({ ...declutter, openId: email.id })
      changeEverywhere(markRead(email.id))
    },
    close() {
      setDeclutter({ ...declutter, openId: null })
    },
  }

  // The open email's toolbar works as usual. An action that removes it returns to the next card.
  const declutterEmailView = {
    archive: declutterActions.archive,
    delete: (email) => declutterStep(email, 'Deleted 1', 'trash', { removedTo: 'trash' }),
    junk: (email) => declutterStep(email, 'Marked as junk', 'junk', { removedTo: 'junk' }),
    move: (email, listIds, bucket) => declutterActions.move(email, bucket),
    markUnread: (email) => declutterStep(email, 'Marked as unread', 'unread', { unread: true }, false),
  }

  const lastActionHistory = {
    canUndo: lastAction !== null && !lastAction.undone,
    canRedo: lastAction !== null && lastAction.undone,
    undoLabel: lastAction?.label,
    redoLabel: lastAction?.label,
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

  // While Declutter runs, undo and redo step back and forward one card at a time. Before its
  // first step they still reach the last action from before it started.
  const steps = declutter?.steps ?? []
  const undoneSteps = declutter?.undoneSteps ?? []
  const redoLastAction = steps.length === 0 && lastActionHistory.canRedo
  const history = declutter
    ? {
        canUndo: steps.length > 0 || lastActionHistory.canUndo,
        canRedo: undoneSteps.length > 0 || redoLastAction,
        undoLabel: steps.at(-1)?.label ?? lastActionHistory.undoLabel,
        redoLabel: redoLastAction ? lastActionHistory.redoLabel : undoneSteps.at(-1)?.label,
        undo() {
          const step = steps.at(-1)
          if (!step) {
            lastActionHistory.undo()
            return
          }
          setEmails(patchEmail(emails, step.id, step.previous))
          setDeclutter({
            ...declutter,
            steps: steps.slice(0, -1),
            undoneSteps: [...undoneSteps, step],
            position: step.position,
            openId: null,
          })
          showToast(`Undone: ${step.label}`)
        },
        redo() {
          if (redoLastAction) {
            lastActionHistory.redo()
            return
          }
          const step = undoneSteps.at(-1)
          const after = patchEmail(emails, step.id, step.change)
          setEmails(after)
          setDeclutter({
            ...declutter,
            steps: [...steps, step],
            undoneSteps: undoneSteps.slice(0, -1),
            position: step.advance ? nextCard(after, declutter.deck, step.position) : step.position,
            openId: null,
          })
          showToast(`Redone: ${step.label}`)
        },
      }
    : lastActionHistory

  // What the Declutter screen shows. If an undo changes the current card, it moves on to the next one.
  function declutterScreen() {
    const { deck, position, dayOffset: day } = declutter
    const deckEmails = deck.map((id) => emails.find((email) => email.id === id))
    const inDeck = position < deck.length && isUnsorted(deckEmails[position])
    const shownPosition = inDeck ? position : nextCard(emails, deck, position)
    const unsortedLeft = deckEmails.filter(isUnsorted)
    const readIds = steps.filter((step) => step.kind === 'read').map((step) => step.id)
    const earlierDays = emails.filter((email) => isUnsorted(email) && email.dayOffset < day).map((email) => email.dayOffset)
    return {
      dayOffset: day,
      dayName: dayLabel(day),
      total: deck.length,
      position: shownPosition,
      email: deckEmails[shownPosition] ?? null,
      openEmail: emails.find((email) => email.id === declutter.openId) ?? null,
      hasPrevious: previousCard(emails, deck, shownPosition) >= 0,
      hasNext: nextCard(emails, deck, shownPosition) < deck.length,
      previousDay: earlierDays.length > 0 ? Math.max(...earlierDays) : null,
      progress: {
        archived: deckEmails.filter((email) => email.removedTo === 'archive').length,
        moved: deckEmails.filter((email) => email.removedTo === null && email.bucketId !== null).length,
        deleted: deckEmails.filter((email) => email.removedTo === 'trash' || email.removedTo === 'junk').length,
        read: unsortedLeft.filter((email) => readIds.includes(email.id)).length,
        left: unsortedLeft.length,
      },
      actions: declutterActions,
      emailView: declutterEmailView,
    }
  }

  // Gmail's Inbox count: every unread email still in the inbox, from any day. Buckets work like
  // Gmail labels, so bucketed emails still count until they're archived or deleted
  // (BUILD-LOG, 2026-10-30). Hidden in Bucketbox, which only shows per-day counts (2026-10-29).
  const inboxUnread = prototypeOn ? 0 : emails.filter((email) => email.removedTo === null && email.unread).length

  return (
    <GmailShell
      composeActions={composeActions}
      buckets={buckets}
      history={prototypeOn ? history : null}
      inboxUnread={inboxUnread}
      prototypeOn={prototypeOn}
      onTogglePrototype={() => {
        if (declutter) exitDeclutter()
        setPrototypeOn((on) => !on)
      }}
      declutterOn={declutter !== null}
      onToggleDeclutter={() => (declutter ? exitDeclutter() : startDeclutter(dayOffset))}
    >
      {prototypeOn ? (
        <HomePage
          emails={emails}
          buckets={buckets}
          dayOffset={dayOffset}
          onChangeDay={changeDay}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          actions={actions}
          bucketActions={bucketActions}
          toast={toast}
          onToastAction={(action) => archiveInstead(action.ids)}
          zoneMode={zoneMode}
          emailView={emailView}
          onSendReply={sendReply}
          declutter={declutter && declutterScreen()}
        />
      ) : (
        <GmailInbox emails={emails} buckets={buckets} />
      )}
    </GmailShell>
  )
}
