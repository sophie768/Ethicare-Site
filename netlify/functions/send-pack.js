/* ============================================================================
   Ethicare Resourcing — guide pack email
   POST /.netlify/functions/send-pack

   Sends ONE email: the guides the reader added on /move-steps, plus a short
   list of country-matched extras. No mailing list, no follow-up sequence —
   that promise is printed on the form and this function must keep it.

   Sends a second, plain notification to the office so a pack request is
   visible without opening Resend.

   The page ALSO posts to Netlify Forms (form name `guide-pack`) before
   calling this. That post is the record; this is the delivery. If this
   fails, nothing is lost — the request is still captured.

   Env vars required (Netlify → Site settings → Environment variables):
     RESEND_API_KEY        Resend → API keys → Create (sending access)
   Optional:
     PACK_FROM             default "Sophie Careem <sophie@ethicareresourcing.com>"
     PACK_NOTIFY           default "hello@ethicareresourcing.com"

   The sending domain is verified in Resend (DKIM + SPF, 13 Sep 2026).
   Receiving is OFF, so replies route through the mailbox, not Resend.
   ============================================================================ */

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.PACK_FROM || 'Sophie Careem <sophie@ethicareresourcing.com>';
const NOTIFY = process.env.PACK_NOTIFY || 'hello@ethicareresourcing.com';
const REPLY_TO = 'hello@ethicareresourcing.com';
const SITE = 'https://ethicareresourcing.com';

/* Same posture as send-result.js in this directory, and for the same reason: this
   endpoint must not become a way to send mail on Ethicare's behalf. It takes no
   subject, no HTML and no arbitrary recipient list — only the form's own fields,
   and every link it renders is rewritten onto our own origin. */
