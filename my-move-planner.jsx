/* My Move — the personal dashboard inside Ethicare Move. Depends on my-move-model.js (window.MM).
   Prototype only: no backend. Everything is on-device; the account step is simulated so the flow
   and consent architecture can be agreed first.

   Storage keys across the three features — do not confuse them:
     ethicare_mymove_v2  — THIS dashboard
     ethicare_portal_v1  — the Ethicare Move plan captured on /move (read-only here, see fromPlan)
     ethicare_myfile_v1  — saved pages, read state and notes (mymove.js), a separate feature

   Onboarding lives on /move and is NOT repeated here. */
const { V, TASKS, CONSENT, taskLink, taskResources } = window.MM;
const KEY2 = 'ethicare_mymove_v2';
const PLAN_KEY = 'ethicare_portal_v1'; /* the ONE onboarding, captured on /move. Never re-ask here. */

/* Bridge: /move owns the questions, this page owns the dashboard. Map its five-plus-three
   answers onto the store shape so nobody is asked the same thing twice. Labels are already
   the window.MM.V strings, so most fields copy straight across. */
const DEST = { nz: 'nz', au: 'au', both: 'both' };
/* Operator preview: /move?demo= publishes a sample plan on window and this view must read
   THAT rather than the browser's real one, or the harness shows the person looking their own
   candidate state. See the demo block in move.js. */
const DEMO = () => window.ETHICARE_MOVE_DEMO || null;
function fromPlan() {
  let p = DEMO();
  if (!p) { try { p = JSON.parse(localStorage.getItem(PLAN_KEY)); } catch (e) { return null; } }
  if (!p || !p.set) return null;
  const profLabel = (window.ETHICARE_PROFESSIONS && window.ETHICARE_PROFESSIONS.forCountry
    ? (window.ETHICARE_PROFESSIONS.forCountry(p.profession, p.dest) || {}).label
    : null) || p.profession || '';
  return {
    destination: DEST[p.dest] || 'nz',
    profession: profLabel,
    currentCountry: p.origin || '',
    period: p.period || '',
    party: p.party || '',
    stage: p.stage || '',
    regStatus: p.regStatus || ''
  };
}

