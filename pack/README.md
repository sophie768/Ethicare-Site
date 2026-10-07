# My Plan — an Ethicare candidate's private space at `/pack/<slug>`

The one private space on the site. Plan Ethicare (`/move`) is public, needs no account and
keeps its answers on the device; **My Plan** is what an Ethicare candidate gets from the link
the team sends — the same eight stages, plus the letter, the bookings and the chosen guides
the team writes for them, and their own plan and notes saved with us so they follow them
between devices. There are no public accounts, and nothing else on the site is private.
(Until 29 Sep 2026 this was called "Your Ethicare"; the name is retired, the files are the
same.)

A private, sectioned space for one candidate or family. Two worked examples:

- `site/pack/clint-varghese-9f2c.html` → `/pack/clint-varghese-9f2c` — New Zealand, all five
  sections, family following.
- `site/pack/thandi-mokoena-4k7d.html` → `/pack/thandi-mokoena-4k7d` — Australia, **fictional**,
  written to prove the AU palette and a dropped section (registration pending, so no
  `travel`). Carries `demo: true`, which paints a dashed "Worked example" band on the page
  and in print and prefixes the tab title — the source comment alone was not enough for a
  page that gets screenshotted. Never set `demo` on a real pack. It also carries **no
  `key`**, so it runs in device-only mode — the worked example must never write rows.

Six sections down a left rail, one panel at a time:

| Section | What it holds |
| --- | --- |
| **Your space** | The note from Sophie, and where things stand |
| **Your move** | The eight stages of the journey — `move.js`, the public `/move` engine, painting into this page — with the answers strip so they can see and change what shapes it |
| **Your plan** | Their own running list and notes — theirs to write, not ours |
| **Travel & stay** | Flight, accommodation, the walk to work, the time difference |
| **Guides & packing** | The guides chosen for them, each with a reason |
| **Files & receipts** | What to keep together and where each one came from |

A section with no data disappears everywhere at once — the rail, the routing (its hash
falls back to `#space`) and print. The first version filtered only the rail, so `#travel`
on a pack with no travel data still opened an empty panel under a real heading.

This is the online companion to the printed Welcome Pack
(`templates/welcome-pack/STANDARD.md`), not a replacement for it. The book is the thing they
take on the plane; this is the thing they open on their phone and that we keep changing.

## The masthead is the site's, not a redraw

`pack.css` mirrors `shell.css:78-81` — `assets/logo-mark.png` at 42px beside one nowrap
wordmark at 19px/600 with "Resourcing" as a weight-500 `strong`. The first draft of this
page recreated the lockup from a concept screenshot instead: lowercase, stacked, no logo
mark. It looked fine and it was not Ethicare's. **Read `site/_header.html` and the
`.brand` block in `shell.css` before touching the masthead** — a mock is a reference for
layout, never for brand furniture, and on a page sent straight to a placed candidate the
logo is the first thing they check.

## Making one

    python3 tools/new-pack.py "Clint" "Varghese" nz

That copies the worked example for the country to `pack/<firstname>-<surname>-<6 random>.html`,
mints the space's store key into it, and prints the link to send. Then rewrite the
`window.PACK` object at the foot of that file. `pack.css` and `pack.js` are shared and never
need touching.

```
site/pack/
  pack.css                 shared
  pack.js                  shared
  <slug>.html              one per candidate — the only file you edit
```

**The slug and the key are the security.** A guessable slug is an open door: these pages
name the hospital, the hotel and the family. Anyone with the link can open it, so the link
is the credential — send it directly, never post it anywhere. The tool generates both;
never type either, and never change a key once the link has gone out (their saved space
is under it).

Every page carries `noindex, nofollow, noarchive`, is absent from `sitemap.xml`, and is
linked from nowhere on the site. `netlify.toml` repeats the robots rule as a header for
`/pack/*` and adds `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer` —
a page opened on a ward or library computer must not survive in that machine's cache or
back-button history, and the slug must never travel in a `Referer` header.

Without JavaScript the page has an empty heading and every panel hidden, so each page
carries a `<noscript>` line at the top of `main` saying so and offering the printed pack.

### `window.PACK`

