import { useState } from 'react'

// The "stop checking" time field (Amanda, 2026-11-26), like Gmail's Schedule send time: a plain
// text field with no clock icon or dropdown. Type the time any common way ("5pm", "5:30 pm",
// "17:30", "noon"); Enter or leaving the field tidies it to "5:30 PM". Something it can't read
// goes back to the last time. value and onChange use "HH:MM" (24-hour), like the settings.

// "17:30" -> "5:30 PM"
export function formatTime(time) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

// "5:30 pm" -> "17:30"; null if it isn't a time
export function parseTime(text) {
  const t = text.trim().toLowerCase().replace(/\./g, '')
  if (t === 'midnight') return '00:00'
  if (t === 'noon') return '12:00'
  const match = t.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am?|pm?)?$/)
  if (!match) return null
  let h = Number(match[1])
  const m = Number(match[2] ?? 0)
  const half = match[3]
  if (m > 59) return null
  if (half) {
    if (h < 1 || h > 12) return null
    h = (h % 12) + (half.startsWith('p') ? 12 : 0)
  } else if (h > 23) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function TimeField({ id, value, onChange }) {
  const [draft, setDraft] = useState(null) // what's typed, while the field is being edited
  function commit() {
    if (draft === null) return
    const time = parseTime(draft)
    if (time && time !== value) onChange(time)
    setDraft(null)
  }
  return (
    <input
      type="text"
      id={id}
      className="time-field"
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
      value={draft ?? formatTime(value)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        } else if (event.key === 'Escape' && draft !== null) {
          // Esc puts the last time back (and doesn't close the settings menu while typing)
          event.stopPropagation()
          setDraft(null)
        }
      }}
    />
  )
}
