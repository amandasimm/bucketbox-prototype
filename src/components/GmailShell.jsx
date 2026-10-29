import Icon from './Icon.jsx'
import InertButton from './InertButton.jsx'
import './GmailShell.css'

// Gmail's own frame, kept familiar on every screen (PRD §5): header, app rail, left nav.
// Only Inbox and the prototype switch respond; everything else is look-only.

// Wording for the switch at the bottom of the nav (PRD §5 "open prototype" button). Placeholder.
const PROTOTYPE_SWITCH_LABEL = 'Daily inbox'

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

function GmailNav({ inboxUnread, prototypeOn, onTogglePrototype }) {
  return (
    <nav className="gmail-nav" aria-label="Mail folders">
      <InertButton label="Compose" className="compose-button" tooltipAlign="left" nameOnHover={false}>
        <Icon name="edit" />
        <span>Compose</span>
      </InertButton>

      <ul className="gmail-nav-list">
        <li>
          <button type="button" className="gmail-nav-item is-active" aria-current="page">
            <Icon name="inbox" filled />
            <span className="gmail-nav-label">Inbox</span>
            {inboxUnread > 0 && <span className="gmail-nav-count">{inboxUnread}</span>}
          </button>
        </li>
        {navItems.map((item) => (
          <li key={item.label}>
            <InertButton label={item.label} className="gmail-nav-item" tooltipAlign="left" nameOnHover={false}>
              <Icon name={item.icon} />
              <span className="gmail-nav-label">{item.label}</span>
            </InertButton>
          </li>
        ))}
      </ul>

      <button
        type="button"
        role="switch"
        aria-checked={prototypeOn}
        className="prototype-switch"
        onClick={onTogglePrototype}
      >
        <Icon name="view_day" />
        <span className="gmail-nav-label">{PROTOTYPE_SWITCH_LABEL}</span>
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb">{prototypeOn && <Icon name="check" size={14} />}</span>
        </span>
      </button>
    </nav>
  )
}

export default function GmailShell({ inboxUnread, prototypeOn, onTogglePrototype, children }) {
  return (
    <div className="gmail-shell">
      <GmailHeader />
      <AppRail inboxUnread={inboxUnread} />
      <GmailNav
        inboxUnread={inboxUnread}
        prototypeOn={prototypeOn}
        onTogglePrototype={onTogglePrototype}
      />
      <main className="gmail-main">{children}</main>
    </div>
  )
}
