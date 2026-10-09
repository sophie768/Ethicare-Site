/* ============================================================================
   Ethicare Resourcing — the pack email
   POST /.netlify/functions/send-pack

   Sends ONE email: the guides the candidate ticked on /my-pack, in the order a move
   happens, each with a line on why it matters and how long it takes; their next three
   steps for their country and profession; a link that reopens the pack on any device;
   and a way into Plan Ethicare and live roles. A plain notification goes to the office.

   7 Oct 2026 rebuild. What changed and why:
     - Guides are looked up BY ID in pack-data.js (shared with the browser). Titles,
       descriptions and links never come from the request, so this endpoint cannot be
       made to email someone invented text from Ethicare's address. The old
       "Title (/url)" lines are still read as a fallback, with their url checked.
     - Grouped by stage, "read this first" marked, reading time shown, three next steps.
   No mailing list unless they opted in on the form; no follow-up sequence.

   The page ALSO posts to Netlify Forms (`my-pack`) before calling this. That post is
   the record; this is the delivery. If this fails, the record still exists.

   Env vars (Netlify, Production only): RESEND_API_KEY.
   Optional: PACK_FROM (default Sophie), PACK_NOTIFY (default hello@).
   ============================================================================ */

const IMG = require('../lib/email-images.js');
const CATALOGUE = require('../../pack-data.js');

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.PACK_FROM || 'Sophie Careem <sophie@ethicareresourcing.com>';
const NOTIFY = process.env.PACK_NOTIFY || 'hello@ethicareresourcing.com';
const REPLY_TO = 'hello@ethicareresourcing.com';

const ALLOWED = ['https://ethicareresourcing.com', 'https://www.ethicareresourcing.com', 'https://ethicareresourcing.netlify.app'];
const MAX_BODY = 12000;

/* Links follow whichever of OUR hosts the page was served from (the .com still points at
   the old Wix site until the domain transfer, 7 Oct 2026); never anything outside ALLOWED. */
function siteFor(headers) {
  const h = headers || {};
  const origin = h.origin || h.Origin || '';
  if (ALLOWED.indexOf(origin) !== -1) return origin;
  const host = 'https://' + String(h['x-forwarded-host'] || h.host || '').split(',')[0].trim();
  return ALLOWED.indexOf(host) !== -1 ? host : 'https://ethicareresourcing.com';
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
function reply(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS }, body: JSON.stringify(body) };
}
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BY_ID = {}; CATALOGUE.items.forEach((i) => { BY_ID[i.id] = i; });
const BY_URL = {}; CATALOGUE.items.forEach((i) => { BY_URL[i.u] = i; });
const COUNTRY_NAME = { nz: 'New Zealand', au: 'Australia' };

/* Stage headings for the email — the catalogue groups, in the order a move happens. */
const STAGE = {
  start: 'Getting started',
  where: 'Where you might live',
  register: 'Registration and the work',
  work: 'Pay, cost and getting the job',
  visa: 'Visas and the move',
  family: 'Your partner and children',
  settle: 'Your first months'
};

const IMAGING = { imaging: 1, sonography: 1, radtherapy: 1, nuclearmed: 1 };
const PROF_LABEL = {
  imaging: 'radiographers', sonography: 'sonographers', radtherapy: 'radiation therapists', nuclearmed: 'nuclear medicine technologists',
  medicine: 'doctors', physio: 'physiotherapists', ot: 'occupational therapists', psychology: 'psychologists', socialwork: 'social workers',
  anaesthetic: 'anaesthetic technicians', speech: 'speech and language therapists', dietetics: 'dietitians', midwifery: 'midwives', nursing: 'nurses'
};

