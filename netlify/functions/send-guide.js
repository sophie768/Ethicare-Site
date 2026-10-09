/* ============================================================================
   Ethicare Resourcing — "Email me the guide"
   POST /.netlify/functions/send-guide

   Emails ONE relocation guide to the person who asked for it on
   /request-a-guide, as a link to the PDF on our own site (several of the
   Australian city guides are over 10 MB, which is too big to attach and would
   bounce at many hospital mail gateways). A second, plain notification goes
   to the office so the request is visible without opening Resend.

   The page ALSO posts to Netlify Forms (form name `guide-request`) before
   calling this. That post is the record — it carries the consent wording and
   the two opt-ins. This is only the delivery. If this fails, nothing is lost:
   the request is still captured and the person can be sent the guide by hand.

   Contract with request-a-guide.html:
     POST {name, email, guide, profession, destination} → 200 {sent:true}

   Deliberately narrow, same posture as send-result.js and send-pack.js. The
   browser chooses a guide by its TITLE, and the title is looked up in the
   GUIDES table below — the PDF path never comes from the request, so this
   endpoint cannot be made to email an arbitrary link, subject or body on
   Ethicare's behalf. Anything not in the table is refused.

   Env vars (Netlify → Site configuration → Environment variables, scope
   Production only):
     RESEND_API_KEY        Resend → API keys → Create (sending access)
   Optional:
     GUIDE_FROM            default "Sophie Careem <sophie@ethicareresourcing.com>"
     GUIDE_NOTIFY          default "hello@ethicareresourcing.com"

   Add a guide here when it is added to the dropdown on /request-a-guide
   (tools/build-downloads-page.js writes the download list; the dropdown and
   this table are hand-kept and must agree).
   ============================================================================ */

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.GUIDE_FROM || 'Sophie Careem <sophie@ethicareresourcing.com>';
const NOTIFY = process.env.GUIDE_NOTIFY || 'hello@ethicareresourcing.com';
const REPLY_TO = 'hello@ethicareresourcing.com';
const SITE = 'https://ethicareresourcing.com';

const ALLOWED = ['https://ethicareresourcing.com', 'https://www.ethicareresourcing.com', 'https://ethicareresourcing.netlify.app'];
const MAX_BODY = 4000;

/* Links in the email point at whichever of OUR hosts the page was served from. While
   ethicareresourcing.com still resolves to the old Wix site (not transferred yet, 7 Oct
    2026) the live build is ethicareresourcing.netlify.app, and a hard-coded .com link
   would send people to the wrong site. Only an origin in ALLOWED is ever used, so a
   request cannot make the email link anywhere else. No edit is needed after the move. */
function siteFor(headers) {
  const h = headers || {};
  const origin = h.origin || h.Origin || '';
  if (ALLOWED.indexOf(origin) !== -1) return origin;
  const host = 'https://' + String(h['x-forwarded-host'] || h.host || '').split(',')[0].trim();
  if (ALLOWED.indexOf(host) !== -1) return host;
  return SITE;
}

