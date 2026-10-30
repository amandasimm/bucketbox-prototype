import BucketLogo from './BucketLogo.jsx'
import ComposeDrawer from './ComposeDrawer.jsx'
import PageHistory from './PageHistory.jsx'
import Icon from './Icon.jsx'
import InertButton from './InertButton.jsx'
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

function GmailHeader() {
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
        <InertButton label="Google Account" className="icon-button" tooltipAlign="right">
          <Icon name="account_circle" size={32} />
        </InertButton>
      </div>
    </header>
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

// While Bucketbox is on, the nav collapses to icons (names show on hover and to screen
// readers) to give Bucketbox more room. Compose keeps its size and place (BUILD-LOG, 2026-10-30).
function GmailNav({ inboxUnread, prototypeOn, onTogglePrototype, onCompose, history, buckets }) {
  const collapsed = prototypeOn
  return (
    <nav className="gmail-nav" aria-label="Mail folders">
      <button type="button" className="compose-button" onClick={onCompose}>
        <Icon name="edit" />
        <span>Compose</span>
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
            {PROTOTYPE_SWITCH_LABEL}
          </span>
        )}
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb">{prototypeOn && <Icon name="check" size={14} />}</span>
        </span>
      </button>

      {/* Undo and redo sit at the bottom of the nav while Bucketbox is on */}
      {history && <PageHistory history={history} />}
    </nav>
  )
}

export default function GmailShell({ composeActions, buckets, history, inboxUnread, prototypeOn, onTogglePrototype, children }) {
  return (
    <div className={`gmail-shell ${prototypeOn ? 'nav-collapsed' : ''}`}>
      <GmailHeader />
      <AppRail inboxUnread={inboxUnread} />
      <GmailNav
        inboxUnread={inboxUnread}
        prototypeOn={prototypeOn}
        onTogglePrototype={onTogglePrototype}
        onCompose={composeActions.openNew}
        history={history}
        buckets={buckets}
      />
      <main className="gmail-main">{children}</main>
      {composeActions.compose && <ComposeDrawer composeActions={composeActions} />}
    </div>
  )
}
