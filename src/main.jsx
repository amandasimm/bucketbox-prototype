import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const root = createRoot(document.getElementById('root'))

// TEMPORARY (brief item 1a): /?rulecheck shows the rule-matching check page, on Amanda's
// computer only. import.meta.env.DEV is false in the Vercel build, so it's left out there.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('rulecheck')) {
  import('./dev/RuleCheck.jsx').then(({ default: RuleCheck }) => root.render(<RuleCheck />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
