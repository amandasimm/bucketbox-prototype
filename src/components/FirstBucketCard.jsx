import Icon from './Icon.jsx'

// What the bucket area shows while there are no buckets (Amanda, 2026-11-25): the welcome card's
// look, asking for the first bucket, with its own Add a Bucket button. Right after onboarding's
// steps it keeps their header, as the last step; it also shows whenever every bucket has been
// deleted (PRD F2: "the same empty state as onboarding"). It goes away once a bucket exists.
// The starter bucket cards (Stage 24d) will sit in here.
export default function FirstBucketCard({ afterSetup, adding, onAdd }) {
  return (
    <section className="welcome-card first-bucket-card" aria-labelledby="first-bucket-title">
      {afterSetup && (
        <>
          <div className="welcome-top">
            <p className="welcome-kicker">Welcome to Bucketbox</p>
            <p className="welcome-progress">Last step</p>
          </div>
          <div className="welcome-bar" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="is-done" />
            ))}
          </div>
        </>
      )}
      <h2 id="first-bucket-title" className="welcome-title">Make your first bucket</h2>
      <p className="welcome-hint">
        A bucket keeps emails together, like a folder you design yourself. Name it anything, then drag emails in or use Move.
      </p>
      {!adding && (
        <div className="welcome-buttons">
          <button type="button" className="filled-button first-bucket-add" onClick={onAdd}>
            <Icon name="add" size={20} />
            Add a Bucket
          </button>
        </div>
      )}
    </section>
  )
}
