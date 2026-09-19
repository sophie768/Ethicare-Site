/* My Move — staff admin: candidate list, record editor, templates, team.
   Draft edits autosave to case_draft (staff-only); nothing reaches the
   candidate until Publish. Privileged actions go through the Netlify function. */
const { useState: sUseState, useEffect: sUseEffect, useRef: sUseRef, useMemo: sUseMemo } = React;
const SAPI = window.MMAPI;

const STAFF_NAV = [
  { id: 'list', label: 'Candidates', short: 'Candidates', icon: 'cases' },
  { id: 'templates', label: 'Templates', short: 'Templates', icon: 'guides' },
  { id: 'team', label: 'Team & access', short: 'Team', icon: 'team' }
];
const EDIT_STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'template', label: 'Template' },
  { id: 'personalise', label: 'Personalise' },
  { id: 'preview', label: 'Preview' },
  { id: 'publish', label: 'Publish & invite' },
  { id: 'notes', label: 'Shared notes' }
];

function draftOf(cs) { return MMD.normaliseDraft(cs && cs.case_draft ? cs.case_draft.draft : null); }
function isDirty(cs, localDirty) {
  if (localDirty) return true;
  if (!cs) return false;
  if (!cs.published_at) return !!(cs.case_draft && cs.case_draft.draft && Object.keys(cs.case_draft.draft).length);
  return !!(cs.case_draft && cs.case_draft.updated_at && new Date(cs.case_draft.updated_at) > new Date(cs.published_at));
}
function caseStage(cs) {
  if (cs.status === 'archived') return 'Archived';
  if (cs.status === 'suspended') return 'Suspended';
  if (cs.invitation === 'draft') return 'Draft';
  const t = draftOf(cs).tasks;
  const open = ph => t.filter(x => x.phase === ph && x.status !== 'complete' && x.status !== 'na').length;
  if (open('registration')) return 'Registration & visa';
  if (open('travel')) return 'Preparing to travel';
  return open('settle') ? 'Arrival & settling' : (t.length ? 'Complete' : 'Invited');
}
function invChip(cs) {
  const key = cs.status === 'suspended' ? 'suspended' : cs.status === 'archived' ? 'archived' : cs.invitation;
  const label = { draft: 'Draft', sent: 'Invited', accepted: 'Active', revoked: 'Revoked', expired: 'Expired', suspended: 'Suspended', archived: 'Archived' }[key] || key;
  return <span className={'mm-inv ' + key}>{label}</span>;
}
function Field({ label, hint, id, children, error }) {
  return <div className="mm-field"><label htmlFor={id}>{label}{hint ? <span className="hint"> — {hint}</span> : null}</label>{children}{error ? <div className="mm-err" role="alert" id={id + '-err'}>{error}</div> : null}</div>;
}

/* Debounced autosave with a visible state and a retry that keeps the edits. */
function useAutosave(value, save, ready) {
  const [state, setState] = sUseState('idle');
  const latest = sUseRef(value); latest.current = value;
  const first = sUseRef(true);
  const timer = sUseRef(null);
  const run = async () => {
    setState('saving');
    const snapshot = latest.current;
    try { await save(snapshot); setState(latest.current === snapshot ? 'saved' : 'dirty'); if (latest.current !== snapshot) schedule(); }
    catch (e) { setState('error'); }
  };
  const schedule = () => { clearTimeout(timer.current); timer.current = setTimeout(run, 800); };
  sUseEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    setState('dirty'); schedule();
    return () => clearTimeout(timer.current);
  }, [value, ready]);
  return [state, run];
}

/* ---------- candidate list ---------- */
function CaseList({ cases, me, onOpen, onAdd, loading, error, onReload }) {
  const [q, setQ] = sUseState('');
  const [dest, setDest] = sUseState('all');
  const [inv, setInv] = sUseState('all');
  const rows = cases.filter(c => {
    const d = draftOf(c);
    if (dest !== 'all' && d.role.destination !== dest) return false;
    if (inv !== 'all') {
      const key = c.status === 'suspended' ? 'suspended' : c.status === 'archived' ? 'archived' : c.invitation;
      if (key !== inv) return false;
    } else if (c.status === 'archived') return false;
    const hay = [c.first_name, c.last_name, c.email, d.role.employer, c.public_ref, d.role.region, c.vincere_id].join(' ').toLowerCase();
    return hay.indexOf(q.toLowerCase()) > -1;
  });
  return <div>
    <div className="mm-toolbar">
      <div className="mm-search"><Icon name="search" /><input value={q} placeholder="Search name, employer, reference or place" aria-label="Search candidates" onChange={e => setQ(e.target.value)} /></div>
      <select className="mm-filt" value={dest} aria-label="Filter by destination" onChange={e => setDest(e.target.value)}><option value="all">All destinations</option><option>New Zealand</option><option>Australia</option></select>
      <select className="mm-filt" value={inv} aria-label="Filter by status" onChange={e => setInv(e.target.value)}><option value="all">Any status (not archived)</option><option value="draft">Draft</option><option value="sent">Invited</option><option value="accepted">Active</option><option value="revoked">Revoked</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select>
      {me.role === 'admin' ? <button className="mm-btn pri" onClick={onAdd}><Icon name="add" /> Add candidate</button> : null}
    </div>
    {error ? <Alert kind="err" onRetry={onReload}>{error}</Alert> : null}
    {loading ? <Loading label="Loading candidates…" /> : rows.length ? <div className="mm-tablewrap"><table className="mm-cases">
      <caption className="mm-vh">Candidate cases</caption>
      <thead><tr><th scope="col">Candidate</th><th scope="col">Destination</th><th scope="col">Employer</th><th scope="col">Assigned</th><th scope="col">Stage</th><th scope="col">Access</th><th scope="col">Last update</th></tr></thead>
      <tbody>{rows.map(c => { const d = draftOf(c); return <tr key={c.id} onClick={() => onOpen(c.id)}>
        <td><button className="open" onClick={e => { e.stopPropagation(); onOpen(c.id); }}><span className="mm-cnm">{(c.first_name + ' ' + c.last_name).trim() || 'New candidate'}</span><span className="mm-cref" style={{ display: 'block' }}>{c.public_ref}{c.vincere_id ? ' · Vincere ' + c.vincere_id : ''}</span></button></td>
        <td>{d.role.region || d.role.destination || <span className="mm-tbc">TBC</span>}</td>
        <td>{tbc(d.role.employer) ? <span className="mm-tbc">TBC</span> : d.role.employer}</td>
        <td>{c.assigned ? c.assigned.name : '—'}</td>
        <td>{caseStage(c)}{isDirty(c) && c.invitation !== 'draft' ? <div className="mm-dirty">Unpublished edits</div> : null}</td>
        <td>{invChip(c)}</td>
        <td>{fmtDate(c.last_update)}</td>
      </tr>; })}</tbody>
    </table></div> : <div className="mm-empty">{cases.length ? <span>No candidates match. <button className="mm-btn ghost sm" onClick={() => { setQ(''); setDest('all'); setInv('all'); }}>Clear filters</button></span> : 'No candidates yet. Add the first one above.'}</div>}
    <p className="mm-lead small" style={{ marginTop: 16 }}>Every case is a separate record held in the managed database with per-case access rules. A candidate only ever sees their own published case.</p>
  </div>;
}

