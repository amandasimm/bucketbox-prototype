import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'
import IconButton from './IconButton.jsx'

// The getting-started checklist (Stage 24e; Amanda, 2026-11-24 and 2026-11-27). A floating card in
// the bottom right, where Compose opens, with the onboarding card's blue header, Minimize and
// Close. It appears after onboarding's last step and ticks tasks off on its own (App.jsx, tick).
// Not a modal: the page behind it keeps working. Minimized, it's a pill like Compose's. While
// Compose is open, it sits to Compose's left (composeWidth). Toasts sit just above it.
// Pointing at or tabbing to a task points out where to do it (Amanda, 2026-11-27: a guide, not
// buttons): a soft blue glow on the Declutter button, or the first bucket's 3-dot menu, in the
// control's own shape (Amanda, 2026-11-27: not an oval around it).
// Screen readers hear the same directions as text.
// checklist: { minimized, done: { bucket, rules, move, declutter }, announce, minimize, expand, close }

// Where each task's guide points
const guideTargets = {
  declutter: () => document.getElementById('declutter-button'),
  // The Rules item if a bucket's 3-dot menu is open, otherwise the first bucket's 3-dot button.
  // Only while the task is pointed at (Amanda, 2026-11-27: people may not want rules).
  rules: () =>
    document.querySelector('.bucket-menu .bucket-menu-rules') ??
    document.querySelector('.bucket-slot:not(.add-bucket-slot) .bucket-menu-wrap > .icon-button'),
}

// The glow, drawn over the page exactly on the control, with the control's own corners. It follows
// scrolling and resizing.
function Guide({ task }) {
  const [box, setBox] = useState(null)
  useLayoutEffect(() => {
    const place = () => {
      const target = guideTargets[task]?.()
      const rect = target?.getBoundingClientRect()
      const onScreen = rect && rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight
      const radius = target && getComputedStyle(target).borderRadius
      setBox(onScreen ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height, radius } : null)
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [task])
  if (!box) return null
  return createPortal(
    <div className="guide" aria-hidden="true" style={{ top: box.top, left: box.left, width: box.width, height: box.height, borderRadius: box.radius }} />,
    document.body,
  )
}

export default function GettingStarted({ checklist, composeWidth = 0 }) {
  const ref = useRef(null)
  const { done, minimized } = checklist
  const [guide, setGuide] = useState(null) // the task whose control is being pointed out
  // In order (Amanda, 2026-11-27): the bucket, moving an email, Declutter, then the optional rules
  const tasks = [
    { key: 'bucket', name: 'Create your first bucket' }, // matches step 5's heading (Amanda, 2026-11-27)
    { key: 'move', name: 'Move an email into a bucket', help: 'Drag and drop an email into a bucket or use the Move button' },
    {
      key: 'declutter',
      name: 'Organize your emails with Declutter', // works for any view (Amanda, 2026-11-27)
      help: 'Go through your emails one at a time.',
      where: 'The Declutter button is at the top of your email list.',
    },
    {
      key: 'rules',
      name: 'Add auto-sort rules to a bucket',
      optional: true,
      help: 'New emails will go straight to a bucket.',
      where: "Open a bucket's 3-dot menu and choose Rules.",
    },
  ]
  const doneCount = tasks.filter((task) => done[task.key]).length
  // The optional task doesn't hold up "all set"
  const allSet = tasks.every((task) => task.optional || done[task.key])

  // Toasts sit above the checklist while it's showing (HomePage.css, .toast-region)
  useLayoutEffect(() => {
    const root = document.documentElement
    const update = () => root.style.setProperty('--checklist-space', `${(ref.current?.offsetHeight ?? 0) + 16}px`)
    update()
    const observer = new ResizeObserver(update)
    if (ref.current) observer.observe(ref.current)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--checklist-space')
    }
  }, [minimized])

  const style = { '--compose-offset': composeWidth > 0 ? `${composeWidth + 16}px` : '0px' }
  // Screen readers hear each task as it's ticked off
  const live = (
    <p className="visually-hidden" role="status">
      {checklist.announce}
    </p>
  )

  if (minimized) {
    return (
      <div ref={ref} className="checklist is-minimized" role="region" aria-label="Get started" style={style}>
        <button type="button" className="checklist-bar" aria-expanded="false" onClick={checklist.expand}>
          <span className="checklist-title">Get started</span>
          <span className="checklist-count">
            {doneCount} of {tasks.length}
          </span>
        </button>
        <IconButton label="Close Get started" tooltip="Close" tooltipAlign="right" onClick={checklist.close}>
          <Icon name="close" size={20} />
        </IconButton>
        {live}
      </div>
    )
  }

  return (
    <section ref={ref} className="checklist" aria-labelledby="checklist-title" style={style}>
      <header className="checklist-header">
        <h2 id="checklist-title" className="checklist-title">
          Get started
        </h2>
        <p className="checklist-count">
          {doneCount} of {tasks.length}
          <span className="visually-hidden"> done</span>
        </p>
        <IconButton label="Minimize Get started" tooltip="Minimize" onClick={checklist.minimize}>
          <Icon name="minimize" size={20} />
        </IconButton>
        <IconButton label="Close Get started" tooltip="Close" tooltipAlign="right" onClick={checklist.close}>
          <Icon name="close" size={20} />
        </IconButton>
        <div className="checklist-progress" aria-hidden="true">
          <span style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
        </div>
      </header>
      <ul className="checklist-tasks">
        {tasks.map((task) => {
          const guided = !done[task.key] && guideTargets[task.key]
          return (
          <li
            key={task.key}
            className={`checklist-task ${done[task.key] ? 'is-done' : ''} ${guided ? 'is-guided' : ''}`}
            // A guided task can be reached with Tab too, so the pointer isn't hover-only
            tabIndex={guided ? 0 : undefined}
            onMouseEnter={guided ? () => setGuide(task.key) : undefined}
            onMouseLeave={guided ? () => setGuide(null) : undefined}
            onFocus={guided ? () => setGuide(task.key) : undefined}
            onBlur={guided ? () => setGuide(null) : undefined}
          >
            {/* A check, not just a color, so done doesn't rely on color */}
            <span className="checklist-check" aria-hidden="true">
              <Icon name={done[task.key] ? 'check_circle' : 'radio_button_unchecked'} filled={done[task.key]} size={22} />
            </span>
            <span className="checklist-text">
              <span className="checklist-name">
                {task.name}
                <span className="visually-hidden">{done[task.key] ? ', done' : ', not done yet'}</span>
                {task.optional && <span className="checklist-optional">Optional</span>}
              </span>
              {!done[task.key] && task.help && <span className="checklist-help">{task.help}</span>}
              {!done[task.key] && task.where && <span className="visually-hidden">{task.where}</span>}
            </span>
          </li>
          )
        })}
      </ul>
      {guide && !done[guide] && <Guide task={guide} />}
      {allSet && (
        <div className="checklist-done">
          <p>You&apos;re all set. Nice work.</p>
          <button type="button" className="filled-button" onClick={checklist.close}>
            Close
          </button>
        </div>
      )}
      {live}
    </section>
  )
}
