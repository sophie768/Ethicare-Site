/* ============================================================================
   Ask Ethicare — "your page" (5 Oct 2026)

   Sophie: "after you tailor your answers it's a bit confusing as you expect the site to do
   something … the ask ethicare reloads on a personal page with your name … any guides that
   may be useful to you should automatically be on your personalised page … when the
   candidate is ready to start planning it should link to plan my move."

   Everything here is read from the answers strip (candidate-context.js) on this device.
   Nothing is fetched and nothing is sent: the name is a greeting, not a record. When the
   strip has answers the page re-renders itself — the hero says hello, the starting questions
   change to the ones that fit, a "Guides for you" row appears, and a card points at Plan
   your move. Clearing the answers puts the page back exactly as it was.
   ============================================================================ */
(function () {
  'use strict';
  var C = window.EthicareContext, KB = window.ASK_ETHICARE_KB;
  if (!C) return;

  var hero = document.querySelector('.ask-hero-copy');
  var chips = document.querySelector('[data-aske-chips]');
  var mine = document.getElementById('ask-mine');
  if (!hero || !chips || !mine) return;

  /* Keep the page's own first state so Clear can restore it. */
  var original = { hero: hero.innerHTML, chips: chips.innerHTML };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function R(id) { return KB && KB.resources && KB.resources[id] ? KB.resources[id] : null; }

  /* Profession page per country — only where that page is live. Six Australian profession pages
     are redirected to /jobs/coming-to-australia (netlify.toml), so they are left out here rather
     than linked into a redirect. The Australian jobs side is medical imaging for now; the guides
     are for everyone, which is what the rest of the row is for. */
  var PAGE = {
    nz: { imaging: 'radiographer', sonography: 'sonographer', radtherapy: 'radiation-therapist', nuclearmed: 'nuclear-medicine',
          physio: 'physiotherapist', ot: 'occupational-therapist', psychology: 'psychologist', anaesthetic: 'anaesthetic-technician',
          speech: 'speech-language-therapist', dietetics: 'dietitian', socialwork: 'social-worker',
          nursing: 'nursing-midwifery', midwifery: 'nursing-midwifery', medicine: 'medicine' },
    au: { imaging: 'radiographer', sonography: 'sonographer', radtherapy: 'radiation-therapist', nuclearmed: 'nuclear-medicine' }
  };

  function cc() { var d = C.destMode(); return d === 'both' ? '' : d; }   // '' when comparing
  function greeting() {
    var n = C.name(), d = C.destMode();
    if (!n) return 'Your page';
    return (d === 'nz' ? 'Kia ora, ' : 'Hello, ') + esc(n) + '.';
  }

  /* ---- starting questions that fit the answers ------------------------------------------- */
  function questions() {
    var d = cc(), where = d === 'au' ? 'Australia' : d === 'nz' ? 'New Zealand' : 'New Zealand or Australia';
    var q = [];
    q.push('Will my registration transfer to ' + where + ', or do I start again?');
    q.push('What could I earn in ' + where + ' — and would we be better off after tax?');
    if (C.hasPartner()) q.push('Could my partner work on my visa?');
    if (C.hasChildren()) q.push('What are schools like, and how do I choose one?');
    q.push('How much would the move cost us upfront?');
    if (!C.hasPartner() && !C.hasChildren()) q.push('Which places suit someone moving on their own?');
    else q.push('Which places suit a family with two careers?');
    q.push('Can Ethicare help me find a job?');
    return q.slice(0, 6);
  }

  /* ---- the guides this person will actually need ----------------------------------------- */
  function guides() {
    var d = cc(), out = [], seen = {};
    function add(id, override) {
      var r = override || R(id); if (!r || seen[id]) return; seen[id] = 1;
      out.push({ t: r.t, d: r.d, u: r.u, ctx: !!r.ctx });
    }
    var pk = C.profession();
    // 1. your profession, in that country
    if (d && pk && PAGE[d][pk]) {
      add('prof_' + d, { t: (C.professionLabel() || 'Your profession') + ' in ' + (d === 'au' ? 'Australia' : 'New Zealand'),
                         d: 'Registration, what the work is like, and indicative pay', u: '/jobs/' + PAGE[d][pk] + '-' + (d === 'au' ? 'australia' : 'new-zealand') });
    }
    // 2. registration — the checker first, preselected from the strip
    add('pathway_checker', { t: 'Registration pathway checker', d: 'Your likely route, with your profession already selected', u: '/pathway-checker', ctx: true });
    if (d === 'nz') add('nz_registration'); else if (d === 'au') add('au_registration'); else { add('nz_registration'); add('au_registration'); }
    // 3. visas
    if (d === 'nz') add('nz_visa'); else if (d === 'au') add('au_visa'); else add('compare_countries');
    // 4. the people coming with you
    if (C.hasChildren()) { if (d === 'nz') { add('nz_family'); add('nz_education'); } else if (d === 'au') { add('au_family'); add('au_education'); } else { add('nz_family'); add('au_family'); } }
    else if (C.hasPartner()) { if (d === 'nz') add('nz_family'); else if (d === 'au') add('au_family'); else add('nz_family'); }
    // 5. where to live, and what it costs
    add('where_to_live');
    if (d === 'nz') add('nz_destinations'); else if (d === 'au') add('au_destinations'); else add('compare_countries');
    add('cost_calculator', { t: 'What the move will cost', d: 'Build a realistic figure for your own move', u: '/cost-calculator', ctx: true });
    return out.slice(0, 9);
  }

  function render() {
    if (!C.has()) { restore(); return; }
    var sum = C.summary();
    hero.innerHTML =
      '<span class="eyebrow">Your page</span>' +
      '<h1>' + greeting() + '</h1>' +
      '<p class="ask-lede">Everything here starts from your answers now' + (sum ? ' — <strong>' + esc(sum) + '</strong>' : '') + '. Ask anything, or start with the guides we’ve picked out for you below.</p>' +
      '<ul class="ask-eg" aria-label="Questions that fit your situation">' +
      questions().slice(0, 4).map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>';

    /* the question box's example should fit them too */
    try {
      /* the pathway id is the person-noun (sonographer, registered-nurse); the catalogue label
         is the field (Sonography), which reads wrong after "as a" */
      var ta = document.getElementById('aske-in'), d = cc(), noun = (C.pathwayProfession() || '').replace(/-/g, ' ');
      if (ta && !ta.value) ta.setAttribute('placeholder', 'Can I work in ' + (d === 'au' ? 'Australia' : d === 'nz' ? 'New Zealand' : 'New Zealand or Australia') + (noun ? ' as a ' + noun : '') + '?');
    } catch (e) {}
    chips.innerHTML = questions().map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('');

    var g = guides();
    mine.innerHTML =
      '<div class="wrapx">' +
        '<div class="ask-mine-head"><span class="eyebrow">Guides for you</span>' +
        '<h2>Picked from your answers</h2>' +
        '<p>' + (C.name() ? esc(C.name()) + ', these' : 'These') + ' are the pages that fit where you are. Change your answers above and this changes with them.</p></div>' +
        '<div class="ask-mine-grid">' +
        g.map(function (r) {
          var href = r.ctx ? C.withContext(r.u) : r.u;
          return '<a class="ask-mine-card" href="' + esc(href) + '"><span class="t">' + esc(r.t) + '</span><span class="d">' + esc(r.d) + '</span><span class="g" aria-hidden="true">&rarr;</span></a>';
        }).join('') +
        '</div>' +
        '<a class="ask-mine-plan" href="/move">' +
          '<span class="k">When you’re ready to plan</span>' +
          '<span class="t">Plan your move takes these same answers and sequences the whole thing &mdash; registration, visa, money, the people coming with you, the first month.</span>' +
          '<span class="b">Open Plan your move <span aria-hidden="true">&rarr;</span></span>' +
        '</a>' +
      '</div>';
    mine.hidden = false;
  }

  var originalPh = (document.getElementById('aske-in') || {}).getAttribute ? document.getElementById('aske-in').getAttribute('placeholder') : '';
  function restore() {
    hero.innerHTML = original.hero;
    try { var ta = document.getElementById('aske-in'); if (ta && originalPh) ta.setAttribute('placeholder', originalPh); } catch (e) {}
    chips.innerHTML = original.chips;
    mine.innerHTML = ''; mine.hidden = true;
  }

  /* Re-render on every change, and on the explicit finish bring the page into view so the
     result of pressing the button is visible, not off-screen under the strip. */
  C.onChange(function () { render(); });
  window.addEventListener('ethicare:context:done', function () {
    render();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    try { var h1 = hero.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); } } catch (e) {}
  });
  render();
})();
