# Ethicare Master Brand &amp; Design System

The goal: the most **trusted** healthcare careers, relocation and workforce platform for Australia &amp; New Zealand — not the prettiest recruitment site. Two audiences: healthcare professionals (opportunities, registration, relocation, lifestyle, progression) and employers (international recruitment, workforce planning, attraction, retention).

**Brand personality:** human, premium, reassuring, experienced, honest, modern, calm, helpful. Never corporate, sales-heavy, cold, generic or transactional.
**References:** Airbnb, Apple, Stripe, Butternut Box (primary); McKinsey, Tourism NZ (secondary). Result must feel uniquely Ethicare.

## Brand colours — one hero colour, three destinations
- **Deep Teal `#02615D`** — the constant. Headings, nav, key UI, primary buttons and every hero, on all pages.
- **Accent Lime `#A6C84A`** — the logo lime. Its one systematic job is the **28px eyebrow rule on every page**, plus stats, CTAs and small highlights on master pages. Never a fill, never body type, never dominant.
- **Global pages** — soft backgrounds **Mint `#E6F1ED`**; lime + fern accents.
- **New Zealand** — accent **Fern `#72A471`** (eyebrows, icons, highlights); deeper **`#2F5E49`** wherever small text, icons or rules need contrast — it clears AA on cream, Soft Sage and Soft Sand alike. (The old `#3F7E62` is retired: it passed on cream but failed on Soft Sage at 3.98:1.) Soft backgrounds **Soft Sage `#E3ECE5`**. Each country page carries **one dark band** — a photograph under a **light** deep-teal scrim (`rgba(1,49,47,.46)` → `.80`), on the "what it's like to work here" section. The photograph must stay clearly visible: never near-opaque. The dark weight comes from imagery, never from a second brand colour.
- **Australia** — accent **Apricot `#D9A084`** — warmer and far less harsh than the old clay-red. **Clay `#A34438`** is its deep partner: hovers, small text that needs contrast, and form error states (apricot is ~2:1 on cream, so it must not carry small type on its own). (The old `#B5544A` is retired: it cleared AA on cream only, and failed on Soft Sand at 4.42:1, Mint 4.19 and Pale Eucalyptus 4.19. `#A34438` clears every brand surface.) **Apricot `#EFC3AA`** is the eyebrow and small-text variant **on dark teal only**. Soft backgrounds **Soft Sand `#F7F4EE`** (warm/human sections) + **Pale Eucalyptus `#F3F7F4`** (cool/factual sections) — warm and cool tints never adjacent, separate them with cream. Chips `#FAF7F3`, warm hairlines `#EBDFD3`. Never a flat apricot hero.
- **Neutrals** — Warm Cream `#FCFBF8` page background (avoid stark white); body text Charcoal `#333333`, muted `#555555`.
- **Lime on dark teal** uses `#C6E084`. The brand lime `#A6C84A` reaches only 3.8:1 on the teal scrim, so it fails AA at eyebrow sizes — `#A6C84A` stays the 28px rule itself, which is not text.
- **Hairlines** — the pale hairlines (`#C9DED3`, `#D6E1DA`, `#EBDFD3`) are for **card edges only**; they measure ~1.2:1 on a tinted surface and effectively vanish. Any rule the layout depends on (row separators, column rules) uses `--rule-tint` `rgba(2,97,93,.65)`, measured 3.0:1+ on every brand surface.
- **On a dark band, never use a lightening glass fill** — it raises the backdrop and silently breaks text contrast. Darken (`rgba(1,49,47,.42)`) or use no fill.

**Token system of record:** the `:root` block in `site/site.css` (mirrored in `shell.css`). Pages must not redeclare it, and `--band` must always equal that page's `--soft`.

Deep Teal is always the hero; destination accents differentiate NZ and AU and add warmth. Soft colours carry sections, cards and panels — one system, three temperatures.

## Typography
- **Playfair Display** — **hero subheading / supporting hero statement ONLY** (e.g. "Build your healthcare career. Build your life."). Nowhere else.
- **Work Sans** — main headings (H1/H2/H3, card titles, section + nav headings), weight **600 (semibold)**, colour `#02615D`. Also nav (600) and buttons (600, sentence case, never uppercase).
- **Eyebrows** — Work Sans **700**, **13.5px**, letter-spacing `.14em`, uppercase, in the destination accent: Fern (NZ + global), Apricot/Clay (AU) — preceded by a **28px × 3px lime rule `#A6C84A`** (12px gap). The rule is lime wherever a page carries one — every guide, profession, destination and country page; only the text colour changes by destination. Global pages (homepage, resources, employers, insights) use a plain eyebrow with no rule. The 28px rule is lime `#A6C84A` on every surface, dark or light; on a dark-teal or photographic hero the eyebrow **text** switches to `#C6E084` (NZ/global) or Apricot `#EFC3AA` (AU) so it clears AA.
- **Manrope** — body, 16px, `#333333`, line-height 1.7, max reading width 750px.

