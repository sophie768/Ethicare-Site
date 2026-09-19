/* My Move — authorisation checks against a STAGING Supabase project.
   Proves the acceptance guarantees the prototype could not: candidate separation,
   field controls, revocation on an existing session, and that staff without a
   second factor read nothing. Creates its own throwaway users and cases, and
   removes them at the end.

   Run:  SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm test
   Never point this at production. */
import { createClient } from '@supabase/supabase-js';

const URL_ = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON_KEY, SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) { console.error('Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY'); process.exit(2); }
if (/prod/i.test(URL_)) { console.error('Refusing to run against something that looks like production'); process.exit(2); }

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = Date.now().toString(36);
const mail = n => `mymove-test-${n}-${stamp}@example.com`;
const results = []; let failures = 0;
function check(name, ok, detail) { results.push({ name, ok, detail }); if (!ok) failures++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); }
const isDenied = err => !!err && (/42501|permission|not permitted|violates row-level|policy|staff-controlled|Unknown task|Nothing is published/i.test(err.message || '') || err.code === '42501');

async function userClient(email, password) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error('sign-in failed for ' + email + ': ' + error.message);
  return c;
}
async function createUser(email) {
  const password = 'Test-' + stamp + '-Pass-' + Math.random().toString(36).slice(2, 10);
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return { id: data.user.id, email, password };
}

