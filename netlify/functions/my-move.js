/* ============================================================================
   Ethicare Resourcing — My Move store
   GET  /.netlify/functions/my-move?k=<key>        read a candidate's own space
   POST /.netlify/functions/my-move  {k, slug, data, base}   save it

   My Move is the private space an Ethicare candidate reaches from the link the team
   sends (/pack/<slug>, see pack/README.md). What the TEAM writes for them — the letter,
   travel, the chosen guides — lives in that page's file. What the CANDIDATE writes —
   their plan, their notes, the answers that shape the site's tools, the stages they
   have ticked off — lives here, in one row per space, so it follows them from phone
   to laptop and so the team can see where they are when they ask for help.

   THE KEY IS THE CREDENTIAL. `k` is a long random string minted when the pack is made
   (tools/new-pack.py) and carried inside that pack's page. Anyone holding the page holds
   the key, which is the same position as the page itself. Revoking a space is one row
   update (revoked_at) — the page then says the link has been closed — or removing the
   pack file, which takes the key out of circulation with it.

   Data shape is WHITELISTED on the way in. This function never stores anything the
   `clean()` below does not name, never accepts a system prompt or any free structure,
   and returns a bland error on failure. Same four guards as capture.js: an origin
   allowlist, a body cap, a per-IP burst limit, and a key format check.

   Env vars (Netlify → Site settings → Environment variables), the same two capture.js
   uses; they never reach the browser:
     SUPABASE_URL
     SUPABASE_SERVICE_ROLE

   Table (run once in the Supabase SQL editor — also in pack/README.md):

     create table if not exists my_move (
       key         text primary key,
       slug        text,
       data        jsonb not null default '{}'::jsonb,
       revoked_at  timestamptz,
       created_at  timestamptz not null default now(),
       updated_at  timestamptz not null default now()
     );
     alter table my_move enable row level security;   -- service role only; no anon policy
   ============================================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const MAX_BODY = 64000;        // a full space — notes, a long plan, answers — is well under 20KB
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 40;     // saves are debounced client-side; 40/min/IP is a person, not a script
const KEY_RE = /^[A-Za-z0-9_-]{24,64}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

const ALLOWED = [
  'https://ethicareresourcing.com',
  'https://www.ethicareresourcing.com',
  'https://ethicareresourcing.netlify.app'
];
const PREVIEW_RE = /^https:\/\/[a-z0-9][a-z0-9-]*--ethicareresourcing\.netlify\.app$/;
const LOCAL_RE = /^http:\/\/localhost(:\d+)?$/;

function originAllowed(origin) {
  if (!origin) return true;
  return ALLOWED.indexOf(origin) !== -1 || PREVIEW_RE.test(origin) || LOCAL_RE.test(origin);
}

const HITS = new Map();
function overLimit(ip) {
  const now = Date.now();
  const seen = (HITS.get(ip) || []).filter(function (t) { return now - t < WINDOW_MS; });
  seen.push(now);
  HITS.set(ip, seen);
  if (HITS.size > 500) { for (const k of HITS.keys()) { if (!HITS.get(k).some(function (t) { return now - t < WINDOW_MS; })) HITS.delete(k); } }
  return seen.length > MAX_PER_WINDOW;
}

function reply(statusCode, body, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
  if (origin && originAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  }
  return { statusCode, headers, body: JSON.stringify(body) };
}

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

/* ---- the whitelist ------------------------------------------------------------------
   Everything a space can hold, and nothing else. Unknown fields are dropped silently;
   strings are trimmed and capped; enumerations are checked against the site's own
   vocabularies (questions.json's eight stage ids; the household values the tools use). */
const STAGES = ['imagine', 'choose', 'work', 'numbers', 'place', 'role', 'plan', 'settle'];
const DESTS = ['nz', 'au', 'both'];
const HH_WITH = ['alone', 'partner', 'children', 'both', 'parent'];
const HH_WORK = ['health', 'other', 'later', 'unsure'];
const BANDS = ['u5', '5to12', '13to17', '18up'];
const MOVE_STAGES = ['exploring', 'applying', 'offer', 'moving', 'arrived'];

const str = (v, n) => { if (v == null) return ''; const s = String(v).trim().slice(0, n); return s; };
const oneOf = (v, list) => (list.indexOf(v) !== -1 ? v : '');
const bool = (v) => v === true || v === 'true' || v === 1;
const list = (v, allowed, n) => Array.isArray(v) ? v.map(String).filter(function (x) { return allowed.indexOf(x) !== -1; }).slice(0, n) : [];

