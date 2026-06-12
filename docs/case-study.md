# A community board for a local newsroom: no servers, $0/month, grant-ready analytics

*How Wausau Pilot & Review built a moderated bulletin board where the
editorial review — not the technology — is the product.*

---

## The problem

Every town has the same three places to find a lost cat: a Facebook group, a
Nextdoor feed, and a corkboard at the grocery store. The first two come with
algorithmic feeds, arguments, and ads. The corkboard works — but only if you
happen to walk past it.

Wausau Pilot & Review, a nonprofit newsroom in central Wisconsin, wanted the
corkboard: notes from neighbors about events, lost & found, free & for sale,
volunteer calls, shout-outs, and milestones. The differentiator is the thing
newspapers have always had and platforms never will — **a human editor reads
every note before it's pinned.** Every published card carries a rubber stamp,
`APPROVED · JUN 9`, because the review *is* the product and the design should
say so.

Two constraints shaped everything:

1. **No money for infrastructure.** A nonprofit newsroom's tech budget rounds
   to zero. No servers, no monthly bills that grow with traffic.
2. **Grant reporting is existential.** Funders ask for engagement numbers —
   unique visitors, contributions, connections made. Those numbers have to be
   real, first-party, and exportable, without bolting Google Analytics onto a
   community-trust product.

## The shape of the answer

```
Reader browser ──read──> board_posts (view)        ── published rows, public columns only
Reader browser ──rpc───> submit_post()             ── the ONLY insert path (honeypot + rate limit)
Editor browser ──rpc───> publish_post()/reject_post() ── the ONLY publish path (computes expires_at)
Editor browser ──table─> posts                     ── pin toggle / take-down / pending copy-edit
All browsers   ──rpc───> log_event()               ── first-party analytics, no PII, rate-limited
pg_cron (daily)─update─> posts                     ── published -> expired past expires_at
```

A static Vite + React app on GitHub Pages, embedded in the newsroom's
WordPress site via an auto-sizing iframe. All state lives in Supabase
Postgres (free tier). There is no application server anywhere, and the only
scheduled job runs *inside the database* — `pg_cron` expires stale posts
daily at 4:17 a.m., so the board never shows last month's garage sale.

### One path for everything

The design rule that did the most work: **every kind of write has exactly one
path, and it's a Postgres function.**

- Anonymous visitors have *no grants on any table*. They can read one view
  (`board_posts` — published rows, public columns only) and call two RPCs:
  submit a note, log an event. That's the entire public surface of the
  database.
- `submit_post()` is the only way a note enters the system. It carries the
  honeypot check (a hidden field humans never see) and the rate limit
  (3 submissions per email per 24 hours) inside the function, next to the
  insert it protects.
- `publish_post()` is the only place derived state is computed. Events
  expire the morning after the day after the event; everything else lives
  21 days. No frontend code ever touches `published_at` or `expires_at`.
- The editor's desk updates the table directly only for state with no
  derived logic: pinning, take-downs, and copy-editing a pending note's
  text — and Postgres CHECK constraints still validate the edited text.

Client-side validation is HTML attributes (`required`, `minLength`,
`maxLength`) and nothing else. The database constraint is the real
validator; the form just translates its errors into neighborly English.

### Analytics designed backward from the grant report

The funder's Measurement & Evaluation table was written first; the events
schema was derived from it. Seven event types (board views, post reads,
filter use, form opens, submission attempts, shares, contact reveals) flow
into one table keyed by a random 16-character id in localStorage. No
cookies, no IP addresses, no third parties — with fonts self-hosted, **a
reader's request never leaves the site.**

Three SQL views turn raw events into the report itself: monthly engagement,
monthly participation (including first-time contributors and average
submission-to-publish time), and `grant_report` — the join that matches the
proposal table one-to-one. The editor sees it as a tab on the moderation
desk with a CSV download; no one has to ask a developer to run SQL.

Because these numbers underwrite funding, `log_event()` is rate-limited
per session inside the database — a curl loop can't manufacture visitors.

### The editor is the user

The moderation desk (`#/admin`, Supabase email auth, one account, public
sign-ups disabled) is built around how an editor actually works:

- **Edit before approve.** Newspapers copy-edit; a typo shouldn't go up
  under an APPROVED stamp with the paper's name on it.
- **Reject with a reason**, kept on file, with a Rejected tab as the
  archive of those decisions.
- **Pin to top** marks an Editor's pick — it gets the red pushpin.
- **Copy link** on any published note produces a deep link for the weekly
  newsletter, which is the growth loop: newsletter readers become board
  readers become contributors.

### The design is an argument

The board is a corkboard set in newsprint: warm paper, halftone dots, an
Oxford rule under the masthead, cards with SVG-noise grain that hang at a
half-degree tilt. Two CSS-only artifacts carry the identity:

- **The brass pushpin** appears only on the public board. Pending notes on
  the editor's desk have no pin — *nothing is pinned until an editor pins
  it.* Editor's picks get the red pin. Cards pivot at the pin on hover.
- **The rubber stamp** — double ring, Courier, inked into the paper with
  `mix-blend-mode: multiply` — is the editorial promise made visible.

Type and color come from the newsroom's site and its typewriter logo:
Oswald, Merriweather, Courier Prime; site red `#dd3333`; a teal sampled
from the typewriter and deepened one step so small text clears WCAG AA.

## What was deliberately left out

The omissions are decisions, not gaps: no email notifications (the editor
checks the queue), no images (moderating images is a different job than
moderating text), no comments or reactions (the board is notes, not
threads — Facebook can keep the arguments), and no duplicated validation
layer.

## Numbers

- **Infrastructure cost:** $0/month (GitHub Pages + Supabase free tier)
- **Application servers:** 0
- **Public database surface:** 1 view + 2 functions
- **JS shipped:** ~107 kB gzipped, fonts self-hosted
- **Time from submission to the editor's queue:** one RPC

## What's next

A Hmong-language pass (Wausau has one of the largest Hmong communities per
capita in the U.S.), a Spanish pass behind it, and a monthly "From the
Community Board" print roundup — closing the loop back to the corkboard
the design came from.

---

*The repo is MIT-licensed. If you run a local newsroom and want a community
board of your own, the README's setup section is the whole deployment
story: create a Supabase project, run two migrations, add two secrets,
push.*
