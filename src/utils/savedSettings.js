// Bucketbox's settings are kept in this browser between visits (brief 1j; Amanda, Nov 21, 2026).
// Only the settings: emails, buckets and rules still start fresh on every reload. Nothing is sent
// anywhere. The browser may refuse storage (private windows, blocked site data), so every read and
// write is wrapped and the defaults are used instead.
const KEY = 'bucketbox-settings'

export const defaultSettings = {
  range: 'today', // the Today list's range: 'today' (default) | 'week' | 'all' (PRD F6, F10; brief item 5)
  cutoff: '17:00', // "When do you usually stop checking email?": any time, 5 PM by default; "00:00" moves nothing (Stage 24a)
  pageSize: 50, // All Emails: emails per page, like Gmail (PRD F6)
  showCount: false, // All Emails: show the unsorted count (hidden by default; Amanda, 2026-11-22)
  chunkSize: 25, // All Emails: how many emails one Declutter run takes (PRD F6; separate from the page size)
  autoSort: true, // auto-sort rules sort arriving mail (PRD F14)
  // Suggestions (PRD F15, F16): on by default for testing (Amanda, 2026-11-22), though the PRD
  // calls it opt-in
  suggestions: true,
  // Suggestions turned off: [{ senderEmail, name }] for auto-archive (F15), [{ key, name }] for
  // suggested rules (F16)
  hiddenSuggestions: [],
  labels: 'both', // 'both' | 'icons' | 'text', for Move / Archive / Delete and Declutter
  buttons: { move: true, archive: true, delete: true, declutter: true },
  motion: true,
  density: 'roomy', // 'roomy' (to start; Amanda, 2026-11-25) | 'default' | 'comfortable' | 'compact' (Gmail's Density, plus Roomy; Stage 24b)
  unreadDot: false, // the blue dot on unread rows: off by default, like Gmail (Amanda, 2026-11-24)
  zone: 'trash', // the delete zone: 'trash' | 'archive'
}

// Version 2 (2026-11-22): Suggestions became a real setting. Version 1 saved it as off only
// because it was a disabled placeholder, so that old value is dropped.
const VERSION = 2

export function loadSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return defaultSettings
    if (saved.version !== VERSION) delete saved.suggestions
    delete saved.version
    return {
      ...defaultSettings,
      ...saved,
      buttons: { ...defaultSettings.buttons, ...saved.buttons },
      hiddenSuggestions: Array.isArray(saved.hiddenSuggestions) ? saved.hiddenSuggestions : [],
      // Anything that isn't an "HH:MM" time (earlier builds saved an hour number) goes back to 5 PM
      cutoff: /^\d\d:\d\d$/.test(saved.cutoff) ? saved.cutoff : defaultSettings.cutoff,
    }
  } catch {
    return defaultSettings
  }
}

export function storeSettings(settings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...settings, version: VERSION }))
  } catch {
    // Storage isn't available: the settings simply last until the page reloads
  }
}
