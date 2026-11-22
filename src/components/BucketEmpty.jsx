import { activeRules, backlogFor } from '../utils/rules.js'

// What an empty bucket says (PRD F2, F14; brief 1i; wording decided Nov 21, 2026), on its tile and
// when it's opened. A bucket with rules on: "No new mail has matched your 2 rules yet." (Amanda,
// 2026-11-22), and on its own line "Already in your inbox: 5 unsorted emails match" when unsorted
// emails already fit; the link opens the rules panel at "Already in your inbox". No rules, all of
// them paused, or auto-sort off in settings (brief 1j): the regular message.
export default function BucketEmpty({ bucket, emails, autoSort = true, onSortBacklog, className = '' }) {
  const ruleCount = autoSort ? activeRules(bucket).length : 0
  const hasRules = ruleCount > 0
  const backlog = hasRules ? backlogFor(bucket, emails).length : 0
  return (
    <div className={`empty-state bucket-empty ${className}`} role="status">
      {hasRules ? (
        // Two levels (Amanda, 2026-11-22): the main message, then a smaller, lighter second line
        <>
          <p className="bucket-empty-main">
            No new mail has matched your {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'} yet.
          </p>
          {backlog > 0 && onSortBacklog && (
            // "Already in your inbox: 5 unsorted emails match", the count part as the link, matching
            // the heading it opens
            <p className="bucket-empty-secondary">
              Already in your inbox:{' '}
              <button type="button" className="inline-link" onClick={onSortBacklog}>
                {backlog} unsorted {backlog === 1 ? 'email matches' : 'emails match'}
              </button>
            </p>
          )}
        </>
      ) : (
        <p>This bucket is empty. Drop emails here to keep them together.</p>
      )}
    </div>
  )
}
