# BUILD-LOG.md — Neuroinclusive Inbox Prototype

The running memory of the build. Each Claude Code session starts fresh, so read this file (and CLAUDE.md) first.

**Rules for this log**
- Keep entries brief.
- Never delete past decisions. Mark them **SUPERSEDED (date)** and add the new one.
- Mark any decision that changes or adds to the PRD with **SYNC TO PRD**.
- When Amanda says "wrap up" or ends a session: update this log and summarize every SYNC TO PRD item.

---

## Current status
_Last updated: 2026-10-28_

- **Built:** Stage 0 (setup and data) and Stage 1 (the Gmail frame).
- **In progress:** Nothing.
- **Next:** Stage 2, the home page layout (Today list and bucket grid), look only.

**Approved build plan (2026-10-28)**
0. Setup and data ✅ · 1. Gmail frame ✅ · 2. Home page layout (look only) · 3. First deploy (GitHub + Vercel + Qualtrics test)
4. Selection, bulk actions, undo/redo, toasts · 5. Drag and drop + delete zone · 6. Bucket create/edit/delete
7. Email view (drawer, opened bucket, thread stack, compose) · 8. Emoji tags · 9. Day navigation
10. Plain Gmail view toggle · 11. Polish, accessibility check, final click-through
Each stage: preview → Amanda approves → commit → log update.

---

## Stage history
<!-- One entry per stage or session, newest at the bottom.
### YYYY-MM-DD — Stage N: short name
- Done:
- Approved by Amanda:
- Commit: `abc1234` "message"
-->

### 2026-10-28 — Session 0: Project setup
- Done: Read the full PRD and all 10 reference images. Created CLAUDE.md and BUILD-LOG.md. No prototype code written.
- Approved by Amanda: tech stack, plus answers to the 8 setup questions (see Decisions).
- Commit: none (Git was set up in Stage 0)

### 2026-10-28 — Stage 0: Project setup and mock data
- Done: Started Git (branch `main`) with a .gitignore that keeps research files private. Created the React + Vite project. Wrote `scripts/import-mock-data.py`, which turns the spreadsheet into `src/data/mockEmails.js` (27 emails, the 6-message thread attached to EML_1012). Added `src/data/startingSetup.js` (Priority bucket, emoji grid, default 3). The check page shows the right counts. `npm run build` works.
- Approved by Amanda: the 11-stage build plan; tooltips for inert controls; keeping research files private; a placeholder Git email.
- Commit: see `git log` (first commit, "Stage 0: project setup and mock data")

### 2026-10-28 — Data fix: Today's times moved to the morning
- Done: Today's emails now run from 6:52 AM to 12:42 PM (in `mock_inbox_data_v3.numbers`) and were re-imported.
- Approved by Amanda: yes (her request).
- Commit: "Move Today's mock emails to the morning (6:52 AM to 12:42 PM)"

### 2026-10-28 — Stage 1: Gmail frame (look only)
- Done: Gmail header (menu, logo, search bar, Support, Settings, apps, account), app rail (Mail, Chat, Meet), and left nav (Compose, Inbox with unread count, Starred, Snoozed, Sent, Drafts, More). There's a "Daily inbox" switch at the bottom of the nav, plus the white main panel. Every look-only control shows "Not part of this prototype" for 2.5 s when clicked, and icon-only buttons show their name on hover or keyboard focus. Fonts: Roboto and Material Symbols (Google Fonts). Checked at 1440×900: no errors, keyboard reachable, build works.
- Approved by Amanda: yes, 2026-10-29.
- Commit: "Stage 1: Gmail frame (look only)"

---

## Decisions
<!-- Format: - YYYY-MM-DD: Decision. Reason. [SYNC TO PRD] [SUPERSEDED (date) by ...] -->

