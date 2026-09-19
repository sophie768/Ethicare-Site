/* My Move — shared UI: formatting, icons, primitives, the app shell and the
   task list used by the candidate view AND the staff preview. Babel scope;
   exported to window. */
const MMD = window.MMD;
const { useState, useEffect, useRef } = React;

/* ---- formatting ---- */
function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00Z' : iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: iso.length <= 10 ? 'UTC' : undefined });
}
function fmtWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function initials(name) { return String(name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(); }
function tbc(v) { return !v || String(v).trim() === '' || String(v).trim().toLowerCase() === 'to be confirmed'; }
function safeUrl(u) {
  const s = String(u || '').trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/[^/]/.test(s)) return s;
  return null;
}

function progressOf(tasks) {
  const applicable = (tasks || []).filter(t => t.status !== 'na');
  const done = applicable.filter(t => t.status === 'complete').length;
  return { done, total: applicable.length, pct: applicable.length ? Math.round(done / applicable.length * 100) : 0 };
}

/* The candidate's live view = published snapshot + their own progress rows on
   tasks that are not staff-controlled. Draft never enters here. */
function overlayProgress(published, progress) {
  const pub = MMD.normaliseDraft(published);
  const byKey = {};
  (progress || []).forEach(p => { byKey[p.task_key] = p; });
  pub.tasks = pub.tasks.map(t => {
    const p = byKey[t.id];
    if (p && !t.staffControlled) return Object.assign({}, t, { status: p.status, selfReported: true, reportedAt: p.updated_at });
    return t;
  });
  return pub;
}

/* ---- icons (decorative; aria-hidden) ---- */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
function Icon({ name, cls }) {
  const paths = {
    home: <path {...P} d="M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5" />,
    role: <g {...P}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></g>,
    reg: <g {...P}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M9.5 12.5l1.5 1.5 3-3.5" /></g>,
    travel: <path {...P} d="M3 16l7-2 4-9 2 1-1.5 7 5-1.5 1 2-8 3-3.5 3-1-2 3-2z" />,
    settle: <g {...P}><path d="M4 11 12 5l8 6" /><path d="M6 10v9h12v-9" /><path d="M10 19v-4h4v4" /></g>,
    guides: <g {...P}><path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" /></g>,
    notes: <g {...P}><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4z" /><path d="M8 8h8M8 12h5" /></g>,
    cases: <g {...P}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></g>,
    add: <path {...P} d="M12 5v14M5 12h14" />,
    search: <g {...P}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></g>,
    check: <path {...P} d="m5 12 4 4 10-11" />,
    mail: <g {...P}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></g>,
    team: <g {...P}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2.5-2-4.2-4.5-4.7" /></g>,
    link: <g {...P}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></g>,
    warn: <g {...P}><path d="M12 3 2 20h20z" /><path d="M12 9v5M12 17h.01" /></g>,
    lock: <g {...P}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></g>,
    out: <g {...P}><path d="M10 4H5v16h5" /><path d="m14 8 4 4-4 4M18 12H9" /></g>
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" className={'ic ' + (cls || '')} aria-hidden="true">{paths[name] || null}</svg>;
}

/* ---- primitives ---- */
function Pill({ status }) { return <span className={'mm-pill ' + (MMD.STATUS_CLASS[status] || 'todo')}>{MMD.STATUS[status] || status}</span>; }
function Owner({ owner }) { return <span className={'mm-owner ' + (MMD.OWNER_CLASS[owner] || '')}>{MMD.OWNER[owner] || owner}</span>; }
function ArrState({ state }) { return <span className={'mm-pill ' + (MMD.ARR_CLASS[state] || 'todo')}>{MMD.ARR_STATE[state] || state}</span>; }
function Avatar({ name, small }) { return <span className={'mm-av' + (small ? ' sm' : '')} aria-hidden="true">{initials(name)}</span>; }
function Toast({ msg }) { return msg ? <div className="mm-toast" role="status">{msg}</div> : null; }
function Loading({ label }) { return <div className="mm-loading" role="status"><span className="sp" aria-hidden="true"></span>{label || 'Loading…'}</div>; }
function Alert({ kind, children, onRetry, retryLabel, onDismiss }) {
  return <div className={'mm-alert ' + (kind || 'warn')} role={kind === 'err' ? 'alert' : 'status'}>
    <span className="grow">{children}</span>
    {onRetry ? <button className="mm-btn sec sm" onClick={onRetry}>{retryLabel || 'Retry'}</button> : null}
    {onDismiss ? <button className="mm-btn ghost sm" onClick={onDismiss} aria-label="Dismiss">Dismiss</button> : null}
  </div>;
}
/* Save status: honest, visible, and never "saved to this device". */
function SaveState({ state, onRetry }) {
  if (!state || state === 'idle') return null;
  if (state === 'saving') return <span className="mm-save pending" role="status">Saving…</span>;
  if (state === 'saved') return <span className="mm-save" role="status">Saved</span>;
  if (state === 'dirty') return <span className="mm-save pending" role="status">Unsaved changes</span>;
  return <span className="mm-save err" role="alert">Not saved {onRetry ? <button className="mm-btn ghost sm" onClick={onRetry}>Retry</button> : null}</span>;
}
function useToast() {
  const [msg, setMsg] = useState('');
  const t = useRef(null);
  const ping = m => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(''), 2600); };
  return [msg, ping];
}

