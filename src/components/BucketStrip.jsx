import { useDndContext, useDroppable } from '@dnd-kit/core'
import DashedOutline from './DashedOutline.jsx'
import { bucketStyle } from '../utils/bucketColors.js'

// One other bucket as a slim drop target in the opened bucket's header
function BucketPill({ bucket }) {
  // Its own id, so it doesn't clash with the same bucket's tile on the home page underneath
  const { setNodeRef, isOver } = useDroppable({
    id: `strip:${bucket.id}`,
    data: { target: { type: 'bucket', bucket }, label: `${bucket.name} bucket` },
  })
  return (
    <span ref={setNodeRef} className={`bucket-pill ${isOver ? 'is-over' : ''}`} style={bucketStyle(bucket.color)}>
      <DashedOutline className="bucket-pill-outline" inset={0.75} radius={17.25} dash={5} gap={4} />
      {bucket.emoji ? (
        <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span>
      ) : (
        <span className="bucket-swatch" aria-hidden="true" />
      )}
      <span className="bucket-pill-name">{bucket.name}</span>
    </span>
  )
}

// While an email is dragged inside an opened bucket, the other buckets (hidden behind it)
// appear along its header as drop targets, in the same resting and active styles as the
// home page tiles (BUILD-LOG, 2026-10-30). The delete zone appears in place of the list's buttons.
export default function BucketStrip({ buckets, currentBucketId }) {
  const { active } = useDndContext()
  if (!active) return null
  const others = buckets.filter((bucket) => bucket.id !== currentBucketId)
  if (others.length === 0) return null
  return (
    <span className="bucket-strip" aria-hidden="true">
      <span className="bucket-strip-label">Move to</span>
      {others.map((bucket) => (
        <BucketPill key={bucket.id} bucket={bucket} />
      ))}
    </span>
  )
}
