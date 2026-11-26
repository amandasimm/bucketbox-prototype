import { useEffect, useId, useRef } from 'react'
import DensityChoice from './DensityChoice.jsx'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import { CountChoice } from './SettingRows.jsx'
import TimeField from './TimeField.jsx'
import { weekdayNames } from '../utils/range.js'

// The onboarding welcome card (PRD F12; brief item 7; Stage 24c; Amanda, 2026-11-25). It sits in
// the bucket area, where the buckets will go, whenever the Onboarding scenario starts fresh. Up to
// four steps, one question each, each with pictures and its default already picked. Every choice
// shows on the page at once (the Today list changes view, emails move, the buttons and rows
// change), and Next on the last question keeps them; Skip puts everything back as it was.

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

// The steps for each view (Amanda, 2026-11-25; reordered 2026-11-26): choose the view, fine-tune
// it, then how emails look (density), then what to do with emails you don't need. The fine-tuning question: Today asks when they stop checking email;
// This Week, which day the week starts; All Emails, how many emails per page. The bucket step
// follows as step 5. The card's step is a position in this list.
const tuneStep = { today: 'cutoff', week: 'weekStart', all: 'pages' }
export function welcomeSteps(range) {
  return ['view', tuneStep[range], 'density', 'tidy']
}

// The card's header, shared with the bucket step (FirstBucketCard): a blue bar like a Gmail card's
// title bar (Amanda, 2026-11-26), with "Welcome to Bucketbox" in the Today list's heading style,
// the count and an X on the right, and one progress bar along its bottom edge, like Declutter's.
// The chevron (›) is Skip (Amanda, 2026-11-26; was an X); the bucket step has none.
export function WelcomeHeader({ step, total, onSkip }) {
  return (
    <header className="welcome-header">
      <p className="welcome-heading">Welcome to Bucketbox</p>
      <p className="welcome-count">
        <span className="visually-hidden">Step </span>
        {step} of {total}
      </p>
      {onSkip && (
        <IconButton label="Skip setup" tooltip="Skip" tooltipAlign="right" onClick={onSkip}>
          <Icon name="chevron_right" size={20} />
        </IconButton>
      )}
      <div className="welcome-progress-bar" aria-hidden="true">
        <span style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </header>
  )
}

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
      {/* The radio and name on one line, the smaller text under them from the card's edge (Amanda, 2026-11-25) */}
      <span className="welcome-choice-text">
        <input type="radio" name={name} checked={checked} onChange={onChange} />
        <span className="welcome-choice-label">{label}</span>
      </span>
      {hint && <span className="welcome-choice-hint">{hint}</span>}
    </label>
  )
}

