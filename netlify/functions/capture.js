/* ============================================================================
   Ethicare Resourcing — capture endpoint
   POST /.netlify/functions/capture

   One endpoint, two jobs, keyed by `kind`:
     kind: "application"  -> a full /apply registration  -> candidates + consent_events
     kind: "lead"         -> lightweight site capture     -> leads
     kind: "plan"         -> a saved Move plan            -> plans (upsert on email/anon_key)

   Writes to Supabase via its REST API using the SERVICE ROLE key, which lives in
   Netlify env vars and never reaches the browser. The application form ALSO posts
   to Netlify Forms (for the notification email + the CV file); this endpoint is the
   queryable record. If this write fails, Netlify Forms has still captured the lead.

   Env vars required (Netlify → Site settings → Environment variables):
     SUPABASE_URL            e.g. https://xxxx.supabase.co
     SUPABASE_SERVICE_ROLE   the service_role key (secret)

   THIS ENDPOINT WRITES TO THE CANDIDATE DATABASE AND HAS NO USER TO AUTHENTICATE.
   It previously answered `Access-Control-Allow-Origin: *` with no rate limit and no
   bot check, so anyone reading the site's JavaScript could insert rows into
   `candidates`, `leads` and `plans` from anywhere. The four guards below are the same
   ones ask-ethicare.js already carries, applied here for the same reason: an origin
   allowlist, a body cap, a per-IP burst limit and a server-side honeypot. None of them
   is a wall — Origin and IP are both forgeable outside a browser — but together they
   stop the cheap case, which is the one that actually happens.
   ============================================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const MAX_BODY = 24000;      // an /apply submission is ~3KB; 24KB is generous
const MAX_FIELD = 2000;      // per stored string, so one field cannot carry a payload
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 20;   // a person filling in /apply fires once; a script fires forever

const ALLOWED = [
  'https://ethicareresourcing.com',
  'https://www.ethicareresourcing.com',
  'https://ethicareresourcing.netlify.app'
];
/* Netlify deploy previews and branch deploys answer on <label>--<site>.netlify.app.
   Leave this in: without it every preview build stops capturing, and the only symptom
   is rows that never arrive. Update the site name here if the Netlify site is renamed. */
const PREVIEW_RE = /^https:\/\/[a-z0-9][a-z0-9-]*--ethicareresourcing\.netlify\.app$/;
const LOCAL_RE = /^http:\/\/localhost(:\d+)?$/;   // netlify dev

function originAllowed(origin) {
  /* No Origin header is allowed through deliberately. Browsers omit it on some
     same-origin requests, and a cross-site page cannot suppress it — so refusing here
     would break real visitors without stopping anything. A curl request with no Origin
     still meets the rate limit and the honeypot. */
  if (!origin) return true;
  return ALLOWED.indexOf(origin) !== -1 || PREVIEW_RE.test(origin) || LOCAL_RE.test(origin);
}

/* Per-IP burst limiter. In-memory, so it only holds within a warm container — it will
   not stop a distributed flood and is not pretending to. A durable limit needs a store,
   and is worth adding if this is ever abused. */
const HITS = new Map();
function overLimit(ip) {
  const now = Date.now();
  const seen = (HITS.get(ip) || []).filter(function (t) { return now - t < WINDOW_MS; });
  seen.push(now);
  HITS.set(ip, seen);
  if (HITS.size > 500) { for (const k of HITS.keys()) { if (!HITS.get(k).some(function (t) { return now - t < WINDOW_MS; })) HITS.delete(k); } }
  return seen.length > MAX_PER_WINDOW;
}

/* The forms carry a hidden honeypot (`bot-field`, `bot-trap` on /move-steps) and
   apply-form.js posts every named field, so a filled one arrives here. Answer 200 and
   write nothing: a bot that gets a 403 learns which field gave it away. */
const TRAPS = ['bot-field', 'bot_field', 'bot-trap', 'bot_trap'];
function trapped(msg) {
  const d = (msg && msg.data) || {};
  return TRAPS.some(function (k) {
    return String(msg[k] || '').trim() !== '' || String(d[k] || '').trim() !== '';
  });
}

function reply(statusCode, body, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (origin && originAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  return { statusCode, headers, body: JSON.stringify(body) };
}

/* Thin Supabase REST helper. `prefer` controls upsert / return shape. */
async function sb(path, method, body, prefer) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  if (!res.ok) throw new Error(`supabase ${res.status}: ${text}`);
  return json;
}

/* Every stored string goes through this: trims, caps, and turns '' into null so an empty
   form field does not land in the table as an empty string alongside real nulls. */
const str = (v) => {
  if (v == null) return null;
  const s = String(v).trim().slice(0, MAX_FIELD);
  return s === '' ? null : s;
};
const asArray = (v) => (v == null || v === '') ? null
  : Array.isArray(v) ? v.slice(0, 40).map((x) => String(x).slice(0, 200))
  : String(v).split(/\s*·\s*|\s*,\s*/).filter(Boolean).slice(0, 40);
const toInt = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

