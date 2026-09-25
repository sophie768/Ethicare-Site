# Ask Ethicare — audit of what exists, and what to build next

Written against your brief of 25 September. Part 1 is the audit you asked for in §34;
nothing was rebuilt to produce it. Part 2 is the proposed architecture. Part 3 is what
I'd do first, and what I'd deliberately not do yet.

**The headline.** Ask Ethicare is better engineered than I expected and worse informed
than you probably think. The plumbing is sound — the prompt is server-side, the endpoint
is hardened, the routing cards work, the refusals are thoughtful. But there is **no
retrieval of any kind**. The assistant answers from the model's general knowledge,
shaped by about twenty-five prompt rules. It has never read one of your 486 pages.

That single fact is what separates where it is from your §8 and §11.

---

## Part 1 — What is actually there

### The shape of it

```
browser                          Netlify function                  model
─────────────────────────        ────────────────────────────      ──────────────
ask-ethicare.js       ──POST──►  netlify/functions/                claude-sonnet-4-5
  • the UI                       ask-ethicare.js                   (gpt-4o fallback)
  • {messages, jobs}               • owns the system prompt
  • markdown-lite render           • origin allowlist
  • NEXT_ACTIONS parsing           • rate limit, size caps
                                   • wraps jobs as data
ask-ethicare-knowledge.js
  • id → {title, blurb, url}
  • 44 resources, render only
```

Three files, one endpoint, one model call per question. No database, no index, no
retrieval step, no server-side session.

### What is genuinely good, and should survive any rebuild

**The security posture is correct, and it was earned.** The code carries a note that the
browser used to send the system prompt, which meant anyone could POST their own and use
your endpoint as a free LLM on your account with every guardrail removed. That is fixed
properly: the browser sends only `messages` and `jobs`, a `system` key in the payload is
ignored rather than merged, and the key lives only in Netlify environment variables.
There is an origin allowlist, a 24 KB body cap, a 12-turn history cap, a 4,000-character
per-message cap, and a 12-request-per-minute per-IP limiter — which honestly describes
itself as in-memory and therefore no defence against a distributed flood.

**Job titles are treated as data, not prose.** The browser sends title and country only,
capped at 24; the function re-sanitises them, strips newlines, truncates, and writes the
surrounding wording itself. Nothing the browser sends can change how the model is
instructed. This is the right pattern and it should be how every future data source is
fed in.

**The refusal rules are the best part of the prompt** and they already encode most of
your §17 and §18:

> *"NEVER tell someone what to do… you do not tell anyone whether to move, whether to
> accept an offer, or which country to choose."*
>
> *"Never suggest a move would give someone's children a better life… you cannot know that."*
>
> *"'Neither country is right for me at the moment' and 'I want to wait' are successful
> outcomes of talking to you; treat them as such, with no disappointment and no
> counter-argument."*

It also already carries the Australian medical imaging distinction you'd want — MRPBA
registration, ASMIRT skills assessment for migration, and a state radiation-use licence
as three separate things that must never be merged, with sonographers as the ASAR
exception. And it enforces the employer rule: Health New Zealand / Te Whatu Ora is the
only employer it may name.

**The NEXT_ACTIONS mechanism is defensive in the way experience makes you.** The model
is asked to end every reply with a control block; the parser matches it loosely because
models return it bolded or indented, then scrubs any residue — but only from a trailing
run, because three of the ids are ordinary words (`jobs`, `professions`, `apply`) and an
earlier version deleted a legitimate "**Jobs**" heading out of the middle of a good
answer. Unknown ids are dropped rather than thrown on. That is someone who has watched
it fail and fixed it properly.

I checked the two resource lists that the comments warn must be changed together — the
server's `RESOURCES` and the browser's `KB.resources`. **They are in sync: 44 ids each,
and all 44 URLs resolve.** No drift today.

### What is hard-coded

| | Where | Consequence |
| --- | --- | --- |
| The entire system prompt (~25 rules) | `netlify/functions/ask-ethicare.js` | A wording change is a code deploy |
| The 44-resource routing map, twice | function + knowledge file | Must be edited in two places, by hand |
| Dated facts — **one entry** | `FACTS` array | This is the whole freshness mechanism |
| Suggested questions | inline in each page's HTML | Identical on homepage and /ask; your §23 wants them per-page |
| Live vacancies | `jobs/jobs-data.js`, 27 roles, hand-maintained | Fine for now; it is a real file, not invented |

### How answers are generated — the finding that matters

One call. The function assembles a system prompt (rules + the 44 resource ids + a
sanitised list of live job titles), appends the conversation, and sends it. The model
replies. There is no step in between where anything is looked up.