/* ---------- template diff (what will be added, kept, removed) ---------- */
function templateDiff(draft, tpl) {
  const tplTasks = Array.isArray(tpl.tasks) ? tpl.tasks : [];
  const have = {}; draft.tasks.forEach(t => { have[t.id] = t; });
  const inTpl = {}; tplTasks.forEach(t => { inTpl[t.id] = t; });
  return {
    added: tplTasks.filter(t => !have[t.id]),
    kept: draft.tasks.filter(t => inTpl[t.id]),
    removed: draft.tasks.filter(t => !inTpl[t.id]),
    guides: (Array.isArray(tpl.guides) ? tpl.guides : []).filter(g => draft.guides.indexOf(g) < 0)
  };
}
function TemplateStep({ draft, templates, progress, onApply }) {
  const [pending, setPending] = sUseState(null);
  const blank = { id: 'blank', label: 'Blank — remove all tasks', destination: '', tasks: [], guides: [] };
  const all = templates.concat([blank]);
  const progressed = keys => keys.filter(id => progress.some(p => p.task_key === id)).length;
  const choose = tpl => setPending({ tpl, diff: templateDiff(draft, tpl) });
  const apply = mode => {
    const { tpl, diff } = pending;
    const clone = x => JSON.parse(JSON.stringify(x));
    let tasks;
    if (mode === 'add') tasks = draft.tasks.concat(diff.added.map(clone));
    else tasks = (Array.isArray(tpl.tasks) ? tpl.tasks : []).map(t => { const k = draft.tasks.find(x => x.id === t.id); return k ? k : clone(t); });
    const guides = draft.guides.concat(diff.guides);
    const role = Object.assign({}, draft.role, (!draft.role.destination && tpl.destination) ? { destination: tpl.destination } : {});
    onApply(Object.assign({}, draft, { tasks, guides, role }), tpl.id === 'blank' ? 'Tasks removed' : 'Template applied');
    setPending(null);
  };
  return <div>
    <p className="mm-lead">Apply a starting set of tasks and guides for the destination and profession. You can edit everything afterwards. Before anything changes you’ll see exactly what would be added, kept and removed — a candidate’s progress on kept steps is never reset.</p>
    <div className="mm-grid g2" style={{ marginTop: 14 }}>{all.map(t =>
      <button key={t.id} className="mm-card mm-tplbtn" onClick={() => choose(t)}>
        <span className="mm-k">{t.destination || 'Any destination'}</span>
        <div className="tl">{t.label}</div>
        <div className="tn">{t.id === 'blank' ? 'Start from nothing.' : (t.tasks || []).length + ' tasks · ' + (t.guides || []).length + ' guides'}</div>
      </button>
    )}</div>
    <p className="mm-lead small" style={{ marginTop: 14 }}>Current: <b>{draft.tasks.length} tasks</b>, <b>{draft.guides.length} guides</b>.</p>
    {pending ? <div className="mm-card" style={{ marginTop: 16, borderColor: 'var(--mm-teal)' }} role="dialog" aria-labelledby="tpl-diff-h">
      <span className="mm-k">Before you apply</span>
      <h3 id="tpl-diff-h" style={{ fontSize: 18, margin: '6px 0 10px' }}>{pending.tpl.label}</h3>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li><b>{pending.diff.added.length}</b> task{pending.diff.added.length === 1 ? '' : 's'} would be added{pending.diff.added.length ? ': ' + pending.diff.added.map(t => t.title).join(', ') : ''}.</li>
        <li><b>{pending.diff.kept.length}</b> existing task{pending.diff.kept.length === 1 ? '' : 's'} kept as they are, with their status and the candidate’s progress.</li>
        <li><b>{pending.diff.removed.length}</b> task{pending.diff.removed.length === 1 ? '' : 's'} would be removed{pending.diff.removed.length ? ': ' + pending.diff.removed.map(t => t.title).join(', ') : ''}.
          {progressed(pending.diff.removed.map(t => t.id)) ? <span style={{ color: 'var(--mm-clay)' }}> The candidate has recorded progress on {progressed(pending.diff.removed.map(t => t.id))} of these; it will no longer show.</span> : null}</li>
        <li><b>{pending.diff.guides.length}</b> guide{pending.diff.guides.length === 1 ? '' : 's'} would be added. Nothing is published until you say so.</li>
      </ul>
      <div className="mm-rowacts" style={{ marginTop: 14 }}>
        {pending.diff.removed.length ? <button className="mm-btn sec" onClick={() => apply('add')}>Add new tasks only, keep all mine</button> : null}
        <button className={'mm-btn ' + (pending.diff.removed.length ? 'warn' : 'pri')} disabled={!pending.diff.added.length && !pending.diff.removed.length && !pending.diff.guides.length} onClick={() => apply('replace')}>{pending.diff.removed.length ? 'Apply and remove ' + pending.diff.removed.length : 'Apply'}</button>
        <button className="mm-btn ghost" onClick={() => setPending(null)}>Cancel</button>
      </div>
    </div> : null}
  </div>;
}

