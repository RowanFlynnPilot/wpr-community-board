# CLAUDE.md — wpr-community-board

A moderated community bulletin board for Wausau Pilot & Review. Neighbors submit
notes; the editor approves them at `#/admin`; approved notes appear on the board
with an editor stamp. First-party analytics feed grant reporting.

## Design Principles

1. **Don't overengineer:** Simple beats complex
2. **No fallbacks:** One correct path, no alternatives
3. **One way:** One way to do things, not many
4. **Clarity over compatibility:** Clear code beats backward compatibility
5. **Throw errors:** Fail fast when preconditions aren't met
6. **No backups:** Trust the primary mechanism
7. **Separation of concerns:** Each function should have a single responsibility

## Development Methodology

- **Surgical changes only:** Make minimal, focused fixes
- **Evidence-based debugging:** Add minimal, targeted logging
- **Fix root causes:** Address the underlying issue, not just symptoms
- **Simple > Complex:** Let the type system and Postgres constraints catch errors,
  not runtime checks scattered through components

## Visual language — corkboard set in newsprint

Two physical artifacts carry the identity, both CSS-only:

- **The brass pushpin** (`.card-grid .card::before`) appears ONLY on the public
  board. Pending notes on the editor's desk and the submit form have no pin —
  nothing is pinned until an editor pins it. Editor's picks get the red pin.
  Card rotation pivots at the pin (`transform-origin: 50% 8px`).
- **The rubber stamp** (`.card-stamp`) is a double-ring Courier stamp inked into
  the paper with `mix-blend-mode: multiply`.

Supporting cast, kept quiet: Oxford rule under the masthead (thick over thin),
a Courier folio line with today's date, halftone-dot newsprint background, and
SVG-noise paper grain on cards. `design/preview.html` carries a condensed copy
of `src/styles/board.css` — keep them in sync when the design changes.

## Architecture — read before touching anything

This repo **intentionally breaks the WPR scraper pattern** (like the Brewers
tracker did). There is no cron in this repo, no GitHub Actions data pipeline,
no `policy.py`. Data is user-generated and lives in Supabase; the static
frontend reads it live. The only scheduled job is `pg_cron` *inside the
database* (daily post expiry).

```
Reader browser ──read──> board_posts (view)        ── published rows, public columns only
Reader browser ──rpc───> submit_post()             ── the ONLY insert path (honeypot + rate limit)
Editor browser ──rpc───> publish_post()/reject_post() ── the ONLY publish path (computes expires_at)
Editor browser ──table─> posts                     ── pin toggle / take-down / pending copy-edit (no derived state)
All browsers   ──rpc───> log_event()               ── first-party analytics, no PII
pg_cron (daily)─update─> posts                     ── published -> expired past expires_at
```

## One-path rules (do not add alternatives)

- Anonymous clients never touch the `posts` table. Reads go through the
  `board_posts` view; writes go through `submit_post()`. Table grants for
  `anon` are revoked in the migration — keep it that way.
- `publish_post()` is the only place `published_at`/`expires_at` are computed.
  Never set them from the frontend or in an UPDATE.
- Direct table updates from the admin are allowed only for state with no
  derived logic: `is_pinned` toggle, take-down (`status = 'expired'`), and
  copy-editing a *pending* note's `title`/`body`/`event_date` before
  approval (expiry is computed from `event_date` only at publish, after any
  edit). The Postgres CHECK constraints still validate edited text.
- Category definitions live in two places by necessity: the Postgres enum
  (source of truth) and `src/lib/categories.js` (display, with labels in all
  three board languages). Adding a category means a migration first, then the
  display map — the test suite fails if they drift.
- Board copy lives in `src/lib/i18n.js`, one strings object per language
  (en/es/hmn), no i18n framework. The editor's desk stays English. Adding a
  string means adding it to all three languages — the test suite enforces it.
- Analytics are fire-and-forget. They must never block or break the UI;
  failures log to console with the event name.

## Deliberate omissions (not gaps — decisions)

- **No email notification on new submissions.** The editor checks the queue;
  the Pending count is on the desk. Adding a notifier means adding a service.
- **No images on posts (v1).** Moderating images is a different job than
  moderating text. Revisit only with a moderation plan.
- **No public comments or reactions.** The board is notes, not threads.
  Facebook can keep the arguments.
- **No client-side validation duplication.** HTML `maxLength`/`required` plus
  Postgres CHECK constraints. The database error is the error.

## Commands

```bash
npm install
npm run dev        # local dev at http://localhost:5173 (board) and /#/admin (desk)
npm run lint       # ESLint — runs in CI before every deploy
npm test           # Vitest — incl. the category-enum sync tripwire
npm run build      # static build to dist/
```

## Files that matter

- `supabase/migrations/001_init.sql` — schema, security, RPCs, analytics, views, cron
- `supabase/migrations/002_hardening.sql` — analytics rate limit, event-date bounds, publish errors
- `supabase/migrations/003_editor_grants.sql` — desk grants (RLS policies aren't grants; Supabase no longer auto-grants)
- `src/components/Board.jsx` — container: fetch, filter state, pulse, modal
- `src/components/SubmitForm.jsx` — the one write path from the public
- `src/admin/AdminPage.jsx` — sign-in + moderation desk
- `src/lib/i18n.js` — all board copy in three languages; es/hmn await native review
- `src/styles/board.css` — the entire design system; tokens at the top
- `design/preview.html` — static design comp, no build needed; open in a browser
