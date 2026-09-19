/* My Move — privileged operations for the private candidate portal.

   Everything a candidate or staff member can do directly goes through
   supabase-js + row-level security (see supabase/migrations/0001_my_move.sql).
   The operations here need the SERVICE ROLE key, which never reaches the
   browser: publish, invite, resend, revoke, suspend, reactivate, archive,
   delete (admin only), export (DSAR) and staff role changes (admin only).

   Every call: verify the caller's JWT with Supabase Auth → look the caller up
   in staff_profiles (never trust a client claim) → require a second factor
   (aal2) → check admin-or-assigned for the case → act with the service role →
   write an access_audit row.

   Routes:  POST /.netlify/functions/mymove/<action>   body: JSON
     publish-case        {caseId}
     invite-candidate    {caseId}
     publish-and-invite  {caseId}
     resend-invitation   {caseId}
     revoke-invitation   {caseId}
     suspend-case        {caseId}
     reactivate-case     {caseId}
     archive-case        {caseId}
     delete-case         {caseId, confirm}        admin only; confirm = the case's public_ref
     export-case         {caseId}                 returns the full case package
     set-staff-role      {email, name, role}      admin only; invites the person if new

   Env (Site configuration → Environment variables):
     SUPABASE_URL                 https://<project>.supabase.co
     SUPABASE_SERVICE_ROLE_KEY    service role key — server only
     SUPABASE_ANON_KEY            anon key (used only to verify caller tokens)
     MYMOVE_SITE_URL              optional, e.g. https://ethicareresourcing.com — sign-in redirect base */

const URL_ = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON = process.env.SUPABASE_ANON_KEY || '';
const BAN_FOREVER = '876000h';
const PORTAL_PATH = '/my-move/';

/* An error whose message is safe and useful to show the staff member. Anything
   else is logged server-side and reported generically. */
function fail(message) { return Object.assign(new Error(message), { userFacing: true }); }

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

/* ---- tiny Supabase REST / Auth helpers (no SDK dependency; Node 18+ fetch) ---- */
async function rest(path, opts) {
  opts = opts || {};
  const r = await fetch(URL_ + '/rest/v1/' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      apikey: SERVICE, Authorization: 'Bearer ' + SERVICE,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    }, opts.headers || {}),
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) {
    const err = new Error('rest ' + path + ' ' + r.status + ' ' + (data && data.message ? data.message : String(text).slice(0, 200)));
    err.status = r.status; throw err;
  }
  return data;
}
async function rpc(fn, args) {
  return rest('rpc/' + fn, { method: 'POST', body: args || {}, headers: { Prefer: 'return=representation' } });
}
async function auth(path, opts) {
  opts = opts || {};
  const r = await fetch(URL_ + '/auth/v1/' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      apikey: opts.apikey || SERVICE, Authorization: 'Bearer ' + (opts.bearer || SERVICE), 'Content-Type': 'application/json'
    }, opts.headers || {}),
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) {
    const err = new Error('auth ' + path + ' ' + r.status + ' ' + (data && (data.msg || data.message || data.error_description) ? (data.msg || data.message || data.error_description) : String(text).slice(0, 200)));
    err.status = r.status; err.data = data; throw err;
  }
  return data;
}

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    return JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch (e) { return {}; }
}

/* Identify the caller: Supabase validates the signature; we then look the
   person up in staff_profiles. Role and MFA level come from the database and
   the verified token — never from the request body. */
async function requireStaff(event) {
  const h = event.headers || {};
  const raw = h.authorization || h.Authorization || '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { error: json(401, { error: 'Sign in required' }) };
  let user;
  try { user = await auth('user', { apikey: ANON || SERVICE, bearer: token }); }
  catch (e) { return { error: json(401, { error: 'Session invalid or expired' }) }; }
  if (!user || !user.id) return { error: json(401, { error: 'Session invalid' }) };
  const claims = decodeJwtPayload(token);
  const rows = await rest('staff_profiles?select=id,name,email,role,active&id=eq.' + user.id);
  const staff = rows && rows[0];
  if (!staff || !staff.active) return { error: json(403, { error: 'Staff access only' }) };
  if (claims.aal !== 'aal2') return { error: json(403, { error: 'Two-factor sign-in required', code: 'mfa_required' }) };
  return { staff: staff, uid: user.id };
}

