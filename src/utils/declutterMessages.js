// Declutter's end-screen titles (PRD F13; Amanda's list, 2026-11-24). The title reflects what the
// person mostly did in the run, whether anything was skipped, and the range, and it rotates
// through a few versions so it doesn't feel canned. Edit the wording freely here.
//
// What they mostly did (the largest group; ties go cleared, then sorted, then looked through):
//   cleared: archived or deleted · sorted: moved into buckets · looked: read, or passed with Next
// All done: nothing in the run was skipped (every card was cleared, sorted or at least read).
//
// Each line is a function of { Scope, scope, n, many } where:
//   Scope / scope: "Today" / "today", "This week" / "this week", "These 25" / "these 25"...
//   n: how many were cleared (or sorted) · many: the scope is plural ("These 25"), for is / are
const be = (many) => (many ? 'are' : 'is')
const emails = (n) => (n === 1 ? '1 email' : `${n} emails`)

export const endTitles = {
  clearedDone: [
    ({ Scope, many }) => `Congratulations! ${Scope} ${be(many)} Decluttered`,
    ({ scope }) => `Clean sweep for ${scope}!`,
    ({ Scope, many }) => `${Scope} ${many ? 'feel' : 'feels'} lighter already!`,
    ({ Scope, many }) => `Nicely done. ${Scope} ${be(many)} clear!`,
  ],
  clearedSome: [
    ({ n }) => `${n} fewer ${n === 1 ? 'email' : 'emails'} to think about`,
    ({ Scope, many }) => `Good clearing. ${Scope} ${many ? 'feel' : 'feels'} lighter`,
    ({ n }) => `That's ${n} off your plate`,
    // "On track" only makes sense for a day or a week, so All Emails skips this one
    ({ scope, many }) => (many ? null : `You're on track for ${scope}`),
  ],
  sortedDone: [
    ({ scope }) => `Everything from ${scope} has a place`,
    ({ Scope, many }) => `${Scope} ${be(many)} all sorted`,
    ({ Scope }) => `${Scope}? Sorted.`,
  ],
  sortedSome: [
    ({ n }) => `${emails(n)} ${n === 1 ? 'is where it belongs' : 'are where they belong'}`,
    () => 'Nicely organized. Your buckets have it from here',
    ({ n }) => `${n} sorted into buckets. Good progress`,
  ],
  lookedDone: [
    ({ scope }) => `You've seen everything from ${scope}`,
    ({ scope }) => `All caught up on ${scope}`,
    ({ Scope, many }) => `${Scope} ${be(many)} read and ready`,
  ],
  lookedSome: [
    ({ scope }) => `That's it for ${scope}. What's next?`,
    () => "Good look-through. Sort or archive them whenever you're ready",
    ({ scope }) => `You're up to date on ${scope}`,
  ],
}

// The scope's words for a run: { Scope, scope, many, empty } where empty finishes "There are no
// unsorted emails …" ("today", "from yesterday", "this week", "anywhere")
export function scopeWords(range, label, deckSize) {
  if (range === 'all') return { Scope: `These ${deckSize}`, scope: `these ${deckSize}`, many: true, empty: 'anywhere' }
  const relative = ['Today', 'Yesterday', 'This week', 'Last week']
  const scope = relative.includes(label) ? label.toLowerCase() : label
  const empty = label === 'Today' || label === 'This week' ? scope : `from ${scope}`
  return { Scope: label, scope, many: false, empty }
}

// The title for a finished run. runNumber picks the version, so it changes from run to run but
// stays put while the end screen shows.
export function endTitle({ range, label, deckSize, progress, runNumber }) {
  const words = scopeWords(range, label, deckSize)
  if (deckSize === 0) return `There are no unsorted emails ${words.empty}.`
  const cleared = progress.archived + progress.deleted
  const sorted = progress.moved
  const looked = progress.left // read or passed: still unsorted
  const outcome = cleared >= sorted && cleared >= looked && cleared > 0 ? 'cleared' : sorted >= looked && sorted > 0 ? 'sorted' : 'looked'
  const done = progress.read >= progress.left // nothing was skipped
  const lines = endTitles[`${outcome}${done ? 'Done' : 'Some'}`]
  const n = outcome === 'sorted' ? sorted : cleared
  const options = lines.map((line) => line({ ...words, n })).filter(Boolean)
  return options[runNumber % options.length]
}
