# Ethicare Resourcing — static site (Netlify)

This `site/` folder is the deployable website. Plain HTML/CSS, no build step. Everything Netlify needs ships in the folder: `netlify.toml`, `_redirects`, `robots.txt`, `sitemap.xml`, `404.html`.

## 1. Deploy

### Current state — manual, and it has already cost us (1 Sep 2026)

The live site is deployed by **manual upload**. It is not built from git. All three
GitHub repos on the account (`sophie768/Ethicare`, `Ethicare-`, `Ethicaresite`) are flat
dumps — every file at the repo root, zero subdirectories — while the live site serves real
`/destinations/`, `/guides/` and `/jobs/` folders. No base-directory setting on any of them
could produce the deployed tree, so none is the source.

That is not a filing quibble. On 1 September the destinations index was uploaded as the site
root, so `https://ethicareresourcing.com/` served "New Zealand Destination Guides" with a
canonical of `/destinations/`. Nothing in the source was wrong; the wrong file was dragged.
With no git history there was no diff to catch it and no revert — it was found by a human
looking at the homepage.

**Do not add more manual uploads. Migrate to git (§1a).**

### 1a. Migrate to git (do this once)

GitHub's *web* uploader caps at 100 files per drag and cannot preserve a tree this size —
that is why the `github-batches/` folders exist, and the batch-to-target mapping they require
is exactly the error class that caused the incident. Use a real git client instead; there are
no limits and one commit does the whole tree.

```bash
# from a local copy of this site/ folder
git init
git add .
git commit -m "Ethicare site — full tree"
git branch -M main
git remote add origin https://github.com/sophie768/<new-repo>.git
git push -u origin main
```

Use a **new, empty repo**. Do not push into the three existing flat ones — their history is
not this tree and merging them would be worse than starting clean.

Then in Netlify: *Site configuration → Build & deploy → Link repository* → pick the repo,
branch `main`, **publish directory = `.`** (this folder IS the repo root, so `netlify.toml`,
`_redirects` and `netlify/functions/` are already in the right place). Every push then
redeploys automatically, every change is diffable, and any bad deploy is one click to revert.

After linking, retire `github-batches/` and `batches/` — they only exist to work around the
web uploader.

### 1b. Environment variables (required — Ask Ethicare is currently down)

`netlify/functions/ask-ethicare.js` needs an API key that is never sent to the browser.
In *Site configuration → Environment variables* set **one** of:

- `ANTHROPIC_API_KEY` (preferred — the function uses `claude-sonnet-4-5`)
- `OPENAI_API_KEY` (fallback — `gpt-4o`)

Redeploy after setting it. Without a key the function returns **503** and the homepage shows
"Ask Ethicare is briefly unavailable", which is what it is doing in production right now.

Diagnosing it: ask a question, watch the POST to `/.netlify/functions/ask-ethicare`.
**404** = the function was not deployed (`netlify.toml` and `netlify/functions/` missing from
the upload — a manual-deploy failure that git migration fixes permanently).
**503** = no key set. **502** = key set but rejected upstream.

### 1c. Manual deploy (legacy — only until §1a is done)

1. https://app.netlify.com → the site → *Deploys* → *Deploy manually*.
2. Drag this entire `site/` folder onto the page. **The folder, not its contents** — and never
   an individual file into the root, which is how the homepage was overwritten.
3. Verify `/` shows "Healthcare careers in New Zealand & Australia" before walking away.

## 2. Domain (ethicareresourcing.com)

1. Netlify: *Domain settings → Add a custom domain* → add both `ethicareresourcing.com` and `www.` (the `netlify.toml` already 301s www → apex).
2. DNS: either move nameservers to Netlify DNS (easiest, automatic apex + www + SSL), or keep DNS where it is and add the `CNAME`/`A` records Netlify shows. SSL is automatic once DNS resolves.

## 3. Forms — already wired (Netlify Forms)

All **eight** forms use **Netlify Forms** — no third-party account, works from the first deploy:

| Page | Form name | On success |
| --- | --- | --- |
| `contact.html` | `contact` | `/thank-you` |
| `submit-a-vacancy.html` | `vacancy` (JD upload) | `/thank-you` |
| `connect.html` | `connect-interest` | `/thank-you` |
| `request-a-guide.html` | `guide-request` | `/thank-you` |
| `apply-legacy.html` | `applications` (CV upload) | `/thank-you` — legacy page, `noindex` |
| `apply.html` | `candidate-registration` (CV upload) | in-page confirmation |
| `pathway-checker.html` | `pathway-checker-lead` | in-page confirmation |
| `move.html` | `plan-share` (plan summary) | `/thank-you` |

Every form carries `data-netlify="true"`, a hidden `form-name` input and a `bot-field` honeypot.