const created = { users: [], cases: [] };
try {
  /* ---- setup: one admin staff (no MFA), two candidates, one bystander ---- */
  const staffU = await createUser(mail('staff')); created.users.push(staffU.id);
  await admin.from('staff_profiles').insert({ id: staffU.id, name: 'Test Admin', email: staffU.email, role: 'admin' }).throwOnError();
  const A = await createUser(mail('cand-a')); created.users.push(A.id);
  const B = await createUser(mail('cand-b')); created.users.push(B.id);
  const N = await createUser(mail('nobody')); created.users.push(N.id);

  const published = {
    role: { profession: 'Diagnostic Radiographer', jobTitle: 'Radiographer', employer: 'Test', destination: 'Australia', region: 'Bunbury, WA', startDate: null, relocationSupport: 'TBC', workingPattern: 'Full time' },
    welcome: 'Hello', nextActions: [], guides: ['reg-au'],
    tasks: [
      { id: 't-self', phase: 'registration', title: 'Self step', owner: 'you', status: 'not_started', staffControlled: false },
      { id: 't-staff', phase: 'registration', title: 'Staff step', owner: 'ethicare', status: 'in_progress', staffControlled: true }
    ]
  };
  async function makeCase(u, name) {
    const { data, error } = await admin.from('candidate_cases').insert({ assigned_staff_id: staffU.id, first_name: name, last_name: 'Test', email: u.email, auth_user_id: u.id, status: 'active', invitation: 'accepted', published, published_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    created.cases.push(data.id);
    await admin.from('case_draft').insert({ case_id: data.id, draft: Object.assign({}, published, { welcome: 'DRAFT-ONLY-SECRET' }) }).throwOnError();
    await admin.from('case_arrangements').insert({ case_id: data.id, type: 'flight', label: name + ' flight', state: 'planned' }).throwOnError();
    await admin.from('shared_notes').insert({ case_id: data.id, author_uid: staffU.id, author_kind: 'staff', author_name: 'Test Admin', body: 'note for ' + name }).throwOnError();
    return data;
  }
  const caseA = await makeCase(A, 'Alpha');
  const caseB = await makeCase(B, 'Beta');

  const a = await userClient(A.email, A.password);
  const n = await userClient(N.email, N.password);
  const s = await userClient(staffU.email, staffU.password);

  /* ---- #4 / #5 candidate separation ---- */
  let r = await a.from('my_case').select('*');
  check('A reads exactly their own case via my_case', !r.error && r.data.length === 1 && r.data[0].id === caseA.id, r.error && r.error.message);
  check('my_case response carries no draft column', !r.error && r.data.length === 1 && !('draft' in r.data[0]) && !('case_draft' in r.data[0]) && JSON.stringify(r.data).indexOf('DRAFT-ONLY-SECRET') < 0);
  r = await a.from('candidate_cases').select('*');
  check('A cannot select candidate_cases base table (0 rows or denied)', (r.error && isDenied(r.error)) || (!r.error && r.data.length === 0));
  r = await a.from('case_draft').select('*');
  check('A cannot read any draft', (r.error && isDenied(r.error)) || (!r.error && r.data.length === 0));
  r = await a.from('case_arrangements').select('*').eq('case_id', caseB.id);
  check("A cannot read B's arrangements by case id", !r.error && r.data.length === 0, r.error && r.error.message);
  r = await a.from('shared_notes').select('*').eq('case_id', caseB.id);
  check("A cannot read B's notes by case id", !r.error && r.data.length === 0);
  r = await a.from('shared_notes').select('*');
  check("A's unfiltered notes query returns only A's", !r.error && r.data.every(x => x.case_id === caseA.id));
  r = await a.from('shared_notes').insert({ case_id: caseB.id, author_uid: A.id, author_kind: 'candidate', author_name: 'x', body: 'intrusion' });
  check("A cannot post a note on B's case", isDenied(r.error), r.error ? r.error.message : 'insert succeeded');
  r = await a.from('case_task_progress').upsert({ case_id: caseB.id, task_key: 't-self', status: 'complete' });
  check("A cannot write progress on B's case", isDenied(r.error), r.error ? r.error.message : 'write succeeded');
  r = await a.from('case_arrangements').update({ state: 'booked' }).eq('case_id', caseB.id).select();
  check("A's update of B's arrangement changes nothing", (!r.error && r.data.length === 0) || isDenied(r.error));
  r = await n.from('my_case').select('*');
  check('A signed-in user with no case sees nothing', !r.error && r.data.length === 0);
  r = await n.from('case_arrangements').select('*');
  check('A user with no case reads no arrangements', !r.error && r.data.length === 0);

  /* ---- #6 field & publication controls ---- */
  r = await a.from('case_task_progress').upsert({ case_id: caseA.id, task_key: 't-self', status: 'complete' }).select();
  check('A can self-report a non-staff-controlled task', !r.error && r.data.length === 1 && r.data[0].self_reported === true, r.error && r.error.message);
  r = await a.from('case_task_progress').upsert({ case_id: caseA.id, task_key: 't-staff', status: 'complete' });
  check('A cannot tick a staff-controlled milestone (trigger)', isDenied(r.error), r.error ? r.error.message : 'write succeeded');
  r = await a.from('case_task_progress').upsert({ case_id: caseA.id, task_key: 'no-such-task', status: 'complete' });
  check('A cannot write progress for an unknown task key', isDenied(r.error));
  r = await a.from('candidate_cases').update({ status: 'active', assigned_staff_id: staffU.id }).eq('id', caseA.id).select();
  check('A cannot update candidate_cases at all', (!r.error && r.data.length === 0) || isDenied(r.error));
  r = await a.from('shared_notes').insert({ case_id: caseA.id, author_uid: B.id, author_kind: 'staff', author_name: 'Spoof Staff', body: 'hello' }).select().single();
  check('Note authorship is forced from identity, not the posted row', !r.error && r.data.author_uid === A.id && r.data.author_kind === 'candidate' && r.data.author_name !== 'Spoof Staff', r.error && r.error.message);
  r = await a.from('case_arrangements').insert({ case_id: caseA.id, type: 'car', label: 'mine', editable_by: 'staff' }).select().single();
  check('Candidate-created arrangement is forced to candidate-editable', !r.error && r.data.editable_by === 'candidate', r.error && r.error.message);

  /* ---- #8 durability (second session) ---- */
  const a2 = await userClient(A.email, A.password);
  r = await a2.from('case_task_progress').select('*').eq('case_id', caseA.id).eq('task_key', 't-self').single();
  check('Self-reported progress is visible from a second sign-in', !r.error && r.data.status === 'complete');

  /* ---- staff without MFA reads nothing ---- */
  r = await s.from('candidate_cases').select('id');
  check('Staff without aal2 cannot read cases', !r.error && r.data.length === 0, r.error && r.error.message);
  r = await s.from('case_draft').select('*');
  check('Staff without aal2 cannot read drafts', !r.error && r.data.length === 0);
  r = await s.from('staff_profiles').select('*');
  check('Staff without aal2 cannot list the team', !r.error && r.data.length === 0);

  /* ---- #9 revocation on an EXISTING session ---- */
  await admin.from('candidate_cases').update({ status: 'suspended' }).eq('id', caseA.id).throwOnError();
  r = await a.from('my_case').select('*');
  check('Suspended candidate: existing session now gets 0 rows', !r.error && r.data.length === 0);
  r = await a.from('case_task_progress').upsert({ case_id: caseA.id, task_key: 't-self', status: 'in_progress' });
  check('Suspended candidate: existing session cannot write', isDenied(r.error));
  await admin.from('candidate_cases').update({ status: 'active', invitation: 'revoked' }).eq('id', caseA.id).throwOnError();
  r = await a.from('my_case').select('*');
  check('Revoked invitation: existing session gets 0 rows', !r.error && r.data.length === 0);
  await admin.rpc('mm_revoke_sessions', { p_uid: A.id });
  const refreshed = await a.auth.refreshSession();
  check('mm_revoke_sessions kills the refresh token', !!refreshed.error, refreshed.error ? refreshed.error.message : 'refresh still worked');
  await admin.from('staff_profiles').update({ active: false }).eq('id', staffU.id).throwOnError();
  r = await s.from('templates').select('id');
  check('Removed staff: existing session reads nothing', !r.error && r.data.length === 0);

  /* ---- anon reaches nothing ---- */
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
  r = await anon.from('my_case').select('*');
  check('Anon cannot read my_case', !!r.error || r.data.length === 0);
  r = await anon.from('candidate_cases').select('*');
  check('Anon cannot read candidate_cases', !!r.error || r.data.length === 0);
  r = await anon.rpc('mm_revoke_sessions', { p_uid: A.id });
  check('Anon cannot call server-only functions', !!r.error);
} catch (e) {
  console.error('HARNESS ERROR: ' + (e.message || e)); failures++;
} finally {
  for (const id of created.cases) { await admin.from('candidate_cases').delete().eq('id', id); }
  for (const id of created.users) { await admin.from('staff_profiles').delete().eq('id', id); await admin.auth.admin.deleteUser(id); }
  console.log(`\n${results.filter(r => r.ok).length} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}
