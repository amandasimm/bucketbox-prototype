// Prototype scenarios (PRD §4; brief item 6; Stage 23). One build holds two starting points, each
// with its own link, so Qualtrics can send participants straight to one:
//   ?scenario=filled      (also the plain link): the Priority bucket and its emails
//   ?scenario=onboarding  a fresh start: no buckets, every email unsorted
// The facilitator menu switches and resets them. Nothing here is sent anywhere.

export const scenarios = [
  { id: 'filled', name: 'Filled', hint: 'The Priority bucket and its emails' },
  { id: 'onboarding', name: 'Onboarding', hint: 'No buckets, every email unsorted, default settings' },
]

const ids = scenarios.map((scenario) => scenario.id)

// The scenario in the address bar, or Filled when there isn't one (or it isn't recognized)
export function readScenario() {
  try {
    const id = new URLSearchParams(window.location.search).get('scenario')
    return ids.includes(id) ? id : 'filled'
  } catch {
    return 'filled'
  }
}

// Puts the scenario in the address bar without reloading, so a reload stays in it
export function writeScenario(id) {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('scenario', id)
    window.history.replaceState(null, '', url)
  } catch {
    // Some embeds don't allow changing the address; the scenario still switches
  }
}

export const scenarioName = (id) => scenarios.find((scenario) => scenario.id === id)?.name ?? id
