import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import InertButton from './InertButton.jsx'
import { FormattingBar, SendRow } from './WritingTools.jsx'

// "Grace Xu (buffalo.edu)", as Gmail shows the person you're replying to
function recipientLabel(email) {
  const domain = email.senderEmail?.split('@')[1]
  return domain ? `${email.sender} (${domain})` : email.sender
}

// Under an open email: Gmail's Reply / Forward / reaction / Share in chat buttons. Reply opens
// Gmail's in-place reply box right there, under the thread, not the compose drawer
// (Amanda's Gmail screenshot, BUILD-LOG 2026-10-30). Only Reply, typing, Send and the trash
// (discard) work; the formatting and attachment tools are visible but inert.
export default function ReplyArea({ email, onSendReply }) {
  const [replying, setReplying] = useState(false)
  const [body, setBody] = useState('')
  const textRef = useRef(null)
  const replyButtonRef = useRef(null)

  useEffect(() => {
    if (replying) {
      textRef.current?.focus()
      textRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [replying])

  function close() {
    setReplying(false)
    setBody('')
    setTimeout(() => replyButtonRef.current?.focus(), 0)
  }

  if (!replying) {
    return (
      <div className="reply-row">
        <button type="button" className="reply-button" ref={replyButtonRef} onClick={() => setReplying(true)}>
          <Icon name="reply" size={20} />
          Reply
        </button>
        <InertButton label="Forward" className="reply-button" nameOnHover={false}>
          <Icon name="forward" size={20} />
          Forward
        </InertButton>
        <InertButton label="Add reaction" className="reply-button is-round">
          <Icon name="mood" size={22} />
        </InertButton>
        <InertButton label="Share in chat" className="reply-button" nameOnHover={false}>
          <Icon name="chat_bubble" size={20} />
          Share in chat
        </InertButton>
      </div>
    )
  }

  return (
    <div className="reply-box-row">
      {/* Your avatar: the account icon from the top right of the header, drawn lighter */}
      <span className="thread-avatar is-me" aria-hidden="true">
        <Icon name="account_circle" size={32} />
      </span>
      <form
        className="reply-box"
        aria-label={`Reply to ${email.sender}`}
        onSubmit={(event) => {
          event.preventDefault()
          onSendReply(email, body)
          close()
        }}
      >
        <div className="reply-box-header">
          <Icon name="reply" size={20} />
          <Icon name="arrow_drop_down" size={20} />
          <span className="reply-box-to">{recipientLabel(email)}</span>
          <InertButton label="Pop out reply" className="icon-button reply-box-popout">
            <Icon name="open_in_new" size={18} />
          </InertButton>
        </div>
        <textarea
          ref={textRef}
          className="reply-box-text"
          aria-label="Message"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <FormattingBar />
        <SendRow onDiscard={close} />
      </form>
    </div>
  )
}
