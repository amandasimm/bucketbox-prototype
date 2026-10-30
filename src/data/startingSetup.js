// What every participant starts with. Edit freely (this file is not generated).

// The prototype starts with one bucket. "Priority" is a placeholder name (PRD §12 #1).
// Its id must match the spreadsheet's Location column ("Priority bucket" -> "priority").
export const startingBuckets = [
  { id: 'priority', name: 'Priority', color: '#0b57d0' }, // default blue (PRD F2)
]

// The 12 bucket colors, 6 bold and 6 soft, chosen by Amanda (BUILD-LOG, 2026-10-30).
// The first one is the default for a new bucket. How they're drawn: utils/bucketColors.js.
export const bucketColors = [
  // Bold row
  { name: 'Blue', hex: '#0b57d0' },
  { name: 'Dark pink', hex: '#ff4f5e' },
  { name: 'Orange', hex: '#ff8d60' },
  { name: 'Lime', hex: '#72e721' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Teal', hex: '#09aba0' },
  // Soft row: each sits under its bold partner
  { name: 'Sky', hex: '#a6d3ff' },
  { name: 'Light pink', hex: '#ffa3b5' },
  { name: 'Butter', hex: '#ffe594' },
  { name: 'Mint', hex: '#b4e5cb' },
  { name: 'Lavender', hex: '#cbbcff' },
  { name: 'Slate', hex: '#5f6368' },
]

// Gmail already uses these names, so a bucket can't have them (PRD F2 Name)
export const reservedBucketNames = ['Inbox', 'Important', 'Sent', 'Drafts', 'Spam', 'Trash', 'Starred', 'Snoozed', 'All Mail']

export const bucketNameLimit = 30

// The "see more" emoji grid, chosen by Amanda (BUILD-LOG, 2026-10-28).
export const emojiGrid = [
  '👍', '❤️', '🙏', '😊', '🎉', '✨', '💯', '🙌',
  '🤔', '🔥', '👀', '‼️', '📝', '✅', '⏰', '⭐',
  '❓', '📅', '💰', '📦', '💼', '🏠', '📚', '🛍️',
  '🏥', '✈️', '🍽️', '🎬', '🐾', '💻', '🎟️', '🔐',
]

// Shown in the tag button before someone has used any emoji.
export const defaultRecentEmojis = ['⭐', '👀', '✅']
