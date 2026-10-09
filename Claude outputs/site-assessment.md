# Ethicare Resourcing — site assessment

486 live pages, assessed on content, brand, design, usability, accessibility and
performance. Two changes were made while assessing: 64 oversized images were optimised,
and the findings below are otherwise untouched.

---

## Overall: 7.5 / 10 — and one thing standing between it and 9

This is a better site than most healthcare recruiters have, by a distance. The writing is
the strongest asset, the design system is coherent, and the tools are genuinely
differentiated. It is held back by one structural fault that has to be fixed before
launch, and a handful of things that are merely unfinished.

| | Score | One-line verdict |
| --- | --- | --- |
| Content quality | **9** | The best thing about the site. Honest, specific, unusually well written. |
| Brand positioning | **8.5** | Clear, credible, differentiated. Slightly diluted in places. |
| Design system | **8** | Consistent and calm. A few legacy pages sit outside it. |
| User journey | **7** | Well thought through, but the destination section is unreachable. |
| Accessibility | **8** | Solid fundamentals, no audit-level testing done. |
| Performance | **7** | Was 4. Fixed the worst today; card images still oversized. |
| Technical health | **4** | The URL fault below. Everything else is clean. |

---

## The blocker

**Every destination guide is at the wrong address, and nothing links to where the files
actually are.**

The site links to, and declares as canonical:

```
/destinations/brisbane-australia          ← the guide landing page
/destinations/brisbane-australia/welcome  ← its nine chapters
```

The files on disk are at:

```
destinations/Brisbane_Destination_Guide.html   ← this IS the landing page
destinations/brisbane/welcome.html             ← these ARE the chapters
```

The evidence that this is a misplacement rather than a design choice:
`Brisbane_Destination_Guide.html` declares its own canonical URL as
`/destinations/brisbane-australia`, is titled "Brisbane Relocation Guide", and links to
all nine chapters at `/destinations/brisbane-australia/…`. Every chapter page does the
same. The whole site agrees on an address structure that no file sits at.

**Consequence:** 158 pages link into the destination section and every one of those links
404s. That is 297 chapter pages plus 33 landing pages — the largest and best part of the
site — currently unreachable from anywhere, and every canonical tag pointing at a dead
URL.

**The fix is a rename, not a rewrite.** For each of the 33 guides:

```
destinations/brisbane/              →  destinations/brisbane-australia/
destinations/Brisbane_Destination_Guide.html
                                    →  destinations/brisbane-australia/index.html
```

Nothing inside any file needs to change — the links and canonicals are already correct.
I have not done this because renaming 33 directories and moving 34 files is a structural
change you should approve, and because if any of those URLs are already indexed the old
paths need redirects.

---

## Content quality — 9

**The writing is the reason this site will work.** It does the thing almost no recruitment
site does: it tells people what is difficult.

- *"Some moves shouldn't happen. If the scope, the pay maths or the family logistics don't
  stack up, we'll say so plainly. We'd rather lose a placement than see you land in the
  wrong life."*
- *"We used to print a weekly rent and a monthly budget table here. We have taken them
  out. A figure that was true when a page was written is misleading a year later."*
- *"If what you find contradicts the judgement on this page, tell us. We would rather
  correct the page than defend it."*

That is a distinct editorial voice with a point of view, and it is sustained across 486
pages. Section headings like *"What we can't promise"*, *"What actually matters, in five
minutes"* and *"The things people ask us first"* are better than the industry norm by a
wide margin.

**Evidence it holds up under inspection:** across 1,482 section headings and 486 titles,
only ten contain a hollow corporate word. No two pages share a meta description. Within-page
repetition is almost nil — five instances site-wide.

**Where it slips:**

- The South Australia guide is the Adelaide guide with the first word swapped — it still
  says *"Adelaide eats above its weight"*. Hobart and Tasmania share 53% of their text,
  including a first-person line about kunanyi, Hobart's mountain, on the Tasmania page.
- The Australian pets guide is 94% identical to the New Zealand one, and tells readers to
  check New Zealand's Ministry for Primary Industries — the wrong regulator, on the wrong
  country's page, with no link to Australia's own.
- Cost-of-living chapters are 69% shared text against 91–98% for every other chapter type.

---

## Brand positioning — 8.5

**The proposition is clear and it is defensible.** Three things do most of the work, and
all three appear above the fold on the homepage:

> Founded by a former **NHS transformation manager** · **Clinical oversight** from senior
> NHS consultants · **Never a fee** to a candidate

And the strapline underneath the headline: *"Independent tools, guidance and specialist
recruitment for healthcare professionals — **whether or not your job comes from us**."*

