// Suggested rules (PRD F16; brief item 3; BUILD-LOG 2026-11-22). Simple counting of what's in a
// bucket, on the device, no ML: once 5 emails in a bucket share a domain, a sender or a subject
// word, Bucketbox suggests a rule for them. Every email in the bucket counts (Amanda). A suggestion
// the bucket's rules already cover is skipped.
import { bucketMatches } from './rules.js'
import { chipText } from './ruleText.js'

export const SUGGEST_AT = 5

// Personal addresses share a domain with millions of people, so they're grouped by address
const sharedDomains = ['gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'example.com']
const commonWords = new Set('a an and the of to for in on at by with from your you our is are be has have new now this that it its my me we re fwd com net org www http https here there about just more get got'.split(' '))
const singular = (word) => word.replace(/(?<=[sxz]|ch|sh)es$/, '').replace(/(?<!s)s$/, '')

// A stable id for "this suggestion, for this bucket", used to hide it
export const suggestionKey = (bucketId, criterion) => `rule:${bucketId}:${criterion.type}:${criterion.value.toLowerCase()}`

// The best suggestion for one bucket, or null:
// { key, criterion, count, label: "Chase emails" / "“receipt” emails", bucketName }
// skipKeys: suggestions hidden in settings or put off with Not now
export function findRuleSuggestion(bucket, emails, skipKeys = []) {
  const inBucket = emails.filter((email) => email.bucketId === bucket.id && !email.removedTo)
  if (inBucket.length < SUGGEST_AT) return null
  const groups = new Map() // key -> { criterion, emails, kind }
  const add = (criterion, email, kind) => {
    const key = suggestionKey(bucket.id, criterion)
    const group = groups.get(key) ?? { criterion, emails: [], kind }
    group.emails.push(email)
    groups.set(key, group)
  }
  for (const email of inBucket) {
    const address = (email.senderEmail ?? '').toLowerCase()
    const domain = address.split('@')[1]
    if (domain && !sharedDomains.includes(domain)) add({ type: 'domain', value: domain }, email, 0)
    else if (address) add({ type: 'sender', value: address }, email, 1)
    const words = new Set((email.subject.toLowerCase().match(/[\p{L}]{4,}/gu) ?? []).filter((word) => !commonWords.has(word)).map(singular))
    for (const word of words) add({ type: 'subject', value: word }, email, 2)
  }
  const best = [...groups.entries()]
    .filter(([key, group]) => group.emails.length >= SUGGEST_AT && !skipKeys.includes(key))
    // Not if the bucket's rules already catch all of them
    .filter(([, group]) => !group.emails.every((email) => bucketMatches(bucket, email)))
    // Sender and domain first, then the most emails
    .sort(([, a], [, b]) => a.kind - b.kind || b.emails.length - a.emails.length)[0]
  if (!best) return null
  const [key, group] = best
  // "Chase emails": the name most of them come from, for a domain or sender
  const names = group.emails.map((email) => email.sender)
  const name = names.sort((a, b) => names.filter((n) => n === b).length - names.filter((n) => n === a).length)[0]
  const label = group.criterion.type === 'subject' ? `“${group.criterion.value}” emails` : `${name} emails`
  return { key, criterion: group.criterion, count: group.emails.length, label, chip: chipText(group.criterion), bucketName: bucket.name, bucketId: bucket.id }
}
