# BUILD-LOG.md — Neuroinclusive Inbox Prototype

The running memory of the build. Each Claude Code session starts fresh, so read this file (and CLAUDE.md) first.

**Rules for this log**
- Keep entries brief.
- Never delete past decisions. Mark them **SUPERSEDED (date)** and add the new one.
- Mark any decision that changes or adds to the PRD with **SYNC TO PRD**.
- When Amanda says "wrap up" or ends a session: update this log and summarize every SYNC TO PRD item.

---

## Current status
_Last updated: 2026-10-30_

- **Built:** Stages 0–7 and 9 (Stage 8, emoji tags, skipped for now). **Live:** https://bucketbox-prototype-3s9t.vercel.app (updates automatically on every push to `main`). **Code:** https://github.com/amandasimm/bucketbox-prototype
- **Next:** Stage 10, the plain Gmail view.

**Approved build plan (2026-10-28)**
0. Setup and data ✅ · 1. Gmail frame ✅ · 2. Home page layout ✅ · 3. First deploy ✅ (GitHub + Vercel + Qualtrics)
4. Selection, bulk actions, undo/redo, toasts ✅ · 5. Drag and drop + delete zone ✅ · 6. Bucket create/edit/delete ✅
7. Email view (drawer, opened bucket, thread stack, compose) ✅ · 8. ~~Emoji tags~~ (skipped for now) · 9. Day navigation ✅
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

### 2026-10-29 — Stage 2: Home page layout (look only)
- Done: Today list ("Today" label, big "12 unsorted" count, Select all, 12 stacked rows newest first). Each row has a drag handle, checkbox, sender (thread size shown, e.g. "6"), time, subject, preview and attachment chip. Unread rows are bold; read rows have Gmail's light tint. Move / Archive / Delete sit at the bottom, switched off. The bucket grid has the Priority tile (color dot, name, count, scrolling peek of 5 emails with dates; handles show on hover only) and "Add a Bucket" below it. Undo and redo sit in a bar across the top of the panel, switched off, with "Nothing to undo" tooltips. Nothing is clickable yet. Emails now live in app memory with real dates. Checked at 1440×900: no errors, no sideways scrolling, build works.
- Revised after Amanda's review (2026-10-29): less space before the handle and checkbox in bucket rows; more space between lines of text (21px line height); bucket tile stroke is 2px in the bucket's own color; "Buckets" title removed; the unsorted count is the same size as "Today" (22px); undo/redo moved out of the top bar into the panel's top-right corner, level with "Today".
- Revised again (2026-10-29): undo/redo moved to the panel's bottom-right corner, level with the bulk buttons. Select all checkbox lines up with the row checkboxes; the bucket color dot lines up with the bucket row checkboxes. Bucket headers have a 15% tint of the bucket color. New 4-level text hierarchy in email rows; previews show 2 lines.
- Revised again (2026-10-29): read rows lost their background fill, so read/unread styling is identical in the Today list and buckets.
- Revised (2026-10-29): unread rows have a blue dot after the sender (after the thread count if there is one) with a bold sender and subject; read rows have no dot and a regular-weight, slightly dimmer sender and subject.
- Approved by Amanda: yes, 2026-10-29.
- Commit: "Stage 2: Home page layout (look only)"

### 2026-10-29 — Stage 3: First deploy
- Done: Rewrote all commits to Amanda's GitHub private email (no NYU or placeholder email anywhere in the history). Confirmed only code, CLAUDE.md and BUILD-LOG.md are in Git. Pushed to github.com/amandasimm/bucketbox-prototype (public). Amanda connected Vercel (Vite settings auto-detected). Checked the live site at 1440×900: it matches the local preview. No headers block framing, and it loads inside an iframe. The PRD, screenshots and spreadsheet return 404 on the live site.
- Approved by Amanda: GitHub email, repo, Vercel setup.
- Commits: "Stage 3: first deploy notes" (accidentally held only the Known-issues fix, because a log edit failed) and "Stage 3: record deploy details in the log"

### 2026-10-29 — Stage 4: Selecting, bulk actions, undo/redo, toasts
- Done:
  - Row checkboxes and Select all (shows "3 selected", with a part-checked state when some are selected). Selected rows turn light blue.
  - Move / Archive / Delete switch on when something is selected. Move opens a small "Move to" bucket list above the button (Escape or a click outside closes it).
  - The first Archive and first Delete show an inline note above the buttons (Cancel / Archive N), not a pop-up; after that they act immediately.
  - Counts update (unsorted count and bucket count). Toasts appear just left of undo/redo for 5 s and pause on hover.
  - Undo/redo cover the last action only, with hover text naming it ("Undo: archived 2").
  - Cleared Today shows "Way to go! Your daily inbox is cleared right now."
  - Bucket tile rows no longer have checkboxes.
- Fixed along the way: hidden screen-reader text was stretching the panel (the panel jumped when a button got focus); undo/redo tooltips now open upward.
- Checked: every path tested in the preview (archive, undo, redo, delete, move, Select all to empty, Escape on the menu, focus); clean console in a fresh tab; build works.
- Approved by Amanda: 2026-10-29
- Commit: "Stage 4: selecting, bulk actions, undo/redo, toasts"

### 2026-10-30 — Stage 5: Drag and drop, delete zone
- Done:
  - Added the approved drag-and-drop library, dnd-kit (`@dnd-kit/core`).
  - Drag handles work: always visible on Today rows, on hover (or keyboard focus) on bucket rows. Grabbing a checked Today email brings all the checked ones along.
  - A blue Gmail-style chip follows the pointer: "Move 1 conversation" / "Move 2 conversations".
  - Bucket tiles show Amanda's drop-target design while an email is over them. An email can't be dropped back into its own bucket, or onto the Today list.
  - The delete zone ("Drop here to delete", round trash icon, calm gray) replaces Move / Archive / Delete only while dragging.
  - First drop on the zone: sticky toast "1 email deleted. Archive instead?". "Archive instead" archives those emails and switches the zone to "Drop here to archive" until reload.
  - Every drop has a toast and works with undo/redo. After "Archive instead", one undo brings the emails back to the Today list.
  - Keyboard: Space or Enter on a handle picks the email up, arrow keys jump between buckets and the delete zone, Space drops, Escape cancels. Screen readers hear plain-language updates ("Over Priority bucket.").
