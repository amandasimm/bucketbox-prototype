import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EmojiPicker } from 'frimousse'
import Icon from './Icon.jsx'

// The emoji data lives inside the prototype (public/emojibase), so the picker never
// loads anything from the internet (CLAUDE.md §5; BUILD-LOG, 2026-10-30).
const EMOJI_DATA_URL = `${import.meta.env.BASE_URL}emojibase`
const POPOVER_WIDTH = 328
const POPOVER_HEIGHT = 380

// An optional emoji for a bucket, shown in place of its color dot (BUILD-LOG, 2026-10-30).
// A round gray button sits left of the name field; it opens a searchable picker (Frimousse).
// The picker is drawn on top of the page, so the tile and the scrolling bucket area can't cut it off.
export default function BucketEmojiButton({ emoji, onChange }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const buttonRef = useRef(null)
  const popoverRef = useRef(null)

  // Open below the button, or above it when there isn't room below
  useLayoutEffect(() => {
    if (!open) return
    const box = buttonRef.current.getBoundingClientRect()
    const below = box.bottom + 8 + POPOVER_HEIGHT <= window.innerHeight
    setPosition({
      left: Math.min(box.left, window.innerWidth - POPOVER_WIDTH - 8),
      top: below ? box.bottom + 8 : Math.max(8, box.top - 8 - POPOVER_HEIGHT),
    })
  }, [open])

  // Close on a click outside or Escape, and hand focus back to the button
  useEffect(() => {
    if (!open) return
    function onPointerDown(event) {
      if (!popoverRef.current?.contains(event.target) && !buttonRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function close() {
    setOpen(false)
    buttonRef.current.focus()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="icon-button has-tooltip bucket-emoji-button"
        aria-label={emoji ? `Bucket emoji: ${emoji}. Change emoji` : 'Add an emoji'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {emoji ? <span className="bucket-emoji-current">{emoji}</span> : <Icon name="add_reaction" size={22} />}
        <span className="tooltip" aria-hidden="true">
          {emoji ? 'Change emoji' : 'Add an emoji'}
        </span>
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            className="emoji-popover"
            role="dialog"
            aria-label="Choose an emoji"
            style={{ left: position.left, top: position.top, width: POPOVER_WIDTH, height: POPOVER_HEIGHT }}
            onKeyDown={(event) => {
              // Escape closes only the picker, not the bucket form behind it
              if (event.key === 'Escape') {
                event.stopPropagation()
                close()
              }
            }}
          >
            <EmojiPicker.Root
              className="emoji-picker"
              columns={8}
              emojibaseUrl={EMOJI_DATA_URL}
              onEmojiSelect={({ emoji: picked }) => {
                onChange(picked)
                close()
              }}
            >
              <EmojiPicker.Search className="emoji-picker-search" placeholder="Search emoji" autoFocus />
              <EmojiPicker.Viewport className="emoji-picker-viewport">
                <EmojiPicker.Loading className="emoji-picker-message">Loading…</EmojiPicker.Loading>
                <EmojiPicker.Empty className="emoji-picker-message">No emoji found</EmojiPicker.Empty>
                <EmojiPicker.List className="emoji-picker-list" />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
            {emoji && (
              <button
                type="button"
                className="text-button emoji-remove"
                onClick={() => {
                  onChange(null)
                  close()
                }}
              >
                Remove emoji
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