async function loadCase(caseId) {
  if (!/^[0-9a-f-]{36}$/i.test(caseId || '')) return null;
  const rows = await rest('candidate_cases?select=*,case_draft(draft,updated_at)&id=eq.' + caseId);
  return rows && rows[0] ? rows[0] : null;
}
function canManage(staff, cs) {
  return staff.role === 'admin' || cs.assigned_staff_id === staff.id;
}
async function audit(actor, caseId, action, detail) {
  try {
    await rest('access_audit', { method: 'POST', body: { actor_uid: actor.uid, actor_role: actor.staff.role, case_id: caseId || null, action: action, detail: detail || null }, headers: { Prefer: 'return=minimal' } });
  } catch (e) { console.error('mymove: audit write failed — ' + e.message); }
}
async function patchCase(caseId, patch) {
  const rows = await rest('candidate_cases?id=eq.' + caseId, { method: 'PATCH', body: patch });
  return rows && rows[0];
}
function siteUrl(event) {
  if (process.env.MYMOVE_SITE_URL) return process.env.MYMOVE_SITE_URL.replace(/\/$/, '');
  const h = event.headers || {};
  const host = h['x-forwarded-host'] || h.host || 'ethicareresourcing.com';
  return 'https://' + host;
}
function redirectTo(event) { return siteUrl(event) + PORTAL_PATH; }

/* ---- Auth admin helpers ---- */
async function banUser(uid, banned) {
  await auth('admin/users/' + uid, { method: 'PUT', body: { ban_duration: banned ? BAN_FOREVER : 'none' } });
}
async function endSessions(uid) {
  await rpc('mm_revoke_sessions', { p_uid: uid });
}
async function cutAccess(uid) {
  if (!uid) return;
  await banUser(uid, true);
  await endSessions(uid);
}

/* ---- the operations ---- */
async function publish(actor, cs) {
  const draft = cs.case_draft && cs.case_draft.draft ? cs.case_draft.draft : null;
  if (!draft || !draft.role) throw fail('Nothing to publish yet — add details first');
  const snapshot = JSON.parse(JSON.stringify(draft));
  snapshot.publishedAt = new Date().toISOString();
  const updated = await patchCase(cs.id, { published: snapshot, published_at: snapshot.publishedAt, last_update: snapshot.publishedAt });
  await audit(actor, cs.id, 'publish', { tasks: (snapshot.tasks || []).length, guides: (snapshot.guides || []).length });
  return updated;
}

async function sendSignIn(event, cs, existingUid) {
  /* New person: Supabase's invite creates the user and emails the sign-in
     action. Existing person: a magic link to the same address. Either way the
     email carries a sign-in action only — no case detail. */
  if (!existingUid) {
    const u = await auth('invite?redirect_to=' + encodeURIComponent(redirectTo(event)), {
      method: 'POST',
      body: { email: cs.email, data: { first_name: cs.first_name, mymove: true } }
    });
    return u && u.id;
  }
  await banUser(existingUid, false);
  await auth('otp?redirect_to=' + encodeURIComponent(redirectTo(event)), {
    method: 'POST', apikey: ANON || SERVICE, bearer: ANON || SERVICE,
    body: { email: cs.email, create_user: false }
  });
  return existingUid;
}

