// A divider you can drag to change how wide the things on either side are, like the divider
// between two panes in a desktop app (BUILD-LOG, 2026-11-16). It sits in the 16px gap, shows a
// small bar on hover, and the pointer turns into a resize arrow.
// - Drag: onMove hears the pointer's position across the screen
// - Keyboard: Left and Right arrows nudge it; Home (or a double-click) puts it back
// Nothing is saved: a reload puts every divider back.
export default function Resizer({ label, className = '', style, onMove, onNudge, onReset }) {
  function onPointerDown(event) {
    if (event.button !== 0) return
    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    handle.classList.add('is-dragging')
    document.body.classList.add('is-resizing')
    const move = (moveEvent) => onMove(moveEvent.clientX)
    const stop = () => {
      handle.classList.remove('is-dragging')
      document.body.classList.remove('is-resizing')
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowLeft') onNudge(-24)
    else if (event.key === 'ArrowRight') onNudge(24)
    else if (event.key === 'Home') onReset()
    else return
    event.preventDefault()
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`${label}. Use the left and right arrow keys to resize, Home to reset`}
      tabIndex={0}
      className={`resizer ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
    >
      <span className="resizer-bar" aria-hidden="true" />
    </div>
  )
}
