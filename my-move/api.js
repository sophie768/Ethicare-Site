/* My Move — data access. One thin layer over supabase-js + the Netlify function.
   Direct reads/writes rely on row-level security (the database is the gate);
   privileged operations go to /.netlify/functions/mymove/<action> with the
   caller's session token, where the service role acts after re-checking role.
   Sets window.MMAPI. */
window.MMAPI = (function () {
  var cfg = window.MYMOVE_CONFIG || {};
  /* invite | recovery | magiclink — read before supabase-js consumes the hash */
  var entryType = (String(location.hash).match(/[#&]type=([a-z]+)/) || [])[1] || null;
  var configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase && window.supabase.createClient);
  var sb = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
  }) : null;
  var PORTAL_URL = location.origin + '/my-move/';

  function need() { if (!sb) throw new Error('My Move is not configured'); return sb; }
  function unwrap(res) { if (res.error) throw res.error; return res.data; }
  function friendly(e) {
    var m = (e && (e.message || e.error_description || e.msg)) || 'Something went wrong';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'No connection. Your change is kept here — retry when you are back online.';
    if (/JWT|expired|invalid claim/i.test(m)) return 'Your session has expired. Sign in again to continue.';
    if (/42501|permission|not permitted|row-level security|violates/i.test(m)) return 'That change is not allowed for your account.';
    return m;
  }

  /* ---------- auth ---------- */
  async function session() { return unwrap(await need().auth.getSession()).session; }
  async function user() { var s = await session(); return s ? s.user : null; }
  function onAuth(cb) { return need().auth.onAuthStateChange(function (ev, s) { cb(ev, s); }); }
  async function signOut() { try { await need().auth.signOut({ scope: 'local' }); } catch (e) { /* already gone */ } }

  async function candidateLink(email) {
    /* shouldCreateUser=false: only an invited address gets a link. The UI shows
       the same neutral message either way so it does not reveal who has a space. */
    var r = await need().auth.signInWithOtp({ email: email, options: { shouldCreateUser: false, emailRedirectTo: PORTAL_URL } });
    if (r.error && !/not allowed|not found|Signups/i.test(r.error.message)) throw r.error;
    return true;
  }
  async function staffPassword(email, password) {
    return unwrap(await need().auth.signInWithPassword({ email: email, password: password }));
  }
  async function setPassword(password) { return unwrap(await need().auth.updateUser({ password: password })); }
  async function resetPassword(email) {
    return unwrap(await need().auth.resetPasswordForEmail(email, { redirectTo: PORTAL_URL }));
  }

  /* MFA (TOTP) — required for staff; enforced by RLS (aal2), so this is not optional. */
  async function mfaLevel() { return unwrap(await need().auth.mfa.getAuthenticatorAssuranceLevel()); }
  async function mfaFactors() {
    var d = unwrap(await need().auth.mfa.listFactors());
    return (d && d.totp) ? d.totp.filter(function (f) { return f.status === 'verified'; }) : [];
  }
  async function mfaEnrol() {
    /* Remove abandoned unverified factors first so re-tries do not pile up. */
    var all = unwrap(await need().auth.mfa.listFactors());
    var stale = ((all && all.totp) || []).filter(function (f) { return f.status !== 'verified'; });
    for (var i = 0; i < stale.length; i++) { try { await need().auth.mfa.unenroll({ factorId: stale[i].id }); } catch (e) {} }
    return unwrap(await need().auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Ethicare My Move' }));
  }
  async function mfaVerify(factorId, code) {
    return unwrap(await need().auth.mfa.challengeAndVerify({ factorId: factorId, code: String(code || '').replace(/\s+/g, '') }));
  }

  /* Who is this? Role comes from the database, never from the browser. */
  async function whoami() { return unwrap(await need().rpc('mm_whoami')) || { kind: 'none' }; }

  /* ---------- candidate ---------- */
  async function loadCandidate() {
    var s = need();
    var cs = unwrap(await s.from('my_case').select('*').maybeSingle());
    if (!cs) return null;
    if (cs.invitation === 'sent') { try { await s.rpc('mm_accept_invitation'); cs.invitation = 'accepted'; } catch (e) {} }
    var res = await Promise.all([
      s.from('case_arrangements').select('*').eq('case_id', cs.id).order('sort_order').order('created_at'),
      s.from('case_task_progress').select('*').eq('case_id', cs.id),
      s.from('shared_notes').select('*').eq('case_id', cs.id).order('created_at')
    ]);
    cs.arrangements = unwrap(res[0]) || [];
    cs.progress = unwrap(res[1]) || [];
    cs.notes = unwrap(res[2]) || [];
    return cs;
  }
  async function saveTaskStatus(caseId, taskKey, status) {
    return unwrap(await need().from('case_task_progress').upsert({ case_id: caseId, task_key: taskKey, status: status }, { onConflict: 'case_id,task_key' }).select().single());
  }
  async function saveArrangement(row) {
    var s = need();
    if (row.id) {
      var patch = { type: row.type, label: row.label, detail: row.detail, state: row.state, sort_order: row.sort_order || 0 };
      if (row.editable_by) patch.editable_by = row.editable_by; /* ignored for candidates by the trigger */
      return unwrap(await s.from('case_arrangements').update(patch).eq('id', row.id).select().single());
    }
    return unwrap(await s.from('case_arrangements').insert({ case_id: row.case_id, type: row.type || 'other', label: row.label || '', detail: row.detail || '', state: row.state || 'planned', editable_by: row.editable_by || 'candidate', sort_order: row.sort_order || 0 }).select().single());
  }
  async function deleteArrangement(id) { unwrap(await need().from('case_arrangements').delete().eq('id', id)); return true; }
  async function postNote(caseId, body) {
    return unwrap(await need().from('shared_notes').insert({ case_id: caseId, body: body, author_uid: '00000000-0000-0000-0000-000000000000', author_kind: 'candidate', author_name: '' }).select().single());
  }

  /* ---------- staff ---------- */
  var CASE_COLS = 'id,public_ref,auth_user_id,assigned_staff_id,first_name,last_name,email,status,invitation,vincere_id,published,published_at,invited_at,created_at,updated_at,last_update';
  async function listCases() {
    return unwrap(await need().from('candidate_cases')
      .select(CASE_COLS + ',case_draft(draft,updated_at),assigned:staff_profiles(id,name,email)')
      .order('last_update', { ascending: false })) || [];
  }
  async function loadCase(id) {
    var s = need();
    var cs = unwrap(await s.from('candidate_cases').select(CASE_COLS + ',case_draft(draft,updated_at),assigned:staff_profiles(id,name,email)').eq('id', id).maybeSingle());
    if (!cs) return null;
    var res = await Promise.all([
      s.from('case_arrangements').select('*').eq('case_id', id).order('sort_order').order('created_at'),
      s.from('case_task_progress').select('*').eq('case_id', id),
      s.from('shared_notes').select('*').eq('case_id', id).order('created_at')
    ]);
    cs.arrangements = unwrap(res[0]) || [];
    cs.progress = unwrap(res[1]) || [];
    cs.notes = unwrap(res[2]) || [];
    return cs;
  }
  async function createCase(assignedStaffId, draft) {
    var s = need();
    var cs = unwrap(await s.from('candidate_cases').insert({ assigned_staff_id: assignedStaffId }).select(CASE_COLS).single());
    unwrap(await s.from('case_draft').insert({ case_id: cs.id, draft: draft }));
    return cs;
  }
  async function saveCase(id, patch) {
    var allowed = {};
    ['first_name', 'last_name', 'email', 'assigned_staff_id', 'vincere_id'].forEach(function (k) { if (k in patch) allowed[k] = patch[k]; });
    if ('email' in allowed) allowed.email = allowed.email ? String(allowed.email).trim().toLowerCase() : null;
    return unwrap(await need().from('candidate_cases').update(allowed).eq('id', id).select(CASE_COLS).single());
  }
  async function saveDraft(id, draft) {
    return unwrap(await need().from('case_draft').upsert({ case_id: id, draft: draft }, { onConflict: 'case_id' }).select().single());
  }
  async function listTemplates() { return unwrap(await need().from('templates').select('*').order('sort_order')) || []; }
  async function listStaff() { return unwrap(await need().from('staff_profiles').select('id,name,email,role,active').order('name')) || []; }
  async function listAudit(caseId) { return unwrap(await need().from('access_audit').select('*').eq('case_id', caseId).order('created_at', { ascending: false }).limit(50)) || []; }
  async function postStaffNote(caseId, body) {
    return unwrap(await need().from('shared_notes').insert({ case_id: caseId, body: body, author_uid: '00000000-0000-0000-0000-000000000000', author_kind: 'staff', author_name: '' }).select().single());
  }

  /* Privileged operations → Netlify function. */
  async function fn(action, body) {
    var s = await session();
    if (!s) throw new Error('Sign in required');
    var r = await fetch((cfg.functionsBase || '/.netlify/functions/mymove') + '/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token },
      body: JSON.stringify(body || {})
    });
    var data = null;
    try { data = await r.json(); } catch (e) { data = null; }
    if (!r.ok) throw Object.assign(new Error((data && data.error) || ('Request failed (' + r.status + ')')), { status: r.status, code: data && data.code });
    return data;
  }

  return {
    configured: configured, client: sb, friendly: friendly, entryType: entryType,
    session: session, user: user, onAuth: onAuth, signOut: signOut,
    candidateLink: candidateLink, staffPassword: staffPassword, setPassword: setPassword, resetPassword: resetPassword,
    mfaLevel: mfaLevel, mfaFactors: mfaFactors, mfaEnrol: mfaEnrol, mfaVerify: mfaVerify,
    whoami: whoami,
    loadCandidate: loadCandidate, saveTaskStatus: saveTaskStatus, saveArrangement: saveArrangement, deleteArrangement: deleteArrangement, postNote: postNote,
    listCases: listCases, loadCase: loadCase, createCase: createCase, saveCase: saveCase, saveDraft: saveDraft, listTemplates: listTemplates, listStaff: listStaff, listAudit: listAudit, postStaffNote: postStaffNote,
    fn: fn
  };
})();
