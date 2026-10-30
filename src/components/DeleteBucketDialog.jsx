import { useEffect, useId, useRef, useState } from 'react'

// Confirmation before deleting a bucket that still has emails (PRD F2, Flow 1). This is one of
// the two pop-ups the PRD allows, because deleting a bucket can't be undone.
// It uses the browser's own dialog, which keeps keyboard focus inside and closes on Escape.
export default function DeleteBucketDialog({ bucket, emailCount, otherBuckets, onConfirm, onClose }) {
  const dialogRef = useRef(null)
  const [choice, setChoice] = useState('archive') // 'archive' | 'trash' | 'bucket'
  const [targetId, setTargetId] = useState(otherBuckets[0]?.id ?? '')
  const ids = useId()

  useEffect(() => {
    dialogRef.current.showModal()
  }, [])

  const emailWord = emailCount === 1 ? 'email' : 'emails'

  function confirm(event) {
    event.preventDefault()
    onConfirm(choice === 'bucket' ? { type: 'bucket', bucketId: targetId } : { type: choice })
  }

  return (
    <dialog ref={dialogRef} className="delete-bucket-dialog" aria-labelledby={`${ids}-title`} onClose={onClose}>
      <form onSubmit={confirm}>
        <h2 id={`${ids}-title`} className="dialog-title">
          Delete the {bucket.name} bucket?
        </h2>
        <fieldset className="dialog-choices">
          <legend>
            It has {emailCount} {emailWord}. Where should {emailCount === 1 ? 'it' : 'they'} go?
          </legend>
          <label className="dialog-choice">
            <input type="radio" name={`${ids}-dest`} checked={choice === 'archive'} onChange={() => setChoice('archive')} />
            Archive {emailCount === 1 ? 'it' : 'them'}
          </label>
          <label className="dialog-choice">
            <input type="radio" name={`${ids}-dest`} checked={choice === 'trash'} onChange={() => setChoice('trash')} />
            Move {emailCount === 1 ? 'it' : 'them'} to Trash
          </label>
          {otherBuckets.length > 0 && (
            <div className="dialog-choice-row">
              <label className="dialog-choice">
                <input
                  type="radio"
                  name={`${ids}-dest`}
                  checked={choice === 'bucket'}
                  onChange={() => setChoice('bucket')}
                />
                Move {emailCount === 1 ? 'it' : 'them'} to another bucket
              </label>
              <select
                className="dialog-select"
                aria-label="Bucket to move to"
                value={targetId}
                onChange={(event) => {
                  setTargetId(event.target.value)
                  setChoice('bucket')
                }}
              >
                {otherBuckets.map((other) => (
                  <option key={other.id} value={other.id}>
                    {other.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </fieldset>
        <p className="dialog-note">This can't be undone.</p>
        <div className="dialog-buttons">
          <button type="button" className="text-button" onClick={() => dialogRef.current.close()}>
            Cancel
          </button>
          <button type="submit" className="filled-button">
            Delete bucket
          </button>
        </div>
      </form>
    </dialog>
  )
}
