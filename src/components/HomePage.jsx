import { useState } from 'react'
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
import EmailDrawer from './EmailDrawer.jsx'
import Icon from './Icon.jsx'
import Toast from './Toast.jsx'
import TodayList, { unsortedFor } from './TodayList.jsx'
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

// The drag chip sits just below and to the right of the pointer, like Gmail's, so it never
// covers the bucket or delete zone under the pointer (BUILD-LOG, 2026-10-31). With the
// keyboard there's no pointer, so it stays where dnd-kit puts it.
// Near the bottom of the screen it flips above the pointer so it stays fully visible.
function chipBesidePointer({ transform, activatorEvent, draggingNodeRect, overlayNodeRect }) {
  if (!activatorEvent || !draggingNodeRect || !('clientX' in activatorEvent)) return transform
  const pointerY = activatorEvent.clientY + transform.y
  const chipHeight = overlayNodeRect?.height ?? 44
  const below = pointerY + 12 + chipHeight <= window.innerHeight
  return {
    ...transform,
    x: transform.x + activatorEvent.clientX - draggingNodeRect.left + 12,
    y: transform.y + activatorEvent.clientY - draggingNodeRect.top + (below ? 12 : -12 - chipHeight),
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
  actions,
  bucketActions,
  toast,
  onToastAction,
  zoneMode,
  emailView,
  onSendReply,
}) {

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

  function onDragStart({ active }) {
    const email = active.data.current.email
    setDraggedIds(selectedIds.includes(email.id) ? selectedIds : [email.id])
    // The Today drawer covers the buckets, so it closes when a drag starts
    if (emailView.view.type === 'home' && emailView.openEmailId) {
      setHoldLayout(true)
      emailView.close()
    }
  }

  function onDragEnd({ over }) {
    if (over) actions.drop(draggedIds, over.data.current.target)
    setHoldLayout(false)
    setDraggedIds([])
  }

  const count = draggedIds.length
  const openBucket = emailView.view.type === 'bucket' && buckets.find((b) => b.id === emailView.view.bucketId)
  const todayEmails = unsortedFor(emails, dayOffset)
  const drawerEmail = todayEmails.find((email) => email.id === emailView.openEmailId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={findDropTarget}
      // The delete zone only appears once a drag starts, so targets are measured throughout
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setDraggedIds([])
        setHoldLayout(false)
      }}
    >
      {/* Bucket tiles never change width. With 1–2 buckets they stack in one column and the
          Today card takes the rest of the room; with 3 or more there are two columns.
          While an email is open, Today goes back to its usual width so the drawer has room
          (BUILD-LOG, 2026-10-30). */}
      <div
        className={`home-page ${(drawerEmail && !openBucket) || holdLayout ? 'drawer-open' : ''}`}
        data-bucket-cols={buckets.length <= 2 ? 1 : 2}
        style={{ '--bucket-cols': buckets.length <= 2 ? 1 : 2 }}
      >
        {/* The home page stays underneath an opened bucket, just visible around its edges,
            but can't be clicked or tabbed into until the bucket closes */}
        <div className="home-layer" inert={openBucket ? true : undefined}>
          <TodayList
            emails={emails}
            buckets={buckets}
            dayOffset={dayOffset}
            onChangeDay={onChangeDay}
            selectedIds={selectedIds}
            onSelect={onSelect}
            actions={actions}
            zoneMode={zoneMode}
            openEmailId={drawerEmail?.id}
            onOpen={emailView.open}
            covered={Boolean(openBucket)}
          />
          <div className="home-right">
            <BucketGrid
              buckets={buckets}
              emails={emails}
              bucketActions={bucketActions}
              onOpenBucket={emailView.openBucket}
              covered={Boolean(openBucket)}
            />
            {/* The drawer disappears when no Today emails remain (PRD F5) */}
            {drawerEmail && !openBucket && (
              <EmailDrawer
                email={drawerEmail}
                listIds={todayEmails.map((email) => email.id)}
                buckets={buckets}
                emailView={emailView}
                onSendReply={onSendReply}
              />
            )}
          </div>
        </div>
        {openBucket && (
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
          />
        )}
        <Toast toast={toast} onAction={onToastAction} />
      </div>

      {/* Gmail's drag chip, which follows the pointer (screenshot-gmail-move-email.png) */}
      <DragOverlay dropAnimation={null} modifiers={[chipBesidePointer]}>
        {count > 0 && (
          <div className="drag-chip">
            <Icon name="mail" size={20} />
            Move {count} {count === 1 ? 'conversation' : 'conversations'}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