| Field | What it does |
| --- | --- |
| `slug` | Must match the filename. It keys the device copy of their notes, so changing it loses them. |
| `key` | The store key (32 URL-safe characters, minted by `tools/new-pack.py`). Present → the space is **saved with us** through `/.netlify/functions/my-move`. Absent → device-only, as before 29 Sep 2026. Never reuse, never change. |
| `demo` | `true` on a worked example only. Visible band + "Example ·" tab title. Absent on every real pack. |
| `first` | Used **once**, in the cover greeting. `Microcopy.md` rule 2. |
| `country` | `nz` or `au`. Sets `data-country` on `<html>`, which switches the accent palette in `pack.css` — fern-text `#2F5E49` and sage for NZ, Clay `#A34438`, Soft Sand and `#EBDFD3` hairlines for AU. Deep teal never changes. The greeting is written by hand in `headings.space.title`: "Kia ora" for NZ, "Hello" for AU — the destination's word, never ours. Set `lang` on `<html>` to match (`en-NZ` / `en-AU`). |
| `title`, `spaceLabel`, `route` | The masthead. `route` is their journey, e.g. "Kochi → Wellington". |
| `headings` | One `{title, sub}` per section (`space`, `move`, `plan`, `travel`, `guides`, `files`). The `h1` changes with the section, so there is always exactly one on the page. |
| `travel`, `files` | `[{k, v, note}]` rows. Omit the key entirely to drop the section. |
| `suggested` | Plan starters they can tap to add. **Never pre-added and never pre-ticked** — a plan someone did not write is a list of instructions. |
| `facts` | `[label, value]` pairs on the cover. Four is plenty. Leave out anything not yet decided rather than writing "TBC". |
| `letter` | Array of paragraphs. The most important thing on the page — see below. |
| `signoff` | `{name, role}`. |
| `guidesWhy` | One sentence saying **why these ones**. `Microcopy.md` rule 7. |
| `guides` | `[{title, href, why}]`. The `why` is what makes it a chosen list rather than a short menu. |

**Title the card after what the destination actually owns.** The first draft of the example
had a card called "Renting, and what a Wellington house is like in winter" pointing at
`/guides/new-zealand-relocation`, which is "Preparing to move" and contains the words `bond`
and `damp` zero times. There is no NZ renting guide, so the nearest owner was the right
link — the description was the missing half. Where the page cannot deliver what the
candidate needs, **say where it does live** (here: the printed pack). Same rule as the Ask
Ethicare resource map, and the same defect class as the 47 browse-intent CTAs that promised
a list and served a form.

### The letter

Same standard as the printed pack: from a named person, say how long we have worked with
them, say what we know about them, be straight about the hard part rather than selling past
it. The banned constructions in `STANDARD.md` apply here too — `X, not Y` antithesis,
`rather than` as rhetoric, "worth knowing", bare imperatives as headings.

## Where the candidate's own writing lives

Two modes, decided by `PACK.key`, and **the privacy line on the page is written by `pack.js`
from the mode** — never by hand in the HTML — so the copy cannot say one thing while the
code does another. (A page that says "nothing is sent to us" while sending things is worse
than no page.)

**Saved with us** (`key` present — every pack made by the tool). What the candidate writes —
their plan, their notes, the answers that shape the site's tools (destination, profession,
who is coming, stage) and the stages they have ticked off — goes to one row in the
`my_move` table, keyed to the space's key, through `netlify/functions/my-move.js`. The
device keeps a copy (`ethicare_pack_<slug>_v1` for the plan and notes; `ethicare_portal_v1`
for the answers, the same store every public tool reads), so the page works offline and in
a webview that drops storage; when the two disagree the server wins unless something local
is unsaved, and two devices writing at once are merged (plan items unioned, ticks unioned,
notes appended) rather than one silently losing.

On the **first open**, whatever the device already holds — answers given on the public
tools, a plan started on `/move` — becomes the space, so nothing is re-asked. The pack's own
country becomes the destination if no answer was given. That is the whole point of one
answers store: the candidate is remembered from the public site into their private one.

The page says all of this in "Where this lives": saved to your space, follows you between
devices, the person helping you at Ethicare can see it when you ask, never shown to an
employer, ask us and we will change or delete it. The processing basis is the relationship
already in place (they are an Ethicare candidate with a signed privacy grant from `/apply`);
what is stored is what they typed and nothing inferred; retention is until they ask or the
placement closes; access is the page itself and a request to us. `ASK-ETHICARE.md` §6 asked
for exactly those four before any candidate writing went server-side — they are settled
here, and the "Copy everything" and "Download as a file" buttons stay for the same reason.

**Device-only** (no `key`) is the pre-29-September behaviour, unchanged: the worked example
runs this way, and any older pack still does. The page says its notes stay on the device
and will not follow them.

### The function and the table

`netlify/functions/my-move.js` — GET reads a space, POST saves one. Same guards as
`capture.js` (origin allowlist, body cap, per-IP burst limit), a key format check, and a
**whitelist** of what a space may hold: unknown fields are dropped, strings capped,
enumerations checked against the site's own vocabularies (the eight stage ids from
`questions.json`, the household values the tools use). It never accepts a prompt, a file
or free structure. The same two env vars as `capture.js` (`SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE`), never in the browser; a deploy preview without them just runs
the page device-only and says "not connected right now".

Run once in the Supabase SQL editor:

```sql
create table if not exists my_move (
  key         text primary key,
  slug        text,
  data        jsonb not null default '{}'::jsonb,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table my_move enable row level security;   -- service role only; no anon policy
```

**Reading a candidate's space** (when they ask for help): Supabase → Table editor →
`my_move` → the row whose `slug` is theirs → `data`. Plan, notes, answers, ticks.

