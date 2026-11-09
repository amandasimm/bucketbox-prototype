import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import InertButton from './InertButton.jsx'

// Gmail's writing tools, shared by the reply box and the compose drawer so the two match
// (BUILD-LOG, 2026-11-08). Only Send and the trash (discard) work; the rest are visible but inert.

export function FormattingBar() {
  return (
    <div className="reply-box-format" role="toolbar" aria-label="Formatting (not part of this prototype)">
      <InertButton label="Undo" className="icon-button"><Icon name="undo" size={18} /></InertButton>
      <InertButton label="Redo" className="icon-button"><Icon name="redo" size={18} /></InertButton>
      <span className="reply-box-divider" aria-hidden="true" />
      <InertButton label="Font" className="reply-box-font" nameOnHover={false}>
        Sans Serif
        <Icon name="arrow_drop_down" size={18} />
      </InertButton>
      <span className="reply-box-divider" aria-hidden="true" />
      <InertButton label="Size" className="icon-button"><Icon name="format_size" size={18} /></InertButton>
      <InertButton label="Bold" className="icon-button"><Icon name="format_bold" size={18} /></InertButton>
      <InertButton label="Italic" className="icon-button"><Icon name="format_italic" size={18} /></InertButton>
      <InertButton label="Underline" className="icon-button"><Icon name="format_underlined" size={18} /></InertButton>
      <InertButton label="Text color" className="icon-button"><Icon name="format_color_text" size={18} /></InertButton>
      <InertButton label="Align" className="icon-button"><Icon name="format_align_left" size={18} /></InertButton>
      <InertButton label="More formatting options" className="icon-button"><Icon name="arrow_drop_down" size={18} /></InertButton>
    </div>
  )
}

// Send (a split blue pill), the attachment icons, and the trash on the right.
// extraTools adds Gmail's compose-only icons before More options.
export function SendRow({ onDiscard, extraTools = null }) {
  return (
    <div className="reply-box-footer">
      <span className="reply-send-group">
        <button type="submit" className="filled-button reply-send">Send</button>
        <InertButton label="More send options" className="filled-button reply-send-more">
          <Icon name="arrow_drop_down" size={20} />
        </InertButton>
      </span>
      <InertButton label="Formatting options" className="icon-button"><Icon name="text_format" size={20} /></InertButton>
      <InertButton label="Attach files" className="icon-button"><Icon name="attach_file" size={20} /></InertButton>
      <InertButton label="Insert link" className="icon-button"><Icon name="link" size={20} /></InertButton>
      <InertButton label="Insert emoji" className="icon-button"><Icon name="mood" size={20} /></InertButton>
      <InertButton label="Insert files using Drive" className="icon-button"><Icon name="add_to_drive" size={20} /></InertButton>
      <InertButton label="Insert photo" className="icon-button"><Icon name="image" size={20} /></InertButton>
      <InertButton label="Insert signature" className="icon-button"><Icon name="signature" size={20} /></InertButton>
      {extraTools}
      <InertButton label="More options" className="icon-button"><Icon name="more_vert" size={20} /></InertButton>
      <span className="reply-box-discard">
        <IconButton label="Discard draft" tooltipAlign="right" onClick={onDiscard}>
          <Icon name="delete" size={20} />
        </IconButton>
      </span>
    </div>
  )
}
