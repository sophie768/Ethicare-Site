/* Ethicare Moves — the free public relocation planner.
   A tailored plan held on the device: profession, destination, origin and stage,
   with real progress read from each tool's own saved state. No account, no
   password, nothing sent anywhere — the copy on the page says so plainly.

   Covers EVERY healthcare profession, not only the ones Ethicare recruits into,
   and says which is which. The catalogue in portal-professions.js is the single
   source of truth for both; this file only renders it.

   The signed-in version is deliberately not here. It needs
   a backend before it touches a candidate's email. See the build plan. */
(function () {
  var KEY = 'ethicare_portal_v1'; /* kept: candidates mid-plan keep their saved state through the rename.
     Not to be confused with `ethicare_myfile_v1` (saved pages + notes, mymove.js) or
     `ethicare_mymove_v2` (the My Move dashboard, my-move-planner.jsx). Three features, three keys. */
  var PROF = function () { return window.ETHICARE_PROFESSIONS; };

  /* `blurb` is the router copy on the welcome screen — what this answer gets you, so the
     tap is informed rather than a guess. `next` and `at` are unchanged. */
  var STAGES = [
    { value: 'exploring', label: 'Just exploring the idea', next: 'pathway', at: 0, atKey: 'fit',
      blurb: 'Whether you could register, what it might cost, and what life there is actually like.' },
    { value: 'applying', label: 'Applying or interviewing', next: 'interview', at: 2, atKey: 'cv',
      blurb: 'Roles, your CV in the local format, and what the interview is usually like.' },
    { value: 'offer', label: 'I have an offer to consider', next: 'offer', at: 1, atKey: 'registration',
      blurb: 'What to check before you sign, and what the move will really cost you.' },
    { value: 'moving', label: 'Accepted — planning the move', next: 'cost', at: 4, atKey: 'move',
      blurb: 'The sequence: visa, shipping, schools, housing, and what has the longest lead time.' },
    { value: 'arrived', label: 'Already here', next: 'first30', at: 5, atKey: 'arrive',
      blurb: 'Your first month — tax number, bank, licence, a GP, and finding your feet.' }
  ];

  /* Each tool, its page, and the localStorage key it writes — that key is how
     the portal knows whether you have actually started it. */
  var TOOL = {
    pathway: { title: 'Check your registration pathway', href: '/pathway-checker', store: 'ethicare_pathway_checker_draft_v1',
      note: 'The first question, and the one that sets the timeline for everything else.' },
    cv: { title: 'Write your CV', href: '/build-your-cv', store: 'ethicare-cv-builder-v1',
      note: 'The nine sections a reader wants, with the document building underneath as you type.' },
    interview: { title: 'Get ready to apply', href: '/interview-prep', store: 'ethicare-interview-prep-v1',
      note: 'A readiness check, plus the questions panels actually ask and somewhere to work up your own examples.' },
    offer: { title: 'Understand the offer in front of you', href: '/before-you-accept', store: 'ethicare_offer_check_v1',
      note: 'What you have actually been offered, and the questions still worth putting to the employer.' },
    cost: { title: 'Work out what the move will cost', href: '/cost-calculator', store: 'ethicare_cost_calculator_v1',
      note: 'What the whole move costs, what your employer covers, and what you need in the bank before you fly.' },
    checklist: { title: 'Organise the move itself', href: '/moving-checklist', store: 'ethicare_moving_checklist_v1',
      note: 'Everything to arrange before you go, filtered to your household.' },
    first30: { title: 'Your first thirty days', href: '/guides/nz/your-first-month', store: null,
      note: 'The paperwork in the order it needs doing, the first days on the unit, and the ordinary things that make a place yours.' }
  };

  var C = function (d) { return d === 'au' ? 'australia' : 'new-zealand'; };


  function journey(d) {
    var c = C(d);
    var immi = d === 'au'
      ? { label: 'Department of Home Affairs', href: 'https://immi.homeaffairs.gov.au/' }
      : { label: 'Immigration New Zealand', href: 'https://www.immigration.govt.nz/' };
    var base = [
      { key: 'fit', title: 'Deciding', stage: 'Before you apply',
        note: 'Before anything practical. What the country is actually like to live in, what your profession looks like there, and whether the people coming with you want it too.',
        links: [{ label: d === 'au' ? 'Working in Australia' : 'Working in New Zealand', href: '/' + (d === 'au' ? 'australia' : 'new-zealand') },
                { label: 'Destination guides', href: d === 'au' ? '/destinations/australia' : '/destinations/' }] },
      { key: 'registration', title: 'Registration & pay', tool: 'pathway', stage: 'Before you apply',
        note: 'Whether you can register, by which route, and how long it takes — this sets the timeline for everything after it. Pay sits here too, because the published scales are what an offer will be built from.',
        links: [{ label: 'Registration Pathway Checker', href: '/pathway-checker' },
                { label: 'Registration guide', href: '/guides/' + c + '-registration' },
                { label: 'Salary and pay, explained honestly', href: '/guides/' + c + '-salary' },
                { label: 'Understanding an offer', href: '/guides/negotiating-your-offer' }] },
      { key: 'cv', title: 'CV & interviews', tool: 'interview', stage: 'Before you apply',
        note: 'A clinical CV written for one health system rarely reads well in another. Build it properly, then test what you would say out loud.',
        links: [{ label: 'Build your CV', href: '/build-your-cv' },
                { label: 'Am I ready to apply?', href: '/interview-prep' },
                { label: 'CVs and interviews guide', href: '/guides/' + c + '-interview' },
                { label: 'Current opportunities', href: '/jobs/' }] },
      { key: 'visa', title: 'Visas', stage: 'Once you have an offer',
        note: 'Your employer sponsors you, so this follows the offer rather than preceding it. What matters is which visa, what it costs for everyone coming, and how long it realistically takes.',
        links: [{ label: 'Visa guide', href: '/guides/' + c + '-visa' },
                { label: immi.label, href: immi.href, external: true },
                { label: 'What the visa costs for everyone', href: '/cost-calculator' }] },
      { key: 'move', title: 'Preparing to move', tool: 'cost', stage: 'Once you have an offer',
        note: 'The money and the logistics together. What the whole move costs and what you need in the bank, alongside everything to arrange before you go.',
        links: [{ label: 'Cost of moving calculator', href: '/cost-calculator' },
                { label: 'Your moving checklist', href: '/moving-checklist' },
                { label: 'Preparing for the move', href: '/guides/' + c + '-relocation' }] },
      { key: 'arrive', title: 'Settling in', tool: 'first30', stage: 'After you land',
        note: 'Landing well. The paperwork in the order it actually needs doing, the first days on the unit, and the ordinary things that turn an arrival into a life.',
        links: [{ label: d === 'au' ? 'Living and thriving in Australia' : 'Your first month', href: d === 'au' ? '/guides/living-in-australia' : '/guides/nz/your-first-month' }] }
    ];
    return withHousehold(base, d, immi);
  }

  /* HOUSEHOLD STEPS — the household answer used to be stored and never read, so the plan
     for someone moving four people was identical to the plan for someone moving one. These
     steps are inserted by position rather than appended, because position IS the advice:
     partner work rights sit before the application (they can decide whether it is worth
     applying at all) and schools sit before Preparing to move, since the catchment decides
     the lease and doing it the other way round is an expensive mistake. */
  function withHousehold(base, d, immi) {
    if (!S.hh.with || S.hh.with === 'alone') return base;
    var c = C(d);
    var ins = function (beforeKey, step) {
      var i = base.length;
      for (var n = 0; n < base.length; n++) { if (base[n].key === beforeKey) { i = n; break; } }
      base.splice(i, 0, step);
    };

    ins('registration', {
      key: 'household', title: 'The people coming with you', stage: 'Before you apply',
      note: hasPartner()
        ? 'Your visa route decides what your partner can do when you arrive — whether they can work at all, for whom, and on what terms. Worth settling before you apply rather than after you have accepted.'
        : 'A move only works if it works for the children coming with you. What changes for them, and when, is worth reading before anything practical starts.',
      links: [{ label: 'Bringing your family', href: '/guides/' + c + '-family' }]
        .concat(hasPartner() ? [{ label: 'Can my partner work?', href: '/guides/' + c + '-family#partner-work' }] : [])
        .concat([{ label: 'What your visa route changes', href: '/guides/' + c + '-visa' }])
    });

    if (hasPartner() && S.hh.work === 'health') ins('cv', {
      key: 'partnerreg', title: 'Your partner\u2019s registration', stage: 'Before you apply',
      note: 'Two clinicians means two registrations, and theirs can take longer than yours. Run their pathway alongside your own from the start — a second timeline found late is the most common reason a family arrives months apart.',
      links: [{ label: 'Check their pathway', href: '/pathway-checker' },
              { label: 'Build their CV', href: '/build-your-cv' },
              { label: 'Registration guide', href: '/guides/' + c + '-registration' },
              { label: 'Can my partner work?', href: '/guides/' + c + '-family#partner-work' }]
    });

    if (hasKids()) {
      var small = band('u5'), school = schoolAge();
      var kTitle = school ? (small ? 'Schools and childcare' : 'Schools') : (small ? 'Childcare and early learning' : 'The children\u2019s side of it');
      var kNote = school
        ? 'Where you live decides which school your children can attend, so settle the school question before you sign a lease. That is why this sits ahead of Preparing to move rather than inside it.'
        : (small
          ? 'Places, waiting lists and cost vary street by street, and the good ones fill early. Worth starting before you fly rather than in your first week.'
          : 'What changes for them, in what order, and what you can set up before you land.');
      if (band('18up')) kNote += ' At university age your visa route decides whether they pay domestic or international fees — a gap wide enough to change the maths of the whole move.';
      var kLinks = [{ label: 'Schools and education', href: '/guides/' + c + '-education' }];
      if (small) kLinks.push({ label: 'Childcare, explained', href: '/guides/' + c + '-family#childcare' });
      kLinks.push(d === 'au'
        ? { label: 'Child Care Subsidy (Services Australia)', href: 'https://www.servicesaustralia.gov.au/child-care-subsidy', external: true }
        : { label: 'Early learning (Ministry of Education)', href: 'https://parents.education.govt.nz/', external: true });
      if (band('18up')) kLinks.push({ label: 'What your visa route changes', href: '/guides/' + c + '-visa' });
      ins('move', { key: 'children', title: kTitle, stage: 'Once you have an offer', note: kNote, links: kLinks });

      if (!hasPartner()) ins('move', {
        key: 'soloparent', title: 'Moving as a single parent', stage: 'Once you have an offer',
        note: 'Doing this on your own is a different move, not a smaller one. Two things are worth handling early: written consent from anyone else with parental responsibility, which visa applications and border officials can ask to see, and childcare that works around clinical shifts when there is no second adult at home.',
        links: [{ label: 'Moving as a single parent', href: '/guides/' + c + '-family#single-parent' },
                { label: immi.label, href: immi.href, external: true }]
      });
    }
    return base;
  }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  /* profession and origin start EMPTY and are required. They used to default to 'nursing'
     and 'uk', pre-selected in their dropdowns, so anyone who did not open them submitted a
     plan asserting they were a nurse from the United Kingdom — facts they never gave. dest
     and stage keep their defaults: both are visible pill pairs, chosen deliberately. */
  var S = { first: '', dest: 'nz', profession: '', origin: '', stage: 'exploring', regStatus: '', party: '', hh: { with: '', work: '', bands: [] }, period: '', routed: false, set: false };

  /* OPERATOR PREVIEW — ?demo=welcome|setup|hub|doing
     This plan is device-local by design, which means the only way to see the returning-user
     states used to be to become a returning user: seed your own browser, then clear it. That
     is fine for a candidate and wrong for anyone building the thing. With ?demo= present the
     page runs on sample data held in memory only: localStorage is neither read nor written,
     so looking at the hub does not turn the person looking into a candidate. Unlinked, and
     inert without the parameter. */
  var DEMO_STATES = { welcome: 1, setup: 1, hub: 1, doing: 1 };
  var demo = (function () {
    var m = /[?&]demo=([a-z]+)/.exec(location.search);
    return m && DEMO_STATES[m[1]] ? m[1] : null;
  })();
  var SAMPLE = {
    first: 'Amara', dest: 'nz', profession: 'imaging', origin: 'uk', stage: 'moving',
    regStatus: 'Registered', party: 'Partner and children', hh: { with: 'both', work: 'health', bands: ['u5', '5to12'] }, period: '3\u20136 months', set: true
  };

  if (demo) {
    if (demo !== 'welcome' && demo !== 'setup') S = Object.assign(S, SAMPLE);
    /* The doing view is a separate file with its own reads and writes. Publish the sample
       so it can honour demo mode as well — without this the harness showed the operator
       her own candidate state while promising it could not, and wrote to her real store
       just by being opened. */
    window.ETHICARE_MOVE_DEMO = SAMPLE;
  } else {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (raw && raw.set) S = Object.assign(S, raw);
    } catch (e) {}
  }

  /* A plan saved before the household questions existed has `party` and no `hh`. Read the
     old answer forward rather than asking again, and never trust the shape of restored JSON. */
  if (!S.hh || typeof S.hh !== 'object') S.hh = { with: '', work: '', bands: [] };
  if (!Array.isArray(S.hh.bands)) S.hh.bands = [];
  if (!S.hh.with && S.party) {
    S.hh.with = { 'On my own': 'alone', 'With a partner': 'partner', 'With children': 'children', 'Partner and children': 'both' }[S.party] || '';
  }

  /* In demo mode nothing is persisted — that is the whole point of it. */
  function save() { if (demo) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function demoBar() {
    if (!demo) return;
    var bar = document.createElement('div');
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:900;display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;' +
      'padding:10px 18px;background:#01312F;color:#FCFBF8;font-family:var(--display),sans-serif;font-size:13px;font-weight:600';
    var states = Object.keys(DEMO_STATES).map(function (k) {
      return k === demo
        ? '<span style="color:#C6E084">' + k + '</span>'
        : '<a href="?demo=' + k + '" style="color:#FCFBF8;text-decoration:underline;text-underline-offset:3px">' + k + '</a>';
    }).join('');
    bar.innerHTML = '<span style="color:#C6E084">Operator preview</span>' +
      '<span style="font-weight:500;opacity:.85">Sample plan, held in memory. Nothing is read from or written to this browser.</span>' +
      '<span style="display:flex;gap:14px;margin-left:auto">' + states +
      '<a href="' + location.pathname + '" style="color:#FCFBF8;text-decoration:underline;text-underline-offset:3px">exit</a></span>';
    document.body.appendChild(bar);
  }

  /* The three answers the dashboard needs and the welcome screen used not to ask for.
     Values match window.MM.V in my-move-model.js so /my-move can read them directly. */
  var REG = ['Not started', 'Gathering documents', 'Application submitted', 'Assessment underway', 'Exam required', 'Registered'];
  var PARTY = ['On my own', 'With a partner', 'With children', 'Partner and children'];
  var PERIOD = ['Within 3 months', '3\u20136 months', '6\u201312 months', '12 months +', 'Not sure yet'];
  function opts(a) { return a.map(function (x) { return { value: x, label: x }; }); }

  /* THE HOUSEHOLD. Asked as three taps rather than one dropdown, because each answer has to
     earn its place by changing the plan: who is coming decides which steps exist, whether a
     partner wants work decides whether a second registration timeline runs alongside yours,
     and the children's ages decide whether that is childcare, school enrolment or university
     fees. `party` is kept in the old vocabulary above so /my-move keeps reading it. */
  var HH = [
    { value: 'alone', label: 'Just me', party: 'On my own' },
    { value: 'partner', label: 'Me and my partner', party: 'With a partner' },
    { value: 'children', label: 'Me and my children', party: 'With children' },
    { value: 'both', label: 'My partner and our children', party: 'Partner and children' }
  ];
  var WORK = [
    { value: 'health', label: 'Yes \u2014 they work in healthcare too' },
    { value: 'other', label: 'Yes \u2014 in another field' },
    { value: 'later', label: 'Not straight away' },
    { value: 'unsure', label: 'Not sure yet' }
  ];
  var BANDS = [
    { value: 'u5', label: 'Under 5' },
    { value: '5to12', label: '5\u201312' },
    { value: '13to17', label: '13\u201317' },
    { value: '18up', label: '18 or over' }
  ];
  function hasPartner() { return S.hh.with === 'partner' || S.hh.with === 'both'; }
  function hasKids() { return S.hh.with === 'children' || S.hh.with === 'both'; }
  function band(v) { return S.hh.bands.indexOf(v) > -1; }
  function schoolAge() { return band('5to12') || band('13to17'); }
  function partyLabel() {
    var h = HH.filter(function (x) { return x.value === S.hh.with; })[0];
    return h ? h.party : '';
  }
  function hhPhrase() {
    if (S.hh.with === 'partner') return 'moving with your partner';
    if (S.hh.with === 'children') return 'moving with your children';
    if (S.hh.with === 'both') return 'moving with your partner and children';
    return '';
  }

  var DATA = function () { return window.ETHICARE_COSTS || window.EthicareCostData || {}; };
  function profOptions() { var p = PROF(); return p ? p.options() : [{ value: 'nursing', label: 'Nursing' }]; }
  function origins() { var f = DATA().flights || {}; return Object.keys(f).map(function (k) { return { value: k, label: f[k].label }; }); }
  function me() { var p = PROF(); return p ? p.forCountry(S.profession, S.dest) : null; }
  function profLabel() { var m = me(); return m ? m.label : 'your profession'; }
  function destLabel() { return S.dest === 'au' ? 'Australia' : 'New Zealand'; }

  /* Has this tool been started on this device? Its own saved state is the
     evidence — the portal never writes to another tool's key. */
  function started(store) {
    if (!store) return false;
    try {
      var v = localStorage.getItem(store);
      if (!v) return false;
      var o = JSON.parse(v);
      if (!o || typeof o !== 'object') return !!v;
      return Object.keys(o).length > 0;
    } catch (e) { return false; }
  }

  /* The doing view (was /my-move) is React; the plan is not. Rather than put React on the
     critical path of a page most people only read, load it the first time the view opens.
     Integrity hashes are the pinned pair used everywhere else on the site. */
  var planner = 'idle';
  function inject(src, integrity, cb) {
    var s = document.createElement('script');
    s.src = src;
    if (integrity) { s.integrity = integrity; s.crossOrigin = 'anonymous'; }
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error(src)); };
    document.head.appendChild(s);
  }
  function loadPlanner() {
    if (planner !== 'idle') return;
    planner = 'loading';
    var chain = [
      ['https://unpkg.com/react@18.3.1/umd/react.development.js', 'sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L'],
      ['https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js', 'sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm'],
      ['https://unpkg.com/@babel/standalone@7.29.0/babel.min.js', 'sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y'],
      ['my-move-model.js', null]
    ];
    var fail = function () { planner = 'idle'; var el = $('[data-planner-fail]'); if (el) el.hidden = false; };
    var step = function (i) {
      if (i === chain.length) return compile();
      inject(chain[i][0], chain[i][1], function (err) { if (err) return fail(); step(i + 1); });
    };
    var compile = function () {
      /* Transform explicitly rather than relying on Babel's auto-scan: a text/babel tag
         added after Babel has already run is never picked up. */
      fetch('my-move-planner.jsx').then(function (r) { return r.text(); }).then(function (code) {
        var out = window.Babel.transform(code, { presets: ['react'] }).code;
        var s = document.createElement('script');
        s.textContent = out;
        document.body.appendChild(s);
        planner = 'ready';
      })['catch'](fail);
    };
    step(0);
  }

  function screen(name) {
    $$('[data-screen]').forEach(function (el) { el.hidden = el.getAttribute('data-screen') !== name; });
    if (name === 'hub') paintHub();
    if (name === 'doing') loadPlanner();
    /* Every screen gets a URL. Without this the landing page was unreachable the moment a
       plan existed — /move went straight to the hub and there was no route back to what
       Ethicare Move actually is, for anyone who wanted to re-read it or send it to a
       colleague. #welcome, #setup and #doing are all linkable; the hub is the bare path. */
    try {
      var frag = { welcome: '#welcome', setup: '#setup', doing: '#doing' }[name] || (location.pathname + location.search);
      history.replaceState(null, '', frag);
    } catch (e) {}
    window.scrollTo(0, 0);
  }

  function pills(host, options, current, onPick, wide) {
    if (!host) return;
    host.innerHTML = options.map(function (o) {
      return '<button class="pt-pill' + (o.value === current ? ' on' : '') + (wide ? ' pt-wide' : '') + '" type="button" data-pick="' + o.value + '">' + esc(o.label) + '</button>';
    }).join('');
    host.onclick = function (e) {
      var b = e.target.closest('[data-pick]');
      if (b) onPick(b.getAttribute('data-pick'));
    };
  }

  function fillSelect(el, options, current, placeholder) {
    if (!el) return;
    var head = placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '';
    el.innerHTML = head + options.map(function (o) { return '<option value="' + o.value + '">' + esc(o.label) + '</option>'; }).join('');
    el.value = current;
  }

  /* The share form is offered ONLY where Ethicare actually recruits that profession in that
     country. Inviting someone to send their plan and then telling them we cannot help is
     worse than never asking: the site is meant to be self-sufficient, so where we are not
     recruiting we say so plainly and leave the tools working rather than collecting a lead
     we cannot act on. */
  function paintSend() {
    var cols = $('[data-send-cols]'), off = $('[data-send-off]');
    if (!cols || !off) return;
    var m = me();
    var canHelp = !!(m && m.available && m.status === 'recruiting');
    cols.hidden = !canHelp;
    off.hidden = canHelp;
    var h = $('[data-send-h]'), note = $('[data-send-note]');
    if (canHelp) {
      if (h) h.textContent = 'Rather we picked this up with you?';
      if (note) note.textContent = 'Send us what you have so far and we will read it before we speak. Nothing goes anywhere until you press send \u2014 and you can see exactly what it contains below.';
      return;
    }
    if (h) h.textContent = 'Can we help you into a role?';
    if (note) note.textContent = 'Honestly, not yet \u2014 so we are not going to ask for your details.';
    var line = $('[data-send-off-line]');
    if (!line) return;
    if (!m || !m.available) {
      line.textContent = 'We recruit into a specific set of professions, and yours is not one we place in ' + destLabel() + ' at the moment. That has no bearing on whether the move is right for you.';
    } else {
      line.textContent = 'We are not recruiting ' + m.label + ' roles in ' + destLabel() + ' yet. You may well find one directly, or through another recruiter, and that is a perfectly good outcome.';
    }
  }

  function profHint() {
    var el = $('[data-profhint]'), m = me();
    if (!el) return;
    if (!m) { el.textContent = ''; return; }
    if (!m.available) { el.textContent = m.label + ' is not a recognised profession in ' + destLabel() + '.'; return; }
    var reg = m.regulated === false ? 'Not on a statutory register there — ' + (m.body || 'the professional body sets eligibility') + '.' : 'Registered by ' + m.body + '.';
    el.textContent = reg + ' ' + (m.status === 'recruiting'
      ? 'We recruit into this profession.'
      : 'We are not recruiting into this one yet — the planner still works end to end.') +
      (m.checkerId === null ? ' Not named in the pathway checker yet, so your plan leads with the regulator.' : '');
  }

  /* The router is the front door: one question, asked before anything else, because the
     answer changes what the whole page is for. Someone with an offer in hand needs a
     relocation service; someone still wondering needs a country. It used to sit fourth in
     the setup form, so the routing happened after the person had already committed to
     filling one in. Answering here also means the stage question in setup arrives
     pre-answered rather than asked twice. */
  function routerScreen() {
    var box = $('[data-router]');
    if (!box) return;
    box.innerHTML = STAGES.map(function (s) {
      return '<button type="button" class="pt-rt" data-stage="' + s.value + '">' +
        '<span class="rt-l">' + esc(s.label) + '</span>' +
        '<span class="rt-b">' + esc(s.blurb) + '</span>' +
        '<span class="rt-g" aria-hidden="true">&rarr;</span></button>';
    }).join('');
  }

  /* Every follow-up appears only once it applies, and disappearing takes its answer with it:
     a partner's work answer left behind after switching to "Just me" would quietly put a
     second registration in the plan of someone moving alone. */
  function paintHousehold() {
    pills($('[data-hhwith]'), HH, S.hh.with, function (v) {
      S.hh.with = v;
      if (!hasPartner()) S.hh.work = '';
      if (!hasKids()) S.hh.bands = [];
      paintHousehold();
    }, true);
    var p = $('[data-hhpartner]'), k = $('[data-hhkids]');
    if (p) p.hidden = !hasPartner();
    if (k) k.hidden = !hasKids();
    if (hasPartner()) pills($('[data-hhwork]'), WORK, S.hh.work, function (v) { S.hh.work = v; paintHousehold(); }, true);
    var bh = $('[data-hhbands]');
    if (!bh || !hasKids()) return;
    bh.innerHTML = BANDS.map(function (b) {
      var on = band(b.value);
      return '<button class="pt-pill' + (on ? ' on' : '') + '" type="button" role="switch" aria-checked="' + on + '" data-band="' + b.value + '">' + esc(b.label) + '</button>';
    }).join('');
    bh.onclick = function (e) {
      var t = e.target.closest ? e.target.closest('[data-band]') : null;
      if (!t) return;
      var v = t.getAttribute('data-band'), i = S.hh.bands.indexOf(v);
      if (i > -1) S.hh.bands.splice(i, 1); else S.hh.bands.push(v);
      paintHousehold();
    };
  }

  /* LINK-BACK, not accounts. A plan given a URL rather than a login: whitelisted plan
     fields only (never PKEY — private notes have no path into a link, same guarantee
     as the share-with-us form) base64'd into ?p=. Opening that URL restores the plan on
     any device, any browser, with no backend and nothing stored anywhere but the link
     itself. This is the two-hour stand-in for accounts, not a replacement for them —
     it proves the demand rather than guessing at it. */
  var LINK_FIELDS = ['first', 'dest', 'profession', 'origin', 'stage', 'regStatus', 'party', 'hh', 'period'];
  function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function savedItems() { try { var o = JSON.parse(localStorage.getItem('ethicare_saved_v1') || '{}'); return (o && o.items) || []; } catch (e) { return []; } }
  function planLink() {
    var o = {}; LINK_FIELDS.forEach(function (k) { o[k] = S[k]; });
    var saved = savedItems();
    if (saved.length) o.sv = saved.map(function (it) { return [it.u, it.t, it.k]; });
    return location.origin + '/move?p=' + b64u(JSON.stringify(o));
  }
  function importFromLink() {
    var m = /[?&]p=([^&]+)/.exec(location.search);
    if (!m) return;
    try {
      var o = JSON.parse(b64d(decodeURIComponent(m[1])));
      var hasExisting = S.set;
      if (!hasExisting || window.confirm('Open this saved plan? It will replace the plan currently on this device.')) {
        LINK_FIELDS.forEach(function (k) { if (o[k] !== undefined) S[k] = o[k]; });
        S.set = true;
        save();
        if (o.sv && o.sv.length) {
          try {
            var cur = JSON.parse(localStorage.getItem('ethicare_saved_v1') || '{"v":1,"items":[]}');
            var have = {}; cur.items.forEach(function (it) { have[it.u] = true; });
            o.sv.forEach(function (row) { if (!have[row[0]]) cur.items.push({ u: row[0], t: row[1], k: row[2], ts: Date.now() }); });
            localStorage.setItem('ethicare_saved_v1', JSON.stringify(cur));
          } catch (e2) {}
        }
      }
    } catch (e) {}
    history.replaceState(null, '', '/move');
  }

  /* THE DOCUMENT. Built entirely in the browser, from data already on this device —
     no network round trip, no server. That is what lets it be the one output allowed to
     include private notes: they never leave localStorage to become this string, so the
     structural guarantee on #private holds. It is therefore NOT what the shareable link
     above sends — that stays notes-free on purpose, because a link can end up on a
     screen you do not control. The document is for downloading or printing on THIS
     device only; say so in the UI, do not conflate the two. */
  function docHTML(forWord) {
    var jr = journey(S.dest);
    var who = (S.first ? esc(S.first) + '\u2019s' : 'Your') + ' plan for ' + esc(destLabel());
    var when = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var meta = esc(profLabel()) + (hhPhrase() ? ', ' + esc(hhPhrase()) : '');
    var c = C(S.dest);
    var guides = [['Moving to ' + destLabel(), '/guides/moving-to-' + c], ['Registration', '/guides/' + c + '-registration'],
      ['Visas and immigration', '/guides/' + c + '-visa'], ['Salary and pay', '/guides/' + c + '-salary'],
      ['How healthcare works', '/guides/' + c + '-healthcare'], ['Bringing your family', '/guides/' + c + '-family']];
    var saved = savedItems();
    var next = (TOOL[(STAGES.filter(function (x) { return x.value === S.stage; })[0] || STAGES[0]).next] || TOOL.pathway).note;
    /* Private notes are deliberately NOT in this document, in either mode: a downloaded
       file is portable in a way localStorage is not — it can sync to cloud storage, sit
       in a shared Downloads folder, or be forwarded by accident. Private notes stay only
       in the panel on this page. */

    if (forWord) {
      /* Word cannot render flexbox/grid or most CSS — the "HTML saved as .doc" trick only
         survives simple block markup and inline styles. Tables stand in for layout. */
      var td = 'style="padding:14px 18px;border-bottom:1px solid #EBDFD3"';
      var out = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>" + who + "</title></head>" +
        '<body style="font-family:Calibri,Arial,sans-serif;color:#222;font-size:11pt;line-height:1.6;margin:0">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#02615D"><tr><td style="padding:34px 40px">' +
        '<div style="width:22px;height:3px;background:#A6C84A;margin-bottom:14px"></div>' +
        '<div style="font-family:Georgia,serif;font-size:26px;color:#fff;margin-bottom:6px">' + who + '</div>' +
        '<div style="color:#EFC3AA;font-size:12pt">' + meta + ' &middot; ' + when + '</div>' +
        '</td></tr></table>' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr><td style="padding:0 40px 40px">';
      out += '<h2 style="font-family:Calibri,Arial,sans-serif;font-size:15pt;color:#02615D;border-bottom:2px solid #A6C84A;padding-bottom:6px;margin:28px 0 14px">Your journey</h2>';
      jr.forEach(function (st) {
        out += '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:2px"><tr>' +
          '<td width="6" style="background:#A6C84A"></td><td ' + td + '>' +
          '<div style="font-weight:bold;color:#02615D">' + esc(st.title) + '</div>' +
          '<div style="font-size:9pt;color:#A34438;text-transform:uppercase;letter-spacing:.06em;margin:2px 0 6px">' + esc(st.stage) + '</div>' +
          '<div>' + esc(st.note) + '</div></td></tr></table>';
      });
      out += '<h2 style="font-family:Calibri,Arial,sans-serif;font-size:15pt;color:#02615D;border-bottom:2px solid #A6C84A;padding-bottom:6px;margin:28px 0 14px">Guides matched to your answers</h2><table width="100%" cellpadding="0" cellspacing="0">';
      guides.forEach(function (g) { out += '<tr><td ' + td + '><a href="' + location.origin + g[1] + '" style="color:#02615D;font-weight:bold;text-decoration:none">' + esc(g[0]) + '</a><br><span style="color:#555;font-size:9pt">' + location.origin + g[1] + '</span></td></tr>'; });
      out += '</table>';
      if (saved.length) {
        out += '<h2 style="font-family:Calibri,Arial,sans-serif;font-size:15pt;color:#02615D;border-bottom:2px solid #A6C84A;padding-bottom:6px;margin:28px 0 14px">Pages you saved</h2><table width="100%" cellpadding="0" cellspacing="0">';
        saved.forEach(function (it) { out += '<tr><td ' + td + '><a href="' + location.origin + it.u + '" style="color:#02615D;font-weight:bold;text-decoration:none">' + esc(it.t) + '</a></td></tr>'; });
        out += '</table>';
      }
      out += '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px"><tr><td style="background:#F7F4EE;padding:20px 24px">' +
        '<div style="font-weight:bold;color:#02615D;margin-bottom:6px">Next step</div><div>' + esc(next) + '</div></td></tr></table>';
      out += '</td></tr></table></body></html>';
      return out;
    }

    /* Browser view: full brand system — deep teal cover with the lime eyebrow rule,
       cream body, cards for each journey step, a real guide grid, print styles so this
       doubles as the save-to-PDF path. */
    var o2 = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + who + '</title>' +
      '<style>*{box-sizing:border-box}body{margin:0;background:#FCFBF8;color:#333;font-family:Manrope,system-ui,sans-serif;line-height:1.65}' +
      'h2{font-family:"Work Sans",sans-serif;color:#02615D;font-size:20px;margin:0 0 16px}' +
      '.cover{background:#02615D;color:#fff;padding:clamp(32px,5vw,56px) clamp(24px,5vw,56px)}' +
      '.cover .rule{width:26px;height:3px;background:#A6C84A;margin-bottom:16px}' +
      '.cover h1{font-family:Georgia,serif;font-weight:600;font-size:clamp(28px,4vw,40px);margin:0 0 8px}' +
      '.cover .meta{color:#EFC3AA;font-size:15px}' +
      '.wrap{max-width:760px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(20px,4vw,32px) 60px}' +
      'section{margin-bottom:38px}' +
      '.step{display:grid;grid-template-columns:4px 1fr;gap:16px;background:#fff;border:1px solid #EBDFD3;border-radius:12px;overflow:hidden;margin-bottom:10px}' +
      '.step .bar{background:#A6C84A}.step .body{padding:16px 20px 16px 4px}' +
      '.step .stage{font-family:"Work Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#A34438;margin-bottom:4px}' +
      '.step .t{font-family:"Work Sans",sans-serif;font-weight:600;color:#02615D;margin-bottom:6px;font-size:16px}' +
      '.glist{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}' +
      '.glist a{display:block;background:#fff;border:1px solid #EBDFD3;border-radius:10px;padding:14px 16px;color:#02615D;font-weight:600;text-decoration:none;font-size:14.5px}' +
      '.glist a:hover{border-color:#02615D}' +
      '.next{background:#F7F4EE;border-radius:14px;padding:22px 26px}.next .k{font-family:"Work Sans",sans-serif;font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#2F5E49;margin-bottom:8px}' +
      '.printbar{max-width:760px;margin:14px auto 0;padding:0 clamp(20px,4vw,32px);text-align:right}' +
      '.printbar button{font-family:"Work Sans",sans-serif;font-weight:600;font-size:13.5px;color:#02615D;background:#fff;border:1.5px solid rgba(2,97,93,.35);border-radius:8px;padding:9px 16px;cursor:pointer}' +
      '@media print{.printbar{display:none}body{background:#fff}.step,.glist a{border-color:#ddd}}</style></head><body>' +
      '<div class="cover"><div class="rule"></div><h1>' + who + '</h1><div class="meta">' + meta + ' &middot; ' + when + '</div></div>' +
      '<div class="printbar"><button onclick="print()">Print or save as PDF</button></div>' +
      '<div class="wrap"><section><h2>Your journey</h2>';
    jr.forEach(function (st) {
      o2 += '<div class="step"><div class="bar"></div><div class="body"><div class="stage">' + esc(st.stage) + '</div><div class="t">' + esc(st.title) + '</div><div>' + esc(st.note) + '</div></div></div>';
    });
    o2 += '</section><section><h2>Guides matched to your answers</h2><div class="glist">';
    guides.forEach(function (g) { o2 += '<a href="' + location.origin + g[1] + '">' + esc(g[0]) + '</a>'; });
    o2 += '</div></section>';
    if (saved.length) {
      o2 += '<section><h2>Pages you saved</h2><div class="glist">';
      saved.forEach(function (it) { o2 += '<a href="' + location.origin + it.u + '">' + esc(it.t) + '</a>'; });
      o2 += '</div></section>';
    }
    o2 += '<section><div class="next"><div class="k">Next step</div><div>' + esc(next) + '</div></div></section></div></body></html>';
    return o2;
  }
  function setupScreen() {
    fillSelect($('#ptProf'), profOptions(), S.profession, 'Select your profession\u2026');
    fillSelect($('#ptOrigin'), origins(), S.origin, 'Select where you are now\u2026');
    fillSelect($('#ptReg'), opts(REG), S.regStatus || REG[0]);
    paintHousehold();
    fillSelect($('#ptWhen'), opts(PERIOD), S.period || PERIOD[4]);
    var fn = $('#ptFirst'); if (fn) fn.value = S.first || '';
    pills($('[data-destpills]'), [{ value: 'nz', label: 'New Zealand' }, { value: 'au', label: 'Australia' }], S.dest, function (v) {
      S.dest = v; setupScreen();
    });
    /* Answered at the front door, so the field is hidden rather than asked twice — but it
       stays in the DOM and stays changeable from the plan afterwards. `routed` is set only
       by a router tap, never by demo states or a restored plan. */
    var stageF = $('[data-stagefield]');
    if (stageF) stageF.hidden = !!S.routed;
    pills($('[data-stagepills]'), STAGES, S.stage, function (v) { S.stage = v; setupScreen(); }, true);
    profHint();
    paintSend();
  }

  /* Every healthcare profession, grouped, with this candidate's own lifted to
     the top of its group and marked. Status is read from the catalogue, so a
     profession only says "we recruit into this" when a page actually exists. */
  function paintCoverage() {
    var host = $('[data-coverage]'), p = PROF();
    if (!host || !p) return;
    var rows = p.list().map(function (x) { return p.forCountry(x.key, S.dest); })
      .filter(function (x) { return x && x.available && x.key !== 'other'; });
    var rec = rows.filter(function (r) { return r.status === 'recruiting'; }).length;

    var note = $('[data-covnote]');
    if (note) note.textContent = 'Ethicare Moves works for every one of these. We currently recruit into ' + rec +
      ' of them in ' + destLabel() + '; the rest are marked coming soon, which means the planning tools work but we cannot yet find you a role. Regulators checked ' + p.checked + '.';

    var groups = [];
    rows.forEach(function (r) {
      var g = groups.filter(function (x) { return x.name === r.group; })[0];
      if (!g) { g = { name: r.group, items: [] }; groups.push(g); }
      g.items.push(r);
    });

    host.innerHTML = groups.map(function (g) {
      var items = g.items.slice().sort(function (a, b) { return (b.key === S.profession) - (a.key === S.profession); });
      return '<p class="pt-cgrp">' + esc(g.name) + '</p>' + items.map(function (r) {
        var mine = r.key === S.profession;
        var reg = r.regulated === false
          ? 'Not on a statutory register &mdash; ' + esc(r.body)
          : 'Registered by ' + esc(r.body);
        var acts = [];
        if (r.page) acts.push('<a href="' + r.page + '">Roles and pay &rarr;</a>');
        if (r.href) acts.push('<a href="' + r.href + '" target="_blank" rel="noopener">Regulator &rarr;</a>');
        acts.push('<span class="pt-chip ' + (r.status === 'recruiting' ? 'rec">Recruiting now' : 'soon">Coming soon') + '</span>');
        return '<div class="pt-crow' + (mine ? ' mine' : '') + '">' +
          '<div><b>' + esc(r.label) + (mine ? '<span class="pt-yours">Yours</span>' : '') + '</b>' +
          '<span class="reg">' + reg + '</span></div>' +
          '<div class="pt-cacts">' + acts.join('') + '</div></div>';
      }).join('');
    }).join('');
  }

  /* PRIVATE STORE. Its own key, deliberately not part of S: the share form reads named
     fields from the plan key only, so nothing typed here has a route to us even if
     someone later adds a field carelessly. Structural, not a setting. */
  var PKEY = 'ethicare_private_v1';
  var PF = [['pvOffer', 'offer'], ['pvSalary', 'salary'], ['pvFloor', 'floor'], ['pvDate', 'date'], ['pvNotes', 'notes']];
  function pread() { try { return JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { return {}; } }
  function pwrite(o) { if (demo) return; try { localStorage.setItem(PKEY, JSON.stringify(o)); } catch (e) {} }
  function psaid(msg) { var el = $('[data-psaved]'); if (el) el.textContent = msg; }
  function paintPrivate() {
    var o = pread(), any = false, t;
    PF.forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (!el) return;
      el.value = o[p[1]] || '';
      if (el.value) any = true;
      if (el.getAttribute('data-pwired')) return;
      el.setAttribute('data-pwired', '1');
      el.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          var cur = pread();
          cur[p[1]] = el.value;
          pwrite(cur);
          psaid('Saved on this device \u00b7 ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        }, 400);
      });
    });
    if (any) psaid('Kept on this device only');
  }

  function paintHub() {
    var d = DATA();
    var reg = d.registration && d.registration[S.dest] ? (d.registration[S.dest][S.profession] || d.registration[S.dest].other) : null;
    var stageDef = STAGES.filter(function (x) { return x.value === S.stage; })[0] || STAGES[0];
    var nextTool = TOOL[stageDef.next] || TOOL.pathway;

    $('[data-eyebrow]').textContent = destLabel() + ' · ' + profLabel();
    /* Greet in the language of the country they are heading to, not ours — "Kia ora" to
       someone moving to Perth is the wrong country's welcome. */
    var hi = S.dest === 'au' ? 'Hello' : 'Kia ora';
    $('[data-greeting]').textContent = S.first ? hi + ', ' + S.first : hi;
    $('[data-hubintro]').textContent = 'Everything below is shaped by what you told us — ' + profLabel().toLowerCase() +
      ', heading to ' + destLabel() + (hhPhrase() ? ', ' + hhPhrase() : '') + '. Change any of it at the foot of this page.';

    var nx = $('[data-next]');
    nx.setAttribute('href', nextTool.href);
    $('[data-nexttitle]').textContent = nextTool.title;
    $('[data-nextnote]').textContent = nextTool.note;
    var mNext = me();
    if (nextTool === TOOL.pathway && mNext && mNext.available && mNext.checkerId === null) {
      $('[data-nextnote]').textContent = 'The checker does not cover ' + mNext.label.toLowerCase() +
        ' by name yet — it will give you the general route, and your regulator is linked in the registration step below.';
    }

    /* the journey, with the saved stage marked and started tools flagged. `here` is found by
       key rather than by index: household steps are spliced in, so a fixed number would put
       "You are here" on the wrong step the moment someone said they were bringing anyone. */
    var jr = journey(S.dest);
    var here = 0;
    for (var hi = 0; hi < jr.length; hi++) { if (jr[hi].key === (stageDef.atKey || 'fit')) { here = hi; break; } }
    /* stages, printed once where they change — three headers across six steps, so the
       plan reads as a roadmap rather than six equal cards. Same wording as /resources. */
    var seenStage = '';
    $('[data-steps]').innerHTML = jr.map(function (st, i) {
      var isNow = i === here;
      var t = st.tool ? TOOL[st.tool] : null;
      /* Badge cascade, ordered deliberately. Reading steps are tested BEFORE `i < here`
         because they are never behind you — they have no tool to have finished, and the
         household steps splice in at earlier positions on purpose, so an index test told a
         candidate their partner's registration and their child's school place were already
         history. `isNow` also wins over `started`, or the plan never says "You are here"
         once the current step's tool has been opened. */
      var badge = 'Not started', cls = '';
      if (isNow) { badge = 'You are here'; cls = ' now'; }
      else if (t && started(t.store)) { badge = 'Started'; cls = ' live'; }
      else if (!st.tool) { badge = 'Reading'; }
      else if (i < here) { badge = 'Behind you'; }
      var links = st.links.slice();
      var note = st.note;
      if (st.key === 'fit') {
        var m = me();
        if (m && m.page) links.unshift({ label: profLabel() + ' in ' + destLabel(), href: m.page });
      }
      if (st.key === 'registration') {
        var mr = me();
        /* The checker's profession list is narrower than this catalogue on purpose — a
           pathway needs verified rules. Where it has no entry, lead with the regulator
           rather than sending someone to a tool that cannot name their profession. */
        if (mr && mr.available && mr.checkerId === null) {
          links = links.filter(function (l) { return l.href.indexOf('/pathway-checker') !== 0; });
          if (mr.href) links.unshift({ label: 'Your regulator: ' + String(mr.body || '').replace(/^the /, ''), href: mr.href, external: true });
          links.push({ label: 'Ask us to map your route', href: '/contact' });
          note += ' The pathway checker does not cover ' + mr.label.toLowerCase() +
            ' by name yet, so this starts with your regulator instead — and tell us, because we will map the route with you.';
        }
        if (mr && mr.docs.length) links = links.concat(mr.docs.map(function (d, i) {
          return { label: /checklist/i.test(d) ? 'Application checklist (PDF)' : 'Our registration guide (PDF)', href: d, external: true };
        }));
      }
      var head = '';
      if (st.stage && st.stage !== seenStage) { seenStage = st.stage; head = '<p class="pt-stagehead">' + esc(st.stage) + '</p>'; }
      return head + '<div class="pt-step' + (isNow ? ' now' : '') + '">' +
        '<span class="pt-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<div><div class="pt-ttl"><h3>' + esc(st.title) + '</h3><span class="pt-badge' + cls + '">' + badge + '</span></div>' +
        '<p>' + esc(note) + '</p><div class="pt-links">' +
        links.map(function (l) {
          return '<a href="' + l.href + '"' + (l.external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l.label) + ' &rarr;</a>';
        }).join('') + '</div></div></div>';
    }).join('');

    /* tools, each showing whether it has been started */
    $('[data-tools]').innerHTML = Object.keys(TOOL).filter(function (k) { return TOOL[k].store; }).map(function (k) {
      var t = TOOL[k], on = started(t.store);
      return '<div class="pt-row"><div><b>' + esc(t.title) + '</b><span class="body">' + esc(t.note) + '</span></div>' +
        '<a class="pt-tag' + (on ? ' on' : '') + '" href="' + t.href + '">' + (on ? 'Continue' : 'Open') + '</a></div>';
    }).join('');

    var c = C(S.dest);
    var guideList = [
      { label: 'Moving to ' + destLabel(), href: '/guides/moving-to-' + c },
      { label: 'Registration', href: '/guides/' + c + '-registration' },
      { label: 'Visas and immigration', href: '/guides/' + c + '-visa' },
      { label: 'Salary and pay', href: '/guides/' + c + '-salary' },
      { label: 'How healthcare works', href: '/guides/' + c + '-healthcare' },
      { label: 'Bringing your family', href: '/guides/' + c + '-family' },
      { label: 'Living and thriving', href: '/guides/living-in-' + c }
    ];
    if (hasKids()) guideList.splice(6, 0, { label: 'Schools and education', href: '/guides/' + c + '-education' });
    $('[data-guides]').innerHTML = guideList.map(function (g) { return '<a href="' + g.href + '">' + esc(g.label) + ' &rarr;</a>'; }).join('');

    var m = me();
    if (m && !m.available) {
      $('[data-regline]').textContent = m.label + ' is not a recognised profession in ' + destLabel() + '. Pick the other country, or choose the profession closest to yours.';
    } else if (m && m.body) {
      $('[data-regline]').textContent = m.regulated === false
        ? m.label + ' is not on a statutory register in ' + destLabel() + '. ' + (m.note || 'Eligibility runs through the professional body rather than a government register.')
        : 'For ' + profLabel().toLowerCase() + ' in ' + destLabel() + ', registration runs through ' + m.body + '.' + (m.note ? ' ' + m.note : '');
    } else {
      $('[data-regline]').textContent = 'Set your profession below and we will show the right regulator.';
    }
    var rh = $('[data-reghref]');
    rh.setAttribute('href', m && m.href ? m.href : '/pathway-checker');
    paintCoverage();
    paintPrivate();

    /* the details panel mirrors the setup controls */
    var profs = profOptions();
    pills($('[data-destpills2]'), [{ value: 'nz', label: 'New Zealand' }, { value: 'au', label: 'Australia' }], S.dest, function (v) {
      S.dest = v; save(); paintHub();
    });
    fillSelect($('#ptProf2'), profs, S.profession);
    fillSelect($('#ptStage2'), STAGES.map(function (x) { return { value: x.value, label: x.label }; }), S.stage);
    paintSend();
  }

  function route() {
    if (demo) return screen(demo);
    var h = location.hash;
    if (h === '#welcome') return screen('welcome');
    if (h === '#setup') return screen('setup');
    if (!S.set) return;
    screen(h === '#doing' ? 'doing' : 'hub');
  }

  function init() {
    importFromLink();
    routerScreen();
    setupScreen();
    demoBar();
    window.addEventListener('hashchange', route);
    if (demo) {
      screen(demo);
    } else if (S.set) {
      route();
    } else {
      screen('welcome');
      /* if any tool has been used, say so rather than pretending it is a cold start */
      var any = Object.keys(TOOL).filter(function (k) { return started(TOOL[k].store); });
      if (any.length) {
        var n = $('[data-returning]');
        n.hidden = false;
        n.textContent = any.length === 1
          ? 'You have already started one of our tools on this device. Set up a plan and it will show here.'
          : 'You have already started ' + any.length + ' of our tools on this device. Set up a plan and they will show here.';
      }
    }

    document.addEventListener('click', function (e) {
      /* Scoped to .pt-rt so this only ever matches the five front-door buttons. The setup
         stage pills use data-pick, not data-stage, so there is no collision today — the
         scoping is here to keep it that way if data-stage is reused elsewhere. */
      var rt = e.target.closest ? e.target.closest('.pt-rt[data-stage]') : null;
      if (rt) {
        S.stage = rt.getAttribute('data-stage');
        S.routed = true;
        if (window.track) window.track('move_setup_started', { stage: S.stage });
        setupScreen();
        screen('setup');
        return;
      }
      var t = e.target.closest ? e.target.closest('[data-go],[data-save],[data-clear],[data-pclear],[data-getlink],[data-linkcopy],[data-doc]') : null;
      if (!t) return;
      if (t.hasAttribute('data-go')) { screen(t.getAttribute('data-go')); return; }
      if (t.hasAttribute('data-save')) {
        var err = $('[data-err]');
        var prof = $('#ptProf').value, orig = $('#ptOrigin').value;
        /* Two answers the plan cannot honestly invent. Everything else has a visible,
           deliberate default; these two would otherwise be assumed silently. */
        var missing = [];
        if (!prof) missing.push('your profession');
        if (!orig) missing.push('where you are now');
        if (missing.length) {
          err.hidden = false;
          err.textContent = 'We need ' + missing.join(' and ') + ' before we can build the plan \u2014 everything below is shaped by them.';
          var focusEl = !prof ? $('#ptProf') : $('#ptOrigin');
          if (focusEl && focusEl.focus) focusEl.focus();
          return;
        }
        err.hidden = true;
        S.profession = prof;
        S.origin = orig;
        if (window.track) window.track('move_setup_completed', {
          country: S.dest, profession: prof, stage: S.stage, timeline: S.period
        });
        S.regStatus = $('#ptReg').value;
        S.party = partyLabel();
        if (window.track) window.track('move_household_set', {
          household: S.hh.with || 'unanswered',
          partnerWork: S.hh.work || 'n/a',
          ages: S.hh.bands.slice().sort().join('|') || 'n/a'
        });
        S.period = $('#ptWhen').value;
        /* Optional, and asked last: a first name makes the plan read as the reader's own.
           Never required, never a gate — nothing is withheld if it is left blank, and it
           stays on the device with the rest of the answers. */
        var fEl = $('#ptFirst');
        S.first = fEl ? fEl.value.trim().split(/\s+/)[0].slice(0, 24) : '';
        S.set = true;
        save();
        screen('hub');
        return;
      }
      if (t.hasAttribute('data-pclear')) {
        if (!window.confirm('Delete your private notes from this device? We never had a copy, so this cannot be undone.')) return;
        try { localStorage.removeItem(PKEY); } catch (e3) {}
        PF.forEach(function (p) { var el = document.getElementById(p[0]); if (el) el.value = ''; });
        psaid('Deleted from this device');
        return;
      }
      if (t.hasAttribute('data-doc')) {
        var mode = t.getAttribute('data-doc');
        if (mode === 'view') {
          var w = window.open('', '_blank');
          if (w) { w.document.open(); w.document.write(docHTML(false)); w.document.close(); }
        } else {
          var blob = new Blob([docHTML(true)], { type: 'application/msword' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = 'Ethicare-Move-Plan.doc';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        }
        if (window.track) window.track('move_doc_generated', { mode: mode });
        return;
      }
      if (t.hasAttribute('data-getlink')) {
        var link = planLink();
        var box = $('[data-linkbox]'), out = $('[data-linkout]');
        if (out) out.value = link;
        if (box) box.hidden = false;
        var mailBtn = $('[data-linkmail]');
        if (mailBtn) mailBtn.href = 'mailto:?subject=' + encodeURIComponent('My Ethicare Move plan') +
          '&body=' + encodeURIComponent('Here is the link back to my plan and saved guides on Ethicare Move:\n\n' + link + '\n\nOpening it on any device or browser will bring your plan and saved pages up exactly as you left them.\n\nYour own private notes (any offer you are weighing, your numbers) stay on this device only and are never in this link.');
        if (window.track) window.track('move_link_generated', {});
        return;
      }
      if (t.hasAttribute('data-linkcopy')) {
        var src = $('[data-linkout]');
        if (src) { src.select(); try { document.execCommand('copy'); } catch (e4) {} }
        var msg = $('[data-linkcopied]');
        if (msg) { msg.textContent = 'Copied'; setTimeout(function () { msg.textContent = ''; }, 2000); }
        return;
      }
      if (t.hasAttribute('data-clear')) {
        if (!window.confirm('Clear your plan from this device? Your progress in the individual tools is kept.')) return;
        try { localStorage.removeItem(KEY); } catch (e2) {}
        S = { first: '', dest: 'nz', profession: '', origin: '', stage: 'exploring', regStatus: '', party: '', hh: { with: '', work: '', bands: [] }, period: '', routed: false, set: false };
        setupScreen();
        screen('welcome');
      }
    });

    document.addEventListener('change', function (e) {
      if (e.target.id === 'ptProf2') { S.profession = e.target.value; save(); paintHub(); }
      if (e.target.id === 'ptStage2') { S.stage = e.target.value; save(); paintHub(); }
      if (e.target.id === 'ptProf') { S.profession = e.target.value; profHint(); }
      if (e.target.id === 'ptOrigin') { S.origin = e.target.value; }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