function clean(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
  const a = (d.answers && typeof d.answers === 'object' && !Array.isArray(d.answers)) ? d.answers : {};
  const hh = (a.hh && typeof a.hh === 'object' && !Array.isArray(a.hh)) ? a.hh : {};
  const out = {
    v: 1,
    plan: Array.isArray(d.plan) ? d.plan.slice(0, 200).map(function (i) {
      return { t: str(i && i.t, 160), done: bool(i && i.done) };
    }).filter(function (i) { return i.t; }) : [],
    notes: str(d.notes, 20000),
    answers: {
      first: str(a.first, 40),
      dest: oneOf(a.dest, DESTS),
      profession: str(a.profession, 80),
      origin: str(a.origin, 80),
      journeyStage: oneOf(a.journeyStage, STAGES),
      stage: oneOf(a.stage, MOVE_STAGES),
      hh: {
        with: oneOf(hh.with, HH_WITH),
        work: oneOf(hh.work, HH_WORK),
        bands: list(hh.bands, BANDS, 4)
      },
      set: bool(a.set)
    },
    done: {}
  };
  const dn = (d.done && typeof d.done === 'object' && !Array.isArray(d.done)) ? d.done : {};
  STAGES.forEach(function (s) { if (bool(dn[s])) out.done[s] = true; });
  /* an answer not given is absent, not an empty string — the page's own store treats a
     present-but-empty field as an answer and it would overwrite one given later on a device */
  Object.keys(out.answers).forEach(function (k) { if (out.answers[k] === '' || out.answers[k] === false) delete out.answers[k]; });
  Object.keys(out.answers.hh).forEach(function (k) { const v = out.answers.hh[k]; if (v === '' || (Array.isArray(v) && !v.length)) delete out.answers.hh[k]; });
  if (!Object.keys(out.answers.hh).length) delete out.answers.hh;
  return out;
}

exports.handler = async (event) => {
  const h = event.headers || {};
  const origin = h.origin || h.Origin || '';
  const out = (status, body) => reply(status, body, origin);

  if (!originAllowed(origin)) return out(403, { error: 'Forbidden' });
  if (event.httpMethod === 'OPTIONS') return out(204, {});
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return out(405, { error: 'GET or POST' });
  if ((event.body || '').length > MAX_BODY) return out(413, { error: 'Too large' });

  const ip = h['x-nf-client-connection-ip'] || h['client-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (overLimit(ip)) return out(429, { error: 'Too many requests' });

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    /* Deploy previews normally carry no Supabase credentials. The page copes: it keeps
       working from the device and says the space is not saving right now. */
    console.error('my-move: SUPABASE_URL / SUPABASE_SERVICE_ROLE not set in this deploy context');
    return out(503, { error: 'unavailable' });
  }

  let msg = {};
  if (event.httpMethod === 'POST') {
    try { msg = JSON.parse(event.body || '{}'); } catch (e) { return out(400, { error: 'invalid JSON' }); }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return out(400, { error: 'invalid body' });
  } else {
    msg = { k: (event.queryStringParameters || {}).k };
  }

  const key = String(msg.k || '');
  if (!KEY_RE.test(key)) return out(400, { error: 'bad key' });

  try {
    const rows = await sb(`my_move?key=eq.${encodeURIComponent(key)}&select=data,slug,revoked_at,updated_at`, 'GET');
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (row && row.revoked_at) return out(410, { error: 'closed' });

    if (event.httpMethod === 'GET') {
      return out(200, { ok: true, data: row ? row.data : null, updated_at: row ? row.updated_at : null });
    }

    /* POST. `base` is the updated_at the client last saw; a newer row means another device
       wrote in between, so hand the client the row and let it merge, rather than silently
       dropping whichever one lost. A first write has no base and no row. */
    const base = str(msg.base, 40);
    if (row && base && row.updated_at && new Date(row.updated_at).getTime() > new Date(base).getTime() + 500) {
      return out(409, { error: 'newer', data: row.data, updated_at: row.updated_at });
    }
    const slug = SLUG_RE.test(String(msg.slug || '')) ? String(msg.slug) : (row ? row.slug : null);
    const now = new Date().toISOString();
    const saved = await sb('my_move?on_conflict=key', 'POST',
      { key: key, slug: slug, data: clean(msg.data), updated_at: now },
      'return=representation,resolution=merge-duplicates');
    const r = Array.isArray(saved) ? saved[0] : saved;
    return out(200, { ok: true, updated_at: (r && r.updated_at) || now });
  } catch (err) {
    console.error('my-move failed:', String(err && err.message || err));
    return out(502, { error: 'failed' });
  }
};
