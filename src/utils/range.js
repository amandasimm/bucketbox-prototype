// The Today list's range (PRD F6, F10; brief item 5; BUILD-LOG 2026-11-22): 'today' (the default),
// 'week' or, from Stage 21b, 'all'. In week mode the viewed day (dayOffset) picks the week: the
// week it falls in, Monday to Sunday unless the person picks another first day (Amanda,
// 2026-11-25). Days are offsets from today (0 = today).
import { newestFirst } from './dates.js'

const isUnsorted = (email) => email.bucketId === null && email.removedTo === null

const dateOf = (dayOffset) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + dayOffset)
  return date
}

// The first day of the week, 0 = Sunday … 6 = Saturday (settings.weekStart, Monday to start). App
// sets it before each render, so every week below follows the setting without passing it around.
let firstDay = 1
export function setWeekStart(day) {
  firstDay = day
}

// The days of the week, in the order the week-start dropdown lists them, and their names
export const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// "Monday to Sunday", "Sunday to Saturday"…
export const weekSpan = (day) => `${weekdayNames[day]} to ${weekdayNames[(day + 6) % 7]}`

// The week holding dayOffset: { start, end } as offsets (end may be in the future)
export function weekBounds(dayOffset) {
  const weekday = (dateOf(dayOffset).getDay() - firstDay + 7) % 7 // the first day = 0
  const start = dayOffset - weekday
  return { start, end: start + 6 }
}

export const weekHolds = (dayOffset, offset) => {
  const { start, end } = weekBounds(dayOffset)
  return offset >= start && offset <= end
}

// "This Week", "Last Week", or "Nov 3–9" (with the year for another year)
export function weekLabel(dayOffset) {
  const { start, end } = weekBounds(dayOffset)
  const thisWeek = weekBounds(0)
  if (start === thisWeek.start) return 'This Week'
  if (start === thisWeek.start - 7) return 'Last Week'
  const from = dateOf(start)
  const to = dateOf(end)
  const otherYear = to.getFullYear() !== new Date().getFullYear()
  const month = (date) => date.toLocaleDateString('en-US', { month: 'short' })
  const range = from.getMonth() === to.getMonth() ? `${month(from)} ${from.getDate()}–${to.getDate()}` : `${month(from)} ${from.getDate()} – ${month(to)} ${to.getDate()}`
  return otherYear ? `${range}, ${to.getFullYear()}` : range
}

// A day's heading inside the week, in two parts (Amanda, 2026-11-22): { name: "Today" / "Yesterday" /
// "Thursday", date: "Nov 20" } (the date with its year in another year)
export function dayHeading(dayOffset) {
  const date = dateOf(dayOffset)
  const name = dayOffset === 0 ? 'Today' : dayOffset === -1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'long' })
  const otherYear = date.getFullYear() !== new Date().getFullYear()
  return { name, date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: otherYear ? 'numeric' : undefined }) }
}

// The unsorted emails the Today list shows for this range, newest first
export function listFor(emails, range, dayOffset) {
  const unsorted = emails.filter(isUnsorted)
  if (range === 'week') return unsorted.filter((email) => weekHolds(dayOffset, email.dayOffset)).sort(newestFirst)
  if (range === 'all') return unsorted.sort(newestFirst)
  return unsorted.filter((email) => email.dayOffset === dayOffset).sort(newestFirst)
}

// Everything that arrived in the range (sorted or not), for the empty messages
export function receivedIn(emails, range, dayOffset) {
  if (range === 'week') return emails.filter((email) => weekHolds(dayOffset, email.dayOffset))
  if (range === 'all') return emails
  return emails.filter((email) => email.dayOffset === dayOffset)
}
