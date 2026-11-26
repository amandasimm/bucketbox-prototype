import Icon from './Icon.jsx'

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

// A short list of choices where only one can be picked
export function ChoiceRow({ legend, name, value, options, onChange }) {
  return (
    <fieldset className="setting-choices">
      <legend className="setting-label">{legend}</legend>
      <div className="setting-choice-list">
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
          { value: 'week', label: 'This Week (Monday to Sunday)' },
          { value: 'all', label: 'All Emails (every unsorted email, in pages)' },
        ]}
      />
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
          <SwitchRow
            label="Show the count"
            hint="How many unsorted emails there are in all"
            checked={draft.showCount}
            onChange={(showCount) => set({ showCount })}
          />
        </>
      )}
      {/* The day's end (Stage 24a; Amanda, 2026-11-24) */}
      <div className="setting-row">
        <label className="setting-text" htmlFor={`${ids}-cutoff`}>
          <span className="setting-label">When do you usually stop checking email?</span>
          <span className="setting-hint">Anything that arrives after this waits in the next day&apos;s Today list, so evening emails don&apos;t get missed</span>
        </label>
        {/* A time field, 5 PM to start (Amanda, 2026-11-24). Clearing it keeps the last time. */}
        <input
          type="time"
          id={`${ids}-cutoff`}
          className="dialog-select setting-select setting-time"
          value={draft.cutoff}
          onChange={(event) => event.target.value && set({ cutoff: event.target.value })}
        />
      </div>
    </>
  )
}