**Closing a link** — a placement ends, a link was forwarded, they ask: set `revoked_at` on
the row to now. The page then shows "This link has been closed" and nothing else, and the
function refuses reads and writes (410). Their data stays in the row until you delete it —
do that when they ask, or when the relationship closes. Deleting the pack file alone also
takes the page down, but leaves the row; the row is the record, so revoke there first.

## Print

The screen shows one panel under an `h1` that changes with the section; paper shows all of
them. `pack.js` stamps each active panel with `data-print-title` (its heading, or the rail
label) and `pack.css` prints that as the section heading; on `beforeprint` the `h1` becomes
the pack's name and the standfirst becomes "As it stood on <date>" — the page keeps
changing, so a printout without a date is a liability. Guide cards print their address,
the closing band flips to white with a teal rule (no solid fills on paper), and the rail,
strip, buttons and add-row drop out. A dropped section is already out of the DOM, so it
never prints.

## Before a new pack ships

Run **`audit/probe-320-pack.html`** and add the new slug to its `PAGES` array. It loads the
page at 306px and probes **every section**, not just the landing one — a panelled page shows
one panel at a time, so a harness that only sees `#space` certifies nothing about the other
four. (It reloads with a `?s=` cache-buster per section: changing only the hash does not
fire `onload`, and the first run of this harness silently stalled after one section for
exactly that reason.)

Current state: **10 section views across two packs, 0 overflow, 0 sub-24px targets** —
confirmed in a browser run 15 Sep 2026, not only by reading the source. The
harness probes the full hash set on every pack on purpose — a hash for a dropped section
must route to `#space`, so on the AU example `#travel` tests the routing.

Two bugs this family shipped with, both worth not repeating:

- **`grid-template-columns:1fr` on the stacked breakpoint blew the page to 836px.** Plain
  `1fr` is `minmax(auto,1fr)`, and that `auto` minimum is the **max-content** size of the
  largest item in the track. The rail is a horizontal scroller with
  `grid-auto-columns:max-content`, so its five links (≈818px) sized the track — and the
  scroller never became a scroller (`scrollWidth === clientWidth`), it was just wide.
  `minmax(0,1fr)` plus `min-width:0` on the list. Same class as the `minmax(320px,1fr)`
  floor already recorded in §0-mob.
- **The masthead overflowed independently.** A `nowrap` flex row holding a
  `flex-shrink:0` brand (228.8px), the label block (118.7px) and a 20px gap needs 367.5px
  in 306, so the avatar sat off-screen. Now wraps, and below 400px the label drops while the
  wordmark and avatar stay — the same compress-at-narrow pattern `shell.css` uses.

## What this does NOT do

- No login, no account, no password. The link is the credential.
- No employer visibility, no sharing, no profile.
- Nothing is tracked on these pages (`analytics.js` is not loaded; `move.js` only calls
  `window.track` when it exists, and here it does not).
- Nothing is stored that the candidate did not type or tick. No inference, no scoring.

## Access — decided 15 Sep 2026

The link is the credential, and that is a decision rather than an oversight. It matches the
named PDF packs under `assets/downloads/`, which are `noindex` but publicly fetchable by
URL, and it keeps the page at zero friction for the person it is for — a candidate who
opens it on a phone, mid-move, without a password to lose. The headers above are the
hardening that model gets: no cache, no referrer, no index.

If it ever needs to be stronger, the next step is a Netlify function holding the page
behind a short shared passphrase sent by a separate channel — not a bigger secret in the
URL, and not an account. Revisit if a pack ever has to carry something a hospital or a
visa file would treat as restricted: a passport number, a medical detail, a salary figure.
The candidate's own writing is now saved with us (above), which raises the bar for what
goes in the pack file, not lowers it: the row holds what they typed, the file holds what
we wrote, and neither should carry a document number.

## Sending the link, and reading it on a phone

These go to Ethicare candidates who are actively working with us — one link, one family. Email the
candidate the **clean URL** — `https://ethicareresourcing.com/pack/<slug>` — directly, to them and
nobody copied. Netlify serves that extensionless URL to the file the same way it does every other
page on the site, and `netlify.toml` answers `/pack/` itself with a 404 so the directory is never
browsable.

The page is one responsive column, tested at 320px, so it opens cleanly on a phone or tablet
straight from the email. `theme-color` deep teal brands the browser chrome and an Apple touch icon
means a home-screen save looks like ours — standalone mode is deliberately off so the URL bar and
back button stay for someone reading mid-move.

**Notes and ticks follow them** on a pack with a `key` (see "Where the candidate's own writing
lives"): a note typed on the phone is on the laptop the next time it opens. On an older pack
without one they stay on the device, and the page says so.

**In an email app's in-app browser** (Gmail, Outlook) the pack reads fine. Some in-app webviews
clear storage on close; on a saved pack that costs nothing (the space reloads from us), on a
device-only pack a note may not survive, and the fix is to open the link in their real browser
(Safari, Chrome).
