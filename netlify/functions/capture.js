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
   ============================================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function reply(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', ...CORS }, body: JSON.stringify(body) };
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

const asArray = (v) => (v == null || v === '') ? null
  : Array.isArray(v) ? v
  : String(v).split(/\s*·\s*|\s*,\s*/).filter(Boolean);
const toInt = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(204, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
  if (!SUPABASE_URL || !SERVICE_ROLE) return reply(500, { error: 'Supabase env vars not set' });

  let msg;
  try { msg = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'invalid JSON' }); }

  const kind = msg.kind || 'lead';
  const page = msg.page || (event.headers && event.headers.referer) || null;

  try {
    /* ---------------- APPLICATION ---------------- */
    if (kind === 'application') {
      const d = msg.data || msg;
      if (!d.email) return reply(400, { error: 'email required' });

      const row = {
        full_name: d.full_name || null,
        email: String(d.email).trim().toLowerCase(),
        phone: d.phone || null,
        country_residence: d.country_residence || d.current_country || null,
        nationality: d.nationality || null,
        profession: d.profession || null,
        specialty: d.specialty || null,
        years_experience: d.years_experience || d.experience || null,
        destination: d.destination || null,
        preferred_areas: asArray(d.preferred_areas),
        registration_stage: d.registration_stage || d.stage || null,
        relocate_timeline: d.relocate_timeline || d.timeline || null,
        relocating_with: d.relocating_with || null,
        dependents: toInt(d.dependents),
        source: 'apply',
        heard_about: d.heard_about || null,
        referral_source: d.referral_source || d.ref || null,
        cv_filename: d.cv_filename || d.cv || null,
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
        version: d.consent_version || 'privacy-v1-2026-09',
        label_shown: d.consent_label || 'I accept the privacy terms and agree to Ethicare holding my details to help with my move.',
        source: '/apply'
      }];
      const vis = d.employer_visibility === true || d.employer_visibility === 'true' || d.employer_visibility === 'on';
      events.push({
        candidate_id: cand.id, email: row.email, kind: 'employer_visibility', granted: !!vis,
        version: d.visibility_version || 'visibility-v1-2026-09',
        label_shown: d.visibility_label || 'Yes, I’d like to hear about suitable job opportunities.',
        source: '/apply'
      });
      await sb('consent_events', 'POST', events, 'return=minimal');

      return reply(200, { ok: true, public_ref: cand.public_ref });
    }

    /* ---------------- PLAN (saved Move plan) ---------------- */
    if (kind === 'plan') {
      if (!msg.email && !msg.anon_key) return reply(400, { error: 'email or anon_key required' });
      const row = {
        email: msg.email ? String(msg.email).trim().toLowerCase() : null,
        anon_key: msg.anon_key || null,
        payload: msg.payload || {},
        updated_at: new Date().toISOString()
      };
      const conflict = row.email ? 'email' : 'anon_key';
      await sb(`plans?on_conflict=${conflict}`, 'POST', row, 'return=minimal,resolution=merge-duplicates');
      return reply(200, { ok: true });
    }

    /* ---------------- LEAD (default) ---------------- */
    const lead = {
      email: msg.email ? String(msg.email).trim().toLowerCase() : null,
      profession: msg.profession || null,
      destination: msg.destination || null,
      source: msg.source || 'site',
      page,
      referral_source: msg.referral_source || msg.ref || null,
      payload: msg.payload || msg.data || null
    };
    await sb('leads', 'POST', lead, 'return=minimal');
    return reply(200, { ok: true });

  } catch (err) {
    return reply(502, { error: 'capture failed', detail: String(err.message || err) });
  }
};
