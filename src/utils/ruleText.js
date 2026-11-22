// The words around auto-sort rules (PRD F14; brief item 1b): chip labels, the plain-English
// summary, turning a typed phrase into chips, and chips offered from an email.
// Fixed patterns only, no AI (BUILD-LOG, 2026-11-21).
import { gmailCategories } from './rules.js'

export const criterionTypes = [
  { type: 'sender', label: 'Sender', placeholder: 'chase or alerts@chase.com' },
  { type: 'domain', label: 'Domain', placeholder: 'chase.com' },
  { type: 'subject', label: 'Subject has', placeholder: 'receipt' },
  { type: 'category', label: 'Category' },
]
export const typeLabel = (type) => criterionTypes.find((option) => option.type === type)?.label ?? type

// What a chip reads: "Domain: chase.com"
export const chipText = ({ type, value }) => `${typeLabel(type)}: ${value}`

const quoted = (text) => `“${text}”`

// One chip as part of a sentence about "emails": "are from chase.com"
function clause({ type, value }) {
  switch (type) {
    case 'sender':
      return value.includes('@') ? `are from ${value}` : `are from ${quoted(value)}`
    case 'domain':
      return `are from ${value.replace(/^@/, '')}`
    case 'subject':
      return `have ${quoted(value)} in the subject`
    case 'category':
      return `are in ${value}`
    default:
      return ''
  }
}

// One card as sentence parts: plain text, with each joining word as { join } so it can be bolded
function cardParts(rule) {
  const parts = []
  rule.criteria.map(clause).filter(Boolean).forEach((text, i) => {
    if (i > 0) parts.push({ join: rule.match === 'all' ? 'and' : 'or' })
    parts.push(text)
  })
  return parts
}

// The plain-English read-back of a bucket's rules, as { intro, items, joiner, note }.
// intro and each item are lists of parts (text, or { join } for a bold "and" / "or").
// One rule is one sentence; several are a short list with the joiner on its own line between.
export function rulesSummary(rules, ruleJoin, bucketName) {
  const filled = rules.filter((rule) => rule.criteria.length > 0)
  const active = filled.filter((rule) => !rule.paused)
  const pausedCount = filled.length - active.length
  const note = pausedCount === 0 ? null : `${pausedCount === 1 ? '1 paused rule is' : `${pausedCount} paused rules are`} left out.`
  const name = bucketName || 'this bucket'
  const joiner = ruleJoin === 'all' ? 'and' : 'or'
  if (active.length === 0) {
    return {
      intro: [filled.length === 0 ? `No rules yet. Emails only land in ${name} when you move them.` : `All rules are paused. Emails only land in ${name} when you move them.`],
      items: [],
      joiner,
      note: null,
    }
  }
  if (active.length === 1) return { intro: [`Emails land in ${name} when they `, ...cardParts(active[0]), '.'], items: [], joiner, note }
  return { intro: [`Emails land in ${name} when they:`], items: active.map(cardParts), joiner, note }
}

// ---- Typed phrases (Amanda's approved list, BUILD-LOG 2026-11-21) ----
//   "from chase" -> Sender · "from chase.com" -> Domain · "from alerts@chase.com" -> Sender
//   "subject receipt" / "about receipt" -> Subject has · "in Promotions" / "Promotions" -> Category
//   "," and "and" join chips as all; "or" joins them as any. Anything else is "Not understood".

const categoryNamed = (word) => gmailCategories.find((name) => name.toLowerCase() === word.trim().toLowerCase())
const unquote = (text) => text.trim().replace(/^["“'‘]+|["”'’]+$/g, '').trim()

function readPart(part) {
  const text = part.trim()
  let found = text.match(/^from\s+(.+)$/i)
  if (found) {
    const value = unquote(found[1])
    if (value.includes('@') && !value.startsWith('@')) return { type: 'sender', value: value.toLowerCase() }
    if (/^@?[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(value)) return { type: 'domain', value: value.replace(/^@/, '').toLowerCase() }
    return { type: 'sender', value }
  }
  found = text.match(/^(?:subject(?:\s+(?:has|contains|is))?|about)\s*:?\s+(.+)$/i)
  if (found) return { type: 'subject', value: unquote(found[1]) }
  found = text.match(/^in\s+(?:the\s+)?(?:category\s+)?(\w+)(?:\s+category)?$/i) ?? text.match(/^(?:category\s+)?(\w+)$/i)
  if (found && categoryNamed(found[1])) return { type: 'category', value: categoryNamed(found[1]) }
  return null
}

// A typed phrase -> { criteria, match, notUnderstood: [text], note }
export function parsePhrase(phrase) {
  const text = phrase.trim()
  const hasOr = /\s+or\s+/i.test(text)
  const hasAnd = /\s+and\s+|,/i.test(text)
  const parts = text.split(/\s*,\s*|\s+and\s+|\s+or\s+/i).filter((part) => part.trim())
  const criteria = []
  const notUnderstood = []
  for (const part of parts) {
    const criterion = readPart(part)
    if (criterion) criteria.push(criterion)
    else notUnderstood.push(part.trim())
  }
  return {
    criteria,
    match: hasOr && !hasAnd ? 'any' : 'all',
    notUnderstood,
    note: hasOr && hasAnd ? 'Your phrase used both “and” and “or”, so emails must match all of these. Switch to Any if one is enough.' : null,
  }
}

// ---- Chips offered from an email ----

// Personal addresses share a domain with millions of people, so a rule from them uses the
// exact address instead of the domain
const sharedDomains = ['gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'example.com']
const commonWords = new Set('a an and the of to for in on at by with from your you our is are be has have new now this that it its my me we re fwd com net org www http https'.split(' '))

// { first: criterion, more: [criterion] } — the first starts the card, the rest are offered
export function chipsFromEmail(email) {
  const address = (email.senderEmail ?? '').toLowerCase()
  const domain = address.split('@')[1] ?? ''
  const shared = !domain || sharedDomains.includes(domain)
  const first = shared && address ? { type: 'sender', value: address } : domain ? { type: 'domain', value: domain } : { type: 'sender', value: email.sender }
  const subjectWords = [...new Set((email.subject.toLowerCase().match(/[\p{L}]{3,}/gu) ?? []).filter((word) => !commonWords.has(word)))].slice(0, 3)
  const more = [
    !shared && address && { type: 'sender', value: address },
    email.category && { type: 'category', value: email.category },
    ...subjectWords.map((word) => ({ type: 'subject', value: word })),
  ].filter(Boolean)
  return { first, more }
}
