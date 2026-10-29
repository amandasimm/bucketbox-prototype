// What every participant starts with. Edit freely (this file is not generated).

// The prototype starts with one bucket. "Priority" is a placeholder name (PRD §12 #1).
// Its id must match the spreadsheet's Location column ("Priority bucket" -> "priority").
export const startingBuckets = [
  { id: 'priority', name: 'Priority', color: '#1a73e8' }, // default blue (PRD F2)
]

// The "see more" emoji grid, chosen by Amanda (BUILD-LOG, 2026-10-28).
export const emojiGrid = [
  '👍', '❤️', '🙏', '😊', '🎉', '✨', '💯', '🙌',
  '🤔', '🔥', '👀', '‼️', '📝', '✅', '⏰', '⭐',
  '❓', '📅', '💰', '📦', '💼', '🏠', '📚', '🛍️',
  '🏥', '✈️', '🍽️', '🎬', '🐾', '💻', '🎟️', '🔐',
]

// Shown in the tag button before someone has used any emoji.
export const defaultRecentEmojis = ['⭐', '👀', '✅']
