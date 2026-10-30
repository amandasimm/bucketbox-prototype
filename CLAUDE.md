# CLAUDE.md — Neuroinclusive Inbox Prototype

## 1. Project summary
A clickable, fully interactive mock of a Gmail inbox, redesigned for neurodivergent email users (ages 18–30) who struggle with executive function, overloaded working memory, and emotional resistance to email. It groups mail by day ("Today list") and lets users sort it into personal "buckets."
It is a **prototype for concept testing** in Amanda Simmons's master's thesis (embedded in a Qualtrics survey, 5–10 participants). It is **not a production product** and does not connect to Gmail.

## 2. Source of truth
- **`prd-neuroinclusive-inbox-prototype.md` is the source of truth** for scope and behavior. Read the relevant section before building a feature. Don't copy the PRD into this file.
- If an asset (sketch, wireframe, screenshot) conflicts with the PRD text, **the PRD wins**. PRD §1A lists the known conflicts for wireframe-v2.png.
- **Gmail screenshots** = Gmail's current UI, to preserve. **Sketches and wireframes** = the redesigned views.
- Decisions made during the build live in `BUILD-LOG.md` and override the PRD only where the log says so.

## 3. Reference assets (all in the project root)
| File | What it shows | Informs | Status |
|---|---|---|---|
| screenshot-gmail-default-inbox.png | Gmail's left nav, header, single-line email rows | §5 shell, F1, F6 | Current: Gmail UI to preserve |
| screenshot-gmail-selected-email.png | A selected row and Gmail's selection toolbar icons | F5 icons, F7, F4 checkbox | Current: Gmail UI to preserve |
| screenshot-gmail-move-email.png | Gmail's native drag chip ("Move 1 conversation") | F4 drag visuals, Flow 2 | Current: v1 drag visuals |
| screenshot-gmail-compose.png | Compose drawer, expanded (bottom right) | §5 compose, F5 Reply | Current: Gmail UI to preserve |
| screenshot-gmail-compose-collapsed-hover.png | Collapsed compose bar, a starred email, row hover actions | §5, F1 row, F3 tag position | Current. The star is replaced by emoji tags |
| sketch-bucket-view.png | Expanded bucket: X + name, email list left, open email right, Gmail nav kept, "open prototype?" nav button | §5 bucket view, F2, F5, Flow 6 | Current. Buttons above email are illustrative; nav button is tentative |
| sketch-click-email-from-today.png | Today list with an email drawer sliding over the buckets, X at top right | §5 Today email view, F5, Flow 6 | Current |
| sketch-drag-zones.png | Circular trash (delete zone) under the Today list, buckets on the right | F4 delete zone, Flow 2 | Current for the delete-zone concept. **Undo placement is illustrative only**; zone shows only while dragging |
| wireframe-v2.png | Home page: Gmail placeholders, Today column, bucket grid | §5 home page, F1, F2, F4 | Current, **but many details conflict with the PRD** (see PRD §1A) |
| wireframe-v1.png | Early Today page concept ("bin" wording) | — | **Superseded.** Don't build from it |

**Privacy note:** the Gmail screenshots show a real inbox and email address. Use them only as visual reference. Never copy their content into mock data, and keep them out of the deployed site.

## 4. Scope
Build **v1 only** unless Amanda says otherwise. Full detail: PRD §4 and §6.

**v1 (in scope)**
- Home page: Today list (left) + bucket grid (right), starting with one bucket; "Add a Bucket" below the grid
- Inline bucket create/edit (name, color) and bucket delete via a 3-dot menu
- Drag and drop: Today → bucket, bucket → bucket, either → delete zone (zone shows only while dragging)
- "Move to" dropdown; Select all + Move / Archive / Delete buttons
- Emoji tags (3 recent + "see more" picker popover)
- Email view: drawer from the Today list; list + pane in an expanded bucket
- Day navigation (arrows, date picker, past days work like Today), state-aware empty states
- Undo, redo, and confirmation toasts
- Gmail reminders preserved (shown at top, excluded from Select all)
- Gmail chrome (left nav, header, search, compose drawer) kept and familiar
- Optional bucket emoji, in place of the color dot (moved from v2, decided 2026-10-30)
- "Open prototype" toggle at the bottom of the left nav, switching to a look-only Gmail-style inbox of the same mock emails (decided 2026-10-28)

Build decisions already made (stacked rows, real "today" date, no reminder emails in the mock data, "Priority" starting with emails) are in `BUILD-LOG.md` → Decisions.