- 2026-10-28: Build v1 only, using the PRD as the source of truth; PRD text wins over assets. Reason: Amanda's setup instructions.
- 2026-10-28: Hard constraints: mock data only, no backend or login, nothing stored or sent, desktop only, static site on Vercel via GitHub. Reason: privacy and concept-testing setup.
- 2026-10-28: Tech stack approved as proposed in CLAUDE.md §10 (React + Vite, JavaScript, dnd-kit, plain CSS, Material Symbols, in-memory state). Reason: simple, readable, and hosts free on Vercel.
- 2026-10-28: The "see more" emoji picker is a small curated grid (about 24–40 emojis Amanda chooses), not a full picker library. Reason: calmer, less overwhelming, no extra library. **SYNC TO PRD** (F3)
- 2026-10-28: "Today" is the real current date. Mock email dates and times are generated relative to it. Reason: feels live, and every participant still sees the same emails. **SYNC TO PRD** (§4 mock data)
- 2026-10-28: Rows are stacked (sender, then subject + preview, tags at the bottom right), in both the Today list and buckets. Resolves the PRD §1A confirmation. Reason: fits the narrow Today column and leaves room for tags. **SYNC TO PRD** (§1A, F1)
- 2026-10-28: Amanda will write the mock emails herself. Claude sets up an easy-to-edit mock data file with a few placeholder examples showing the format. Reason: Amanda controls the content participants see. **SUPERSEDED (2026-10-28)**: Amanda supplied the data as a spreadsheet instead (see below).
- 2026-10-28: No reminder emails in the mock data for v1. Reason: Amanda's choice; reminders are uncommon. Reminder behavior (F9) is therefore not shown or tested in v1. **SYNC TO PRD** (§4 v1 scope, F9)
- 2026-10-28: Starting bucket is "Priority" (still a placeholder) and starts with about 5 older emails. Reason: lets participants open an email from a bucket (Flow 6) without sorting first. **SYNC TO PRD** (F2)
- 2026-10-28: Build the "open prototype" toggle at the bottom of Gmail's left nav. It switches between the new view and a plain Gmail-style inbox. Resolves PRD §12 #18. **SYNC TO PRD** (§5, §12 #18)
- 2026-10-28: The plain Gmail view shows the same mock emails as single-line Gmail rows, look-only (no sorting). Reason: lets participants compare with what they know. **SYNC TO PRD** (§5)
- 2026-10-28: GitHub repo will be public. The Gmail screenshots (real inbox data) stay out of Git via .gitignore and are kept only on Amanda's computer. Reason: privacy.
- 2026-10-28: Curated emoji grid (32): 👍 ❤️ 🙏 😊 🎉 ✨ 💯 🙌 🤔 🔥 👀 ‼️ 📝 ✅ ⏰ ⭐ ❓ 📅 💰 📦 💼 🏠 📚 🛍️ 🏥 ✈️ 🍽️ 🎬 🐾 💻 🎟️ 🔐. Reason: Amanda's choice. **SYNC TO PRD** (F3)
- 2026-10-28: The first-time default three emojis are ⭐ 👀 ✅ (replaces the PRD example 👀 ‼️ 📝). Reason: Amanda's choice. **SYNC TO PRD** (F3)
- 2026-10-28: Mock data source is `mock_inbox_data_v2.numbers` (sheets "Emails" and "Thread"). Claude converts it into the app's data file. If Amanda edits the spreadsheet, she asks Claude to re-import it. Reason: Amanda wrote the content. **SUPERSEDED (2026-10-28)** by v3 (see below).
- 2026-10-28: Emails are listed newest at the top, in the Today list and in buckets (matches Gmail and the spreadsheet). Reason: familiarity. **SYNC TO PRD** (F1, F2: "chronological" made specific)
- 2026-10-28: Conversations: the 6-message "Cabin weekend" thread counts as 1 email in the unsorted count. When opened, it shows a Gmail-style stack (earlier messages collapsed to one line, newest open at the bottom). Reason: matches Gmail's Conversation view. **SYNC TO PRD** (F1 open: counting unit; §12 #11)
- 2026-10-28: All Gmail categories (Primary, Promotions, Social, Updates) feed the Today list, as the mock data does. Reason: implied by Amanda's spreadsheet; confirm. **SYNC TO PRD** (F1 open: inbox categories; §12 #11)
- 2026-10-28: The 11-stage build plan is approved (see Current status). Reason: small stages Amanda can preview one at a time.
- 2026-10-28: "Visible but inert" controls (search, Send, Remind me, Mark as junk, Gmail nav links, settings, Chat, Meet) show a gentle tooltip such as "Not part of this prototype" when clicked. Reason: calm, and participants don't think it's broken. **SYNC TO PRD** (§4 interaction inventory)
- 2026-10-28: Public repo contents: the PRD, the spreadsheet, sketches, wireframes and screenshots stay out of Git (local only). Reason: thesis research material. Commits use a placeholder email until Stage 3, when it switches to Amanda's GitHub private "noreply" address before the first push. Reason: keeps her NYU email off a public repo.
- 2026-10-28: Any past day with no unsorted emails shows the past-tense celebration empty state, even a day where no mail arrived (e.g. 2 days ago). Reason: Amanda's choice; keeps the tone rewarding. **SYNC TO PRD** (F6 empty states)
- 2026-10-28: Assume concept testing happens after 1 PM. Today's emails are spread across the morning, 6:52 AM to 12:42 PM, in the same order as before. They're saved in a new copy, `mock_inbox_data_v3.numbers`, which is now the mock data source (v2 is kept unchanged). Reason: "today" is the real date, so no email should look like it arrived in the future. **SYNC TO PRD** (§4 mock data; concept-testing scheduling)

