import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'

// A Material-style switch: a labeled row with the switch on the right
function SwitchRow({ label, hint, checked, onChange }) {
  return (
    <label className="setting-row">
      <span className="setting-text">
        <span className="setting-label">{label}</span>
        {hint && <span className="setting-hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="setting-switch-input" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="setting-switch" aria-hidden="true">
        <span className="setting-switch-thumb">{checked && <Icon name="check" size={14} />}</span>
      </span>
    </label>
  )
}

// A short list of choices where only one can be picked
function ChoiceRow({ legend, name, value, options, onChange }) {
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

const BUTTONS = [
  ['move', 'Move'],
  ['archive', 'Archive'],
  ['delete', 'Delete'],
  ['declutter', 'Declutter'],
]

// Bucketbox's own settings (PRD F10; moved into v1, BUILD-LOG 2026-11-16). A centered pop-up,
// opened from the wrench at the bottom of the left nav. Only settings that really work are
// listed. Nothing changes until Save; Cancel or Escape closes it unchanged. Nothing is stored:
// a reload puts every setting back.
// It uses the browser's own dialog, which keeps keyboard focus inside and closes on Escape.
export default function SettingsDialog({ settings, canReorder, onSave, onReorder, onClose }) {
  const dialogRef = useRef(null)
  const [draft, setDraft] = useState(settings)
  const ids = useId()
  const set = (fields) => setDraft({ ...draft, ...fields })

  useEffect(() => {
    dialogRef.current.showModal()
  }, [])

  function save(event) {
    event.preventDefault()
    onSave(draft)
  }

  return (
    <dialog ref={dialogRef} className="settings-dialog" aria-labelledby={`${ids}-title`} onClose={onClose}>
      <form onSubmit={save}>
        <h2 id={`${ids}-title`} className="dialog-title">Bucketbox settings</h2>

        <div className="settings-scroll">
          <section className="settings-section" aria-labelledby={`${ids}-buckets`}>
            <h3 id={`${ids}-buckets`} className="settings-heading">Buckets</h3>
            <SwitchRow
              label="Show bucket counts"
              hint="The number of emails beside each bucket's name"
              checked={draft.bucketCounts}
              onChange={(bucketCounts) => set({ bucketCounts })}
            />
            <div className="setting-row">
              <span className="setting-text">
                <span className="setting-label">Bucket order</span>
                <span className="setting-hint">
                  {canReorder ? 'Saves these settings, then lets you drag buckets into a new order' : 'Add a second bucket to change the order'}
                </span>
              </span>
              <button type="button" className="outlined-button" disabled={!canReorder} onClick={() => onReorder(draft)}>
                Reorganize buckets
              </button>
            </div>
          </section>

          <section className="settings-section" aria-labelledby={`${ids}-buttons`}>
            <h3 id={`${ids}-buttons`} className="settings-heading">Buttons</h3>
            <ChoiceRow
              legend="Button labels"
              name={`${ids}-labels`}
              value={draft.labels}
              onChange={(labels) => set({ labels })}
              options={[
                { value: 'both', label: 'Icons and text' },
                { value: 'icons', label: 'Icons only' },
                { value: 'text', label: 'Text only' },
              ]}
            />
            <fieldset className="setting-choices">
              <legend className="setting-label">Buttons to show</legend>
              <div className="setting-choice-list">
                {BUTTONS.map(([key, label]) => (
                  <label key={key} className="dialog-choice">
                    <input
                      type="checkbox"
                      checked={draft.buttons[key]}
                      onChange={(event) => set({ buttons: { ...draft.buttons, [key]: event.target.checked } })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="settings-section" aria-labelledby={`${ids}-dragging`}>
            <h3 id={`${ids}-dragging`} className="settings-heading">Dragging</h3>
            <ChoiceRow
              legend="Dropping an email on the zone under the list"
              name={`${ids}-zone`}
              value={draft.zone}
              onChange={(zone) => set({ zone })}
              options={[
                { value: 'trash', label: 'Deletes it (moves it to Trash)' },
                { value: 'archive', label: 'Archives it (keeps it in All Mail)' },
              ]}
            />
            <SwitchRow
              label="Animations"
              hint="The envelope, sliding cards and other movement"
              checked={draft.motion}
              onChange={(motion) => set({ motion })}
            />
          </section>
        </div>

        <div className="dialog-buttons">
          <button type="button" className="text-button" onClick={() => dialogRef.current.close()}>
            Cancel
          </button>
          <button type="submit" className="filled-button">
            Save
          </button>
        </div>
      </form>
    </dialog>
  )
}
