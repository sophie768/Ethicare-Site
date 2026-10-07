/* ============================================================================
   Ethicare Resourcing — form backup
   POST /.netlify/functions/form-backup

   The safety net behind every "/thank-you" form on the site (7 Oct 2026).

   Why it exists: on 7 Oct 2026 the `contact` form was deleted in the Netlify
   dashboard by accident (the red "Delete form" button sits right above the
   submissions). From that moment every contact message was refused with a 404
   and recorded nowhere, until the next deploy re-detected the form. Nothing in
   the site code had changed. A dashboard click must never again be able to lose
   a candidate's or an employer's message.

   How it works with form-safety.js (in the site root):
     1. The page posts to Netlify Forms first, exactly as before. That is still
        the record, and still sends the usual notification.
     2. ONLY if Netlify refuses it (a 404 means "I don't know this form") or the
        post fails outright does the page call this function.
     3. This function emails the submission to the office through Resend, with a
        subject that says loudly that Netlify refused it — the cue to redeploy.
     4. The person still sees the normal thank-you page. Their message arrived.

   Deliberately narrow, same posture as send-result.js / send-pack.js / send-guide.js:
     - only form names in FORMS are accepted; anything else is refused
     - the email always goes to NOTIFY, never to an address from the request
     - fields are capped in number and length, rendered as plain text only
     - origin allowlist, body cap, per-IP burst limit, honeypot
   It cannot be used to send mail to anyone but the office.

   Env vars (Netlify, Production only):
     RESEND_API_KEY   — already set for the other send-* functions
   Optional:
     BACKUP_NOTIFY    default "hello@ethicareresourcing.com,sophie@ethicareresourcing.com"
     BACKUP_FROM      default "Ethicare website <hello@ethicareresourcing.com>"
   ============================================================================ */

const RESEND_KEY = process.env.RESEND_API_KEY;
/* Both inboxes, so a backup is never sitting only in a mailbox nobody is watching that day. */
const NOTIFY = (process.env.BACKUP_NOTIFY || 'hello@ethicareresourcing.com,sophie@ethicareresourcing.com')
  .split(',').map((s) => s.trim()).filter(Boolean);
const FROM = process.env.BACKUP_FROM || 'Ethicare website <hello@ethicareresourcing.com>';

const ALLOWED = ['https://ethicareresourcing.com', 'https://www.ethicareresourcing.com', 'https://ethicareresourcing.netlify.app'];

/* Every Netlify form that lands on /thank-you, with a human label for the subject. */
const FORMS = {
  'contact': 'Contact form',
  'vacancy': 'Submit a vacancy',
  'employer-enquiry': 'Employer enquiry',
  'register-interest': 'Register interest',
  'au-brewing-interest': 'Australia interest form',
  'webinar-registration': 'Webinar registration',
  'guide-request': 'Email me the guide',
  'plan-share': 'Plan Ethicare — share my plan',
  'guide-pack': 'Guide pack',
  'my-pack': 'Create my pack',
  'quick-interest': 'Quick interest form'
};

const MAX_BODY = 20000;
const MAX_FIELDS = 40;
const MAX_FIELD = 3000;
const SKIP = { 'form-name': 1, 'bot-field': 1, '_subject': 1 };

const HITS = new Map();
function limited(ip) {
  const now = Date.now(), w = 60000, max = 8;
  const h = (HITS.get(ip) || []).filter((t) => now - t < w);
  h.push(now); HITS.set(ip, h);
  if (HITS.size > 5000) HITS.clear();
  return h.length > max;
}

function reply(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

const clean = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, MAX_FIELD);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });

  const h = event.headers || {};
  const origin = h.origin || h.Origin || '';
  if (origin && ALLOWED.indexOf(origin) === -1) return reply(403, { error: 'Forbidden' });
  if ((event.body || '').length > MAX_BODY) return reply(413, { error: 'Too large' });

  const ip = String(h['x-nf-client-connection-ip'] || h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return reply(429, { error: 'Slow down' });

  if (!RESEND_KEY) {
    console.error('form-backup: RESEND_API_KEY is not set — a submission Netlify refused could not be emailed');
    return reply(503, { error: 'Sender not configured' });
  }

  let msg;
  try { msg = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'invalid JSON' }); }

  const form = String(msg.form || '');
  if (!Object.prototype.hasOwnProperty.call(FORMS, form)) return reply(400, { error: 'unknown form' });

  const fields = (msg.fields && typeof msg.fields === 'object') ? msg.fields : {};
  if (fields['bot-field']) return reply(200, { ok: true });   // honeypot: accept, do nothing

  const rows = [];
  let replyTo = '';
  Object.keys(fields).slice(0, MAX_FIELDS).forEach((k) => {
    if (SKIP[k]) return;
    const key = clean(k).slice(0, 80);
    const val = clean(fields[k]).trim();
    if (!val) return;
    rows.push(key + ': ' + val);
    if (!replyTo && /e-?mail/i.test(key) && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) replyTo = val;
  });
  if (!rows.length) return reply(400, { error: 'empty' });

  const label = FORMS[form];
  const page = clean(msg.page).slice(0, 200);
  const status = clean(msg.status).slice(0, 40);
  const files = Array.isArray(msg.files) ? msg.files.map(clean).filter(Boolean).slice(0, 5) : [];

  const text = [
    'Netlify Forms did not accept this submission' + (status ? ' (' + status + ')' : '') + ', so the website emailed it here instead.',
    'The person saw the normal thank-you page. It is NOT in Netlify Forms — this email is the only copy.',
    '',
    'Most likely the form has been deleted in the Netlify dashboard. To fix: Deploys → Trigger deploy → Deploy site, then check Forms lists "' + form + '" again.',
    '',
    '— ' + label + ' —',
    page ? 'Sent from: ' + page : '',
    '',
    rows.join('\n'),
    files.length ? '\nA file was attached (' + files.join(', ') + ') but cannot travel by this route — ask them to email it to you.' : ''
  ].filter((s) => s !== '').join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({
        from: FROM,
        to: NOTIFY,
        subject: 'ACTION NEEDED — ' + label + ' arrived by backup (Netlify refused it)',
        text: text
      }, replyTo ? { reply_to: replyTo } : {}))
    });
    if (!res.ok) {
      console.error('form-backup: Resend ' + res.status + ' — ' + (await res.text()).slice(0, 300));
      return reply(502, { error: 'Send failed' });
    }
    console.warn('form-backup: delivered a "' + form + '" submission that Netlify refused');
    return reply(200, { ok: true });
  } catch (e) {
    console.error('form-backup: ' + e.message);
    return reply(502, { error: 'Send failed' });
  }
};