exports.handler = async (event) => {
  const h = event.headers || {};
  const origin = h.origin || h.Origin || '';
  const out = (status, body) => reply(status, body, origin);

  if (!originAllowed(origin)) return out(403, { error: 'Forbidden' });
  if (event.httpMethod === 'OPTIONS') return out(204, {});
  if (event.httpMethod !== 'POST') return out(405, { error: 'POST only' });
  if ((event.body || '').length > MAX_BODY) return out(413, { error: 'Too large' });

  const ip = h['x-nf-client-connection-ip'] || h['client-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (overLimit(ip)) return out(429, { error: 'Too many requests' });

  let msg;
  try { msg = JSON.parse(event.body || '{}'); } catch (e) { return out(400, { error: 'invalid JSON' }); }
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return out(400, { error: 'invalid body' });

  // Honeypot: looks exactly like success from the outside, writes nothing. This sits BEFORE the
  // env check so a caught bot gets the same bland 200 whatever state the deploy is in.
  if (trapped(msg)) return out(200, { ok: true });

  /* Deploy previews and branch deploys normally have no Supabase credentials — the env vars are
     usually scoped to production so preview traffic cannot write into the real candidate tables.
     That is the right default, and this is what it looks like from the outside: the page still
     works, Netlify Forms still catches the submission, and only the queryable copy is skipped.
     The response says nothing about which service or which variable is missing. */
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('capture: SUPABASE_URL / SUPABASE_SERVICE_ROLE not set in this deploy context');
    return out(503, { error: 'capture unavailable' });
  }

  const kind = msg.kind || 'lead';
  const page = str(msg.page) || str(h.referer) || null;

  try {
    /* ---------------- APPLICATION ---------------- */
    if (kind === 'application') {
      const d = (msg.data && typeof msg.data === 'object' && !Array.isArray(msg.data)) ? msg.data : msg;
      const email = str(d.email);
      if (!email) return out(400, { error: 'email required' });

      const row = {
        full_name: str(d.full_name),
        email: email.toLowerCase(),
        phone: str(d.phone),
        country_residence: str(d.country_residence) || str(d.current_country),
        nationality: str(d.nationality),
        profession: str(d.profession),
        specialty: str(d.specialty),
        years_experience: str(d.years_experience) || str(d.experience),
        destination: str(d.destination),
        preferred_areas: asArray(d.preferred_areas),
        registration_stage: str(d.registration_stage) || str(d.stage),
        relocate_timeline: str(d.relocate_timeline) || str(d.timeline),
        relocating_with: str(d.relocating_with),
        dependents: toInt(d.dependents),
        source: 'apply',
        heard_about: str(d.heard_about),
        referral_source: str(d.referral_source) || str(d.ref),
        cv_filename: str(d.cv_filename) || str(d.cv),
        last_contact_at: new Date().toISOString(),
        raw: d
      };

      // upsert on email so a second registration updates rather than duplicates
      const inserted = await sb(
        'candidates?on_conflict=email',
        'POST',
        row,
        'return=representation,resolution=merge-duplicates'
      );
      const cand = Array.isArray(inserted) ? inserted[0] : inserted;

      // consent events — always a privacy grant; employer visibility is its own opt-in
      const events = [{
        candidate_id: cand.id, email: row.email, kind: 'privacy', granted: true,
        version: str(d.consent_version) || 'privacy-v1-2026-09',
        label_shown: str(d.consent_label) || 'I accept the privacy terms and agree to Ethicare holding my details to help with my move.',
        source: '/apply'
      }];
      const vis = d.employer_visibility === true || d.employer_visibility === 'true' || d.employer_visibility === 'on';
      events.push({
        candidate_id: cand.id, email: row.email, kind: 'employer_visibility', granted: !!vis,
        version: str(d.visibility_version) || 'visibility-v1-2026-09',
        label_shown: str(d.visibility_label) || 'Yes, I’d like to hear about suitable job opportunities.',
        source: '/apply'
      });
      await sb('consent_events', 'POST', events, 'return=minimal');

      return out(200, { ok: true, public_ref: cand.public_ref });
    }

    /* ---------------- PLAN (saved Move plan) ---------------- */
    if (kind === 'plan') {
      const email = str(msg.email);
      const anonKey = str(msg.anon_key);
      if (!email && !anonKey) return out(400, { error: 'email or anon_key required' });
      const row = {
        email: email ? email.toLowerCase() : null,
        anon_key: anonKey,
        payload: (msg.payload && typeof msg.payload === 'object') ? msg.payload : {},
        updated_at: new Date().toISOString()
      };
      const conflict = row.email ? 'email' : 'anon_key';
      await sb(`plans?on_conflict=${conflict}`, 'POST', row, 'return=minimal,resolution=merge-duplicates');
      return out(200, { ok: true });
    }

    /* ---------------- LEAD (default) ---------------- */
    const leadEmail = str(msg.email);
    const lead = {
      email: leadEmail ? leadEmail.toLowerCase() : null,
      profession: str(msg.profession),
      destination: str(msg.destination),
      source: str(msg.source) || 'site',
      page,
      referral_source: str(msg.referral_source) || str(msg.ref),
      payload: msg.payload || msg.data || null
    };
    await sb('leads', 'POST', lead, 'return=minimal');
    return out(200, { ok: true });

  } catch (err) {
    /* The Supabase error text can carry column names and constraint details. Log it for
       the function log; the caller gets the fact of the failure and nothing else. */
    console.error('capture failed:', String(err && err.message || err));
    return out(502, { error: 'capture failed' });
  }
};