/* ---------- personalise ---------- */
function TaskEditor({ t, reported, onChange, onRemove }) {
  const set = patch => onChange(Object.assign({}, t, patch));
  const id = 'te-' + t.id.replace(/[^a-z0-9]/gi, '');
  return <div className="mm-task" style={{ marginBottom: 8, gridTemplateColumns: 'minmax(0,1fr)' }}>
    <div>
      <label className="mm-vh" htmlFor={id + '-title'}>Task title</label>
      <input id={id + '-title'} className="mm-inl title" value={t.title} placeholder="Task title" onChange={e => set({ title: e.target.value })} />
      <label className="mm-vh" htmlFor={id + '-why'}>Why it matters</label>
      <textarea id={id + '-why'} className="mm-inl" style={{ width: '100%', marginTop: 8, minHeight: 44, fontSize: 14 }} value={t.why || ''} placeholder="One line on why this matters (optional)" onChange={e => set({ why: e.target.value })} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="mm-sel" aria-label="Owner" value={t.owner} onChange={e => set({ owner: e.target.value })}>{Object.keys(MMD.OWNER).map(o => <option key={o} value={o}>{MMD.OWNER[o]}</option>)}</select>
        <select className="mm-sel" aria-label="Status" value={t.status} onChange={e => set({ status: e.target.value, selfReported: false })}>{STATUS_KEYS.map(s => <option key={s} value={s}>{MMD.STATUS[s]}</option>)}</select>
        <select className="mm-sel" aria-label="Phase" value={t.phase} onChange={e => set({ phase: e.target.value })}>{MMD.PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        <label style={{ fontSize: 13, color: 'var(--mm-mut)', display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!t.staffControlled} onChange={e => set({ staffControlled: e.target.checked })} /> Staff-controlled (candidate cannot self-tick)</label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: 'var(--mm-mut)' }}>Due <input type="date" className="mm-sel" value={t.due || ''} onChange={e => set({ due: e.target.value || null })} /></label>
        <label style={{ fontSize: 13, color: 'var(--mm-mut)' }}>Waiting on <input className="mm-inl" style={{ minHeight: 40 }} value={t.waitingOn || ''} placeholder="e.g. Nursing Council" onChange={e => set({ waitingOn: e.target.value || null })} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: 'var(--mm-mut)', flex: 1, minWidth: 200 }}>Official link <input type="url" className="mm-inl" style={{ width: '100%', minHeight: 40 }} value={t.link || ''} placeholder="https://… (regulator, immigration, employer)" onChange={e => set({ link: e.target.value || null })} /></label>
        <label style={{ fontSize: 13, color: 'var(--mm-mut)' }}>Link label <input className="mm-inl" style={{ minHeight: 40 }} value={t.linkLabel || ''} placeholder="Official information" onChange={e => set({ linkLabel: e.target.value || null })} /></label>
      </div>
      {t.link && !safeUrl(t.link) ? <div className="mm-err">Links must start with https://</div> : null}
      {reported && !t.staffControlled && reported.status !== t.status ? <div className="mm-alert warn" style={{ marginTop: 10, marginBottom: 0 }}><span className="grow">Candidate reports <b>{MMD.STATUS[reported.status]}</b> ({fmtWhen(reported.updated_at)}) — self-reported, not verified.</span><button className="mm-btn sec sm" onClick={() => set({ status: reported.status })}>Use this</button></div> : null}
    </div>
    <div className="mm-rowacts" style={{ marginTop: 8 }}><button className="mm-btn ghost sm" onClick={onRemove}>Remove task</button></div>
  </div>;
}

