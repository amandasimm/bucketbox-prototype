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
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import Toast from './Toast.jsx'
import TodayList from './TodayList.jsx'
import './HomePage.css'

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

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
  selectedIds,
  onSelect,
  actions,
  bucketActions,
  history,
  toast,
  onToastAction,
  zoneMode,
}) {
  const undoLabel = history.canUndo ? `Undo: ${lowerFirst(history.label)}` : 'Nothing to undo'
  const redoLabel = history.canRedo ? `Redo: ${lowerFirst(history.label)}` : 'Nothing to redo'

  // The emails being dragged. Grabbing a checked Today email brings all the checked ones along.
  const [draggedIds, setDraggedIds] = useState([])
  const sensors = useSensors(
    // A small movement before a drag starts, so a click on the handle doesn't count as a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpBetweenTargets }),
  )

  function onDragStart({ active }) {
    const email = active.data.current.email
    const draggingChecked = email.bucketId === null && selectedIds.includes(email.id)
    setDraggedIds(draggingChecked ? selectedIds : [email.id])
  }

  function onDragEnd({ over }) {
    if (over) actions.drop(draggedIds, over.data.current.target)
    setDraggedIds([])
  }

  const count = draggedIds.length

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={findDropTarget}
      // The delete zone only appears once a drag starts, so targets are measured throughout
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggedIds([])}
    >
      <div className="home-page">
        <div className="page-history" role="group" aria-label="Undo and redo">
          <IconButton label={undoLabel} disabled={!history.canUndo} onClick={history.undo}>
            <Icon name="undo" />
          </IconButton>
          <IconButton label={redoLabel} disabled={!history.canRedo} onClick={history.redo} tooltipAlign="right">
            <Icon name="redo" />
          </IconButton>
        </div>
        <TodayList
          emails={emails}
          buckets={buckets}
          dayOffset={dayOffset}
          selectedIds={selectedIds}
          onSelect={onSelect}
          actions={actions}
          zoneMode={zoneMode}
        />
        <BucketGrid buckets={buckets} emails={emails} bucketActions={bucketActions} />
        <Toast toast={toast} onAction={onToastAction} />
      </div>

      {/* Gmail's drag chip, which follows the pointer (screenshot-gmail-move-email.png) */}
      <DragOverlay dropAnimation={null}>
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