async function invite(event, actor, cs, kind) {
  if (!cs.published) throw fail('Publish the case before inviting');
  if (!cs.first_name || !cs.email || cs.email.indexOf('@') < 1) throw fail('A first name and a valid email are required before an invitation');
  if (cs.status === 'archived') throw fail('An archived case cannot be invited');
  let uid = await rpc('mm_auth_user_id_by_email', { p_email: cs.email });
  if (Array.isArray(uid)) uid = uid[0];
  if (uid && typeof uid === 'object') uid = uid.mm_auth_user_id_by_email || null;
  const staffRow = await rest('staff_profiles?select=id&id=eq.' + (uid || '00000000-0000-0000-0000-000000000000'));
  if (uid && staffRow && staffRow.length) throw fail('That email belongs to a staff account');
  const newUid = await sendSignIn(event, cs, uid || null);
  const now = new Date().toISOString();
  const updated = await patchCase(cs.id, { auth_user_id: newUid, invitation: 'sent', status: 'active', invited_at: now, last_update: now });
  await audit(actor, cs.id, kind, { to: cs.email.replace(/^(.).*(@.*)$/, '$1…$2') });
  return updated;
}

async function exportCase(cs) {
  const [arr, prog, notes, consent, auditRows] = await Promise.all([
    rest('case_arrangements?select=*&case_id=eq.' + cs.id + '&order=sort_order,created_at'),
    rest('case_task_progress?select=*&case_id=eq.' + cs.id),
    rest('shared_notes?select=*&case_id=eq.' + cs.id + '&order=created_at'),
    rest('consent_events?select=*&case_id=eq.' + cs.id + '&order=created_at'),
    rest('access_audit?select=id,actor_role,action,detail,created_at&case_id=eq.' + cs.id + '&order=created_at')
  ]);
  return {
    exportedAt: new Date().toISOString(),
    case: {
      id: cs.id, public_ref: cs.public_ref, first_name: cs.first_name, last_name: cs.last_name, email: cs.email,
      status: cs.status, invitation: cs.invitation, vincere_id: cs.vincere_id,
      created_at: cs.created_at, invited_at: cs.invited_at, published_at: cs.published_at, last_update: cs.last_update
    },
    draft: cs.case_draft ? cs.case_draft.draft : null,
    published: cs.published,
    arrangements: arr, taskProgress: prog, sharedNotes: notes, consentEvents: consent, accessAudit: auditRows
  };
}

async function setStaffRole(event, actor, body) {
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const role = body.role === 'admin' ? 'admin' : body.role === 'support' ? 'support' : null;
  const active = body.active === false ? false : true;
  if (!email || email.indexOf('@') < 1 || !role) throw fail('Email and role (admin | support) are required');
  let uid = await rpc('mm_auth_user_id_by_email', { p_email: email });
  if (Array.isArray(uid)) uid = uid[0];
  if (uid && typeof uid === 'object') uid = uid.mm_auth_user_id_by_email || null;
  if (!uid) {
    if (!name) throw fail('A name is required for a new colleague');
    const u = await auth('invite?redirect_to=' + encodeURIComponent(redirectTo(event)), { method: 'POST', body: { email: email, data: { name: name, staff: true } } });
    uid = u && u.id;
  } else {
    const cases = await rest('candidate_cases?select=id&auth_user_id=eq.' + uid);
    if (cases && cases.length) throw fail('That email belongs to a candidate account');
  }
  if (uid === actor.uid && (!active || role !== 'admin')) throw fail('You cannot remove your own admin access');
  const existing = await rest('staff_profiles?select=id&id=eq.' + uid);
  let row;
  if (existing && existing.length) {
    row = (await rest('staff_profiles?id=eq.' + uid, { method: 'PATCH', body: { role: role, active: active, name: name || undefined } }))[0];
    if (!active) await cutAccess(uid);
  } else {
    row = (await rest('staff_profiles', { method: 'POST', body: { id: uid, name: name, email: email, role: role, active: active } }))[0];
  }
  await audit(actor, null, 'role_change', { staff: uid, role: role, active: active });
  return row;
}

/* Best-effort rate limit per warm function instance (Netlify also rate-limits
   at the edge; this just blunts a burst from one caller). */
