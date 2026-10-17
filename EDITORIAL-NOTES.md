# Editorial notes moved out of the shipped HTML

Moved 17 October 2026. These were HTML comments inside live pages, so
anyone could read them with View Source. Two of them did real damage there: the
employers case-study note read as an admission that the case study was invented, and
the About note made the figures look provisional. The rest were Sophie's own words,
which are hers and not the public's.

Nothing here is lost. Netlify deletes every `.md` file at build time (see the build
command in `netlify.toml`), so this file stays in the repo and never reaches the site.
Technical comments that explain markup were left where they were.


## about-ethicare.html

> Figures supplied by Sophie, 18 Sep 2026 (About review). Confirm and keep current before each deploy — SOP 23, no unsourced fact.


## ask.html

> Rebuilt 3 Oct 2026. It was the strongest thing on the site presented as the blandest:
> a mint page, three paragraphs, then a white rectangle, with 40% of the screen empty and
> no imagery anywhere. Now the question box sits inside a dark teal band — the same device
> the guide heroes use — so it reads as something you use rather than a form you fill in,
> and a worked example below shows what an answer actually looks like instead of
> describing it. (Sophie: "premium, and almost a site in its own right".)


## australia.html

> Picture the life (Sophie, 6 Oct 2026): "What does life really look like in these places. that is what
> the whole site is missing." Lead with the life, then the practical half. Her words.


## destinations/australia.html

> The Destination finder, first (Sophie, 6 Oct 2026: "when a candidate clicks on destination guides,
> it comes up with a checker"). Six questions with the country already answered; three regions
> that fit, with the trade-offs; then the guides below for the reading.


## destinations/index.html

> The Destination finder, first (Sophie, 6 Oct 2026: "when a candidate clicks on destination guides,
> it comes up with a checker"). Six questions with the country already answered; three regions
> that fit, with the trade-offs; then the guides below for the reading.


## employers.html

> Placements figure confirmed by Sophie 14 Oct 2026; shown without a date by her decision.

> CASE STUDY — Sophie: this is written to be true without invented specifics. To make it as
> concrete as the review asked, replace the qualitative phrases with the real anonymised
> placement: the profession, roughly how long the role had been open, how long the search
> took, and how long the clinician has now been in post. Keep the employer unnamed (Health
> New Zealand is the only employer we may name); no pay figures.


## index.html

> Sophie, 6 Oct 2026: "promote this as a one stop shop for healthcare recruitment to australia
> and new zealand. at the moment the information is out there, it is just hard to find and
> scattered across different websites... this tailors the move to you. every move is different.
> some people will be moving alone, some with a partner, some with kids. ethicare allows you to
> access all the information in one place and plan at the same time."


## jobs/coming-to-australia.html

> Sophie, 6 Oct 2026: "for roles in Australia we need to say that we are only focusing on
> medical imaging at present but this will change in the coming weeks. if you are interested
> in working in Australia, please complete an interest form and we will contact you with more
> information nearer the time."


## jobs/psychologist-australia.html

> DRAFT PASSAGE: written to length (about 100 words) so the screen can be reviewed. Sophie rewrites this fresh before publication — nothing here is hers yet.


## new-zealand.html

> Picture the life (Sophie, 6 Oct 2026): "What does life really look like in these places. that is what
> the whole site is missing." Lead with the life, then the practical half. Her words.


## register-interest.html

> REGISTER WITH ETHICARE (9 Oct 2026). Sophie: "there must be a way to capture all leads that enter
> the site so we understand the role, where they trained, registration status and when they are
> looking to move." One question at a time (rg-stepper.js below); without JavaScript every question
> shows at once and the form still posts. Netlify form name unchanged (register-interest), so the
> existing notification and the leads table keep working; the new fields arrive in the same record.
> Profiles are never shown to employers from here: Sophie's rule is that only candidates the team has
> met and approved are put forward.


## you.html

> ============ YOUR PAGE ============
> Device-personal. Everything on it is read from the answers strip (candidate-context.js):
> nothing is fetched about the person and nothing is sent. The name is a greeting, not a
> record. Two states, both rendered by you.js:
> · no answers yet — the set-up card leads, three questions and a button
> · answers — greeting, the answers in a strip that changes in place, Ask Ethicare already
> knowing who they are, the guides that fit, and the hand-off to Plan your move.
> Sophie, 5 Oct 2026: "this should act almost like an information page for you … when the
> candidate is ready to start planning it should link to plan my move."