## Layout
Whitespace is a feature — spacious, premium, never crowded. Max page width **1200px**; reading width **700–750px**. Section padding **120px** top/bottom desktop, **80px** mobile; **120px** between major sections. Heading→copy **24px**; copy→CTA **32px**.

## Hero rules
Must fit within the first screen on desktop (who it's for, what it's about, the next action — no scroll needed). Structure: Eyebrow → Main heading (2–3 lines max) → **Playfair subheading (1–2 lines)** → supporting copy (2–3 short sentences) → CTA → visual.

## Cards
White or country card colour. Radius **20px**. Border **1px solid rgba(0,0,0,0.05)**. Padding **40px**. Subtle lift on hover; avoid heavy shadows.

## Motion
Tasteful scroll-reveal only: cards and step sequences fade and stagger up as they enter view (handled automatically by `site.js`). Respects `prefers-reduced-motion`; above-the-fold content shows instantly. No looping or decorative animation.

## Alignment
Reading content is **left-aligned** (editorial, premium). Only **closing call-to-action blocks** are centred.

## Section rhythm
Alternate backgrounds white → Warm Cream `#FCFBF8` → the destination soft (Mint `#E6F1ED` global, Soft Sage `#E3ECE5` NZ, Soft Sand `#F7F4EE` AU) for gentle variety. **Never stack two dark-teal sections back to back** — always separate teal sections with a light band.

## Imagery — image-led
Answer "what could my life look like here?" Use AU/NZ landscapes, healthcare professionals, families, communities, lifestyle moments. Avoid handshakes, corporate meetings, generic office photos, people pointing at screens.

## Page variety — avoid template fatigue
Different content, different presentation. Salary → cards; registration → timelines; relocation → process flows; lifestyle → image-led storytelling; insights → editorial; comparisons → split layouts. Consistency comes from type, colour, spacing and tone — not repeated templates.

## Page roles
- **Homepage** — inspire exploration (opportunities, lifestyle, careers, human stories); guide deeper, don't answer everything.
- **Employer pages** — strategic, credible, experienced; slightly more executive than candidate pages.
- **Country pages** — answer "could I see myself living here?" Balance careers, lifestyle, relocation, practical info.
- **Profession pages** — the core resource; relocation guides, not job adverts. Cover profession, registration, salary, opportunities, lifestyle, visas, relocation journey. **Physiotherapists (NZ) is the benchmark** for spacing, pacing, UX.
- **Insights** — editorial, genuine value; not a recruitment blog.

## Voice
Write like a trusted guide, not a recruiter pitching. Clear, natural, human. No buzzwords, recruitment jargon or corporate clichés. If it sounds like generic recruitment copy, rewrite it.

## Final test (before publishing any page)
Premium? Human? Useful? Trustworthy? Unmistakably Ethicare? If not, simplify and return to the principles.


## Homepage entry pattern — three doors (added 26 Aug 2026)
The page opens on the candidate's three questions, not on us: *Is this the right country for
us?* → the comparison guide · *Could I actually work there?* → the pathway checker · *What
could I move to?* → live roles. Questions set in **Playfair italic** (the hero's emotional
register, and the one place outside the hero it is permitted), answer in Manrope, action in
Work Sans 600 with a lime arrow, and a proof line last. Cards are white, `--r-lg`, 1px mint
border with a **3px fern top rule** — never a left-border accent. A live count in the proof
slot is read from `jobs-data.js` at runtime, never typed.

Immediately below, one **dark teal band** carries the fourth stage: *Already decided? You
don't need us to have placed you.* One dark band per page still holds — this is it on the
homepage, so no other section may take deep teal as a full-bleed ground.

## Form standard (added 26 Aug 2026)
Audited across twenty form files; all five of these were absent site-wide.
- **Every error is programmatically attached.** `aria-invalid="true"` on the control,
  `aria-describedby` pointing at the message, `role="alert"` on the message. A visible error
  that assistive tech cannot reach is not an error message.
- **Failed validation moves focus** to the first control that failed. Scrolling alone leaves
  keyboard and screen-reader users beside the button they just pressed.
- **Never truncate an error list.** "and more" tells someone they are stuck without telling
  them where. List everything outstanding, and mark the question itself — clay `#A34438` 3px
  rule on `#FAF7F3`, with a text label so the state is not carried on colour alone.
- **Errors clear on correction, in the same render.** Filter any remembered error keys through
  a live re-check; a marker that outlives the problem is worse than the banner it replaced.
- **The error summary gets full container width, above the buttons** — not a narrow
  right-aligned slot beside them, which was sized for a truncated string.
- **`inputmode` on every `tel` and `number` field.** Without it a phone field opens an
  alphabetic keyboard, and much of this audience applies from a phone.
- **Give every question a "not sure" answer** where one is honest. It is the difference
  between a form someone finishes and a form someone abandons.
