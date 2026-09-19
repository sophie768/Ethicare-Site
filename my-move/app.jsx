/* My Move — root: sign-in, second factor for staff, routing by verified role.
   Two authenticated experiences behind one sign-in. Role comes from the
   database (mm_whoami), never from anything the browser asserts. */
const { useState: aUseState, useEffect: aUseEffect } = React;
const AAPI = window.MMAPI;

function AuthBox({ title, lead, children }) {
  return <div className="mm-auth"><div className="mm-authbox">
    <a className="mm-brand" href="/"><img src="/assets/logo-mark.png" alt="" /><span><span className="bt">Ethicare</span><span className="bs">My Move</span></span></a>
    <h1>{title}</h1>
    {lead ? <p className="mm-lead">{lead}</p> : null}
    {children}
  </div></div>;
}

function NotConfigured() {
  return <AuthBox title="My Move isn’t switched on here yet" lead="This environment has no database connection configured. Add the Supabase URL and anon key to my-move/config.js (see my-move/README.md).">
    <a className="mm-btn sec" href="/">Back to ethicareresourcing.com</a>
  </AuthBox>;
}

function SignIn({ initialTab }) {
  const [tab, setTab] = aUseState(initialTab || 'candidate');
  const [email, setEmail] = aUseState('');
  const [pw, setPw] = aUseState('');
  const [busy, setBusy] = aUseState(false);
  const [sent, setSent] = aUseState(false);
  const [err, setErr] = aUseState('');
  const [forgot, setForgot] = aUseState(false);
  const valid = email.indexOf('@') > 0;
  const candidate = async e => {
    e.preventDefault(); if (!valid) return;
    setBusy(true); setErr('');
    try { await AAPI.candidateLink(email.trim()); setSent(true); } catch (x) { setErr(AAPI.friendly(x)); }
    setBusy(false);
  };
  const staff = async e => {
    e.preventDefault(); if (!valid || !pw) return;
    setBusy(true); setErr('');
    try { await AAPI.staffPassword(email.trim(), pw); }
    catch (x) { setErr(/Invalid login/i.test(x.message || '') ? 'That email and password don’t match.' : AAPI.friendly(x)); }
    setBusy(false);
  };
  const reset = async e => {
    e.preventDefault(); if (!valid) return;
    setBusy(true); setErr('');
    try { await AAPI.resetPassword(email.trim()); setSent(true); } catch (x) { setErr(AAPI.friendly(x)); }
    setBusy(false);
  };
  return <AuthBox title="Sign in to My Move" lead="Your private space for the move, shared with the Ethicare team supporting you.">
    <div className="mm-tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'candidate'} className={tab === 'candidate' ? 'on' : ''} onClick={() => { setTab('candidate'); setErr(''); setSent(false); }}>I’m a candidate</button>
      <button role="tab" aria-selected={tab === 'staff'} className={tab === 'staff' ? 'on' : ''} onClick={() => { setTab('staff'); setErr(''); setSent(false); }}>Ethicare staff</button>
    </div>
    {err ? <Alert kind="err" onDismiss={() => setErr('')}>{err}</Alert> : null}
    {tab === 'candidate' ? (sent
      ? <div className="mm-alert ok"><span className="grow">If <b>{email}</b> has a My Move space, a sign-in link is on its way. It works once and expires; open it on the device you want to use.</span></div>
      : <form onSubmit={candidate}>
        <div className="mm-field"><label htmlFor="c-email">Email address <span className="hint">— the one your invitation was sent to</span></label><input id="c-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <button className="mm-btn pri" type="submit" disabled={busy || !valid}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
        <p className="mm-fine">No password to remember. My Move is invitation-only: you get a space once you’ve accepted an Ethicare-supported role. <a href="/how-we-use-your-information">How we use your information</a>.</p>
      </form>)
      : (sent
      ? <div className="mm-alert ok"><span className="grow">If that address has a staff account, a password-reset link is on its way.</span></div>
      : forgot
      ? <form onSubmit={reset}>
        <div className="mm-field"><label htmlFor="s-email2">Work email</label><input id="s-email2" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div className="mm-rowacts"><button className="mm-btn pri" type="submit" disabled={busy || !valid}>{busy ? 'Sending…' : 'Send reset link'}</button><button className="mm-btn ghost" type="button" onClick={() => setForgot(false)}>Back</button></div>
      </form>
      : <form onSubmit={staff}>
        <div className="mm-field"><label htmlFor="s-email">Work email</label><input id="s-email" type="email" inputMode="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div className="mm-field"><label htmlFor="s-pw">Password</label><input id="s-pw" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required /></div>
        <div className="mm-rowacts"><button className="mm-btn pri" type="submit" disabled={busy || !valid || !pw}>{busy ? 'Signing in…' : 'Continue'}</button><button className="mm-btn ghost" type="button" onClick={() => setForgot(true)}>Forgotten password</button></div>
        <p className="mm-fine">Staff accounts need an authenticator app as a second factor before any case is visible.</p>
      </form>)}
  </AuthBox>;
}

