/* My Move — the candidate experience. Reads the published snapshot (my_case)
   plus the candidate's own rows (progress, arrangements, notes). Never the draft.
   Also renders the staff preview (readOnly) from a draft-shaped object. */
const { useState: cUseState, useEffect: cUseEffect } = React;
const API = window.MMAPI;

const CAND_NAV = [
  { id: 'home', label: 'Home', short: 'Home', icon: 'home' },
  { id: 'role', label: 'My role', short: 'Role', icon: 'role' },
  { id: 'reg', label: 'Registration & visa', short: 'Reg & visa', icon: 'reg' },
  { id: 'travel', label: 'Travel & accommodation', short: 'Travel', icon: 'travel' },
  { id: 'settle', label: 'Preparing & settling in', short: 'Settling', icon: 'settle' },
  { id: 'guides', label: 'My guides', short: 'Guides', icon: 'guides' },
  { id: 'notes', label: 'Shared notes', short: 'Notes', icon: 'notes' }
];

function RoleLine({ label, value }) {
  const t = tbc(value);
  return <div><div className="sl">{label}</div><div className={'sv' + (t ? ' tbc' : '')}>{t ? 'To be confirmed' : value}</div></div>;
}

/* One arrangement (flight, accommodation, car…). The candidate edits these;
   a failed save keeps what they typed and offers a retry. */
function ArrangementCard({ a, onSave, onDelete, readOnly, staffMode }) {
  const [edit, setEdit] = cUseState(!a.id && !readOnly);
  const [form, setForm] = cUseState({ type: a.type || 'other', label: a.label || '', detail: a.detail || '', state: a.state || 'planned', editable_by: a.editable_by || 'candidate' });
  const [busy, setBusy] = cUseState(false);
  const [err, setErr] = cUseState('');
  const canEdit = !readOnly && (staffMode || a.editable_by !== 'staff');
  const save = async (patch) => {
    setBusy(true); setErr('');
    try { await onSave(Object.assign({}, a, form, patch || {})); setEdit(false); }
    catch (e) { setErr(API.friendly(e)); }
    setBusy(false);
  };
  if (edit) return <div className="mm-card mm-arr">
    <div className="mm-two">
      <div className="mm-field"><label htmlFor={'al' + (a.id || 'new')}>What</label><input id={'al' + (a.id || 'new')} value={form.label} placeholder="e.g. One-way flight to Perth" onChange={e => setForm(Object.assign({}, form, { label: e.target.value }))} /></div>
      <div className="mm-field"><label htmlFor={'at' + (a.id || 'new')}>Type</label><select id={'at' + (a.id || 'new')} value={form.type} onChange={e => setForm(Object.assign({}, form, { type: e.target.value }))}>{Object.keys(MMD.ARR_TYPES).map(k => <option key={k} value={k}>{MMD.ARR_TYPES[k]}</option>)}</select></div>
    </div>
    <div className="mm-field"><label htmlFor={'ad' + (a.id || 'new')}>Details <span className="hint">— dates, booking reference, where you are up to</span></label><textarea id={'ad' + (a.id || 'new')} value={form.detail} onChange={e => setForm(Object.assign({}, form, { detail: e.target.value }))} /></div>
    <div className="mm-field"><label htmlFor={'as' + (a.id || 'new')}>Status</label><select id={'as' + (a.id || 'new')} value={form.state} onChange={e => setForm(Object.assign({}, form, { state: e.target.value }))}>{Object.keys(MMD.ARR_STATE).map(k => <option key={k} value={k}>{MMD.ARR_STATE[k]}</option>)}</select></div>
    {staffMode ? <label className="mm-chk"><input type="checkbox" checked={form.editable_by === 'candidate'} onChange={e => setForm(Object.assign({}, form, { editable_by: e.target.checked ? 'candidate' : 'staff' }))} /> The candidate can update this themselves</label> : null}
    {err ? <Alert kind="err" onRetry={() => save()}>{err} Your details are still here.</Alert> : null}
    <div className="mm-rowacts">
      <button className="mm-btn pri sm" disabled={busy || !form.label.trim()} onClick={() => save()}>{busy ? 'Saving…' : 'Save'}</button>
      <button className="mm-btn ghost sm" disabled={busy} onClick={() => { if (a.id) setEdit(false); else onDelete(a); }}>Cancel</button>
    </div>
  </div>;
  return <div className="mm-card mm-arr">
    <div className="ah"><div className="al">{a.label || MMD.ARR_TYPES[a.type] || 'Arrangement'}</div><ArrState state={a.state} /></div>
    {a.detail ? <p className="ad">{a.detail}</p> : <p className="ad">No details yet.</p>}
    {canEdit ? <div className="row">
      <label>Update status
        <select className={'mm-sel' + (busy ? ' saving' : '')} style={{ display: 'block', marginTop: 5 }} value={form.state} disabled={busy} onChange={e => { const s = e.target.value; setForm(Object.assign({}, form, { state: s })); save({ state: s }); }}>
          {Object.keys(MMD.ARR_STATE).map(k => <option key={k} value={k}>{MMD.ARR_STATE[k]}</option>)}
        </select>
      </label>
      <button className="mm-btn ghost sm" onClick={() => setEdit(true)}>Edit details</button>
      <button className="mm-btn ghost sm" onClick={() => { if (confirm('Remove “' + (a.label || 'this arrangement') + '”?')) onDelete(a); }}>Remove</button>
    </div> : a.editable_by === 'staff' ? <div className="mm-fine">Maintained by Ethicare.</div> : null}
    {staffMode && a.editable_by === 'staff' ? <div className="mm-fine">Ethicare-maintained (read-only for the candidate).</div> : null}
    {err ? <Alert kind="err" onRetry={() => save()}>{err}</Alert> : null}
  </div>;
}

