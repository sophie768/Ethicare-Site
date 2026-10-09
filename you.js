/* ============================================================================
   /you — your page (5 Oct 2026)

   Reads the answers strip (candidate-context.js) on this device and renders the page around
   it. Nothing is fetched about the person, nothing is sent: the name is a greeting, not a
   record, and it is never part of what the Ask function receives.

   Two states:
     · no answers — the set-up card leads, with the strip open and "Show my page" at the end
     · answers    — greeting, the answers in a compact strip, Ask Ethicare already in context,
                    the guides that fit, and the hand-off to Plan your move
   Clearing the answers puts the page back to the first state.
   ============================================================================ */
(function () {
  'use strict';
  var C = window.EthicareContext, KB = window.ASK_ETHICARE_KB;
  if (!C || typeof C.name !== 'function' || typeof C.destMode !== 'function' || typeof C.hasPartner !== 'function') return;

  var $ = function (id) { return document.getElementById(id); };
  var title = $('you-title'), lede = $('you-lede'), note = $('you-note'), setup = $('you-setup');
  var ask = $('you-ask'), guides = $('you-guides'), grid = $('you-guides-grid'), gtitle = $('you-guides-title'), glede = $('you-guides-lede');
  var chips = document.querySelector('[data-aske-chips]');
  if (!title || !ask || !guides || !grid) return;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function R(id) { return KB && KB.resources && KB.resources[id] ? KB.resources[id] : null; }

  /* Profession page per country — only where that page is live. Six Australian profession
     pages redirect to /jobs/coming-to-australia (netlify.toml), so they are not linked here. */
  var PAGE = {
    nz: { imaging: 'radiographer', sonography: 'sonographer', radtherapy: 'radiation-therapist', nuclearmed: 'nuclear-medicine',
          physio: 'physiotherapist', ot: 'occupational-therapist', psychology: 'psychologist', anaesthetic: 'anaesthetic-technician',
          speech: 'speech-language-therapist', dietetics: 'dietitian', socialwork: 'social-worker',
          nursing: 'nursing-midwifery', midwifery: 'nursing-midwifery', medicine: 'medicine' },
    au: { imaging: 'radiographer', sonography: 'sonographer', radtherapy: 'radiation-therapist', nuclearmed: 'nuclear-medicine' }
  };

  function cc() { var d = C.destMode(); return d === 'both' ? '' : d; }
  function where() { var d = cc(); return d === 'au' ? 'Australia' : d === 'nz' ? 'New Zealand' : 'New Zealand or Australia'; }
  function greeting() {
    var n = C.name(), d = C.destMode();
    if (!n) return 'Your page';
    return (d === 'nz' ? 'Kia ora, ' : 'Hello, ') + esc(n) + '.';
  }

  function questions() {
    var w = where(), q = [];
    q.push('Will my registration transfer to ' + w + ', or do I start again?');
    q.push('What could I earn in ' + w + ' — and would we be better off after tax?');
    if (C.hasPartner()) q.push('Could my partner work on my visa?');
    if (C.hasChildren()) q.push('What are schools like, and how do I choose one?');
    q.push('How much would the move cost us upfront?');
    q.push(C.hasPartner() || C.hasChildren() ? 'Which places suit a family with two careers?' : 'Which places suit someone moving on their own?');
    q.push('Can Ethicare help me find a job?');
    return q.slice(0, 6);
  }

  /* Priority order: when the cap of six bites, the least personal pages drop off. */
  function pick() {
    var d = cc(), out = [], seen = {};
    function add(id, o) { var r = o || R(id); if (!r || seen[id]) return; seen[id] = 1; out.push({ t: r.t, d: r.d, u: r.u, ctx: !!r.ctx }); }
    var pk = C.profession();
    if (d && pk && PAGE[d][pk]) add('prof', { t: (C.professionLabel() || 'Your profession') + ' in ' + where(), d: 'Registration, what the work is like, and indicative pay', u: '/jobs/' + PAGE[d][pk] + '-' + (d === 'au' ? 'australia' : 'new-zealand') });
    add('pathway_checker', { t: 'Registration pathway checker', d: 'Your likely route, with your profession already selected', u: '/pathway-checker', ctx: true });
    if (d === 'nz') add('nz_visa'); else if (d === 'au') add('au_visa'); else add('compare_countries');
    if (C.hasChildren()) { if (d === 'nz') { add('nz_family'); add('nz_education'); } else if (d === 'au') { add('au_family'); add('au_education'); } else { add('nz_family'); add('au_family'); } }
    else if (C.hasPartner()) { if (d === 'nz') add('nz_family'); else if (d === 'au') add('au_family'); else add('nz_family'); }
    add('where_to_live');
    add('cost_calculator', { t: 'What the move will cost', d: 'Build a realistic figure for your own move', u: '/cost-calculator', ctx: true });
    if (d === 'nz') add('nz_registration'); else if (d === 'au') add('au_registration'); else { add('nz_registration'); add('au_registration'); }
    if (d === 'nz') add('nz_destinations'); else if (d === 'au') add('au_destinations'); else add('compare_countries');
    return out.slice(0, 6);
  }

  function render() {
    var known = C.has();
    document.body.classList.toggle('you-known', known);
    if (!known) {
      title.textContent = 'Make this your page';
      lede.textContent = 'Three questions, thirty seconds. Then the answers start from you, the guides are the ones you will actually need, and nothing here is about anyone else.';
      note.hidden = false;
      ask.hidden = true; guides.hidden = true; grid.innerHTML = '';
      try { if (!setup.querySelector('.ecx.is-open')) { var b = setup.querySelector('.ecx-btn'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); } } catch (e) {}
      return;
    }
    var sum = C.summary();
    title.innerHTML = greeting();
    lede.innerHTML = 'Everything here starts from your answers' + (sum ? ' — <strong>' + esc(sum) + '</strong>' : '') + '. Ask anything, read what fits, and when you’re ready, plan the move.';
    note.hidden = true;

    if (chips) chips.innerHTML = questions().map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('');
    try {
      var ta = document.getElementById('aske-in'), noun = (C.pathwayProfession() || '').replace(/-/g, ' ');
      if (ta && !ta.value) ta.setAttribute('placeholder', 'Can I work in ' + where() + (noun ? ' as a ' + noun : '') + '?');
    } catch (e) {}
    ask.hidden = false;

    gtitle.textContent = 'Picked from your answers';
    glede.textContent = (C.name() ? C.name() + ', these' : 'These') + ' are the pages that fit where you are. Change your answers above and this changes with them.';
    grid.innerHTML = pick().map(function (r) {
      var href = r.ctx ? C.withContext(r.u) : r.u;
      return '<a class="you-card" href="' + esc(href) + '"><span class="t">' + esc(r.t) + '</span><span class="d">' + esc(r.d) + '</span><span class="g" aria-hidden="true">&rarr;</span></a>';
    }).join('');
    guides.hidden = false;
  }

  C.onChange(render);
  window.addEventListener('ethicare:context:done', function () {
    render();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    try { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); } catch (e) {}
  });
  /* The strip mounts after this script runs; render once it exists so the empty state can open it. */
  var tries = 0; (function wait() { if (setup.querySelector('.ecx') || tries++ > 40) render(); else setTimeout(wait, 50); })();
})();
