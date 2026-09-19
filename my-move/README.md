# My Move — private candidate portal (setup & operations)

The private, invitation-only relocation space for Ethicare candidates after they accept an
Ethicare-supported offer, plus the staff admin that creates and maintains each space. It is
**distinct from the public Ethicare Move planner at `/move`** (device-local, open to anyone):
a candidate only gets a My Move space when staff explicitly create and invite their case.

Staff instructions (plain English) live at **`/my-move/help`** and are linked from the admin sidebar.

## What is in the repo

| Path | What |
|---|---|
| `my-move/index.html` | The portal page: one sign-in, two authenticated experiences (candidate / staff). No analytics. |
| `my-move/config.js` | **Fill in per environment**: Supabase URL + anon key. Nothing else goes here. |
| `my-move/api.js` | Data access: supabase-js + RLS for ordinary reads/writes; the Netlify function for privileged ops. |
| `my-move/components.jsx`, `candidate.jsx`, `staff.jsx`, `app.jsx` | UI (React via in-browser Babel — the site's existing island pattern, no build step). |
| `my-move/data.js` | Guide catalogue (real site URLs), labels, default draft, draft privacy wording. |
| `my-move/portal.css` | Portal styles mapped onto `site.css` brand tokens. |
| `my-move/help.html` | The staff guide. |
| `netlify/functions/mymove.js` | Privileged operations with the **service-role key, server only**: publish, invite, resend, revoke, suspend, reactivate, archive, delete, export, staff roles. |
| `supabase/migrations/0001_my_move.sql` | Tables, the `my_case` view, triggers, **RLS policies (deny by default)**, server-only functions, starting templates. |
| `supabase/seed-staging.sql` | Fictional candidates for staging. **Never run on production.** |
| `supabase/tests/rls-check.mjs` | Automated authorisation checks (acceptance #3–#9) against a staging project. |
| `_redirects`, `netlify.toml`, `robots.txt` | `/my-move` routing, no-store + noindex + CSP headers, crawler block. |

## How authorisation works (the part that matters)

- **Row-level security is the gate.** Every table has RLS on. The anon key ships in the browser
  because it can reach nothing: `anon` has no grants and no policy matches it.
- **Candidates never read a base table that holds a draft.** They select the `my_case` view
  (filtered by `auth.uid()`, safe columns only, active + invited cases only) plus their own
  rows in `case_arrangements`, `case_task_progress` and `shared_notes`. There is deliberately
  no candidate policy on `case_draft` or `candidate_cases`.
- **Staff must have a second factor.** Every staff policy requires `staff_profiles.active` and
  the JWT `aal` claim to be `aal2`. A staff member who has not verified TOTP can read nothing,
  whatever the screen shows.
- **Support vs admin.** `mm_can_manage(case)` = admin (all cases) or support (assigned cases).
  Only admins create cases, reassign, manage the team, edit templates, read audit, delete.
- **Lifecycle columns are server-only.** A trigger rejects client changes to `status`,
  `invitation`, `auth_user_id`, `published`, `published_at`, `invited_at`. Those change only via
  the Netlify function, which verifies the caller's JWT with Supabase, looks the role up in
  `staff_profiles`, requires `aal2`, checks assignment, and only then uses the service role.
- **A candidate cannot tick a staff-controlled milestone.** A trigger on `case_task_progress`
  checks the published snapshot and raises — the UI hiding the control is not the control.
- **Revocation reaches live sessions.** Revoke/suspend/archive/remove-staff ban the Auth user and
  delete their sessions and refresh tokens (`mm_revoke_sessions`); RLS already denies new
  requests the instant `status`/`invitation`/`active` changes. Set the **JWT expiry short
  (10 minutes)** in Auth settings so an already-issued access token dies quickly too.
- **JWT claims are a convenience, not the authority.** The optional access-token hook stamps
  `user_role` (never Supabase's own `role`) and `case_id`; policies still look the role up.

## Setup (developer, once per environment — staging first)

1. **Create a Supabase project in London (`eu-west-2`).** Do it twice: staging and production.
   Never copy production data into staging or previews.
2. **Run `supabase/migrations/0001_my_move.sql`** in the SQL editor (or `supabase db push`).
3. **Auth settings** (Authentication → Providers / Settings):
   - Email provider on. Disable "Allow new users to sign up" — candidates and staff are created
     by invitation only. The candidate sign-in form uses `shouldCreateUser: false`.
   - Enable **MFA (TOTP)**.
   - **JWT expiry: 600 seconds.** Refresh-token rotation on.
   - Site URL: `https://ethicareresourcing.com`. Redirect URLs: `https://ethicareresourcing.com/my-move/**`,
     the staging/preview host, and `mymove.ethicareresourcing.com/**` if that subdomain is adopted.
   - Email templates (Invite user, Magic Link, Reset Password): keep to a greeting and the
     sign-in button. **No case detail in any email.**
   - **Email is sent through Resend** (chosen 19 Sep 2026) as Supabase's SMTP provider — see
     the Resend section below. Do this before inviting anyone: Supabase's built-in sender is
     for development only and is heavily rate-limited.
4. **Optional access-token hook**: Authentication → Hooks → Customize Access Token → select
   `public.custom_access_token_hook`. (The app works without it.)
5. **Create the first admin** (Sophie): Authentication → Users → *Add user* with email + a
   strong password, "auto confirm" on. Then in SQL:
   ```sql
   insert into public.staff_profiles (id, name, email, role)
   select id, 'Sophie Careem', email, 'admin' from auth.users where email = 'sophie@ethicareresourcing.com';
   ```
   On first sign-in the portal walks her through TOTP enrolment. Further staff are invited from
   **Team & access** in the app.
6. **Netlify environment variables** (Site configuration → Environment variables; set per
   deploy context so previews use staging):
   - `SUPABASE_URL` — `https://<project>.supabase.co`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — **server only; never in the browser bundle**
   - `MYMOVE_SITE_URL` — optional, e.g. `https://ethicareresourcing.com`
7. **`my-move/config.js`**: set `supabaseUrl` and `supabaseAnonKey` (anon key only). Until both
   are set the portal shows a "not switched on" screen.
8. **Staging only**: run `supabase/seed-staging.sql` (edit the admin email at the top), then
   `cd supabase/tests && npm install && SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm test`.
   Every check must pass before a real candidate is invited.
9. Deploy. Open `/my-move`, sign in as staff, add a candidate, invite a **test mailbox**, and
   walk the acceptance checks below on two devices.

### Resend (email) — one-off setup

Supabase Auth composes and sends every My Move email (invitation, sign-in link, password
reset); Resend is only the delivery pipe. Nothing in this repo calls Resend directly.

1. In Resend, **add and verify the sending domain** (`ethicareresourcing.com`, or a subdomain
   such as `mail.ethicareresourcing.com` to keep My Move's reputation separate from marketing).
   Add the DKIM, SPF and return-path DNS records Resend shows, and choose the **EU (Ireland)
   region** for the domain when prompted.
2. Create an **API key with "Sending access" only**, restricted to that domain.
3. In Supabase: Authentication → Settings → **SMTP settings → Enable custom SMTP**:
   - Host `smtp.resend.com`, port `465` (SSL) or `587` (STARTTLS)
   - Username `resend`, password = the API key
   - Sender email e.g. `mymove@ethicareresourcing.com`, sender name `Ethicare My Move`
4. Raise the Auth **email rate limit** (Authentication → Rate limits) from the built-in
   default to something like 30 per hour; the default is sized for the shared sender.
5. Send a test invitation to a mailbox you control and check it lands in the inbox, not spam.
6. Keep the templates minimal (step 3 above). Resend keeps delivery logs; the less that is in
   the email, the less that is in the log.

Netlify functions bundle with no dependencies (the function uses `fetch` only), so there is no
`package.json` at the repo root and no build step, as before.

## Acceptance checks → evidence

| # | Check | Where it is enforced / how to verify |
|---|---|---|
| 1 | Sophie creates a case without a deploy | Admin UI: Add candidate → Template → Preview → Publish. |
| 2 | Progressive information, progress not reset | Unknowns render "To be confirmed". Template apply shows added/kept/removed; kept tasks keep status + `case_task_progress` rows (stable task keys). |
| 3 | Correct invitations; expired/revoked/reused/wrong-account fail | Supabase Auth link expiry + single use; `my_case` requires `auth_user_id = auth.uid()` **and** active + sent/accepted. `rls-check.mjs`: revoked and wrong-account cases. |
| 4 | Candidate separation via UI / URL / SDK / search / export | No candidate policy on base tables; `my_case` filtered by identity. `rls-check.mjs` proves A cannot read/write B's rows with A's token. Export is staff-only via the function. |
| 5 | Staff-created record reachable by the correct candidate only | Ownership = `auth_user_id` set by `invite-candidate` from the verified Auth user, never a browser id. |
| 6 | Field & publication controls | Trigger `mm_guard_case_update`; trigger `mm_task_progress_guard`; `my_case` exposes no draft column. Check the raw response of `select * from my_case` — no `case_draft`. |
| 7 | Staff update reaches candidate | Publish copies draft → `published`; candidate reads on next load. Seed includes Amina's WA radiation licence. |
| 8 | Durable saving; failed save preserves input | Rows in Postgres (survive refresh, sign-out, second device). UI keeps the chosen value and offers Retry on failure (tested in the browser harness). |
| 9 | Revocation reaches existing sessions | Function bans the user + `mm_revoke_sessions`; RLS denies immediately; short JWT expiry. `rls-check.mjs`: suspended candidate's existing session gets 0 rows. Removed staff: `active=false` → `mm_is_staff()` false. |
| 10 | Privacy operations | `export-case` (full package), correction via the editor, `archive-case` ≠ `delete-case` (admin, typed confirmation, erases personal fields, keeps de-identified audit). Retention periods are Ethicare's to set (below). |
| 11 | Usability, WCAG 2.2 AA | Keyboard-operable controls, labelled selects, live regions for save state, 375px with no horizontal scroll (checked), focus ring from `site.css`. Run a manual audit before launch. |
| 12 | Documents | Not built. No upload control is shown. Reserve: Supabase Storage private bucket + signed URLs + per-case policies. |

## Privacy notes to confirm (Ethicare decides; the code implements)

- **Do not promise "stored in the UK/EU" unconditionally.** Supabase (London) holds the database
  and Auth. **Email goes through Resend**: sending from its EU region keeps message delivery in
  Ireland, but Resend's own documentation says account data, email metadata, logs and API
  records are stored in the US. The draft wording in `my-move/data.js` already says this
  ("our database and sign-in service are hosted in London (UK); our website host and email
  provider may process delivery records and logs outside the UK/EU"). Name Resend (and
  Netlify, Supabase) in the processor list on `/how-we-use-your-information` and the privacy
  policy, note the US transfer for email metadata with the safeguard relied on (Resend's DPA
  and standard contractual clauses / UK addendum), and review each provider's sub-processor list.
- **Consent records: one rule, not two.** This build **retains `consent_events` and
  `access_audit` de-identified** after `delete-case` (the case row is scrubbed; those tables keep
  only the case id). If Ethicare prefers deletion with the case, change `mm_erase_case`.
- **Retention** is configurable by record type only in the sense that archiving and deletion are
  separate; the periods themselves need a named owner and a written procedure.
- **Costs**: Supabase Pro is ~US$25/month; **point-in-time recovery is an add-on from
  ~US$100/month** and daily backups are what Pro includes by default. Decide whether PITR is
  required before go-live.
- No analytics, pixels, session replay or AI processing on `/my-move/*`.

## Known limits of this release

- In-browser Babel (the site's pattern) adds ~3 MB of JS to the first load of the portal. If
  that becomes a problem, precompile the four `.jsx` files and drop the Babel script.
- The CSP for `/my-move/*` must allow `'unsafe-inline'` scripts for the same reason.
- Rate limiting in the function is best-effort per warm instance; Netlify's edge limits apply too.
- A lost authenticator is reset by an admin in the Supabase dashboard (no self-service).
- Notes cannot be edited or deleted from the UI (append-only by design); removal is a privacy
  procedure with database access.

## Next phase: staff intranet

Sophie's direction for the next phase is a staff intranet where the My Move admin sits
alongside training, documents and company information. This build already provides the pieces:

- **One staff sign-in with enforced TOTP** and roles in `staff_profiles` (`admin`/`support`),
  readable by any future section via `mm_is_staff()` / `mm_is_admin()`.
- **The staff shell** (`Shell` in `components.jsx`) takes a nav list; new sections are new
  entries (Training, Documents, Company) rendered in the same frame.
- **Documents** belong in a Supabase Storage private bucket with policies keyed on the same
  functions and signed, expiring URLs — the same design reserved for candidate documents, so
  build it once for staff first (lower risk) and reuse it for candidates.
- **Training and company pages** can be a `staff_pages` table (title, body, category, updated_by)
  edited in-app by admins, or static pages under `/staff/` behind the same session check.

Keep My Move's candidate tables untouched by the intranet; the permission model above stays
the boundary.
