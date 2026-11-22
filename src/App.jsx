import { useEffect, useRef, useState } from 'react'
import { dayLabel } from './components/DayNav.jsx'
import GmailInbox from './components/GmailInbox.jsx'
import GmailShell from './components/GmailShell.jsx'
import SettingsDialog from './components/SettingsDialog.jsx'
import HomePage from './components/HomePage.jsx'
import { unsortedFor } from './components/TodayList.jsx'
import { mockEmails } from './data/mockEmails.js'
import { startingBuckets } from './data/startingSetup.js'
import { prefersReducedMotion } from './components/DragMotion.jsx'
import { receivedAt } from './utils/dates.js'

// Everything lives in memory only: a page reload starts fresh (CLAUDE.md §5).
// Each email has bucketId (null = unsorted) and removedTo (null, 'archive', 'trash' or 'junk').
const startingEmails = mockEmails.map((email) => ({
  ...email,
  receivedAt: receivedAt(email.dayOffset, email.time),
  removedTo: null,
}))

// How long a row takes to close up before its email leaves the list (BUILD-LOG, 2026-11-13)
const LEAVE_MS = 200

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
  // Whether Declutter's arrow-key tip has shown, or isn't needed because the keys were used
  const [keyTipShown, setKeyTipShown] = useState(false)
  // Bucketbox's settings (PRD F10; BUILD-LOG, 2026-11-16). Kept in memory only, like everything
  // else: a reload puts them back. The delete zone's choice lives in zoneMode above.
  const [settings, setSettings] = useState({
    bucketCounts: true,
    labels: 'both', // 'both' | 'icons' | 'text', for Move / Archive / Delete and Declutter
    buttons: { move: true, archive: true, delete: true, declutter: true },
    motion: true,
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Reorder mode: buckets show drag handles and arrows until Done (BUILD-LOG, 2026-11-16)
  const [reordering, setReordering] = useState(false)
  // With animations switched off, everything behaves as it does for people whose computer
  // asks for less motion (see DragMotion.jsx and styles.css)
  useEffect(() => {
    document.body.classList.toggle('no-motion', !settings.motion)
  }, [settings.motion])

  function saveSettings({ zone, ...rest }) {
    setSettings(rest)
    setZoneMode(zone)
    if (zone === 'archive') setZoneToastSeen(true) // the choice is made, so no "Archive instead?" toast
    setSettingsOpen(false)
    showToast('Settings saved')
  }

  // Rows closing up just before their emails leave the list
  const [leavingIds, setLeavingIds] = useState([])
  const leaving = useRef(false)
  const latestEmails = useRef(emails)
  latestEmails.current = emails

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

  // The rows close up first (leaveMs), then the emails leave and the toast shows. A drop passes
  // 0, because the home page has already played the envelope's flight by then.
  function applyTo(ids, label, change, toastExtras, leaveMs = LEAVE_MS) {
    if (leaving.current) return // a second click while the rows are still closing
    const commit = () => {
      leaving.current = false
      const before = latestEmails.current
      const after = before.map((email) => (ids.includes(email.id) ? { ...email, ...change } : email))
      setLastAction({ label, before, after, undone: false })
      setEmails(after)
      setSelectedIds([])
      setLeavingIds([])
      if (toastExtras) showToast(toastExtras.message, toastExtras)
      else showToast(label)
    }
    if (leaveMs === 0 || prefersReducedMotion()) {
      commit()
      return
    }
    leaving.current = true
    setLeavingIds(ids)
    setTimeout(commit, leaveMs)
  }

  // A change that isn't an undoable action (reading an email, sending a reply). It's also
  // made to the saved undo/redo snapshots, so undoing something later doesn't reverse it.
  function changeEverywhere(changeEmails) {
    setEmails(changeEmails(emails))
    if (lastAction) {
      setLastAction({ ...lastAction, before: changeEmails(lastAction.before), after: changeEmails(lastAction.after) })
    }
  }

  // Opening an email reads it, and clears its "new" mark in a bucket (PRD F14: the new count
  // clears email by email as each one is opened)
  const markRead = (id) => (list) => list.map((email) => (email.id === id ? { ...email, unread: false, isNew: false } : email))

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
      applyTo(ids, `Moved ${count} to ${target.bucket.name}`, { bucketId: target.bucket.id }, null, 0)
    } else if (zoneMode === 'archive') {
      applyTo(ids, `Archived ${count}`, { removedTo: 'archive' }, null, 0)
    } else if (!zoneToastSeen) {
      setZoneToastSeen(true)
      applyTo(ids, `Deleted ${count}`, { removedTo: 'trash' }, {
        message: `${count} ${count === 1 ? 'email' : 'emails'} deleted.`,
        action: { label: 'Archive instead', ids },
        sticky: true,
      }, 0)
    } else {
      applyTo(ids, `Deleted ${count}`, { removedTo: 'trash' }, null, 0)
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
    // Auto-sort rules (PRD F14; brief 1b). Saving doesn't sort anything yet (1d and 1f).
    // moveIds: the backlog emails picked in the preview (brief 1d). Moving them can't be undone
    // (PRD F14), so it goes through changeEverywhere: Undo still reverses the last action before
    // it, without pulling these emails back out of the bucket.
    setRules(id, { rules, ruleJoin }, moveIds = []) {
      const bucket = buckets.find((b) => b.id === id)
      const rulesChanged = JSON.stringify({ rules: bucket.rules ?? [], ruleJoin: bucket.ruleJoin ?? 'any' }) !== JSON.stringify({ rules, ruleJoin })
      setBuckets(buckets.map((b) => (b.id === id ? { ...b, rules, ruleJoin } : b)))
      if (moveIds.length === 0) {
        showToast('Rules saved')
        return
      }
      // They land marked new (Amanda, 2026-11-21: backlog-sorted emails count as new, so the
      // "3 new" pill can be seen before rules sort arriving mail in 1f)
      changeEverywhere((list) => list.map((email) => (moveIds.includes(email.id) ? { ...email, bucketId: id, isNew: true } : email)))
      setSelectedIds(selectedIds.filter((x) => !moveIds.includes(x)))
      const moved = `Moved ${moveIds.length} to ${bucket.name}`
      showToast(rulesChanged ? `Rules saved. ${moved}` : moved)
    },
    // "Rules paused · Resume" on a tile footer turns every paused rule back on (PRD F14; brief 1e)
    resumeRules(id) {
      const bucket = buckets.find((b) => b.id === id)
      setBuckets(buckets.map((b) => (b.id === id ? { ...b, rules: (b.rules ?? []).map((rule) => ({ ...rule, paused: false })) } : b)))
      showToast(`Rules resumed for ${bucket.name}`)
    },
    // Reordering (BUILD-LOG, 2026-11-16): the bucket goes to the place of the one it's dropped on
    move(id, toId) {
      const from = buckets.findIndex((bucket) => bucket.id === id)
      const to = buckets.findIndex((bucket) => bucket.id === toId)
      if (from < 0 || to < 0 || from === to) return
      const next = [...buckets]
      next.splice(to, 0, next.splice(from, 1)[0])
      setBuckets(next)
    },
    startReorder() {
      setView({ type: 'home' })
      setOpenEmailId(null)
      setReordering(true)
    },
    endReorder() {
      setReordering(false)
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

  // One action on a card. It works like the same action elsewhere, without a first-use note.
  // advance is false for changes made in an opened email that keep it open; once it closes, a
  // sorted email's card is skipped (see declutterScreen).
  function declutterStep(email, label, kind, change, advance = true, toastExtras = {}) {
    const after = patchEmail(emails, email.id, change)
    const previous = Object.fromEntries(Object.keys(change).map((key) => [key, email[key]]))
    const step = { id: email.id, label, kind, change, previous, advance, position: declutter.position }
    setEmails(after)
    setDeclutter({
      ...declutter,
      steps: [...declutter.steps, step],
      undoneSteps: [],
      openId: advance ? null : declutter.openId,
      position: advance ? nextCard(after, declutter.deck, declutter.position) : declutter.position,
    })
    showToast(label, toastExtras)
  }

  // The first time someone clicks Archive or Mark as read with the mouse, before ever using the
  // arrow keys, the toast mentions the key once. It's a signifier, not a push (BUILD-LOG, 2026-11-08).
  function keyTip(how, key) {
    if (how !== 'pointer' || keyTipShown) return {}
    setKeyTipShown(true)
    return { tip: `You can also use the ${key} key` }
  }

  const declutterActions = {
    exit: exitDeclutter,
    keysUsed: () => setKeyTipShown(true),
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
    archive: (email, how) => declutterStep(email, 'Archived 1', 'archive', { removedTo: 'archive' }, true, keyTip(how, '←')),
    // An email that's already read stays read and the next card comes up
    markRead(email, how) {
      if (email.unread) declutterStep(email, 'Marked as read', 'read', { unread: false }, true, keyTip(how, '→'))
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

  // The open email's toolbar works as usual. Archive, Delete and junk close it and return to the
  // next card; sorting it into a bucket or marking it unread keep it open (BUILD-LOG, 2026-11-01).
  const declutterEmailView = {
    archive: (email) => declutterActions.archive(email),
    delete: (email) => declutterStep(email, 'Deleted 1', 'trash', { removedTo: 'trash' }),
    junk: (email) => declutterStep(email, 'Marked as junk', 'junk', { removedTo: 'junk' }),
    move: (email, listIds, bucket) => declutterStep(email, `Moved 1 to ${bucket.name}`, 'move', { bucketId: bucket.id }, false),
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
  // Undoing or redoing a change made in the email that's open keeps it open
  const openIdAfter = (step) => (!step.advance && step.id === declutter.openId ? declutter.openId : null)
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
            openId: openIdAfter(step),
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
            openId: openIdAfter(step),
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
      onOpenSettings={() => setSettingsOpen(true)}
      inboxUnread={inboxUnread}
      prototypeOn={prototypeOn}
      onTogglePrototype={() => {
        if (declutter) exitDeclutter()
        setReordering(false)
        setPrototypeOn((on) => !on)
      }}
    >
      {prototypeOn ? (
        <HomePage
          emails={emails}
          buckets={buckets}
          dayOffset={dayOffset}
          onChangeDay={changeDay}
          onDeclutter={() => startDeclutter(dayOffset)}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          leavingIds={leavingIds}
          settings={settings}
          reordering={reordering}
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
      {settingsOpen && (
        <SettingsDialog
          settings={{ ...settings, zone: zoneMode }}
          canReorder={buckets.length > 1}
          onSave={saveSettings}
          onReorder={(draft) => {
            saveSettings(draft)
            if (declutter) exitDeclutter()
            bucketActions.startReorder()
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </GmailShell>
  )
}
