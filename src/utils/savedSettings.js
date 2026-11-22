// Bucketbox's settings are kept in this browser between visits (brief 1j; Amanda, Nov 21, 2026).
// Only the settings: emails, buckets and rules still start fresh on every reload. Nothing is sent
// anywhere. The browser may refuse storage (private windows, blocked site data), so every read and
// write is wrapped and the defaults are used instead.
const KEY = 'bucketbox-settings'

export const defaultSettings = {
  autoSort: true, // auto-sort rules sort arriving mail (PRD F14)
  suggestions: false, // F15/F16; not built yet, so its switch is disabled ("Coming soon")
  labels: 'both', // 'both' | 'icons' | 'text', for Move / Archive / Delete and Declutter
  buttons: { move: true, archive: true, delete: true, declutter: true },
  motion: true,
  zone: 'trash', // the delete zone: 'trash' | 'archive'
}

export function loadSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return defaultSettings
    return { ...defaultSettings, ...saved, buttons: { ...defaultSettings.buttons, ...saved.buttons } }
  } catch {
    return defaultSettings
  }
}

export function storeSettings(settings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Storage isn't available: the settings simply last until the page reloads
  }
}
