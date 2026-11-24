import { useEffect, useRef, useState } from 'react'
import BucketLogo from './BucketLogo.jsx'
import ComposeDrawer from './ComposeDrawer.jsx'
import PageHistory from './PageHistory.jsx'
import Icon from './Icon.jsx'
import InertButton from './InertButton.jsx'
import { scenarioName, scenarios } from '../utils/scenario.js'
import './GmailShell.css'

// Gmail's own frame, kept familiar on every screen (PRD §5): header, app rail, left nav.
// Only Inbox and the prototype switch respond; everything else is look-only.

// Wording for the switch at the bottom of the nav (PRD §5 "open prototype" button).
// Bucketbox is Amanda's working customer-facing name (BUILD-LOG, 2026-10-29).
const PROTOTYPE_SWITCH_LABEL = 'Bucketbox'

const navItems = [
  { label: 'Starred', icon: 'star' },
  { label: 'Snoozed', icon: 'schedule' },
  { label: 'Sent', icon: 'send' },
  { label: 'Drafts', icon: 'draft' },
  { label: 'More', icon: 'expand_more' },
]

// The facilitator menu (brief item 6; Add emails from 1f on 2026-11-21, the rest Stage 23): for
// whoever runs a test session. Participants don't know it's there.
function FacilitatorMenu({ facilitator, onClose }) {
  const menuRef = useRef(null)
  useEffect(() => {
    menuRef.current.querySelector('[role^="menuitem"]')?.focus()
    function onPointerDown(event) {
      if (!menuRef.current.closest('.facilitator-wrap').contains(event.target)) onClose()
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        menuRef.current?.closest('.facilitator-wrap')?.querySelector('button')?.focus()
        return
      }
      // Up and down arrows (and Home, End) move between the items, like any menu
      const items = [...menuRef.current.querySelectorAll('[role^="menuitem"]')]
      const at = items.indexOf(document.activeElement)
      const next = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[event.key]
      if (next === undefined || at === -1) return
      event.preventDefault()
      items[(next + items.length) % items.length].focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onClose])
  // Each item closes the menu, then does its thing
  const item = (action) => () => {
    onClose()
    action()
  }
  return (
    <div className="facilitator-menu" role="menu" aria-label="Facilitator" ref={menuRef}>
      <p className="facilitator-menu-title" aria-hidden="true">Facilitator</p>
      <button type="button" role="menuitem" className="move-menu-item" onClick={item(facilitator.addEmails)}>
        <Icon name="forward_to_inbox" size={20} />
        <span>
          Add emails
          <span className="facilitator-menu-hint">8 arrive now and go through the auto-sort rules</span>
        </span>
      </button>
      <button type="button" role="menuitem" className="move-menu-item" onClick={item(facilitator.addPatternEmails)}>
        <Icon name="stacked_email" size={20} />
        <span>
          Add pattern emails
          <span className="facilitator-menu-hint">35 from Chase (4 today), to trigger the auto-archive suggestion</span>
        </span>
      </button>

      <div className="facilitator-menu-divider" role="separator" />
      <div role="group" aria-labelledby="facilitator-scenario">
        <p id="facilitator-scenario" className="facilitator-menu-title">Switch scenario</p>
        {scenarios.map((scenario) => {
          const current = scenario.id === facilitator.scenario
          return (
            <button
              key={scenario.id}
              type="button"
              role="menuitemradio"
              aria-checked={current}
              className="move-menu-item"
              onClick={item(() => !current && facilitator.switchScenario(scenario.id))}
            >
              {/* A check marks the one running; the others keep the space so names line up */}
              <span className="facilitator-menu-check">{current && <Icon name="check" size={20} />}</span>
              <span>
                {scenario.name}
                <span className="facilitator-menu-hint">{scenario.hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="facilitator-menu-divider" role="separator" />
      <button type="button" role="menuitem" className="move-menu-item" onClick={item(facilitator.resetScenario)}>
        <Icon name="restart_alt" size={20} />
        <span>
          Reset scenario
          <span className="facilitator-menu-hint">Start {scenarioName(facilitator.scenario)} over: buckets, sorting, rules and added emails</span>
        </span>
      </button>
      <button type="button" role="menuitem" className="move-menu-item" onClick={item(facilitator.resetSettings)}>
        <Icon name="settings_backup_restore" size={20} />
        <span>
          Reset settings
          <span className="facilitator-menu-hint">Every Bucketbox setting back to its default; emails and buckets stay</span>
        </span>
      </button>
    </div>
  )
}

function GmailHeader({ facilitator }) {
  const [facilitatorOpen, setFacilitatorOpen] = useState(false)
  const onFacilitator = () => setFacilitatorOpen((open) => !open)
  return (
    <header className="gmail-header">
      <div className="gmail-header-start">
        <InertButton label="Main menu" className="icon-button" tooltipAlign="left">
          <Icon name="menu" />
        </InertButton>
        <div className="gmail-logo" aria-label="Gmail">
          <Icon name="mail" filled size={32} />
          <span>Gmail</span>
        </div>
      </div>

      <div className="gmail-search" role="search">
        <InertButton label="Search" className="icon-button">
          <Icon name="search" />
        </InertButton>
        <InertButton label="Search mail" className="gmail-search-field" tooltipAlign="left" nameOnHover={false}>
          Search mail
        </InertButton>
        <InertButton label="Show search options" className="icon-button">
          <Icon name="tune" />
        </InertButton>
      </div>

      <div className="gmail-header-end">
        <InertButton label="Support" className="icon-button">
          <Icon name="help" />
        </InertButton>
        <InertButton label="Settings" className="icon-button">
          <Icon name="settings" />
        </InertButton>
        <InertButton label="Google apps" className="icon-button">
          <Icon name="apps" />
        </InertButton>
        {/* Shift-click (or Shift+Enter) opens the facilitator menu (brief item 6). Only the
            facilitator knows about it; for everyone else the icon stays look-only. */}
        <div className="facilitator-wrap">
          <InertButton label="Google Account" className="icon-button" tooltipAlign="right" onShiftActivate={facilitator ? onFacilitator : undefined}>
            <Icon name="account_circle" size={32} />
          </InertButton>
          {facilitatorOpen && <FacilitatorMenu facilitator={facilitator} onClose={() => setFacilitatorOpen(false)} />}
        </div>
      </div>
    </header>
  )
}

// Gmail's right side panel. Look-only. Plain icons in Google's colors stand in for the app logos.
const sidePanelApps = [
  { label: 'Calendar', icon: 'calendar_today', color: '#1a73e8' },
  { label: 'Keep', icon: 'lightbulb', color: '#f9ab00' },
  { label: 'Tasks', icon: 'task_alt', color: '#1a73e8' },
  { label: 'Contacts', icon: 'person', color: '#1a73e8' },
]

function SidePanel() {
  return (
    <aside className="side-panel" aria-label="Side panel">
      {sidePanelApps.map((app) => (
        <InertButton key={app.label} label={app.label} className="icon-button" tooltipAlign="right">
          <span style={{ color: app.color, display: 'flex' }}>
            <Icon name={app.icon} filled size={20} />
          </span>
        </InertButton>
      ))}
      <span className="side-panel-divider" aria-hidden="true" />
      <InertButton label="Get add-ons" className="icon-button" tooltipAlign="right">
        <Icon name="add" size={20} />
      </InertButton>
      <InertButton label="Hide side panel" className="icon-button side-panel-hide" tooltipAlign="right">
        <Icon name="chevron_right" size={20} />
      </InertButton>
    </aside>
  )
}

function AppRail({ inboxUnread }) {
  return (
    <nav className="app-rail" aria-label="Google apps">
      <div className="app-rail-item is-active">
        <span className="app-rail-icon">
          <Icon name="mail" filled />
          {inboxUnread > 0 && <span className="app-rail-badge">{inboxUnread}</span>}
        </span>
        <span>Mail</span>
      </div>
      <InertButton label="Chat" className="app-rail-item" nameOnHover={false}>
        <span className="app-rail-icon"><Icon name="chat_bubble" /></span>
        <span>Chat</span>
      </InertButton>
      <InertButton label="Meet" className="app-rail-item" nameOnHover={false}>
        <span className="app-rail-icon"><Icon name="videocam" /></span>
        <span>Meet</span>
      </InertButton>
    </nav>
  )
}

// While Bucketbox is on, the nav collapses the way Gmail's own nav does: icons only, with
// Compose as a square pencil button (names show on hover and to screen readers), to give
// Bucketbox more room (BUILD-LOG, 2026-11-13).
function GmailNav({ inboxUnread, prototypeOn, onTogglePrototype, onCompose, history, onOpenSettings, buckets }) {
  const collapsed = prototypeOn
  return (
    <nav className="gmail-nav" aria-label="Mail folders">
      <button type="button" className={`compose-button ${collapsed ? 'has-tooltip' : ''}`} onClick={onCompose}>
        <Icon name="edit" />
        <span>Compose</span>
        {collapsed && (
          <span className="tooltip align-left" aria-hidden="true">
            Compose
          </span>
        )}
      </button>

      <ul className="gmail-nav-list">
        <li>
          {/* Inbox is the active item in the plain Gmail view; while Bucketbox is on, Bucketbox is */}
          <button
            type="button"
            className={`gmail-nav-item ${prototypeOn ? '' : 'is-active'} ${collapsed ? 'has-tooltip' : ''}`}
            aria-current={prototypeOn ? undefined : 'page'}
          >
            <Icon name="inbox" filled={!prototypeOn} />
            <span className="gmail-nav-label">Inbox</span>
            {inboxUnread > 0 && <span className="gmail-nav-count">{inboxUnread}</span>}
            {collapsed && (
              <span className="tooltip align-left" aria-hidden="true">
                Inbox
              </span>
            )}
          </button>
        </li>
        {navItems.map((item) => (
          <li key={item.label}>
            <InertButton label={item.label} className="gmail-nav-item" tooltipAlign="left" nameOnHover={collapsed}>
              <Icon name={item.icon} />
              <span className="gmail-nav-label">{item.label}</span>
            </InertButton>
          </li>
        ))}
      </ul>

      {/* The switch stays in the same spot in both views, just below Gmail's own items */}
      <button
        type="button"
        role="switch"
        aria-checked={prototypeOn}
        className={`prototype-switch ${prototypeOn ? 'is-active' : ''} ${collapsed ? 'has-tooltip' : ''}`}
        aria-label={PROTOTYPE_SWITCH_LABEL}
        onClick={onTogglePrototype}
      >
        <BucketLogo size={20} filled={prototypeOn} />
        <span className="gmail-nav-label">{PROTOTYPE_SWITCH_LABEL}</span>
        {collapsed && (
          <span className="tooltip align-left" aria-hidden="true">
            Close {PROTOTYPE_SWITCH_LABEL}
          </span>
        )}
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb">{prototypeOn && <Icon name="check" size={14} />}</span>
        </span>
      </button>

      {/* In the plain Gmail view, buckets appear as Gmail labels (look-only; BUILD-LOG, 2026-10-30) */}
      {!prototypeOn && (
        <div className="gmail-labels">
          <div className="gmail-labels-header">
            <h2 className="gmail-labels-title">Labels</h2>
            <InertButton label="Create new label" className="icon-button" tooltipAlign="right">
              <Icon name="add" size={20} />
            </InertButton>
          </div>
          <ul className="gmail-nav-list">
            {buckets.map((bucket) => (
              <li key={bucket.id}>
                <InertButton label={bucket.name} className="gmail-nav-item" tooltipAlign="left" nameOnHover={false}>
                  <span className="gmail-label-icon" style={{ color: bucket.color }}>
                    <Icon name="label" filled />
                  </span>
                  <span className="gmail-nav-label">{bucket.name}</span>
                </InertButton>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Undo and redo sit at the bottom of the nav while Bucketbox is on */}
      {history && <PageHistory history={history} onOpenSettings={onOpenSettings} />}
    </nav>
  )
}

export default function GmailShell({ composeActions, buckets, history, onOpenSettings, inboxUnread, prototypeOn, onTogglePrototype, facilitator, children }) {
  return (
    <div className={`gmail-shell ${prototypeOn ? 'nav-collapsed' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content').focus()
        }}
      >
        Skip to main content
      </a>
      <GmailHeader facilitator={facilitator} />
      <AppRail inboxUnread={inboxUnread} />
      <GmailNav
        inboxUnread={inboxUnread}
        prototypeOn={prototypeOn}
        onTogglePrototype={onTogglePrototype}
        onCompose={composeActions.openNew}
        history={history}
        onOpenSettings={onOpenSettings}
        buckets={buckets}
      />
      <main id="main-content" className="gmail-main" tabIndex={-1}>
        {/* The page's main heading, for screen readers (the screen shows it through layout) */}
        <h1 className="visually-hidden">{prototypeOn ? 'Bucketbox' : 'Inbox'}</h1>
        {children}
      </main>
      <SidePanel />
      {composeActions.compose && <ComposeDrawer composeActions={composeActions} />}
    </div>
  )
}
