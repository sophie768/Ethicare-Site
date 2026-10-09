# Destination + guide URL fix — what changed, and the tidy-up

344 files written to `C:\Users\sophi\Ethicare-Site`. Nothing was overwritten and nothing
was deleted — every file is new. **The site works correctly as soon as you commit,
whether or not you do the tidy-up at the bottom.**

---

## What was wrong

Two faults of the same kind: files sitting at one address while every link and every
canonical tag pointed at another.

**The destination guides.** 33 guides — 330 pages — were unreachable.

```
the site linked to        the file was at
/destinations/brisbane-australia          destinations/Brisbane_Destination_Guide.html
/destinations/brisbane-australia/welcome  destinations/brisbane/welcome.html
```

**Eight New Zealand guides.** 339 links across the site pointed at `/guides/renting-in-new-zealand`,
`/guides/te-ao-maori-at-work`, `/guides/driving-and-licences` and five more. The files were
in `guides/nz/`. Each one declared the `/guides/` address as its own canonical, so again:
the file was in the wrong place, not the links.

Together that was **694 broken links** — most of the site's best content, unreachable.

---

## What I did

Copied every file to the address it already claimed, fixing the relative paths that changed
with the depth:

| | Files |
| --- | --- |
| `destinations/<slug>-<country>/` — 9 chapters each | 297 |
| `destinations/<slug>-<country>/index.html` — the guide landing page | 33 |
| `chapter.css` for Bunbury, Bundaberg, Geelong, Mandurah | 4 |
| `destinations/new-zealand-relocation-guide.html`, `destinations/australia-relocation-guide.html` | 2 |
| `guides/` — the eight New Zealand guides | 8 |

Path changes made, all verified in a browser:

- Guide landing pages moved one level deeper, so their `../assets/…`, `../shell.css` and
  inline `background-image:url('../assets/…')` references became root-absolute `/assets/…`.
  Root-absolute is deliberate here: these pages are served at a directory address, where a
  relative path resolves differently with and without a trailing slash.
- The four per-guide `chapter.css` files: the chapters referenced them absolutely
  (`/destinations/bunbury/chapter.css` → `/destinations/bunbury-australia/chapter.css`), the
  landing page relatively (`bunbury/chapter.css` → `chapter.css`).
- The eight New Zealand guides moved one level shallower, so `../../` became `../`.

**No content changed.** Not a word.

---

## Verification

I crawled every `src` and `href` on all 486 pages against the new file layout — 67,735
references.

```
before   694 broken links into destination and guide pages
after      0
```

Then loaded 80 pages in a real browser and watched every network request: all 33 guide
landing pages, a chapter from each guide, and the eight moved guides. **Zero failed
requests, zero images that didn't render, zero stylesheets that didn't load.**

The only broken references left on the site are unrelated: **22 PDF downloads that were
never created** — linked 55 times from the registration guide pages (`ethicare-mrtb-registration-guide.pdf`,
`GP_MCNZ_Registration_Guide.pdf` and so on). `assets/downloads/` contains seven files, none
of them PDFs. That's a content gap rather than a path fault, and worth deciding on before
launch: create them, or remove the links.

---

## The tidy-up (optional, do it whenever)

I can write files to your computer but not delete them, so the old copies are still there.
They are harmless — nothing links to them, and each one declares the new address as its
canonical, so search engines are told where the real page is. But they double the size of
the repo and they'll confuse anyone reading it later.

In File Explorer, under `Ethicare-Site\destinations`, delete these **33 folders** — they are
the ones *without* a country on the end:

```
adelaide          darwin        hobart            northland          southland
auckland          dunedin       mandurah          palmerston-north   sydney
bay-of-plenty     geelong       melbourne         perth              tasmania
brisbane          gisborne      nelson-tasman     queensland         victoria
bunbury           gold-coast    new-south-wales   south-australia    waikato
bundaberg         hawkes-bay    newcastle         western-australia  wellington
canberra          central-otago christchurch
```

Careful with two of them: delete `south-australia`, **keep** `south-australia-australia`.
Same for `western-australia` and `western-australia-australia`.

Then delete these **35 files** in `destinations\`: all 33 named `*_Destination_Guide.html`,
plus `Moving_to_New_Zealand.html` and `Australia_Relocation_Guide.html`.

And in `guides\nz\`, delete these eight — **keep `bringing-pets-and-belongings.html`**, which
is correctly placed:

```
aotearoa-in-short.html    money-tax-and-banking.html    te-ao-maori-at-work.html
before-you-leave.html     relocation-checklist.html     your-first-month.html
driving-and-licences.html renting-in-new-zealand.html
```

If any of it goes wrong, discard the changes in GitHub Desktop and nothing is lost.

---

## Two other things I noticed

- **`destinations/bay-of-plenty-images/`** holds two photographs that nothing on the site
  references. Either wire them in or delete the folder.
- **`home-router.html`** is a second copy of the homepage, unlinked, declaring `/` as its
  canonical — including its own copy of the Ask Ethicare block. It will drift from the real
  homepage. Worth deleting unless it's there for a reason.
