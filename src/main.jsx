import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { readScenario, scenarioName, writeScenario } from './utils/scenario.js'
import { defaultSettings, storeSettings } from './utils/savedSettings.js'
import './styles.css'

// Holds which scenario is running (Stage 23). Switching or resetting gives App a new key, so it
// starts over from that scenario's starting point, the way a reload does.
function Root() {
  const [run, setRun] = useState({ scenario: readScenario(), count: 0, toast: null })
  function start(scenario, toast) {
    // Onboarding is a fresh start with default settings (Amanda, 2026-11-24). Opening its link or
    // reloading keeps the saved settings; only switching to it or resetting it clears them.
    if (scenario === 'onboarding') storeSettings(defaultSettings)
    writeScenario(scenario)
    setRun((current) => ({ scenario, count: current.count + 1, toast }))
  }
  return (
    <App
      key={run.count}
      scenario={run.scenario}
      startToast={run.toast}
      onSwitchScenario={(scenario) => start(scenario, `Switched to ${scenarioName(scenario)}`)}
      onResetScenario={() => start(run.scenario, `Reset to ${scenarioName(run.scenario)}`)}
    />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