/* title as it appears in the dropdown → [country, pdf path] */
const GUIDES = {
  'Moving to New Zealand':              ['nz', '/assets/downloads/moving-to-new-zealand.pdf'],
  'Auckland':                           ['nz', '/assets/downloads/auckland-relocation-guide.pdf'],
  'Wellington':                         ['nz', '/assets/downloads/wellington-relocation-guide.pdf'],
  'Christchurch':                       ['nz', '/assets/downloads/christchurch-relocation-guide.pdf'],
  'Waikato':                            ['nz', '/assets/downloads/waikato-relocation-guide.pdf'],
  'Bay of Plenty':                      ['nz', '/assets/downloads/bay-of-plenty-relocation-guide.pdf'],
  'Northland':                          ['nz', '/assets/downloads/northland-relocation-guide.pdf'],
  'Hawke’s Bay':                   ['nz', '/assets/downloads/hawkes-bay-relocation-guide.pdf'],
  'Palmerston North':                   ['nz', '/assets/downloads/palmerston-north-relocation-guide.pdf'],
  'Nelson Tasman':                      ['nz', '/assets/downloads/nelson-tasman-relocation-guide.pdf'],
  'Dunedin':                            ['nz', '/assets/downloads/dunedin-relocation-guide.pdf'],
  'Central Otago & Queenstown Lakes':   ['nz', '/assets/downloads/central-otago-relocation-guide.pdf'],
  'Southland':                          ['nz', '/assets/downloads/southland-relocation-guide.pdf'],
  'Gisborne':                           ['nz', '/assets/downloads/gisborne-relocation-guide.pdf'],
  'Moving to Australia':                ['au', '/assets/downloads/moving-to-australia.pdf'],
  'New South Wales':                    ['au', '/assets/downloads/new-south-wales-relocation-guide.pdf'],
  'Victoria':                           ['au', '/assets/downloads/victoria-relocation-guide.pdf'],
  'Queensland':                         ['au', '/assets/downloads/queensland-relocation-guide.pdf'],
  'Western Australia':                  ['au', '/assets/downloads/western-australia-relocation-guide.pdf'],
  'South Australia':                    ['au', '/assets/downloads/south-australia-relocation-guide.pdf'],
  'Tasmania':                           ['au', '/assets/downloads/tasmania-relocation-guide.pdf'],
  'Sydney':                             ['au', '/assets/downloads/sydney-relocation-guide.pdf'],
  'Melbourne':                          ['au', '/assets/downloads/melbourne-relocation-guide.pdf'],
  'Brisbane':                           ['au', '/assets/downloads/brisbane-relocation-guide.pdf'],
  'Gold Coast':                         ['au', '/assets/downloads/gold-coast-relocation-guide.pdf'],
  'Perth':                              ['au', '/assets/downloads/perth-relocation-guide.pdf'],
  'Adelaide':                           ['au', '/assets/downloads/adelaide-relocation-guide.pdf'],
  'Canberra':                           ['au', '/assets/downloads/canberra-relocation-guide.pdf'],
  'Darwin':                             ['au', '/assets/downloads/darwin-relocation-guide.pdf'],
  'Hobart':                             ['au', '/assets/downloads/hobart-relocation-guide.pdf'],
  'Newcastle':                          ['au', '/assets/downloads/newcastle-relocation-guide.pdf'],
  'Geelong':                            ['au', '/assets/downloads/geelong-relocation-guide.pdf'],
  'Bundaberg':                          ['au', '/assets/downloads/bundaberg-relocation-guide.pdf'],
  'Bunbury':                            ['au', '/assets/downloads/bunbury-relocation-guide.pdf'],
  'Mandurah':                           ['au', '/assets/downloads/mandurah-relocation-guide.pdf']
};

/* The national guide for the other country, offered once as a second link. */
const NATIONAL = {
  nz: ['Moving to New Zealand', '/assets/downloads/moving-to-new-zealand.pdf', '/new-zealand'],
  au: ['Moving to Australia', '/assets/downloads/moving-to-australia.pdf', '/australia']
};
const COUNTRY_NAME = { nz: 'New Zealand', au: 'Australia' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function reply(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS }, body: JSON.stringify(body) };
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const F = "font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

function guideHtml(m) {
  const first = esc((m.name.split(/\s+/)[0]) || 'there');
  const isNational = m.title.indexOf('Moving to') === 0;
  const what = isNational
    ? 'our national guide to ' + COUNTRY_NAME[m.country]
    : 'our ' + esc(m.title) + ' relocation guide';
  return '<!DOCTYPE html><html><body style="margin:0;background:#FCFBF8;padding:28px 16px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E3ECE5;border-radius:14px">' +
    '<tr><td style="padding:28px 28px 0">' +
    '<p style="margin:0 0 6px;' + F + ';font-weight:700;font-size:11px;line-height:1;letter-spacing:.16em;text-transform:uppercase;color:#2F5E49">Relocation guide</p>' +
    '<h1 style="margin:0 0 14px;' + F + ';font-weight:600;font-size:24px;line-height:1.2;color:#02615D">Here is your guide, ' + first + '</h1>' +
    '<p style="margin:0 0 18px;' + F + ';font-size:15px;line-height:1.6;color:#555">You asked for ' + what + '. It is a PDF on our site &mdash; the link below opens it, and it is the current edition, rebuilt whenever a chapter behind it changes.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 28px">' +
    '<a href="' + esc(m.url) + '" style="display:inline-block;background:#02615D;color:#fff;text-decoration:none;' + F + ';font-weight:600;font-size:15px;line-height:1;padding:14px 22px;border-radius:10px">Open ' + esc(m.title) + ' (PDF) &rarr;</a>' +
    '</td></tr>' +
    (m.other ? '<tr><td style="padding:22px 28px 0">' +
      '<p style="margin:0;' + F + ';font-size:14px;line-height:1.6;color:#555">Weighing up both countries? <a href="' + esc(m.other.url) + '" style="color:#02615D;font-weight:600">' + esc(m.other.title) + '</a> is the other national guide, and <a href="' + esc(m.site + '/guides/australia-vs-new-zealand') + '" style="color:#02615D;font-weight:600">this page</a> compares the two side by side.</p>' +
      '</td></tr>' : '') +
    '<tr><td style="padding:22px 28px 0">' +
    '<p style="margin:0;' + F + ';font-size:14px;line-height:1.6;color:#555">When you are ready for the practical side, <a href="' + m.site + '/plan" style="color:#02615D;font-weight:600">Plan Ethicare</a> sequences the whole move &mdash; registration, visa, documents, somewhere to live &mdash; and <a href="' + m.site + '/ask" style="color:#02615D;font-weight:600">Ask Ethicare</a> answers the questions the guide leaves you with. Both are free, whether or not your job comes from us.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:22px 28px 28px">' +
    '<p style="margin:0;' + F + ';font-size:14px;line-height:1.6;color:#333">Sophie Careem<br>Founder, Ethicare Resourcing</p>' +
    '<p style="margin:14px 0 0;' + F + ';font-size:13px;line-height:1.6;color:#555">You are getting this one email because you asked for a guide at ethicareresourcing.com. It is not a mailing list and your address will not be passed on. <a href="' + m.site + '/how-we-use-your-information" style="color:#02615D">How we use your information</a></p>' +
    '<p style="margin:10px 0 0;' + F + ';font-size:13px;line-height:1.6;color:#555">Ethicare Resourcing Ltd &middot; Company No 14646354 &middot; Office 1, One Coldbath Square, London EC1R 5HL</p>' +
    '</td></tr></table></body></html>';
}

