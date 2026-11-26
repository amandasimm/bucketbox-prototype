import { bucketColors } from '../data/startingSetup.js'

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

// A color in CIE Lab, where distance matches how different two colors look
function lab(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047)
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b)
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

// A Gmail label's color as the closest of Bucketbox's 12 (Amanda, 2026-11-26). Gmail labels have
// no color until the person picks one; an uncolored label shows gray in Gmail, so it gets Slate.
export function bucketColorFor(gmailColor) {
  if (!gmailColor) return bucketColors.find((color) => color.name === 'Slate').hex
  const target = lab(gmailColor)
  const distance = (hex) => lab(hex).reduce((sum, value, i) => sum + (value - target[i]) ** 2, 0)
  return bucketColors.reduce((best, color) => (distance(color.hex) < distance(best.hex) ? color : best)).hex
}