/* ---- which guides: ids first, old "Title (/url)" lines as a fallback ---- */
function resolveItems(msg) {
  const out = [], seen = {};
  const ids = Array.isArray(msg.ids) ? msg.ids : [];
  ids.slice(0, 120).forEach((id) => { const it = BY_ID[String(id)]; if (it && !seen[it.id]) { seen[it.id] = 1; out.push(it); } });
  if (!out.length) {
    String(msg.pack || msg['pack-contents'] || '').split('\n').forEach((line) => {
      const m = line.match(/\((\/[^)]*)\)\s*$/);
      const it = m && BY_URL[m[1]];
      if (it && !seen[it.id]) { seen[it.id] = 1; out.push(it); }
    });
  }
  return out;
}

/* ---- the one to read first: their registration route is the real timeline ---- */
function readFirst(items, prof) {
  const reg = items.filter((i) => i.g === 'register');
  return reg.find((i) => i.prof && prof && i.prof.indexOf(prof) !== -1)
    || reg.find((i) => i.core)
    || items.find((i) => i.g === 'start')
    || items[0];
}

/* ---- next three steps, for their country and profession ----
   Standing rules: Australia outside medical imaging gets Sophie's wording (imaging at
   present, more in the coming weeks); Australia never mentions nursing; nothing says
   Ethicare does not recruit a profession. */
function nextSteps(site, dest, prof) {
  const auImaging = dest === 'au' && IMAGING[prof];
  const steps = [];
  if (dest === 'au' && prof === 'sonography') {
    steps.push(['Check your route: ASMIRT, then ASAR', 'Sonography in Australia is accredited, not registered. The pathway checker shows what ASMIRT will assess and what it costs.', site + '/pathway-checker']);
  } else if (auImaging) {
    steps.push(['Check your route with the MRPBA', 'Registration through Ahpra is the real timeline. The pathway checker shows your likely route and what it costs.', site + '/pathway-checker']);
  } else if (dest === 'nz' || dest === 'au') {
    steps.push(['Check your registration route', 'Your board or council decides, and registration usually sets the pace of the whole move. The pathway checker shows your likely route.', site + '/pathway-checker']);
  } else {
    steps.push(['Compare the two countries', 'Registration, visas, pay and everyday life side by side, before you choose.', site + '/guides/australia-vs-new-zealand']);
  }
  steps.push(['Put your move in order', 'Plan Ethicare takes the same answers and lays out registration, the visa, money and the first month in the order they happen.', site + '/plan']);
  /* Jobs are no longer a step: the closing line covers them, honestly (Sophie, 7 Oct 2026). */
  return steps;
}

/* ---------- the email ----------
   7 Oct 2026 rewrite (Sophie: "it is not warm or human"). A letter from Sophie first —
   thanks, one line from her own memory of the country they are looking at (her words,
   6 Oct 2026), one line for whoever is coming with them, and where she would start —
   then the guides as a table underneath, the next three steps, and a pointer to the
   jobs for when they are ready (no offer of a call: Sophie, 7 Oct 2026). Warm through specifics, not adjectives; no certainty about anything a
   regulator decides. */
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const INK = '#2B3330', MUT = '#5A6662', TEAL = '#02615D', LIME = '#A6C84A', CREAM = '#FCFBF8', MINT = '#E6F1ED', RULE = '#DCE8E2';

