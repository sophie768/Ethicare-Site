# Go-live — record and remaining checks

Launched **17 October 2026, 14:29**. `ethicareresourcing.com` moved from Wix to Netlify.
Netlify deletes `*.md` before publishing, so this never reaches the live site.

---

## Done

**The domain.** DNS edited at Wix at 14:08, propagated by 14:26, certificate provisioned 14:29.
Wix remains the registrar and the DNS host; only the A and CNAME records changed.

| Record | Value |
|---|---|
| A, apex | `75.2.60.5` |
| CNAME, `www` | `ethicareresourcing.netlify.app` |

Removed: the two Wix A records (`185.230.63.171`, `185.230.63.186`) and `www → cdn3.wixdns.net`.
Untouched, and must stay untouched: the Mailchimp DKIM keys (`k2`, `k3` → `mcsv.net`), the
SendGrid keys (`s1`, `s2` → `u24647994`), SendGrid link branding (`em5783`), and the Resend
records (`send`, `rsend` → `forge.rmta.net`). Nameservers were deliberately **not** changed,
which is what kept the MX records — and therefore company email — out of the blast radius.

In Netlify: apex is the primary domain, `www` redirects to it. That matches the 885 canonical
tags, which all name the apex.

**Environment variables.** All four the code requires are set against **Production**:
`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`.

The other ten names in the source are defaults or fallbacks, correct as they stand:

- `PACK_FROM` / `PACK_NOTIFY` / `GUIDE_FROM` / `GUIDE_NOTIFY` / `BACKUP_FROM` / `BACKUP_NOTIFY`
  fall back to `sophie@` and `hello@ethicareresourcing.com` in the function code.
- `OPENAI_API_KEY` is only a second provider. The guard is "neither key set".
- `ASK_WEB_SEARCH` and `ASK_TIMEOUT_MS` unset is **correct**. Search only works with the timeout
  raised past 20s and Netlify's limit is 10s; turning it on without that returns empty answers.
  See the note dated 14 Oct in `netlify/functions/ask-ethicare.js`.
- `ASK_TEST` must stay unset in production.

**Email.** Resend has the domain verified and is delivering. The 7 October log shows the full
pack chain working: the candidate received their guides and `hello@` received the notification
copy, from the `PACK_FROM` / `PACK_NOTIFY` defaults.

**Forms.** Form detection enabled, 18 forms registered, submissions captured (`my-pack` 3,
`contact` 1), and a notification email confirmed as having arrived at the time.

---

## Still to check

1. **Per-form notifications.** Only `my-pack` and `contact` have ever been submitted. Netlify
   notifications can be set per form. Confirm the notification covers `candidate-registration`,
   `employer-enquiry` and `vacancy` — the three where a missed message costs a placement.
2. **Anthropic credit.** Nobody has looked. Out of credit is indistinguishable from a broken key
   on the visitor's side. Set a billing alert.
3. **Live verification**, on the real domain:
   - `https://ethicareresourcing.com/sitemap.xml` over HTTPS
   - `www.` and `http://` both land on the apex
   - three deep pages — a guide, a job page, a destination
   - Ask Ethicare answers a real question (this also proves the key and the credit)
   - **send yourself an email at the company address and reply to it**
4. **Force HTTPS** is on in Netlify.
5. **Google Search Console** — add the property and submit the sitemap.
6. **Don't cancel Wix yet.** Keep it a few days for rollback. If Wix also bills the mailboxes,
   check what cancelling the site plan does to them before cancelling anything.

### Rollback, if ever needed

Put back A records `185.230.63.171` and `185.230.63.186`, point `www` at `cdn3.wixdns.net`,
remove the `75.2.60.5` record. Live again on Wix within the hour.

---

## Not blocking, worth doing in the first fortnight

- Around eight pages have meta descriptions over 165 characters, so Google will truncate them.
- `/interested` and `/register-interest` still overlap.
- `is-it-worth-it.html` has no inbound links.
- The mental-health hub hero is a photograph taken in a dental surgery.
- 18 forms are registered against 16 found in the code — worth checking for a stale duplicate
  catching submissions nobody reads.
