import { useEffect, useRef, useState } from 'react'
import { gmailLabels, starterBuckets } from '../data/startingSetup.js'
import { bucketColorFor, bucketStyle } from '../utils/bucketColors.js'
import BucketForm from './BucketForm.jsx'
import Icon from './Icon.jsx'
import { WelcomeHeader } from './WelcomeCard.jsx'

// What the bucket area shows while there are no buckets (Amanda, 2026-11-25): the welcome card's
// look, asking for the first buckets. Right after onboarding's steps it keeps their header, as the
// last step, with Back to the steps; it also shows whenever every bucket has been deleted (PRD F2:
// "the same empty state as onboarding"). It goes away once buckets exist.
// Starter buckets (Stage 24d; PRD F12): cards that look like small bucket tiles. Picking several is
// fine (Amanda, 2026-11-25): each card turns on or off, "Make your own" opens the usual bucket form
// and adds that bucket to the picks, and Continue makes every picked bucket at once.
// picks: [{ name, color, emoji, picked, own }], kept by HomePage so Back and Next don't lose them.
export const startingPicks = () => starterBuckets.map((starter) => ({ ...starter, picked: false }))
// The Gmail labels list (Amanda, 2026-11-26): closed to start, and nothing checked when it opens
// (Amanda changed her mind the same day: none, not all). Only labels in the open list become buckets.
export const startingLabels = () => ({ open: false, checked: [] })
const isUnsorted = (email) => email.bucketId === null && email.removedTo === null

// "Use my Gmail labels" and its list: a Select all, then each label with how many of its emails
// will come along. Shown only when the person has labels.
function LabelList({ labels, onLabels, emails }) {
  const selectAllRef = useRef(null)
  const allChecked = labels.checked.length === gmailLabels.length
  const someChecked = labels.checked.length > 0 && !allChecked
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked
  }, [someChecked, labels.open])
  const toggle = (name) =>
    onLabels({ ...labels, checked: labels.checked.includes(name) ? labels.checked.filter((n) => n !== name) : [...labels.checked, name] })
  const count = (label) => emails.filter((email) => label.emailIds.includes(email.id) && isUnsorted(email)).length

  return (
    <div className={`label-import ${labels.open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="text-button label-import-toggle"
        aria-expanded={labels.open}
        aria-controls="label-import-list"
        onClick={() => onLabels({ ...labels, open: !labels.open })}
      >
        <Icon name="label" size={20} />
        Use my Gmail labels
        <Icon name={labels.open ? 'expand_less' : 'expand_more'} size={20} />
      </button>
      {labels.open && (
        <div id="label-import-list" className="label-import-list">
          <p className="label-import-note">Buckets work like labels, but they stay on screen. Emails with these labels come along to their new buckets.</p>
          <label className="label-import-row is-all">
            <input
              ref={selectAllRef}
              type="checkbox"
              className="email-checkbox"
              checked={allChecked}
              onChange={() => onLabels({ ...labels, checked: allChecked ? [] : gmailLabels.map((label) => label.name) })}
            />
            Select all
          </label>
          {gmailLabels.map((label) => (
            <label key={label.name} className="label-import-row">
              <input type="checkbox" className="email-checkbox" checked={labels.checked.includes(label.name)} onChange={() => toggle(label.name)} />
              {/* In the color its bucket will get: the closest Bucketbox color to the label's */}
              <span className="label-import-icon" style={{ color: bucketColorFor(label.gmailColor) }} aria-hidden="true">
                <Icon name="label" filled size={20} />
              </span>
              <span className="label-import-name">{label.name}</span>
              <span className="label-import-count">{count(label) === 1 ? '1 email' : `${count(label)} emails`}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FirstBucketCard({ afterSetup, steps = 5, picks, onPicks, labels, onLabels, emails, onBack, onCreate }) {
  const [adding, setAdding] = useState(false)
  const picked = picks.filter((pick) => pick.picked)
  // Checked labels in the open list, minus any with a picked bucket's name
  const takenNames = picked.map((pick) => pick.name.toLowerCase())
  const pickedLabels = labels.open
    ? gmailLabels.filter((label) => labels.checked.includes(label.name) && !takenNames.includes(label.name.toLowerCase()))
    : []
  const chosen = [
    ...picked.map(({ name, color, emoji }) => ({ name, color, emoji })),
    ...pickedLabels.map(({ name, gmailColor, emailIds }) => ({ name, color: bucketColorFor(gmailColor), emoji: null, emailIds })),
  ]
  const toggle = (pick) => onPicks(picks.map((p) => (p === pick ? { ...p, picked: !p.picked } : p)))
  const focusOwn = () => setTimeout(() => document.querySelector('.starter-bucket.is-own')?.focus(), 0)

  return (
    <section className="welcome-card first-bucket-card" aria-labelledby="first-bucket-title">
      {afterSetup && <WelcomeHeader step={steps} total={steps} />}
      <h2 id="first-bucket-title" className="welcome-title">Create your first bucket</h2>
      <p className="welcome-hint">
        Buckets organize emails like folders. Pick one of the suggested buckets to get started or create your own.
      </p>
      {adding ? (
        <div className="first-bucket-form">
          <BucketForm
            mode="add"
            otherNames={picks.map((pick) => pick.name)}
            onSave={({ name, color, emoji }) => {
              onPicks([...picks, { name, color, emoji, picked: true, own: true }])
              setAdding(false)
              focusOwn()
            }}
            onCancel={() => {
              setAdding(false)
              focusOwn()
            }}
          />
        </div>
      ) : (
        <div className="starter-buckets">
          {picks.map((pick) => (
            <button
              key={pick.name}
              type="button"
              className={`starter-bucket ${pick.picked ? 'is-picked' : ''}`}
              style={bucketStyle(pick.color)}
              onClick={() => toggle(pick)}
              aria-pressed={pick.picked}
              aria-label={pick.name}
            >
              <span className="starter-bucket-header">
                {/* The check in place of the dot or emoji (Amanda, 2026-11-26); a check, not just a
                    border, so picked doesn't rely on color */}
                <span className="starter-bucket-check" aria-hidden="true">
                  <Icon name={pick.picked ? 'check_circle' : 'radio_button_unchecked'} filled={pick.picked} size={20} />
                </span>
                <span className="starter-bucket-name">{pick.name}</span>
              </span>
              <span className="starter-bucket-body" aria-hidden="true">
                <span className="mini-row" />
                <span className="mini-row" />
                <span className="mini-row" />
              </span>
            </button>
          ))}
          <button type="button" className="starter-bucket is-own" onClick={() => setAdding(true)}>
            <Icon name="add" size={24} />
            <span className="starter-bucket-name">Make your own</span>
          </button>
        </div>
      )}
      {/* Under the cards, in the secondary text color (Amanda, 2026-11-26) */}
      {!adding && <p className="first-bucket-note">Select one or more</p>}
      {!adding && gmailLabels.length > 0 && <LabelList labels={labels} onLabels={onLabels} emails={emails} />}
      {!adding && (
        <div className="welcome-buttons">
          {afterSetup && (
            <button type="button" className="text-button welcome-back" onClick={onBack}>
              Back
            </button>
          )}
          <button
            type="button"
            className="filled-button"
            disabled={chosen.length === 0}
            onClick={() => onCreate(chosen)}
          >
            Continue
          </button>
        </div>
      )}
    </section>
  )
}
