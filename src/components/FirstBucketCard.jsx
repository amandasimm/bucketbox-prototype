import { starterBuckets } from '../data/startingSetup.js'
import { bucketStyle } from '../utils/bucketColors.js'
import Icon from './Icon.jsx'

// What the bucket area shows while there are no buckets (Amanda, 2026-11-25): the welcome card's
// look, asking for the first bucket. Right after onboarding's steps it keeps their header, as the
// last step; it also shows whenever every bucket has been deleted (PRD F2: "the same empty state
// as onboarding"). It goes away once a bucket exists.
// Starter buckets (Stage 24d; PRD F12): two cards that look like small bucket tiles, which create
// that bucket at once, and "Make your own", which opens the usual Add a Bucket form.
export default function FirstBucketCard({ afterSetup, adding, onAdd, onCreate }) {
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
        A bucket keeps emails together, like a folder you design yourself. Start with one of these, or make your own.
      </p>
      {!adding && (
        <div className="starter-buckets">
          {starterBuckets.map((starter) => (
            <button
              key={starter.name}
              type="button"
              className="starter-bucket"
              style={bucketStyle(starter.color)}
              onClick={() => onCreate(starter)}
              aria-label={`Make a ${starter.name} bucket`}
            >
              <span className="starter-bucket-header">
                {starter.emoji ? (
                  <span className="bucket-emoji" aria-hidden="true">{starter.emoji}</span>
                ) : (
                  <span className="bucket-swatch" aria-hidden="true" />
                )}
                <span className="starter-bucket-name">{starter.name}</span>
              </span>
              <span className="starter-bucket-body" aria-hidden="true">
                <span className="mini-row" />
                <span className="mini-row" />
                <span className="mini-row" />
              </span>
            </button>
          ))}
          <button type="button" className="starter-bucket is-own" onClick={onAdd}>
            <Icon name="add" size={24} />
            <span className="starter-bucket-name">Make your own</span>
          </button>
        </div>
      )}
    </section>
  )
}
