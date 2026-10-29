// Mock emails store a day offset (0 = today) and a 24-hour time.
// These helpers turn that into a real date, relative to the day the prototype is opened.

export function receivedAt(dayOffset, time) {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hours, minutes, 0, 0)
  return date
}

// "12:42 PM", shown on Today list rows
export function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// "Oct 25", shown on bucket rows
export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Newest first (BUILD-LOG, 2026-10-28)
export function newestFirst(a, b) {
  return b.receivedAt - a.receivedAt
}