const hits = new Map();
function limited(key) {
  const now = Date.now();
  const w = hits.get(key) || [];
  const recent = w.filter(function (t) { return now - t < 60000; });
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 60;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  if (!URL_ || !SERVICE) {
    console.error('mymove: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
    return json(503, { error: 'My Move is not configured on this environment' });
  }
  const action = (event.path || '').split('/').filter(Boolean).pop();
  const ip = (event.headers && (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'])) || 'unknown';
  if (limited(ip)) return json(429, { error: 'Too many requests — try again in a minute' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Malformed JSON' }); }

  const who = await requireStaff(event);
  if (who.error) return who.error;

  try {
    if (action === 'set-staff-role') {
      if (who.staff.role !== 'admin') return json(403, { error: 'Admin only' });
      return json(200, { staff: await setStaffRole(event, who, body) });
    }

    const cs = await loadCase(body.caseId);
    if (!cs) return json(404, { error: 'Case not found' });
    if (!canManage(who.staff, cs)) return json(403, { error: 'This case is not assigned to you' });

    switch (action) {
      case 'publish-case': {
        return json(200, { case: await publish(who, cs) });
      }
      case 'invite-candidate': {
        return json(200, { case: await invite(event, who, cs, 'invite') });
      }
      case 'publish-and-invite': {
        const pub = await publish(who, cs);
        return json(200, { case: await invite(event, who, Object.assign(cs, pub), 'invite') });
      }
      case 'resend-invitation': {
        if (cs.invitation !== 'sent' && cs.invitation !== 'accepted') return json(400, { error: 'No live invitation to resend' });
        return json(200, { case: await invite(event, who, cs, 'resend') });
      }
      case 'revoke-invitation': {
        await cutAccess(cs.auth_user_id);
        const updated = await patchCase(cs.id, { invitation: 'revoked', last_update: new Date().toISOString() });
        await audit(who, cs.id, 'revoke');
        return json(200, { case: updated });
      }
      case 'suspend-case': {
        if (cs.status !== 'active') return json(400, { error: 'Only an active case can be suspended' });
        await cutAccess(cs.auth_user_id);
        const updated = await patchCase(cs.id, { status: 'suspended', last_update: new Date().toISOString() });
        await audit(who, cs.id, 'suspend');
        return json(200, { case: updated });
      }
      case 'reactivate-case': {
        if (cs.status !== 'suspended') return json(400, { error: 'Only a suspended case can be reactivated' });
        if (cs.auth_user_id) await banUser(cs.auth_user_id, false);
        const patch = { status: 'active', last_update: new Date().toISOString() };
        if (cs.invitation === 'revoked') patch.invitation = 'sent';
        const updated = await patchCase(cs.id, patch);
        await audit(who, cs.id, 'reactivate');
        return json(200, { case: updated });
      }
      case 'archive-case': {
        await cutAccess(cs.auth_user_id);
        const updated = await patchCase(cs.id, { status: 'archived', last_update: new Date().toISOString() });
        await audit(who, cs.id, 'archive');
        return json(200, { case: updated });
      }
      case 'delete-case': {
        if (who.staff.role !== 'admin') return json(403, { error: 'Admin only' });
        if (body.confirm !== cs.public_ref) return json(400, { error: 'Type the case reference to confirm permanent deletion' });
        const uid = cs.auth_user_id;
        await rpc('mm_erase_case', { p_case: cs.id });
        if (uid) {
          const otherStaff = await rest('staff_profiles?select=id&id=eq.' + uid);
          const otherCases = await rest('candidate_cases?select=id&auth_user_id=eq.' + uid);
          if (!(otherStaff && otherStaff.length) && !(otherCases && otherCases.length)) {
            try { await auth('admin/users/' + uid, { method: 'DELETE' }); } catch (e) { console.error('mymove: auth user delete failed — ' + e.message); }
          }
        }
        await audit(who, cs.id, 'delete', { ref: cs.public_ref });
        return json(200, { ok: true });
      }
      case 'export-case': {
        const pkg = await exportCase(cs);
        await audit(who, cs.id, 'export');
        return json(200, pkg);
      }
      default:
        return json(404, { error: 'Unknown action' });
    }
  } catch (e) {
    console.error('mymove ' + action + ': ' + e.message);
    if (e.userFacing) return json(400, { error: e.message });
    return json(502, { error: 'Something went wrong on our side. Please try again; if it keeps happening, check the function logs.' });
  }
};
