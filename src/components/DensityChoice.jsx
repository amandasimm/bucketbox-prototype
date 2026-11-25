import Icon from './Icon.jsx'

// Gmail's Density setting, surfaced in Bucketbox (Stage 24b; Amanda, 2026-11-24), plus a fourth,
// Roomy, for less at once on screen: bigger text, with the subject and preview on two lines.
// Each choice has a small drawing of the rows, like Gmail's own picker. Used in Bucketbox
// settings and in onboarding's second step. It changes the rows of wide lists (520px or more);
// the stacked rows of narrow lists already have room to breathe. Row heights: HomePage.css, "Density".
// Roomy comes first and is what everyone starts with (Amanda, 2026-11-25); Gmail's three follow.
export const densities = [
  { value: 'roomy', label: 'Roomy', rows: [{ preview: true, chip: true }], roomy: true },
  { value: 'default', label: 'Default', rows: [{ chip: true }] },
  { value: 'comfortable', label: 'Comfortable', rows: [{}, {}] },
  { value: 'compact', label: 'Compact', rows: [{}, {}, {}] },
]

function DensityDrawing({ rows, roomy }) {
  return (
    <span className={`density-drawing ${roomy ? 'is-roomy' : ''}`} aria-hidden="true">
      {rows.map((row, index) => (
        <span key={index} className="density-drawing-row">
          <span className="density-drawing-line">
            <span className="density-drawing-box" />
            <span className="density-drawing-bar" />
          </span>
          {row.preview && <span className="density-drawing-preview" />}
          {row.chip && (
            <span className="density-drawing-chip">
              <Icon name="description" filled size={14} />
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

export default function DensityChoice({ name, value, onChange, legend = 'Density', hideLegend = false }) {
  return (
    <fieldset className="setting-choices density-choice">
      <legend className={hideLegend ? 'visually-hidden' : 'setting-label'}>{legend}</legend>
      {densities.map((density) => (
        <label key={density.value} className="density-option">
          <input type="radio" name={name} checked={value === density.value} onChange={() => onChange(density.value)} />
          <span className="density-option-name">{density.label}</span>
          <DensityDrawing rows={density.rows} roomy={density.roomy} />
        </label>
      ))}
    </fieldset>
  )
}
