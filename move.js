/* ETHICARE MOVE — the public journey, one page, eight stages.
   Rebuilt 29 Sep 2026 on the one journey (questions.json → journey.js).

   What this page is: the free, no-account planner for anyone considering New Zealand or
   Australia. What it is not: My Move, the private space for Ethicare candidates — that is
   reached from the link the team sends and lives elsewhere. The React planner that used to
   load at #doing is gone from here.

   How it works, and the rules it follows (Sophie, 28–29 Sep 2026):
     · the candidate's answers live in ONE place — candidate-context.js, the same store every
       tool reads (`ethicare_portal_v1`). The strip at the top shows them and changes them;
       this page never asks what has already been answered;
     · one stage open at a time — the one the candidate is at — the other seven collapsed to
       a title and a status. Any stage opens on a tap; none is hidden;
     · the remaining questions are asked inside the stage that needs them: whether a partner
       works in health at stage 3, the children's ages at stage 5. Never up front;
     · "already sorted" skips a stage without losing it;
     · 'both' is a real destination answer: the links come for both countries, labelled.

   Kept from the previous version, unchanged in purpose: the shareable plan link (no account,
   the link carries the answers), the plan as a document (print / Word), send-my-plan to the
   team, the saved-pages file (mymove.js), and the household logic — partner registration,
   schools before the lease, the single-parent step. */
