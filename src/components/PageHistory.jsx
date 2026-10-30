import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

// Undo and redo (PRD F8). Always visible, never in a menu (PRD §9). They sit at the bottom of
// Gmail's left nav, so they apply to the whole screen and never cover a bucket or a form
// (BUILD-LOG, 2026-10-30).
export default function PageHistory({ history }) {
  const undoLabel = history.canUndo ? `Undo: ${lowerFirst(history.label)}` : 'Nothing to undo'
  const redoLabel = history.canRedo ? `Redo: ${lowerFirst(history.label)}` : 'Nothing to redo'
  return (
    <div className="page-history" role="group" aria-label="Undo and redo">
      <IconButton label={undoLabel} disabled={!history.canUndo} onClick={history.undo} tooltipAlign="left">
        <Icon name="undo" />
      </IconButton>
      <IconButton label={redoLabel} disabled={!history.canRedo} onClick={history.redo} tooltipAlign="left">
        <Icon name="redo" />
      </IconButton>
    </div>
  )
}
