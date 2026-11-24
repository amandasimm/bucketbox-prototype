import { useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import BucketGrid from './BucketGrid.jsx'
import BucketView from './BucketView.jsx'
import Declutter from './Declutter.jsx'
import { DragMotionProvider, prefersReducedMotion } from './DragMotion.jsx'
import EmailDrawer from './EmailDrawer.jsx'
import ConflictBanner from './ConflictBanner.jsx'
import RulesPanel from './RulesPanel.jsx'
import { findRuleSuggestion } from '../utils/suggestRules.js'
import './RulesPanel.css'
import Envelope from './Envelope.jsx'
import Resizer from './Resizer.jsx'
import Toast from './Toast.jsx'
import TodayList from './TodayList.jsx'
import { listFor } from '../utils/range.js'
import './HomePage.css'

// With the mouse, the target is whatever is under the pointer. With the keyboard,
// the chip jumps onto a target, so the target is whatever the chip overlaps.
function findDropTarget(args) {
  return args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args)
}

// Keyboard dragging: the arrow keys jump the chip from one drop target to the next
// (each bucket, then the delete zone) instead of nudging it a few pixels at a time.
function jumpBetweenTargets(event, { context }) {
  const forward = event.code === 'ArrowRight' || event.code === 'ArrowDown'
  const back = event.code === 'ArrowLeft' || event.code === 'ArrowUp'
  if (!forward && !back) return undefined
  event.preventDefault()

  const { droppableContainers, droppableRects, collisionRect, over } = context
  const targets = droppableContainers
    .getEnabled()
    .map((container) => container.id)
    .filter((id) => droppableRects.has(id))
  if (targets.length === 0) return undefined

  const current = targets.indexOf(over?.id)
  const next =
    current === -1
      ? forward ? 0 : targets.length - 1
      : (current + (forward ? 1 : -1) + targets.length) % targets.length
  const rect = droppableRects.get(targets[next])
  const chip = collisionRect ?? { width: 0, height: 0 }
  return {
    x: rect.left + rect.width / 2 - chip.width / 2,
    y: rect.top + rect.height / 2 - chip.height / 2,
  }
}

// The envelope an email turns into (PRD F4; BUILD-LOG, 2026-11-13)
const ENVELOPE = 56
const BESIDE_POINTER = 12
// How long the envelope takes to fly into a bucket or the delete zone, or back to its row
const FLIGHT_MS = 420
const centerOf = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })

// The envelope sits just below and to the right of the pointer, like Gmail's chip did, so it never
// covers the bucket or delete zone under the pointer (BUILD-LOG, 2026-10-31). With the
// keyboard there's no pointer, so it stays where dnd-kit puts it.
// Near the bottom of the screen it flips above the pointer so it stays fully visible.
function chipBesidePointer({ transform, activatorEvent, draggingNodeRect, overlayNodeRect }) {
  if (!activatorEvent || !draggingNodeRect || !('clientX' in activatorEvent)) return transform
  const pointerY = activatorEvent.clientY + transform.y
  const chipHeight = overlayNodeRect?.height ?? ENVELOPE
  const below = pointerY + BESIDE_POINTER + chipHeight <= window.innerHeight
  return {
    ...transform,
    x: transform.x + activatorEvent.clientX - draggingNodeRect.left + BESIDE_POINTER,
    y: transform.y + activatorEvent.clientY - draggingNodeRect.top + (below ? BESIDE_POINTER : -BESIDE_POINTER - chipHeight),
  }
}

// Plain-language messages for screen readers while dragging
const screenReaderInstructions = {
  draggable:
    'To move this email, press Space or Enter. Use the arrow keys to choose a bucket or the delete zone, then press Space to drop it, or Escape to cancel.',
}
const announcements = {
  onDragStart: ({ active }) => `Picked up ${active.data.current.label}.`,
  onDragOver: ({ over }) => (over ? `Over ${over.data.current.label}.` : 'Not over a drop target.'),
  onDragEnd: ({ over }) => (over ? `Dropped on ${over.data.current.label}.` : 'Dropped. Nothing moved.'),
  onDragCancel: () => 'Cancelled. Nothing moved.',
}

