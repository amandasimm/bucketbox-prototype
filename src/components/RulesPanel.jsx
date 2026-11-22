import { Fragment, useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'
import { bucketStyle } from '../utils/bucketColors.js'
import { backlogFor, gmailCategories } from '../utils/rules.js'
import { chipText, chipsFromEmail, criterionTypes, parsePhrase, rulesSummary } from '../utils/ruleText.js'

// A bucket's auto-sort rules (PRD F14; brief item 1b). Amanda's choice (2026-11-21): its own
// panel that slides in over the buckets, opened from the bucket's 3-dot menu (Rules) or from an
// open email ("Make a rule from this email"). Changes are a draft until Save; Cancel, the X or
// Escape leave the rules as they were. Nothing is sorted yet (that's 1d and 1f).

let nextId = 0
const makeId = () => `rule-${Date.now()}-${(nextId += 1)}`
const blankRule = (criteria = [], extras = {}) => ({ id: makeId(), match: 'any', paused: false, criteria, ...extras })

// Card-only notes (not understood words, chips offered from an email) aren't saved with the rule
const cleanRule = ({ id, match, paused, criteria }) => ({ id, match, paused, criteria })
const sameCriterion = (a, b) => a.type === b.type && a.value.toLowerCase() === b.value.toLowerCase()

// A rule card made from an email: its first chip, with the others offered underneath
function ruleFromEmail(email) {
  const { first, more } = chipsFromEmail(email)
  return blankRule([first], { offered: more, fromEmail: email.sender })
}

// A small menu that opens from a button (the card's 3-dot menu, "+ Add condition")
function MenuButton({ label, icon, text, className = '', items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  useEffect(() => {
    if (!open) return
    wrapRef.current.querySelector('[role="menuitem"]')?.focus()
    function onPointerDown(event) {
      if (!wrapRef.current.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
      wrapRef.current.querySelector('button')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])
  return (
    <div className="rules-menu-wrap" ref={wrapRef}>
      {text ? (
        <button type="button" className={className} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
          {icon && <Icon name={icon} size={18} />}
          {text}
        </button>
      ) : (
        // No hover text on a rule's 3-dot menu (Amanda, 2026-11-21); the label is still read out
        <IconButton label={label} tooltip={null} onClick={() => setOpen(!open)}>
          <Icon name={icon} size={20} />
        </IconButton>
      )}
      {open && (
        <div className={`bucket-menu rules-menu align-${align}`} role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="move-menu-item"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              {item.icon && <Icon name={item.icon} size={20} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// "+ Add condition" on a card (Amanda, 2026-11-21): a compact menu instead of the full list of
// ways, so adding to a rule takes few clicks. "Gmail category" and "Manually" step into a second
// list (with a Back row at the top); a category is added in one click, a manual kind opens the editor.
function AddConditionMenu({ ruleNumber, onPhrase, onEmail, onCategory, onManual }) {
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState('top') // 'top' | 'category' | 'manual'
  const wrapRef = useRef(null)
  const close = () => {
    setOpen(false)
    setLevel('top')
  }
  useEffect(() => {
    if (!open) return
    wrapRef.current.querySelector('[role="menuitem"]')?.focus()
  }, [open, level])
  useEffect(() => {
    if (!open) return
    function onPointerDown(event) {
      if (!wrapRef.current.contains(event.target)) close()
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
      wrapRef.current.querySelector('.rules-add-button')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  const pick = (action) => () => {
    close()
    action()
  }
  const item = (label, onClick, { more = false, icon = null } = {}) => (
    <button key={label} type="button" role="menuitem" className={`move-menu-item add-condition-item ${label === 'Back' ? 'is-back' : ''}`} aria-haspopup={more ? 'menu' : undefined} onClick={onClick}>
      {icon && <Icon name={icon} size={20} />}
      <span className="add-condition-label">{label}</span>
      {more && <Icon name="chevron_right" size={20} />}
    </button>
  )
  const back = item('Back', () => setLevel('top'), { icon: 'chevron_left' })

  return (
    <div className="rules-menu-wrap" ref={wrapRef}>
      <button type="button" className="rules-add-button" aria-expanded={open} aria-haspopup="menu" onClick={() => (open ? close() : setOpen(true))}>
        <Icon name="add" size={18} />
        Add condition
      </button>
      {open && (
        <div className="bucket-menu rules-menu align-left add-condition-menu" role="menu" aria-label={`Add to rule ${ruleNumber}`}>
          {level === 'top' && [
            item('Type a phrase', pick(onPhrase)),
            item('Select an email', pick(onEmail)),
            item('Gmail category', () => setLevel('category'), { more: true }),
            item('Manually', () => setLevel('manual'), { more: true }),
          ]}
          {level === 'category' && [back, ...gmailCategories.map((name) => item(name, pick(() => onCategory(name))))]}
          {level === 'manual' && [back, ...criterionTypes.map((option) => item(option.label, pick(() => onManual(option.type))))]}
        </div>
      )}
    </div>
  )
}

// Two buttons side by side, one chosen ("Any | All", "or | and"). The choice shows by a check
// mark and fill, not by color alone.
// An option can carry hover text (option.hint), shown as a tooltip and read out as its description.
function Segmented({ label, value, options, onChange }) {
  const ids = useId()
  return (
    <div className="rules-segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          aria-describedby={option.hint ? `${ids}-${option.value}` : undefined}
          className={`${value === option.value ? 'is-chosen' : ''} ${option.hint ? 'has-tooltip' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {value === option.value && <Icon name="check" size={16} />}
          {option.label}
          {option.hint && (
            <span id={`${ids}-${option.value}`} className="tooltip is-wide align-right" role="tooltip">
              {option.hint}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Parts of a summary sentence: text, with joining words ({ join }) in bold
const SummaryParts = ({ parts }) =>
  parts.map((part, i) => (typeof part === 'string' ? <span key={i}>{part}</span> : <strong key={i}> {part.join} </strong>))

// One chip being added or changed: what kind, then the value
function ChipEditor({ criterion, isNew, onDone, onCancel }) {
  const [type, setType] = useState(criterion.type)
  const [value, setValue] = useState(criterion.value)
  const ids = useId()
  const fieldRef = useRef(null)
  useEffect(() => {
    fieldRef.current?.focus()
  }, [type])
  const option = criterionTypes.find((o) => o.type === type)
  const clean = value.trim()
  const canSave = clean !== '' && (type !== 'category' || gmailCategories.includes(clean))
  function done(event) {
    event?.preventDefault()
    if (canSave) onDone({ type, value: clean })
  }
  return (
    <div
      className="chip-editor"
      role="group"
      aria-label={isNew ? 'New condition' : 'Change condition'}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onCancel()
        }
        if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') done(event)
      }}
    >
      <label className="visually-hidden" htmlFor={`${ids}-type`}>Kind of condition</label>
      <select
        id={`${ids}-type`}
        className="rules-select"
        value={type}
        onChange={(event) => {
          const next = event.target.value
          setType(next)
          if (next === 'category' && !gmailCategories.includes(value)) setValue(gmailCategories[0])
          if (type === 'category' && next !== 'category') setValue('')
        }}
      >
        {criterionTypes.map((o) => (
          <option key={o.type} value={o.type}>{o.label}</option>
        ))}
      </select>
      <label className="visually-hidden" htmlFor={`${ids}-value`}>{option.label}</label>
      {type === 'category' ? (
        <select id={`${ids}-value`} ref={fieldRef} className="rules-select" value={value} onChange={(event) => setValue(event.target.value)}>
          {gmailCategories.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      ) : (
        <input
          id={`${ids}-value`}
          ref={fieldRef}
          className="rules-input"
          value={value}
          placeholder={option.placeholder}
          autoComplete="off"
          onChange={(event) => setValue(event.target.value)}
        />
      )}
      <span className="chip-editor-buttons">
        <button type="button" className="text-button" onClick={onCancel}>Cancel</button>
        <button type="button" className="filled-button" disabled={!canSave} onClick={done}>Done</button>
      </span>
    </div>
  )
}

// One rule card: its chips, the card's Any / All choice (only with 2+ chips), and its menu
function RuleCard({ rule, number, editing, onEditChip, onChange, onDelete, pickableEmails, bucketName }) {
  const setCriteria = (criteria) => onChange({ ...rule, criteria })
  // Adding by typing or by picking an email opens that step inside the card: null | 'phrase' | 'email'
  const [adding, setAdding] = useState(null)
  // What was found joins this card; repeats are dropped
  function addFound(found) {
    const criteria = [...rule.criteria]
    for (const c of found.criteria) if (!criteria.some((other) => sameCriterion(other, c))) criteria.push(c)
    onChange({ ...rule, criteria, offered: [...(rule.offered ?? []), ...(found.offered ?? [])] })
    return criteria
  }
  const offered = (rule.offered ?? []).filter((o) => !rule.criteria.some((c) => sameCriterion(c, o)))
  const addingNew = editing?.index === rule.criteria.length

  function finishEdit(index, criterion) {
    const criteria = [...rule.criteria]
    criteria[index] = criterion
    // The same chip twice adds nothing, so a repeat is dropped
    setCriteria(criteria.filter((c, i) => criteria.findIndex((other) => sameCriterion(other, c)) === i))
    onEditChip(null)
  }

  return (
    <section className={`rule-card ${rule.paused ? 'is-paused' : ''}`} aria-label={`Rule ${number}${rule.paused ? ', paused' : ''}`}>
      <header className="rule-card-header">
        <h3 className="rule-card-title">Rule {number}</h3>
        {rule.paused && (
          <span className="rule-paused-badge">
            <Icon name="pause" size={16} />
            Paused
          </span>
        )}
        {rule.criteria.length > 1 && (
          <span className="rule-match">
            <span className="rule-match-label" aria-hidden="true">Match</span>
            <Segmented
              label={`Rule ${number}: emails match`}
              value={rule.match}
              options={[
                { value: 'any', label: 'Any', hint: 'An email needs to match just one of these conditions' },
                { value: 'all', label: 'All', hint: 'An email needs to match every one of these conditions' },
              ]}
              onChange={(match) => onChange({ ...rule, match })}
            />
          </span>
        )}
        <MenuButton
          label={`Options for rule ${number}`}
          icon="more_vert"
          items={[
            rule.paused
              ? { label: 'Resume rule', icon: 'play_arrow', onClick: () => onChange({ ...rule, paused: false }) }
              : { label: 'Pause rule', icon: 'pause', onClick: () => onChange({ ...rule, paused: true }) },
            { label: 'Delete rule', icon: 'delete', onClick: onDelete },
          ]}
        />
      </header>

      {rule.fromEmail && <p className="rule-card-note">Started from an email from {rule.fromEmail}.</p>}
      {rule.note && <p className="rule-card-note">{rule.note}</p>}

      {rule.criteria.length === 0 && !addingNew && <p className="rule-card-empty">No conditions yet. Add one to start this rule.</p>}
      <ul className="rule-chips" aria-label={`Rule ${number} conditions`}>
        {rule.criteria.map((criterion, index) =>
          editing?.index === index ? (
            <li key={index} className="rule-chip-editing">
              <ChipEditor criterion={criterion} onDone={(c) => finishEdit(index, c)} onCancel={() => onEditChip(null)} />
            </li>
          ) : (
            <li key={index} className="rule-chip">
              <button type="button" className="rule-chip-text" aria-label={`${chipText(criterion)}. Change`} onClick={() => onEditChip(index)}>
                {chipText(criterion)}
              </button>
              <button
                type="button"
                className="rule-chip-remove"
                aria-label={`Remove ${chipText(criterion)}`}
                title="Remove"
                onClick={() => setCriteria(rule.criteria.filter((_, i) => i !== index))}
              >
                <Icon name="close" size={16} />
              </button>
            </li>
          ),
        )}
      </ul>
      {addingNew && (
        <ChipEditor
          isNew
          criterion={{ type: editing.type, value: editing.type === 'category' ? gmailCategories[0] : '' }}
          onDone={(c) => finishEdit(rule.criteria.length, c)}
          onCancel={() => onEditChip(null)}
        />
      )}
      {adding && (
        <StartRule
          target="condition"
          initialWay={adding}
          ruleNumber={number}
          pickableEmails={pickableEmails}
          bucketName={bucketName}
          onCancel={() => setAdding(null)}
          onAdd={(found, manually) => {
            const criteria = addFound(found)
            setAdding(null)
            if (manually) onEditChip(criteria.length, 'sender')
          }}
        />
      )}
      {!addingNew && !adding && (
        <AddConditionMenu
          ruleNumber={number}
          onPhrase={() => setAdding('phrase')}
          onEmail={() => setAdding('email')}
          onCategory={(name) => addFound({ criteria: [{ type: 'category', value: name }] })}
          onManual={(type) => onEditChip(rule.criteria.length, type)}
        />
      )}

      {offered.length > 0 && (
        <div className="rule-offered">
          <p className="rule-offered-label">Also from this email:</p>
          <ul className="rule-chips">
            {offered.map((criterion) => (
              <li key={chipText(criterion)}>
                <button
                  type="button"
                  className="rule-chip-offer"
                  aria-label={`Add ${chipText(criterion)}`}
                  onClick={() => setCriteria([...rule.criteria, criterion])}
                >
                  <Icon name="add" size={16} />
                  {chipText(criterion)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// The four ways to start a rule (PRD F14; brief 1b)
// Copy follows Bucketbox's voice (BUILD-LOG, 2026-11-21): short, plain, friendly, and talks
// about emails landing in buckets, like the explanation at the top of the panel.
// target 'rule' starts a new rule card; 'condition' adds to rule ruleNumber's card.
// onAdd(rule, manually): the conditions found, and whether to open the manual editor next.
function StartRule({ target = 'rule', initialWay = null, ruleNumber, pickableEmails, bucketName, onAdd, onCancel, autoFocus }) {
  const [way, setWay] = useState(initialWay) // null | 'phrase' | 'email' | 'category'
  const [phrase, setPhrase] = useState('')
  // A typed phrase with parts that weren't understood: { notUnderstood, criteria, match }.
  // The person can retype, or add it manually; nothing is created until they choose.
  const [problem, setProblem] = useState(null)
  const forRule = target === 'rule'
  const boxClass = forRule ? 'start-rule' : 'start-rule is-in-card'
  const ids = useId()
  const firstRef = useRef(null)
  useEffect(() => {
    if (autoFocus || way) firstRef.current?.focus()
  }, [way, autoFocus])

  function makeFromPhrase(event) {
    event.preventDefault()
    if (!phrase.trim()) return
    const { criteria, match, notUnderstood, note } = parsePhrase(phrase)
    if (notUnderstood.length > 0) {
      setProblem({ notUnderstood, criteria, match })
      firstRef.current?.focus()
      return
    }
    onAdd(blankRule(criteria, { match, note }))
  }
  const quotedList = (texts) =>
    texts.length === 1 ? `“${texts[0]}”` : `${texts.slice(0, -1).map((t) => `“${t}”`).join(', ')} and “${texts.at(-1)}”`

  // Escape steps out of adding to a rule, rather than closing the whole panel
  function escapeCancels(event) {
    if (event.key === 'Escape' && onCancel) {
      event.stopPropagation()
      onCancel()
    }
  }

  const back = (
    <button type="button" className="text-button" onClick={() => (onCancel && (!way || !forRule) ? onCancel() : setWay(null))}>
      {way && forRule ? 'Back' : 'Cancel'}
    </button>
  )

  if (way === 'phrase') {
    return (
      <form className={boxClass} onSubmit={makeFromPhrase} onKeyDown={escapeCancels}>
        <label className="start-rule-title" htmlFor={`${ids}-phrase`}>Which emails should land in {bucketName}?</label>
        <input
          id={`${ids}-phrase`}
          ref={firstRef}
          className="rules-input"
          value={phrase}
          autoComplete="off"
          placeholder="from chase.com, subject receipt"
          aria-describedby={`${ids}-phrase-hint`}
          aria-invalid={problem !== null}
          onChange={(event) => {
            setPhrase(event.target.value)
            setProblem(null)
          }}
        />
        {problem ? (
          <p id={`${ids}-phrase-hint`} className="start-rule-problem" role="alert">
            <Icon name="help" size={16} />
            <span>
              {quotedList(problem.notUnderstood)} {problem.notUnderstood.length === 1 ? "wasn't" : "weren't"} understood. Try typing it another way, or{' '}
              <button type="button" className="inline-link" onClick={() => onAdd(blankRule(problem.criteria, { match: problem.match }), true)}>
                add it manually
              </button>
              .
            </span>
          </p>
        ) : (
          <p id={`${ids}-phrase-hint`} className="start-rule-hint">
            Try “from chase.com”, “subject receipt”, “about ATM” or “in Promotions”.
          </p>
        )}
        <div className="start-rule-buttons">
          {back}
          <button type="submit" className="filled-button" disabled={!phrase.trim()}>{forRule ? 'Create rule' : 'Add to rule'}</button>
        </div>
      </form>
    )
  }

  if (way === 'email') {
    return (
      <div className={boxClass} onKeyDown={escapeCancels}>
        <p className="start-rule-title">{forRule ? 'Select an email to start from' : 'Select an email'}</p>
        {pickableEmails.length === 0 && <p className="start-rule-hint">No emails to select on this day.</p>}
        {pickableEmails.map((group, g) => (
          <div key={group.label} className="start-rule-group">
            <p className="start-rule-group-label">{group.label}</p>
            <ul className="start-rule-emails">
              {group.emails.map((email, i) => (
                <li key={email.id}>
                  <button type="button" ref={g === 0 && i === 0 ? firstRef : undefined} className="start-rule-email" onClick={() => onAdd(ruleFromEmail(email))}>
                    <span className="start-rule-email-sender">{email.sender}</span>
                    <span className="start-rule-email-subject">{email.subject}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="start-rule-buttons">{back}</div>
      </div>
    )
  }

  if (way === 'category') {
    return (
      <div className={boxClass} onKeyDown={escapeCancels}>
        <p className="start-rule-title">Select a Gmail category</p>
        <p className="start-rule-hint">Gmail chooses these categories itself, so they aren't always right.</p>
        <div className="start-rule-categories">
          {gmailCategories.map((name, i) => (
            <button key={name} type="button" ref={i === 0 ? firstRef : undefined} className="outlined-button" onClick={() => onAdd(blankRule([{ type: 'category', value: name }]))}>
              {name}
            </button>
          ))}
        </div>
        <div className="start-rule-buttons">{back}</div>
      </div>
    )
  }

  const ways = [
    { key: 'phrase', icon: 'keyboard', label: 'Type a phrase', hint: 'Like “from chase.com, subject receipt”' },
    { key: 'scratch', icon: 'add', label: 'Manually', hint: 'Add conditions one at a time' },
    { key: 'email', icon: 'mail', label: 'Select an email', hint: 'Use its sender, category or subject' },
    { key: 'category', icon: 'category', label: 'Use a Gmail category', hint: 'Primary, Social, Promotions, Updates or Forums' },
  ]
  return (
    <div className={boxClass} onKeyDown={escapeCancels}>
      <p className="start-rule-title">{forRule ? `Start a rule for ${bucketName}` : `Add to rule ${ruleNumber}`}</p>
      <ul className="start-rule-ways">
        {ways.map((option, i) => (
          <li key={option.key}>
            <button
              type="button"
              ref={i === 0 ? firstRef : undefined}
              className="start-rule-way"
              onClick={() => (option.key === 'scratch' ? onAdd(blankRule([]), true) : setWay(option.key))}
            >
              <Icon name={option.icon} size={20} />
              <span>
                <span className="start-rule-way-label">{option.label}</span>
                <span className="start-rule-way-hint">{option.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {onCancel && <div className="start-rule-buttons">{back}</div>}
    </div>
  )
}

// The emails these rules would collect from the backlog (PRD F14; brief 1c; Amanda 2026-11-21):
// unsorted emails from any day (no time window), newest first, one per row, 10 to a page with
// Gmail-style "1–5 of 14" and arrows. Each starts unchecked, with Select all above the list
// (Amanda, 2026-11-21); only selected emails move, and the rules don't change. Updates live as the rules are edited. Nothing moves until
// the backlog sort (1d).
const PAGE_SIZE = 10 // Amanda, 2026-11-21 (was 5)

// "Priority's", "Bills'"
const possessive = (name) => (name.endsWith('s') ? `${name}’` : `${name}’s`)

function RulesPreview({ matches, selected, onToggle, onSelectAll, bucketName }) {
  const ids = useId()
  const allSelected = matches.length > 0 && selected.length === matches.length
  // Some but not all: the Select all box shows a dash, like Gmail's
  const selectAllRef = useRef(null)
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selected.length > 0 && !allSelected
  })
  const [page, setPage] = useState(0)
  const count = matches.length
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const current = Math.min(page, pages - 1) // the rules changed and there are fewer pages now
  const first = current * PAGE_SIZE
  const shown = matches.slice(first, first + PAGE_SIZE)
  return (
    <section className="rules-preview" aria-labelledby={`${ids}-title`} aria-describedby={`${ids}-hint`}>
      <h3 id={`${ids}-title`} className="rules-preview-title">Already in your inbox</h3>
      {count === 0 ? (
        <p id={`${ids}-hint`} className="rules-preview-hint">No unsorted emails match {possessive(bucketName)} rules yet.</p>
      ) : (
        <>
          <p id={`${ids}-hint`} className="rules-preview-hint">
            {count} unsorted {count === 1 ? 'email matches' : 'emails match'} {possessive(bucketName)} rules. Select an email to move it to {bucketName}.
          </p>
          {/* Selects every matching email, on all pages */}
          <label className="rules-preview-select-all">
            <input ref={selectAllRef} type="checkbox" checked={allSelected} onChange={() => onSelectAll(!allSelected)} />
            Select all
          </label>
          <ul className="rules-preview-list">
            {shown.map((email) => (
              <li key={email.id}>
                <label className="rules-preview-row">
                  <input type="checkbox" checked={selected.includes(email.id)} onChange={() => onToggle(email.id)} />
                  <span className="rules-preview-text">
                    <span className="rules-preview-sender">{email.sender}</span>
                    <span className="rules-preview-subject">{email.subject}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {/* Under the list, close to the emails: the unchecked note on the left, the pager on the right */}
          {(selected.length > 0 || count > PAGE_SIZE) && (
            <div className="rules-preview-footer">
              <p className="rules-preview-more" aria-live="polite">
                {selected.length > 0 && `${selected.length} of ${count} selected`}
              </p>
              {count > PAGE_SIZE && (
                <div className="rules-preview-pager">
                  <span aria-live="polite">
                    {first + 1}–{first + shown.length} of {count}
                  </span>
                  <IconButton label="Previous emails" tooltip="Newer" disabled={current === 0} onClick={() => setPage(current - 1)}>
                    <Icon name="chevron_left" size={20} />
                  </IconButton>
                  <IconButton label="Next emails" tooltip="Older" tooltipAlign="right" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>
                    <Icon name="chevron_right" size={20} />
                  </IconButton>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default function RulesPanel({ bucket, startEmail, pickableEmails, emails, onSave, onClose }) {
  const [draft, setDraft] = useState(() => {
    const rules = (bucket.rules ?? []).map((rule) => ({ ...rule }))
    return { rules: startEmail ? [...rules, ruleFromEmail(startEmail)] : rules, ruleJoin: bucket.ruleJoin ?? 'any' }
  })
  // A newly added card scrolls fully into view (including one started from an email)
  const [newCardId, setNewCardId] = useState(() => (startEmail ? draft.rules.at(-1)?.id : null))
  // Which chip is being changed: { ruleId, index, type } (index = criteria.length for a new one)
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const panelRef = useRef(null)
  const titleRef = useRef(null)
  const ids = useId()

  const saved = JSON.stringify({ rules: bucket.rules ?? [], ruleJoin: bucket.ruleJoin ?? 'any' })
  const cleaned = { rules: draft.rules.filter((rule) => rule.criteria.length > 0).map(cleanRule), ruleJoin: draft.ruleJoin }
  const changed = JSON.stringify(cleaned) !== saved
  const summary = rulesSummary(draft.rules, draft.ruleJoin, bucket.name)
  // The preview follows the draft, not the saved rules, so it changes as rules are edited
  const matches = backlogFor({ rules: draft.rules, ruleJoin: draft.ruleJoin }, emails)
  // Emails selected to move, kept for the backlog sort (1d); only ones still matching count
  const [selectedIds, setSelectedIds] = useState([])
  const selected = selectedIds.filter((id) => matches.some((email) => email.id === id))
  const moveCount = selected.length
  // "Save", "Save and move 3", or "Move 3" when the rules themselves haven't changed
  const saveLabel = moveCount === 0 ? 'Save' : changed ? `Save and move ${moveCount}` : `Move ${moveCount}`
  // The "can't be undone" note is showing; Escape or Cancel steps back out of it
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef(null)
  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
  }, [confirming])
  if (confirming && moveCount === 0) setConfirming(false)

  // Open: the heading takes focus. Close: focus goes back to whatever opened the panel.
  useEffect(() => {
    const opener = document.activeElement
    titleRef.current?.focus({ preventScroll: true })
    return () => setTimeout(() => opener?.isConnected && opener.focus?.(), 0)
  }, [])

  // Escape is Cancel (unless a menu or a chip being changed takes it first). A click outside
  // the panel closes it only when nothing has changed or been selected, so no work is lost.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (document.querySelector('.rules-panel [role="menu"]')) return
      event.preventDefault()
      if (confirming) setConfirming(false)
      else onClose()
    }
    function onPointerDown(event) {
      if (!changed && moveCount === 0 && !panelRef.current.contains(event.target) && !event.target.closest('[role="menu"], .toast-region')) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [changed, moveCount, confirming, onClose])

  useEffect(() => {
    if (newCardId) panelRef.current.querySelector(`[data-rule-id="${newCardId}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [newCardId])

  const updateRule = (next) => setDraft({ ...draft, rules: draft.rules.map((rule) => (rule.id === next.id ? next : rule)) })
  function addRule(rule, startEditing = false) {
    setDraft({ ...draft, rules: [...draft.rules, rule] })
    setNewCardId(rule.id)
    setAdding(false)
    setEditing(startEditing ? { ruleId: rule.id, index: rule.criteria.length, type: 'sender' } : null)
  }

  return (
    <aside ref={panelRef} className="rules-panel" style={bucketStyle(bucket.color)} aria-labelledby={`${ids}-title`}>
      <header className="rules-panel-header">
        {bucket.emoji ? <span className="bucket-emoji" aria-hidden="true">{bucket.emoji}</span> : <span className="bucket-swatch" aria-hidden="true" />}
        <h2 id={`${ids}-title`} className="rules-panel-title" tabIndex={-1} ref={titleRef}>
          Rules for {bucket.name}
        </h2>
        <IconButton label="Close rules without saving" tooltip="Close" tooltipAlign="right" onClick={onClose}>
          <Icon name="close" size={20} />
        </IconButton>
      </header>

      <div className="rules-panel-scroll">
        <p className="rules-panel-explain">
          <Icon name="automation" size={20} />
          <span>Auto-sort rules allow you to decide what emails automatically land in each bucket, no manual sorting required.</span>
        </p>

        {draft.rules.map((rule, i) => (
          <div key={rule.id} data-rule-id={rule.id}>
            <RuleCard
              rule={rule}
              number={i + 1}
              editing={editing?.ruleId === rule.id ? editing : null}
              onEditChip={(index, type) => {
                const current = index === null ? null : rule.criteria[index]
                setEditing(index === null ? null : { ruleId: rule.id, index, type: current?.type ?? type })
              }}
              onChange={updateRule}
              pickableEmails={pickableEmails}
              bucketName={bucket.name}
              onDelete={() => setDraft({ ...draft, rules: draft.rules.filter((r) => r.id !== rule.id) })}
            />
          </div>
        ))}

        {draft.rules.length === 0 || adding ? (
          <StartRule
            pickableEmails={pickableEmails}
            bucketName={bucket.name}
            autoFocus={adding}
            onAdd={addRule}
            onCancel={draft.rules.length > 0 ? () => setAdding(false) : null}
          />
        ) : (
          <button type="button" className="rules-add-button is-another" onClick={() => setAdding(true)}>
            <Icon name="add" size={18} />
            Add another rule
          </button>
        )}

        {/* How several rules combine (Amanda, 2026-11-21): one choice for the whole bucket, below
            the rules, instead of a toggle between every pair of cards */}
        {draft.rules.length > 1 && (
          <fieldset className="rules-join">
            <legend className="rules-join-legend">When there's more than one rule</legend>
            {[
              { value: 'any', name: 'Any rule', text: 'All emails that match at least one rule will be sorted.' },
              { value: 'all', name: 'Every rule', text: 'Only emails that match all rules will be sorted.' },
            ].map((option) => (
              <label key={option.value} className="dialog-choice rules-join-choice">
                <input
                  type="radio"
                  name={`${ids}-join`}
                  value={option.value}
                  checked={draft.ruleJoin === option.value}
                  onChange={() => setDraft({ ...draft, ruleJoin: option.value })}
                />
                <span>
                  <strong>{option.name}:</strong> {option.text}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <section className="rules-summary" aria-labelledby={`${ids}-summary`} aria-live="polite">
          <h3 id={`${ids}-summary`} className="rules-summary-title">Summary</h3>
          <p>
            <SummaryParts parts={summary.intro} />
          </p>
          {summary.items.length > 0 && (
            <ul className="rules-summary-list">
              {summary.items.map((parts, i) => (
                <Fragment key={i}>
                  {i > 0 && <li className="rules-summary-joiner">{summary.joiner}</li>}
                  <li className="rules-summary-item">
                    <SummaryParts parts={parts} />
                  </li>
                </Fragment>
              ))}
            </ul>
          )}
          {summary.note && <p className="rules-summary-note">{summary.note}</p>}
        </section>

        <RulesPreview
          bucketName={bucket.name}
          matches={matches}
          selected={selected}
          onToggle={(id) => setSelectedIds(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])}
          onSelectAll={(all) => setSelectedIds(all ? matches.map((email) => email.id) : [])}
        />
      </div>

      {/* Backlog sort (brief 1d; Amanda, 2026-11-21): with emails selected, Save becomes "Save and
          move 3", and asks first in an inline note (no pop-up), since the move can't be undone */}
      {confirming ? (
        <footer className="rules-panel-footer is-confirming" role="group" aria-labelledby={`${ids}-confirm`}>
          <p id={`${ids}-confirm`} className="rules-panel-confirm">
            Move {moveCount} {moveCount === 1 ? 'email' : 'emails'} to {bucket.name}? This can't be undone, but you can still move {moveCount === 1 ? 'it' : 'them one at a time'} later.
          </p>
          <div className="rules-panel-confirm-buttons">
            <button type="button" className="text-button" onClick={() => setConfirming(false)}>Cancel</button>
            <button type="button" className="filled-button" ref={confirmRef} onClick={() => onSave(cleaned, selected)}>
              {saveLabel}
            </button>
          </div>
        </footer>
      ) : (
        <footer className="rules-panel-footer">
          {draft.rules.some((rule) => rule.criteria.length === 0) && (
            <p className="rules-panel-footnote">Rules with no conditions aren't saved.</p>
          )}
          <button type="button" className="text-button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="filled-button"
            disabled={!changed && moveCount === 0}
            onClick={() => (moveCount > 0 ? setConfirming(true) : onSave(cleaned, []))}
          >
            {saveLabel}
          </button>
        </footer>
      )}
    </aside>
  )
}
