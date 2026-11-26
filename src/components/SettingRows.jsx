import Icon from './Icon.jsx'
import TimeField from './TimeField.jsx'
import { weekdayNames, weekSpan } from '../utils/range.js'

// Rows shared by Bucketbox settings and the onboarding welcome pop-up (Stage 24c), so both always
// look and behave the same.

// A Material-style switch: a labeled row with the switch on the right. disabled: shown but
// can't be changed yet (Suggestions, until F15/F16 are built)
export function SwitchRow({ label, hint, checked, onChange, disabled = false }) {
  return (
    <label className={`setting-row ${disabled ? 'is-disabled' : ''}`}>
      <span className="setting-text">
        <span className="setting-label">{label}</span>
        {hint && <span className="setting-hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="setting-switch-input" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="setting-switch" aria-hidden="true">
        <span className="setting-switch-thumb">{checked && <Icon name="check" size={14} />}</span>
      </span>
    </label>
  )
}

// A short list of choices where only one can be picked. stacked: one choice per row
export function ChoiceRow({ legend, name, value, options, onChange, stacked = false }) {
  return (
    <fieldset className="setting-choices">
      <legend className="setting-label">{legend}</legend>
      <div className={`setting-choice-list ${stacked ? 'is-stacked' : ''}`}>
        {options.map((option) => (
          <label key={option.value} className="dialog-choice">
            <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// All Emails' count (Amanda, 2026-11-26: a choice of three in place of the Show the count switch).
// Unsorted is the number that goes down as you sort; unread counts the unsorted emails not yet opened.
export function CountChoice({ name, value, onChange }) {
  return (
    <ChoiceRow
      legend="Show the count of"
      stacked
      name={name}
      value={value}
      onChange={onChange}
      options={[
        { value: 'unsorted', label: 'Unsorted emails' },
        { value: 'unread', label: 'Unread emails' },
        { value: 'none', label: 'No count' },
      ]}
    />
  )
}

// This Week's first day, a dropdown (Amanda, 2026-11-25): Monday to start
export function WeekStartRow({ ids, value, onChange }) {
  return (
    <div className="setting-row">
      <label className="setting-text" htmlFor={`${ids}-week-start`}>
        <span className="setting-label">Start the week on</span>
        <span className="setting-hint">This Week runs {weekSpan(value)}</span>
      </label>
      <select
        id={`${ids}-week-start`}
        className="dialog-select setting-select"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <option key={day} value={day}>{weekdayNames[day]}</option>
        ))}
      </select>
    </div>
  )
}

// The Today list's choices (PRD F6, F10; brief item 5; Stage 24a): Show (All Emails adds its
// page size, chunk size and count) and when the person stops checking email. draft is the
// settings being edited, set(fields) changes them, ids makes the fields' ids unique.
export function TodayListChoices({ ids, draft, set }) {
  return (
    <>
      <ChoiceRow
        legend="Show"
        name={`${ids}-range`}
        value={draft.range}
        onChange={(range) => set({ range })}
        options={[
          { value: 'today', label: 'Today (one day at a time)' },
          { value: 'week', label: 'This Week (one week at a time)' },
          { value: 'all', label: 'All Emails (every unsorted email, in pages)' },
        ]}
      />
      {draft.range === 'week' && <WeekStartRow ids={ids} value={draft.weekStart} onChange={(weekStart) => set({ weekStart })} />}
      {draft.range === 'all' && (
        <>
          <div className="setting-row">
            <label className="setting-text" htmlFor={`${ids}-page-size`}>
              <span className="setting-label">Emails per page</span>
              <span className="setting-hint">Like Gmail, 50 to start</span>
            </label>
            <select
              id={`${ids}-page-size`}
              className="dialog-select setting-select"
              value={draft.pageSize}
              onChange={(event) => set({ pageSize: Number(event.target.value) })}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="setting-row">
            <label className="setting-text" htmlFor={`${ids}-chunk-size`}>
              <span className="setting-label">Declutter in chunks of</span>
              <span className="setting-hint">How many emails one Declutter run takes</span>
            </label>
            <select
              id={`${ids}-chunk-size`}
              className="dialog-select setting-select"
              value={draft.chunkSize}
              onChange={(event) => set({ chunkSize: Number(event.target.value) })}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <CountChoice name={`${ids}-count`} value={draft.count} onChange={(count) => set({ count })} />
        </>
      )}
      {/* The day's end (Stage 24a; Amanda, 2026-11-24) */}
      <div className="setting-row">
        <label className="setting-text" htmlFor={`${ids}-cutoff`}>
          <span className="setting-label">When do you usually stop checking email?</span>
          <span className="setting-hint">Anything that arrives after this waits in the next day&apos;s Today list, so evening emails don&apos;t get missed</span>
        </label>
        {/* A typed time, 5 PM to start (Amanda, 2026-11-24; typed like Gmail's, 2026-11-26) */}
        <TimeField id={`${ids}-cutoff`} value={draft.cutoff} onChange={(cutoff) => set({ cutoff })} />
      </div>
    </>
  )
}