function letter(m) {
  /* Sophie's wording (7 Oct 2026): short, so the candidate reaches their guides quickly.
     The personal line is two or three sentences, never a travel article. New Zealand is
     "Kia ora" / "Ngā mihi"; she lived there for many years. */
  const P = [];
  P.push('Thank you for putting your pack together. Moving your career and your life to the other side of the world is a big decision, and most people start exactly where you are now, exploring, comparing and working out whether it could be right for them.');
  if (m.dest === 'nz') P.push('I lived in New Zealand for many years, and there\u2019s so much I still miss: the blue skies, the space, the outdoor lifestyle and never being too far from somewhere beautiful. And, of course, the coffee.');
  else if (m.dest === 'au') P.push('I spent time in Australia, and there\u2019s so much I remember fondly: the birdsong first thing in the morning, the outdoor lifestyle, and how seriously Australians take their coffee.');
  else P.push('I lived in New Zealand for many years and have spent time in Australia, so I understand why choosing between them isn\u2019t always straightforward. Each has something the other doesn\u2019t.');
  P.push('There\u2019s a practical side to the move too: registration, visas, salaries, schools and deciding where to live. That\u2019s what these guides are here to help with.');
  if (m.hh === 'children' || m.hh === 'both') P.push('As your children are coming with you, I\u2019d read the schools guide early. It can have a real bearing on where you choose to live and how you plan the move.');
  else if (m.hh === 'partner') P.push('As your partner is coming with you, I\u2019d look at their work early too. It can have a real bearing on where you choose to live and how you plan the move.');
  else if (m.hh === 'parent') P.push('As a parent is coming with you, I\u2019d read the family guide early. A parent\u2019s visa is a separate question from yours, and it can shape how you plan the move.');
  return P;
}
/* "Where I'd start" — named as the step, not the guide title, and linked to the guide. */
function startLine(m) {
  const it = m.first; if (!it) return null;
  if (it.g === 'register') {
    const sono = m.dest === 'au' && it.id === 'au-reg-asar';
    const what = sono ? 'your ASMIRT and ASAR pathway' : 'your ' + (m.dest === 'nz' ? 'New Zealand ' : m.dest === 'au' ? 'Australian ' : '') + 'registration pathway';
    return { what: what, why: (sono ? 'Accreditation' : 'Registration') + ' usually sets the pace for everything else, so understanding your route early makes the rest much easier.' };
  }
  return { what: it.t, why: 'It gives you the clearest picture of what\u2019s ahead before you get into the detail.' };
}
const CHOSEN_INTRO = 'I\u2019ve included your selected guides below. Work through them in your own time. You don\u2019t need to have everything figured out yet.';
/* Sophie, 7 Oct 2026: no offer of a call, as we cannot speak to everyone who downloads a
   pack. The close points to applying for jobs instead. Australia outside imaging goes to
   the interest form, never "we don't recruit". */
function closing(m) {
  const auWait = m.dest === 'au' && !IMAGING[m.prof];
  const rest = ' Whichever way you find your job, these guides are yours to use, and they\u2019ll be here whenever you need them.';
  if (auWait) return { text: 'When you\u2019re ready to start applying for jobs, register your interest. We\u2019re focusing on medical imaging in Australia at present, and that will change in the coming weeks, so we\u2019ll let you know if we have a role that could suit you.' + rest, link: m.site + '/jobs/coming-to-australia#notify', label: 'register your interest' };
  return { text: 'When you\u2019re ready to start applying for jobs, have a look at our current vacancies. We only have a small number of roles at any one time, so we can\u2019t place everyone, but if one fits, we\u2019ll speak to the employer for you and stay with you through the move.' + rest, link: m.site + '/jobs', label: 'our current vacancies' };
}
const greet = (m) => (m.dest === 'nz' ? 'Kia ora' : 'Hi') + (m.firstName ? ' ' + m.firstName : '') + ',';
const signoff = (m) => m.dest === 'nz' ? 'Ng\u0101 mihi,' : 'Warm wishes,';

