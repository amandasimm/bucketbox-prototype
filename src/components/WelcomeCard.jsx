import { useEffect, useId, useRef } from 'react'
import DensityChoice from './DensityChoice.jsx'
import Icon from './Icon.jsx'
import { SwitchRow } from './SettingRows.jsx'

// The onboarding welcome card (PRD F12; brief item 7; Stage 24c; Amanda, 2026-11-25). It sits in
// the bucket area, where the buckets will go, whenever the Onboarding scenario starts fresh. Four
// steps, one question each, each with pictures and its default already picked. Every choice
// shows on the page at once (the Today list changes view, emails move, the buttons and rows
// change), and Done keeps them; Skip puts everything back as it was.

// What someone usually does with emails they don't need, and the buttons and zone it sets up
export const tidyChoices = {
  archive: { buttons: { archive: true, delete: false }, zone: 'archive' },
  delete: { buttons: { archive: false, delete: true }, zone: 'trash' },
  both: { buttons: { archive: true, delete: true }, zone: 'trash' },
}
export function tidyFrom(settings) {
  if (settings.buttons.archive && !settings.buttons.delete) return 'archive'
  if (settings.buttons.delete && !settings.buttons.archive) return 'delete'
  return 'both'
}

const STEPS = 4

// "17:00" -> "5:00 PM"
function clockLabel(time) {
  const [h, m] = time.split(':').map(Number)
  if (h === 0 && m === 0) return 'midnight'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

// A choice drawn as a small card: the picture on top, then a radio and its name and hint
function PictureChoice({ name, checked, onChange, label, hint, children }) {
  return (
    <label className={`welcome-choice ${checked ? 'is-checked' : ''}`}>
      <span className="welcome-choice-picture" aria-hidden="true">{children}</span>
      <span className="welcome-choice-text">
        <input type="radio" name={name} checked={checked} onChange={onChange} />
        <span>
          <span className="welcome-choice-label">{label}</span>
          {hint && <span className="welcome-choice-hint">{hint}</span>}
        </span>
      </span>
    </label>
  )
}

// Little drawings of the Today list for step 1
const rows = (n) => Array.from({ length: n }, (_, i) => <span key={i} className="mini-row" />)
function ViewPicture({ view }) {
  if (view === 'today') {
    return (
      <span className="mini-list">
        <span className="mini-heading">Today</span>
        {rows(4)}
      </span>
    )
  }
  if (view === 'week') {
    return (
      <span className="mini-list">
        <span className="mini-heading">This Week</span>
        <span className="mini-day" />
        {rows(2)}
        <span className="mini-day" />
        {rows(2)}
      </span>
    )
  }
  return (
    <span className="mini-list">
      <span className="mini-heading">
        All Emails <span className="mini-pager">1–50 ‹ ›</span>
      </span>
      {rows(5)}
    </span>
  )
}

export default function WelcomeCard({ settings, emails, onChange, onDone, onSkip, step, onStep }) {
  const ids = useId()
  const titleRef = useRef(null)
  const tidy = tidyFrom(settings)

  // Each step starts at its question, so keyboard and screen reader users land on it
  useEffect(() => {
    titleRef.current?.focus()
  }, [step])

  // Step 2's picture says how many of yesterday evening's emails now wait in Today
  const movedIn = emails.filter(
    (email) => email.calendarDayOffset === -1 && email.dayOffset === 0 && email.bucketId === null && email.removedTo === null,
  ).length

  const steps = {
    1: {
      title: 'How do you want to see your emails?',
      hint: 'Pick one and watch your list change.',
      body: (
        <>
          <div className="welcome-choices is-three">
            {[
              ['today', 'Today', 'One day at a time'],
              ['week', 'This Week', 'Monday to Sunday'],
              ['all', 'All Emails', 'Everything unsorted, in pages'],
            ].map(([value, label, hint]) => (
              <PictureChoice
                key={value}
                name={`${ids}-view`}
                checked={settings.range === value}
                onChange={() => onChange({ range: value })}
                label={label}
                hint={hint}
              >
                <ViewPicture view={value} />
              </PictureChoice>
            ))}
          </div>
          {settings.range === 'all' && (
            <div className="welcome-extra">
              <div className="setting-row">
                <label className="setting-text" htmlFor={`${ids}-page-size`}>
                  <span className="setting-label">Emails per page</span>
                  <span className="setting-hint">Like Gmail, 50 to start</span>
                </label>
                <select
                  id={`${ids}-page-size`}
                  className="dialog-select setting-select"
                  value={settings.pageSize}
                  onChange={(event) => onChange({ pageSize: Number(event.target.value) })}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <SwitchRow
                label="Show the count"
                hint="How many unsorted emails there are in all"
                checked={settings.showCount}
                onChange={(showCount) => onChange({ showCount })}
              />
            </div>
          )}
        </>
      ),
    },
    2: {
      title: 'When do you usually stop checking email?',
      hint: "Anything that arrives after this waits in the next day's Today list, so evening emails don't get missed.",
      body: (
        <>
          <div className="welcome-cutoff">
            <label className="setting-label" htmlFor={`${ids}-cutoff`}>I stop checking at</label>
            <input
              type="time"
              id={`${ids}-cutoff`}
              className="dialog-select setting-select setting-time"
              value={settings.cutoff}
              onChange={(event) => event.target.value && onChange({ cutoff: event.target.value })}
            />
          </div>
          {/* Yesterday evening's mail moving to this morning's list */}
          <div className="welcome-evening" aria-hidden="true">
            <span className="welcome-evening-day">
              <Icon name="bedtime" size={20} />
              <span>Yesterday after {clockLabel(settings.cutoff)}</span>
            </span>
            <span className="welcome-evening-mail">
              <Icon name="mail" size={18} />
              <Icon name="arrow_forward" size={18} />
            </span>
            <span className="welcome-evening-day is-today">
              <Icon name="wb_sunny" size={20} />
              <span>Today</span>
            </span>
          </div>
          <p className="welcome-note" role="status">
            {settings.cutoff === '00:00'
              ? 'Every email stays on the day it arrived.'
              : movedIn === 1
                ? '1 email from yesterday evening is waiting in Today.'
                : `${movedIn} emails from yesterday evening are waiting in Today.`}
          </p>
        </>
      ),
    },
    3: {
      title: "What do you usually do with emails you don't need?",
      hint: 'This picks the buttons under your list. Watch them change.',
      body: (
        <div className="welcome-choices is-three">
          {[
            ['archive', 'Archive them', 'Kept in All Mail', ['archive']],
            ['delete', 'Delete them', 'Moved to Trash', ['delete']],
            ['both', 'Both / It depends', 'Both buttons', ['archive', 'delete']],
          ].map(([value, label, hint, icons]) => (
            <PictureChoice
              key={value}
              name={`${ids}-tidy`}
              checked={tidy === value}
              onChange={() => onChange({ buttons: { ...settings.buttons, ...tidyChoices[value].buttons }, zone: tidyChoices[value].zone })}
              label={label}
              hint={hint}
            >
              <span className="mini-buttons">
                {icons.map((icon) => (
                  <span key={icon} className="mini-button">
                    <Icon name={icon} size={20} />
                  </span>
                ))}
              </span>
            </PictureChoice>
          ))}
        </div>
      ),
    },
    4: {
      title: 'How much space between emails?',
      hint: 'Roomy shows fewer emails at once, with bigger text.',
      body: (
        <DensityChoice name={`${ids}-density`} value={settings.density} onChange={(density) => onChange({ density })} legend="Density" hideLegend />
      ),
    },
  }
  const current = steps[step]

  return (
    <section className="welcome-card" aria-labelledby={`${ids}-title`}>
      <div className="welcome-top">
        <p className="welcome-kicker">Welcome to Bucketbox</p>
        <p className="welcome-progress">
          <span className="visually-hidden">Step </span>
          {step} of {STEPS}
        </p>
      </div>
      <div className="welcome-bar" aria-hidden="true">
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} className={i < step ? 'is-done' : ''} />
        ))}
      </div>
      <h2 id={`${ids}-title`} className="welcome-title" tabIndex={-1} ref={titleRef}>
        {current.title}
      </h2>
      <p className="welcome-hint">{current.hint}</p>
      <div className="welcome-body">{current.body}</div>
      <div className="welcome-buttons">
        <button type="button" className="text-button welcome-skip" onClick={onSkip}>
          Skip
        </button>
        {step > 1 && (
          <button type="button" className="text-button" onClick={() => onStep(step - 1)}>
            Back
          </button>
        )}
        <button type="button" className="filled-button" onClick={() => (step < STEPS ? onStep(step + 1) : onDone())}>
          {step < STEPS ? 'Next' : 'Done'}
        </button>
      </div>
    </section>
  )
}
