# Ethicare Resourcing — titles audit

Every browser title, H1, eyebrow and section heading on the 486 live pages, read
against the content beneath it. Two questions: does it read in plain English, and
does it say what the page actually contains.

## The short version

The writing is in good shape. Across 486 titles and 1,482 section headings, only
ten contain the kind of empty word a reader skims past. No two pages share a meta
description. The destination guides — 297 chapters — are consistent and plain
throughout, and need nothing.

The problems cluster in one place: **the profession pages**. Their headline is a
slogan and their subtitle is the fact, and it should be the other way round.

---

## 1. The profession pages open with a slogan instead of a fact

On most profession pages the H1 says how the job feels and the line beneath it says
what is actually true. The second line is the better headline.

| Page | H1 today | The line under it |
| --- | --- | --- |
| Physiotherapist NZ | Physiotherapy careers, redefined. | In a system that works differently. |
| Sonographer AU | Sonography, with room to breathe. | A large, mobile market, high scan volumes, and a life beyond the department. |
| Sonographer NZ | Sonography, with autonomy and adventure. | Very high demand, autonomous scanning, and a life beyond the department. |
| Psychologist NZ | Psychology, where your work has room to breathe. | Strong demand, real autonomy, meaningful caseloads. |
| Occupational Therapist NZ | Occupational therapy, with room to do it properly. | Autonomy, manageable caseloads, a system that backs rehab. |
| Nuclear Medicine AU | Molecular imaging, room to grow. | SPECT/CT and PET/CT, a specialist register, and a life beyond the department. |
| Radiographer AU | Imaging that takes you anywhere. | Strong demand, modern departments, and a national registration that travels with you. |
| Radiation Therapist AU | Take your radiation therapy career somewhere new. | Modern linac fleets, opportunities across Australia and plenty to discover beyond the bunker. |
| Consultant Radiologist AU | Exceptional radiology, an exceptional life. | A large public and private market, genuine sub-speciality scope, and the lifestyle to go with it. |

**"Room to breathe" / "room to grow" / "room to do it properly" appears on four
pages. "A life beyond the department" appears on three.** A clinician comparing two
of your profession pages will notice.

### The site already has the better pattern

These headlines tell a reader something they didn't know, in plain words. They are
the model:

- *Radiographers in New Zealand register as medical imaging technologists.*
- *The posts at this level are rarely advertised.* (RMO / registrar NZ)
- *The list is the same. The register is not.* (Theatre AU)
- *A registered profession here. Which is not true everywhere.* (Theatre NZ)
- *One registration. Eight health systems.* (Medicine AU)
- *Anaesthesia, and a list that finishes.*
- *A midwife-led system, and a consultant role built around it.* (O&G NZ)

One caution: *One registration. Eight health systems.* (Medicine AU), *One register.
Eight employers.* (Nursing AU) and *Two systems. One family.* (Allied health AU) are
three pages using the same counting construction. Two is a pattern; three is a tic.

### Worked example

Physiotherapist NZ currently says *"Physiotherapy careers, redefined."* The page
itself says registration with the Physiotherapy Board is straightforward for most
internationally trained physiotherapists, and that steps 1–7 of the APEX scale rise
automatically each year. Either of those is a stronger opening than "redefined".

---

## 2. Four headlines that say nothing

| Page | Headline | The trouble |
| --- | --- | --- |
| `move-steps.html` | Imagine the possibilities | The vaguest line on the site. Its own browser title says something completely different — *"Ethicare Move — start where you are"* — which is better. |
| `guides/why-people-move.html` | Could life look different? | The page is specifically about what people gain, trade and miss. Its own subtitle says so: *"Why healthcare professionals move to Australia or New Zealand — and what they say they miss."* That is the headline. |
| `jobs/allied-health-australia.html` | Two systems. One family. | Accurate once you read the next line (half register through national boards, half don't) but meaningless on its own, including in search results. |
| `guides/australia-community.html` | A curated directory to help you belong | "Curated" is the only genuinely corporate word in 1,482 headings. |

---

## 3. "Living & thriving" — six uses, and the pair doesn't match

- `guides/living-in-australia.html` — H1 *Living & thriving in Australia*
- `guides/living-in-new-zealand.html` — H1 *Living & thriving* (no country)

The New Zealand page drops the country while its Australian twin keeps it. The same
mismatch appears in the community pair: *Finding your people in Australia* against
*Finding your people*. Whichever wording you prefer, the two countries should read
the same.

"Thriving" also appears as a section heading on both relocation guides.

---

## 4. Three different headings for the same thing

The site asks the reader's questions under three names:

- *The things people ask us first* — 19 pages
- *Frequently asked* — 21 pages (and it's an incomplete phrase)
- *The questions we are asked most* — 8 pages

Pick one. *The things people ask us first* is the most human of the three and the
most like the rest of your voice.

Similarly, *Final thoughts* closes seven pages and says nothing about what is in it.

---

## 5. One heading only a local will understand

`destinations/geelong/food.html` — **"Food, Pako & the everyday"**. Every other guide
in the set names something a newcomer can picture: *Food, coffee & the everyday*,
*Food, wine & the everyday*, *Food, the market & the everyday*. "Pako" is Pakington
Street, which a radiographer in Manchester has no way of knowing. The chapter is for
people who have never been to Geelong.

---

## 6. A URL that promises the wrong chapter

`insights/irt-registration-credentialing.html` is about building a recruitment
pipeline. Its heading, its browser title and the toolkit's own index all correctly
call it *"A recruitment programme"* — only the web address still says
"registration-credentialing". Anyone who shares the link sends a colleague something
that looks like a registration page. Worth a redirect before launch.

While you're in the toolkit: chapter 06 is *Induction & belonging* and chapter 07 is
*Retention & belonging*. Two chapters, one word.

---

## 7. An unfinished story page

`insights/amal-and-sandra-wellington.html` is a 394-word skeleton. Three of its
section headings read literally **"[Headline in their words]"**, and the body carries
notes to the writer — *"To add: Sandra: why she decided to leave the NHS, and what
she worried about."* Nothing links to it, which is why it hasn't surfaced, and it
should stay unlinked until Amal and Sandra's words are in.

*(The square brackets in `guides/negotiating-your-offer.html` — "Based on my
experience in [area]… closer to [figure]" — are deliberate. That's a script the
reader fills in. No action.)*

---

## 8. Consistency, in the machinery

Not plain-English problems, but they show:

- **Two separators in browser titles.** Destination chapters and the `guides/nz/`
  pages use `·`; everything else uses `|`.
- **Title Case against sentence case.** *Build Your CV*, *CV Checker*, *Cost of
  Moving Calculator*, *Registration Pathway Checker* and most Australian profession
  pages use Title Case; the rest of the site uses sentence case.
- **259 browser titles run past 65 characters** and will be cut off in Google. The
  longest is 107.
- **106 meta descriptions run past 170 characters** and will be cut off too. The
  registration guides are the worst, at 280–326.

---

## What I'd fix before launch, in order

1. The nine profession headlines, and the repeated "room to…" and "life beyond the
   department" phrasings.
2. *Imagine the possibilities* and *Could life look different?* — both have a better
   sentence already sitting underneath them.
3. The `irt-registration-credentialing` URL.
4. One name for the FAQ heading.
5. "Pako".
6. Match the Australia and New Zealand pairs to each other.

Everything else — the separators, the capitalisation, the over-long titles — is worth
doing but nobody is going to bounce off the site because of it.
