# Your Ethicare — a candidate's private space at `/pack/<slug>`

A private, sectioned space for one candidate or family. Two worked examples:

- `site/pack/clint-varghese-9f2c.html` → `/pack/clint-varghese-9f2c` — New Zealand, all five
  sections, family following.
- `site/pack/thandi-mokoena-4k7d.html` → `/pack/thandi-mokoena-4k7d` — Australia, **fictional**,
  written to prove the AU palette and a dropped section (registration pending, so no
  `travel`). Carries `demo: true`, which paints a dashed "Worked example" band on the page
  and in print and prefixes the tab title — the source comment alone was not enough for a
  page that gets screenshotted. Never set `demo` on a real pack.

Five sections down a left rail, one panel at a time:

| Section | What it holds |
| --- | --- |
| **Your space** | The note from Sophie, and where things stand |
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

Copy the example to a new slug and rewrite the `window.PACK` object at the foot of it.
`pack.css` and `pack.js` are shared and never need touching.

```
site/pack/
  pack.css                 shared
  pack.js                  shared
  <slug>.html              one per candidate — the only file you edit
```

**The slug is the security.** `firstname-surname-<4 random characters>`. A guessable slug is
an open door: these pages name the hospital, the hotel and the family. Anyone with the link
can open it, so the link is the credential — send it directly, never post it anywhere.

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
| `slug` | Must match the filename. It keys their saved notes, so changing it loses them. |
| `demo` | `true` on a worked example only. Visible band + "Example ·" tab title. Absent on every real pack. |
| `first` | Used **once**, in the cover greeting. `Microcopy.md` rule 2. |
| `country` | `nz` or `au`. Sets `data-country` on `<html>`, which switches the accent palette in `pack.css` — fern-text `#2F5E49` and sage for NZ, Clay `#A34438`, Soft Sand and `#EBDFD3` hairlines for AU. Deep teal never changes. The greeting is written by hand in `headings.space.title`: "Kia ora" for NZ, "Hello" for AU — the destination's word, never ours. Set `lang` on `<html>` to match (`en-NZ` / `en-AU`). |
| `title`, `spaceLabel`, `route` | The masthead. `route` is their journey, e.g. "Kochi → Wellington". |
| `headings` | One `{title, sub}` per section. The `h1` changes with the section, so there is always exactly one on the page. |
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

## Notes and plan — device-local, and the page says so

Saved in the candidate's browser under `ethicare_pack_<slug>_v1`. Nothing reaches us and we
cannot read it. That is deliberate and it matches the rest of the product (`/move`, the
checklist, the calculator): **notes a candidate writes about their own move are the last
thing to start collecting server-side** without the processing basis, notice, access and
retention settled first — `ASK-ETHICARE.md` §6.

The trade-off is stated plainly on the page, because it is a real one: the notes do not
follow them to another device and clearing browser data clears them. "Copy everything" and
"Download as a file" are there for exactly that.

**If this ever becomes an account with sync, that paragraph changes in the same release.**
A page that says "nothing is sent to us" while sending things is worse than no page.

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
- Nothing is tracked on these pages.

## Access — decided 15 Sep 2026

The link is the credential, and that is a decision rather than an oversight. It matches the
named PDF packs under `assets/downloads/`, which are `noindex` but publicly fetchable by
URL, and it keeps the page at zero friction for the person it is for — a candidate who
opens it on a phone, mid-move, without a password to lose. The headers above are the
hardening that model gets: no cache, no referrer, no index.

If it ever needs to be stronger, the next step is a Netlify function holding the page
behind a short shared passphrase sent by a separate channel — not a bigger secret in the
URL, and not an account (an account starts the sync conversation in "Notes and plan"
above). Revisit if a pack ever has to carry something a hospital or a visa file would
treat as restricted: a passport number, a medical detail, a salary figure.

## Sending the link, and reading it on a phone

These go to Ethicare candidates who are actively working with us — one link, one family. Email the
candidate the **clean URL** — `https://ethicareresourcing.com/pack/<slug>` — directly, to them and
nobody copied. `_redirects` serves that extensionless URL to the file on every Netlify
configuration (not only when "Pretty URLs" is on) and 301s the `.html` form to it, so a pack has a
single address; the wildcard covers every future pack with no per-slug rule to add, and `/pack/`
itself 404s so the directory is never browsable.

The page is one responsive column, tested at 320px, so it opens cleanly on a phone or tablet
straight from the email. `theme-color` deep teal brands the browser chrome and an Apple touch icon
means a home-screen save looks like ours — standalone mode is deliberately off so the URL bar and
back button stay for someone reading mid-move.

**Notes and ticks stay on the device they were typed on** (see "Where this lives" on the page). The
same pack reads identically on a candidate's phone and tablet, but a note typed on the phone is not
on the tablet — the honest cost of not holding their notes on our servers, and the page says so. If
a candidate ever needs their notes to travel between devices, that is the sync conversation under
"Notes and plan" above, not a quiet change.

**In an email app's in-app browser** (Gmail, Outlook) the pack reads fine, but some in-app
webviews clear storage on close, so a note may not survive. Nothing is lost that we hold — but if a
candidate says their ticks vanished, the fix is to open the link in their real browser (Safari,
Chrome), where storage persists.