function SharedNotes({ notes, mineKind, onPost, readOnly, heading }) {
  const [text, setText] = cUseState('');
  const [busy, setBusy] = cUseState(false);
  const [err, setErr] = cUseState('');
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true); setErr('');
    try { await onPost(text.trim()); setText(''); } catch (e) { setErr(API.friendly(e)); }
    setBusy(false);
  };
  return <div>
    <span className="mm-k">Shared notes</span><h2 className="mm-h2">{heading || 'Updates on your move'}</h2>
    <div className="mm-notevis"><Icon name="notes" /><span>Visible to you and the Ethicare staff supporting your move. A practical record of updates — not a private journal, and not the place for sensitive medical, financial or identity detail.</span></div>
    <div className="mm-notes" style={{ marginTop: 16 }}>
      {notes && notes.length ? notes.map(n =>
        <div className={'mm-note' + (n.author_kind === mineKind ? ' mine' : '')} key={n.id}>
          <div className="nh"><b>{n.author_name}</b><span>{fmtWhen(n.created_at)}</span></div>
          <p>{n.body}</p>
        </div>
      ) : <div className="mm-empty">No notes yet.</div>}
      {readOnly ? null : <div>
        {err ? <Alert kind="err" onRetry={send}>{err} Your note is still in the box below.</Alert> : null}
        <div className="mm-composer">
          <textarea value={text} maxLength="4000" placeholder="Add an update…" aria-label="Add a note" onChange={e => setText(e.target.value)} />
          <button className="mm-btn pri" onClick={send} disabled={busy || !text.trim()}>{busy ? 'Posting…' : 'Post'}</button>
        </div>
      </div>}
    </div>
  </div>;
}

/* The body of every candidate tab. `d` is the merged view model:
   { firstName, lastName, role, welcome, nextActions, tasks, guides, arrangements, notes, contact } */
