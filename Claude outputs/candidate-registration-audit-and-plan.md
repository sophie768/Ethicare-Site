# Candidate registration — audit of what exists, and a phased plan

Written against your brief of 25 September, answering §31's twelve questions before
proposing anything. Nothing was built to produce this.

**Two headlines.**

1. **Phase 1 is largely built already**, under the name `/apply`. Supabase, a candidates
   table, versioned consent records, separate employer-visibility opt-in, optional CV,
   upsert on email. The brief reads as greenfield and isn't.
2. **The endpoint that writes candidate records is open to the internet.** That is a
   pre-launch fix and it sits ahead of everything on your list.

---

## Part 1 — The audit (§31, in order)

### 1. Authentication and user accounts

**None, and that was a deliberate decision with a rationale already written down.** From
`move.js`:

> *"LINK-BACK, not accounts. A plan given a URL rather than a login… This is the two-hour
> stand-in for accounts, not a replacement for them — it proves the demand rather than
> guessing at it."*

A Move plan travels as whitelisted fields base64'd into `?p=`, restoring on any device with
no backend. The `/pack/<slug>` candidate spaces work the same way: the link is the
credential, protected by `netlify.toml` with `noindex, nofollow, noarchive`,
`Cache-Control: private, no-store` and `Referrer-Policy: no-referrer`.

This matters for your §8 and §9, which describe a profile people return to and update.
That needs either real accounts or an explicit decision to keep the link-credential
pattern. **It is the biggest unstated question in the brief**, and the existing code has
already taken a position on it.

### 2. Database and storage

**Supabase**, reached over its REST API from `netlify/functions/capture.js` with the
service-role key held in Netlify environment variables. Four tables:

| Table | Written by | Key |
| --- | --- | --- |
| `candidates` | `/apply` | upsert on `email` |
| `consent_events` | `/apply` | one row per grant, versioned |
| `leads` | any page, via `EthicareCapture.lead()` | insert |
| `plans` | Move | upsert on `email` or `anon_key` |

`candidates` already holds: full_name, email, phone, country_residence, nationality,
profession, specialty, years_experience, destination, preferred_areas (array),
registration_stage, relocate_timeline, relocating_with, dependents, source, heard_about,
referral_source, cv_filename, last_contact_at, `raw` (the whole submission) and a
`public_ref`.

**That is your §5 and nearly all of §23's filter list, already in place.**

### 3. Candidate and contact forms

`/apply`, `/contact`, `/submit-a-vacancy`, `/request-a-guide`, `/move-steps` (guide pack),
`/pathway-checker` (emailed result), the webinar page, and inline page feedback. All post
to Netlify Forms; `/apply` additionally POSTs to `capture.js`, described in its own comment
as *"the queryable record on top"* — a sound belt-and-braces design, because if the
Supabase write fails Netlify Forms has still caught the lead.

`/apply` is titled **"Register your interest & send your CV"** and carries 25 named fields.

### 4. CV upload

**Exists.** `<input type="file" accept=".pdf,.doc,.docx">` on `/apply`. The file itself goes
to Netlify Forms; Supabase stores only `cv_filename`. So the CV and the candidate record
live in two different systems with only a filename joining them — worth knowing before
§19's employer summary is designed.

### 5. Ask Ethicare

Covered in the previous audit. No retrieval, no profile, no persistence between visits.

### 6. Vacancy data model

`jobs/jobs-data.js` — a hand-maintained JavaScript array, 27 roles, with profession,
country, location, types, posted date, optional pin and closing date, and a detail-page
path. Its own header says *"ATS later."*

### 7. Analytics

`analytics.js` exposes a single `track(name, props)` over Plausible custom events, and
states: *"No cookies, no identifiers, no personal data."* It already anticipates your §22
— it is written so a second transport (a Postgres events table) can be added without
changing a single call site.

### 8. Privacy and consent

`consent_events` records the **exact label shown** plus a version string, per grant, with
employer visibility as its own separate opt-in. That is §18 built properly. Plus
`/privacy-policy`, `/how-we-use-your-information`, and the Ask Ethicare AI disclosure.

### 9. Serverless architecture

Four Netlify functions: `ask-ethicare` (LLM proxy), `capture` (Supabase writes),
`send-pack` and `send-result` (Resend email). `send-result` is deliberately narrow — it
accepts four fields and no arbitrary recipient — and says so, citing the Ask Ethicare
mistake as the thing it is avoiding.

### 10. Netlify configuration

`publish = "."`, functions directory declared, www→apex redirect, the Australian
profession redirects, security headers site-wide, `noindex` on `/_forms`, `/prototypes`
and `/thank-you`, and the `/pack/*` block described above.

### 11. Existing candidate records

The `candidates` table, plus hand-built `/pack/<slug>` private spaces and
`your-ethicare-space.html`, a noindex worked example using a fictional candidate.

### 12. Security — the finding that matters