function guideRows(m) {
  const stage = (g) => { const l = m.items.filter((i) => i.g === g); return l.indexOf(m.first) > 0 ? [m.first].concat(l.filter((i) => i !== m.first)) : l; };
  return CATALOGUE.groups.map((g) => [g[0], stage(g[0])]).filter((x) => x[1].length).map(([g, list]) =>
    `<tr><td colspan="2" style="padding:12px 16px 10px;background:#F3F7F4;border-top:1px solid ${RULE};font-family:${SANS};font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#2F5E49">${esc(STAGE[g] || g)}</td></tr>` +
    list.map((it) => `<tr>
      <td style="padding:13px 10px 13px 16px;border-top:1px solid ${RULE};vertical-align:top">
        ${it === m.first ? `<span style="display:inline-block;margin:0 0 5px;padding:2px 8px;border-radius:6px;background:${LIME};font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#01312F">Read this first</span><br>` : ''}
        <a href="${esc(m.site + it.u)}" style="font-family:${SANS};font-size:16px;font-weight:600;line-height:1.35;color:${TEAL};text-decoration:none">${esc(it.t)}</a>
        <div style="margin-top:3px;font-family:${SANS};font-size:14px;line-height:1.45;color:${MUT}">${esc(it.d)}</div>
      </td>
      <td style="padding:13px 16px 13px 6px;border-top:1px solid ${RULE};vertical-align:top;text-align:right;white-space:nowrap;width:96px">
        <div style="font-family:${SANS};font-size:12.5px;color:${MUT};margin:2px 0 8px">${esc((it.m || '').replace(/ · [\d.]+ [KM]B$/, ''))}</div>
        <a href="${esc(m.site + it.u)}" style="display:inline-block;padding:7px 12px;border-radius:8px;background:${TEAL};font-family:${SANS};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none">Open &rarr;</a>
        ${it.x ? `<div style="margin-top:8px"><a href="${esc(m.site + it.x)}" style="font-family:${SANS};font-size:12.5px;font-weight:600;color:${TEAL};text-decoration:underline">PDF version</a></div>` : ''}
      </td></tr>`).join('')).join('');
}

