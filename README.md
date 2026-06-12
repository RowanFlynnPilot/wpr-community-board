# The Community Board — Wausau Pilot & Review

A moderated digital bulletin board for the Wausau metro. Neighbors post notes —
events, lost & found, free & for sale, volunteer calls, shout-outs, milestones —
and every note is read by an editor before it's pinned. That editorial review is
the product: it's what a newspaper's bulletin board has that Facebook groups and
Nextdoor never will.

**Stack:** Vite + React frontend on GitHub Pages (same pattern as
`wpr-gas-prices`), Supabase Postgres for data, auth, analytics, and the daily
expiry job. No server, no repo-side cron. See `CLAUDE.md` for the architecture
rules before changing anything.

## Setup

1. **Create the Supabase project** (free tier is fine to start).
2. **Enable pg_cron:** Dashboard → Database → Extensions → enable `pg_cron`.
3. **Run the migrations in order:** paste `supabase/migrations/001_init.sql`
   into the SQL Editor and run it (schema, security policies, RPC functions,
   analytics tables, reporting views, the daily expiry job), then run
   `supabase/migrations/002_hardening.sql` (analytics rate limit, event-date
   bounds, clearer publish errors).
4. **Seed (local/dev only):** run `supabase/seed.sql` for ten believable Wausau
   posts plus one pending item so the admin queue isn't empty.
5. **Create the editor's account:** Dashboard → Authentication → Add user →
   email + password. Turn **off** public sign-ups (Authentication → Providers →
   Email → disable "Allow new users to sign up"). One editor, one account.
6. **Configure the frontend:** `cp .env.example .env`, fill in the project URL
   and anon key from Project Settings → API.
7. `npm install && npm run dev`

## The editor's workflow (for Mom)

1. Bookmark the board URL with `#/admin` on the end — that's the desk.
2. Sign in. The **Pending** tab shows everything waiting, newest first, with
   the submitter's email (readers never see it unless the submitter opted in).
3. **Edit** fixes typos before a note goes up — copy-edit like any newspaper.
4. **Approve & pin to board** publishes it. Events stay up through the day
   after the event; everything else stays up 21 days, then expires on its own
   at 4:17 a.m. No stale garage sales, ever.
5. **Reject** asks for a reason — it's kept on file, not sent to anyone. The
   **Rejected** tab keeps the archive.
6. On the **Published** tab: **Pin to top** marks a note as an Editor's pick
   (red pin, sorts first), **Copy link** grabs the note's share URL for the
   newsletter, **Take down** removes it immediately.
7. The **Report** tab is the grant table — one row per month, every metric in
   the proposal, with a CSV download for the funder report.

## Deploy (GitHub Pages)

The included workflow builds and deploys on every push to `main`. One-time
setup: repo → Settings → Pages → Source: GitHub Actions, then add two
**Actions secrets** (Settings → Secrets and variables → Actions):
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key is public by
design — row-level security is the boundary, and the migration revokes every
anonymous path except the published view and the two RPCs.

Once the board is embedded on the site, also set the **Actions variable**
`VITE_PUBLIC_URL` to the WordPress page URL so Share links send readers
there instead of the raw GitHub Pages URL.

## Embed in WordPress

See `embed/wordpress-embed.md` for the iframe snippet with auto-height. It's
the same approach as the gas tracker embed.

## Analytics & grant reporting

Every interaction is captured first-party in the `events` table via
`log_event()` — board views, post reads, filter use, form opens, submissions,
shares, contact reveals. No cookies, no third parties, no personal data: the
visitor id is a random string in localStorage.

Three views turn raw events into funder-ready numbers:

| View | What it answers |
| --- | --- |
| `monthly_engagement` | Reach and engagement: unique/returning visitors, board views, post reads, shares, connections |
| `monthly_participation` | Who's contributing: submissions, posts published, unique and first-time contributors, average hours from submission to publish |
| `grant_report` | The two joined — one row per month, every metric in the grant proposal's Measurement & Evaluation table |

Monthly export for funders: SQL Editor → `select * from grant_report;` →
Download CSV. The metric definitions match the proposal document one-to-one.

## Design

Type and color come straight from wausaupilotandreview.com and the typewriter
logo: Oswald headings, Merriweather body, Courier Prime as the typewriter
voice, site red `#dd3333`, and teal `#357a71` — sampled from the typewriter
(`#3a867c`), then deepened a step so small teal text clears WCAG AA on the
card cream. Fonts are self-hosted (Fontsource), so no reader request ever
leaves the site. The signature element is the **editor's stamp** on every card —
`APPROVED · JUN 9` — because human review is the differentiator and the design
should say so. `design/preview.html` is a self-contained comp: open it in any
browser, no build required. Show it to the editor before anything ships.