/* ---- app shell (candidate + staff) ---- */
function Shell({ nav, view, onNav, brandSub, header, footWho, onSignOut, children }) {
  return <div>
    <div className="mm-mobnav" role="navigation" aria-label="Sections">
      {nav.map(n => <button key={n.id} className={view === n.id ? 'on' : ''} aria-current={view === n.id ? 'page' : undefined} onClick={() => onNav(n.id)}>{n.short || n.label}</button>)}
      {onSignOut ? <button className="out" onClick={onSignOut}>Sign out</button> : null}
    </div>
    <div className="mm-app">
      <aside className="mm-side">
        <a className="mm-brand" href="/"><img src="/assets/logo-mark.png" alt="" /><span><span className="bt">Ethicare</span><span className="bs">{brandSub}</span></span></a>
        <nav className="mm-nav" aria-label="Sections">{nav.map(n =>
          <button key={n.id} className={view === n.id ? 'on' : ''} aria-current={view === n.id ? 'page' : undefined} onClick={() => onNav(n.id)}>
            <Icon name={n.icon} /> {n.label}{n.badge != null ? <span className="badge">{n.badge}</span> : null}
          </button>
        )}</nav>
        {footWho ? <div className="foot"><span className="who">{footWho.name}</span>{footWho.role}<br />
          {onSignOut ? <button onClick={onSignOut}>Sign out</button> : null}
          {footWho.extra || null}
        </div> : null}
      </aside>
      <main className="mm-main" id="main-content" tabIndex="-1">
        <div className="mm-topbar">{header}</div>
        <div className="mm-wrap">{children}</div>
      </main>
    </div>
  </div>;
}

/* ---- tasks (candidate view + staff preview) ---- */
const STATUS_KEYS = ['not_started', 'in_progress', 'waiting', 'complete', 'na'];
function TaskCard({ t, onStatus, saving, readOnly }) {
  const locked = !!t.staffControlled;
  const link = safeUrl(t.link);
  return <div className="mm-task">
    <div>
      <h4>{t.title || 'Untitled step'}</h4>
      {t.why ? <p className="why">{t.why}</p> : null}
      <div className="meta">
        <span><Owner owner={t.owner} /></span>
        {t.due ? <span>Due <b>{fmtDate(t.due)}</b></span> : null}
        {t.status === 'waiting' && t.waitingOn ? <span>Waiting on <b>{t.waitingOn}</b></span> : null}
        {link ? <span><a href={link} target="_blank" rel="noopener">{t.linkLabel || 'Official information'} ↗</a></span> : null}
        {!locked && t.selfReported && (t.status === 'complete' || t.status === 'in_progress') ? <span className="self">Self-reported — not yet verified</span> : null}
        {locked ? <span className="conf">{t.status === 'complete' ? 'Confirmed by Ethicare' : 'Updated by Ethicare'}</span> : null}
      </div>
    </div>
    <div className="rt">
      {locked || readOnly
        ? <Pill status={t.status} />
        : <label><span className="mm-vh">Update status for {t.title}</span>
          <select className={'mm-sel' + (saving ? ' saving' : '')} value={t.status} onChange={e => onStatus(t.id, e.target.value)}>
            {STATUS_KEYS.map(s => <option key={s} value={s}>{MMD.STATUS[s]}</option>)}
          </select>
        </label>}
      {saving ? <span className="mm-save pending">Saving…</span> : null}
    </div>
  </div>;
}
function PhaseList({ id, tasks, onStatus, savingKeys, readOnly }) {
  const ph = MMD.PHASES.find(p => p.id === id);
  const list = (tasks || []).filter(t => t.phase === id);
  if (!list.length) return <div className="mm-empty">Nothing here yet. Your Ethicare contact will add steps as they are confirmed.</div>;
  const p = progressOf(list);
  return <div>
    <div className="mm-phase"><h3>{ph.label}</h3><span className="ct">{p.done} of {p.total} done</span></div>
    {list.map(t => <TaskCard key={t.id} t={t} onStatus={onStatus} readOnly={readOnly} saving={!!(savingKeys && savingKeys[t.id])} />)}
  </div>;
}

Object.assign(window, {
  MMD, fmtDate, fmtWhen, initials, tbc, safeUrl, progressOf, overlayProgress, STATUS_KEYS,
  Icon, Pill, Owner, ArrState, Avatar, Toast, Loading, Alert, SaveState, useToast, Shell, TaskCard, PhaseList
});
