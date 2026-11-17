import { createContext, useContext } from 'react'

// Which emails are mid-animation, so rows can show it (BUILD-LOG, 2026-11-13):
// - ghostIds: being dragged right now; their rows stay behind, faded
// - leavingIds: about to go; their rows close up
// - arrivedIds: just landed in a bucket; their rows fade in
const empty = { ghostIds: [], leavingIds: [], arrivedIds: [] }
const DragMotionContext = createContext(empty)

export const DragMotionProvider = DragMotionContext.Provider
export const useDragMotion = () => useContext(DragMotionContext)

// True when the computer asks for less motion, or Animations is switched off in Bucketbox's settings
export const prefersReducedMotion = () =>
  document.body.classList.contains('no-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