const blank = () => ({
  move: { destination: '', profession: '', currentCountry: '', period: '', party: '', stage: '', regions: [] },
  pro: { years: '', specialty: '', regStatus: '', regUnderway: null },
  account: null,
  consent: {},
  tasks: {}, costs: [], allowance: { amount: '', expires: '', rules: '' }, saved: [], docs: [],
  asked: [], seeded: false, updated: null
});
const loadStore = () => {
  let s;
  if (DEMO()) { s = blank(); }
  else { try { s = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY2)) || {}); } catch (e) { s = blank(); } }
  /* Registration progress is one of the seven setup answers, so the registration tasks
     must reflect it. Telling someone who answered "Registered" to "Confirm your
     registration route" is the plan disagreeing with itself in the reader's own words. */
  const REG_DONE = {
    'Application submitted': ['reg-route', 'reg-docs'],
    'Assessment underway': ['reg-route', 'reg-docs', 'reg-apply'],
    'Exam required': ['reg-route', 'reg-docs', 'reg-apply'],
    'Registered': ['reg-route', 'reg-docs', 'reg-apply']
  };
  const p = fromPlan();
  if (p) {
    /* /move owns onboarding, so its answers WIN — they are not merely a fallback. Filling
       blanks only was wrong: a stale copy in this store then outranked the live plan, and
       the two views of the same page disagreed on every field (nursing vs Sonographer,
       Registered vs not started). This store keeps tasks, costs and documents; it does not
       keep its own opinion of who the reader is. Vocabularies are identical by construction
       — move.js REG/PARTY/PERIOD are the same string arrays as window.MM.V — and profession
       is the one mapping, key to label, resolved in fromPlan via ETHICARE_PROFESSIONS. */
    ['destination', 'profession', 'currentCountry', 'period', 'party', 'stage'].forEach(k => {
      if (p[k]) s.move[k] = p[k];
    });
    if (p.regStatus) s.pro.regStatus = p.regStatus;
    /* Seeded once, and only onto tasks the reader has not touched, so ticking one back
       open on this page is not overwritten on the next load. */
    (REG_DONE[s.pro.regStatus] || []).forEach(id => {
      if (!s.tasks[id]) s.tasks[id] = { status: 'done', from: 'setup' };
    });
  }
  return s;
};
const saveStore = s => {
  if (DEMO()) return; /* a preview that writes is not a preview */
  try { s.updated = Date.now(); localStorage.setItem(KEY2, JSON.stringify(s)); } catch (e) {}
};
const cur = s => (V.destination.find(d => d.id === s.move.destination) || V.destination[0]).cur;
const money = (n, c) => c + Number(n || 0).toLocaleString('en-NZ');
const uid = () => Math.random().toString(36).slice(2, 9);
const EXAMPLES = [
  { section: 'admin', category: 'Registration', label: 'Board registration fee', estimate: 922, actual: 922, funding: 'reimbursable', receipt: 'mrtb-receipt.pdf' },
  { section: 'admin', category: 'Visa', label: 'Visa — two adults, one child', estimate: 1900, actual: 1870, funding: 'self', receipt: '' },
  { section: 'travel', category: 'Flights', label: 'One-way flights × 3', estimate: 4200, actual: 3980, funding: 'employer', receipt: 'flight-confirmation.pdf' },
  { section: 'travel', category: 'Shipping & baggage', label: 'Part-container, door to door', estimate: 3400, actual: '', funding: 'reimbursable', receipt: '' },
  { section: 'home', category: 'Temporary accommodation', label: 'Three weeks, serviced apartment', estimate: 2600, actual: '', funding: 'self', receipt: '' }
];

/* ---------- small shared bits ---------- */
function Chips({ options, value, onChange, multi }) {
  const arr = multi ? (value || []) : [value];
  return <div className="mv-chips">{options.map(o => {
    const label = o.label || o, id = o.id || o, on = arr.indexOf(id) > -1;
    return <button key={id} type="button" className={'mv-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => {
      if (!multi) return onChange(on ? '' : id);
      const next = on ? arr.filter(x => x !== id) : arr.concat([id]);
      onChange(next);
    }}>{label}</button>;
  })}</div>;
}
function Q({ label, hint, children }) {
  return <div className="mv-q"><span className="mv-ql">{label}</span>{hint ? <span className="mv-qh">{hint}</span> : null}{children}</div>;
}
function Fig({ k, v, tone }) {
  return <div className={'mv-fig' + (tone ? ' ' + tone : '')}><span className="k">{k}</span><span className="v">{v}</span></div>;
}