So when someone asks *"what registration do I need as a UK MRI radiographer in
Australia"*, the answer comes from the model's training data, fenced by your prompt
rules. It does not come from your Australian registration guide, and it does not come
from Ahpra.

Against your knowledge hierarchy in §11, the current system runs almost entirely on
level 5 — general model knowledge — with levels 1 and 2 present only as the handful of
facts someone thought to write into the prompt.

**This is also why your §9 citations do not exist, and currently cannot.** The prompt
explicitly forbids them:

> *"Do NOT use Markdown links, headings (#), numbered lists, tables or italics: they
> reach the reader as literal characters. Never write a URL."*

That rule is correct given the renderer — `ask-ethicare.js` implements a deliberately
tiny Markdown subset and would print a link as raw characters. So citations need the
renderer changed as well as the prompt. It is a small change, but it is a change.

### Conversation state

A plain array in the page, user and assistant turns only, capped at 12 and resent with
every request. Within one conversation the assistant does remember — because it is
reading the transcript, not because anything is tracked. Nothing persists across a page
navigation, a reload, or a return visit.

So §7 works today by accident of transcript-resending, and §6 progressive profiling has
nowhere to store what it learns.

### Privacy — the claim checks out

You say on the page and in `how-we-use-your-information` that the conversation is not
stored and not added to any record. I traced it: the function persists nothing, logs only
error text on upstream failures, and the analytics call sends a verdict and a reason for
the thumbs-down, never the question. **The statement is true as built.** Worth knowing
that it becomes a statement you'd have to re-check the moment you add retrieval logging
or profile storage.

### Two things I fixed while auditing

- **`/ask` was not loading `jobs/jobs-data.js`**, so `window.ETHICARE_JOBS` was undefined
  there and the function was told vacancies were unavailable. My omission when I built the
  page yesterday; now wired, and both pages report 27 live roles.
- The assistant's own resource map had no entry pointing at `/ask` itself, which is
  harmless but worth adding when the map next changes.

### Unnecessary complexity

Very little, which is unusual. The one piece I would question is the **OpenAI fallback**:
it doubles the code path that has to be kept correct, and a second model means a second
set of behaviours to test the guardrails against. If it exists for resilience, a clear
"briefly unavailable" message — which the client already renders well — is cheaper and
more honest than an answer of unknown quality from a model the prompt was not tuned for.

---

## Part 2 — Proposed architecture

The goal is your §11 hierarchy made real, without turning 486 pages into an
indiscriminate blob. Your instinct there is right, and it is the design constraint.

### The idea: a tiered corpus, not one index

Not every page is equally trustworthy for every question. So the retrieval layer should
know what *kind* of thing each chunk is, and the prompt should be told to prefer higher
tiers for high-stakes questions.

```
TIER 1  OFFICIAL          Ahpra · MRPBA · national boards · MCNZ · MRTB · PBNZ · NZPB
        regulator +       Immigration NZ · Home Affairs · IRD · ATO · Medicare
        government        → short, dated extracts + the live URL. Never paraphrased
                            into the corpus; always cited and always linked out.

TIER 2  ETHICARE VERIFIED Your registration guides, profession pages, salary pages.
        the editorial     Already written, already careful, already in your voice.
        corpus            ~120 pages. This is the bulk of retrieval.

TIER 3  ETHICARE PRACTICE "What actually happens." Employers recruiting now, which
        the experience    locations struggle, realistic timelines, common mistakes.
        layer             Does not exist yet as data. §12 is the highest-value
                            thing on your whole list and nobody else can copy it.

TIER 4  DESTINATION       The 297 chapters. Excellent for "what is Palmerston North
        the place corpus  like with children", useless for registration. Retrieved
                            only for location, cost and lifestyle questions.

TIER 5  LIVE DATA         jobs-data.js today; an ATS later. Queried, never indexed.
```

The rule the prompt enforces: **for registration, immigration, tax or fees, an answer may
only assert what Tier 1 or Tier 2 supports, and must cite it.** For lifestyle and location
it can range wider. For "what actually happens in practice" it must say that is Ethicare's
experience, in your own words from §12 — *"There isn't a rule preventing you from applying
before registration is complete. However, in Ethicare's experience…"* — which is the
distinction that builds the trust.

### How retrieval should work here

Your site is static, hosted on Netlify, with no database. Two honest options:

**(a) Build the index at deploy time, query it in the function.** A build step chunks the
tiered pages, embeds them, and writes a single index file the function loads. No external
service, no running cost beyond the model, no new failure mode. Ceiling: a few thousand
chunks, which comfortably covers Tiers 2 and 4.

