// TEMPORARY check page for brief item 1a (auto-sort rule matching). Delete it when 1b's rule
// cards replace it. Only loads in `npm run dev` at /?rulecheck; never part of the deployed site.
import { mockEmails } from '../data/mockEmails.js'
import { receivedAt } from '../utils/dates.js'
import { backlogFor, routeEmail } from '../utils/rules.js'

const emails = mockEmails.map((email) => ({ ...email, receivedAt: receivedAt(email.dayOffset, email.time), removedTo: null }))

const rule = (id, match, criteria, paused = false) => ({ id, match, paused, criteria })
const c = (type, value) => ({ type, value })

// Sample buckets, each showing one part of the logic
const buckets = [
  {
    id: 'receipts', name: 'Receipts and bills', ruleJoin: 'any',
    note: 'Two rule cards joined by "or". Card 1 is "any": subject has receipt or bill.',
    rules: [rule('r1', 'any', [c('subject', 'receipt'), c('subject', 'bill')]), rule('r2', 'any', [c('domain', 'amazon.com')])],
  },
  {
    id: 'social', name: 'Social', ruleJoin: 'any',
    note: 'One chip: the Gmail Social category.',
    rules: [rule('r3', 'any', [c('category', 'Social')])],
  },
  {
    id: 'security', name: 'Security', ruleJoin: 'any',
    note: 'One "all" card: subject has security AND category is Updates (so Google Security, in Primary, stays out).',
    rules: [rule('r4', 'all', [c('subject', 'security'), c('category', 'Updates')])],
  },
  {
    id: 'promos', name: 'Deals', ruleJoin: 'any',
    note: 'Category Promotions. Overlaps with Fitness below, so Crunch Fitness is a conflict.',
    rules: [rule('r5', 'any', [c('category', 'Promotions')])],
  },
  {
    id: 'fitness', name: 'Fitness', ruleJoin: 'any',
    note: 'Sender starts with "crunch".',
    rules: [rule('r6', 'any', [c('sender', 'crunch')])],
  },
  {
    id: 'music', name: 'Music (paused)', ruleJoin: 'any',
    note: 'Sender spotify, but the rule is paused, so it collects nothing.',
    rules: [rule('r7', 'any', [c('sender', 'spotify')], true)],
  },
  {
    id: 'priority', name: 'Priority', ruleJoin: 'any',
    note: 'A regular bucket with no rules. Its 5 emails are already sorted, so rules never touch them.',
    rules: [],
  },
]

// Made-up emails for the edge cases you chose (2026-11-21). Not in the prototype's mock data.
const fake = (sender, senderEmail, subject, category = 'Updates') => ({ sender, senderEmail, subject, category, bucketId: null, removedTo: null })
const checks = [
  ['Sender "chase" fits "Chase <alerts@chase.com>"', c('sender', 'chase'), fake('Chase', 'alerts@chase.com', 'Hi'), true],
  ['Sender "chase" fits "Chase Bank"', c('sender', 'chase'), fake('Chase Bank', 'hi@bank.example', 'Hi'), true],
  ['Sender "chase" skips "Purchase Co"', c('sender', 'chase'), fake('Purchase Co', 'hi@shop.example', 'Hi'), false],
  ['Sender "alerts@chase.com" fits that exact address, any case', c('sender', 'Alerts@Chase.com'), fake('Chase', 'alerts@chase.com', 'Hi'), true],
  ['Sender "alerts@chase.com" skips another Chase address', c('sender', 'alerts@chase.com'), fake('Chase', 'news@chase.com', 'Hi'), false],
  ['Domain "chase.com" fits alerts@chase.com', c('domain', 'chase.com'), fake('Chase', 'alerts@chase.com', 'Hi'), true],
  ['Domain "chase.com" fits no-reply@mail.chase.com', c('domain', 'chase.com'), fake('Chase', 'no-reply@mail.chase.com', 'Hi'), true],
  ['Domain "chase.com" skips hi@notchase.com', c('domain', 'chase.com'), fake('Not Chase', 'hi@notchase.com', 'Hi'), false],
  ['Subject "receipt" fits "Your receipt"', c('subject', 'receipt'), fake('Shop', 'a@shop.example', 'Your receipt'), true],
  ['Subject "receipt" fits "Receipts for May"', c('subject', 'receipt'), fake('Shop', 'a@shop.example', 'Receipts for May'), true],
  ['Subject "receipt" skips "Order receipted"', c('subject', 'receipt'), fake('Shop', 'a@shop.example', 'Order receipted'), false],
  ['Subject "order shipped" skips "Your order has shipped" (words must be in a row)', c('subject', 'order shipped'), fake('Shop', 'a@shop.example', 'Your order has shipped'), false],
  ['Subject "order shipped" fits "Order shipped today"', c('subject', 'order shipped'), fake('Shop', 'a@shop.example', 'Order shipped today'), true],
  ['Category "promotions" fits a Promotions email, any case', c('category', 'promotions'), fake('Shop', 'a@shop.example', 'Sale', 'Promotions'), true],
]

