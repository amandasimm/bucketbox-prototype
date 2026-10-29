// A Material Symbols icon, e.g. <Icon name="inbox" />. Names: fonts.google.com/icons
export default function Icon({ name, filled = false, size }) {
  return (
    <span
      className={filled ? 'icon filled' : 'icon'}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