**(b) A hosted vector store.** More headroom, more moving parts, a monthly bill, and a
new dependency in the path of every answer.

**I would start with (a).** Your corpus is not big, it changes when you deploy anyway, and
keeping the architecture inside the repo means the whole thing stays reviewable by one
person. (b) is a migration you can make later without changing the prompt or the UI.

### What changes in each file

| File | Change |
| --- | --- |
| **new** `knowledge/build-index.js` | Deploy-time: chunk + embed the tiered corpus |
| **new** `knowledge/sources.json` | Which pages are which tier; Tier 1 extracts with `asOf` dates |
| `netlify/functions/ask-ethicare.js` | Retrieve → assemble context → call model; prompt moves to its own module |
| `ask-ethicare.js` | Render citations; accept a `sources` array alongside `text` |
| `ask-ethicare.css` | Style the citation row (your §9: clean and unobtrusive, not academic) |
| **new** `ask-ethicare-profile.js` | The progressive profile — see below |

### Progressive profiling (§6 and your addendum)

Your addendum is the right design and it changes the data model, so it belongs here
rather than in a later phase.

**Never before the first answer.** Question → answer → then, once, quietly:

> *By the way, what should I call you?*
> *Optional — you can carry on without telling me.*

After that, one detail at a time and only when it would genuinely improve the next
answer: profession → country of qualification → destination → experience → family →
timeframe. The assistant already asks at most one follow-up question per reply, so the
prompt rule to extend is narrow.

**Where it lives matters for your privacy claim.** I would keep the profile in the
browser (`sessionStorage`, or `localStorage` if you want it to survive a return visit),
send it as structured data on each request exactly the way job titles are sent, and store
nothing server-side. That keeps *"we do not store the conversation"* true, gives the
candidate a visible profile chip they can clear, and means anonymous exploration stays
genuinely anonymous — your §27. Email, phone and account creation stay out until the
person chooses Save my plan, See matching jobs, Speak to Ethicare or Create my Ethicare
Move.

The same store is what lets the Pathway Checker and Ask Ethicare stop asking the same
questions twice (§14), and it is the seam the Cost Calculator plugs into later (§15).

### Per-page suggested questions (§23)

Small and worth doing early. The chips become a data attribute on the component —
`data-aske-context="australia"` — with the sets in the knowledge file rather than
duplicated in every page's HTML. That also lets the profession pages carry the
profession-specific chips that `jobs/psychologist-australia.html` already demonstrates
better than anything on the live site: *"I trained in the UK — does my BPS-accredited
qualification count in Australia?"* That page is redirected away right now, but its Ask
block is the model to copy.

---

## Part 3 — What I'd do, in order

**Phase 1 — grounding.** The tiered corpus, the deploy-time index, retrieval in the
function, citations rendered in the client. This is the whole difference between a
well-guarded general assistant and Ethicare's knowledge. Everything else on your list is
worth less until this is done.

**Phase 2 — the practice layer (§12).** Tier 3 does not exist as data. It exists in your
head and in the team's. Capturing it — even as a plain structured file of a few dozen
entries, each tagged with profession, country and what kind of claim it is — is the thing
competitors cannot buy. I would not automate this; I would sit with it and write it.

**Phase 3 — profile and tool continuity.** Progressive profiling, the shared store, the
Pathway Checker handshake, per-page chips.

**Phase 4 — escalation with context (§25)**, so a handoff carries the conversation to the
team instead of making the person start again.

**What I would not do yet:** the full §28 ecosystem, a hosted vector store, an ATS
integration, or any account layer. Each is a real commitment and none of them makes the
next answer better.

**One thing to decide before Phase 1.** Tier 1 is the hard part, not technically but
editorially. A regulator's page changes without telling you, and a dated extract in your
corpus is a claim with your name on it. I would keep Tier 1 deliberately thin — a small
number of high-traffic facts, each with an `asOf` date and a link — and let the assistant
say *"here is the shape of it, and here is the page that decides"* for everything else.
That is closer to how your guides already talk, and it is the version that stays true.

---

## Appendix — a correction to my earlier note

I told you yesterday that the Ask Ethicare block on `jobs/psychologist-australia.html`
was dead code on a redirected page and should be stripped. That was wrong, and I did not
strip it. It is a finished profession page held behind a redirect until Australian
psychology goes live — your `netlify.toml` says exactly that. Its Ask block, with chips
written for that one profession, is the best implementation of the component on the site.
