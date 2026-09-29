# Files to delete from Ethicare-Site

Nothing below is linked from any live page, listed in the sitemap, or referenced by netlify.toml.
Sections 1–5 were checked against every surviving file on 26 September 2026; anything added since
carries its own date. Delete in GitHub Desktop or File Explorer, then commit.

This is the running list — when something is superseded it is added here rather than deleted
piecemeal, so it can all go in one sweep.

## 1. Superseded destination folders (33)

Bare-named twins of the live `-new-zealand` / `-australia` folders. They hold older copies of the same chapters (the live ones have had the printed-guide, absolute-link and claim fixes; these have not).

    destinations/adelaide/
    destinations/auckland/
    destinations/bay-of-plenty/
    destinations/brisbane/
    destinations/bunbury/
    destinations/bundaberg/
    destinations/canberra/
    destinations/central-otago/
    destinations/christchurch/
    destinations/darwin/
    destinations/dunedin/
    destinations/geelong/
    destinations/gisborne/
    destinations/gold-coast/
    destinations/hawkes-bay/
    destinations/hobart/
    destinations/mandurah/
    destinations/melbourne/
    destinations/nelson-tasman/
    destinations/new-south-wales/
    destinations/newcastle/
    destinations/northland/
    destinations/palmerston-north/
    destinations/perth/
    destinations/queensland/
    destinations/south-australia/
    destinations/southland/
    destinations/sydney/
    destinations/tasmania/
    destinations/victoria/
    destinations/waikato/
    destinations/wellington/
    destinations/western-australia/

## 2. Superseded single-page exports (35)

Title-cased one-page versions of each guide from before the chapter structure existed.

    destinations/Adelaide_Destination_Guide.html
    destinations/Auckland_Destination_Guide.html
    destinations/Australia_Relocation_Guide.html
    destinations/Bay_of_Plenty_Destination_Guide.html
    destinations/Brisbane_Destination_Guide.html
    destinations/Bunbury_Destination_Guide.html
    destinations/Bundaberg_Destination_Guide.html
    destinations/Canberra_Destination_Guide.html
    destinations/Central_Otago_Destination_Guide.html
    destinations/Christchurch_Destination_Guide.html
    destinations/Darwin_Destination_Guide.html
    destinations/Dunedin_Destination_Guide.html
    destinations/Geelong_Destination_Guide.html
    destinations/Gisborne_Destination_Guide.html
    destinations/Gold_Coast_Destination_Guide.html
    destinations/Hawkes_Bay_Destination_Guide.html
    destinations/Hobart_Destination_Guide.html
    destinations/Mandurah_Destination_Guide.html
    destinations/Melbourne_Destination_Guide.html
    destinations/Moving_to_New_Zealand.html
    destinations/Nelson_Tasman_Destination_Guide.html
    destinations/New_South_Wales_Destination_Guide.html
    destinations/Newcastle_Destination_Guide.html
    destinations/Northland_Destination_Guide.html
    destinations/Palmerston_North_Destination_Guide.html
    destinations/Perth_Destination_Guide.html
    destinations/Queensland_Destination_Guide.html
    destinations/South_Australia_Destination_Guide.html
    destinations/Southland_Destination_Guide.html
    destinations/Sydney_Destination_Guide.html
    destinations/Tasmania_Destination_Guide.html
    destinations/Victoria_Destination_Guide.html
    destinations/Waikato_Destination_Guide.html
    destinations/Wellington_Destination_Guide.html
    destinations/Western_Australia_Destination_Guide.html

## 3. Old document exports in assets/downloads (7)

Word-style HTML exports from before the PDF pipeline, plus the script only they use. The 48 PDFs in the same folder stay.

    assets/downloads/Emergency Medicine in New Zealand - Ethicare.html
    assets/downloads/Moving to New Zealand - Ethicare.html
    assets/downloads/Moving to New Zealand - The Master Guide.html
    assets/downloads/Welcome to Wellington - Akhil Lakhia and Sarah.html
    assets/downloads/Welcome to Wellington - Clint Biby Caitlyn and Haddin.html
    assets/downloads/Your First Year in Wellington - Akhil Lakhia and Sarah.html
    assets/downloads/doc-page.js

## 4. Old copies in guides/nz (8)

Every one has a live equivalent directly under guides/. Keep `guides/nz/bringing-pets-and-belongings.html` — that one is live and linked from 32 pages.

    guides/nz/aotearoa-in-short.html
    guides/nz/before-you-leave.html
    guides/nz/driving-and-licences.html
    guides/nz/money-tax-and-banking.html
    guides/nz/relocation-checklist.html
    guides/nz/renting-in-new-zealand.html
    guides/nz/te-ao-maori-at-work.html
    guides/nz/your-first-month.html