**v2 / out of scope (don't build)**
- Onboarding; hotkeys and type-to-move; filtering (including by tag); edit mode ("Customize"); settings menu
- Envelope drag animation, sounds, mute, reduced-motion setting
- Returning a bucketed email to the Today list; Jump to Today; daily/weekly choice; late-arrivals indicator
- Bucket-count setting, auto-archive, screen-reader support, hover-only fallbacks
- Out entirely: notifications, mobile, compose redesign, AI replies, AI sorting, multiple inboxes
- Open (v1 or v2?): bucket reordering by drag handle — ask first

## 5. Hard constraints
- **Mock data only.** No real inboxes, no Gmail login, no backend, no APIs, no analytics. Nothing is stored or sent. The prototype resets when the page reloads.
- Mock emails are a **generic personal inbox** (personal notes, a marketing email, an interview request, etc.), not student-focused.
- "Send," "Reply," junk, and similar actions must never send anything anywhere.
- **Desktop only** (design for roughly 1280px wide and up).
- Must build to a **static site on Vercel**, usable through a plain link and embeddable in Qualtrics.

## 6. Terminology
Use exactly:
- **Bucketbox**: the product's customer-facing name (also the label on the nav switch)
- **Today list** (label reads "Today", "Yesterday", or a date like "Sept 12")
- **Home page** · **bucket** / **buckets** · **Add a Bucket** · **unsorted** (the big count; not "unread")
- **Move to** (dropdown) · **Move**, **Archive**, **Delete** (bulk buttons) · **Select all**
- **delete zone** · **emoji tag** / **tag** · **Remind me** / reminder · **Undo**, **Redo** · toast
- **Trash** (where deleted mail goes) · **All Mail** (where archived mail stays)

Avoid:
- "bin" (old wireframe word) → use **bucket**
- "folder" in the UI → use **bucket** (folder is only how we explain it)
- "Today's Inbox", "Clear All Emails", "New bucket" tile, "Filter" (wireframe-v2 conflicts)
- "star" for tags · "unread" for the count · "Important" as a bucket name (Gmail reserved) · "inbox zero"

## 7. Design principles (PRD §1, §9)
- **No action by default.** Emails wait in the Today list until the user acts.
- **Chunk by day.** Counts are per day, never cumulative.
- **Core actions stay visible.** Undo and redo are always shown (disabled when empty), never hidden in menus.
- **Tooltips and popovers over modals.** Inline editing, dropdowns, and drawers instead of pop-ups. Only modals the PRD names: delete-bucket confirmation and first-use destructive confirmation (the latter is still open, see BUILD-LOG).
- **Nothing alarming, nothing color-only.** Indicators (missed day, reminder, bucket color) pair color with a shape, icon, or text. No red alerts or urgency language.
- **Calm, low-pressure, rewarding.** Celebrate clearing a day, not reaching zero. Messages match the real inbox state.
- **Preserve Gmail familiarity.** Keep Gmail's nav, header, icons, row information, and compose drawer.
- **Remove superfluous features.** If it's not in the PRD, it's not in the build.

## 8. Accessibility baseline
- Target **WCAG 2.2 AA** for contrast, focus visibility, and text sizing. (PRD §9 applies full AA to v2; for v1 we aim for it where it's cheap.)
- Every drag action has a **non-drag path**: checkbox selection + Move / Move to / Archive / Delete.
- Everything clickable works with the **keyboard** (Tab, Enter, Space, Esc to close drawers and menus).
- **Never rely on color alone.** Icon-only buttons get tooltips and text labels for assistive tech.

## 9. Working agreements for Claude Code
1. **At the start of every session, read `CLAUDE.md` and `BUILD-LOG.md` before doing anything else.**
2. **Plan before coding** and wait for Amanda's approval.
3. **Build in small stages.** After each one, explain in plain language how to preview it.
4. **Commit to Git after each working stage** with a clear message.
5. **Ask, don't guess,** when the PRD is ambiguous or marked Open. Open questions that affect the build are in `BUILD-LOG.md` → Open questions.
6. **Don't add features, libraries, or redesigns** that aren't in the PRD or approved in the log.
7. **Explain each change in plain language**, with minimal jargon. Amanda is a designer who is new to coding.
8. **Update `BUILD-LOG.md`** at the end of every stage or session and whenever Amanda makes a decision. Mark decisions that change or add to the PRD with **SYNC TO PRD**.
9. When Amanda says **"wrap up"** or ends a session, update the log and summarize every SYNC TO PRD item.

## 10. Tech stack — *Approved 2026-10-28*
| Choice | Why |
|---|---|
| **React** | Breaks the screen into reusable pieces (row, bucket tile, drawer), which suits a UI with many repeated parts and changing state. |
| **Vite** | Simple, fast tool that previews the app locally and builds it into plain static files Vercel can host. |
| **JavaScript** (not TypeScript) | Fewer concepts to read; the project is small enough not to need TypeScript's extra checks. |
| **dnd-kit** (drag-and-drop library) | Handles drag and drop reliably, including the delete zone and bucket highlights, and has built-in keyboard support. |
| **Plain CSS** (CSS variables for colors) | Easy to restyle later without learning a framework; the PRD says styling will be refined after v1. |
| **Material Symbols icons** (Google) | The same icon family Gmail uses, so it keeps Gmail's look. |
| **In-memory state** (React `useReducer`) | Keeps all data in the browser tab only (nothing saved), and makes undo/redo straightforward. |
| **Mock data in a JSON/JS file** | One editable file for the fake emails, days, and starting bucket. |
| **Emoji picker: curated grid, built by hand** | No library. Amanda chooses 24–40 emojis, which is calmer than a full picker. |
| **Frimousse** (bucket emoji only) | Full searchable emoji picker for a bucket's emoji. Approved 2026-10-30. Its emoji data is self-hosted in `public/emojibase/`, so nothing loads from the internet. |

## 11. Deployment
Hosted on **Vercel**, connected to the **GitHub repo** github.com/amandasimm/bucketbox-prototype: every push to `main` redeploys https://bucketbox-prototype-3s9t.vercel.app automatically, so **push only approved stages**. The site must work from a plain link and inside a Qualtrics iframe. **The repo is public**, so `.gitignore` keeps these on Amanda's computer only, never committed or deployed: the `screenshot-gmail-*.png` files (real inbox data), the PRD, the mock data spreadsheet, and the sketches and wireframes. Read them locally as usual.

**Mock data:** `mock_inbox_data_v4.numbers` → `scripts/import-mock-data.py` → `src/data/mockEmails.js` (generated, don't hand-edit). Buckets and emojis live in `src/data/startingSetup.js`. **Preview:** `npm run dev` (or the "prototype" entry in `.claude/launch.json`), at http://localhost:5173.