function packHtml(m) {
  const first = m.firstName ? esc(m.firstName) : '';
  const paras = letter(m).map((t) => `<p style="margin:0 0 16px;font-family:${SANS};font-size:16.5px;line-height:1.65;color:${INK}">${esc(t)}</p>`).join('');
  const steps = m.steps.map((s, i) => `<tr><td style="padding:0 0 16px;vertical-align:top;width:36px"><div style="width:26px;height:26px;border-radius:13px;background:${TEAL};color:#fff;font-family:${SANS};font-size:13.5px;font-weight:700;line-height:26px;text-align:center">${i + 1}</div></td>
    <td style="padding:0 0 16px"><a href="${esc(s[2])}" style="font-family:${SANS};font-size:16px;font-weight:600;color:${TEAL};text-decoration:underline">${esc(s[0])}</a>
    <div style="margin-top:3px;font-family:${SANS};font-size:14.5px;line-height:1.5;color:${INK}">${esc(s[1])}</div></td></tr>`).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Your guides</title></head>
<body style="margin:0;padding:0;background:${CREAM}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Everything you chose, in one place, and where I’d start.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM}"><tr><td align="center" style="padding:24px 14px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">

<tr><td style="padding:0 6px 14px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="vertical-align:middle"><img src="cid:ethicare-logo" width="26" height="26" alt="" style="display:block;border-radius:5px"></td>
    <td style="vertical-align:middle;padding-left:9px;font-family:${SANS};font-size:15px;color:${TEAL}">Ethicare <strong>Resourcing</strong></td>
  </tr></table>
</td></tr>

<tr><td style="background:#ffffff;border:1px solid ${RULE};border-radius:16px;padding:30px 30px 10px">
  <p style="margin:0 0 18px;font-family:${SANS};font-size:17px;line-height:1.6;color:${INK}">${esc(greet(m))}</p>
  ${paras}
  ${m.start ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px"><tr><td style="border-left:3px solid ${LIME};padding:4px 0 4px 16px">
    <div style="font-family:${SANS};font-size:16.5px;line-height:1.6;color:${INK}"><strong>Where I\u2019d start:</strong> <a href="${esc(m.site + m.first.u)}" style="color:${TEAL};font-weight:600">${esc(m.start.what)}</a>. ${esc(m.start.why)}</div>
  </td></tr></table>` : ''}

  <p style="margin:8px 0 8px;font-family:${SANS};font-size:18px;font-weight:600;color:${TEAL}">Everything you chose, in one place</p>
  <p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:1.6;color:${INK}">${esc(CHOSEN_INTRO)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${RULE};border-radius:12px;border-collapse:separate;overflow:hidden">${guideRows(m)}</table>
  <p style="margin:12px 0 26px;font-family:${SANS};font-size:14px;line-height:1.55;color:${MUT}">Your pack stays on the site too, so you can <a href="${esc(m.reopen)}" style="color:${TEAL};font-weight:600">open it on any phone or laptop</a> and add to it.</p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MINT};border-radius:14px"><tr><td style="padding:22px 22px 8px">
    <p style="margin:0 0 16px;font-family:${SANS};font-size:18px;font-weight:600;color:${TEAL}">Here\u2019s what I\u2019d do next</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>
  </td></tr></table>

  <p style="margin:26px 0 16px;font-family:${SANS};font-size:16.5px;line-height:1.65;color:${INK}">${(function(){const c=closing(m);return esc(c.text).replace(esc(c.label),'<a href="'+esc(c.link)+'" style="color:'+TEAL+';font-weight:600">'+esc(c.label)+'</a>');})()}</p>
  <p style="margin:0 0 14px;font-family:${SANS};font-size:16.5px;line-height:1.6;color:${INK}">${esc(signoff(m))}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px"><tr>
    <td style="vertical-align:middle"><img src="cid:sophie-photo" width="56" height="56" alt="Sophie Careem" style="display:block;border-radius:28px"></td>
    <td style="vertical-align:middle;padding-left:14px;font-family:${SANS};font-size:15.5px;line-height:1.45;color:${INK}"><strong style="font-size:17px">Sophie</strong><br><span style="color:${MUT}">Sophie Careem &middot; Founder, Ethicare Resourcing</span></td>
  </tr></table>
</td></tr>

<tr><td style="padding:20px 8px 0">
  <p style="margin:0 0 10px;font-family:${SANS};font-size:12.5px;line-height:1.6;color:${MUT}">You are getting this because you asked for a guide pack at ethicareresourcing.com. ${m.optedIn ? 'You also asked to hear from us again; every email we send has a way to stop them.' : 'It is a single email, and you have not been added to a mailing list.'} Your address will not be passed on. <a href="${esc(m.site)}/how-we-use-your-information" style="color:#2F5E49;text-decoration:underline">How we use your information</a></p>
  <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUT}">Ethicare Resourcing Ltd &middot; Company No 14646354 &middot; Office 1, One Coldbath Square, London EC1R 5HL &middot; +44 20 4626 6580</p>
</td></tr>

</table></td></tr></table></body></html>`;
}

function packText(m) {
  const L = [greet(m), ''];
  letter(m).forEach((t) => L.push(t, ''));
  if (m.start) L.push(`Where I\u2019d start: ${m.start.what}. ${m.start.why}`, m.site + m.first.u, '');
  L.push('EVERYTHING YOU CHOSE, IN ONE PLACE', CHOSEN_INTRO);
  CATALOGUE.groups.forEach((g) => {
    const list = m.items.filter((i) => i.g === g[0]);
    if (!list.length) return;
    L.push('', (STAGE[g[0]] || g[0]).toUpperCase());
    list.forEach((it) => { L.push(`  ${it.t}${it.m ? ' (' + it.m + ')' : ''}`, `  ${it.d}`, `  ${m.site + it.u}`); if (it.x) L.push(`  PDF version: ${m.site + it.x}`); });
  });
  L.push('', 'Open your pack on any device: ' + m.reopen, '', 'HERE\u2019S WHAT I\u2019D DO NEXT');
  m.steps.forEach((s, i) => L.push(`  ${i + 1}. ${s[0]}`, `     ${s[1]}`, `     ${s[2]}`));
  L.push('', closing(m).text, closing(m).link,
    '', signoff(m), 'Sophie', 'Sophie Careem · Founder, Ethicare Resourcing', '',
    'You are getting this because you asked for a guide pack at ethicareresourcing.com. ' + (m.optedIn ? 'You also asked to hear from us again; every email has a way to stop them.' : 'It is a single email, and you have not been added to a mailing list.') + ' Your address will not be passed on.',
    m.site + '/how-we-use-your-information', '', 'Ethicare Resourcing Ltd · Company No 14646354 · Office 1, One Coldbath Square, London EC1R 5HL · +44 20 4626 6580');
  return L.join('\n');
}

async function send(payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`resend ${res.status}: ${text.slice(0, 300)}`);
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
  if (msg['bot-trap'] || msg['bot-field']) return reply(200, { ok: true });

  const email = String(msg.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply(400, { error: 'valid email required' });

  const items = resolveItems(msg);
  if (!items.length) return reply(400, { error: 'no guides' });

  const clip = (v, n) => String(v || '').trim().slice(0, n).replace(/[<>\r\n]/g, ' ');
  const site = siteFor(event.headers);
  const name = clip(msg.name, 60);
  const dest = msg.destination === 'nz' || msg.destination === 'au' ? msg.destination : '';
  const prof = /^[a-z]{2,20}$/.test(String(msg.prof || '')) ? String(msg.prof) : '';
  const household = clip(msg.household, 120), profession = clip(msg.profession, 80);
  const timeline = clip(msg.timeline, 60), phone = clip(msg.phone, 40);
  const roleAlerts = msg.role_alerts === 'Yes', quarterly = msg.quarterly_update === 'Yes';

  const hh = /^(alone|partner|children|both|parent)$/.test(String(msg.hh || '')) ? String(msg.hh) : '';
  const m = {
    site, name, dest, items, hh, prof,
    firstName: name.split(/\s+/)[0] || '',
    first: readFirst(items, prof),
    start: null,
    steps: nextSteps(site, dest, prof),
    reopen: site + '/my-pack?p=' + items.map((i) => i.id).join(','),
    optedIn: roleAlerts || quarterly
  };

  m.start = startLine(m);

  try {
    const sent = await send({
      from: FROM, to: [email], reply_to: REPLY_TO,
      subject: `${m.firstName ? m.firstName + ', your' : 'Your'} guides for ${dest ? COUNTRY_NAME[dest] : 'New Zealand and Australia'}`,
      html: packHtml(m), text: packText(m),
      attachments: [IMG.logo, IMG.sophie]   // inline (cid:) so the pictures show without fetching from the site
    });

    try {
      await send({
        from: FROM, to: [NOTIFY], reply_to: email,
        subject: `Guide pack sent — ${name || email}${dest ? ` (${COUNTRY_NAME[dest]})` : ''}${timeline ? ' · ' + timeline : ''}`,
        text: [
          `${name || '(no name)'} <${email}>`,
          dest ? `Heading: ${COUNTRY_NAME[dest]}` : 'Heading: not sure yet',
          profession ? `Profession: ${profession}` : '',
          household ? `Household: ${household}` : '',
          timeline ? `Thinking of moving: ${timeline}` : '',
          phone ? `Phone: ${phone}` : '',
          roleAlerts ? 'Opted in: role alerts' : '',
          quarterly ? 'Opted in: quarterly update' : '',
          '',
          `Chose (${items.length}):`,
          ...items.map((i) => `  · ${i.t} — ${i.u}`),
          '',
          'Reply to this email to reply to them.'
        ].filter((s) => s !== '').join('\n')
      });
    } catch (e) { console.error('send-pack: office notification failed — ' + e.message); }

    return reply(200, { ok: true, id: sent && sent.id });
  } catch (err) {
    console.error('send-pack: ' + String(err.message || err));
    return reply(502, { error: 'Send failed' });
  }
};
