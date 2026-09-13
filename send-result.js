/* Send a pathway-checker result to the candidate.
   The provider key lives ONLY in Netlify env vars; it is never sent to the browser.
   Set:  RESEND_API_KEY  (Site config → Environment variables), and verify the sending
   domain in Resend before the first send or every message is rejected.
   Contract with pathway-checker.js:  POST {name, email, summary, resumeLink} → 200 {sent:true}

   Deliberately narrow. It takes no subject, no HTML and no arbitrary recipient from the
   browser — only the four fields above — so the endpoint cannot be used to send mail on
   Ethicare's behalf. That is the mistake the Ask Ethicare proxy made by trusting a
   client-supplied system prompt; it is not repeated here. */

const FROM = 'Ethicare Resourcing <hello@ethicareresourcing.com>';
const ALLOWED = ['https://ethicareresourcing.com', 'https://www.ethicareresourcing.com', 'https://ethicareresourcing.netlify.app'];
const MAX_BODY = 8000;

function json(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function template(name, summary, resumeLink) {
  const first = esc((String(name || '').trim().split(/\s+/)[0]) || 'there');
  const rows = String(summary || '').split(' | ').filter(Boolean)
    .map(function (r) { return '<tr><td style="padding:10px 0;border-bottom:1px solid #E3ECE5;font:15px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#333">' + esc(r) + '</td></tr>'; })
    .join('');
  return '<!DOCTYPE html><html><body style="margin:0;background:#FCFBF8;padding:28px 16px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E3ECE5;border-radius:14px">' +
    '<tr><td style="padding:28px 28px 0">' +
    '<p style="margin:0 0 6px;font:700 11px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#2F5E49">Registration pathway checker</p>' +
    '<h1 style="margin:0 0 14px;font:600 24px/1.2 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#02615D">Your starting point, ' + first + '</h1>' +
    '<p style="margin:0 0 18px;font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#555">Here is what your answers pointed to. Keep this email &mdash; the link below reopens the full result whenever you need it.</p>' +
    '</td></tr>' +
    (rows ? '<tr><td style="padding:0 28px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">' + rows + '</table></td></tr>' : '') +
    (resumeLink ? '<tr><td style="padding:22px 28px 0">' +
      '<a href="' + esc(resumeLink) + '" style="display:inline-block;background:#02615D;color:#fff;text-decoration:none;font:600 15px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;padding:14px 22px;border-radius:10px">Reopen my full result &rarr;</a>' +
      '<p style="margin:12px 0 0;font:13px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#555">It recomputes against the current rules each time, so it will not go out of date.</p>' +
      '</td></tr>' : '') +
    '<tr><td style="padding:22px 28px 28px">' +
    '<p style="margin:0;font:13px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#555">General guidance, not a registration assessment and not immigration advice. Requirements change without notice and only the regulator can decide your application &mdash; check the official source before you apply, pay a fee or resign a post.</p>' +
    '<p style="margin:14px 0 0;font:13px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#555">Ethicare Resourcing Ltd &middot; Office 1, One Coldbath Square, London EC1R 5HL &middot; <a href="https://ethicareresourcing.com/how-we-use-your-information" style="color:#02615D">How we use your information</a></p>' +
    '</td></tr></table></body></html>';
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  if (origin && ALLOWED.indexOf(origin) === -1) return json(403, { error: 'Forbidden' });
  if ((event.body || '').length > MAX_BODY) return json(413, { error: 'Too large' });

  let p;
  try { p = JSON.parse(event.body || '{}'); }
  catch (e) { return json(400, { error: 'Malformed JSON' }); }

  const to = String(p.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json(400, { error: 'No valid recipient' });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('send-result: RESEND_API_KEY is not set in this environment');
    return json(503, { error: 'Sender not configured' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: 'Your registration starting point — Ethicare',
        html: template(p.name, p.summary, p.resumeLink)
      })
    });
    if (!r.ok) {
      console.error('send-result: Resend ' + r.status + ' — ' + (await r.text()).slice(0, 400));
      return json(502, { error: 'Send failed' });
    }
    return json(200, { sent: true });
  } catch (e) {
    console.error('send-result: request failed — ' + e.message);
    return json(502, { error: 'Send failed' });
  }
};