function Personalise({ cs, draft, setDraft, progress, arrangements, onArrangement, previewModel, toast }) {
  const [allGuides, setAllGuides] = sUseState(false);
  const upd = patch => setDraft(Object.assign({}, draft, patch));
  const reportedBy = {}; progress.forEach(p => { reportedBy[p.task_key] = p; });
  const dest = draft.role.destination;
  const guideIds = Object.keys(MMD.guides).filter(g => allGuides || !dest || MMD.guides[g].dest === dest || draft.guides.indexOf(g) > -1);
  const newTask = phase => ({ id: MMD.uid('t'), phase, title: '', why: '', owner: 'you', status: 'not_started', selfReported: false, staffControlled: false, due: null, waitingOn: null, link: null, linkLabel: null });
  return <div className="mm-editor">
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 6 }}>Next steps shown on their home</h3>
      <p className="mm-lead small" style={{ marginBottom: 10 }}>One to three things to do now. Add a date only where one is known.</p>
      {draft.nextActions.map(a => <div key={a.id} className="mm-task" style={{ marginBottom: 8, gridTemplateColumns: 'minmax(0,1fr)' }}>
        <div>
          <input className="mm-inl title" aria-label="Next step" value={a.title} placeholder="What to do next" onChange={e => upd({ nextActions: draft.nextActions.map(x => x.id === a.id ? Object.assign({}, x, { title: e.target.value }) : x) })} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <select className="mm-sel" aria-label="Owner" value={a.owner} onChange={e => upd({ nextActions: draft.nextActions.map(x => x.id === a.id ? Object.assign({}, x, { owner: e.target.value }) : x) })}>{Object.keys(MMD.OWNER).map(o => <option key={o} value={o}>{MMD.OWNER[o]}</option>)}</select>
          <input type="date" className="mm-sel" aria-label="Due date" value={a.due || ''} onChange={e => upd({ nextActions: draft.nextActions.map(x => x.id === a.id ? Object.assign({}, x, { due: e.target.value || null }) : x) })} />
          <button className="mm-btn ghost sm" onClick={() => upd({ nextActions: draft.nextActions.filter(x => x.id !== a.id) })}>Remove</button>
        </div>
      </div>)}
      <button className="mm-btn sec sm" disabled={draft.nextActions.length >= 3} onClick={() => upd({ nextActions: draft.nextActions.concat([{ id: MMD.uid('n'), title: '', owner: 'you', due: null }]) })}><Icon name="add" /> Add a next step</button>

      <h3 style={{ fontSize: 17, margin: '26px 0 6px' }}>Tasks</h3>
      <p className="mm-lead small" style={{ marginBottom: 6 }}>Everything the candidate sees under Registration & visa, Travel and Settling in. Staff-controlled tasks show as “Updated by Ethicare” and “Confirmed by Ethicare” once complete.</p>
      {MMD.PHASES.map(ph => { const list = draft.tasks.filter(t => t.phase === ph.id); return <div key={ph.id}>
        <div className="mm-phase"><h3>{ph.label}</h3><span className="ct">{list.length} task{list.length === 1 ? '' : 's'}</span></div>
        {list.map(t => <TaskEditor key={t.id} t={t} reported={reportedBy[t.id]} onChange={nt => upd({ tasks: draft.tasks.map(x => x.id === t.id ? nt : x) })} onRemove={() => { if (confirm('Remove “' + (t.title || 'this task') + '”? ' + (reportedBy[t.id] ? 'The candidate has recorded progress on it.' : '')) ) upd({ tasks: draft.tasks.filter(x => x.id !== t.id) }); }} />)}
        <button className="mm-btn sec sm" onClick={() => upd({ tasks: draft.tasks.concat([newTask(ph.id)]) })}><Icon name="add" /> Add a task to {ph.label.toLowerCase()}</button>
      </div>; })}

      <h3 style={{ fontSize: 17, margin: '26px 0 6px' }}>Travel & accommodation details</h3>
      <p className="mm-lead small" style={{ marginBottom: 10 }}>Saved straight away (not part of publishing). The candidate can update anything marked as theirs to edit; details you mark as Ethicare-maintained are read-only for them.</p>
      <div className="mm-grid g2">{arrangements.map(a => <ArrangementCard key={a.id || a._tmp} a={a} staffMode onSave={onArrangement.save} onDelete={onArrangement.remove} />)}</div>
      <div style={{ marginTop: 10 }}><button className="mm-btn sec sm" onClick={onArrangement.add}><Icon name="add" /> Add an arrangement</button></div>

      <h3 style={{ fontSize: 17, margin: '26px 0 6px' }}>Guides selected for this candidate</h3>
      <p className="mm-lead small" style={{ marginBottom: 10 }}>{dest && !allGuides ? 'Showing guides for ' + dest + '. ' : ''}<button className="mm-btn ghost sm" onClick={() => setAllGuides(!allGuides)}>{allGuides ? 'Show relevant only' : 'Show all guides'}</button></p>
      <div className="mm-grid g2">{guideIds.map(gid => { const g = MMD.guides[gid]; const on = draft.guides.indexOf(gid) > -1; return <label key={gid} className={'mm-chk card' + (on ? ' on' : '')}>
        <input type="checkbox" checked={on} onChange={() => upd({ guides: on ? draft.guides.filter(x => x !== gid) : draft.guides.concat([gid]) })} />
        <span><b style={{ fontFamily: "'Work Sans',sans-serif", color: 'var(--mm-teal)', fontWeight: 600 }}>{g.title}</b><br /><span style={{ fontSize: 13, color: 'var(--mm-mut)' }}>{g.topic} · <a href={g.url} target="_blank" rel="noopener">open ↗</a></span></span>
      </label>; })}</div>
    </div>
    <div className="mm-preview">
      <div className="ph"><span className="dot"></span> Live preview — candidate home (draft)</div>
      <div className="pv"><CandidateBody view="home" d={previewModel} actions={{ goto: () => {} }} readOnly /></div>
    </div>
  </div>;
}