/* ---------- 1. onboarding: answers before any account ---------- */
function Intro({ store, set, done }) {
  const m = store.move, upd = (k, v) => set(s => { s.move[k] = v; return s; });
  const ready = m.destination && m.profession && m.period;
  return <div className="mv-wrap narrow">
    <span className="eyebrow">Step 1 of 2 · about two minutes</span>
    <h1>Tell us about your move</h1>
    <p className="mv-lead">Six answers and we can build your plan. No account needed to see it — you only need one if you want it saved.</p>
    <Q label="Where are you considering?"><Chips options={V.destination} value={m.destination} onChange={v => upd('destination', v)} /></Q>
    <Q label="What is your profession?">
      <select className="mv-in" value={m.profession} autoComplete="organization-title" onChange={e => upd('profession', e.target.value)}>
        <option value="">Choose your profession</option>{V.profession.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </Q>
    <Q label="Where are you currently based?">
      <input className="mv-in" type="text" autoComplete="country-name" placeholder="Country you work in now" value={m.currentCountry} onChange={e => upd('currentCountry', e.target.value)} />
    </Q>
    <Q label="When are you hoping to move?"><Chips options={V.period} value={m.period} onChange={v => upd('period', v)} /></Q>
    <Q label="Who are you moving with?"><Chips options={V.party} value={m.party} onChange={v => upd('party', v)} /></Q>
    <Q label="What stage are you at?"><Chips options={V.stage} value={m.stage} onChange={v => upd('stage', v)} /></Q>
    <div className="mv-actions">
      <button className="btn btn-primary" disabled={!ready} onClick={done}>Build my plan</button>
      <span className="mv-note">{ready ? 'Nothing is sent to us at this point.' : 'Destination, profession and timing are all we really need.'}</span>
    </div>
  </div>;
}

/* ---------- 2. the plan, shown in full before the account ask ---------- */
function Plan({ store, set, go }) {
  const m = store.move, c = cur(store), family = m.party === 'With children' || m.party === 'Partner and children';
  const mine = TASKS.filter(t => family || t.section !== 'family');
  const first = mine.slice(0, 4);
  const est = 12500 + (family ? 4200 : 0);
  return <div className="mv-wrap">
    <span className="eyebrow">Your plan</span>
    <h1>Your Move Plan is ready</h1>
    <p className="mv-lead">Built from your six answers: {m.profession || 'your profession'}, {(V.destination.find(d => d.id === m.destination) || {}).label}, moving {String(m.period).toLowerCase()}{family ? ', with children' : ''}. Read it all now — the account is only so it’s still here tomorrow.</p>
    <div className="mv-grid three">
      <div className="mv-card"><span className="k">What to do first</span><h3>{first.length} tasks, in order</h3><ul className="mv-ul">{first.map(t => <li key={t.id}>{t.title}</li>)}</ul><a className="mv-go" href="#" onClick={e => { e.preventDefault(); go('account'); }}>See all {mine.length} tasks &rarr;</a></div>
      <div className="mv-card"><span className="k">What it could cost</span><h3>Around {money(est, c)}</h3><p className="mv-p">An indicative total for a move like yours — registration, visas, flights, shipping and the first few weeks. Your employer may cover part of it.</p><a className="mv-go" href="/cost-calculator">Cost calculator &rarr;</a></div>
      <div className="mv-card"><span className="k">Your registration route</span><h3>Assessed individually</h3><p className="mv-p">Your regulator assesses your qualification and recent practice. It is the task everything else is sequenced off.</p><a className="mv-go" href="/pathway-checker">Check my pathway &rarr;</a></div>
    </div>
    <div className="mv-tl">
      <span className="k">Roughly how it sequences</span>
      <ol>{['Decide', 'Register', 'Find the role', 'Visa', 'Move', 'Settle'].map((s, i) => <li key={s}><span className="n">{i + 1}</span>{s}</li>)}</ol>
    </div>
    <div className="mv-save">
      <div><span className="k">Keep this plan</span><h3>Save it to a free Ethicare account</h3><p className="mv-p">One email, no password. Your plan, costs and progress stay in one place — and we never ask you for the same thing twice.</p></div>
      <div className="mv-saveacts">
        <button className="btn btn-primary" onClick={() => go('account')}>Save my plan</button>
        <button className="btn btn-secondary" onClick={() => go('dash')}>Carry on without saving</button>
      </div>
    </div>
  </div>;
}

/* ---------- 3. account + consent ---------- */
function Account({ store, set, go }) {
  const [f, setF] = React.useState({ first: '', last: '', email: '' });
  const [jobs, setJobs] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const ok = f.first && f.email.indexOf('@') > 0;
  const finish = () => {
    set(s => {
      s.account = { first: f.first, last: f.last, email: f.email, created: Date.now(), method: 'magic-link' };
      if (jobs) s.consent.jobs = { granted: true, at: Date.now(), source: 'Move Planner — account step', version: CONSENT.jobs.version, wording: CONSENT.jobs.label };
      return s;
    });
    go('dash');
  };
  if (sent) return <div className="mv-wrap narrow">
    <span className="eyebrow">Almost there</span><h1>Check your email</h1>
    <p className="mv-lead">We’ve sent a sign-in link to <strong>{f.email}</strong>. Clicking it opens your plan — no password to remember, nothing to reset later.</p>
    <div className="mv-actions"><button className="btn btn-primary" onClick={finish}>I’ve clicked the link <span className="mv-proto">prototype</span></button></div>
  </div>;
  return <div className="mv-wrap narrow">
    <span className="eyebrow">Step 2 of 2</span>
    <h1>Create your free account</h1>
    <p className="mv-lead">So your plan, your costs and your progress are here next time. Three fields.</p>
    <div className="mv-two">
      <Q label="First name"><input className="mv-in" type="text" autoComplete="given-name" value={f.first} onChange={e => setF({ ...f, first: e.target.value })} /></Q>
      <Q label="Last name"><input className="mv-in" type="text" autoComplete="family-name" value={f.last} onChange={e => setF({ ...f, last: e.target.value })} /></Q>
    </div>
    <Q label="Email" hint="We send a one-time sign-in link rather than asking you to invent a password."><input className="mv-in" type="email" autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Q>
    <div className="mv-consent">
      <h2>Would you like us to contact you if we find a role that could suit you?</h2>
      <p className="mv-p">{CONSENT.jobs.body}</p>
      <label className="mv-check"><input type="checkbox" checked={jobs} onChange={e => setJobs(e.target.checked)} /><span>{CONSENT.jobs.label}</span></label>
      <p className="mv-note">Optional, and never required for your Move Plan. You can change it any time in your settings. <a href="/how-we-use-your-information">How we use your information</a></p>
    </div>
    <div className="mv-actions">
      <button className="btn btn-primary" disabled={!ok} onClick={() => setSent(true)}>Send my sign-in link</button>
      <button className="btn btn-secondary" onClick={() => go('dash')}>Skip for now</button>
    </div>
  </div>;
}

/* ---------- 4. the control centre ---------- */
function TaskRow({ t, st, onSet, dest }) {
  const s = (st || {}).status || 'todo';
  const href = taskLink(t, dest);
  /* Match the call to what is on the other end: five of these route to a tool, not a guide,
     and "Read it once, properly" on the cost calculator is the plan misdescribing itself. */
  const cta = t.tool ? 'Open the tool' : 'Read it once, properly';
  /* Official sources sit UNDER our own guide, never instead of it: the guide explains the
     thing, the source is where it actually gets done. All official bodies or not-for-profit
     comparison tools — no commercial links here. */
  const res = taskResources(t, dest);
  return <div className={'mv-task ' + s}>
    <div>
      <h4>{t.title}</h4>
      <p className="mv-p">{t.why} {href ? <a href={href}>{cta} &rarr;</a> : null}</p>
      {res.length ? <p className="mv-res"><span>Where it gets done</span>{res.map(r =>
        <a key={r.href} href={r.href} target="_blank" rel="noopener">{r.label}</a>
      )}</p> : null}
    </div>
    <label className="mv-st"><span className="mv-vh">Status for {t.title}</span>
      <select value={s} onChange={e => onSet(t.id, e.target.value)}>
        <option value="todo">Not started</option><option value="doing">In progress</option><option value="done">Done</option><option value="na">Not for me</option>
      </select>
    </label>
  </div>;
}

function Wallet({ store, set }) {
  const c = cur(store), costs = store.costs, a = Number(store.allowance.amount || 0);
  const sum = f => costs.reduce((n, x) => n + (f(x) ? Number(x.actual || 0) : 0), 0);
  const claimed = sum(x => x.funding !== 'self');
  const awaiting = sum(x => x.funding === 'reimbursable');
  const ownMoney = sum(x => x.funding === 'self' || x.funding === 'reimbursable');
  const est = costs.reduce((n, x) => n + Number(x.estimate || 0), 0);
  const upd = (i, k, v) => set(s => { s.costs[i][k] = v; return s; });
  return <div>
    <h2>Relocation wallet</h2>
    <p className="mv-lead">What your employer agreed to, what you have actually spent, and what is still owed back to you.</p>
    <div className="mv-wallet">
      <label className="mv-alw"><span>Relocation allowance ({c})</span><input className="mv-in" type="number" inputMode="numeric" value={store.allowance.amount} placeholder="10000" onChange={e => set(s => { s.allowance.amount = e.target.value; return s; })} /></label>
      <div className="mv-figs">
        <Fig k="Allowance" v={money(a, c)} />
        <Fig k="Spent against it" v={money(claimed, c)} />
        <Fig k="Remaining" v={money(Math.max(a - claimed, 0), c)} tone={a && claimed > a ? 'warn' : 'good'} />
        <Fig k="Awaiting reimbursement" v={money(awaiting, c)} tone={awaiting ? 'warn' : ''} />
      </div>
      <div className="mv-bar2"><span style={{ width: (a ? Math.min(claimed / a * 100, 100) : 0) + '%' }}></span></div>
      <p className="mv-note">Your own money so far: <strong>{money(ownMoney, c)}</strong> · estimated total for the move: <strong>{money(est, c)}</strong>{a && claimed > a ? ' · you are over the allowance — anything above it is normally yours to carry.' : ''}</p>
    </div>
    <div className="mv-tablewrap"><table className="mv-table">
      <caption className="mv-vh">Costs, estimates and funding status</caption>
      <thead><tr><th scope="col">Cost</th><th scope="col">Category</th><th scope="col">Estimate</th><th scope="col">Actual</th><th scope="col">Funding</th><th scope="col">Receipt</th></tr></thead>
      <tbody>{costs.map((x, i) => <tr key={x.id}>
        <td><input className="mv-cell" value={x.label} onChange={e => upd(i, 'label', e.target.value)} aria-label="Cost name" /></td>
        <td><select className="mv-cell" value={x.category} onChange={e => upd(i, 'category', e.target.value)} aria-label="Category">{V.category.map(k => <option key={k}>{k}</option>)}</select></td>
        <td><input className="mv-cell num" type="number" value={x.estimate} onChange={e => upd(i, 'estimate', e.target.value)} aria-label="Estimate" /></td>
        <td><input className="mv-cell num" type="number" value={x.actual} onChange={e => upd(i, 'actual', e.target.value)} aria-label="Actual" /></td>
        <td><select className="mv-cell" value={x.funding} onChange={e => upd(i, 'funding', e.target.value)} aria-label="Funding">{V.funding.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</select></td>
        <td>{x.receipt ? <span className="mv-rec">{x.receipt}</span> : <label className="mv-attach">Attach<input type="file" onChange={e => upd(i, 'receipt', (e.target.files[0] || {}).name || '')} /></label>}</td>
      </tr>)}</tbody>
    </table></div>
    <div className="mv-actions">
      <button className="btn btn-secondary" onClick={() => set(s => { s.costs.push({ id: uid(), section: 'money', category: 'Other', label: 'New cost', estimate: '', actual: '', funding: 'self', receipt: '' }); return s; })}>Add a cost</button>
      <span className="mv-note">Receipts, invoices and booking confirmations only — we deliberately don’t ask you to store passports or medical records here.</span>
    </div>
  </div>;
}

function Section({ id, store, set }) {
  const meta = V.sections.find(s => s.id === id), c = cur(store);
  const tasks = TASKS.filter(t => t.section === id);
  const costs = store.costs.filter(x => x.section === id);
  const saved = store.saved.filter(x => x.section === id);
  const onSet = (tid, v) => set(s => { s.tasks[tid] = Object.assign(s.tasks[tid] || {}, { status: v }); return s; });
  if (id === 'money') return <Wallet store={store} set={set} />;
  return <div>
    <h2>{meta.label}</h2><p className="mv-lead">{meta.note}</p>
    <div className="mv-tasks">{tasks.map(t => <TaskRow key={t.id} t={t} st={store.tasks[t.id]} onSet={onSet} dest={store.move.destination} />)}</div>
    <div className="mv-grid two">
      <div className="mv-card"><span className="k">Costs in this section</span>{costs.length ? <ul className="mv-ul">{costs.map(x => <li key={x.id}>{x.label} · {money(x.actual || x.estimate, c)}</li>)}</ul> : <p className="mv-p">Nothing logged yet. Anything you add here lands in your wallet too.</p>}<a className="mv-go" href="#money" onClick={e => { e.preventDefault(); location.hash = 'money'; }}>Open the wallet &rarr;</a></div>
      <div className="mv-card"><span className="k">Shortlist</span>{saved.length ? <ul className="mv-ul">{saved.map(x => <li key={x.id}>{x.label}</li>)}</ul> : <p className="mv-p">Save places, properties, schools or providers as you research and they collect here.</p>}
        <button className="mv-go asbtn" onClick={() => set(s => { s.saved.push({ id: uid(), section: id, kind: 'note', label: 'Saved item — rename me', url: '', note: '' }); return s; })}>Add to shortlist &rarr;</button></div>
    </div>
  </div>;
}

function Overview({ store, set, goto }) {
  const c = cur(store), done = Object.values(store.tasks).filter(t => t.status === 'done').length;
  const family = store.move.party === 'With children' || store.move.party === 'Partner and children';
  const mine = TASKS.filter(t => family || t.section !== 'family');
  const next = mine.filter(t => !store.tasks[t.id] || store.tasks[t.id].status === 'todo').slice(0, 3);
  const awaiting = store.costs.reduce((n, x) => n + (x.funding === 'reimbursable' ? Number(x.actual || 0) : 0), 0);
  const claimed = store.costs.reduce((n, x) => n + (x.funding !== 'self' ? Number(x.actual || 0) : 0), 0);
  const a = Number(store.allowance.amount || 0);
  return <div>
    <h2>Your move at a glance</h2>
    <p className="mv-lead">Three questions, answered every time you open this: what is still to do, where the money stands, and what to do next.</p>
    <div className="mv-grid three">
      <div className="mv-card"><span className="k">What’s still to do</span><h3>{done} of {mine.length} done</h3><ul className="mv-ul">{next.map(t => <li key={t.id}>{t.title}</li>)}</ul></div>
      <div className="mv-card"><span className="k">Where the money stands</span><h3>{a ? money(Math.max(a - claimed, 0), c) + ' left' : 'Add your allowance'}</h3><p className="mv-p">{awaiting ? money(awaiting, c) + ' is with your employer awaiting reimbursement.' : 'Log costs as you go and mark what your employer owes you back.'}</p><a className="mv-go" href="#money" onClick={e => { e.preventDefault(); goto('money'); }}>Open the wallet &rarr;</a></div>
      <div className="mv-card"><span className="k">What to do next</span><h3>{next[0] ? next[0].title : 'You’re ahead of it'}</h3><p className="mv-p">{next[0] ? next[0].why : 'Nothing overdue. Have a look at the destination guides while you wait on the regulator.'}</p>{next[0] ? <a className="mv-go" href={next[0].link}>Read it once, properly &rarr;</a> : null}</div>
    </div>
    <Profiling store={store} set={set} />
  </div>;
}

/* progressive profiling — one ask per visit, never blocking, always dismissible */
function Profiling({ store, set }) {
  const queue = [
    { id: 'years', q: 'How many years’ experience do you have?', why: 'It changes which roles are worth telling you about.', opts: V.years, put: (s, v) => { s.pro.years = v; } },
    { id: 'specialty', q: 'Which areas do you specialise in?', why: 'Modality and sub-speciality decide most matches.', opts: ['General', 'CT', 'MRI', 'Ultrasound', 'Cardiac', 'Paediatrics', 'Theatre', 'Community'], put: (s, v) => { s.pro.specialty = v; } },
    { id: 'regStatus', q: 'Where are you up to with registration?', why: 'So we stop suggesting steps you have already done.', opts: V.regStatus, put: (s, v) => { s.pro.regStatus = v; } },
    { id: 'regions', q: 'Where would you consider living?', why: 'Flexible is a perfectly good answer.', opts: V.region[store.move.destination === 'au' ? 'au' : 'nz'], put: (s, v) => { s.move.regions = [v]; } }
  ];
  const [hidden, setHidden] = React.useState(false);
  const ask = queue.find(q => store.asked.indexOf(q.id) < 0);
  if (!ask || hidden) return null;
  return <div className="mv-prof">
    <div><span className="k">One quick thing — skip it if you’d rather</span><h3>{ask.q}</h3><p className="mv-p">{ask.why}</p></div>
    <div className="mv-profacts">
      <Chips options={ask.opts} value="" onChange={v => set(s => { ask.put(s, v); s.asked.push(ask.id); return s; })} />
      <button className="mv-skip" onClick={() => setHidden(true)}>Not now</button>
    </div>
  </div>;
}

function Settings({ store, set }) {
  const on = k => !!(store.consent[k] && store.consent[k].granted);
  const toggle = (k, wording, version) => set(s => {
    const was = on(k);
    s.consent[k] = was
      ? { granted: false, withdrawn: Date.now(), at: (s.consent[k] || {}).at, source: (s.consent[k] || {}).source, version: version, wording: wording }
      : { granted: true, at: Date.now(), source: 'Move Planner — settings', version: version, wording: wording };
    return s;
  });
  const rec = store.consent.jobs;
  const rows = [['jobs', CONSENT.jobs], ['plan', CONSENT.plan], ['reg', CONSENT.reg], ['news', CONSENT.news]];
  return <div>
    <h2>Your account and preferences</h2>
    <p className="mv-lead">Each of these is a separate choice. Turning one off never affects the others, and none of them affects your Move Plan.</p>
    <div className="mv-prefs">{rows.map(([k, c2]) => <div className="mv-pref" key={k}>
      <div><h3>{c2.label}</h3><p className="mv-p">{c2.body}</p></div>
      <button className={'mv-toggle' + (on(k) ? ' on' : '')} role="switch" aria-checked={on(k)} onClick={() => toggle(k, c2.label, c2.version)}><span className="dot"></span><span className="lb">{on(k) ? 'On' : 'Off'}</span></button>
    </div>)}</div>
    <div className="mv-card"><span className="k">Your consent record</span>
      <p className="mv-p">{rec && rec.at ? <>Job opportunities: <strong>{rec.granted ? 'on' : 'withdrawn'}</strong> · given {new Date(rec.at).toLocaleString('en-GB')} · source <strong>{rec.source}</strong> · wording version <strong>{rec.version}</strong>{rec.withdrawn ? ' · withdrawn ' + new Date(rec.withdrawn).toLocaleString('en-GB') : ''}</> : 'No recruitment consent has been given from this device.'}</p>
      <p className="mv-note">We store the exact wording you agreed to, not just a tick — so if we change it, your record still says what you actually saw. <a href="/how-we-use-your-information">How we use your information</a></p>
    </div>
    <div className="mv-actions">
      <button className="btn btn-secondary" onClick={() => { const b = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a2 = document.createElement('a'); a2.href = u; a2.download = 'my-move-plan.json'; a2.click(); URL.revokeObjectURL(u); }}>Download everything we hold</button>
      <button className="btn btn-secondary" onClick={() => { if (confirm('Delete this plan from this device?')) { localStorage.removeItem(KEY2); location.reload(); } }}>Delete my plan</button>
    </div>
  </div>;
}

/* ---------- shell ---------- */
function Dash({ store, set }) {
  const [view, setView] = React.useState('overview');
  const nav = [{ id: 'overview', label: 'Overview' }].concat(V.sections).concat([{ id: 'docs', label: 'Documents' }, { id: 'settings', label: 'Settings' }]);
  const name = store.account ? store.account.first : null;
  return <div className="mv-wrap wide">
    <div className="mv-dhead">
      <div><span className="eyebrow">My Move</span><h1>{name ? name + '’s move' : 'Your move'}</h1>
        <p className="mv-lead">{store.move.profession || 'Healthcare professional'} · {(V.destination.find(d => d.id === store.move.destination) || {}).label || 'Destination undecided'} · {store.move.period || 'timing to confirm'}</p></div>
      {/* Was "One email and it follows you · Save my plan", which routed into a simulated
          account step: it looked like saving and did nothing. Same wording as the hub's
          own note now, so one page does not make two promises. */}
      {!store.account ? <div className="mv-unsaved"><span className="k">This device only</span><p className="mv-p">There is no sign-in yet, so your plan will not follow you to another device. A signed-in version is the next thing we build.</p></div> : null}
    </div>
    <div className="mv-dash">
      <nav className="mv-rail" aria-label="Sections">{nav.map(n => <button key={n.id} className={'mv-navb' + (view === n.id ? ' on' : '')} aria-current={view === n.id ? 'page' : null} onClick={() => setView(n.id)}>{n.label}</button>)}</nav>
      <div className="mv-view">
        {view === 'overview' ? <Overview store={store} set={set} goto={setView} /> : null}
        {V.sections.some(s => s.id === view) ? <Section id={view} store={store} set={set} /> : null}
        {view === 'docs' ? <Docs store={store} set={set} /> : null}
        {view === 'settings' ? <Settings store={store} set={set} /> : null}
      </div>
    </div>
  </div>;
}

function Docs({ store, set }) {
  return <div>
    <h2>Receipts and documents</h2>
    <p className="mv-lead">Narrow on purpose: receipts, invoices, booking confirmations and evidence for your relocation allowance. Nothing identity-critical.</p>
    <div className="mv-docs">{store.costs.filter(x => x.receipt).map(x => <div className="mv-doc" key={x.id}><span className="k">{x.category}</span><h4>{x.receipt}</h4><p className="mv-p">Attached to “{x.label}”</p></div>)}
      {store.costs.filter(x => x.receipt).length === 0 ? <p className="mv-p">Nothing attached yet — add receipts against a cost in your wallet and they appear here.</p> : null}</div>
    <div className="mv-flag"><span className="k">Deliberately not here yet</span><p className="mv-p">Passports, visa grant letters, medical records and police certificates are exactly what people would want to upload — and exactly what needs a properly secured document store, retention rules and a legal review before we invite it. Until then we don’t ask for them.</p></div>
  </div>;
}

function App() {
  const [store, setStore] = React.useState(loadStore);
  const [screen, setScreen] = React.useState(() => { const s = loadStore(); return s.move.destination ? 'dash' : 'intro'; });
  const set = fn => setStore(prev => { const next = fn(JSON.parse(JSON.stringify(prev))); saveStore(next); return next; });
  React.useEffect(() => { if (!store.seeded) set(s => { s.costs = EXAMPLES.map(e => Object.assign({ id: uid() }, e)); s.seeded = true; return s; }); }, []);
  React.useEffect(() => { if (store.wantAccount) { set(s => { delete s.wantAccount; return s; }); setScreen('account'); } }, [store.wantAccount]);
  return <div className="mv-app">
    {screen === 'intro' ? <Intro store={store} set={set} done={() => setScreen('plan')} /> : null}
    {screen === 'plan' ? <Plan store={store} set={set} go={setScreen} /> : null}
    {screen === 'account' ? <Account store={store} set={set} go={setScreen} /> : null}
    {screen === 'dash' ? <Dash store={store} set={set} /> : null}
    {/* The prototype bar lived here while this was the unlinked /my-move page: a "this is a
        prototype" disclaimer plus an unconfirmed Reset that wiped the store. Folded into
        /move it sat on a page the homepage points at, one screen from the hub's own
        CONFIRMED "Clear my plan from this device". Removed — Settings still offers a
        confirmed delete. */}
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