`capture.js` has **no origin allowlist, no rate limit and no bot check**:

```js
const CORS = { 'Access-Control-Allow-Origin': '*', … };
// handler: OPTIONS → 204 · POST only · parse JSON · write to Supabase
```

Anyone who can see the site's JavaScript can POST to
`/.netlify/functions/capture` from anywhere and write rows into `candidates`, `leads` and
`plans`. There is no authentication because there is no user, which is correct — but there
is also nothing stopping a script inserting ten thousand rows, or poisoning the table you
are about to build a recruitment workflow on. The `bot-field` honeypot lives on the form,
not on the endpoint.

`ask-ethicare.js` already solves exactly this, in the same codebase: an `ALLOWED` origin
list, a body-size cap and a per-IP burst limiter. **The fix is to apply that pattern to
`capture.js`** — roughly thirty lines, lifted from a file that already works.

I'd do this before anything in your brief. Everything else adds capability to a door that
is currently unlocked.

### Two documents the code cites but the repo doesn't contain

`analytics.js`, `site.js` and `cost-calculator.js` all reference
**"Ethicare Candidate Database Spec.md"** and **"Ethicare Analytics Spec.md"** as the
authority for the data model and the fixed list of fifteen events. Neither is in the
repository. If they exist elsewhere they should govern this work — your brief may already
be answered, or contradicted, by them.

---

## Part 2 — Three decisions before Phase 1

**(a) One front door or two.** "Register your interest" and `/apply` would write the same
table. Two doors means two funnels, two sets of copy, and a candidate who has done one
being asked to do the other. I'd reshape `/apply` — its 25 fields are at odds with your own
§32 — rather than build alongside it. Your §5 short form is the better version of what is
already there.

**(b) Links or accounts.** §8 and §9 need a return path. The codebase has chosen
link-as-credential twice already and documented why. Extending that is days; real accounts
are weeks and a much larger security surface. I'd stay with links until someone asks for a
login, which is what that comment in `move.js` was designed to find out.

**(c) Where the CV lives.** Netlify Forms today, joined to the candidate record by filename
only. If §19's employer summary is ever going to exist, the CV needs to live with the
record, in Supabase Storage with access control — and that decision changes the retention
and deletion answers too.

---

## Part 3 — The phases

### Phase 0 — before anything (days)

- Lock down `capture.js`: origin allowlist, body cap, per-IP limit, server-side honeypot.
- Agree a **retention period** and build the deletion path. A "more than 2 years" timeframe
  means holding a named clinician's CV for years; this is far harder to retrofit onto data
  you have already accumulated than to build now. Your §25 lists it; I'd promote it.
- Find the two spec documents.

### Phase 1 — Register your interest (1–2 weeks)

Reshape `/apply` into your §5 short form and §27's steps: about you → profession →
destination → timeframe → registration → CV, optional. Add proper `source` capture at
render time — hard-coded `source: 'apply'` today, which cannot answer §22's question about
which part of the platform generates relationships. Replace the thank-you page with §7's
useful landing state. Take the profession list from `/jobs/professions` rather than writing
a second one.

### Phase 2 — The admin view (days, and the highest value per hour on the list)

A filtered list of registrations. You are currently reading Netlify Forms emails and
querying Supabase by hand. This is the item that changes your week, and it is §22, buried
two-thirds down the brief.

**Resist letting it grow into a CRM.** §19 and §23 describe an ATS. Keep the data clean
enough to export into a real one when volume justifies it.

### Phase 3 — Return and update

Whichever answer (b) gets. Signed links over `public_ref` if links; a proper auth provider
if accounts. This is also where §9's completion prompts belong.

### Phase 4 — Ask Ethicare personalisation

Only after the retrieval work in the other plan. Profile fields passed as structured data
the way job titles already are — never the CV, per your §26.

### Phase 5 — Consent-gated employer sharing

The `consent_events` model already supports it. What's missing is the per-opportunity grant
("we'd like to put you forward to X for Y") and the interface to capture it.

---

## What I'd leave out

**§11 — Ask Ethicare writing to the profile — I'd drop rather than defer.** It needs
consent UX, an audit trail separating AI-inferred data from stated data, and confidence in
the extraction. You already hedge it. Make it a no until something forces the question.

## One thing that isn't in the brief

Nothing says what happens *after* someone registers. On a site whose voice is *"we'd rather
lose a placement than see you land in the wrong life"*, a registration that goes unanswered
for a fortnight is a broken promise. I'd put a response window on the confirmation screen
and hold to it. That costs nothing to build and is worth more than most of Phase 2.

## Where I stop

§25's cross-border position — a UK company holding CVs of clinicians in the UK, South
Africa, the UAE and India, relating to moves to New Zealand and Australia — is specialist,
and I am not a lawyer. I can structure the data so the answers are implementable. The
lawful basis, the retention periods and the international transfer position should come
from someone qualified before you store CVs at any volume.