/* ---------- publish & lifecycle ---------- */
function PublishStep({ cs, draft, dirty, me, onAction, busy, notice }) {
  const [offerOk, setOfferOk] = sUseState(false);
  const [emailOk, setEmailOk] = sUseState(false);
  const [confirmRef, setConfirmRef] = sUseState('');
  const live = cs.invitation === 'accepted' || cs.invitation === 'sent';
  const canInvite = !!(cs.first_name && cs.email && cs.email.indexOf('@') > 0);
  const hasContent = !!(draft.role && (draft.role.profession || draft.role.destination) && draft.tasks.length);
  return <div>
    <h3 style={{ fontSize: 18 }}>{live ? 'Publish your changes' : 'Publish & invite'}</h3>
    <p className="mm-lead">Publishing copies your draft into the candidate’s live view. {live ? 'They already have access, so they’ll see the update on their next visit.' : 'The candidate has no access until you send the invitation below.'}</p>
    {notice ? <Alert kind={notice.kind}>{notice.text}</Alert> : null}
    <div className="mm-card" style={{ margin: '14px 0' }}>
      <span className="mm-k">About to publish</span>
      <ul style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.7, color: 'var(--mm-mut)' }}>
        <li><b>{(cs.first_name + ' ' + cs.last_name).trim() || 'Name missing'}</b> — {cs.email || <span style={{ color: 'var(--mm-clay)' }}>email missing</span>}</li>
        <li>{tbc(draft.role.profession) ? 'Profession TBC' : draft.role.profession} · {draft.role.region || draft.role.destination || 'destination TBC'}</li>
        <li>{draft.tasks.length} tasks · {draft.guides.length} guides · {draft.nextActions.length} next steps</li>
        <li>Assigned to {cs.assigned ? cs.assigned.name : '—'}{cs.published_at ? ' · last published ' + fmtWhen(cs.published_at) : ' · never published'}</li>
      </ul>
      {!hasContent ? <p className="mm-err" style={{ marginTop: 10 }}>Add a destination or profession and at least one task before publishing.</p> : null}
    </div>
    {!live ? <div className="mm-card" style={{ marginBottom: 14 }}>
      <span className="mm-k">Before you invite</span>
      <label className="mm-chk"><input type="checkbox" checked={offerOk} onChange={e => setOfferOk(e.target.checked)} /> I confirm this candidate has accepted an Ethicare-supported offer.</label>
      <label className="mm-chk"><input type="checkbox" checked={emailOk} onChange={e => setEmailOk(e.target.checked)} /> I confirm <b>{cs.email || '(no email)'}</b> is correct.</label>
      <p className="mm-fine">The invitation is scoped to this address, expires, and can be revoked. It carries a sign-in action only — no case detail travels in the email.</p>
    </div> : null}
    <div className="mm-rowacts">
      {live
        ? <button className="mm-btn pri" disabled={busy || !dirty || !hasContent} onClick={() => onAction('publish-case')}>{busy ? 'Working…' : 'Publish changes'}</button>
        : cs.status === 'archived' ? null
        : <button className="mm-btn pri" disabled={busy || !canInvite || !offerOk || !emailOk || !hasContent} onClick={() => onAction('publish-and-invite')}>{busy ? 'Working…' : 'Publish & send invitation'}</button>}
      {!live && cs.published_at && cs.invitation === 'revoked' && cs.status !== 'archived' ? <button className="mm-btn sec" disabled={busy || !canInvite || !offerOk || !emailOk} onClick={() => onAction('invite-candidate')}>Re-invite (publish first if changed)</button> : null}
    </div>

    <div className="mm-danger">
      <h4>Case lifecycle</h4>
      <p className="mm-fine" style={{ margin: '4px 0 12px' }}>Status <b>{cs.status}</b> · invitation <b>{cs.invitation}</b>{cs.invited_at ? ' · invited ' + fmtWhen(cs.invited_at) : ''}.</p>
      <div className="mm-rowacts">
        {live ? <button className="mm-btn sec sm" disabled={busy} onClick={() => onAction('resend-invitation')}>Resend sign-in link</button> : null}
        {live ? <button className="mm-btn warn sm" disabled={busy} onClick={() => { if (confirm('Revoke access for this candidate? They will be signed out everywhere.')) onAction('revoke-invitation'); }}>Revoke invitation</button> : null}
        {cs.status === 'active' ? <button className="mm-btn warn sm" disabled={busy} onClick={() => { if (confirm('Suspend access? They will be signed out everywhere until reactivated.')) onAction('suspend-case'); }}>Suspend access</button> : null}
        {cs.status === 'suspended' ? <button className="mm-btn sec sm" disabled={busy} onClick={() => onAction('reactivate-case')}>Reactivate</button> : null}
        {cs.status !== 'archived' ? <button className="mm-btn warn sm" disabled={busy} onClick={() => { if (confirm('Archive this case? Access ends; the record is kept under the retention policy.')) onAction('archive-case'); }}>Archive case</button> : null}
        <button className="mm-btn sec sm" disabled={busy} onClick={() => onAction('export-case')}>Export case (subject access)</button>
      </div>
      <p className="mm-fine" style={{ marginTop: 10 }}>Archiving keeps the record under the retention policy. Permanent deletion is separate, admin-only, and erases the person’s details while keeping a de-identified audit trail.</p>
      {me.role === 'admin' ? <div style={{ marginTop: 12 }}>
        <label className="mm-k" htmlFor="del-ref">Permanent deletion — type {cs.public_ref} to confirm</label>
        <div className="mm-rowacts" style={{ marginTop: 6 }}>
          <input id="del-ref" className="mm-inl" value={confirmRef} onChange={e => setConfirmRef(e.target.value.toUpperCase())} placeholder={cs.public_ref} />
          <button className="mm-btn warn sm" disabled={busy || confirmRef !== cs.public_ref} onClick={() => { if (confirm('Permanently erase this candidate’s details? This cannot be undone.')) onAction('delete-case', { confirm: confirmRef }); }}>Delete permanently</button>
        </div>
      </div> : null}
    </div>
  </div>;
}

