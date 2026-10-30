function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// White or near-black, whichever reads better on this color
export function inkOn(hex) {
  const l = luminance(hex)
  const onWhite = 1.05 / (l + 0.05)
  const onDark = (l + 0.05) / (luminance('#1f1f1f') + 0.05)
  return onWhite >= onDark ? '#ffffff' : '#1f1f1f'
}

// The CSS variables a bucket tile uses. One rule for every color (BUILD-LOG, 2026-10-30):
// the outline is the color itself and the header is the color at 20%. Text is always dark,
// never the bucket color, since most of the palette is too light to read as text.
// - --bucket-color: outlines, the dot, the filled "+"
// - --bucket-header: header fill
// - --bucket-ink: the "+" drawn on top of the color (white or dark, whichever reads better)
export function bucketStyle(hex) {
  return {
    '--bucket-color': hex,
    '--bucket-header': `color-mix(in srgb, ${hex} 20%, white)`,
    '--bucket-ink': inkOn(hex),
  }
}
