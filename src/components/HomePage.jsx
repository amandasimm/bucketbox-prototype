import BucketGrid from './BucketGrid.jsx'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import TodayList from './TodayList.jsx'
import './HomePage.css'

// Bucketbox home page: Today list on the left, buckets on the right (PRD §5).
// Undo and redo sit in the panel's bottom-right corner, so they read as applying
// to the whole screen (PRD F8; BUILD-LOG, 2026-10-29).
export default function HomePage({ emails, buckets, dayOffset }) {
  return (
    <div className="home-page">
      <div className="page-history" role="group" aria-label="Undo and redo">
        <IconButton label="Undo" tooltip="Nothing to undo" disabled>
          <Icon name="undo" />
        </IconButton>
        <IconButton label="Redo" tooltip="Nothing to redo" disabled tooltipAlign="right">
          <Icon name="redo" />
        </IconButton>
      </div>
      <TodayList emails={emails} dayOffset={dayOffset} />
      <BucketGrid buckets={buckets} emails={emails} />
    </div>
  )
}
