// A round icon-only button with a Gmail-style name tooltip.
// "Disabled" buttons stay focusable so their tooltip can still explain them.
export default function IconButton({ label, tooltip = label, disabled = false, onClick, tooltipAlign, children }) {
  return (
    <button
      type="button"
      className="icon-button has-tooltip"
      aria-label={label}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {children}
      <span className={`tooltip ${tooltipAlign ? `align-${tooltipAlign}` : ''}`} aria-hidden="true">
        {tooltip}
      </span>
    </button>
  )
}