**After the first deploy:** Netlify dashboard → *Forms* → set the **email notification** address for each of the eight (e.g. hello@ethicareresourcing.com). Submissions also stay listed in the dashboard. Spam is filtered by the honeypot fields. File uploads are supported on the free tier (8 MB per file).

**Later — switch applications to Vincere:** change the apply form's `action` to the Vincere endpoint (keeping field `name`s), or replace the `<form>` block with Vincere's embed. Contact/vacancy can stay on Netlify Forms.

## 4. URLs & redirects

- Canonical URLs are extensionless (`/contact`, `/guides/new-zealand-registration`); Netlify serves `page.html` for `/page` automatically.
- `_redirects` maps the canonical destination slugs (e.g. `/destinations/auckland-new-zealand`) onto the underlying guide files and 301s legacy names. Don't rename files in `destinations/` without updating it.
- `404.html` is served automatically for any missing URL.
- `sitemap.xml` lists every canonical URL; `robots.txt` points to it. After go-live, submit the sitemap in Google Search Console.

### Routing audit — 20 August 2026

`_redirects` was audited rule by rule and is now **476 rules, verified clean**: no duplicate sources, no redirect chains, no loops, every rewrite target present on disk, every redirect target routable. `sitemap.xml` holds 422 canonical URLs, all routable, none of them a redirect source, all carrying `lastmod`. All 25 `noindex` pages are absent from the sitemap.

Five defects were found and fixed. Worth knowing about, because each is a trap to avoid reopening:

1. **Four shadowed state rules.** `/destinations/{new-south-wales,queensland,victoria,western-australia}-relocation-guide` each had a `200` rewrite to a `noindex` print document *above* the `301` meant to retire it. Netlify matches top-to-bottom, so the `301` never fired and the URL served the retired page. The `200`s are gone. **Rule: a new redirect must go above any existing rule for the same path, or replace it.**
2. **Sixteen two-hop chains** created by that fix, since the legacy `*_Relocation_Guide` names pointed at the middle URL. Collapsed to single hops.
3. **Eight exact-duplicate rules** (Melbourne, Christchurch, Northland, Bay of Plenty, Palmerston North, Central Otago). Harmless but misleading. Removed.
4. **Two invented synonyms** — `/moving-to-new-zealand` and `/guides/bringing-pets-and-belongings` served pages by `200` whose canonical pointed elsewhere. Now `301`s to the canonical, per one-topic-one-URL.
5. **`apply-legacy.html` had no form `action`**, so a submission landed on Netlify's default success page instead of `/thank-you`. Set.

The four AU state print documents are now unreachable by design (the state tier is retired). They still ship in the folder — say the word and they move to `archive/`.

## 4b. Profession page artwork

All 14 profession pages carry photographic heroes served from `assets/professions/web/` as WebP (`.hero .bg` full-bleed, or `.mportrait` on the two consultant radiologist pages). `profession-hero.css` neutralises the older framed-illustration markup with `.hero .hero-art{display:none!important}` — leave that rule in place unless the artwork direction changes.

A proposal to replace this imagery with the flat illustrations at `assets/prof-*.png` was built and reverted on 20 August 2026; see `Profession Artwork Brief.html` for the reasoning, which is still open.

**WebP serving (21 Aug 2026).** The PNG masters stay in `assets/professions/`; the pages load `assets/professions/web/<name>.webp`, capped at a 1400px long edge, quality 0.82, same aspect ratio — no recrop. **28.1MB → 1.05MB** across the 14 heroes, each of which is the page's eager `fetchpriority="high"` LCP element. Do not point the pages at the older sibling `.webp` files in `assets/professions/` — those are a 1000×760 crop of a square source, not a re-encode, and swapping to them recrops the hero. If a master is replaced, re-run the encode into `web/` and repoint; never repoint to a PNG.

**`radiologist-au.png` is withdrawn (21 Aug 2026).** The original had a fabricated patient record legible on the reporting monitor — `MRN 452211`, `DOB 12/06/1978`, `43Y F`, with the DOB and the stated age contradicting each other — on the one page written for the audience that reads that overlay daily. It rendered inside a 158px circle so it was never readable on screen, but the file shipped in the deploy and could be opened directly. The monitor is now cropped out (`radiologist-au-crop.png` master, `web/radiologist-au-crop.webp` served) and the original is in `archive/unused-images/` under a name that says why. The NZ twin was checked and is clean — its screen text is illegible noise with no identifiers.

## 4c. Live roles on profession pages

`jobs/live-roles.js` is the single renderer for the "Current opportunities" section on all 14
profession pages. Each page's `#live-roles` container carries `data-profession` and
`data-country`; the script shows only roles matching both, preferring each record's `country`
field and falling back to a location-text match. `jobs/hero-rail.js` uses the identical filter,
so the hero rail's count and the section's cards can never disagree.