---

## Open questions
<!-- Mark each one resolved (with date) and move the answer to Decisions. -->

**Before Stage 1: all resolved 2026-10-28 (see Decisions)**
1. ~~Tech stack~~: approved.
2. ~~Emoji picker~~: curated grid.
3. ~~Mock data scope~~: Amanda writes the emails; no reminders.
4. ~~Starting bucket~~: "Priority", with about 5 emails.
5. ~~Mock "today"~~: real current date.
6. ~~Row layout~~: stacked.
7. ~~"Open prototype" button~~: build it, with a plain Gmail-style view.
8. ~~Repo~~: public, screenshots kept out of Git.

**New, from these answers**
- ~~Amanda to write the mock emails and emoji list~~: done 2026-10-28 (see Decisions).
- Final name for the starting bucket ("Priority" is still a placeholder, PRD §12 #1).
- **Switch wording:** the "open prototype" switch at the bottom of the nav is labelled "Daily inbox" (a placeholder). What should it say? (PRD §5)
- **Inbox count in the nav:** Gmail's Inbox shows 12 (unread emails still in the inbox) and the Mail icon has a badge. The PRD principle is "never show a cumulative count." Keep Gmail's count for familiarity, or hide it? (It currently matches Today's 12.)
- **Compose button:** shows "Not part of this prototype" until Stage 7 makes the compose drawer real.
- ~~Future times on Today~~: resolved 2026-10-28. Testing is after 1 PM, and Today's emails end at 12:42 PM (see Decisions).

**Mock data at a glance (from `mock_inbox_data_v3.numbers`, 2026-10-28)**
- Today: 12 unsorted (all unread), 6:52 AM to 12:42 PM, including the Cabin weekend thread and the interview request.
- Yesterday: 8 unsorted (all read). 2 days ago: none (shows the celebration). 3 days ago: 2 unsorted.
- Priority bucket: 5 emails from 3–6 days ago (2 unread). Days 4–6 have nothing left unsorted.
- Attachments are shown as labels only ("3 photos", "Lease renewal.pdf"); there are no real files.
- Times are written as 24-hour in the sheet and shown Gmail-style (e.g. 4:30 PM).

**During the build (can wait until the feature)**

9. Bucket name length limit: 50 or 30 characters? (PRD §12 #2)
10. 12 preset bucket colors: which palette? Is the free color picker in v1? (PRD §12 #3)
11. Undo/redo position on screen. (PRD §12 #5, F8)
12. First-use confirmation modal for Archive/Delete: keep it, or use a tooltip/inline message? (PRD §12 #6, F7)
13. Toast wording: "Archived 3" or "Moved 3 to Archive"? Empty-state wording, including zero buckets. (PRD §12 #7)
14. Bucket reordering by drag handle: v1 or v2? (PRD §12 #4)
15. Bucket-to-bucket drag: in the expanded bucket view other buckets are hidden. Is dragging between buckets only from the home-page tiles, or is Move to the path inside a bucket?
16. The bulk **Move** button opens a bucket dropdown on the home page, but F4 says the "Move to" dropdown is "not visible on the home page." Are these the same control, and is the bulk one allowed?
17. Which interactions are real, scripted, or visible-but-inert? (PRD §4 interaction inventory.) For example: search, compose/Reply, Remind me, Mark as junk, Gmail nav links (Starred, Trash, All Mail).
18. What does the "missed email" indicator on the back arrow mean? (PRD §12 #9) Build it in v1 or leave it out?
19. Delete zone in the expanded bucket view: where does it appear there?
20. Tag button: hover-only (PRD) is not keyboard-reachable. Can it also show on keyboard focus?

---

## Known issues
<!-- Bugs or compromises to fix later. Format: - YYYY-MM-DD: Issue. (Plan) -->

- 2026-10-28: Commits use the placeholder email `placeholder@example.invalid`. (Stage 3: reset the author on all commits to Amanda's GitHub noreply address before the first push.)
- 2026-10-28: The Gmail logo is an approximation (a red mail icon plus "Gmail"), not Google's official logo file. (Fine for the prototype; revisit if it looks off.)
- 2026-10-28: Left out of the Gmail frame for simplicity: the "Labels" section, Categories, the right-hand side panel (Calendar, Keep, Tasks) and the status/calendar chip in the header. (Add back if testing shows they're missed.)
- 2026-10-28: If someone tests before 12:42 PM, a few Today emails will look like they arrived later that day. (Accepted, since testing is planned after 1 PM.)
- 2026-10-28: Re-importing the spreadsheet needs the `numbers-parser` Python package, which isn't part of the project. (Claude installs it in a temporary folder when needed.)