const ALLOWED = ['https://ethicareresourcing.com', 'https://www.ethicareresourcing.com', 'https://ethicareresourcing.netlify.app'];
const MAX_BODY = 8000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function reply(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', ...CORS }, body: JSON.stringify(body) };
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Only ever link our own site. A pack item arrives from the browser, so an
   absolute or off-site URL is rejected rather than rendered. */
function safeUrl(u) {
  const s = String(u || '').trim();
  if (!/^\/[A-Za-z0-9\-._~/#?=&%]*$/.test(s)) return null;
  return SITE + s;
}

/* Extras by destination — what a reader who added nothing still needs, and
   what rounds out a partial pack. Titles match the live pages. */
const EXTRAS = {
  nz: [
    ['Registration in New Zealand, explained', '/guides/new-zealand-registration'],
    ['Visas and immigration', '/guides/new-zealand-visa'],
    ['What the move will cost', '/guides/cost-of-relocating'],
    ['Your first month', '/guides/new-zealand-first-month']
  ],
  au: [
    ['Registration through Ahpra', '/guides/australia-registration'],
    ['Visas and immigration', '/guides/australia-visa'],
    ['What the move will cost', '/guides/cost-of-relocating'],
    ['Living and thriving in Australia', '/guides/living-in-australia']
  ],
  '': [
    ['Australia or New Zealand?', '/guides/australia-vs-new-zealand'],
    ['What the move will cost', '/guides/cost-of-relocating'],
    ['Check my pathway', '/pathway-checker'],
    ['Every profession we cover', '/jobs/professions']
  ]
};

const COUNTRY_NAME = { nz: 'New Zealand', au: 'Australia' };

/* `pack-contents` is one item per line: "Title (/url)". Parse it back rather
   than trusting a second field, so the email matches what the form captured. */
function parsePack(raw) {
  return String(raw || '')
    .split('\n')
    .map((line) => {
      const m = line.match(/^(.*)\s\((\/[^)]*)\)\s*$/);
      if (!m) return null;
      const url = safeUrl(m[2]);
      return url ? { title: m[1].trim(), url, path: m[2] } : null;
    })
    .filter(Boolean)
    .slice(0, 30);
}

/* ---------- the email ---------- */

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const INK = '#333333';
const MUT = '#555555';
const TEAL = '#02615D';
const LIME = '#A6C84A';
const CREAM = '#FCFBF8';

function itemRows(items) {
  return items.map((g) => `<tr><td style="padding:0 0 14px"><a href="${esc(g.url)}" style="font-family:${SANS};font-size:17px;font-weight:600;color:${TEAL};text-decoration:underline">${esc(g.title)}</a></td></tr>`).join('');
}

function packHtml({ name, items, extras, country }) {
  const dest = COUNTRY_NAME[country];
  const hello = name ? `Hi ${esc(name)},` : 'Hello,';
  const opener = items.length
    ? `Here are the guides you added${dest ? ` while you were reading about ${dest}` : ''}. They are the same pages as on the site — nothing here is held back for people who get in touch.`
    : `You asked for the pack without picking anything specific, so here is the set most people start with${dest ? ` when they are looking at ${dest}` : ''}.`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Your Ethicare guide pack</title></head>
<body style="margin:0;padding:0;background:${CREAM}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${items.length ? esc(items.length + ' guide' + (items.length === 1 ? '' : 's')) + ' you added, plus a few that go with them.' : 'The guides most people start with.'}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM}"><tr><td align="center" style="padding:28px 16px 40px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">

<tr><td style="background:${TEAL};padding:30px 32px 28px">
  <div style="width:28px;height:3px;background:${LIME};margin:0 0 14px"></div>
  <p style="margin:0 0 6px;font-family:${SANS};font-size:12.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#C6E084">Your guide pack</p>
  <h1 style="margin:0;font-family:${SANS};font-size:27px;line-height:1.2;font-weight:500;color:#ffffff">Everything you added, in one place</h1>
</td></tr>

<tr><td style="background:#ffffff;padding:30px 32px 8px">
  <p style="margin:0 0 16px;font-family:${SANS};font-size:17px;line-height:1.6;color:${INK}">${hello}</p>
  <p style="margin:0 0 26px;font-family:${SANS};font-size:17px;line-height:1.6;color:${INK}">${opener}</p>
  ${items.length ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:12.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#2F5E49">What you added</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemRows(items)}</table>
  <div style="height:1px;background:rgba(2,97,93,.65);margin:14px 0 26px"></div>` : ''}
  ${extras.length ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:12.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#2F5E49">${items.length ? 'Worth reading alongside them' : 'Where most people start'}</p>
  <p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.6;color:${MUT}">${items.length ? 'These come up in nearly every move.' : ''}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemRows(extras)}</table>` : ''}
</td></tr>

<tr><td style="background:#ffffff;padding:14px 32px 32px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E6F1ED;border-radius:14px"><tr><td style="padding:22px 24px">
    <p style="margin:0 0 8px;font-family:${SANS};font-size:18px;font-weight:600;color:${TEAL}">If you want to know where you actually stand</p>
    <p style="margin:0 0 14px;font-family:${SANS};font-size:15.5px;line-height:1.6;color:${INK}">Check my pathway asks about your qualification and experience and tells you which route the regulator is likely to assess you under. It does not decide anything — the council or board does — but it tells you what to expect and what it costs.</p>
    <a href="${SITE}/pathway-checker" style="font-family:${SANS};font-size:15.5px;font-weight:600;color:${TEAL};text-decoration:underline">Check my pathway &rarr;</a>
  </td></tr></table>
</td></tr>

<tr><td style="background:#ffffff;padding:0 32px 34px">
  <p style="margin:0 0 4px;font-family:${SANS};font-size:16.5px;line-height:1.6;color:${INK}">If something in here raises a question, reply to this email and it comes to us — there is no form in the way.</p>
  <p style="margin:14px 0 0;font-family:${SANS};font-size:16.5px;line-height:1.6;color:${INK}">Sophie Careem<br><span style="color:${MUT};font-size:15px">Founder, Ethicare Resourcing</span></p>
</td></tr>

<tr><td style="padding:22px 32px 0">
  <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUT}">You are getting this because you asked for a guide pack at ethicareresourcing.com. It is a single email — you have not been added to a mailing list and your address will not be passed on. <a href="${SITE}/privacy-policy" style="color:#2F5E49;text-decoration:underline">Privacy policy</a></p>
  <p style="margin:0;font-family:${SANS};font-size:12.5px;line-height:1.7;color:${MUT}">Ethicare Resourcing Ltd &middot; Company No 14646354<br>Office 1, One Coldbath Square, London EC1R 5HL &middot; +44 20 4626 6580</p>
</td></tr>

</table></td></tr></table></body></html>`;
}

function packText({ name, items, extras, country }) {
  const dest = COUNTRY_NAME[country];
  const line = (g) => `  ${g.title}\n  ${g.url}`;
  return [
    name ? `Hi ${name},` : 'Hello,',
    '',
    items.length
      ? `Here are the guides you added${dest ? ` while you were reading about ${dest}` : ''}. They are the same pages as on the site.`
      : `You asked for the pack without picking anything specific, so here is the set most people start with${dest ? ` when they are looking at ${dest}` : ''}.`,
    items.length ? `\nWHAT YOU ADDED\n${items.map(line).join('\n\n')}` : '',
    extras.length ? `\n${items.length ? 'WORTH READING ALONGSIDE THEM' : 'WHERE MOST PEOPLE START'}\n${extras.map(line).join('\n\n')}` : '',
    `\nCHECK MY PATHWAY\n  Which route the regulator is likely to assess you under.\n  ${SITE}/pathway-checker`,
    '',
    'If something in here raises a question, reply to this email and it comes to us.',
    '',
    'Sophie Careem',
    'Founder, Ethicare Resourcing',
    '',
    'You are getting this because you asked for a guide pack at ethicareresourcing.com.',
    'A single email — no mailing list, and your address will not be passed on.',
    `${SITE}/privacy-policy`,
    '',
    'Ethicare Resourcing Ltd · Company No 14646354',
    'Office 1, One Coldbath Square, London EC1R 5HL · +44 20 4626 6580'
  ].filter((s) => s !== '').join('\n');
}

async function send(payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`resend ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch (e) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(204, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });

  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  if (origin && ALLOWED.indexOf(origin) === -1) return reply(403, { error: 'Forbidden' });
  if ((event.body || '').length > MAX_BODY) return reply(413, { error: 'Too large' });

  if (!RESEND_KEY) {
    console.error('send-pack: RESEND_API_KEY is not set in this environment');
    return reply(503, { error: 'Sender not configured' });
  }

  let msg;
  try { msg = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'invalid JSON' }); }

  if (msg['bot-trap']) return reply(200, { ok: true });           // honeypot: accept, do nothing

  const email = String(msg.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply(400, { error: 'valid email required' });

  const name = String(msg.name || '').trim().slice(0, 60).replace(/[<>]/g, '');
  const country = (msg.destination === 'nz' || msg.destination === 'au') ? msg.destination : '';
  const household = String(msg.household || '').slice(0, 120);
  const items = parsePack(msg.pack || msg['pack-contents']);

  const have = new Set(items.map((g) => g.path));
  const extras = (EXTRAS[country] || EXTRAS[''])
    .filter(([, path]) => !have.has(path))
    .map(([title, path]) => ({ title, url: SITE + path, path }))
    .slice(0, items.length ? 3 : 4);

  const model = { name, items, extras, country };

  try {
    const sent = await send({
      from: FROM,
      to: [email],
      reply_to: REPLY_TO,
      subject: items.length
        ? `Your guide pack — ${items.length} guide${items.length === 1 ? '' : 's'}`
        : 'Your Ethicare guide pack',
      html: packHtml(model),
      text: packText(model)
    });

    /* Office notification. Separate call so a failure here cannot stop the
       reader's pack from being reported as sent. */
    try {
      await send({
        from: FROM,
        to: [NOTIFY],
        reply_to: email,
        subject: `Guide pack sent — ${name || email}${country ? ` (${COUNTRY_NAME[country]})` : ''}`,
        text: [
          `${name || '(no name)'} <${email}>`,
          country ? `Heading: ${COUNTRY_NAME[country]}` : 'Heading: not sure yet',
          household ? `Household: ${household}` : '',
          '',
          items.length ? `Added (${items.length}):\n${items.map((g) => `  · ${g.title} — ${g.path}`).join('\n')}` : 'Added nothing — sent the starter set.',
          '',
          `Extras included:\n${extras.map((g) => `  · ${g.title} — ${g.path}`).join('\n')}`,
          '',
          'Reply to this email to reply to them.'
        ].filter((s) => s !== '').join('\n')
      });
    } catch (e) { /* notification only */ }

    return reply(200, { ok: true, id: sent && sent.id });
  } catch (err) {
    console.error('send-pack: ' + String(err.message || err));
    return reply(502, { error: 'Send failed' });
  }
};