Fixed 21 Aug 2026: the renderer used to be inlined on every page, and the nine New Zealand copies
never received the country filter the five Australian ones had — so NZ profession pages listed
Australian vacancies while their own hero rail correctly reported none. One shared file now, because
a hand-picked file set is how that happened.

## 5. Navigation

The header nav is identical markup on every page: Australia · New Zealand · Jobs · Plan Your Move · About · For Employers · Contact (CTA). Four of the seven carry a shallow dropdown of at most three links; the country page remains the navigation hub for everything beneath it.

### Where the header lives — `site/_header.html`

`site/_header.html` is the **single source of truth** for the header markup. The
nav stays inline in each page on purpose (it has to be crawlable and has to work
with JavaScript off), so `_header.html` is the *author-time* source, not a
runtime include. A nav change is therefore: edit `_header.html`, then re-run the
sync so every folded-in page is rewritten from it.

Two placeholders: `{{BASE}}` is the relative prefix to the site root for assets
(`` at the root, `../` one level down); `{{CUR:<href>}}` expands to
` aria-current="page"` on the one top-level item matching the page's declared
current key and to nothing on the others.

In each page the generated block is fenced, and the fence carries that page's
current key:

```html
<!-- @shared-header current="/new-zealand" · generated from /site/_header.html — do not hand-edit -->
…header markup…
<!-- /@shared-header -->
```

The sync replaces everything between the fences (or, on a page not yet folded in,
the bare `site-header` element), and adds `nav.js` if the page is missing it.

**Folded in so far — the 22 pages under `/jobs/` (23 August 2026).** They were
the worst case: the header was hand-maintained on all 22, so any nav change had
to touch all 22, and **21 of them never loaded `nav.js` at all** — the mobile
hamburger was inert on every profession page. Both are fixed. The remaining
~400 pages still carry hand-maintained headers; fold each batch in as it is next
edited, never as a separate mass rewrite.

Whatever changes here must change in `components/site/nav-data.js`
(`PRIMARY_NAV`) too — the two are the same seven items and must not drift.

Simplified 22 Aug 2026 (451 pages in one pass). Removed from the header: Home (the brand mark does that job), the six-step journey mega-menus, the fourteen individual profession links, and the Employers/About sub-menus. The journey remains a content framework inside the country hubs; professions are reached via the country hubs and /jobs; Insights sits under For Employers and in the footer.

Dropdowns added 22 Aug 2026, in the same pass as the product split below. Markup is `<div class="navitem has-sub">` — `.navitem` drives the CSS in shell.css, `.has-sub` drives nav.js's mobile tap-to-expand. **Both classes are required**; either alone silently half-works. The panels are:

- **Australia** → Working in Australia · Find your profession (`#professions`) · Explore destinations (`#destinations`)
- **New Zealand** → the same three, on `/new-zealand`
- **Plan Your Move** → Your plan (`/move`) · Guides & resources (`/resources`) · Registration pathway checker
- **About** → About Ethicare · Insights

### Two products, deliberately separate

- **`/move` — Ethicare Move.** The bespoke plan. Five answers, saved in the browser, then a six-step journey and the tools filtered to your profession, destination and stage. "Plan Your Move" in the header points HERE.
- **`/resources` — Guides & resources.** The library: every guide in one place, 50 tiles grouped by the same six steps, with search, six area chips and a country filter.

They were briefly merged under one name ("Ethicare Move") and split again on 22 Aug 2026 — the library and the personalised plan are different jobs and candidates arrive wanting one or the other. Both run the **same six steps** used throughout the site: Deciding · Registration & pay · CV & interviews · Visas · Preparing to move · Settling in. `move.js`'s `journey()` was folded from seven stages to those six (the standalone "The offer" stage now sits inside Registration & pay, matching where `negotiating-your-offer` lives in the library). If you change the six anywhere, change them in `site/resources.html`, `site/move.js` and the country pages' guides sections together.

`components/site/nav-data.js` holds `PRIMARY_NAV` as the single source of truth. Change it and the page shell together, never one alone. Changing a top-level item means changing every page — it can be re-injected across all pages in one pass.

## Structure

```
site/
  index.html                Home
  about-ethicare.html       About (single page, sectioned)
  employers.html            For employers
  contact.html              Contact form (Netlify Forms)
  apply.html                Candidate registration + CV upload
  submit-a-vacancy.html     Employer vacancy form + JD upload
  thank-you.html            Form success page
  404.html                  Not-found page
  new-zealand.html          NZ hub · australia.html AU hub
  guides/<slug>.html        Guides (/guides/{country}-{topic})
  jobs/<slug>.html          Profession pages (/jobs/{role}-{country})
  destinations/             Region & relocation guides + landings
  insights/<slug>.html      Insights & employer toolkit
  assets/                   images, og images, favicon
  site.css site.js          shared shell
  netlify.toml _redirects robots.txt sitemap.xml
```
