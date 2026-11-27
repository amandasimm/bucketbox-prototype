// A divider you can drag to change how wide the things on either side are, like the divider
// between two panes in a desktop app (BUILD-LOG, 2026-11-16). It sits in the 16px gap, shows a
// small bar on hover, and the pointer turns into a resize arrow.
// - Drag: onMove hears the pointer's position across the screen (down the screen for 'rows')
// - Keyboard: Left and Right arrows nudge it (Up and Down for 'rows'); Home (or a double-click)
//   puts it back
// direction: 'columns' (the default) sits between things side by side; 'rows' sits under a thing
// and changes its height, like a bucket's bottom edge (Amanda, 2026-11-27).
// Nothing is saved: a reload puts every divider back.
export default function Resizer({ label, className = '', style, onMove, onNudge, onReset, direction = 'columns' }) {
  const rows = direction === 'rows'
  function onPointerDown(event) {
    if (event.button !== 0) return
    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    handle.classList.add('is-dragging')
    const bodyClass = rows ? 'is-resizing-rows' : 'is-resizing'
    document.body.classList.add(bodyClass)
    const move = (moveEvent) => onMove(rows ? moveEvent.clientY : moveEvent.clientX)
    const stop = () => {
      handle.classList.remove('is-dragging')
      document.body.classList.remove(bodyClass)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  function onKeyDown(event) {
    const [less, more, step] = rows ? ['ArrowUp', 'ArrowDown', 16] : ['ArrowLeft', 'ArrowRight', 24]
    if (event.key === less) onNudge(-step)
    else if (event.key === more) onNudge(step)
    else if (event.key === 'Home') onReset()
    else return
    event.preventDefault()
  }

  return (
    <div
      role="separator"
      aria-orientation={rows ? 'horizontal' : 'vertical'}
      aria-label={`${label}. Use the ${rows ? 'up and down' : 'left and right'} arrow keys to resize, Home to reset`}
      tabIndex={0}
      className={`resizer ${rows ? 'is-rows' : ''} ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
    >
      <span className="resizer-bar" aria-hidden="true" />
    </div>
  )
}