(function () {
  var KEY = 'ethicare_portal_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var ctx = window.EthicareContext;
  var J = function () { return window.ETHICARE_JOURNEY || []; };
  var PROF = function () { return window.ETHICARE_PROFESSIONS; };
  var DATA = function () { return window.ETHICARE_COSTS || window.EthicareCostData || {}; };
  var C = function (d) { return d === 'au' ? 'australia' : 'new-zealand'; };
  var CN = function (d) { return d === 'au' ? 'Australia' : 'New Zealand'; };

  /* Each tool, its page, and the localStorage key it writes — that key is how the page
     knows whether you have actually started it. */
  var TOOL = {
    pathway: { title: 'Check your registration pathway', href: '/pathway-checker', store: 'ethicare_pathway_checker_draft_v1',
      note: 'The first question worth answering \u2014 start it early and the rest of the move has room.' },
    earn: { title: 'See what you could earn', href: '/is-it-worth-it', store: null,
      note: 'The published scales, what varies on top, and what is left after tax and rent.' },
    cost: { title: 'Work out what the move will cost', href: '/cost-calculator', store: 'ethicare_cost_calculator_v1',
      note: 'What the whole move costs, what your employer covers, and what you need in the bank before you fly.' },
    live: { title: 'Explore where you could live', href: '/where-would-we-live', store: null,
      note: 'Cities and regions, and the trade-offs between them — written for the whole household.' },
    cv: { title: 'Write your CV', href: '/build-your-cv', store: 'ethicare-cv-builder-v1',
      note: 'The nine sections a reader wants, with the document building underneath as you type.' },
    interview: { title: 'Get ready to apply', href: '/interview-prep', store: 'ethicare-interview-prep-v1',
      note: 'A readiness check, plus the questions panels ask and somewhere to work up your own examples.' },
    offer: { title: 'Review your offer', href: '/before-you-accept', store: 'ethicare_offer_check_v1',
      note: 'What you have been offered, and the questions still worth putting to the employer.' },
    checklist: { title: 'Organise the move itself', href: '/moving-checklist', store: 'ethicare_moving_checklist_v1',
      note: 'Everything to arrange before you go, filtered to your household.' },
    first30: { title: 'Your first thirty days', href: '/guides/new-zealand-first-month', store: null,
      note: 'The paperwork in the order it needs doing, the first days on the unit, and the ordinary things that make a place yours.' }
  };
  function tool(key, d) {
    var t = TOOL[key] || TOOL.pathway;
    if (key === 'first30' && d === 'au') return { title: 'Living and thriving in Australia', href: '/guides/living-in-australia', store: null, note: t.note };
    return t;
  }
  function started(store) { if (!store) return false; try { return !!localStorage.getItem(store); } catch (e) { return false; } }

  /* ---------------- state: the shared answers, plus this page's own ------------------
     dest / profession / household / stage are read through candidate-context.js. This page
     keeps three things of its own in the same store: hh.work (does the partner work in
     health), hh.bands (children's ages), first (a first name, optional), and done (stages
     marked as sorted). */
  var S = { first: '', origin: '', hh: { with: '', work: '', bands: [] }, done: {}, set: false };
  function load() {
    try { var raw = JSON.parse(localStorage.getItem(KEY) || '{}'); if (raw && typeof raw === 'object') S = raw; } catch (e) {}
    if (!S.hh || typeof S.hh !== 'object') S.hh = { with: '', work: '', bands: [] };
    if (!Array.isArray(S.hh.bands)) S.hh.bands = [];
    if (S.hh.with === 'kids') S.hh.with = 'children';
    if (!S.done || typeof S.done !== 'object') S.done = {};
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var dest = function () { return ctx ? ctx.destMode() : ''; };
  var oneDest = function () { return ctx ? ctx.dest() : ''; };
  var hh = function () { return ctx ? ctx.household() : ''; };
  function hasPartner() { var v = hh(); return v === 'partner' || v === 'both'; }
  function hasKids() { var v = hh(); return v === 'children' || v === 'both'; }
  function band(v) { return S.hh.bands.indexOf(v) > -1; }
  function schoolAge() { return band('5to12') || band('13to17'); }
  var BANDS = [{ value: 'u5', label: 'Under 5' }, { value: '5to12', label: '5–12' }, { value: '13to17', label: '13–17' }, { value: '18up', label: '18 or over' }];
  var WORK = [{ value: 'health', label: 'Yes — they work in healthcare too' }, { value: 'other', label: 'Yes — in another field' }, { value: 'later', label: 'Not straight away' }, { value: 'unsure', label: 'Not sure yet' }];
  function hhPhrase() { return ctx ? ctx.householdPhrase() : ''; }
  function profLabel() { return ctx ? (ctx.professionLabel() || ctx.profession()) : ''; }
  function destLabel() { return ctx ? (ctx.destLabel() || 'New Zealand or Australia') : ''; }

  /* The visa note used to say "Your employer sponsors you, so this follows the offer" to
     everyone. True for the route most candidates take — an Accredited Employer Work Visa in
     New Zealand, a 482 in Australia — and wrong for a Green List profession applying Straight
     to Residence, which does not wait on an offer at all. Those are the professions Ethicare
     places most, so the page was telling its core audience the wrong order for their own move
     (Sophie, 1 Oct 2026). Named per country, because a New Zealand candidate has no use for
     the 482 and the reverse. Neither route is promised: which one applies is the regulator's
     and the employer's to say, and the pathway checker is where it is worked out. */
  function visaNote() {
    var d = dest();
    var common = d === 'nz'
      ? 'Most people we place come on an Accredited Employer Work Visa, sponsored by the employer, so it follows the offer.'
      : d === 'au'
        ? 'Most people we place come on a 482, sponsored by the employer, so it follows the offer.'
        : 'Most people we place come on an employer-sponsored visa \u2014 an Accredited Employer Work Visa in New Zealand, a 482 in Australia \u2014 so it follows the offer.';
    var other = (d === 'au')
      ? ''
      : ' Some professions on New Zealand\u2019s Green List can apply for residence without waiting for a job offer, which changes the order entirely \u2014 worth checking against your own occupation early.';
    return common + other + ' Either way: which visa, what it costs for everyone coming, and how long it realistically takes.';
  }
  function me() { var p = PROF(), d = oneDest(), k = ctx && ctx.profession(); return (p && d && k) ? p.forCountry(k, d) : null; }
  function origins() { var f = DATA().flights || {}; return Object.keys(f).map(function (k) { return { value: k, label: f[k].label }; }); }
  function savedItems() { try { var o = JSON.parse(localStorage.getItem('ethicare_saved_v1') || '{}'); return (o && o.items) || []; } catch (e) { return []; } }

  /* ---------------- the eight stages, with this candidate's content ---------------- */
  function forCountries(fn) {
    /* fn(d, c) → links for one country. With 'both', run it for each and label the links. */
    var d = dest();
    if (d === 'nz' || d === 'au') return fn(d, C(d));
    if (d === 'both') {
      var a = fn('nz', 'new-zealand').map(function (l) { return { label: 'NZ · ' + l.label, href: l.href, external: l.external }; });
      var b = fn('au', 'australia').map(function (l) { return { label: 'AU · ' + l.label, href: l.href, external: l.external }; });
      return a.concat(b);
    }
    return null; // no destination yet: the caller supplies country-free links
  }
  function immi(d) {
    return d === 'au' ? { label: 'Department of Home Affairs', href: 'https://immi.homeaffairs.gov.au/', external: true }
                      : { label: 'Immigration New Zealand', href: 'https://www.immigration.govt.nz/', external: true };
  }

  function stages() {
    var d = dest(), single = (d === 'nz' || d === 'au'), c = single ? C(d) : '';
    var out = [];
    J().forEach(function (j) {
      var st = { n: j.n, id: j.id, label: j.there, where: j.where, items: [], ask: null };
      switch (j.id) {
        case 'imagine':
          st.items.push({ title: 'Deciding', note: 'Before anything practical. What the country is like to live in, what your profession looks like there, and whether the people coming with you want it too.',
            links: forCountries(function (dd) { return [{ label: 'Working in ' + CN(dd), href: '/' + C(dd) }, { label: 'Why people move, and what they miss', href: '/guides/why-people-move' }]; })
              || [{ label: 'Working in New Zealand', href: '/new-zealand' }, { label: 'Working in Australia', href: '/australia' }, { label: 'Why people move, and what they miss', href: '/guides/why-people-move' }] });
          st.items.push({ title: 'What the move was like', note: 'Real people, real places, imperfect details.', links: [{ label: 'Stories from people who moved', href: '/insights' }] });
          break;
        case 'choose':
          st.items.push({ title: 'Australia or New Zealand?', note: single
              ? 'You have chosen ' + CN(d) + '. If you are still weighing it up, the comparison is one page and it is candid about both.'
              : 'Two countries, two regulators, two pay systems and a very different sense of scale. Nobody should choose from a job advert.',
            links: [{ label: 'Compare the two countries', href: '/guides/australia-vs-new-zealand' }, { label: 'Pay compared', href: '/guides/australia-vs-new-zealand-salary' }].concat(
              forCountries(function (dd) { return [{ label: CN(dd) + ' destination guides', href: dd === 'au' ? '/destinations/australia' : '/destinations/' }]; }) || [{ label: 'All destination guides', href: '/destinations/' }]) });
          break;
        case 'work':
          st.items.push({ title: 'Registration', tool: 'pathway',
            note: 'Whether you can register, by which route, and how long it takes. Starting registration early gives you more time to plan the rest of your move. It is more than your qualification: certificates of good standing, English, character and health checks all sit here.',
            links: (forCountries(function (dd, cc) { return [{ label: 'Registration guide', href: '/guides/' + cc + '-registration' }]; }) || []).concat([{ label: 'Everything registration asks of you', href: '/can-i-work-there' }]) });
          if (hasPartner() || hasKids()) st.items.push({ title: 'The people coming with you',
            note: hasPartner()
              ? 'Your visa route decides what your partner can do when you arrive — whether they can work at all, for whom, and on what terms. Worth settling before you apply rather than after you have accepted.'
              : 'A move only works if it works for the children coming with you. What changes for them, and when, is worth reading before anything practical starts.',
            links: (forCountries(function (dd, cc) { return [{ label: 'Bringing your family', href: '/guides/' + cc + '-family' }].concat(hasPartner() ? [{ label: 'Can my partner work?', href: '/guides/' + cc + '-family#partner-work' }] : []); }) || [{ label: 'Bringing your family', href: '/guides/new-zealand-family' }]) });
          if (hasPartner() && S.hh.work === 'health') st.items.push({ title: 'Your partner’s registration',
            note: 'Two clinicians means two registrations, and theirs can take longer than yours. Run their pathway alongside your own from the start — a second timeline found late is the most common reason a family arrives months apart.',
            links: [{ label: 'Check their pathway', href: '/pathway-checker' }, { label: 'Build their CV', href: '/build-your-cv' }] });
          if (hasPartner() && !S.hh.work) st.ask = 'work';
          break;
        case 'numbers':
          st.items.push({ title: 'What could I earn?', tool: 'earn',
            note: 'In the public systems pay is set by collective agreement and published. What varies is your step, your hours and the allowances on top — and what is left after tax and rent.',
            links: (forCountries(function (dd, cc) { return [{ label: 'Salary and pay, explained', href: '/guides/' + cc + '-salary' }]; }) || []).concat([{ label: 'Take-home pay', href: '/take-home-pay' }]) });
          st.items.push({ title: 'Can we afford it?', tool: 'cost',
            note: 'Registration, the visa for everyone coming, flights, shipping, temporary accommodation and the bond. What the whole move costs, what an employer usually covers, and what you need in the bank.',
            links: [{ label: 'The cost of relocating, explained', href: '/guides/cost-of-relocating' }] });
          break;
        case 'place':
          st.items.push({ title: 'Where could we live?', tool: 'live',
            note: 'Some places are much more sought after than others. That does not make them better. Commute, schools, partner work, climate, distance from an airport — and the roles are often where you were not looking.',
            links: forCountries(function (dd) { return [{ label: CN(dd) + ' destination guides', href: dd === 'au' ? '/destinations/australia' : '/destinations/' }]; }) || [{ label: 'All destination guides', href: '/destinations/' }] });
          if (hasKids()) {
            var small = band('u5'), school = schoolAge();
            var kTitle = school ? (small ? 'Schools and childcare' : 'Schools') : (small ? 'Childcare and early learning' : 'The children’s side of it');
            var kNote = school
              ? 'Where you live decides which school your children can attend, so settle the school question before you sign a lease.'
              : (small ? 'Places, waiting lists and cost vary street by street, and the good ones fill early. Worth starting before you fly rather than in your first week.'
                       : 'What changes for them, in what order, and what you can set up before you land.');
            if (band('18up')) kNote += ' At university age your visa route decides whether they pay domestic or international fees — a gap wide enough to change the maths of the whole move.';
            var kl = forCountries(function (dd, cc) {
              var L = [{ label: 'Schools and education', href: '/guides/' + cc + '-education' }];
              if (small) L.push({ label: 'Childcare, explained', href: '/guides/' + cc + '-family#childcare' });
              L.push(dd === 'au' ? { label: 'Child Care Subsidy (Services Australia)', href: 'https://www.servicesaustralia.gov.au/child-care-subsidy', external: true }
                                 : { label: 'Early learning (Ministry of Education)', href: 'https://parents.education.govt.nz/', external: true });
              return L;
            }) || [{ label: 'Schools in New Zealand', href: '/guides/new-zealand-education' }, { label: 'Schools in Australia', href: '/guides/australia-education' }];
            st.items.push({ title: kTitle, note: kNote, links: kl });
            if (!S.hh.bands.length) st.ask = 'bands';
          }
          break;
        case 'role':
          st.items.push({ title: 'Finding the right role', note: 'We recruit across most professions in New Zealand, subject to the vacancies open at the time, and we are expanding into Australia starting with medical imaging. Tell us what you do and where you are thinking of, and we will tell you plainly what we have.',
            links: [{ label: 'Current opportunities', href: '/jobs/' }].concat(forCountries(function (dd, cc) { return [{ label: 'How hiring works in ' + CN(dd), href: '/guides/' + cc + '-finding-a-role' }]; }) || []) });
          st.items.push({ title: 'CV & interviews', tool: 'interview',
            note: 'A clinical CV written for one health system rarely reads well in another. Set out your experience clearly for the one you are applying to, then test what you would say out loud.',
            links: [{ label: 'Build your CV', href: '/build-your-cv' }, { label: 'Check the CV you already have', href: '/cv-checker' }].concat(forCountries(function (dd, cc) { return [{ label: 'CVs and interviews guide', href: '/guides/' + cc + '-interview' }]; }) || []) });
          break;
        case 'plan':
          st.items.push({ title: 'The offer', tool: 'offer', note: 'What you have been offered, what an employer usually covers, and the questions still worth putting to them before you sign.',
            links: [{ label: 'Understanding an offer', href: '/guides/negotiating-your-offer' }] });
          st.items.push({ title: 'Visas', note: visaNote(),
            links: (forCountries(function (dd, cc) { return [{ label: 'Visa guide', href: '/guides/' + cc + '-visa' }, immi(dd)]; }) || [{ label: 'Visas: New Zealand', href: '/guides/new-zealand-visa' }, { label: 'Visas: Australia', href: '/guides/australia-visa' }]) });
          st.items.push({ title: 'Plan your move', tool: 'checklist', note: 'Shipping, storage, temporary accommodation, the lease, the school place and what has the longest lead time — in the order it needs doing.',
            links: forCountries(function (dd, cc) { return [{ label: 'Preparing for the move', href: '/guides/' + cc + '-relocation' }]; }) || [{ label: 'Bringing pets and belongings', href: '/guides/nz/bringing-pets-and-belongings' }] });
          if (hasKids() && !hasPartner()) st.items.push({ title: 'Moving as a single parent',
            note: 'Doing this on your own is a different move, not a smaller one. Two things are worth handling early: written consent from anyone else with parental responsibility, which visa applications and border officials can ask to see, and childcare that works around clinical shifts when there is no second adult at home.',
            links: forCountries(function (dd, cc) { return [{ label: 'Moving as a single parent', href: '/guides/' + cc + '-family#single-parent' }, immi(dd)]; }) || [{ label: 'Moving as a single parent', href: '/guides/new-zealand-family#single-parent' }] });
          break;
        case 'settle':
          st.items.push({ title: 'Landing well', tool: 'first30', note: 'The paperwork in the order it needs doing, the first days on the unit, and the ordinary things that turn an arrival into a life.',
            links: forCountries(function (dd, cc) { return [{ label: 'Living and thriving in ' + CN(dd), href: '/guides/living-in-' + cc }, { label: 'Community and belonging', href: '/guides/' + cc + '-community' }]; }) || [{ label: 'Settling in', href: '/settling-in' }] });
          break;
      }
      out.push(st);
    });
    return out;
  }

  function currentId() { var s = ctx ? ctx.stage() : ''; return s || ''; }
  function stageByN(n) { var j = J(); for (var i = 0; i < j.length; i++) if (j[i].n === n) return j[i]; return null; }
  function nextOpen() {
    /* the stage worth doing next: the current one unless it is sorted, then the first unsorted after it */
    var cur = currentId(), j = J(), start = 1;
    for (var i = 0; i < j.length; i++) if (j[i].id === cur) start = j[i].n;
    for (var n = start; n <= 8; n++) { var s = stageByN(n); if (s && !S.done[s.id]) return s; }
    return null;
  }

  /* ---------------- paint ---------------- */
  var open = null; // stage id the reader has opened by hand; null = the current stage
  function paint() {
    var host = $('[data-stages]'); if (!host) return;
    var d = dest(), hasD = !!d, cur = currentId(), nx = nextOpen();
    var known = hasD || (ctx && ctx.profession()) || cur;
    var list = stages();
    var openId = open || (nx ? nx.id : (cur || 'imagine'));

    /* next step card */
    var nextEl = $('[data-next]');
    if (nextEl) {
      if (!known) { nextEl.hidden = true; }
      else {
        var ns = nx ? list.filter(function (s) { return s.id === nx.id; })[0] : null;
        var t0 = ns && ns.items.filter(function (it) { return it.tool; })[0];
        var tl = t0 ? tool(t0.tool, oneDest()) : null;
        nextEl.hidden = false;
        nextEl.innerHTML = ns
          ? '<span class="k">Your next step · Stage 0' + ns.n + '</span><h2>' + esc(ns.label) + '</h2><p>' + esc(tl ? tl.note : ns.items[0].note) + '</p>' +
            (tl ? '<a class="pt-btn" href="' + tl.href + '" data-ctx-link>' + esc(tl.title) + ' <i aria-hidden="true">&rarr;</i></a>' : '<button class="pt-btn" type="button" data-open="' + ns.id + '">Open this stage <i aria-hidden="true">&rarr;</i></button>')
          : '<span class="k">Every stage sorted</span><h2>Nothing left on the list.</h2><p>Come back to any stage below, or clear the ticks to start again.</p>';
      }
    }

    /* the eight */
    host.innerHTML = list.map(function (s) {
      var isCur = s.id === cur, isDone = !!S.done[s.id], isOpen = s.id === openId;
      var status = isDone ? '<span class="pt-badge done">Done</span>' : isCur ? '<span class="pt-badge now">You are here</span>' : (nx && s.id === nx.id ? '<span class="pt-badge">Next</span>' : '');
      var h = '<section class="pt-stage' + (isOpen ? ' is-open' : '') + (isCur ? ' now' : '') + (isDone ? ' done' : '') + '" id="s' + s.n + '" data-stage="' + s.id + '">';
      h += '<button type="button" class="pt-stage-h" data-open="' + s.id + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '"><span class="pt-num">0' + s.n + '</span><span class="pt-stage-t">' + esc(s.label) + '</span>' + status + '<span class="pt-stage-x" aria-hidden="true">' + (isOpen ? '−' : '+') + '</span></button>';
      if (isOpen) {
        h += '<div class="pt-stage-b">';
        if (!hasD && s.n > 1) h += '<p class="pt-hint" style="margin:0 0 14px">Tell us where you are thinking of, above, and this stage shows only that country’s guides.</p>';
        s.items.forEach(function (it) {
          var tl = it.tool ? tool(it.tool, oneDest()) : null;
          /* The "Started" badge used to sit on the item title, so a saved draft in the pathway
             checker put "Registration — Started" on the page. A candidate reads that as their
             registration being underway; what it actually means is that a tool in this browser
             has answers in it. Same fact, moved to the tool it is about (Sophie, 1 Oct 2026). */
          h += '<div class="pt-item"><h3>' + esc(it.title) + '</h3><p>' + esc(it.note) + '</p>';
          if (tl) {
            h += '<a class="pt-btn ghost" href="' + tl.href + '" data-ctx-link>' + esc(tl.title) + ' <i aria-hidden="true">&rarr;</i></a>';
            if (started(tl.store)) h += '<p class="pt-draft">Saved in this browser — opens where you left off.</p>';
          }
          if (it.links && it.links.length) h += '<div class="pt-links">' + it.links.map(function (l) { return '<a href="' + esc(l.href) + '"' + (l.external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l.label) + (l.external ? ' ↗' : '') + '</a>'; }).join('') + '</div>';
          h += '</div>';
        });
        if (s.ask === 'work') h += '<div class="pt-ask"><p class="pt-lbl">Does your partner work?</p><div class="pt-pills">' + WORK.map(function (w) { return '<button type="button" class="pt-pill" data-work="' + w.value + '">' + esc(w.label) + '</button>'; }).join('') + '</div><p class="pt-hint">If they are a clinician too, their registration gets its own step here.</p></div>';
        if (s.ask === 'bands') h += '<div class="pt-ask"><p class="pt-lbl">How old will your children be when you move?</p><div class="pt-pills">' + BANDS.map(function (b) { return '<button type="button" class="pt-pill' + (band(b.value) ? ' on' : '') + '" data-band="' + b.value + '" aria-pressed="' + (band(b.value) ? 'true' : 'false') + '">' + esc(b.label) + '</button>'; }).join('') + '</div><p class="pt-hint">Choose every band that applies. Ages decide whether childcare, school enrolment or university fees belong in your plan.</p></div>';
        h += '<div class="pt-signrow" style="margin-top:18px">' +
          '<button type="button" class="pt-tick' + (isDone ? ' on' : '') + '" data-done="' + s.id + '" aria-pressed="' + (isDone ? 'true' : 'false') + '">'
          + '<span class="pt-tick-box" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span>'
          + '<span class="pt-tick-l">' + (isDone ? 'Done' : 'Mark as done') + '</span></button>' +
          (!isCur ? '<button type="button" class="pt-quiet" data-here="' + s.id + '">This is where I am</button>' : '') +
          '</div></div>';
      }
      h += '</section>';
      return h;
    }).join('');
    if (ctx && ctx.decorate) ctx.decorate(host);
    if (ctx && ctx.decorate && nextEl) ctx.decorate(nextEl);
    paintSend();
  }

  /* ---------------- send my plan (unchanged in purpose) ---------------- */
  function paintSend() {
    var cols = $('[data-send-cols]'), off = $('[data-send-off]');
    if (!cols || !off) return;
    var m = me();
    var canHelp = !!(m && m.available && m.status === 'recruiting');
    var known = !!(ctx && ctx.profession() && oneDest());
    var sec = $('#send'); if (sec) sec.hidden = !known;
    cols.hidden = !canHelp; off.hidden = canHelp;
    var h = $('[data-send-h]'), note = $('[data-send-note]');
    if (canHelp) {
      if (h) h.textContent = 'Rather we picked this up with you?';
      if (note) note.textContent = 'Send us what you have so far and we will read it before we speak. Nothing goes anywhere until you press send — and you can see exactly what it contains below.';
      return;
    }
    if (h) h.textContent = 'Can we help you into a role?';
    if (note) note.textContent = 'Honestly, not yet — so we are not going to ask for your details.';
    var line = $('[data-send-off-line]'); if (!line) return;
    if (!m || !m.available) line.textContent = 'We recruit into a specific set of professions, and yours is not one we place in ' + destLabel() + ' at the moment. That has no bearing on whether the move is right for you, and everything on this page is yours to use.';
    else line.textContent = 'We are not recruiting ' + m.label + ' roles in ' + destLabel() + ' yet. You may well find one directly, or through another recruiter, and that is a perfectly good outcome.';
  }

  /* ---------------- the link (no account: the link carries the answers) ---------------- */
  var LINK_FIELDS = ['first', 'dest', 'profession', 'origin', 'stage', 'journeyStage', 'hh', 'done'];
  function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function planLink() {
    var o = {}; LINK_FIELDS.forEach(function (k) { if (S[k] !== undefined) o[k] = S[k]; });
    var saved = savedItems();
    if (saved.length) o.sv = saved.map(function (it) { return [it.u, it.t, it.k]; });
    return location.origin + '/move?p=' + b64u(JSON.stringify(o));
  }
  function importFromLink() {
    var m = /[?&]p=([^&]+)/.exec(location.search);
    if (!m) return;
    try {
      var o = JSON.parse(b64d(decodeURIComponent(m[1])));
      if (!S.set || window.confirm('Open this saved plan? It will replace the plan currently on this device.')) {
        LINK_FIELDS.forEach(function (k) { if (o[k] !== undefined) S[k] = o[k]; });
        S.set = true; save();
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

  /* ---------------- the document (print / Word), fed by the eight stages ---------------- */
  function docHTML(forWord) {
    var list = stages(), au = oneDest() === 'au';
    var accInk = au ? '#A34438' : '#2F5E49', coverInk = au ? '#EFC3AA' : '#C6E084';
    var who = (S.first ? esc(S.first) + '’s' : 'Your') + ' plan for ' + esc(destLabel());
    var when = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var cur = currentId(), nx = nextOpen();
    var originLabel = (origins().filter(function (x) { return x.value === S.origin; })[0] || {}).label || '';
    var facts = [['Profession', profLabel() || '—'], ['Moving to', destLabel()]];
    if (originLabel) facts.push(['Moving from', originLabel]);
    facts.push(['Household', hhPhrase() ? 'Moving ' + hhPhrase() : 'Moving on your own']);
    facts.push(['Where you are now', ctx && ctx.stageLabel() ? ctx.stageLabel() : 'Not yet said']);
    var groups = list.map(function (s) { return { stage: '0' + s.n + ' · ' + s.label, id: s.id, steps: s.items }; });
    var next = nx ? { title: 'Stage 0' + nx.n + ' · ' + nx.there, note: list.filter(function (s) { return s.id === nx.id; })[0].items[0].note, href: '/move#s' + nx.n } : { title: 'Every stage sorted', note: '', href: '/move' };
    var saved = savedItems();
    var abs = function (h) { return /^https?:/.test(h) ? h : location.origin + h; };
    var foot = 'Ethicare Resourcing Ltd · Company No 14646354 · Office 1, One Coldbath Square, London EC1R 5HL · +44 20 4626 6580 · hello@ethicareresourcing.com';
    var standing = 'Built on your device from the answers you gave on ' + when + '. Nothing here was sent anywhere. We explain and sequence the steps — this is not immigration advice, and the decisions stay with the regulator and the immigration authority.';
    var stepHtml = function (st, isNow, word) {
      if (word) {
        var td = 'style="padding:14px 18px;border-bottom:1px solid #EBDFD3"';
        return '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:2px"><tr><td width="6" style="background:' + (isNow ? '#02615D' : '#A6C84A') + '"></td><td ' + td + '>' +
          '<div style="font-weight:bold;color:#02615D">' + esc(st.title) + '</div><div style="margin:6px 0">' + esc(st.note) + '</div>' +
          (st.links && st.links.length ? '<div style="font-size:9.5pt">' + st.links.map(function (l) { return '<a href="' + abs(l.href) + '" style="color:' + accInk + ';font-weight:bold">' + esc(l.label) + '</a>'; }).join(' &nbsp;·&nbsp; ') + '</div>' : '') + '</td></tr></table>';
      }
      return '<div class="step' + (isNow ? ' now' : '') + '"><div class="bar"></div><div class="body"><div class="t">' + esc(st.title) + '</div><div>' + esc(st.note) + '</div>' +
        (st.links && st.links.length ? '<div class="lk">' + st.links.map(function (l) { return '<a href="' + abs(l.href) + '">' + esc(l.label) + '</a>'; }).join('') + '</div>' : '') + '</div></div>';
    };
    if (forWord) {
      var h2 = function (t) { return '<h2 style="font-family:Calibri,Arial,sans-serif;font-size:15pt;color:#02615D;border-bottom:2px solid #A6C84A;padding-bottom:6px;margin:30px 0 14px">' + t + '</h2>'; };
      var out = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>" + who + "</title></head>" +
        '<body style="font-family:Calibri,Arial,sans-serif;color:#222;font-size:11pt;line-height:1.6;margin:0">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#02615D"><tr><td style="padding:34px 40px">' +
        '<div style="color:' + coverInk + ';font-size:9pt;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px">Ethicare Move · Your plan</div>' +
        '<div style="width:26px;height:3px;background:#A6C84A;margin-bottom:14px"></div>' +
        '<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;color:#fff;margin:0 0 8px">' + who + '</h1>' +
        '<div style="color:' + coverInk + ';font-size:11pt">Prepared ' + when + ' · ethicareresourcing.com/move</div></td></tr></table>' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr><td style="padding:0 40px 40px">';
      out += h2('At a glance') + '<table class="facts" width="100%" cellpadding="0" cellspacing="0">';
      facts.forEach(function (f) { out += '<tr><td width="34%" style="padding:11px 18px 11px 0;border-bottom:1px solid #EBDFD3;color:' + accInk + ';font-size:9pt;letter-spacing:.06em;text-transform:uppercase;vertical-align:top">' + esc(f[0]) + '</td><td style="padding:11px 0;border-bottom:1px solid #EBDFD3;color:#02615D;font-weight:bold;vertical-align:top">' + esc(f[1]) + '</td></tr>'; });
      out += '</table>' + h2('Your journey');
      groups.forEach(function (g) {
        out += '<h3 class="sh" style="color:' + accInk + ';font-size:9pt;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;margin:22px 0 8px">' + esc(g.stage) + (S.done[g.id] ? ' — sorted' : g.id === cur ? ' — you are here' : '') + '</h3>';
        g.steps.forEach(function (st) { out += stepHtml(st, g.id === cur, true); });
      });
      if (saved.length) { out += h2('Pages you saved') + '<table width="100%" cellpadding="0" cellspacing="0">'; saved.forEach(function (it) { out += '<tr><td style="padding:14px 18px;border-bottom:1px solid #EBDFD3"><a href="' + abs(it.u) + '" style="color:#02615D;font-weight:bold;text-decoration:none">' + esc(it.t) + '</a></td></tr>'; }); out += '</table>'; }
      out += h2('What next?') + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#F7F4EE;padding:20px 24px"><div style="font-weight:bold;color:#02615D;margin-bottom:6px">' + esc(next.title) + '</div><div>' + esc(next.note) + '</div><div style="margin-top:8px;font-size:9.5pt"><a href="' + abs(next.href) + '" style="color:' + accInk + ';font-weight:bold">' + location.origin + next.href + '</a></div></td></tr></table>';
      out += '<div style="margin-top:30px;padding-top:16px;border-top:1px solid #EBDFD3;color:#555;font-size:9.5pt">' + esc(standing) + '</div><div style="margin-top:8px;color:#555;font-size:9.5pt">' + esc(foot) + '</div></td></tr></table></body></html>';
      return out;
    }
    var o2 = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + who + '</title>' +
      '<style>*{box-sizing:border-box}body{margin:0;background:#FCFBF8;color:#333;font-family:Manrope,system-ui,sans-serif;line-height:1.65}' +
      'h2{font-family:"Work Sans",sans-serif;color:#02615D;font-size:20px;margin:0 0 18px;padding-bottom:8px;border-bottom:2px solid #A6C84A}' +
      '.cover{background:#02615D;color:#fff;padding:clamp(32px,5vw,56px) clamp(24px,5vw,56px)}.cover .eb{color:' + coverInk + ';font-family:"Work Sans",sans-serif;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}.cover .rule{width:26px;height:3px;background:#A6C84A;margin-bottom:16px}.cover h1{font-family:Georgia,serif;font-weight:600;font-size:clamp(28px,4vw,40px);margin:0 0 10px}.cover .meta{color:' + coverInk + ';font-size:15px}' +
      '.wrap{max-width:760px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(20px,4vw,32px) 60px}section{margin-bottom:40px}' +
      '.facts{width:100%;border-collapse:collapse}.facts th{width:34%;text-align:left;padding:11px 18px 11px 0;border-bottom:1px solid #EBDFD3;color:' + accInk + ';font-family:"Work Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;vertical-align:top}.facts td{padding:11px 0;border-bottom:1px solid #EBDFD3;color:#02615D;font-weight:600;vertical-align:top}' +
      '.sgroup{margin-bottom:26px;break-inside:avoid}.sgroup>.sh{font-family:"Work Sans",sans-serif;font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + accInk + ';margin:0 0 10px}' +
      '.step{display:grid;grid-template-columns:4px 1fr;gap:16px;background:#fff;border:1px solid #EBDFD3;border-radius:12px;overflow:hidden;margin-bottom:10px;break-inside:avoid}.step .bar{background:#A6C84A}.step.now .bar{background:#02615D}.step .body{padding:16px 20px 16px 4px}.step .t{font-family:"Work Sans",sans-serif;font-weight:600;color:#02615D;margin-bottom:6px;font-size:16px}' +
      '.step .lk{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:14px}.step .lk a{color:' + accInk + ';font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
      '.glist{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px}.glist a{display:block;background:#fff;border:1px solid #EBDFD3;border-radius:10px;padding:14px 16px;color:#02615D;font-weight:600;text-decoration:none;font-size:14.5px}' +
      '.next{background:#F7F4EE;border-radius:14px;padding:22px 26px}.next .t{font-family:"Work Sans",sans-serif;font-weight:600;font-size:17px;color:#02615D;margin-bottom:6px}.next a{color:' + accInk + ';font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
      '.foot{border-top:1px solid #EBDFD3;padding-top:18px;color:#555;font-size:13.5px}.foot p{margin:0 0 8px}.printbar{max-width:760px;margin:14px auto 0;padding:0 clamp(20px,4vw,32px);text-align:right}.printbar button{font-family:"Work Sans",sans-serif;font-weight:600;font-size:13.5px;color:#02615D;background:#fff;border:1.5px solid rgba(2,97,93,.35);border-radius:8px;padding:10px 16px;min-height:44px;cursor:pointer}' +
      '@media print{.printbar{display:none}body{background:#fff}.step,.glist a{border-color:#ddd}section{break-inside:auto}}</style></head><body>' +
      '<div class="cover"><div class="eb">Ethicare Move · Your plan</div><div class="rule"></div><h1>' + who + '</h1><div class="meta">Prepared ' + when + ' · ethicareresourcing.com/move</div></div>' +
      '<div class="printbar"><button type="button" onclick="print()">Print or save as PDF</button></div><div class="wrap"><section><h2>At a glance</h2><table class="facts"><tbody>';
    facts.forEach(function (f) { o2 += '<tr><th scope="row">' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td></tr>'; });
    o2 += '</tbody></table></section><section><h2>Your journey</h2>';
    groups.forEach(function (g) {
      o2 += '<div class="sgroup"><h3 class="sh">' + esc(g.stage) + (S.done[g.id] ? ' — sorted' : g.id === cur ? ' — you are here' : '') + '</h3>';
      g.steps.forEach(function (st) { o2 += stepHtml(st, g.id === cur, false); });
      o2 += '</div>';
    });
    o2 += '</section>';
    if (saved.length) { o2 += '<section><h2>Pages you saved</h2><div class="glist">'; saved.forEach(function (it) { o2 += '<a href="' + abs(it.u) + '">' + esc(it.t) + '</a>'; }); o2 += '</div></section>'; }
    o2 += '<section><h2>What next?</h2><div class="next"><div class="t">' + esc(next.title) + '</div><div>' + esc(next.note) + '</div><div style="margin-top:10px"><a href="' + abs(next.href) + '">' + esc(next.title) + ' →</a></div></div></section>' +
      '<div class="foot"><p>' + esc(standing) + '</p><p>' + esc(foot) + '</p></div></div></body></html>';
    return o2;
  }

  /* ---------------- wiring ---------------- */
  function scrollToStage(id) {
    var el = $('[data-stage="' + id + '"]'); if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - 90;
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
  }
  function route() {
    var h = location.hash, m = /^#s([1-8])$/.exec(h);
    if (m) { var s = stageByN(+m[1]); if (s) { open = s.id; paint(); scrollToStage(s.id); } return; }
    if (h === '#setup' || h === '#welcome' || h === '#doing') { var st = $('#ctx-strip .ecx-btn'); if (st && st.getAttribute('aria-expanded') !== 'true') st.click(); window.scrollTo(0, 0); }
  }
  /* What the next step depends on. Change the profession and this does not move, so the
     page does not jump for an answer that did not change what comes next. */
  function nextKey() {
    if (!ctx) return '';
    return (ctx.stage ? ctx.stage() : '') + '|' + (ctx.dest ? ctx.dest() : '');
  }

  /* Close the answers panel and move to the next step, so answering the question produces
     a visible result rather than a silent one further down the page. */
  function revealNextStep() {
    var card = $('[data-next]');
    if (!card || card.hidden) return;
    var btn = $('#ctx-strip .ecx-btn');
    if (btn && btn.getAttribute('aria-expanded') === 'true') btn.click();
    var reduced = document.documentElement.getAttribute('data-rp-motion') === 'off';
    try {
      card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    } catch (e) { card.scrollIntoView(); }
    /* a brief outline, so it is obvious which thing just answered you */
    card.classList.remove('is-new');
    void card.offsetWidth;                       /* restart the animation on a repeat */
    card.classList.add('is-new');
    setTimeout(function () { card.classList.remove('is-new'); }, 2200);
    /* say it for a screen reader too: scrolling tells a sighted person, nothing else does */
    var say = document.getElementById('pt-live');
    if (say) {
      var h = card.querySelector('h2');
      say.textContent = 'Your next step: ' + (h ? h.textContent : 'updated') + '.';
    }
  }

  function init() {
    load();
    importFromLink();
    load();
    if (ctx && ctx.mount) {
      /* My Move (pack/pack.js) reuses this file inside a candidate's private space, where the
         answers ARE saved with us — so the page it sits in can supply its own intro line. */
      var strip = ctx.mount('#ctx-strip', { intro: document.body.getAttribute('data-strip-intro') || 'Four answers and the plan below is yours: your country, your profession, your household.' });
      /* a first visit: open the answers so the page starts by asking, not by lecturing */
      if (!(ctx.has())) { var b = $('#ctx-strip .ecx-btn'); if (b) b.click(); }
      /* Answer a question and nothing visibly happens: the next-step card updates, but it
         is below the fold, so the person sits looking at a form waiting for it to respond.
         (Sophie, 1 Oct 2026.) So when an answer changes what the next step IS, close the
         answers back to their one-line summary and bring the card to them.
         Only on a real change — repainting on every keystroke would yank the page about —
         and never on the first paint, which is the person arriving, not answering. */
      /* Seeded from what we already hold, NOT from the first change: ctx.onChange only fires
         when someone answers, so a "skip the first one" guard swallows the very answer this
         exists for. Caught by testing a single selection on a fresh page. */
      var lastNext = nextKey();
      ctx.onChange(function () {
        load(); open = null; paint();
        var now = nextKey();
        if (now === lastNext) return;      /* profession changed, say: the next step is the same */
        lastNext = now;
        revealNextStep();
      });
    }
    paint();
    window.addEventListener('hashchange', route);
    route();

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-open],[data-done],[data-here],[data-work],[data-band],[data-doc],[data-getlink],[data-linkcopy],[data-clear]') : null;
      if (!t) return;
      if (t.hasAttribute('data-open')) { var id = t.getAttribute('data-open'); var cur = $('.pt-stage.is-open'); open = (cur && cur.getAttribute('data-stage') === id && t.classList.contains('pt-stage-h')) ? '__none' : id; paint(); if (open !== '__none' && !t.classList.contains('pt-stage-h')) scrollToStage(id); return; }
      if (t.hasAttribute('data-done')) { var d = t.getAttribute('data-done'); load(); if (S.done[d]) delete S.done[d]; else S.done[d] = true; save(); if (window.track) window.track('move_stage_done', { stage: d, done: !!S.done[d] }); open = null; paint(); return; }
      if (t.hasAttribute('data-here')) { if (ctx && ctx.write) ctx.write({ stage: t.getAttribute('data-here') }); open = null; return; }
      if (t.hasAttribute('data-work')) { load(); S.hh.work = t.getAttribute('data-work'); save(); paint(); return; }
      if (t.hasAttribute('data-band')) { load(); var v = t.getAttribute('data-band'), i = S.hh.bands.indexOf(v); if (i > -1) S.hh.bands.splice(i, 1); else S.hh.bands.push(v); save(); paint(); return; }
      if (t.hasAttribute('data-doc')) {
        var mode = t.getAttribute('data-doc');
        if (mode === 'view') { var w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(docHTML(false)); w.document.close(); } }
        else { var blob = new Blob([docHTML(true)], { type: 'application/msword' }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = 'Ethicare-Move-Plan.doc'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); }
        if (window.track) window.track('move_doc_generated', { mode: mode });
        return;
      }
      if (t.hasAttribute('data-getlink')) { load(); var link = planLink(); var box = $('[data-linkbox]'), outEl = $('[data-linkout]'); if (box && outEl) { outEl.value = link; box.hidden = false; outEl.select(); } return; }
      if (t.hasAttribute('data-linkcopy')) { var o = $('[data-linkout]'), done = $('[data-linkcopied]'); if (o) { o.select(); try { navigator.clipboard.writeText(o.value); if (done) done.textContent = 'Copied'; } catch (er) { try { document.execCommand('copy'); if (done) done.textContent = 'Copied'; } catch (e2) {} } } return; }
      if (t.hasAttribute('data-clear')) { if (!window.confirm('Clear your plan from this device? Your answers and the stages you have ticked off will go; saved pages stay.')) return; if (ctx && ctx.clear) ctx.clear(); else { try { localStorage.removeItem(KEY); } catch (e) {} } load(); open = null; paint(); window.scrollTo(0, 0); return; }
    });
    /* the send-my-plan summary is written at submit time from the same store — see move.html */
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