That last clause is the whole positioning in nine words. It reframes the site from a job
board to a resource, and it earns the right to all the guide content. The founder's NHS
background answers "why should I trust you", which is the first question a clinician asks
of any agency.

**What dilutes it:**

- The site is trying to be four things at once — a career guide, a relocation planner, a
  destination magazine and a job board. Each is good. A first-time visitor has to work out
  which one they're on.
- "Ethicare Move" is a genuinely differentiated product — a relocation planner that
  remembers where you are — but it sits behind a nav item called "Move" that gives no clue
  it's a tool rather than a content section.
- The employer proposition is strong and almost invisible: one nav item, no presence on
  the homepage. If employers are a revenue stream, that's underweighted.

---

## Design — 8

**Strengths.** One typographic system (Work Sans display, Manrope body) applied
consistently. A restrained palette — teal, lime, cream — with genuine discipline: the
lime is used only as an accent rule and a badge, never as a fill. The destination hero,
the fact rail, the chapter cards and the "at a glance" statistic blocks all read as one
family. The topic marks now mean no chapter banner is ever empty.

**The photography is now consistent** — no image repeats anywhere, all portraits sit
beside body text rather than in heroes, all heroes are framed the same way.

**Weaknesses:**

- **Legacy pages sit outside the system.** The 34 `*_Destination_Guide.html` files use an
  older layout; `allied-health-australia` uses a different CSS family again (its accent
  rule is lime where every other Australian page is terracotta).
- **The CSS has accreted.** 20 stylesheets, some loaded per-page, with names like
  `au-palette-tune`, `mint-eyebrow`, `lime-eyebrow-rule` and `au-hero-teal` — several of
  which are single-purpose overrides. It works, but it's fragile to change.
- **259 browser titles run past 65 characters** and 106 meta descriptions past 170, so
  both get truncated in search results.

---

## User journey — 7

**What's well designed:** the homepage offers three honest doors — Explore New Zealand,
Explore Australia, *Not sure? Compare them*. That third door is a real insight; most
people genuinely don't know. The Move tool's "Where are you in this?" stage selector
meets people where they are rather than assuming they're ready to apply.

**What isn't:**

- The destination section is unreachable (above).
- **Depth.** Home → country → profession → chapter is four clicks before a clinician sees
  anything about their actual job, and the profession pages are 1,200–2,500 words before
  a vacancy appears.
- **"Move" is ambiguous** as a nav label — a verb, a noun, and a product name at once.
- Two strong story pages exist and nothing links to either: Rezon's is now linked, but
  **Amal and Sandra's page is a 394-word skeleton** with three headings that literally
  read `[Headline in their words]`. It should stay unlinked until it's written.

---

## Accessibility — 8

Checked, and clean:

- **1,678 images, zero missing an alt attribute.** 1,272 correctly marked decorative.
- **One H1 per page** on all 486 pages.
- **One heading-level skip** in the entire site (`jobs/index.html`, h1→h3).
- Breadcrumbs on every deep page, skip-to-content links, `aria-hidden` on decorative marks.

Not tested, and worth doing before launch: colour contrast on the lime-on-cream
combinations, keyboard navigation through the mega-menu, and screen-reader behaviour on
the cost calculator and CV checker.

---

## Performance — 7, up from 4

**Fixed today.** Five pages weighed 6–14 MB because of unoptimised photographs — one
image was 20 MB, another 14 MB at 6000px wide. I resized 64 images to a 2400px maximum
and recompressed them:

```
before   101 MB  across those 64 images
after     49 MB
saved     52 MB  (51%)

heaviest page   14.30 MB → 0.57 MB   destinations/bunbury/glance
                11.14 MB → 1.34 MB   destinations/perth/suburbs
pages over 3 MB      5  →  1
```

Median page weight is now 0.05 MB. Quality is unchanged at web sizes — I checked the
recompressed images visually.

**Still worth doing:** `destinations/australia.html` is 4.15 MB because it loads 14
full-size photographs as small cards. Serving card-sized copies would take it under
1 MB. The site also has no `sitemap.xml`.

---

## What I'd do next, in order

1. **Fix the destination URLs.** Nothing else matters until the guides are reachable.
2. **Correct the Australian pets guide** — wrong regulator, no official link.
3. **Rewrite South Australia so it is about the state**, and separate Tasmania from Hobart.
4. **Add a sitemap** and trim the over-long titles and descriptions.
5. Card-sized images for the destination index.
6. Decide what "Move" is called, and whether employers deserve homepage space.

Items 1 and 2 are launch blockers. The rest can follow you into the first month.
