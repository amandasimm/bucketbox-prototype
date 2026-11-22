import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { bucketStyle } from '../utils/bucketColors.js'

// Emails whose rules fit more than one bucket (PRD F14; brief 1g; BUILD-LOG 2026-11-21): one
// pop-up for all of them, each with the buckets it fits as pills to choose from. Only the chosen
// ones are sorted ("Sort 2"); the rest stay in the Today list, and the banner above the buckets
// brings this back. "Not now", Escape or a click on the dimmed page closes it without sorting.
// The PRD asks for a pop-up here; the browser's own dialog keeps keyboard focus inside it.
export default function ConflictDialog({ conflicts, onSort, onClose }) {
  const dialogRef = useRef(null)
  const ids = useId()
  // { emailId: bucketId }
  const [choices, setChoices] = useState({})
  const chosen = Object.keys(choices).filter((id) => conflicts.some(({ email }) => email.id === id))
  const count = chosen.length

  useEffect(() => {
    dialogRef.current.showModal()
  }, [])

  function choose(emailId, bucketId) {
    // Picking the chosen pill again un-picks it
    setChoices((current) => {
      const next = { ...current }
      if (next[emailId] === bucketId) delete next[emailId]
      else next[emailId] = bucketId
      return next
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className="conflict-dialog"
      aria-labelledby={`${ids}-title`}
      aria-describedby={`${ids}-hint`}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dimmed page around it closes it, like "Not now"
        if (event.target === dialogRef.current) dialogRef.current.close()
      }}
    >
      <div className="conflict-dialog-body">
        <h2 id={`${ids}-title`} className="dialog-title">
          {conflicts.length === 1 ? 'An email fits more than one bucket' : 'Some emails fit more than one bucket'}
        </h2>
        <p id={`${ids}-hint`} className="conflict-dialog-hint">
          Choose where {conflicts.length === 1 ? 'it goes' : 'each one goes'}. Anything you skip stays in your Today list.
        </p>
        <ul className="conflict-list">
          {conflicts.map(({ email, options }) => (
            <li key={email.id} className="conflict-item">
              <span className="conflict-email">
                <span className="conflict-sender">{email.sender}</span>
                <span className="conflict-subject">{email.subject}</span>
              </span>
              <span className="conflict-pills" role="radiogroup" aria-label={`Bucket for ${email.sender}: ${email.subject}`}>
                {options.map((bucket) => {
                  const picked = choices[email.id] === bucket.id
                  return (
                    <button
                      key={bucket.id}
                      type="button"
                      role="radio"
                      aria-checked={picked}
                      className={`conflict-pill ${picked ? 'is-picked' : ''}`}
                      style={bucketStyle(bucket.color)}
                      onClick={() => choose(email.id, bucket.id)}
                    >
                      {/* The check shows the choice, so it isn't shown by color alone */}
                      {picked ? (
                        <Icon name="check" size={16} />
                      ) : bucket.emoji ? (
                        <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span>
                      ) : (
                        <span className="bucket-swatch" aria-hidden="true" />
                      )}
                      {bucket.name}
                    </button>
                  )
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="dialog-buttons conflict-dialog-buttons">
        <button type="button" className="text-button" onClick={() => dialogRef.current.close()}>
          Not now
        </button>
        <button
          type="button"
          className="filled-button"
          disabled={count === 0}
          onClick={() => onSort(Object.fromEntries(chosen.map((id) => [id, choices[id]])))}
        >
          {count === 0 ? 'Sort' : `Sort ${count}`}
        </button>
      </div>
    </dialog>
  )
}