function CandidateBody({ view, d, actions, savingKeys, readOnly }) {
  const r = d.role || {};
  const prog = progressOf(d.tasks);
  const place = r.region || r.destination;
  const contact = d.contact || {};
  const firstName = contact.name ? contact.name.split(' ')[0] : 'Ethicare';

  if (view === 'home') return <div className="mm-grid" style={{ gap: 20 }}>
    <div className="mm-welcome">
      <span className="mm-k">Your My Move space</span>
      <h2>Welcome{d.firstName ? ', ' + d.firstName : ''}</h2>
      <div className="dest">{place ? 'Your move to ' + place : 'Your move — destination to be confirmed'}</div>
      <p className="msg">{d.welcome}</p>
      <div className="sig">{firstName} and the Ethicare team</div>
    </div>

    {d.nextActions.length ? <div className="mm-card tealtop">
      <span className="mm-k">Your next steps</span>
      <div className="mm-grid g3" style={{ marginTop: 14 }}>{d.nextActions.map(a =>
        <div key={a.id} className="mm-next">
          <div className="t">{a.title}</div>
          <div className="m"><Owner owner={a.owner} />{a.due ? <span>by {fmtDate(a.due)}</span> : null}</div>
        </div>
      )}</div>
    </div> : null}

    <div className="mm-card">
      <span className="mm-k">Your move at a glance</span>
      <div className="mm-summ">
        <RoleLine label="Profession" value={r.profession} />
        <RoleLine label="Role" value={r.jobTitle} />
        <RoleLine label="Destination" value={place} />
        <RoleLine label="Start date" value={r.startDate ? fmtDate(r.startDate) : null} />
      </div>
      <hr className="mm-hr" />
      <span className="mm-k">Progress</span>
      <div className="mm-prog"><div className="bar" role="img" aria-label={prog.done + ' of ' + prog.total + ' steps complete'}><span style={{ width: prog.pct + '%' }}></span></div><span className="pl">{prog.done} of {prog.total} steps</span></div>
      <p className="mm-lead small" style={{ marginTop: 8 }}>A running count of the steps that apply to your move. It isn’t a readiness score or a guaranteed arrival date — just where things stand.</p>
    </div>

    <div className="mm-contact">
      <Avatar name={contact.name || 'Ethicare'} />
      <div><div className="cn">{contact.name || 'Ethicare'}</div><div className="cr">Your Ethicare contact</div></div>
      <div className="cact">
        {contact.email ? <a className="mm-btn sec sm" href={'mailto:' + contact.email}><Icon name="mail" /> Message {firstName}</a> : null}
        <button className="mm-btn ghost sm" onClick={() => actions.goto('notes')}>Open shared notes</button>
      </div>
    </div>
  </div>;

  if (view === 'role') return <div className="mm-grid" style={{ gap: 18 }}>
    <div><span className="mm-k">My role</span><h2 className="mm-h2">The job you’ve accepted</h2><p className="mm-lead">Maintained by your Ethicare contact. Anything still being confirmed is marked, and we’ll fill it in as it comes through.</p></div>
    <div className="mm-card"><div className="mm-summ" style={{ marginTop: 0 }}>
      <RoleLine label="Profession" value={r.profession} />
      <RoleLine label="Job title" value={r.jobTitle} />
      <RoleLine label="Employer" value={r.employer} />
      <RoleLine label="Destination" value={r.destination} />
      <RoleLine label="Location" value={r.region} />
      <RoleLine label="Working pattern" value={r.workingPattern} />
      <RoleLine label="Start date" value={r.startDate ? fmtDate(r.startDate) : null} />
    </div>
    <hr className="mm-hr" />
    <span className="mm-k">Relocation support</span>
    <p style={{ margin: '6px 0 0', maxWidth: '62ch', whiteSpace: 'pre-line' }}>{tbc(r.relocationSupport) ? 'To be confirmed' : r.relocationSupport}</p>
    </div>
  </div>;

  if (view === 'reg') return <div>
    <span className="mm-k">Registration & visa steps</span><h2 className="mm-h2">Getting you licensed and cleared to work</h2>
    <p className="mm-lead">These explain the administrative steps and link to the official bodies. We keep your file moving; the regulator and immigration authority make the decisions. A step you mark yourself shows as self-reported until it is verified.</p>
    <div style={{ marginTop: 8 }}><PhaseList id="registration" tasks={d.tasks} onStatus={actions.setTaskStatus} savingKeys={savingKeys} readOnly={readOnly} /></div>
  </div>;

  if (view === 'travel') return <div>
    <span className="mm-k">Travel & accommodation</span><h2 className="mm-h2">Getting there and the first fortnight</h2>
    <p className="mm-lead">Your own arrangements — update these as you plan and book. Mark each as planned, booked or awaiting confirmation.</p>
    <div className="mm-grid g2" style={{ marginTop: 12 }}>
      {d.arrangements.map(a => <ArrangementCard key={a.id || a._tmp} a={a} readOnly={readOnly} onSave={actions.saveArrangement} onDelete={actions.deleteArrangement} />)}
      {!d.arrangements.length && readOnly ? <div className="mm-empty">No arrangements yet.</div> : null}
    </div>
    {readOnly ? null : <div style={{ marginTop: 12 }}><button className="mm-btn sec sm" onClick={actions.addArrangement}><Icon name="add" /> Add an arrangement</button></div>}
    <div className="mm-section"><PhaseList id="travel" tasks={d.tasks} onStatus={actions.setTaskStatus} savingKeys={savingKeys} readOnly={readOnly} /></div>
  </div>;

  if (view === 'settle') return <div>
    <span className="mm-k">Preparing & settling in</span><h2 className="mm-h2">Landing well in your first month</h2>
    <p className="mm-lead">The practical first steps once you arrive. Your guides carry the local detail{place ? ' for ' + place : ''}.</p>
    <div style={{ marginTop: 8 }}><PhaseList id="settle" tasks={d.tasks} onStatus={actions.setTaskStatus} savingKeys={savingKeys} readOnly={readOnly} /></div>
  </div>;

  if (view === 'guides') {
    const list = (d.guides || []).map(gid => MMD.guides[gid] ? Object.assign({ id: gid }, MMD.guides[gid]) : null).filter(Boolean);
    return <div>
      <span className="mm-k">My guides</span><h2 className="mm-h2">Chosen for your move</h2>
      <p className="mm-lead">A short list your Ethicare contact selected for {tbc(r.profession) ? 'your profession' : r.profession} moving to {place || 'your destination'}. It grows as you get closer.</p>
      {list.length ? <div className="mm-grid g2" style={{ marginTop: 14 }}>{list.map(g =>
        <a className="mm-gcard" key={g.id} href={g.url}>
          <span className="gi"><Icon name="guides" /></span>
          <span><h4>{g.title}</h4><div className="gn">{g.topic}</div></span>
        </a>
      )}</div> : <div className="mm-empty" style={{ marginTop: 14 }}>No guides selected yet.</div>}
    </div>;
  }

  if (view === 'notes') return <SharedNotes notes={d.notes} mineKind="candidate" onPost={actions.postNote} readOnly={readOnly} />;
  return null;
}