// Little drawings of the Today list for step 1, all as tall as Today's (Amanda, 2026-11-26)
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
      <span className="mini-list is-week">
        <span className="mini-heading">This Week</span>
        <span className="mini-day" />
        {rows(2)}
        <span className="mini-day" />
        {rows(1)}
      </span>
    )
  }
  // "All", with a smaller pager, so its heading fits on one line (Amanda, 2026-11-26)
  return (
    <span className="mini-list">
      <span className="mini-heading">
        All <span className="mini-pager">1–50 ‹ ›</span>
      </span>
      {rows(4)}
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

  // The stop-checking step's picture says how many of yesterday evening's emails now wait in Today
  const movedIn = emails.filter(
    (email) => email.calendarDayOffset === -1 && email.dayOffset === 0 && email.bucketId === null && email.removedTo === null,
  ).length

  const steps = {
    view: {
      title: 'How do you want to group your emails?',
      hint: 'Pick the view that works for you. You can change it anytime.',
      body: (
        <div className="welcome-choices is-three">
            {/* Names only, no smaller text under them (Amanda, 2026-11-26) */}
            {[
              ['today', 'Today'],
              ['week', 'This Week'],
              ['all', 'All Emails'],
            ].map(([value, label]) => (
              <PictureChoice
                key={value}
                name={`${ids}-view`}
                checked={settings.range === value}
                onChange={() => onChange({ range: value })}
                label={label}
              >
                <ViewPicture view={value} />
              </PictureChoice>
            ))}
        </div>
      ),
    },
    cutoff: {
      title: 'When do you usually stop checking email?',
      hint: "Anything that arrives after this waits in the next day's Today list, so evening emails don't get missed.",
      body: (
        <>
          {/* The welcome card's fields sit right after their labels, without helper text */}
          <div className="welcome-field">
            <label className="setting-label" htmlFor={`${ids}-cutoff`}>I stop checking at</label>
            <TimeField id={`${ids}-cutoff`} value={settings.cutoff} onChange={(cutoff) => onChange({ cutoff })} />
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
                ? '1 email from yesterday evening is now visible in Today.'
                : `${movedIn} emails from yesterday evening are now visible in Today.`}
          </p>
        </>
      ),
    },
    // This Week's first day: the dropdown only; the list itself shows the change (Amanda, 2026-11-25:
    // a row of days drawn under it looked clickable)
    weekStart: {
      title: 'What day does your week start on?',
      hint: null, // no helper text (Amanda, 2026-11-26)
      body: (
        <div className="welcome-field">
          <label className="setting-label" htmlFor={`${ids}-week-start`}>Start the week on</label>
          <select
            id={`${ids}-week-start`}
            className="dialog-select setting-select"
            value={settings.weekStart}
            onChange={(event) => onChange({ weekStart: Number(event.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <option key={day} value={day}>{weekdayNames[day]}</option>
            ))}
          </select>
        </div>
      ),
    },
    // All Emails' pages (Amanda, 2026-11-25: moved here from step 1, so every view has the same steps)
    pages: {
      title: 'How many emails per page?',
      hint: null, // no helper text (Amanda, 2026-11-26)
      body: (
        <>
          <div className="welcome-field">
            <label className="setting-label" htmlFor={`${ids}-page-size`}>Emails per page</label>
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
          {/* Which count the heading shows (Amanda, 2026-11-26: three choices, not a switch) */}
          <CountChoice name={`${ids}-count`} value={settings.count} onChange={(count) => onChange({ count })} />
        </>
      ),
    },
    tidy: {
      title: "What do you do with emails you don't need?",
      hint: 'You can change this anytime in Bucketbox settings.',
      body: (
        <div className="welcome-choices is-three">
          {[
            ['archive', 'Archive', 'Kept in All Mail', ['archive']],
            ['delete', 'Delete', 'Moved to Trash', ['delete']],
            ['both', 'It depends', 'Show both buttons', ['archive', 'delete']],
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
    density: {
      title: 'How should emails be displayed?',
      hint: 'Roomy shows fewer emails at once, with bigger text.',
      body: (
        <DensityChoice name={`${ids}-density`} value={settings.density} onChange={(density) => onChange({ density })} legend="Density" hideLegend />
      ),
    },
  }
  // Five steps in all (Amanda, 2026-11-26): these four questions, then the bucket step
  // (FirstBucketCard), so the count is honest and the fourth question says Next, not Done
  const order = welcomeSteps(settings.range)
  const total = order.length + 1
  const current = steps[order[Math.min(step, order.length) - 1]]

  return (
    <section className="welcome-card" aria-labelledby={`${ids}-title`}>
      <WelcomeHeader step={step} total={total} onSkip={onSkip} />
      <h2 id={`${ids}-title`} className="welcome-title" tabIndex={-1} ref={titleRef}>
        {current.title}
      </h2>
      {current.hint && <p className="welcome-hint">{current.hint}</p>}
      <div className="welcome-body">{current.body}</div>
      <div className="welcome-buttons">
        {/* Back on the left (Amanda, 2026-11-25) */}
        {step > 1 && (
          <button type="button" className="text-button welcome-back" onClick={() => onStep(step - 1)}>
            Back
          </button>
        )}
        <button type="button" className="filled-button" onClick={() => (step < order.length ? onStep(step + 1) : onDone())}>
          Next
        </button>
      </div>
    </section>
  )
}