## 5. Orphans (2)

    home-router.html
    new-zealand-redesign.html

## 6. Renamed or superseded pages, old copy left behind (4)

The page moved and everything now points at the new path, but the old file is
still on disk. netlify.toml 301s the old URL, so nothing breaks either way —
this is just the leftover.

    can-i-work-here.html        renamed to can-i-work-there.html on 28 Sep 2026
    move-steps.html             folded into move.html on 29 Sep 2026 (see below)
    your-ethicare-space.html    the "Your Ethicare" prototype; superseded by My Move on 29 Sep 2026
    netlify/functions/send-pack.js   only move-steps called it (see below)

`move-steps.html` was the eight-stage rebuild of Ethicare Move, built alongside
the old /move and never swapped in. On 29 September 2026 /move itself became
the eight-stage page (one page, the candidate's stage open, the rest collapsed),
so the rebuild has nothing left to do. netlify.toml 301s /move-steps to /move
and the stage fragments (#s3) carry across, so any link to it keeps working.

`your-ethicare-space.html` was a noindex prototype of the private candidate area under
its old name. The real thing is `/pack/<slug>` (pack/README.md), renamed My Move on
29 September 2026 with the candidate's own writing saved with us. The prototype was in
the sitemap despite being noindex; it is out of both now.

`netlify/functions/send-pack.js` emailed a guide pack from the `/move-steps` send form,
which was the only caller. Nothing posts to it now. Deleting it removes a Resend-backed
endpoint nothing uses — the fewer of those the better. Do not confuse it with
`netlify/functions/my-move.js` (the My Move store, live) or `send-result.js` (the tools'
send-my-result, live).

netlify.toml names the old path in its 301 rule. That is the one reference that
should survive the deletion — it is what keeps the old URL working.

## 7. Stylesheets and scripts nothing loads (6)

Checked against every surviving page, script and netlify.toml on 28 September 2026,
and against the superseded folders too — none of these is referenced anywhere.

    editorial-hero.css
    prof-editorial.css
    profession.css
    reg-print.css
    capture.js
    my-move.css                 added 29 Sep 2026 — see note below

`my-move.css` styled the React workbook that used to sit at /move#doing. That
workbook's source (`my-move-planner.jsx`) is not in the repository, so the
section was already blank, and the rebuilt /move no longer loads the stylesheet.
When My Move is rebuilt as the private, link-only space it gets its own styles.

`capture.js` needs a word, because deleting it looks riskier than it is. It is a
client helper for the capture endpoint, and that endpoint is live and writing to
Supabase. But /apply posts to the endpoint directly from apply-form.js rather than
through this helper, nothing loads capture.js, and nothing calls EthicareCapture.
It is a superseded duplicate. No applications are affected.
Do not confuse it with netlify/functions/capture.js, which is the endpoint and stays.

## 8. A photograph that breaks the naming rule (1)

    assets/pn/pn-palmerston-north-new-zealand-dec-2097303247.jpg

A stock photograph of a hospital building with PALMERSTON NORTH HOSPITAL in blue
lettering across the facade. Nothing references it, so it has never been on the
site — but the filename gives no clue what it shows, and it is the only Palmerston
North building shot in the folder, so it is exactly what someone would reach for.
Delete it rather than leave the trap. Found by looking at the file, 28 Sep 2026;
the link audit reads text and cannot see signage in a photograph.

The two hospital images that ARE live — assets/clinical/hospital-emergency-sign.jpg
and hospital-corridor-trolley-team.jpg — were checked at the same time and are
fine: generic H / EMERGENCY signage and an unidentifiable corridor, no named
institution.

## Not on this list, deliberately

- `assets/social/` — three LinkedIn carousel exports. Unlinked, but they look like marketing files you may want to keep. Your call; they are not indexed either way.
- `destinations/bay-of-plenty-images/` — photography, referenced by the Bay of Plenty chapters.
- `prototypes/`, `pack/`, `_forms/` — internal, and netlify.toml already keeps them out of search.
- `my-move-model.js` — nothing loads it, but it is the data model (tasks, costs, allowances, documents, contacts) that the private My Move space will be built on. Keep it until that is done.

**96 items: 33 folders and 63 files.**

`python3 tools/audit-links.py` re-checks this list on every run and fails if a
surviving page or script still points at something on it. On 28 September 2026 it
caught `guides/nz/your-first-month.html`, which three scripts still used — Ethicare
Move’s first-thirty-days step, an Ask Ethicare answer and the already-arrived next
step. All three now point at `guides/new-zealand-first-month.html`, so the file is
safe to delete. That reference lived only in JavaScript, which is why reading the
pages never showed it.