/* ---------- the editor ---------- */
function CaseEditor({ caseId, me, staff, templates, onBack, onChanged, ping }) {
  const [cs, setCs] = sUseState(null);
  const [draft, setDraftRaw] = sUseState(null);
  const [fields, setFields] = sUseState(null);
  const [arrangements, setArr] = sUseState([]);
  const [progress, setProgress] = sUseState([]);
  const [notes, setNotes] = sUseState([]);
  const [audit, setAudit] = sUseState([]);
  const [loadErr, setLoadErr] = sUseState('');
  const [step, setStep] = sUseState('details');
  const [pv, setPv] = sUseState('home');
  const [busy, setBusy] = sUseState(false);
  const [notice, setNotice] = sUseState(null);
  const [localDirty, setLocalDirty] = sUseState(false);
  const ready = !!(cs && draft && fields);

  const load = async (initial) => {
    setLoadErr('');
    try {
      const data = await SAPI.loadCase(caseId);
      if (!data) { setLoadErr('This case is not available to you.'); return; }
      setCs(data);
      if (initial) {
        setDraftRaw(draftOf(data));
        setFields({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '', assigned_staff_id: data.assigned_staff_id, vincere_id: data.vincere_id || '' });
        setStep(data.invitation === 'draft' && !data.first_name ? 'details' : 'personalise');
      }
      setArr(data.arrangements); setProgress(data.progress); setNotes(data.notes);
      if (me.role === 'admin') { try { setAudit(await SAPI.listAudit(caseId)); } catch (e) {} }
    } catch (e) { setLoadErr(SAPI.friendly(e)); }
  };
  sUseEffect(() => { load(true); }, [caseId]);

  const setDraft = d => { setDraftRaw(d); setLocalDirty(true); };
  const [draftSave, retryDraft] = useAutosave(draft, async d => {
    const row = await SAPI.saveDraft(caseId, d);
    setCs(c => Object.assign({}, c, { case_draft: { draft: row.draft, updated_at: row.updated_at }, last_update: row.updated_at }));
    onChanged();
  }, ready);
  const [fieldSave, retryFields] = useAutosave(fields, async f => {
    const row = await SAPI.saveCase(caseId, f);
    setCs(c => Object.assign({}, c, row));
    onChanged();
  }, ready);
  const saveState = draftSave === 'error' || fieldSave === 'error' ? 'error' : draftSave === 'saving' || fieldSave === 'saving' ? 'saving' : draftSave === 'dirty' || fieldSave === 'dirty' ? 'dirty' : draftSave === 'saved' || fieldSave === 'saved' ? 'saved' : 'idle';
  const retryAll = () => { if (draftSave === 'error') retryDraft(); if (fieldSave === 'error') retryFields(); };
  sUseEffect(() => {
    const warn = e => { if (saveState === 'dirty' || saveState === 'saving' || saveState === 'error') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saveState]);

  const onArrangement = {
    save: async row => { const saved = await SAPI.saveArrangement(Object.assign({}, row, { case_id: caseId })); setArr(a => a.filter(x => x.id !== saved.id && x._tmp !== row._tmp).concat([saved])); ping('Arrangement saved'); },
    remove: async row => { if (row.id) { try { await SAPI.deleteArrangement(row.id); } catch (e) { setNotice({ kind: 'err', text: SAPI.friendly(e) }); return; } } setArr(a => a.filter(x => x !== row && (!row.id || x.id !== row.id))); },
    add: () => setArr(a => a.concat([{ _tmp: MMD.uid('a'), case_id: caseId, type: 'other', label: '', detail: '', state: 'planned', editable_by: 'candidate' }]))
  };

  const act = async (action, extra) => {
    setBusy(true); setNotice(null);
    try {
      if (saveState === 'dirty' || saveState === 'saving' || saveState === 'error') {
        if (draftSave !== 'saved' && draftSave !== 'idle') await SAPI.saveDraft(caseId, draft);
        if (fieldSave !== 'saved' && fieldSave !== 'idle') await SAPI.saveCase(caseId, fields);
      }
      const res = await SAPI.fn(action, Object.assign({ caseId }, extra || {}));
      if (action === 'export-case') {
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-move-' + cs.public_ref + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        ping('Export downloaded');
      } else if (action === 'delete-case') {
        ping('Case deleted'); onChanged(); onBack(); return;
      } else {
        const msg = { 'publish-case': 'Changes published', 'publish-and-invite': 'Published · invitation sent', 'invite-candidate': 'Invitation sent', 'resend-invitation': 'Sign-in link sent', 'revoke-invitation': 'Invitation revoked — access removed', 'suspend-case': 'Access suspended', 'reactivate-case': 'Access reactivated', 'archive-case': 'Case archived' }[action] || 'Done';
        ping(msg); setNotice({ kind: 'ok', text: msg + '.' });
        setLocalDirty(false);
        await load(); onChanged();
      }
    } catch (e) {
      setNotice({ kind: 'err', text: (e.code === 'mfa_required' ? 'Two-factor sign-in is required for this action. Sign out and back in.' : SAPI.friendly(e)) + ' Nothing was changed.' });
    }
    setBusy(false);
  };

  if (loadErr) return <div><button className="mm-btn ghost sm" onClick={onBack}>← All candidates</button><Alert kind="err" onRetry={load}>{loadErr}</Alert></div>;
  if (!ready) return <Loading label="Opening case…" />;

  const dirty = isDirty(cs, localDirty && draftSave !== 'saved');
  const stepIdx = EDIT_STEPS.findIndex(s => s.id === step);
  const previewModel = {
    firstName: fields.first_name, lastName: fields.last_name,
    role: draft.role, welcome: draft.welcome, nextActions: draft.nextActions, tasks: overlayProgress(draft, progress).tasks, guides: draft.guides,
    arrangements, notes, contact: cs.assigned ? { name: cs.assigned.name, email: cs.assigned.email } : {}
  };
  const setRole = patch => setDraft(Object.assign({}, draft, { role: Object.assign({}, draft.role, patch) }));
  const setField = patch => { setFields(Object.assign({}, fields, patch)); };
  const emailBad = fields.email && fields.email.indexOf('@') < 1;

  const details = <div>
    <div className="mm-two">
      <Field label="First name" id="f-first"><input id="f-first" value={fields.first_name} onChange={e => setField({ first_name: e.target.value })} autoComplete="off" /></Field>
      <Field label="Last name" id="f-last"><input id="f-last" value={fields.last_name} onChange={e => setField({ last_name: e.target.value })} autoComplete="off" /></Field>
    </div>
    <Field label="Email" hint="required before an invitation can be sent" id="f-email" error={emailBad ? 'Enter a full email address' : ''}><input id="f-email" type="email" inputMode="email" aria-invalid={emailBad ? 'true' : undefined} aria-describedby={emailBad ? 'f-email-err' : undefined} value={fields.email} disabled={cs.invitation !== 'draft' && cs.invitation !== 'revoked'} onChange={e => setField({ email: e.target.value })} autoComplete="off" /></Field>
    {cs.invitation !== 'draft' && cs.invitation !== 'revoked' ? <p className="mm-fine" style={{ marginTop: -8, marginBottom: 14 }}>The email is fixed while an invitation is live. Revoke the invitation to change it.</p> : null}
    <div className="mm-two">
      <Field label="Destination" id="f-dest"><select id="f-dest" value={draft.role.destination} onChange={e => setRole({ destination: e.target.value })}><option value="">To be confirmed</option><option>New Zealand</option><option>Australia</option></select></Field>
      <Field label="Location / region" id="f-region"><input id="f-region" value={draft.role.region} placeholder="e.g. Wellington" onChange={e => setRole({ region: e.target.value })} /></Field>
    </div>
    <div className="mm-two">
      <Field label="Profession" id="f-prof"><input id="f-prof" value={draft.role.profession} onChange={e => setRole({ profession: e.target.value })} /></Field>
      <Field label="Job title" id="f-title"><input id="f-title" value={draft.role.jobTitle} onChange={e => setRole({ jobTitle: e.target.value })} /></Field>
    </div>
    <div className="mm-two">
      <Field label="Employer" hint="leave as To be confirmed until it is" id="f-emp"><input id="f-emp" value={draft.role.employer} onChange={e => setRole({ employer: e.target.value })} /></Field>
      <Field label="Expected start date" hint="optional" id="f-start"><input id="f-start" type="date" value={draft.role.startDate || ''} onChange={e => setRole({ startDate: e.target.value || null })} /></Field>
    </div>
    <div className="mm-two">
      <Field label="Working pattern" id="f-pattern"><input id="f-pattern" value={draft.role.workingPattern} onChange={e => setRole({ workingPattern: e.target.value })} /></Field>
      <Field label="Assigned Ethicare contact" id="f-assigned"><select id="f-assigned" value={fields.assigned_staff_id} disabled={me.role !== 'admin'} onChange={e => setField({ assigned_staff_id: e.target.value })}>{staff.filter(s => s.active || s.id === fields.assigned_staff_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
    </div>
    <Field label="Confirmed relocation support" id="f-support"><textarea id="f-support" value={draft.role.relocationSupport} onChange={e => setRole({ relocationSupport: e.target.value })} /></Field>
    <Field label="Welcome message" hint="signed from the assigned contact" id="f-welcome"><textarea id="f-welcome" style={{ minHeight: 120 }} value={draft.welcome} onChange={e => setDraft(Object.assign({}, draft, { welcome: e.target.value }))} /></Field>
    <Field label="Vincere candidate id" hint="reserved for a future one-way sync; optional" id="f-vinc"><input id="f-vinc" value={fields.vincere_id} onChange={e => setField({ vincere_id: e.target.value })} /></Field>
  </div>;

  const preview = <div>
    <div className="mm-draftline"><Icon name="check" /> This is precisely what {fields.first_name || 'the candidate'} would see once published. Draft only — not yet visible to them.</div>
    <div className="mm-steps" style={{ marginBottom: 16 }}>{CAND_NAV.map(n => <button key={n.id} className={'mm-step' + (pv === n.id ? ' on' : '')} onClick={() => setPv(n.id)}><span className="n"><Icon name={n.icon} /></span>{n.label}</button>)}</div>
    <div style={{ border: '1px solid var(--mm-line)', borderRadius: 'var(--mm-r-lg)', padding: 20, background: 'var(--mm-cream)' }}>
      <CandidateBody view={pv} d={previewModel} actions={{ goto: setPv }} readOnly />
    </div>
  </div>;

  const bodies = {
    details,
    template: <TemplateStep draft={draft} templates={templates} progress={progress} onApply={(d, msg) => { setDraft(d); ping(msg); }} />,
    personalise: <Personalise cs={cs} draft={draft} setDraft={setDraft} progress={progress} arrangements={arrangements} onArrangement={onArrangement} previewModel={previewModel} toast={ping} />,
    preview,
    publish: <PublishStep cs={cs} draft={draft} dirty={dirty} me={me} onAction={act} busy={busy} notice={notice} />,
    notes: <div>
      <SharedNotes notes={notes} mineKind="staff" heading={'Updates with ' + (fields.first_name || 'the candidate')} onPost={async body => { const n = await SAPI.postStaffNote(caseId, body); setNotes(x => x.concat([n])); }} readOnly={cs.status === 'archived'} />
      {me.role === 'admin' && audit.length ? <div className="mm-card" style={{ marginTop: 24 }}><span className="mm-k">Access audit (latest 50)</span><div className="mm-audit">{audit.map(a => <div key={a.id}><b>{a.action}</b> · {a.actor_role || 'system'} · {fmtWhen(a.created_at)}</div>)}</div></div> : null}
    </div>
  };

  return <div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
      <button className="mm-btn ghost sm" onClick={onBack}>← All candidates</button>
      {invChip(cs)}
      {dirty && cs.published_at ? <span className="mm-inv sent">Unpublished edits</span> : cs.published_at ? <span className="mm-inv accepted">Published</span> : null}
      <SaveState state={saveState} onRetry={retryAll} />
      <span className="mm-cref" style={{ marginLeft: 'auto' }}>{cs.public_ref}</span>
    </div>
    {saveState === 'error' ? <Alert kind="err" onRetry={retryAll}>Your latest edits could not be saved. They are still on screen — retry, and don’t close this tab until you see “Saved”.</Alert> : null}
    <div className="mm-steps">{EDIT_STEPS.map((s, i) => <button key={s.id} className={'mm-step' + (step === s.id ? ' on' : (i < stepIdx ? ' done' : ''))} aria-current={step === s.id ? 'step' : undefined} onClick={() => setStep(s.id)}><span className="n">{i < stepIdx ? <Icon name="check" /> : i + 1}</span>{s.label}</button>)}</div>
    {bodies[step]}
    <div className="mm-pubbar">
      {stepIdx < EDIT_STEPS.length - 1 ? <button className="mm-btn pri" onClick={() => { setStep(EDIT_STEPS[stepIdx + 1].id); window.scrollTo(0, 0); }}>Next: {EDIT_STEPS[stepIdx + 1].label} →</button> : null}
      <span className="st">Edits save automatically and stay staff-only until you publish.</span>
      <SaveState state={saveState} onRetry={retryAll} />
    </div>
  </div>;
}

/* ---------- templates + team ---------- */
function TemplatesScreen({ templates }) {
  return <div><span className="mm-k">Templates</span><h2 className="mm-h2">Task & guide starting sets</h2>
    <p className="mm-lead">Reusable starting points applied when you create a candidate. Editing a master template never changes candidates already created from it — their tasks and progress are theirs.</p>
    <div className="mm-grid g2" style={{ marginTop: 14 }}>{templates.map(t =>
      <div className="mm-card" key={t.id}><span className="mm-k">{t.destination || 'Any destination'}</span><div className="mm-tplbtn tl">{t.label}</div><div className="mm-tplbtn tn">{(t.tasks || []).length} tasks · {(t.guides || []).length} guides</div>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 14, color: 'var(--mm-mut)', lineHeight: 1.6 }}>{(t.tasks || []).map(x => <li key={x.id}>{x.title}{x.staffControlled ? ' · staff-controlled' : ''}</li>)}</ul>
      </div>
    )}</div>
    <p className="mm-lead small" style={{ marginTop: 14 }}>Editing templates in the browser is a later release; today they are maintained in the database (see supabase/migrations).</p>
  </div>;
}

function TeamScreen({ staff, me, onReload, ping }) {
  const [form, setForm] = sUseState({ name: '', email: '', role: 'support' });
  const [busy, setBusy] = sUseState(false);
  const [err, setErr] = sUseState('');
  const change = async body => {
    setBusy(true); setErr('');
    try { await SAPI.fn('set-staff-role', body); ping('Team updated'); setForm({ name: '', email: '', role: 'support' }); await onReload(); }
    catch (e) { setErr(SAPI.friendly(e)); }
    setBusy(false);
  };
  return <div><span className="mm-k">Team & access</span><h2 className="mm-h2">Staff who can manage candidates</h2>
    <p className="mm-lead">Each colleague has their own account and two-factor sign-in, as an <b>admin</b> (all cases) or <b>support</b> (only cases assigned to them). Removing someone ends their sessions immediately.</p>
    {err ? <Alert kind="err" onDismiss={() => setErr('')}>{err}</Alert> : null}
    <div className="mm-grid g2" style={{ marginTop: 14 }}>{staff.map(s =>
      <div className="mm-card mm-staffcard" key={s.id}><Avatar name={s.name} small /><div style={{ minWidth: 0, flex: 1 }}><div className="n">{s.name}{s.id === me.id ? ' (you)' : ''}</div><div className="e">{s.email}</div><div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><span className="mm-owner eth">{s.role}</span>{s.active ? <span style={{ fontSize: 12, color: 'var(--mm-fern-text)' }}>2FA required</span> : <span className="mm-inv revoked">Access removed</span>}
        {me.role === 'admin' && s.id !== me.id ? <span className="mm-rowacts">
          <button className="mm-btn ghost sm" disabled={busy} onClick={() => change({ email: s.email, name: s.name, role: s.role === 'admin' ? 'support' : 'admin', active: s.active })}>Make {s.role === 'admin' ? 'support' : 'admin'}</button>
          {s.active ? <button className="mm-btn warn sm" disabled={busy} onClick={() => { if (confirm('Remove access for ' + s.name + '?')) change({ email: s.email, name: s.name, role: s.role, active: false }); }}>Remove access</button> : <button className="mm-btn sec sm" disabled={busy} onClick={() => change({ email: s.email, name: s.name, role: s.role, active: true })}>Restore</button>}
        </span> : null}</div></div></div>
    )}
    {me.role === 'admin' ? <div className="mm-card" style={{ borderStyle: 'dashed' }}>
      <span className="mm-k">Invite a colleague</span>
      <Field label="Name" id="t-name"><input id="t-name" value={form.name} onChange={e => setForm(Object.assign({}, form, { name: e.target.value }))} /></Field>
      <Field label="Work email" id="t-email"><input id="t-email" type="email" inputMode="email" value={form.email} onChange={e => setForm(Object.assign({}, form, { email: e.target.value }))} /></Field>
      <Field label="Role" id="t-role"><select id="t-role" value={form.role} onChange={e => setForm(Object.assign({}, form, { role: e.target.value }))}><option value="support">Support — assigned cases only</option><option value="admin">Admin — all cases, team and templates</option></select></Field>
      <button className="mm-btn pri" disabled={busy || !form.name.trim() || form.email.indexOf('@') < 1} onClick={() => change(form)}>{busy ? 'Sending…' : 'Send invitation'}</button>
      <p className="mm-fine">They receive a sign-in link, set a password and an authenticator app before they can see any case.</p>
    </div> : null}</div>
    <div className="mm-card tint" style={{ marginTop: 16 }}><span className="mm-k">Vincere</span><p style={{ margin: '6px 0 0', maxWidth: '64ch' }}>Not connected. When Ethicare starts using Vincere, each case can be linked to its Vincere candidate record (a one-way sync of the confirmed role, destination and dates) so there is one source of truth. The join key is already reserved on every case.</p></div>
  </div>;
}

/* ---------- staff app ---------- */
function StaffApp({ me, onSignOut }) {
  const [view, setView] = sUseState('list');
  const [openId, setOpenId] = sUseState(null);
  const [cases, setCases] = sUseState([]);
  const [staff, setStaff] = sUseState([]);
  const [templates, setTemplates] = sUseState([]);
  const [loading, setLoading] = sUseState(true);
  const [err, setErr] = sUseState('');
  const [toast, ping] = useToast();

  const reload = async () => {
    setErr('');
    try {
      const r = await Promise.all([SAPI.listCases(), SAPI.listStaff(), SAPI.listTemplates()]);
      setCases(r[0]); setStaff(r[1]); setTemplates(r[2]);
    } catch (e) { setErr(SAPI.friendly(e)); }
    setLoading(false);
  };
  sUseEffect(() => { reload(); }, []);

  const addCandidate = async () => {
    try { const cs = await SAPI.createCase(me.id, MMD.emptyDraft()); ping('Draft candidate created'); await reload(); setOpenId(cs.id); }
    catch (e) { setErr(SAPI.friendly(e)); }
  };
  const openCase = cases.find(c => c.id === openId);
  const active = cases.filter(c => c.status === 'active').length;
  const drafts = cases.filter(c => c.invitation === 'draft' && c.status !== 'archived').length;
  const header = <div className="tt">
    <span className="mm-eyebrow"><i></i>Manage candidates</span>
    <h1>{view === 'list' && openId ? ((openCase ? (openCase.first_name + ' ' + openCase.last_name).trim() : '') || 'Candidate') : view === 'list' ? 'Candidates' : view === 'templates' ? 'Templates' : 'Team & access'}</h1>
    <div className="sub">{cases.filter(c => c.status !== 'archived').length} cases · {active} active · {drafts} draft</div>
  </div>;
  const nav = STAFF_NAV.map(n => n.id === 'list' ? Object.assign({}, n, { badge: cases.filter(c => c.status !== 'archived').length }) : n);
  const go = v => { setOpenId(null); setView(v); window.scrollTo(0, 0); };
  return <Shell nav={nav} view={view} onNav={go} brandSub="Staff · admin" header={header} footWho={{ name: me.name, role: 'Signed in · ' + me.role, extra: <a href="/my-move/help" target="_blank" rel="noopener">How to use My Move</a> }} onSignOut={onSignOut}>
    {view === 'list' && !openId ? <CaseList cases={cases} me={me} loading={loading} error={err} onReload={reload} onOpen={id => { setOpenId(id); window.scrollTo(0, 0); }} onAdd={addCandidate} /> : null}
    {view === 'list' && openId ? <CaseEditor key={openId} caseId={openId} me={me} staff={staff} templates={templates} onBack={() => setOpenId(null)} onChanged={reload} ping={ping} /> : null}
    {view === 'templates' ? <TemplatesScreen templates={templates} /> : null}
    {view === 'team' ? <TeamScreen staff={staff} me={me} onReload={reload} ping={ping} /> : null}
    <Toast msg={toast} />
  </Shell>;
}

Object.assign(window, { StaffApp });
