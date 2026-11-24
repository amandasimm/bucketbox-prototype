import { useEffect, useRef, useState } from 'react'
import { dayLabel } from './components/DayNav.jsx'
import GmailInbox from './components/GmailInbox.jsx'
import GmailShell from './components/GmailShell.jsx'
import SettingsDialog from './components/SettingsDialog.jsx'
import ConflictDialog from './components/ConflictDialog.jsx'
import HomePage from './components/HomePage.jsx'
import { unsortedFor } from './components/TodayList.jsx'
import { mockEmails } from './data/mockEmails.js'
import { bucketColors, startingBuckets } from './data/startingSetup.js'
import { prefersReducedMotion } from './components/DragMotion.jsx'
import { receivedAt } from './utils/dates.js'
import { listFor, weekBounds, weekLabel } from './utils/range.js'
import { dayButtonLabel } from './components/Declutter.jsx'
import { endTitle } from './utils/declutterMessages.js'
import { loadSettings, storeSettings } from './utils/savedSettings.js'
import { arrivingEmails } from './data/arrivingEmails.js'
import { patternSender, patternTemplates, patternTodayCount, patternTotal } from './data/patternEmails.js'
import { activeRules, routeEmail, ruleMatches } from './utils/rules.js'
import { chipsFromEmail } from './utils/ruleText.js'
import { findRuleSuggestion } from './utils/suggestRules.js'

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
// A Declutter step changes one email, or several at once (the auto-archive suggestion, F15).
// side 'change' applies it, 'previous' takes it back.
function applyStep(list, step, side) {
  if (!step.ids) return patchEmail(list, step.id, step[side])
  return list.map((email) => (step.ids.includes(email.id) ? { ...email, ...(side === 'change' ? step.change : step.previousById[email.id]) } : email))
}

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
  // Settings saved in this browser from an earlier visit (brief 1j), read once at the start
  const [saved] = useState(loadSettings)
  // The delete zone deletes until someone picks "Archive instead" on its first-use toast, or
  // chooses archiving in settings. It's saved with the settings (brief 1j).
  const [zoneMode, setZoneMode] = useState(saved.zone) // 'trash' | 'archive'
  const [zoneToastSeen, setZoneToastSeen] = useState(saved.zone === 'archive')
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
  // Bucketbox's settings (PRD F10; BUILD-LOG, 2026-11-16 and 2026-11-22). Saved in this browser,
  // so they're kept after a reload (utils/savedSettings.js). The delete zone's choice lives in
  // zoneMode above. "Show bucket counts" is gone: tiles have no counts (brief 1j).
  const [settings, setSettings] = useState(() => {
    const { zone, ...rest } = saved
    return rest
  })
  useEffect(() => {
    storeSettings({ ...settings, zone: zoneMode })
  }, [settings, zoneMode])
  const [settingsOpen, setSettingsOpen] = useState(false)
  // The conflicts pop-up (PRD F14; brief 1g): emails whose rules fit more than one bucket
  const [conflictsOpen, setConflictsOpen] = useState(false)
  // Reorder mode: buckets show drag handles and arrows until Done (BUILD-LOG, 2026-11-16)
  const [reordering, setReordering] = useState(false)
  // With animations switched off, everything behaves as it does for people whose computer
  // asks for less motion (see DragMotion.jsx and styles.css)
  useEffect(() => {
    document.body.classList.toggle('no-motion', !settings.motion)
  }, [settings.motion])
  // The unread dot on rows is a setting, off by default (BUILD-LOG, 2026-11-24)
  useEffect(() => {
    document.body.classList.toggle('show-unread-dot', settings.unreadDot)
  }, [settings.unreadDot])

  function saveSettings({ zone, ...rest }) {
    // A new range starts from today (PRD F6; brief item 5)
    if (rest.range !== settings.range) changeDay(0)
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

  // extras: { action: { label, ids } } for a toast with a button (it stays 15 seconds; Toast.jsx)
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

  // New mail arriving (brief 1f; the facilitator's Add emails, brief item 6). Each email goes
  // through the auto-sort rules: one bucket's rules fit, it skips the Today list and lands there
  // marked new; none fit, it lands in the Today list; more than one fit, it waits in the Today
  // list for the person to choose (1g). Arriving mail isn't something the person did, so it's
  // left out of undo/redo, and undoing something later never takes it away.
  const arrivals = useRef(0)
  // Delivers new emails (each with an id, dayOffset and time) through the rules, as above.
  // Returns the toast's ending: " 3 went to Priority, 1 to Bills." or ""
  function deliver(newEmails) {
    const sorted = {} // bucket name -> how many
    let conflicts = 0
    const incoming = newEmails.map((email) => {
      const arrived = { attachments: [], ...email, receivedAt: receivedAt(email.dayOffset, email.time), unread: true, bucketId: null, removedTo: null }
      // With auto-sort switched off in settings, everything lands in the Today list (brief 1j)
      const route = settings.autoSort ? routeEmail(arrived, buckets) : { type: 'none' }
      // More than one bucket fits: it waits in the Today list, remembering which buckets (1g)
      if (route.type === 'conflict') {
        conflicts += 1
        return { ...arrived, conflictBucketIds: route.bucketIds }
      }
      if (route.type !== 'bucket') return arrived
      const bucket = buckets.find((b) => b.id === route.bucketId)
      sorted[bucket.name] = (sorted[bucket.name] ?? 0) + 1
      return { ...arrived, bucketId: bucket.id, isNew: true }
    })
    changeEverywhere((list) => [...list, ...incoming])
    // One pop-up for all of them, not one per email (PRD F14)
    if (conflicts > 0) setConflictsOpen(true)
    const where = Object.entries(sorted).map(([name, n], i) => (i === 0 ? `${n} went to ${name}` : `${n} to ${name}`))
    return where.length ? ` ${where.join(', ')}.` : ''
  }
  const clock = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  // Add emails: the 8 arriving emails, a few minutes apart, the last one arriving now
  function addArrivingEmails() {
    arrivals.current += 1
    const batch = arrivals.current
    const now = Date.now()
    const ending = deliver(
      arrivingEmails.map((email, i) => ({
        ...email,
        id: `ARR_${batch}_${i}`,
        dayOffset: 0,
        time: clock(new Date(now - (arrivingEmails.length - 1 - i) * 3 * 60 * 1000)),
      })),
    )
    // "8 new emails. 3 went to Priority, 1 to Bills."
    showToast(`${arrivingEmails.length} new emails.${ending}`)
  }

  // Add pattern emails (brief items 2 and 6; Amanda, 2026-11-22): 35 from Chase, 4 today (the
  // last one now) and 31 spread over the past weeks, so the auto-archive suggestion can be
  // triggered on demand. They go through the rules like any new mail.
  function addPatternEmails() {
    arrivals.current += 1
    const batch = arrivals.current
    const now = Date.now()
    const ending = deliver(
      Array.from({ length: patternTotal }, (_, i) => {
        const today = i < patternTodayCount
        const older = i - patternTodayCount
        return {
          ...patternSender,
          ...patternTemplates[i % patternTemplates.length],
          id: `PAT_${batch}_${i}`,
          dayOffset: today ? 0 : -(1 + Math.floor(older * 1.5)),
          time: today ? clock(new Date(now - (patternTodayCount - 1 - i) * 7 * 60 * 1000)) : `${String(8 + (older % 10)).padStart(2, '0')}:${String((older * 17) % 60).padStart(2, '0')}`,
        }
      }),
    )
    showToast(`${patternTotal} emails from ${patternSender.sender} added: ${patternTodayCount} today, ${patternTotal - patternTodayCount} earlier.${ending}`)
  }

  // Emails still waiting for the person to choose a bucket (PRD F14; brief 1g), each with the
  // buckets it fits. Once an email is sorted, archived or deleted any other way, it drops out.
  const conflictEmails = emails
    .filter((email) => email.conflictBucketIds && email.bucketId === null && email.removedTo === null)
    .map((email) => ({ email, options: buckets.filter((bucket) => email.conflictBucketIds.includes(bucket.id)) }))
    .filter(({ options }) => options.length > 0)
    .sort((a, b) => b.email.receivedAt - a.email.receivedAt)
  if (conflictsOpen && conflictEmails.length === 0) setConflictsOpen(false)

  // Sorting the chosen ones: { emailId: bucketId }. Like Move, it can be undone. They land marked
  // new, like other rule-sorted mail. "Moved 1 to Priority, 1 to Updates box"
  function sortConflicts(choices) {
    const ids = Object.keys(choices)
    if (ids.length === 0) return
    const after = emails.map((email) => (choices[email.id] ? { ...email, bucketId: choices[email.id], isNew: true } : email))
    const counts = {}
    for (const bucketId of Object.values(choices)) {
      const name = buckets.find((b) => b.id === bucketId).name
      counts[name] = (counts[name] ?? 0) + 1
    }
    const label = `Moved ${Object.entries(counts).map(([name, n]) => `${n} to ${name}`).join(', ')}`
    setLastAction({ label, before: emails, after, undone: false })
    setEmails(after)
    setSelectedIds(selectedIds.filter((id) => !ids.includes(id)))
    setConflictsOpen(false)
    showToast(label)
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
  function paneAction(email, listIds, label, change, toastExtras = null) {
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
    if (toastExtras) showToast(toastExtras.message, toastExtras)
    else showToast(label)
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
    move: (email, listIds, bucket) => paneAction(email, listIds, `Moved 1 to ${bucket.name}`, { bucketId: bucket.id }, moveToast([email.id], bucket)),
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

  // "Pause sending uber.com emails to Priority?" (PRD F14; brief 1h; BUILD-LOG 2026-11-22).
  // Moving emails out of a bucket into another bucket asks, in the move's toast, whether to pause
  // the source bucket's rules that caught them. Only when a moved email fits one of that bucket's
  // active rules (an email sorted by hand doesn't ask), and for every kind of move to a bucket
  // (drag, Move, Move to). Returns the toast for applyTo / paneAction, or null for a plain one.
  function pausePrompt(ids, target) {
    if (!settings.autoSort) return null // nothing to pause while auto-sort is off (brief 1j)
    const moved = emails.filter((email) => ids.includes(email.id) && email.bucketId && email.bucketId !== target.id && !email.removedTo)
    for (const source of buckets) {
      const rules = activeRules(source).filter((rule) => moved.some((email) => email.bucketId === source.id && ruleMatches(rule, email)))
      if (rules.length === 0) continue
      // What the rule is about, from its first condition: "uber.com", "“receipt”", "Promotions"
      const about = rules.map(({ criteria: [first] }) => (first.type === 'subject' ? `“${first.value}”` : first.value))
      const what = about.length === 1 ? about[0] : `${about.slice(0, -1).join(', ')} and ${about.at(-1)}`
      const count = ids.length
      return {
        message: `Moved ${count === 1 ? '' : `${count} `}to ${target.name}. Pause sending ${what} emails to ${source.name}?`,
        action: {
          type: 'pause',
          label: rules.length === 1 ? 'Pause rule' : `Pause ${rules.length} rules`,
          bucketId: source.id,
          ruleIds: rules.map((rule) => rule.id),
          what,
        },
      }
    }
    return null
  }

  // Suggested rules (PRD F16; brief item 3): when a move brings a bucket to 5 similar emails, the
  // move's toast asks "Always send Chase emails to Bills?" with Create rule (the PRD's wording;
  // Amanda). Once per suggestion per visit; letting it fade is "Not now". Not while Declutter runs.
  const suggestedAlready = useRef([])
  function suggestPrompt(ids, target) {
    if (!settings.suggestions || declutter) return null
    const after = emails.map((email) => (ids.includes(email.id) ? { ...email, bucketId: target.id } : email))
    const skip = [...settings.hiddenSuggestions.map((hidden) => hidden.key).filter(Boolean), ...suggestedAlready.current]
    const suggestion = findRuleSuggestion(target, after, skip)
    if (!suggestion) return null
    suggestedAlready.current = [...suggestedAlready.current, suggestion.key]
    return {
      message: `Always send ${suggestion.label} to ${target.name}?`,
      action: { type: 'suggestRule', label: 'Create rule', bucketId: target.id, criterion: suggestion.criterion, count: suggestion.count },
    }
  }
  // A move's toast: the pause question first (1h), otherwise a suggested rule, otherwise plain
  const moveToast = (ids, target) => pausePrompt(ids, target) ?? suggestPrompt(ids, target)

  // "Don't suggest this again" for a suggested rule: saved with the settings, listed there
  function hideRuleSuggestion(suggestion) {
    if (settings.hiddenSuggestions.some((hidden) => hidden.key === suggestion.key)) return
    setSettings({ ...settings, hiddenSuggestions: [...settings.hiddenSuggestions, { key: suggestion.key, name: `${suggestion.label} → ${suggestion.bucketName}` }] })
    showToast('You won\'t see that suggestion again. You can change this in Bucketbox settings.')
  }

  // "Pause rule" on that toast: those rules pause (not deleted; Resume is on the tile and in the
  // rules panel). The email that was moved stays where it was moved.
  function pauseRules({ bucketId, ruleIds, what }) {
    const bucket = buckets.find((b) => b.id === bucketId)
    if (!bucket) return
    setBuckets(buckets.map((b) => (b.id === bucketId ? { ...b, rules: (b.rules ?? []).map((rule) => (ruleIds.includes(rule.id) ? { ...rule, paused: true } : rule)) } : b)))
    showToast(ruleIds.length === 1 ? `Paused the ${what} rule in ${bucket.name}` : `Paused ${ruleIds.length} rules in ${bucket.name}`)
  }

  // A drop from drag and drop (PRD F4): onto a bucket, or onto the delete zone
  function drop(ids, target) {
    const count = ids.length
    if (target.type === 'bucket') {
      applyTo(ids, `Moved ${count} to ${target.bucket.name}`, { bucketId: target.bucket.id }, moveToast(ids, target.bucket), 0)
    } else if (zoneMode === 'archive') {
      applyTo(ids, `Archived ${count}`, { removedTo: 'archive' }, null, 0)
    } else if (!zoneToastSeen) {
      setZoneToastSeen(true)
      applyTo(ids, `Deleted ${count}`, { removedTo: 'trash' }, {
        message: `${count} ${count === 1 ? 'email' : 'emails'} deleted.`,
        action: { label: 'Archive instead', ids },
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
    move: (bucket) => applyTo(selectedIds, `Moved ${selectedIds.length} to ${bucket.name}`, { bucketId: bucket.id }, moveToast(selectedIds, bucket)),
    drop,
  }

  // Creating, editing and deleting buckets (PRD F2). These aren't covered by undo.
  const bucketActions = {
    // emoji is optional (null = show the color dot)
    // Returns the new bucket's id, so "Auto-sort rules" in the new-bucket form can open its rules
    add({ name, color, emoji }) {
      const id = `bucket-${Date.now()}`
      setBuckets([...buckets, { id, name, color, emoji }])
      return id
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
    // Collapse / Expand a bucket (PRD F17). Kept on the bucket until the page reloads; not undoable.
    toggleCollapse(id) {
      setBuckets(buckets.map((b) => (b.id === id ? { ...b, collapsed: !b.collapsed } : b)))
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

  // Counts Declutter runs, so the end screen's title rotates between versions (Amanda, 2026-11-24)
  const declutterRuns = useRef(-1)

  // Declutter (PRD F13, Flow 7). Starts on the given day with a fresh deck, newest first.
  // It follows the Today list's range (PRD F6; brief item 5, Stage 21c): one day, the week, or in
  // All Emails the newest unsorted emails in chunks (25 to start), skipping ones an earlier chunk
  // of this run already showed (seen).
  function startDeclutter(day, seen = []) {
    const range = settings.range
    let list = listFor(emails, range, day)
    if (range === 'all') list = list.filter((email) => !seen.includes(email.id)).slice(0, settings.chunkSize)
    setDayOffset(day)
    setView({ type: 'home' })
    setOpenEmailId(null)
    setSelectedIds([])
    declutterRuns.current += 1
    setDeclutter({
      dayOffset: day,
      range,
      seen,
      runNumber: declutterRuns.current,
      deck: list.map((email) => email.id),
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
      before: applyStep(emails, step, 'previous'),
      after: applyStep(emails, step, 'change'),
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

  // Auto-archive suggestions (PRD F15; brief item 2; BUILD-LOG 2026-11-22). Simple counting, no ML:
  // a sender qualifies when 4 or more of their emails have been archived, none of their emails
  // are in a bucket, and some are still unsorted. Counted from the emails themselves, so an undo
  // takes it back too. Shown only during Declutter, when Suggestions is on in settings, and not
  // for senders hidden with "Don't suggest this for Chase" or put off with "Not now" this run.
  function findArchiveSuggestion() {
    if (!settings.suggestions || !declutter) return null
    const bySender = new Map()
    for (const email of emails) {
      if (!email.senderEmail) continue
      const entry = bySender.get(email.senderEmail) ?? { senderEmail: email.senderEmail, name: email.sender, archived: 0, inBucket: 0, unsorted: [] }
      if (email.removedTo === 'archive') entry.archived += 1
      else if (email.bucketId && !email.removedTo) entry.inBucket += 1
      else if (isUnsorted(email)) entry.unsorted.push(email)
      bySender.set(email.senderEmail, entry)
    }
    const skipped = [...settings.hiddenSuggestions.map((hidden) => hidden.senderEmail), ...(declutter.notNow ?? [])]
    const found = [...bySender.values()]
      .filter((entry) => entry.archived >= 4 && entry.inBucket === 0 && !skipped.includes(entry.senderEmail))
      .sort((a, b) => b.archived - a.archived)
    // After "Review & Archive", the offer to collect future emails takes the banner's place, but
    // only while that archive is in place: undoing it brings the suggestion back, redoing it the offer
    const offer = declutter.offer
    const offerStands = offer && !skipped.includes(offer.senderEmail) && declutter.steps.some((step) => step.ids?.[0] === offer.firstId)
    if (offerStands) return { type: 'collect', senderEmail: offer.senderEmail, name: offer.name }
    const suggestion = found.find((entry) => entry.unsorted.length > 0)
    if (suggestion) return { type: 'archive', ...suggestion, unsorted: suggestion.unsorted.sort((a, b) => b.receivedAt - a.receivedAt) }
    return null
  }

  const suggestionActions = {
    // The banner's X (in place of "Not now" and "No thanks"): not again during this Declutter run
    notNow(senderEmail) {
      setDeclutter({ ...declutter, notNow: [...(declutter.notNow ?? []), senderEmail], offer: null })
    },
    // "Don't suggest this for Chase": saved with the settings; listed there to bring it back
    hide(senderEmail, name) {
      if (!settings.hiddenSuggestions.some((hidden) => hidden.senderEmail === senderEmail)) {
        setSettings({ ...settings, hiddenSuggestions: [...settings.hiddenSuggestions, { senderEmail, name }] })
      }
      setDeclutter({ ...declutter, offer: null })
      showToast(`You won't see suggestions for ${name}. You can change this in Bucketbox settings.`)
    },
    // "Archive 31": one Declutter step for all of them, so Undo brings them all back (PRD F15)
    archive(ids, senderEmail, name) {
      if (ids.length === 0) return
      const chosen = emails.filter((email) => ids.includes(email.id))
      const step = {
        ids,
        label: `Archived ${ids.length} from ${name}`,
        kind: 'archive-many',
        change: { removedTo: 'archive' },
        previousById: Object.fromEntries(chosen.map((email) => [email.id, { removedTo: email.removedTo }])),
        advance: false,
        position: declutter.position,
      }
      const after = applyStep(emails, step, 'change')
      setEmails(after)
      setDeclutter({
        ...declutter,
        steps: [...declutter.steps, step],
        undoneSteps: [],
        offer: { senderEmail, name, firstId: ids[0] },
        // The card on screen may have been one of them
        position: isUnsorted(after.find((email) => email.id === declutter.deck[declutter.position])) ? declutter.position : nextCard(after, declutter.deck, declutter.position),
      })
      showToast(step.label)
    },
    // "Create a Chase bucket": a new bucket named after the sender, with a rule for their domain
    // (or their address, for personal ones), so future emails go there (PRD F15 links to F14)
    createBucket(senderEmail, name) {
      const { first } = chipsFromEmail({ sender: name, senderEmail, subject: '' })
      const taken = buckets.map((b) => b.name.toLowerCase())
      let bucketName = name
      for (let n = 2; taken.includes(bucketName.toLowerCase()); n += 1) bucketName = `${name} ${n}`
      const used = buckets.map((b) => b.color)
      const color = (bucketColors.find((c) => !used.includes(c.hex)) ?? bucketColors[0]).hex
      const id = `bucket-${Date.now()}`
      setBuckets([...buckets, { id, name: bucketName, color, emoji: null, rules: [{ id: `rule-${Date.now()}`, match: 'any', paused: false, criteria: [first] }], ruleJoin: 'any' }])
      setDeclutter({ ...declutter, offer: null, notNow: [...(declutter.notNow ?? []), senderEmail] })
      showToast(`Made the ${bucketName} bucket. New emails from ${name} will go there.`, { action: { type: 'removeBucket', label: 'Undo', bucketId: id, name: bucketName } })
    },
  }

  const declutterActions = {
    exit: exitDeclutter,
    keysUsed: () => setKeyTipShown(true),
    // The end screen's left button: the previous day or week with unsorted emails, or the next chunk
    nextRun: (run) => {
      settleDeclutter()
      startDeclutter(run.day, run.seen ?? [])
    },
    // The end screen's bucket pills: leave Declutter and open that bucket (Amanda, 2026-11-24)
    openBucket(bucket) {
      settleDeclutter()
      setDeclutter(null)
      emailView.openBucket(bucket.id)
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
          setEmails(applyStep(emails, step, 'previous'))
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
          const after = applyStep(emails, step, 'change')
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
    // What comes next for each range (Stage 21c); the end screen's title is in declutterMessages.js
    const range = declutter.range ?? 'today'
    const unsortedDays = emails.filter(isUnsorted).map((email) => email.dayOffset)
    let nextRun = null
    let scopeName = dayLabel(day)
    if (range === 'week') {
      scopeName = weekLabel(day)
      const earlier = unsortedDays.filter((offset) => offset < weekBounds(day).start)
      if (earlier.length > 0) {
        const target = Math.max(...earlier)
        nextRun = { day: target, label: weekLabel(target), spoken: `Declutter ${weekLabel(target).toLowerCase()}` }
      }
    } else if (range === 'all') {
      scopeName = 'All Emails'
      const seen = [...(declutter.seen ?? []), ...deck]
      const remaining = listFor(emails, 'all', 0).filter((email) => !seen.includes(email.id)).length
      if (remaining > 0) {
        const next = Math.min(settings.chunkSize, remaining)
        nextRun = { day: 0, seen, label: `Next ${next}`, spoken: `Declutter the next ${next} emails` }
      }
    } else {
      const earlier = unsortedDays.filter((offset) => offset < day)
      if (earlier.length > 0) {
        const target = Math.max(...earlier)
        nextRun = { day: target, label: dayButtonLabel(target), spoken: `Declutter ${dayButtonLabel(target)}` }
      }
    }
    const movedEmails = deckEmails.filter((email) => email.removedTo === null && email.bucketId !== null)
    const progress = {
      archived: deckEmails.filter((email) => email.removedTo === 'archive').length,
      moved: movedEmails.length,
      // How many went to each bucket, in the buckets' order, for the end card's hover (Amanda, 2026-11-24)
      movedTo: buckets
        .map((bucket) => ({ bucket, count: movedEmails.filter((email) => email.bucketId === bucket.id).length }))
        .filter(({ count }) => count > 0),
      deleted: deckEmails.filter((email) => email.removedTo === 'trash' || email.removedTo === 'junk').length,
      read: unsortedLeft.filter((email) => readIds.includes(email.id)).length,
      left: unsortedLeft.length,
    }
    return {
      dayOffset: day,
      dayName: scopeName,
      range,
      endTitle: endTitle({ range, label: scopeName, deckSize: deck.length, progress, runNumber: declutter.runNumber ?? 0 }),
      nextRun,
      total: deck.length,
      position: shownPosition,
      email: deckEmails[shownPosition] ?? null,
      openEmail: emails.find((email) => email.id === declutter.openId) ?? null,
      hasPrevious: previousCard(emails, deck, shownPosition) >= 0,
      progress,
      actions: declutterActions,
      emailView: declutterEmailView,
      // Auto-archive suggestion or the offer that follows it (PRD F15), or null
      suggestion: findArchiveSuggestion(),
      suggestionActions,
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
      facilitator={{ addEmails: addArrivingEmails, addPatternEmails }}
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
          conflicts={{ ids: conflictEmails.map(({ email }) => email.id), open: () => setConflictsOpen(true) }}
          onHideRuleSuggestion={hideRuleSuggestion}
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
          onToastAction={(action) => {
            if (action.type === 'pause') pauseRules(action)
            else if (action.type === 'removeBucket') {
              // Undo for "Create a Chase bucket": the bucket goes, if nothing has gone into it yet
              if (!emails.some((email) => email.bucketId === action.bucketId && !email.removedTo)) {
                setBuckets(buckets.filter((b) => b.id !== action.bucketId))
                showToast(`Removed the ${action.name} bucket`)
              }
            } else archiveInstead(action.ids)
          }}
          zoneMode={zoneMode}
          emailView={emailView}
          onSendReply={sendReply}
          declutter={declutter && declutterScreen()}
        />
      ) : (
        <GmailInbox emails={emails} buckets={buckets} />
      )}
      {conflictsOpen && (
        <ConflictDialog conflicts={conflictEmails} onSort={sortConflicts} onClose={() => setConflictsOpen(false)} />
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