const box = { border: '1px solid var(--md-sys-color-outline-variant, #ccc)', borderRadius: 12, padding: 16, marginBottom: 12, background: '#fff' }
const routeText = (route) =>
  route.type === 'bucket' ? `→ ${buckets.find((b) => b.id === route.bucketId).name}`
    : route.type === 'conflict' ? `Conflict: ${route.bucketIds.map((id) => buckets.find((b) => b.id === id).name).join(' / ')}`
      : 'Stays in the Today list'

export default function RuleCheck() {
  const routed = emails.map((email) => ({ email, route: routeEmail(email, buckets) }))
  const passed = checks.filter(([, criterion, email, expected]) => routeEmail(email, [{ id: 'x', rules: [rule('t', 'any', [criterion])] }]).type === (expected ? 'bucket' : 'none')).length
  return (
    <main style={{ fontFamily: 'Google Sans, Roboto, sans-serif', maxWidth: 1100, margin: '0 auto', padding: 24, background: '#f6f8fc', minHeight: '100vh', color: '#1f1f1f' }}>
      <h1 style={{ fontSize: 22 }}>Auto-sort rules: temporary check page (1a)</h1>
      <p>Not part of the prototype. It shows what the matching logic decides, using sample rules on the real mock emails. Nothing is moved.</p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>1. Sample buckets and what each one would collect</h2>
      {buckets.map((bucket) => {
        const backlog = backlogFor(bucket, emails)
        return (
          <section key={bucket.id} style={box}>
            <strong>{bucket.name}</strong> <span style={{ color: '#5f6368' }}>· {bucket.note}</span>
            <ul style={{ margin: '8px 0 0' }}>
              {backlog.length === 0 ? <li style={{ color: '#5f6368' }}>Nothing</li>
                : backlog.map((email) => <li key={email.id}>{email.sender}: {email.subject} <span style={{ color: '#5f6368' }}>({email.category})</span></li>)}
            </ul>
          </section>
        )
      })}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>2. Where every mock email would go</h2>
      <table style={{ ...box, borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr style={{ textAlign: 'left' }}><th>Email</th><th>Category</th><th>Rules decide</th></tr></thead>
        <tbody>
          {routed.map(({ email, route }) => (
            <tr key={email.id} style={{ borderTop: '1px solid #e0e0e0' }}>
              <td style={{ padding: '6px 8px 6px 0' }}>{email.sender}: {email.subject}{email.bucketId && <em style={{ color: '#5f6368' }}> (already in Priority)</em>}</td>
              <td>{email.category}</td>
              <td style={{ fontWeight: route.type === 'none' ? 400 : 600 }}>{route.type === 'conflict' ? '⚠ ' : ''}{routeText(route)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>3. Your matching choices, checked ({passed} of {checks.length} pass)</h2>
      <ul style={{ ...box, listStyle: 'none' }}>
        {checks.map(([label, criterion, email, expected]) => {
          const ok = routeEmail(email, [{ id: 'x', rules: [rule('t', 'any', [criterion])] }]).type === (expected ? 'bucket' : 'none')
          return <li key={label} style={{ padding: '4px 0' }}>{ok ? '✅ Pass' : '❌ Fail'}: {label}</li>
        })}
      </ul>
    </main>
  )
}