// Bucketbox home page: Today list on the left, buckets on the right (PRD §5).
// Undo and redo sit in the panel's bottom-right corner, so they read as applying
// to the whole screen (PRD F8; BUILD-LOG, 2026-10-29).
export default function HomePage({
  emails,
  buckets,
  dayOffset,
  onChangeDay,
  selectedIds,
  onSelect,
  leavingIds,
  settings,
  reordering,
  actions,
  bucketActions,
  toast,
  onToastAction,
  zoneMode,
  emailView,
  onSendReply,
  onDeclutter,
  declutter,
  conflicts,
  onHideRuleSuggestion,
}) {
  // Suggested rules hidden in settings (PRD F16)
  const ruleSuggestionSkips = settings.hiddenSuggestions.map((hidden) => hidden.key).filter(Boolean)

  // The emails being dragged. Grabbing a checked Today email brings all the checked ones along.
  const [draggedIds, setDraggedIds] = useState([])
  // When a drag starts with an email open, the drawer closes; this keeps Today at the narrower
  // "email open" width until the drop, so the page doesn't jump mid-drag (BUILD-LOG, 2026-10-31)
  const [holdLayout, setHoldLayout] = useState(false)
  const sensors = useSensors(
    // A small movement before a drag starts, so a click on the handle doesn't count as a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpBetweenTargets }),
  )

  // The envelope animation (PRD F4; BUILD-LOG, 2026-11-13), for dragging only:
  // - pickup: the row shrinks into an envelope at the pointer, and stays behind as a faded ghost
  // - flight: on a drop the envelope flies to where the email will appear and fades into it;
  //   if nothing was hit it flies back to its row
  // - landing: only then does the email actually move, so the count ticks up as it arrives
  const [pickup, setPickup] = useState(null) // the shrinking outline of the row
  const [flight, setFlight] = useState(null) // the envelope after it's let go
  const [landingIds, setLandingIds] = useState([]) // ghosts waiting for their envelope to land
  const [closingIds, setClosingIds] = useState([]) // ghosts closing up just before it lands
  const [arrivedIds, setArrivedIds] = useState([]) // rows that just appeared in a bucket
  const [overColor, setOverColor] = useState(null) // the color of the bucket under the envelope
  // The Today card's width once someone drags the divider beside it (null = the usual layout).
  // Nothing is saved; a reload puts it back (BUILD-LOG, 2026-11-16).
  const [todayWidth, setTodayWidth] = useState(null)
  // A bucket's rules panel (PRD F14; brief 1b): null, or { bucketId, emailId } where emailId is
  // the email a rule is being started from ("Make a rule from this email")
  const [rulesFor, setRulesFor] = useState(null)
  const pageRef = useRef(null)
  const todayCard = () => pageRef.current.querySelector('.today-list').getBoundingClientRect()
  const startRect = useRef(null)
  const actionsRef = useRef(actions)
  actionsRef.current = actions
  const without = (ids) => (current) => current.filter((id) => !ids.includes(id))

  function onDragStart({ active, activatorEvent }) {
    const email = active.data.current.email
    setDraggedIds(selectedIds.includes(email.id) ? selectedIds : [email.id])
    // The Today drawer covers the buckets, so it closes when a drag starts
    if (emailView.view.type === 'home' && emailView.openEmailId) {
      setHoldLayout(true)
      emailView.close()
    }
    const row = activatorEvent?.target?.closest?.('.email-row')
    startRect.current = row?.getBoundingClientRect() ?? null
    // With the mouse, the row's outline shrinks into the envelope beside the pointer
    if (startRect.current && 'clientX' in activatorEvent) {
      const rect = startRect.current
      const from = centerOf(rect)
      const to = BESIDE_POINTER + ENVELOPE / 2
      setPickup({
        key: Date.now(),
        style: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          '--move-x': `${activatorEvent.clientX + to - from.x}px`,
          '--move-y': `${activatorEvent.clientY + to - from.y}px`,
          '--shrink-x': ENVELOPE / rect.width,
          '--shrink-y': (ENVELOPE * 0.6) / rect.height,
        },
      })
    }
  }

  // Where the envelope is heading: the top of the bucket's list (where the email appears),
  // a bucket pill, or the circle in the delete zone
  function landingPoint(over) {
    const rect = over.rect
    if (String(over.id).startsWith('bucket:')) return { x: rect.left + 36, y: rect.top + 72 }
    if (over.id === 'delete-zone') {
      const circle = [...document.querySelectorAll('.delete-zone-circle')]
        .map((node) => centerOf(node.getBoundingClientRect()))
        .find((point) => point.x > rect.left && point.x < rect.left + rect.width && point.y > rect.top && point.y < rect.top + rect.height)
      if (circle) return circle
    }
    return centerOf(rect)
  }

  function onDragEnd({ over, activatorEvent, delta }) {
    const ids = draggedIds
    const target = over?.data.current.target
    setOverColor(null)
    setDraggedIds([])
    setPickup(null)

    if (prefersReducedMotion()) {
      if (target) actions.drop(ids, target)
      setHoldLayout(false)
      return
    }

    // Where the envelope is when it's let go: beside the pointer, or on the target with the keyboard
    const half = ENVELOPE / 2
    const from =
      activatorEvent && 'clientX' in activatorEvent
        ? { x: activatorEvent.clientX + delta.x + BESIDE_POINTER + half, y: activatorEvent.clientY + delta.y + BESIDE_POINTER + half }
        : centerOf(over?.rect ?? startRect.current ?? { left: 0, top: 0, width: 0, height: 0 })
    const to = target ? landingPoint(over) : centerOf(startRect.current ?? { left: from.x, top: from.y, width: 0, height: 0 })
    setFlight({
      key: Date.now(),
      count: ids.length,
      kind: target ? 'drop' : 'return',
      tint: target?.bucket?.color ?? null,
      style: { left: from.x - half, top: from.y - half, '--move-x': `${to.x - from.x}px`, '--move-y': `${to.y - from.y}px` },
    })

    if (!target) {
      // Nothing was hit: the envelope goes home and the ghost row comes back
      setHoldLayout(false)
      return
    }
    setLandingIds((current) => [...current, ...ids])
    setTimeout(() => setClosingIds((current) => [...current, ...ids]), FLIGHT_MS - 200)
    setTimeout(() => {
      actionsRef.current.drop(ids, target)
      setLandingIds(without(ids))
      setClosingIds(without(ids))
      setHoldLayout(false)
      if (target.type === 'bucket') {
        setArrivedIds((current) => [...current, ...ids])
        setTimeout(() => setArrivedIds(without(ids)), 700)
      }
    }, FLIGHT_MS)
  }

  // Escape while dragging: the envelope goes back to its row
  function onDragCancel() {
    setOverColor(null)
    setDraggedIds([])
    setPickup(null)
    setHoldLayout(false)
  }

  const motion = {
    ghostIds: [...draggedIds, ...landingIds],
    leavingIds: [...leavingIds, ...closingIds],
    arrivedIds,
  }

  // Opening rules from the Today drawer closes the drawer, since the panel takes its place
  // fromForm: 'grid' or 'view' when opened from a bucket's edit or new-bucket form, so closing
  // the panel without saving goes back to that bucket's edit form (Amanda, 2026-11-21)
  // options.preview: open at "Already in your inbox" ("Sort your backlog now?" on an empty bucket, 1i)
  function openRules(bucketId, email = null, fromForm = null, options = {}) {
    if (emailView.view.type === 'home' && emailView.openEmailId) emailView.close()
    setRulesFor({ bucketId, emailId: email?.id ?? null, fromForm, preview: Boolean(options.preview), suggestion: options.suggestion ?? null, key: Date.now() })
  }
  // Asks the bucket grid or the opened bucket to show a bucket's edit form again: { bucketId, where, key }
  const [formRequest, setFormRequest] = useState(null)
  // Saving or closing the rules goes back to wherever they were opened from: the bucket's form
  // (edit or new) reopens; from the 3-dot menu, the tile footer or an email, it just closes
  // (Amanda, 2026-11-21)
  function closeRules() {
    if (rulesFor?.fromForm) setFormRequest({ bucketId: rulesFor.bucketId, where: rulesFor.fromForm, key: Date.now() })
    setRulesFor(null)
  }

  const count = draggedIds.length
  const openBucket = emailView.view.type === 'bucket' && buckets.find((b) => b.id === emailView.view.bucketId)
  // What the Today list shows for the chosen range (brief item 5)
  const todayEmails = listFor(emails, settings.range, dayOffset)
  const drawerEmail = todayEmails.find((email) => email.id === emailView.openEmailId)
  const rulesBucket = rulesFor && buckets.find((b) => b.id === rulesFor.bucketId)
  // "From an email" offers the viewed day's Today list and the bucket's own emails
  const rulesEmails = rulesBucket
    ? [
        { label: 'Today list', emails: todayEmails },
        {
          label: `In ${rulesBucket.name}`,
          emails: emails.filter((email) => email.bucketId === rulesBucket.id && email.removedTo === null).sort((a, b) => b.receivedAt - a.receivedAt),
        },
      ].filter((group) => group.emails.length > 0)
    : []

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={findDropTarget}
      // The delete zone only appears once a drag starts, so targets are measured throughout
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={onDragStart}
      onDragOver={({ over }) => setOverColor(over?.data.current.target.bucket?.color ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <DragMotionProvider value={motion}>
      {/* Bucket tiles never change width. With 1–2 buckets they stack in one column and the
          Today card takes the rest of the room; with 3 or more there are two columns.
          While an email is open, Today goes back to its usual width so the drawer has room
          (BUILD-LOG, 2026-10-30). */}
      <div
        ref={pageRef}
        className={[
          'home-page',
          (drawerEmail && !openBucket) || holdLayout ? 'drawer-open' : '',
          todayWidth === null ? '' : 'is-resized',
          // Bucketbox's settings show up as classes the styles respond to (BUILD-LOG, 2026-11-16)
          `labels-${settings.labels}`,
          ...Object.entries(settings.buttons).map(([name, shown]) => (shown ? '' : `hide-${name}`)),
        ].join(' ')}
        data-bucket-cols={buckets.length <= 2 ? 1 : 2}
        style={{ '--bucket-cols': buckets.length <= 2 ? 1 : 2, '--today-width': todayWidth === null ? undefined : `${todayWidth}px` }}
      >
        {/* The home page stays underneath an opened bucket, just visible around its edges,
            but can't be clicked or tabbed into until the bucket closes */}
        <div className="home-layer" inert={openBucket || declutter || rulesBucket ? true : undefined}>
          {/* Across both the Today list and the buckets (Amanda, 2026-11-21) */}
          <ConflictBanner count={conflicts.ids.length} onOpen={conflicts.open} />
          <TodayList
            emails={emails}
            buckets={buckets}
            dayOffset={dayOffset}
            range={settings.range}
            pageSize={settings.pageSize}
            showCount={settings.showCount}
            onChangeDay={onChangeDay}
            onDeclutter={onDeclutter}
            selectedIds={selectedIds}
            onSelect={onSelect}
            actions={actions}
            zoneMode={zoneMode}
            openEmailId={drawerEmail?.id}
            onOpen={emailView.open}
            covered={Boolean(openBucket || declutter)}
          />
          {/* Drag to make the Today list wider or narrower; the buckets take the rest */}
          <Resizer
            label="Resize the Today list and the buckets"
            className="is-main"
            onMove={(x) => setTodayWidth(Math.round(x - todayCard().left - 8))}
            onNudge={(by) => setTodayWidth(Math.round(todayCard().width + by))}
            onReset={() => setTodayWidth(null)}
          />
          <div className="home-right">
            <BucketGrid
              buckets={buckets}
              emails={emails}
              bucketActions={bucketActions}
              onOpenBucket={emailView.openBucket}
              covered={Boolean(openBucket || declutter)}
              reordering={reordering}
              onRules={openRules}
              formRequest={formRequest?.where === 'grid' ? formRequest : null}
              autoSort={settings.autoSort}
            />
            {/* The drawer disappears when no Today emails remain (PRD F5) */}
            {drawerEmail && !openBucket && (
              <EmailDrawer
                email={drawerEmail}
                listIds={todayEmails.map((email) => email.id)}
                buckets={buckets}
                emailView={emailView}
                onSendReply={onSendReply}
                onMakeRule={(bucket, email) => openRules(bucket.id, email)}
              />
            )}
          </div>
        </div>
        {openBucket && (
          <div className="home-layer" inert={rulesBucket ? true : undefined}>
          <BucketView
            bucket={openBucket}
            emails={emails}
            buckets={buckets}
            selectedIds={selectedIds}
            onSelect={onSelect}
            actions={actions}
            zoneMode={zoneMode}
            emailView={emailView}
            onSendReply={onSendReply}
            bucketActions={bucketActions}
            onRules={openRules}
            formRequest={formRequest?.where === 'view' ? formRequest : null}
            autoSort={settings.autoSort}
          />
          </div>
        )}
        {rulesBucket && (
          <RulesPanel
            key={rulesFor.key}
            bucket={rulesBucket}
            startEmail={emails.find((email) => email.id === rulesFor.emailId) ?? null}
            openAtPreview={rulesFor.preview}
            startSuggestion={rulesFor.suggestion}
            suggestion={settings.suggestions ? findRuleSuggestion(rulesBucket, emails, ruleSuggestionSkips) : null}
            onHideSuggestion={onHideRuleSuggestion}
            autoSort={settings.autoSort}
            pickableEmails={rulesEmails}
            emails={emails}
            onSave={(values, moveIds) => {
              bucketActions.setRules(rulesBucket.id, values, moveIds)
              closeRules()
            }}
            onClose={closeRules}
          />
        )}
        {declutter && (
          <Declutter key={declutter.dayOffset} declutter={declutter} buckets={buckets} onSendReply={onSendReply} />
        )}
        {/* "Create rule" on a suggested-rule toast opens that bucket's rules with the rule ready (F16) */}
        <Toast
          toast={toast}
          onAction={(action) => (action.type === 'suggestRule' ? openRules(action.bucketId, null, null, { suggestion: action }) : onToastAction(action))}
        />
      </div>

      </DragMotionProvider>

      {/* The envelope, which follows the pointer in place of Gmail's "Move 1 conversation" chip */}
      <DragOverlay dropAnimation={null} modifiers={[chipBesidePointer]}>
        {count > 0 && (
          <div className="drag-envelope">
            <Envelope count={count} size={ENVELOPE} tint={overColor} />
            <span className="visually-hidden">
              Moving {count} {count === 1 ? 'email' : 'emails'}
            </span>
          </div>
        )}
      </DragOverlay>
      {pickup && (
        <div key={pickup.key} className="pickup-shrink" style={pickup.style} aria-hidden="true" onAnimationEnd={() => setPickup(null)} />
      )}
      {flight && (
        <div
          key={flight.key}
          className={`envelope-flight is-${flight.kind}`}
          style={flight.style}
          aria-hidden="true"
          onAnimationEnd={() => setFlight(null)}
        >
          <div className="envelope-flight-down">
            <div className="envelope-flight-hop">
              <Envelope count={flight.count} size={ENVELOPE} tint={flight.tint} />
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}