/* Build the view model for a real candidate (from my_case + own rows). */
function candidateModel(cs) {
  const pub = overlayProgress(cs.published, cs.progress);
  return {
    firstName: cs.first_name, lastName: cs.last_name,
    role: pub.role, welcome: pub.welcome, nextActions: pub.nextActions, tasks: pub.tasks, guides: pub.guides,
    arrangements: cs.arrangements || [], notes: cs.notes || [],
    contact: { name: cs.contact_name, email: cs.contact_email },
    caseId: cs.id, publishedAt: cs.published_at
  };
}

function CandidateApp({ onSignOut }) {
  const [view, setView] = cUseState((location.hash.replace('#', '') || 'home'));
  const [cs, setCs] = cUseState(null);
  const [state, setState] = cUseState('loading');   // loading | ready | empty | error
  const [err, setErr] = cUseState('');
  const [savingKeys, setSaving] = cUseState({});
  const [failed, setFailed] = cUseState(null);        // { message, retry }
  const [toast, ping] = useToast();

  const load = async () => {
    setState('loading'); setErr('');
    try {
      const data = await API.loadCandidate();
      if (!data) { setState('empty'); return; }
      if (!data.published) { setCs(data); setState('preparing'); return; }
      setCs(data); setState('ready');
    } catch (e) { setErr(API.friendly(e)); setState('error'); }
  };
  cUseEffect(() => { load(); }, []);
  cUseEffect(() => {
    const onHash = () => setView(location.hash.replace('#', '') || 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const goto = v => { location.hash = v; setView(v); window.scrollTo(0, 0); const m = document.getElementById('main-content'); if (m) m.focus({ preventScroll: true }); };

  const actions = {
    goto,
    setTaskStatus: async (key, status) => {
      /* optimistic; on failure the chosen value stays and a retry is offered */
      const prev = cs.progress;
      const next = prev.filter(p => p.task_key !== key).concat([{ case_id: cs.id, task_key: key, status, updated_at: new Date().toISOString() }]);
      setCs(Object.assign({}, cs, { progress: next }));
      setSaving(s => Object.assign({}, s, { [key]: true }));
      try {
        await API.saveTaskStatus(cs.id, key, status);
        setFailed(null);
      } catch (e) {
        setFailed({ message: API.friendly(e), retry: () => actions.setTaskStatus(key, status) });
      }
      setSaving(s => { const c = Object.assign({}, s); delete c[key]; return c; });
    },
    saveArrangement: async (row) => {
      const saved = await API.saveArrangement(Object.assign({}, row, { case_id: cs.id }));
      setCs(c => Object.assign({}, c, { arrangements: c.arrangements.filter(a => a.id !== saved.id && a._tmp !== row._tmp).concat([saved]) }));
      ping('Saved');
    },
    deleteArrangement: async (row) => {
      if (row.id) { try { await API.deleteArrangement(row.id); } catch (e) { setFailed({ message: API.friendly(e), retry: () => actions.deleteArrangement(row) }); return; } }
      setCs(c => Object.assign({}, c, { arrangements: c.arrangements.filter(a => a !== row && (!row.id || a.id !== row.id)) }));
    },
    addArrangement: () => setCs(c => Object.assign({}, c, { arrangements: c.arrangements.concat([{ _tmp: MMD.uid('a'), case_id: c.id, type: 'other', label: '', detail: '', state: 'planned', editable_by: 'candidate' }]) })),
    postNote: async (body) => {
      const n = await API.postNote(cs.id, body);
      setCs(c => Object.assign({}, c, { notes: c.notes.concat([n]) }));
    }
  };

  const who = cs ? { name: (cs.first_name + ' ' + cs.last_name).trim() || 'Candidate', role: 'Signed in as candidate', extra: <a href="/how-we-use-your-information">Your information</a> } : null;
  const contactFirst = cs && cs.contact_name ? cs.contact_name.split(' ')[0] : 'Ethicare';
  const header = <React.Fragment>
    <div className="tt">
      <span className="mm-eyebrow"><i></i>My Move</span>
      <h1>{cs && cs.first_name ? cs.first_name + '’s move' : 'Your move'}</h1>
      <div className="sub">{state === 'ready' ? [cs.published.role && cs.published.role.profession, cs.published.role && (cs.published.role.region || cs.published.role.destination)].filter(v => !tbc(v)).join(' · ') || 'Details to be confirmed' : 'Being prepared'}</div>
    </div>
    {cs && cs.contact_email ? <div className="actions"><a className="mm-btn sec sm" href={'mailto:' + cs.contact_email}><Icon name="mail" /> {contactFirst}</a></div> : null}
  </React.Fragment>;

  let body;
  if (state === 'loading') body = <Loading label="Opening your space…" />;
  else if (state === 'error') body = <Alert kind="err" onRetry={load}>{err}</Alert>;
  else if (state === 'empty') body = <div className="mm-empty">There isn’t a My Move space for this account yet. If you were expecting one, contact your Ethicare consultant.</div>;
  else if (state === 'preparing') body = <div className="mm-empty">Your space is being prepared. You’ll get an email when it’s ready.</div>;
  else body = <React.Fragment>
    {failed ? <Alert kind="err" onRetry={failed.retry} onDismiss={() => setFailed(null)}>{failed.message} Your change is kept on screen but not saved yet.</Alert> : null}
    <CandidateBody view={view} d={candidateModel(cs)} actions={actions} savingKeys={savingKeys} />
  </React.Fragment>;

  return <Shell nav={CAND_NAV} view={view} onNav={goto} brandSub="My Move" header={header} footWho={who} onSignOut={onSignOut}>
    {body}
    <Toast msg={toast} />
  </Shell>;
}

Object.assign(window, { CAND_NAV, CandidateBody, SharedNotes, ArrangementCard, candidateModel, CandidateApp });