/* Staff second factor: verify an existing authenticator, or enrol one (and set
   a password when arriving from an invitation or reset link). */
function MfaGate({ me, needsPassword, onDone, onSignOut }) {
  const [factors, setFactors] = aUseState(null);
  const [enrol, setEnrol] = aUseState(null);
  const [code, setCode] = aUseState('');
  const [pw, setPw] = aUseState('');
  const [pw2, setPw2] = aUseState('');
  const [pwDone, setPwDone] = aUseState(!needsPassword);
  const [busy, setBusy] = aUseState(false);
  const [err, setErr] = aUseState('');
  aUseEffect(() => { AAPI.mfaFactors().then(setFactors).catch(e => setErr(AAPI.friendly(e))); }, []);
  const startEnrol = async () => { setBusy(true); setErr(''); try { setEnrol(await AAPI.mfaEnrol()); } catch (e) { setErr(AAPI.friendly(e)); } setBusy(false); };
  const savePw = async e => {
    e.preventDefault();
    if (pw.length < 12) { setErr('Use at least 12 characters.'); return; }
    if (pw !== pw2) { setErr('The passwords don’t match.'); return; }
    setBusy(true); setErr('');
    try { await AAPI.setPassword(pw); setPwDone(true); } catch (x) { setErr(AAPI.friendly(x)); }
    setBusy(false);
  };
  const verify = async e => {
    e.preventDefault();
    const factorId = enrol ? enrol.id : (factors && factors[0] && factors[0].id);
    if (!factorId) return;
    setBusy(true); setErr('');
    try { await AAPI.mfaVerify(factorId, code); onDone(); }
    catch (x) { setErr(/invalid|expired/i.test(x.message || '') ? 'That code didn’t match. Codes change every 30 seconds — try the current one.' : AAPI.friendly(x)); }
    setBusy(false);
  };
  if (factors === null && !err) return <AuthBox title="Checking your sign-in…"><Loading /></AuthBox>;
  if (!pwDone) return <AuthBox title={'Welcome, ' + (me.name || 'colleague')} lead="Set the password you’ll use to sign in, then add an authenticator app.">
    {err ? <Alert kind="err" onDismiss={() => setErr('')}>{err}</Alert> : null}
    <form onSubmit={savePw}>
      <div className="mm-field"><label htmlFor="pw1">New password <span className="hint">— 12+ characters</span></label><input id="pw1" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} required /></div>
      <div className="mm-field"><label htmlFor="pw2">Repeat password</label><input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} required /></div>
      <button className="mm-btn pri" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
    </form>
  </AuthBox>;
  const hasFactor = factors && factors.length > 0 && !enrol;
  return <AuthBox title={hasFactor ? 'Enter your authenticator code' : 'Set up your authenticator'} lead={hasFactor ? 'Open your authenticator app and enter the 6-digit code for Ethicare My Move.' : 'Staff access needs a second factor. Scan the code with an authenticator app (Microsoft Authenticator, Google Authenticator, 1Password…), then enter the 6-digit code it shows.'}>
    {err ? <Alert kind="err" onDismiss={() => setErr('')}>{err}</Alert> : null}
    {!hasFactor && !enrol ? <button className="mm-btn pri" onClick={startEnrol} disabled={busy}>{busy ? 'Preparing…' : 'Show me the code to scan'}</button> : null}
    {enrol ? <div>
      <div className="mm-qr" dangerouslySetInnerHTML={{ __html: enrol.totp && enrol.totp.qr_code && enrol.totp.qr_code.indexOf('<svg') === 0 ? enrol.totp.qr_code : '<img alt="Authenticator QR code" src="' + (enrol.totp ? enrol.totp.qr_code : '') + '">' }} />
      <p className="mm-fine">Can’t scan? Enter this key manually:</p>
      <div className="mm-secret">{enrol.totp ? enrol.totp.secret : ''}</div>
    </div> : null}
    {hasFactor || enrol ? <form onSubmit={verify} style={{ marginTop: 14 }}>
      <div className="mm-field"><label htmlFor="totp">6-digit code</label><input id="totp" inputMode="numeric" pattern="[0-9 ]*" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} required /></div>
      <button className="mm-btn pri" type="submit" disabled={busy || code.replace(/\s/g, '').length < 6}>{busy ? 'Checking…' : 'Verify'}</button>
    </form> : null}
    <p className="mm-fine"><button className="mm-btn ghost sm" onClick={onSignOut}>Sign out</button></p>
  </AuthBox>;
}

