// Auto-sort rules for buckets (PRD F14; brief item 1a). Fixed patterns only, no AI.
// Nothing here changes any emails: these functions only answer "does this email fit?".
//
// How rules are stored on a bucket:
//   bucket.rules    = [rule, ...]       (missing or empty = a regular bucket)
//   bucket.ruleJoin = 'any' | 'all'      whether an email needs any one rule or every rule.
//                                        Default 'any', shown as the "or" connector between cards.
// A rule (one rule card):
//   { id, match: 'any' | 'all', paused: false, criteria: [criterion, ...] }
//   match is the card's own all-or-any choice for its chips.
// A criterion (one chip):
//   { type: 'sender',   value: 'chase' }           name or address; an address with @ must match exactly
//   { type: 'domain',   value: 'chase.com' }       that domain or any part of it (mail.chase.com)
//   { type: 'subject',  value: 'receipt' }         whole words, any case, plurals ok; a phrase keeps its order
//   { type: 'category', value: 'Promotions' }      one of Gmail's inbox categories

export const gmailCategories = ['Primary', 'Social', 'Promotions', 'Updates', 'Forums']

export const newRule = (criteria = [], id = `rule-${Date.now()}`) => ({ id, match: 'any', paused: false, criteria })

// Lowercase words, splitting on anything that isn't a letter or number ("alerts@chase.com" -> alerts, chase, com)
const words = (text) => (text ?? '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

const domainOf = (address) => (address ?? '').toLowerCase().split('@')[1] ?? ''

// true if the words of `wanted` appear in a row inside `found`, each passing `same`
function inARow(found, wanted, same) {
  if (wanted.length === 0) return false
  for (let start = 0; start + wanted.length <= found.length; start += 1) {
    if (wanted.every((word, i) => same(found[start + i], word))) return true
  }
  return false
}

// "receipt" and "receipts" count as the same word, and so do "box" and "boxes"
const singular = (word) => word.replace(/(?<=[sxz]|ch|sh)es$/, '').replace(/(?<!s)s$/, '')
const sameWord = (a, b) => a === b || singular(a) === singular(b)

function criterionMatches({ type, value }, email) {
  const wanted = (value ?? '').trim().toLowerCase()
  if (!wanted) return false
  switch (type) {
    case 'sender': {
      if (wanted.includes('@')) return (email.senderEmail ?? '').toLowerCase() === wanted
      // Each word must start a word of the name or address: "chase" fits "Chase Bank", not "Purchase"
      const found = [...words(email.sender), ...words(email.senderEmail)]
      return inARow(found, words(wanted), (have, want) => have.startsWith(want))
    }
    case 'domain': {
      const domain = domainOf(email.senderEmail)
      const want = wanted.replace(/^@/, '')
      return domain === want || domain.endsWith(`.${want}`)
    }
    case 'subject':
      return inARow(words(email.subject), words(wanted), sameWord)
    case 'category':
      return (email.category ?? '').toLowerCase() === wanted
    default:
      return false
  }
}

// A rule that's paused, or has no chips yet, never matches
export function ruleMatches(rule, email) {
  if (rule.paused || rule.criteria.length === 0) return false
  const test = (criterion) => criterionMatches(criterion, email)
  return rule.match === 'all' ? rule.criteria.every(test) : rule.criteria.some(test)
}

// The rules that are switched on and have at least one chip
export const activeRules = (bucket) => (bucket.rules ?? []).filter((rule) => !rule.paused && rule.criteria.length > 0)

// Paused rules are left out, so with "all rules" only the rules still on need to match
export function bucketMatches(bucket, email) {
  const rules = activeRules(bucket)
  if (rules.length === 0) return false
  const test = (rule) => ruleMatches(rule, email)
  return bucket.ruleJoin === 'all' ? rules.every(test) : rules.some(test)
}

// Where the rules would send this email:
//   { type: 'none' }                      no bucket's rules fit: it stays in the Today list
//   { type: 'bucket', bucketId }          exactly one bucket fits
//   { type: 'conflict', bucketIds }       more than one fits: the person chooses (brief item 1g)
// Only unsorted emails are routed; one already in a bucket, archived or deleted stays put.
export function routeEmail(email, buckets) {
  if (email.bucketId !== null || email.removedTo) return { type: 'none' }
  const bucketIds = buckets.filter((bucket) => bucketMatches(bucket, email)).map((bucket) => bucket.id)
  if (bucketIds.length === 0) return { type: 'none' }
  if (bucketIds.length === 1) return { type: 'bucket', bucketId: bucketIds[0] }
  return { type: 'conflict', bucketIds }
}

// The unsorted emails one bucket's rules would collect (the backlog), newest first.
// Used by the preview (1c) and the backlog sort (1d).
export const backlogFor = (bucket, emails) =>
  emails
    .filter((email) => email.bucketId === null && !email.removedTo && bucketMatches(bucket, email))
    .sort((a, b) => b.receivedAt - a.receivedAt)
