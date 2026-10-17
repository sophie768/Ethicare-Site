# Go-live checklist

Written 17 October 2026. Netlify deletes `*.md` before publishing, so this never reaches the live site.

The site itself is ready. Everything below is configuration and verification — none of it can be
done from inside the repo, and all of it fails *silently* if it is wrong, which is why each item
has a way to prove it worked rather than just a box to tick.

---

## 1. The domain

`ethicareresourcing.com` still points at Wix. The Netlify site is `ethicareresourcing.netlify.app`.

Already prepared in the repo, so nothing here needs changing first:

- 885 canonical tags and 881 `og:url` tags already say `https://ethicareresourcing.com`
- `robots.txt` points the sitemap at the production domain
- `sitemap.xml` lists 532 pages, all on the production domain
- no page anywhere references `netlify.app`

**Order matters.** Add the custom domain in Netlify and let the certificate issue *before* you
repoint DNS, or there is a window where the site is reachable over plain HTTP.

**Prove it:** load `https://ethicareresourcing.com/sitemap.xml` and confirm it serves over HTTPS
with no certificate warning, then spot-check three deep pages (a guide, a job page, a destination).

---

## 2. Environment variables

Four Netlify functions carry the features people actually use. Each one has a guard, so a missing
key produces a handled error rather than a crash — which means **the visitor sees nothing wrong and
you get no alert.** That is the risk.

| Function | Needs | What breaks without it |
|---|---|---|
| `ask-ethicare.js` | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ASK_WEB_SEARCH`, `ASK_TIMEOUT_MS`, `ASK_TEST` | Ask Ethicare — linked from the homepage hero |
| `send-pack.js` | `RESEND_API_KEY`, `PACK_FROM`, `PACK_NOTIFY` | My Pack: the candidate never gets their guides |
| `send-guide.js` | `RESEND_API_KEY`, `GUIDE_FROM`, `GUIDE_NOTIFY` | Single-guide emails |
| `capture.js` / `form-backup.js` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `BACKUP_FROM`, `BACKUP_NOTIFY` | Enquiries are not stored or backed up |

Set these on the **production** site in Netlify, not only on a preview or branch deploy.

**Prove it:** ask Ethicare a real question on the live domain and get an answer back. Request a pack
to an address you control and watch it arrive.

---

## 3. Credit on the Ask providers

Ask runs on Anthropic and OpenAI. Out of credit looks exactly like a broken key from the visitor's
side — a handled error and nothing in your inbox.

**Prove it:** check the balance and set a billing alert on both.

---

## 4. Form delivery — the one nobody has tested

Eleven pages carry Netlify forms:

```
apply.html                      contact.html
interested.html                 my-pack.html
submit-a-vacancy.html           jobs/coming-to-australia.html
employers/new-zealand-recruitment.html
employers/australia-medical-imaging.html
employers/medical-imaging-australia.html
_forms/index.html               (the hidden declaration page — must stay deployed)
```

Netlify only registers a form if it can parse it in the deployed HTML. Several of these are built or
revealed by JavaScript, which is exactly why `_forms/index.html` exists — do not delete it.

**Prove it:** submit every one of them on the live domain with a real address, and confirm each
arrives both in the Netlify Forms dashboard and in the notification inbox. Until that is done,
an applicant can fill in `apply.html`, see a thank-you page, and vanish.

---

## Not blocking, worth doing in the first fortnight

- Around eight pages have meta descriptions over 165 characters, so Google will truncate them.
  Cosmetic, and these pages have no rankings to protect yet.
- `/interested` and `/register-interest` still overlap.
- `is-it-worth-it.html` has no inbound links.
- The mental-health hub hero is a photograph taken in a dental surgery.

## Already closed

- Review dates across all 532 pages are current — the stale July ones are gone.
- No numeric placement claims and no retention percentage anywhere that would need substantiating.
- `tools/audit-links.py` passes with 0 blocking problems.
- `tools/audit-copy.py` reports 27 items, all triaged and accepted.