- Checked: keyboard pickup, moving, dropping and cancelling; mouse drag of 2 checked emails into Priority (12 → 10, Priority 5 → 7); bucket email to the zone; its own bucket ignored; Archive instead plus undo; sticky toast still there after 6 s; clean console in a fresh tab; build works.
- Not checked: bucket-to-bucket with real buckets (there's only one bucket until Stage 6). It uses the same drop code, so I'll check it in Stage 6.
- Revised after Amanda's review (2026-10-30):
  - Drop target refined: 18px name (was 36px), 2px stroke with 8/6 dashes (was 4px, 22/22), smaller "+" circle (40px). The "+" and the name sit on solid tinted backgrounds so they stay readable over the emails.
  - Drop targets now appear on every bucket the email can go to as soon as a drag starts (light, see-through), and the one under the pointer turns active (stronger tint, solid outline, filled "+").
  - The whole left strip of a row (the handle column, top to bottom) now picks the email up, so tall rows like Aunt Wendy's can be grabbed anywhere below the icon.
  - First-use zone toast now reads "1 email deleted." with the "Archive instead" button.
  - Fixed: the drop target sat inside the tile's border, so it was 2px smaller with tighter corners, and email text could peek out at the edge. It now sits on a wrapper around the tile and matches it exactly (same size, 12px corners).
- Testing note: the browser pane kept reporting the page as hidden, which cancels drags and pauses animation. I worked around this only inside the test scripts; the prototype itself is unchanged.
- Approved by Amanda: 2026-10-30
- Commit: "Stage 5: drag and drop, delete zone"

### 2026-10-30 — Stage 6: Create, edit and delete buckets
- Done:
  - New 12-color palette (6 bold, 6 soft). Priority moved from #1a73e8 to #0b57d0. Tiles get their look from `utils/bucketColors.js`: soft colors fill the whole header and get a slightly deeper outline; text is always dark; the drop-target "+" is white or dark, whichever reads better on the color.
  - Add a Bucket opens a form tile at the end of the grid (no pop-up): name (30-character limit with a counter), 12 color swatches (a ✓ marks the pick), Cancel and Save. Save stays off until the name is valid. Enter saves, Escape cancels.
  - Name errors, with an icon and a fix: "You already have a bucket called Bills. Try a different name." and "Gmail already uses Important. Try a different name." (Gmail's reserved names: Inbox, Important, Sent, Drafts, Spam, Trash, Starred, Snoozed, All Mail.)
  - 3-dot menu on each tile: Edit bucket and Delete bucket. Edit turns the tile into the same form with Delete and Save; Escape or a click outside leaves without saving.
  - Deleting an empty bucket happens straight away, with a toast. A bucket with emails opens a confirmation: Archive them (preselected), Move them to Trash, or Move them to another bucket (with a list). It says "This can't be undone." Escape or Cancel closes it.
  - Deleting a bucket resets Undo to "Nothing to undo", so undo can't send emails back into a bucket that no longer exists.
  - With no buckets, the bucket area shows "Make your first bucket to start sorting." (placeholder) above Add a Bucket.
- Fixed along the way: the form tile lost its outline; Add a Bucket stayed visible while the form was open; the 3-dot button showed through the drop target.
- Revised after Amanda's review (2026-10-30):
  - Undo/redo no longer overlap anything: the bucket area's scrolling stops above their strip.
  - The name field is a Google-style outlined field: "Bucket name" sits inside the empty box and moves up onto the outline (small, blue) when focused or filled; red when there's an error.
  - The form's outline previews the picked color.
  - Every color follows one rule again: the outline is the color itself and the header is the color at 20%. The special handling for soft colors (deeper outline, full-color header) is gone.
  - The 3-dot button is smaller (28px) and centered on the header line, next to the count.
  - Opening the form now scrolls the whole form into view, not just the name field.
  - Colors reordered so each soft color sits under its bold partner (Blue/Sky, Dark pink/Light pink, Orange/Butter, Lime/Mint, Purple/Lavender, Teal/Slate). The "Color" heading is hidden (screen readers still hear it).
  - New: optional bucket emoji. A round gray button left of the name field (Material "add_reaction" icon, same hover fill as the 3-dot button) opens a searchable emoji picker (Frimousse). The picked emoji replaces the color dot in the tile header and in the Move list. "Remove emoji" brings the dot back. Escape closes only the picker.
  - Bucket header left padding reduced from 24px to 14px; the dot or emoji no longer lines up with the email text below.
  - Added the Frimousse library (MIT). Its emoji data (Emojibase 18, MIT, about 790 KB) is copied into `public/emojibase/`, so the picker never loads anything from the internet. Frimousse keeps a copy of that public emoji list in the browser's storage to open faster; nothing a participant types or does is stored.
- Checked: name validation (empty, reserved, duplicate, 30-character count); add with a color; bucket-to-bucket drag (Priority 5 → 4, Bills 0 → 1, only the other bucket lights up); edit (rename, recolor, click-outside cancels); delete to another bucket, to archive, Escape-cancel, empty-bucket delete; zero-bucket state and "No buckets yet" in Move; soft-color drop target; focus returns to Add a Bucket; clean console; build works.
- Approved by Amanda: 2026-10-30
- Commit: "Stage 6: create, edit and delete buckets"

### 2026-10-30 — Stage 7a: Reading emails
- Done:
  - Clicking a row's text opens the email (only the handle drags). Rows show which email is open.
  - Today drawer: slides over the buckets from the Today list, stopping 72px short of the right edge. Closes with its X, Escape, or a click outside it (the Today list, undo/redo, toasts and menus don't count as outside). Focus moves to the email's subject when it opens and back to the row when it closes. It disappears when no Today emails are left. A drag closes it, since it covers the buckets.
  - Email pane (shared): Gmail's toolbar in Gmail's order. Real: Archive, Mark as junk, Delete, Mark as unread, Move to (a list of the other buckets). Inert: Remind me, Add to tasks, Labels, More. Subject, Gmail-style thread (older messages one line each, newest open; click to expand), attachment chips, Reply button (opens compose in 7b).
  - After Archive, junk, Delete or Move, the pane moves to the next email (or the one before, if it was the last) and marks it read. Toasts: "Archived 1", "Marked as junk", "Deleted 1", "Moved 1 to Priority", "Marked as unread". All undoable.
  - Mark as unread: in the Today drawer it closes the email; in a bucket the email stays in the pane, unread.
  - Opened bucket: the bucket name on a tile (or one of its tile rows) opens it. Header: X, dot or emoji, name, count. Left: list with checkboxes, Select all, Move / Archive / Delete. Right: the pane. With nothing chosen, the top email shows but stays unread until clicked into (PRD F5). X returns to the home page. Deleting the open bucket returns home.
  - Reading an email or sending a reply isn't an undo step; it's also applied to the saved undo snapshots, so a later undo doesn't un-read it.
- Revised after Amanda's review of 7a (2026-10-30, from her mock):
  - The Today list is a rounded card like a bucket, in a calm neutral: 2px gray-blue outline (#c7d0dd), 12px corners, header in the search bar's gray-blue (#e9eef6).
  - The drawer runs the full height of the Today card and tucks in behind it, with a soft shadow along its left edge, as if pulled out from under the list. A 120px strip of the buckets stays visible (room for undo/redo).
  - Below 1280px wide the drawer covers the buckets completely; undo/redo float on top of its lower right corner.
  - Email layout: smaller avatar (32px), less left padding, subject starts where the avatar does, message text lines up with the sender name.
  - A divider under the message, then Gmail's buttons: Reply (real), Forward, reaction 😊 and Share in chat with its "New" badge (all three inert).
- Revised again (2026-10-30):
  - No white panel behind the Bucketbox page: the Today card and bucket tiles sit straight on Gmail's page color. The Today card's top lines up with Compose and its left edge with the search bar; the bucket tiles line up with the Today card's top.
  - "Add a Bucket" now sits in the grid where the next bucket would go, centered in that space.
  - The opened bucket follows suit: its list is a card outlined in the bucket's color, and the open email is a white card.
  - The opened bucket is one card: a bucket-colored header across the full width (X, dot or emoji, name, count), then the list and the open email side by side with a divider, outlined in the bucket's color. Undo/redo float over the email's lower right corner. (Replaces the separate list and email cards.)
  - The whole colored header of a bucket tile (dot or emoji, name, count) opens the bucket; the 3-dot menu still only opens its menu.
  - Sizes checked against Amanda's Gmail inspect notes: Reply/Forward/Share in chat are 36px tall, 112px minimum width, 14px/500 text, 16px/12px padding; the reaction button is 36px round; Add a Bucket is 36px tall; bucket names on tiles are 14px/500 (Gmail's emphasized label). Headings stay 22px/400. Roboto stays the font: Google Sans isn't freely available, so participants without it would see a different font.
  - Round 4 (2026-10-30):
    - Gmail's nav collapses to icons while Bucketbox is on (names show on hover and to screen readers); Compose keeps its size and place. The nav column goes from 256px to 160px, and the search bar and cards shift left with it. The plain Gmail view keeps the full nav.
    - The Bucketbox switch shows Amanda's placeholder bucket logo instead of a text label (Fluent Emoji "bucket" icon, Microsoft, MIT license; the source file sits in the project folder).
    - Opened bucket: name, dot/emoji and count on the left like the tile; the 3-dot menu (Edit bucket / Delete bucket) and the X on the right. Edit drops the bucket form down from the header; Delete works as on the home page and closes the view.
    - The opened bucket now floats over the home page, 16px inside the Today card's edges on every side, with a soft shadow, so the Today card and other buckets just show around it. The home page underneath can't be clicked or tabbed into, and its tiles and delete zone don't act as drop targets.
    - Reply / Forward / reaction / Share in chat line up with the subject and avatar.
    - Toolbar icon buttons are fixed 36px circles, so they no longer squeeze into ovals on narrow screens.
  - Round 5 (2026-10-30):
    - Bucketbox switch: the bucket logo is centered with the label and switch (it was sitting low), sits closer to the switch when the nav is collapsed, and turns Gmail blue (#0b57d0) when Bucketbox is on.
    - The collapsed Inbox pill now runs to the end of the Compose button (144px).
    - Layout responds to the number of buckets. Tiles are a fixed 308px wide. With 1–2 buckets they stack in one column and the Today card takes the rest of the width; with 3 or more there are two columns. While an email is open, Today goes back to 420px so the drawer has room, and widens again when it closes. Below 1280px there's always one bucket column.
    - Mock data v4: four older emails are now unread (Sam Torres and Alex Rivera from yesterday, Xfinity from yesterday, GitHub from 3 days ago). The plain Gmail Inbox count now counts every unread email not archived or deleted, including bucketed ones: 19 at the start.
  - Round 6 (2026-10-30):
    - Undo/redo float on top of the bucket area instead of leaving an empty strip along its bottom; the area scrolls the full height, with room at the end so the last tile can scroll clear of them.
    - Today and the bucket column now share the width evenly, and tiles are at least 340px wide (was a fixed 308px), so Today is narrower and buckets wider. With 3+ buckets (two columns) Today takes what's left (452px at 1440). At 1200px: Today 478px, tiles 430px.
    - The bucket logo sits 2px higher, to look centered with the label and switch. Hovering the collapsed switch shows "Bucketbox", like the other nav items.
  - Round 7 (2026-10-30):
    - All gaps are 16px: Compose to the Today card, Today to the buckets, and between bucket tiles.
    - Today gets 3 parts of the width and the bucket column 2 (was an even split); tiles stay at least 340px. At 1440 with 1–2 buckets: Today 718px, tiles 446px.
    - A newly added bucket scrolls into view, so it never appears cut off. In a single column, Add a Bucket sits right below the last bucket instead of centered in a tile-sized space.
    - ~~Two bucket columns (3+ buckets) hold down to 1292px wide; below that, one column.~~ SUPERSEDED same day: two bucket columns now never drop to one. Tiles keep 340px and Today 320px while there's room; on narrower screens Today and the tiles shrink together until all three columns are equal (303px each at 1200, 244px at 1024, the prototype's narrowest supported width). The bulk buttons wrap to a second line when the Today card is that narrow. **SUPERSEDED again same day** (Amanda: no wrapping, Today always wider than tiles):
    - Today is never narrower than 340px, so Move / Archive / Delete always fit on one line, and is always wider than a bucket tile.
    - Two bucket columns: each tile gets 1/3.3 of the room (up to 340px), so Today is about 30% wider than a tile. Widths with 3+ buckets: 1440 → Today 468 / tiles 340; 1366 → 423 / 325; 1280 → 389 / 299.
    - When tiles would drop below 290px (below about 1250px wide), buckets go to one column: 1200 → Today 574 / tile 350; 1024 → 468 / 280. No sideways scrolling at any of these widths.
  - Disabled undo/redo use #80868b (3.5:1 on the page color, up from 3.0:1). Active undo/redo stay #444746 (8.8:1).
- Checked: drawer open, thread expand, archive/junk/move/mark unread each moving on, undo, inert tooltip, Escape/outside/X close with focus back on the row, switching emails, bucket view default pane unread then read on click, bulk archive in a bucket, delete moving to next, back home, opening from a tile row; clean console; build works.

### 2026-10-30 — Stage 7b: Dragging inside a bucket, compose
- Done:
  - Dragging an email inside an opened bucket shows the other buckets as slim pill-shaped drop targets along its header ("Move to" + dot or emoji + name), in the same resting (dashed) and active (solid, stronger tint) styles as the tiles. The delete zone replaces the list's buttons, as on Today. The home page behind stays out of the way (its tiles and delete zone aren't drop targets).
  - Gmail's compose drawer, bottom right: opened by Reply (To and "Re: subject" filled in, cursor in the message) or by the nav's Compose button (cursor in To). Google-style To and Subject fields, a message area, Send, and Discard. Minimize turns it into a bar at the bottom that keeps the draft; the X closes it.
  - Send with no recipient shows "Add at least one recipient." Otherwise it closes with a "Message sent" toast; a reply also appears at the end of that email's thread as "me" with the current time. Nothing leaves the browser.
  - The Compose button in the nav now works (it was inert).
- Revised after Amanda's review (2026-10-30):
  - Bucket pills in the header: thinner 1.5px outline with shorter 5/4 dashes (fitted evenly).
  - Reply now works like Gmail's in-place reply: clicking Reply turns the buttons under the email into a reply box right there (in the Today drawer and the opened bucket), with the recipient ("Taylor Brooks (example.com)"), a message area, Gmail's formatting bar, and Send with its options arrow, attachment tools and trash. Only typing, Send and the trash (discard) work; the rest is inert. Send adds the reply to the thread as "me" with a "Message sent" toast; opening another email clears an unsent reply. Escape while typing doesn't close the drawer.
  - The compose drawer is now for new messages only (the nav's Compose button).
  - Fixed: the thread and reply area shared a React key, which logged a warning whenever an email opened.
  - The reply box's formatting bar and footer scroll sideways when narrow, like Gmail, instead of wrapping.
  - Your avatar (in the reply box and on your own messages in a thread) is the header's account icon at a lighter stroke (weight 300) in the gray avatar circle, instead of an "M". The icon font now loads weights 300–400 for this.
  - The message area has no blue focus outline (Gmail has none); the reply card's shadow deepens while you're typing in it.
  - Undo and redo moved into Gmail's left nav (they kept covering the new-bucket form's Save). **Final layout (same day):** the Bucketbox switch sits just below the Gmail items (8px gap; first tried 16px). While Bucketbox is on, its row is the active nav item, and Inbox looks like the other items (outlined icon, no pill); in the plain Gmail view Inbox is active again. Nav rows match Gmail: 32px pills rounded at both ends, 8px in from the left (lined up with Compose), 16px padding; the active row's icon is Gmail's #202124 (the bucket icon is no longer blue); the bucket icon is 20×20, the same as the other nav icons, and switches to a filled version while Bucketbox is on, like Gmail's active icons (Amanda's own filled drawing, "filled bucket icon.svg"; Claude's first attempt was replaced), and undo/redo sit at the bottom of the nav, 16px from the bottom like the Today card, 16px apart, centered under Compose. Undo's circle lines up with the nav icons above it; redo sits where it was when the pair was centered under Compose (Amanda's final call, same day). Toasts appear just above them, with their left edge lined up with the nav (the Compose button), not the window. They're hidden in the plain Gmail view.
  - The main area has no outer margin any more, so the bucket area scrolls right to the window's edges; spacing stays inside (16px). The Today card and drawer sit 16px from the bottom; an opened bucket sits 16px inside the cards around it.
- Checked: drag inside a bucket to another bucket's pill ("Moved 1 to Bills", count 5 → 3 after two moves) and to the delete zone (first-use toast); Today's zone and tiles stay inactive behind the bucket; reply from a bucket and from the Today drawer, minimize and reopen keeping the draft, send adding to the thread, new message with no recipient, discard; clean console in a fresh tab; build works.
- Approved by Amanda: 2026-10-30 (7a and 7b together)
- Commit: "Stage 7: email view, opened bucket, reply and compose"

### 2026-10-30 — Stage 9: Day navigation
- Done:
  - The Today card header reads "‹ Today ›" with a calendar icon, the unsorted count on the right. Labels: "Today", "Yesterday", or a date ("Oct 27"). The next arrow only appears on past days.
  - The back arrow shows a small blue dot when the day before still has unsorted emails; its label says so ("Previous day. Yesterday has unsorted emails") for hover and screen readers.
  - The calendar is a small month popover: today outlined, the viewed day filled, future days and next month switched off, a blue dot under days with unsorted emails, earlier months reachable. Escape or a click outside closes it; it opens with focus on the viewed day.
  - Past days work like Today: their own unsorted list and count, Select all, Move / Archive / Delete, drag and drop, the email drawer. A day with nothing left shows "You cleared this day. Nice work." (placeholder).
  - Switching days closes any open email and clears checkboxes. Undo still works across days.
- Revised after Amanda's review (2026-10-30):
  - Past days use the full month name ("October 27"), also in the back arrow's label.
  - The header is "‹ Today ›" on the left and the calendar icon in the right corner; the calendar opens leftward from it. The unsorted count moved down to the Select all row, on the right, with its number at 18px (was 22px). On an empty day that row shows just the count.
  - **Final (same day):** when the day before has unsorted emails, the back arrow gets a soft blue circle (Gmail's selected blue, #d3e3fd, at 60% so the header shows through; full strength on hover), turns blue (#0b57d0, 4.9:1 on the circle, above the 3:1 icons need), and has a small blue dot on its bottom right corner. Earlier version: the back arrow's dot sits directly under the arrow, centered (tried: top right, bottom right; Amanda also saw sketches of a dot beside the arrow, a tinted circle, a ring, a "‹ Yesterday" chip and an underline). The calendar's dots stay under the date numbers (above was tried and reverted).
  - The calendar's "Choose a day" hover label opens leftward so the card's edge no longer cuts it off.
  - Dates from another year include the year: "December 31, 2025".
  - The opened bucket's Select all uses the same row style.
- Checked: Today (12, dot), Yesterday (8, no dot), 2 days ago (0, cleared message, dot), 3 days ago (2); next arrow; calendar dots on the 27th, 29th and 30th, picking a day, focus, Escape; archiving on yesterday moving to the next email; switching days closes the drawer; undo across days; clean console in a fresh tab; build works.
- Approved by Amanda: 2026-10-30
- Commit: "Stage 9: day navigation"

---

## Decisions
- 2026-10-30: Day navigation (Stage 9): "‹ Today ›" on the left of the Today card header and the calendar icon in its right corner; the unsorted count sits on the Select all row (updated same day); the next arrow is hidden on Today (PRD "when applicable"). The back arrow shows a small blue dot (the unread dot's color, #0b57d0) when the previous day still has unsorted emails, with a text label for hover and screen readers, so it isn't color-only. Reason: Amanda's choices. **SYNC TO PRD** (F6, §12 #9)
- 2026-10-30: Emoji tags (Stage 8) are skipped for now; the build moves on to day navigation. Open questions 20 and 21 wait until tags come back. Bucket emoji (Stage 6) is separate and stays. Reason: Amanda's choice; she may drop tags. **SYNC TO PRD** (F3, §4 v1 scope)
- 2026-10-30: The Today list is a rounded card in a calm neutral gray-blue (outline #c7d0dd, header #e9eef6, the search bar's color), to give Bucketbox more personality and set it apart from Gmail. The email drawer runs full height and tucks in behind it; below 1280px wide it covers the buckets completely, with undo/redo floating on top. Reason: Amanda's mock. **SYNC TO PRD** (§5 home page, Today email view; F1)
- 2026-10-30: Home layout responds to the bucket count (**updated same day**: tiles are at least 340px and share the width evenly with Today, rather than a fixed 308px); 1–2 buckets stack in one column and Today expands; 3+ buckets use two columns; Today returns to 420px while an email is open. Collapsing a cleared Today card is not built (Amanda undecided). Reason: Amanda's review (less wasted space). **SYNC TO PRD** (§5 home page)
- 2026-10-30: Gmail's Inbox count (plain view) counts every unread email not archived or deleted, including bucketed ones, since buckets act like Gmail labels. Mock data moved to v4, with four older emails unread, so the count looks more like a real inbox. Reason: Amanda's review. **SYNC TO PRD** (§5 Gmail integration; mock data)
- 2026-10-30: While Bucketbox is on, Gmail's left nav collapses to icons (Compose unchanged) and the switch shows a bucket logo instead of its label. Reason: more room for Bucketbox (Amanda's mock). **SYNC TO PRD** (§5 Gmail integration, "open prototype" button)
- 2026-10-30: The opened bucket floats over the home page, inset 16px with a soft shadow, so the Today card and other buckets stay just visible behind it (mental model). Its header has the 3-dot menu (edit/delete) and the X on the right. Reason: Amanda's review. **SYNC TO PRD** (§5 bucket view, F2)
- 2026-10-30: The opened bucket is a single card with a full-width bucket-colored header, so the list and the open email read as one bucket. The whole tile header (except the 3-dot menu) opens a bucket. Buttons and text follow Gmail's measured sizes (36px buttons, 14px/500 labels, 22px/400 headings). Reason: Amanda's review and Gmail inspect notes. **SYNC TO PRD** (§5 bucket view, F2, F5)
- 2026-10-30: No white panel behind Bucketbox; the Today card, bucket tiles and the opened bucket's list and email are their own cards on Gmail's page color, lined up with Compose (top) and the search bar (left). Add a Bucket sits in the next bucket's spot. Reason: Amanda's review. **SYNC TO PRD** (§5 home page, bucket view; F2 Add a Bucket)
- 2026-10-30: Under an open email: a divider, then Gmail's Reply (real), Forward, reaction and Share in chat (inert). Gmail's 😊 reaction button stays inert for now; Stage 8 decides whether it opens emoji tags. Reason: Amanda's choice. **SYNC TO PRD** (F5, §4 interaction inventory)
- 2026-10-30: Email view interaction inventory (PRD §4). **Real:** Archive, Delete, Move to, Mark as unread, Mark as junk (removes the email like Delete, with a "Marked as junk" toast and undo), Reply and the nav's Compose button (open Gmail's compose drawer). **Inert** ("Not part of this prototype"): Remind me, Add to tasks, Labels, More, and the other Gmail toolbar icons. Reason: Amanda's choice. **SYNC TO PRD** (§4 interaction inventory, F5)
- 2026-10-30: ~~Send closes the compose drawer, shows a "Message sent" toast, and (for a reply) adds the message to the bottom of the thread as "me".~~ **SUPERSEDED (2026-10-30)**: Reply uses Gmail's in-place reply box under the email; its Send adds the message to the thread as "me" with a toast. The compose drawer is only for new messages (Compose button); its Send closes it with a toast. Nothing leaves the browser. Reason: Amanda's choice. **SYNC TO PRD** (F5, §5 compose)
- 2026-10-30: Inside an opened bucket: the list has checkboxes, Select all and Move / Archive / Delete like Today, plus drag handles. Dragging shows the delete zone in place of the buttons and a slim strip of the other buckets as drop targets along the top. Reason: Amanda's choice. **SYNC TO PRD** (F2, F4, open questions 15 and 19)
- 2026-10-30: Threads look like Gmail's: older messages collapsed to one line (sender, first words, time), the newest fully open; clicking a collapsed one expands it. Reason: Amanda's choice. **SYNC TO PRD** (F5)
- 2026-10-30: Stage 6 details (Claude's choices from the approved plan): Gmail's reserved names are blocked as bucket names; deleting a bucket resets undo; the delete toast reads "Deleted the Bills bucket"; Archive is preselected in the delete confirmation; the zero-bucket wording is a placeholder. Adding or editing a bucket shows no toast (the tile itself changes). **SYNC TO PRD** (F2, Flow 1, F8)
- 2026-10-30: Bucket names are limited to 30 characters. Reason: Amanda's choice; fits the tile and drop target without "…". **SYNC TO PRD** (F2 Name, §12 #2)
- 2026-10-30: Buckets can have an optional emoji, picked from a full searchable emoji picker (Frimousse library), shown in place of the color dot in the tile header and the Move list (not on the drop target). Reason: Amanda's request, as a fun extra customization independent of emoji tags. This moves "Bucket emoji" from v2 into v1 and adds a library the tech stack didn't list (approved by Amanda in chat). **SYNC TO PRD** (F2, §4 v2 list)
- 2026-10-30: Bucket color order: bold row Blue, Dark pink, Orange, Lime, Purple, Teal; soft row Sky, Light pink, Butter, Mint, Lavender, Slate, each under its partner. Reason: Amanda's layout. **SYNC TO PRD** (F2 Color)
- 2026-10-30: Bucket color rule (after Stage 6 review): for every color, the tile and drop-target outline is the color itself and the header is the color at 20% mixed with white; text stays dark. Reason: Amanda's original styling rule; the soft-color exceptions looked off. **SUPERSEDES** the soft-color handling in the palette entry below. **SYNC TO PRD** (F2 tile)
- 2026-10-30: Bucket palette: 12 presets, no free picker. **Bold:** Blue #0b57d0 (default), Dark pink #ff4f5e, Orange #ff8d60, Teal #09aba0, Lime #72e721, Purple #8b5cf6. **Soft:** Light pink #ffa3b5, Butter #ffe594, Mint #b4e5cb, Lavender #cbbcff, Sky #a6d3ff, Slate #5f6368 (neutral). Bucket names and other text always use dark text (#1f1f1f), never the bucket color, because most of these colors are too light to be readable as text. ~~Soft colors fill the whole tile header; bold colors and Slate use the 15% tint.~~ (SUPERSEDED 2026-10-30: all colors use a 20% header.) The "+" on drop targets is white on bold colors and dark on soft ones. Green #00bf7d was dropped (too close to Teal and Lime). Reason: Amanda wanted a more fun palette, mixing bold and soft; Claude added Purple, Butter, Lavender and Sky. **SYNC TO PRD** (F2 Color, §12 #3)
- 2026-10-30: ~~Bucket colors are 12 presets with no free color picker in v1. Each preset is dark enough that the bucket name written in that color passes WCAG AA (4.5:1) on white and on its own 12% tint. Reason: Amanda's choice; nobody can pick an unreadable color. **SYNC TO PRD** (F2 Color, §12 #3)~~ **SUPERSEDED (2026-10-30)** by Amanda's bold + soft palette above.
- 2026-10-30: Reordering buckets by drag is v2 and left out of v1. New buckets go at the end. Reason: Amanda's choice. **SYNC TO PRD** (F2 Rules, §12 #4)
- 2026-10-30: Bucket form buttons. Adding a bucket shows Cancel and Save. Editing an existing bucket (3-dot menu) shows Delete and Save; Escape or clicking away leaves without saving. Reason: Amanda's reading of the PRD ("Cancel is to Add as Delete is to Edit"). **SYNC TO PRD** (F2, Flow 1)
- 2026-10-30: Drop-zone outlines after Stage 5 review: bucket targets use a 3px outline (resting dashed 8/6, active solid; 4px was tried and dropped); the delete zone keeps its 2px gray outline but now uses the same 8/6 dashes (drawn as a shape, since plain CSS dashes can't be sized). Both outlines fit a whole number of dash + gap pairs around their edge, stretched by a fraction of a pixel, so the pattern is even all the way round with no odd dash where it starts and ends. Reason: Amanda's review. **SUPERSEDES** the 2px bucket outline in the entry below. **SYNC TO PRD** (F4)
- 2026-10-30: Drop targets show on every eligible bucket while dragging, not only on hover. **Resting:** dashed 2px outline (8/6 dashes), a see-through 6% tint (emails show through), a "+" in a light circle and the bucket name at 18px. **Active** (under the pointer): stronger 12% tint, solid outline, "+" filled in the bucket color. Reason: Amanda wanted bucket targets as easy to find as the delete zone, and the first version looked unrefined. **SYNC TO PRD** (F4 drop targets)
- 2026-10-30: The whole left strip of an email row is the drag handle, not only the icon. Reason: Amanda's request, for tall rows. **SYNC TO PRD** (F1 drag handle)
- 2026-10-30: The delete zone's first-use toast reads "1 email deleted." plus the "Archive instead" text button (the question was redundant with the button). Reason: Amanda's choice. **SUPERSEDES** the "N emails deleted. Archive instead?" wording below. **SYNC TO PRD** (F4, F8 Toast)
- 2026-10-30: Drop-target look (Stage 5). While an email is dragged over a bucket, the tile shows Amanda's design: a dashed stroke in the bucket's color, a very light tint of that color, and a "+" in a soft circle above the bucket name, all centered. The emails already in the tile stay faintly visible underneath. Colors come from each bucket's own color, so it works for any bucket. Reason: Amanda's mockup and choice. **SYNC TO PRD** (F4 "outline in the bucket's color") **SUPERSEDED (2026-10-30)** by the always-visible resting/active targets above.
- 2026-10-30: Drag details (Claude's choices from the approved plan): dragging a checked Today email moves all checked emails; drop toasts reuse the existing wording ("Moved 2 to Priority", "Deleted 1", "Archived 1"); the "Archive instead?" toast stays until the next toast; after Archive instead the toast reads "Archived 1. Dropped emails will be archived from now on." (placeholder wording); the delete zone reads "Drop here to delete" / "Drop here to archive". **SYNC TO PRD** (F4, F8 Toast)
- 2026-10-30: Emails can be dragged from one bucket tile to another on the home page. Reason: Amanda's choice (matches PRD F4). The expanded bucket view is decided in Stage 7.
- 2026-10-30: Delete zone first use. The first drop on the delete zone deletes the emails and shows a toast: "N emails deleted. Archive instead?" (wording **SUPERSEDED 2026-10-30**: now "N emails deleted.") with "Archive instead" as a low-emphasis text button. Clicking it moves those emails from Trash to All Mail (archived), and from then on the zone archives instead of deleting. There is no visible setting in v1: the toast is the only way to switch, and it resets when the page reloads. The setting affects the delete zone only, not the Delete button. Reason: Amanda's choice; keeps a settings menu out of v1 (PRD F10 is v2). **SYNC TO PRD** (F4 delete zone, Flow 2, F10 possible settings)
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
- 2026-10-29: First use of Archive or Delete shows a short inline note above the buttons (not a pop-up) explaining the action, with Cancel / "Archive N" (or "Delete N"). The action happens only on confirm. Once confirmed, the note doesn't show again for that action until the page reloads. Reason: Amanda's choice; keeps the PRD's first-use explanation but follows NEST-UX (no modal). **SYNC TO PRD** (F7, Flow 3, §12 #6)
- 2026-10-29: Toast wording: "Archived 3", "Deleted 3", "Moved 3 to Priority". Undo/redo toasts read "Undone: Archived 3" / "Redone: Archived 3" (Claude's placeholder). Toasts sit just left of undo/redo, last 5 s, and pause on hover. Reason: Amanda's choice for the action wording; placement ties the confirmation to the way back. **SYNC TO PRD** (F8 Toast, §12 #7)
- 2026-10-29: The bulk Move button opens a small "Move to" bucket list on the home page. F4's "not visible on the home page" is read as "no per-row Move to on the home page". Reason: Amanda's choice. **SYNC TO PRD** (F4, F7)
- 2026-10-29: Bucket tile rows on the home page have no checkboxes; selecting bucket emails happens in the opened bucket view (Stage 7). Reason: there are no bucket bulk buttons on the home page, and the tile reads as a clean peek. **SYNC TO PRD** (F2 tile; differs from wireframe-v2)
- 2026-10-29: Qualtrics: participants open the prototype through a link that opens it in a new tab (`target="_blank"`), with a reminder to come back to the survey tab. Amanda tested it in Qualtrics and it works. Reason: avoids the cramped, sideways-scrolling frame (the prototype needs at least 1024px). Notes: every load starts fresh, and a desktop-only notice or device check is worth adding to the survey. **SYNC TO PRD** (§0 and §8 "embedded in the Qualtrics survey")
- 2026-10-29: Hosting. Code at github.com/amandasimm/bucketbox-prototype (public); live at https://bucketbox-prototype-3s9t.vercel.app; commits use 100169270+amandasimm@users.noreply.github.com. CLAUDE.md and BUILD-LOG.md are public (they name Amanda and the thesis; no participant data). Reason: Stage 3 setup.
- 2026-10-28: Public repo contents: the PRD, the spreadsheet, sketches, wireframes and screenshots stay out of Git (local only). Reason: thesis research material. Commits use a placeholder email until Stage 3, when it switches to Amanda's GitHub private "noreply" address before the first push. Reason: keeps her NYU email off a public repo.
- 2026-10-29: The prototype's customer-facing name is **Bucketbox** (Amanda's working name). The switch at the bottom of Gmail's nav reads "Bucketbox". Reason: Amanda's choice. **SYNC TO PRD** (§5 "open prototype" button; product name)
- 2026-10-29: Gmail's Inbox unread count (in the nav and on the Mail icon) is hidden while Bucketbox is on, and shown in the plain Gmail view. Reason: Bucketbox shows only per-day counts ("Chunk by day" principle). **SYNC TO PRD** (§1 Chunk by day, §5)
- 2026-10-29: Undo and redo sit in the top-right corner of the Bucketbox panel, level with the "Today" heading, with no toolbar bar. Reason: Amanda found the full-width bar wasted space; the corner position still reads as page-wide. **SYNC TO PRD** (F8 position, §12 #5) **SUPERSEDED (2026-10-29)** by the bottom-right position below.
- 2026-10-29: Undo and redo sit in the bottom-right corner of the Bucketbox panel, level with the Move / Archive / Delete buttons. Reason: Amanda's choice. **SYNC TO PRD** (F8 position, §12 #5) **SUPERSEDED (2026-10-30)** by the left-nav position below.
- 2026-10-30: Undo and redo sit at the bottom of Gmail's left nav, with toasts just above them; the Bucketbox switch moved up to sit just below the Gmail items. Reason: in the bottom-right corner they covered buckets and the new-bucket form (Amanda's review). **SYNC TO PRD** (F8 position, §12 #5)
- 2026-10-29: Bucket headers get a 15% tint of the bucket color (mixed with white), with the text color unchanged. Reason: tested on 8 colors including black and yellow; the worst case (black) still gives 11.7:1 for the name and 6.7:1 for the gray count (AA needs 4.5:1), so any color a user picks stays readable. 20% would also pass (worst 10.3 / 5.8); 15% stays calmer. The name is always shown, so color is never the only signal. **SYNC TO PRD** (F2 bucket tile)
- 2026-10-29: Email row text hierarchy. 1 Sender: 15px bold, darkest (#1f1f1f). 2 Time/date: 12px regular, muted gray (#444746), far right. 3 Subject: 14px, dark (#1f1f1f). 4 Preview: 13px regular, lightest gray (#5f6368, 6.2:1 on white), up to 2 lines. Colors follow Gmail's palette. Reason: Amanda's hierarchy spec. **SYNC TO PRD** (F1 row layout)
- 2026-10-29: Unread vs read. **Unread:** an 8px Gmail-blue dot (#0b57d0, 6.4:1 on white) after the sender name, and the sender and subject bold (#1f1f1f). **Read:** no dot; sender and subject regular weight in a slightly dimmer gray (#444746, 8.7:1 on the read-row tint); Gmail's light row tint stays. Screen readers hear "Unread." before the sender. Reason: Amanda's choice; the dot, weight and tint together mean unread never relies on color alone. **SYNC TO PRD** (F1 "Read/unread state follows Gmail") **SUPERSEDED (2026-10-29)** by the no-fill version below.
- 2026-10-29: Read rows have **no background fill** (Gmail's light tint removed). Read and unread look identical in the Today list and in buckets. **Unread:** blue dot after the sender, sender and subject bold (#1f1f1f). **Read:** no dot, sender and subject regular weight in #444746 (9.4:1 on white). Screen readers hear "Unread." Reason: Amanda found the fill distracting; the dot plus the weight change still mean unread never relies on color alone. **SYNC TO PRD** (F1 "Read/unread state follows Gmail")
- 2026-10-29: Home page visual refinements: no "Buckets" heading; the unsorted count is the same size as the day label; bucket tiles have a 2px stroke in the bucket's color. Reason: Amanda's review of Stage 2. **SYNC TO PRD** (§5 home page, F1 "large unsorted count", F2 tile)
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
- ~~Switch wording~~: resolved 2026-10-29, "Bucketbox" (see Decisions).
- ~~Inbox count in the nav~~: resolved 2026-10-29, hidden in Bucketbox (see Decisions).
- **Compose button:** shows "Not part of this prototype" until Stage 7 makes the compose drawer real.
- ~~Future times on Today~~: resolved 2026-10-28. Testing is after 1 PM, and Today's emails end at 12:42 PM (see Decisions).

**Mock data at a glance (from `mock_inbox_data_v3.numbers`, 2026-10-28)**
- Today: 12 unsorted (all unread), 6:52 AM to 12:42 PM, including the Cabin weekend thread and the interview request.
- Yesterday: 8 unsorted (all read). 2 days ago: none (shows the celebration). 3 days ago: 2 unsorted.
- Priority bucket: 5 emails from 3–6 days ago (3 unread). Days 4–6 have nothing left unsorted.
- Attachments are shown as labels only ("3 photos", "Lease renewal.pdf"); there are no real files.
- Times are written as 24-hour in the sheet and shown Gmail-style (e.g. 4:30 PM).

**During the build (can wait until the feature)**

- ~~Qualtrics width~~: resolved 2026-10-29. A new-tab link works in Qualtrics (see Decisions).

9. ~~Bucket name length limit~~: resolved 2026-10-30, 30 characters (see Decisions).
10. ~~Bucket palette and color picker~~: resolved 2026-10-30, 12 readable presets, no picker (see Decisions).
11. ~~Undo/redo position on screen~~: resolved 2026-10-29 (see Decisions). The first proposal, a full-width top bar, was rejected as wasted space.
12. ~~First-use confirmation~~: resolved 2026-10-29, inline note (see Decisions).
13. ~~Toast wording~~: resolved 2026-10-29 (see Decisions). Still open: empty-state wording (placeholders from PRD F6 for now), the zero-bucket state, and the undo/redo toast wording ("Undone: Archived 2").
14. ~~Bucket reordering~~: resolved 2026-10-30, v2 (see Decisions).
14a. ~~Unread vs read is subtle~~: resolved 2026-10-29 with a blue dot plus bold/regular weights (see Decisions).
14b. ~~Drop-target highlight~~: resolved 2026-10-30, Amanda's dashed-outline design (see Decisions).
15. ~~Bucket-to-bucket drag~~: resolved 2026-10-30. Home page: between tiles. Opened bucket: a strip of the other buckets appears while dragging (see Decisions).
16. ~~Bulk Move on the home page~~: resolved 2026-10-29, allowed (see Decisions).
17. ~~Interaction inventory~~: resolved 2026-10-30 for the email view (see Decisions). Search and Gmail nav links stay inert.
18. ~~"Missed email" indicator~~: resolved 2026-10-30, a blue dot on the back arrow when the previous day still has unsorted emails (see Decisions).
19. ~~Delete zone in the opened bucket~~: resolved 2026-10-30, in place of the bucket list's buttons, as in Today (see Decisions).
20. Tag button: hover-only (PRD) is not keyboard-reachable. Can it also show on keyboard focus?
21. Stage 8: should Gmail's 😊 reaction button under an open email open the emoji tag picker? (Inert until then.)

---

## Known issues
<!-- Bugs or compromises to fix later. Format: - YYYY-MM-DD: Issue. (Plan) -->

- ~~2026-10-28: Commits use a placeholder email.~~ Fixed 2026-10-29: all commits were rewritten to Amanda's GitHub private address before the first upload.
- 2026-10-28: The Gmail logo is an approximation (a red mail icon plus "Gmail"), not Google's official logo file. (Fine for the prototype; revisit if it looks off.)
- 2026-10-28: Left out of the Gmail frame for simplicity: the "Labels" section, Categories, the right-hand side panel (Calendar, Keep, Tasks) and the status/calendar chip in the header. (Add back if testing shows they're missed.)
- 2026-10-28: If someone tests before 12:42 PM, a few Today emails will look like they arrived later that day. (Accepted, since testing is planned after 1 PM.)
- ~~2026-10-30: The drop-target bucket name uses the bucket's own color; a light color would be hard to read.~~ Fixed 2026-10-30 in Stage 6: text is always dark.
- 2026-10-30: While dragging, the chip sits where the row was grabbed, so it can cover the delete zone's label. (Fine for now; revisit in Stage 11 polish.)
- 2026-10-30: mock_inbox_data_v4.numbers was written by the numbers-parser tool, which hasn't been tested with this version of Numbers. (Amanda to open it in Numbers once to confirm it looks right; v3 is untouched as a backup.)
- 2026-10-30: When dragging while an email is open with only 1–2 buckets, the drawer closes and the Today card widens mid-drag. (Works; revisit in Stage 11 polish if it feels jumpy.)
- 2026-10-28: Re-importing the spreadsheet needs the `numbers-parser` Python package, which isn't part of the project. (Claude installs it in a temporary folder when needed.)
