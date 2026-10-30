import { useLayoutEffect, useRef, useState } from 'react'

// A dashed rounded outline whose dashes fit evenly all the way around, with no
// short dash or long gap where the line meets its starting point. It measures its box,
// works out how many 8px dash + 6px gap pairs fit, and tells the browser the line is
// exactly that long (pathLength), so the browser stretches them slightly to fit.
// Fills its positioned parent; stroke color and width come from CSS.
export default function DashedOutline({ className, inset, radius, dash = 8, gap = 6 }) {
  const ref = useRef(null)
  const [size, setSize] = useState(null)

  useLayoutEffect(() => {
    // Measure right away so the outline shows on the first frame, then keep it fitted
    const box = ref.current.getBoundingClientRect()
    setSize({ width: box.width, height: box.height })
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  let rect = null
  if (size) {
    const width = size.width - inset * 2
    const height = size.height - inset * 2
    const r = Math.min(radius, width / 2, height / 2)
    const perimeter = 2 * (width - 2 * r) + 2 * (height - 2 * r) + 2 * Math.PI * r
    const pairs = Math.max(1, Math.round(perimeter / (dash + gap)))
    rect = (
      <rect
        x={inset}
        y={inset}
        width={width}
        height={height}
        rx={r}
        pathLength={pairs * (dash + gap)}
        strokeDasharray={`${dash} ${gap}`}
      />
    )
  }

  return (
    <svg ref={ref} className={className} aria-hidden="true">
      {rect}
    </svg>
  )
}