function guideText(m) {
  const first = (m.name.split(/\s+/)[0]) || 'there';
  return [
    'Here is your guide, ' + first + '.',
    '',
    m.title + ' (PDF): ' + m.url,
    '',
    m.other ? 'The other national guide: ' + m.other.title + ' — ' + m.other.url : '',
    m.other ? 'Compare the two countries: ' + m.site + '/guides/australia-vs-new-zealand' : '',
    m.other ? '' : null,
    'Plan Ethicare sequences the whole move: ' + m.site + '/plan',
    'Ask Ethicare answers the questions the guide leaves you with: ' + m.site + '/ask',
    'Both are free, whether or not your job comes from us.',
    '',
    'Sophie Careem',
    'Founder, Ethicare Resourcing',
    '',
    'You are getting this one email because you asked for a guide at ethicareresourcing.com.',
    'It is not a mailing list and your address will not be passed on.',
    m.site + '/how-we-use-your-information',
    '',
    'Ethicare Resourcing Ltd · Company No 14646354',
    'Office 1, One Coldbath Square, London EC1R 5HL · +44 20 4626 6580'
  ].filter((s) => s !== null && s !== '').join('\n');
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
    console.error('send-guide: RESEND_API_KEY is not set in this environment');
    return reply(503, { error: 'Sender not configured' });
  }

  let msg;
  try { msg = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'invalid JSON' }); }
  if (msg['bot-field']) return reply(200, { ok: true });            // honeypot: accept, do nothing

  const email = String(msg.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply(400, { error: 'valid email required' });

  const title = String(msg.guide || '').trim();
  const hit = Object.prototype.hasOwnProperty.call(GUIDES, title) ? GUIDES[title] : null;
  if (!hit) return reply(400, { error: 'unknown guide' });

  const name = String(msg.name || '').trim().slice(0, 60).replace(/[<>]/g, '');
  const profession = String(msg.profession || '').trim().slice(0, 80).replace(/[<>]/g, '');
  const destination = String(msg.destination || '').trim().slice(0, 40).replace(/[<>]/g, '');
  const country = hit[0];
  const otherKey = country === 'nz' ? 'au' : 'nz';
  const stillDeciding = /both|deciding/i.test(destination);
  const site = siteFor(event.headers);
  const other = stillDeciding ? { title: NATIONAL[otherKey][0], url: site + NATIONAL[otherKey][1] } : null;
  const model = { name, title, country, url: site + hit[1], other, site };

  try {
    await send({
      from: FROM,
      to: [email],
      reply_to: REPLY_TO,
      subject: 'Your ' + title + ' guide — Ethicare',
      html: guideHtml(model),
      text: guideText(model)
    });

    /* Office notification — separate call so a failure here cannot stop the
       reader's copy from being reported as sent. */
    try {
      await send({
        from: FROM,
        to: [NOTIFY],
        reply_to: email,
        subject: 'Guide emailed — ' + title + ' — ' + (name || email),
        text: [
          (name || '(no name)') + ' <' + email + '>',
          'Guide: ' + title + ' (' + COUNTRY_NAME[country] + ')',
          profession ? 'Profession: ' + profession : 'Profession: not given',
          destination ? 'Thinking of: ' + destination : 'Thinking of: not given',
          msg.role_alerts === 'Yes' ? 'Opted in: role alerts' : '',
          msg.quarterly_update === 'Yes' ? 'Opted in: quarterly update' : '',
          '',
          'The full submission, with the consent wording, is in Netlify → Forms → guide-request.'
        ].filter(Boolean).join('\n')
      });
    } catch (e) {
      console.error('send-guide: office notification failed — ' + e.message);
    }

    return reply(200, { sent: true });
  } catch (e) {
    console.error('send-guide: ' + e.message);
    return reply(502, { error: 'Send failed' });
  }
};
