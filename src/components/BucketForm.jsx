import { useEffect, useId, useRef, useState } from 'react'
import BucketEmojiButton from './BucketEmojiButton.jsx'
import Icon from './Icon.jsx'
import { bucketColors, bucketNameLimit, reservedBucketNames } from '../data/startingSetup.js'
import { bucketStyle, inkOn } from '../utils/bucketColors.js'

// Why a name can't be used, or null if it's fine (PRD F2 Name, Flow 1 edge cases).
// An empty name has no message; Save simply stays off until something is typed.
function nameProblem(name, otherNames) {
  const clean = name.trim().toLowerCase()
  if (!clean) return null
  const reserved = reservedBucketNames.find((reservedName) => reservedName.toLowerCase() === clean)
  if (reserved) return `Gmail already uses ${reserved}. Try a different name.`
  if (otherNames.some((other) => other.trim().toLowerCase() === clean)) {
    return `You already have a bucket called ${name.trim()}. Try a different name.`
  }
  return null
}

// "2 rules on", "Rules paused" or "None yet", for the link to the rules panel
function rulesLabel(bucket) {
  const rules = (bucket?.rules ?? []).filter((rule) => rule.criteria.length > 0)
  if (rules.length === 0) return 'None yet'
  const on = rules.filter((rule) => !rule.paused).length
  if (on === 0) return 'Rules paused'
  return `${on} ${on === 1 ? 'rule' : 'rules'} on`
}

// The inline form for adding or editing a bucket, shown in place of a tile, not as a
// pop-up (PRD F2). Adding shows Cancel and Save; editing shows Delete and Save, and
// Escape or a click outside leaves without saving (BUILD-LOG, 2026-10-30).
// onRules (editing only): leaves the form for the bucket's rules panel. Any name, color or emoji
// changes are saved first, so nothing typed is lost (Amanda, 2026-11-21).
export default function BucketForm({ mode, initial, otherNames, onSave, onCancel, onDelete, onRules }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? bucketColors[0].hex)
  const [emoji, setEmoji] = useState(initial?.emoji ?? null)
  const formRef = useRef(null)
  const inputRef = useRef(null)
  const ids = useId()

  const problem = nameProblem(name, otherNames)
  const canSave = name.trim() !== '' && problem === null

  // Bring the whole form into view (not just the name field), then put the cursor in the name
  useEffect(() => {
    formRef.current.scrollIntoView({ block: 'nearest' })
    inputRef.current.focus({ preventScroll: true })
    inputRef.current.select()
  }, [])

  // Editing: a click anywhere outside the form leaves without saving
  useEffect(() => {
    if (mode !== 'edit') return
    function onPointerDown(event) {
      // The emoji picker floats outside the form, but clicks in it still count as inside
      if (!formRef.current.contains(event.target) && !event.target.closest('.emoji-popover')) onCancel()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [mode, onCancel])

  function submit(event) {
    event.preventDefault()
    if (canSave) onSave({ name: name.trim(), color, emoji })
  }

  return (
    <form
      ref={formRef}
      className="bucket-tile bucket-form"
      // The outline previews the picked color
      style={bucketStyle(color)}
      aria-label={mode === 'add' ? 'New bucket' : `Edit the ${initial.name} bucket`}
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      {/* Google-style field: the label sits inside the box, then moves up onto the
          outline once the field is focused or filled */}
      <div className="bucket-form-name-row">
        <BucketEmojiButton emoji={emoji} onChange={setEmoji} />
        <div className={`text-field ${problem ? 'has-error' : ''}`}>
          <input
            ref={inputRef}
            id={`${ids}-name`}
            className="text-field-input"
            value={name}
            maxLength={bucketNameLimit}
            placeholder=" "
            autoComplete="off"
            aria-invalid={problem !== null}
            aria-describedby={`${ids}-hint`}
            onChange={(event) => setName(event.target.value)}
          />
          <label className="text-field-label" htmlFor={`${ids}-name`}>
            Bucket name
          </label>
        </div>
      </div>
      <div id={`${ids}-hint`} className="bucket-form-hint" aria-live="polite">
        {problem ? (
          <span className="bucket-form-error">
            <Icon name="error" size={16} />
            {problem}
          </span>
        ) : (
          <span />
        )}
        <span className="bucket-form-count" aria-label={`${name.length} of ${bucketNameLimit} characters`}>
          {name.length}/{bucketNameLimit}
        </span>
      </div>

      <fieldset className="bucket-colors">
        <legend className="visually-hidden">Color</legend>
        {bucketColors.map((option) => (
          <label key={option.hex} className="bucket-color-option" title={option.name}>
            <input
              type="radio"
              className="visually-hidden"
              name={`${ids}-color`}
              value={option.hex}
              checked={color === option.hex}
              onChange={() => setColor(option.hex)}
            />
            <span className="visually-hidden">{option.name}</span>
            {/* The check mark shows which color is picked, so it isn't shown by color alone */}
            <span className="bucket-color-swatch" style={{ background: option.hex, color: inkOn(option.hex) }} aria-hidden="true">
              {color === option.hex && <Icon name="check" size={18} />}
            </span>
          </label>
        ))}
      </fieldset>

      {mode === 'edit' && onRules && (
        <button
          type="button"
          className="bucket-form-rules"
          disabled={!canSave}
          onClick={() => onRules({ name: name.trim(), color, emoji })}
        >
          <Icon name="automation" size={20} />
          <span className="bucket-form-rules-text">
            Auto-sort rules
            <span className="bucket-form-rules-count">{rulesLabel(initial)}</span>
          </span>
          <Icon name="chevron_right" size={20} />
        </button>
      )}

      <div className="bucket-form-buttons">
        {mode === 'add' ? (
          <button type="button" className="text-button" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <button type="button" className="text-button" onClick={onDelete}>
            Delete
          </button>
        )}
        <button type="submit" className="filled-button" disabled={!canSave}>
          Save
        </button>
      </div>
    </form>
  )
}
