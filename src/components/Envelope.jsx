// The little envelope an email turns into while it's dragged (PRD F4; BUILD-LOG, 2026-11-13).
// Drawn in the same rounded-line style as Amanda's Declutter icon. Anonymous: it shows
// nothing about the email, only a count on its seal when several are dragged together.
// tint: a bucket's color, while the envelope is over that bucket. Its outline is drawn in
// that color; the paper stays white and the count's seal stays gray.
export default function Envelope({ count = 1, size = 56, tint = null }) {
  return (
    <span className="envelope" style={{ width: size, height: size, color: tint ?? undefined }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="3" y="8" width="34" height="24" rx="5" fill="#ffffff" stroke="currentColor" strokeWidth="2" />
        <path d="M4.5 11.5 17.6 21.4a4 4 0 0 0 4.8 0L35.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {count > 1 && <span className="envelope-count">{count}</span>}
    </span>
  )
}