function Blocked({ kind, who, onSignOut }) {
  let title = 'No My Move space for this account', body = 'You’re signed in, but there isn’t a My Move space linked to this email. If you were expecting one, contact your Ethicare consultant.';
  if (kind === 'candidate') {
    if (who.status === 'suspended') { title = 'Access paused'; body = 'Your My Move space is paused at the moment. Your Ethicare contact can tell you more.'; }
    else if (who.status === 'archived') { title = 'This space has closed'; body = 'Your move has been archived. Contact Ethicare if you need a copy of your information.'; }
    else if (who.invitation === 'revoked' || who.invitation === 'expired') { title = 'This invitation is no longer valid'; body = 'The invitation has been withdrawn or has expired. Ask your Ethicare contact for a new one.'; }
    else if (who.status === 'draft') { title = 'Your space is being prepared'; body = 'You’ll get an email when it’s ready.'; }
  }
  if (kind === 'staff') { title = 'Staff access removed'; body = 'This account no longer has access to My Move. Contact the Ethicare admin.'; }
  return <AuthBox title={title} lead={body}><button className="mm-btn sec" onClick={onSignOut}>Sign out</button></AuthBox>;
}

function App() {
  const [phase, setPhase] = aUseState(AAPI.configured ? 'boot' : 'noconfig');
  const [who, setWho] = aUseState(null);
  const [err, setErr] = aUseState('');
  const entry = AAPI.entryType;

  const resolve = async () => {
    try {
      const s = await AAPI.session();
      if (!s) { setPhase('signedout'); return; }
      const w = await AAPI.whoami();
      setWho(w);
      if (w.kind === 'staff') {
        if (!w.active) { setPhase('blocked'); return; }
        const lvl = await AAPI.mfaLevel();
        setPhase(lvl && lvl.currentLevel === 'aal2' ? 'staff' : 'mfa');
        return;
      }
      if (w.kind === 'candidate') {
        setPhase(w.status === 'active' && (w.invitation === 'sent' || w.invitation === 'accepted') ? 'candidate' : 'blocked');
        return;
      }
      setPhase('blocked');
    } catch (e) { setErr(AAPI.friendly(e)); setPhase('error'); }
  };
  aUseEffect(() => {
    if (!AAPI.configured) return;
    resolve();
    const sub = AAPI.onAuth((ev) => {
      if (ev === 'SIGNED_OUT') { setWho(null); setPhase('signedout'); }
      else if (ev === 'SIGNED_IN' || ev === 'MFA_CHALLENGE_VERIFIED' || ev === 'USER_UPDATED' || ev === 'PASSWORD_RECOVERY') resolve();
    });
    return () => { try { sub.data.subscription.unsubscribe(); } catch (e) {} };
  }, []);
  const signOut = async () => { await AAPI.signOut(); setWho(null); setPhase('signedout'); location.hash = ''; };

  if (phase === 'noconfig') return <NotConfigured />;
  if (phase === 'boot') return <AuthBox title="Opening My Move…"><Loading /></AuthBox>;
  if (phase === 'error') return <AuthBox title="Something went wrong" lead={err}><div className="mm-rowacts"><button className="mm-btn pri" onClick={resolve}>Try again</button><button className="mm-btn ghost" onClick={signOut}>Sign out</button></div></AuthBox>;
  if (phase === 'signedout') return <SignIn initialTab={location.hash === '#staff' ? 'staff' : 'candidate'} />;
  if (phase === 'mfa') return <MfaGate me={who} needsPassword={entry === 'invite' || entry === 'recovery'} onDone={resolve} onSignOut={signOut} />;
  if (phase === 'blocked') return <Blocked kind={who ? who.kind : 'none'} who={who || {}} onSignOut={signOut} />;
  if (phase === 'staff') return <StaffApp me={who} onSignOut={signOut} />;
  return <CandidateApp onSignOut={signOut} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
