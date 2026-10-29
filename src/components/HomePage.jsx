import BucketGrid from './BucketGrid.jsx'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import Toast from './Toast.jsx'
import TodayList from './TodayList.jsx'
import './HomePage.css'

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

// Bucketbox home page: Today list on the left, buckets on the right (PRD §5).
// Undo and redo sit in the panel's bottom-right corner, so they read as applying
// to the whole screen (PRD F8; BUILD-LOG, 2026-10-29).
export default function HomePage({ emails, buckets, dayOffset, selectedIds, onSelect, actions, history, toast }) {
  const undoLabel = history.canUndo ? `Undo: ${lowerFirst(history.label)}` : 'Nothing to undo'
  const redoLabel = history.canRedo ? `Redo: ${lowerFirst(history.label)}` : 'Nothing to redo'

  return (
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
      />
      <BucketGrid buckets={buckets} emails={emails} />
      <Toast toast={toast} />
    </div>
  )
}
