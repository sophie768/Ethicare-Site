/* Ethicare — candidate context (site-wide reader). Agreed 14 Sep 2026, candidate-journey review §2.
   ONE onboarding. /move asks profession, destination, origin and stage once and keeps the answer on
   the device in `ethicare_portal_v1`. Every other tool used to ask again, or asked nothing and
   guessed. This file is the READ side of that one answer: no writes, no network, no new key.
   SCOPE.md §2C: "lightweight browser/session context may be enough" — this is that, and no more.

   Rules, in order of importance:
   1. Never assert a fact the candidate did not give. Only what Move stored is exposed, and the
      vocabulary bridges below map a Move answer onto another tool's option ONLY where the mapping
      is 1:1. 'imaging' could be a radiographer or an MRI technologist; 'medicine' is a dozen
      specialties. Those return '' and the tool asks — the same rule move.js applies to itself.
   2. Seed, never lock. A tool prefilled from here must still let the person change the answer.
   3. Guide, do not gate. Nothing here is required for any page to work; every consumer falls
      back to its own behaviour when there is no plan.
   4. STAGES and NEXT mirror move.js — move.js is the source of truth; change both together.

   28 Sep 2026 — the WRITE side and the answers strip. The rule Sophie set: a tool asks one thing
   at a time, shows only what follows from the answers so far, and never asks what the candidate
   has already answered elsewhere on the site. So every tool now (a) seeds itself from here,
   (b) shows the answers shaping its result in a strip the candidate can change in place, and
   (c) writes an answer back the moment it is given, so the next tool already knows.
   Three vocabulary rules that go with it:
     - destination may be 'both' — someone comparing the two countries is never forced to pick.
       dest() still returns '' for 'both' (tools that can only do one country ask); destMode()
       returns 'both' for tools that can show the two side by side.
     - household is WHO IS COMING, never "single or not": alone | partner | children | both |
       parent. A single parent has children. 'kids' is accepted as an alias and normalised.
     - nothing here is required. No plan, no strip prompt beyond one quiet line; every tool works
       from scratch exactly as before. */
(function () {
  var KEY = 'ethicare_portal_v1';
  /* move-steps (the eight-stage rebuild that became /move on 29 Sep 2026) kept the same answers
     under three keys of its own. Still read them, so anyone who answered there before the swap is
     remembered and nothing has to be re-asked. Nothing writes these keys any more. */
  var WHERE_KEY = 'ethicare_move_where_v1', WHO_KEY = 'ethicare_move_who_v1', HHX_KEY = 'ethicare_move_hh_v1';

  /* mirror of move.js STAGES (label) + TOOL (next step). Only what a page outside /move needs. */
  var STAGES = {
    exploring: { label: 'Just exploring the idea',        next: { title: 'Check your registration pathway', href: '/pathway-checker' } },
    applying:  { label: 'Applying or interviewing',       next: { title: 'Get ready to apply', href: '/interview-prep' } },
    offer:     { label: 'I have an offer to consider',    next: { title: 'Understand the offer in front of you', href: '/before-you-accept' } },
    moving:    { label: 'Accepted \u2014 planning the move', next: { title: 'Work out what the move will cost', href: '/cost-calculator' } },
    arrived:   { label: 'Already here',                    next: { title: 'Your first thirty days', href: '/guides/new-zealand-first-month', au: '/guides/living-in-australia' } }
  };

  /* Move profession key → pathway-checker profession id. 1:1 only. */
  var PATHWAY = {
    sonography: 'sonographer', radtherapy: 'radiation-therapist', nuclearmed: 'nuclear-medicine',
    physio: 'physiotherapist', ot: 'occupational-therapist', psychology: 'psychologist',
    anaesthetic: 'anaesthetic-technician', speech: 'speech-language-therapist', dietetics: 'dietitian',
    socialwork: 'social-worker'
  };

  function read() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { p = null; }
    if (p && typeof p !== 'object') p = null;
    /* fill from the old move-steps keys where the plan is silent. WHERE 'nz'|'au' → dest; WHO → party.
       'compare' and 'explore' are not a destination and stay unmapped. */
    var where = '', who = '', hhx = null;
    try { where = localStorage.getItem(WHERE_KEY) || ''; who = localStorage.getItem(WHO_KEY) || ''; hhx = JSON.parse(localStorage.getItem(HHX_KEY) || 'null'); } catch (e) {}
    if (!p && !where && !who) return null;
    p = p || {};
    if (!p.dest && (where === 'nz' || where === 'au')) { p.dest = where; p.set = true; p.fromSteps = true; }
    if (!p.party && who) p.party = { solo: 'Just me', partner: 'Me and a partner', children: 'Me and my children', 'partner-children': 'A partner and children', parent: 'A parent is coming with me' }[who] || '';
    if (!p.hh && who) p.hh = { 'with': who === 'solo' ? 'alone' : who === 'partner' ? 'partner' : who === 'children' ? 'kids' : who === 'partner-children' ? 'both' : who, work: hhx && hhx.pw === 'health' ? 'health' : '', bands: hhx && hhx.ages ? hhx.ages : [] };
    return p;
  }
  function has() { var p = read(); return !!(p && p.set && p.dest); }
  function dest() { var p = read(); return p && (p.dest === 'au' || p.dest === 'nz') ? p.dest : ''; }
  function country() { var d = dest(); return d === 'au' ? 'australia' : d === 'nz' ? 'new-zealand' : ''; }
  function countryName() { var d = dest(); return d === 'au' ? 'Australia' : d === 'nz' ? 'New Zealand' : ''; }
  function profession() { var p = read(); return p && p.profession ? String(p.profession) : ''; }
  function professionLabel() {
    var k = profession(), cat = window.ETHICARE_PROFESSIONS;
    if (!k || !cat) return '';
    /* portal-professions.js exposes get(key) → {label} and listAll(); prefer the accessor */
    try { if (typeof cat.get === 'function') { var g = cat.get(k); if (g && g.label) return g.label; } } catch (e) {}
    var list = typeof cat.listAll === 'function' ? cat.listAll() : null;
    if (!list) return '';
    for (var i = 0; i < list.length; i++) if (list[i].key === k) return list[i].label || '';
    return '';
  }
  /* stage only when the person chose one on /move. A move-steps-only profile (country and
     household, no stage) returns '' — the homepage must not announce a stage nobody picked. */
  /* 29 Sep 2026 — the stage a candidate is at is one of the EIGHT stages of the journey
     (journey.js, generated from questions.json), not Move's five router values. Both are kept
     in the store: `journeyStage` is the answer; `stage` is Move's own value derived from it,
     so move.js keeps working untouched until it is rebuilt on the same spine. */
  function J() { return window.ETHICARE_JOURNEY || []; }
  function JMAP() { return window.ETHICARE_JOURNEY_MAP || { moveToJourney: {}, journeyToMove: {} }; }
  function jstage(id) { var j = J(); for (var i = 0; i < j.length; i++) if (j[i].id === id) return j[i]; return null; }
  function stage() {
    var p = read(); if (!p) return '';
    if (p.journeyStage && jstage(p.journeyStage)) return p.journeyStage;
    var m = JMAP().moveToJourney[p.stage]; return m && jstage(m) ? m : '';
  }
  function first() { var p = read(); return p && p.first ? String(p.first).trim().slice(0, 40) : ''; }
  function stageLabel() { var j = jstage(stage()); return j ? 'Stage 0' + j.n + ' \u00b7 ' + j.there : ''; }
  function stageWhere() { var j = jstage(stage()); return j ? j.where : ''; }
  function stageNumber() { var j = jstage(stage()); return j ? j.n : 0; }
  function next() {
    var j = jstage(stage()); if (!j) return null;
    var all = J(), nx = null; for (var i = 0; i < all.length; i++) if (all[i].n === j.n + 1) nx = all[i];
    if (!nx) return null;
    var d = dest(), href = nx.href[d] || nx.href.any;
    return { title: nx.there, href: href, n: nx.n, id: nx.id };
  }
  /* Move's own stage value, for anything still reading it (move.js) */
  function moveStage() { var p = read(); return p && STAGES[p.stage] ? p.stage : ''; }
  function pathwayProfession() { return PATHWAY[profession()] || ''; }
  /* /apply stores the destination as the form's own label */
  function applyDestination() { var d = dest(); return d === 'au' ? 'Australia' : d === 'nz' ? 'Aotearoa New Zealand' : ''; }

  /* Carry the context into a tool's URL — only the params that tool already reads, only when
     the URL does not set them itself. */
  function withContext(href) {
    if (!has()) return href;
    var d = dest(), add = [];
    var hasQ = href.indexOf('?') >= 0;
    var lacks = function (k) { return !(new RegExp('[?&]' + k + '=').test(href)); };
    if (/^\/pathway-checker/.test(href)) {
      if (d && lacks('destination')) add.push('destination=' + (d === 'au' ? 'australia' : 'new-zealand'));
      var pp = pathwayProfession(); if (pp && lacks('profession')) add.push('profession=' + pp);
    } else if (/^\/(cost-calculator|interview-prep)/.test(href)) {
      if (d && lacks('destination')) add.push('destination=' + d);
    }
    return add.length ? href + (hasQ ? '&' : '?') + add.join('&') : href;
  }


  /* ---- household: who is coming, canonical ------------------------------------------------ */
  var HH = [
    { value: 'alone',    label: 'Just me',                        phrase: 'on my own' },
    { value: 'partner',  label: 'Me and my partner',              phrase: 'with a partner' },
    { value: 'children', label: 'Me and my children',             phrase: 'with my children' },
    { value: 'both',     label: 'My partner and our children',    phrase: 'with a partner and children' },
    { value: 'parent',   label: 'A parent is coming with me',     phrase: 'with a parent coming too' }
  ];
  function hhNorm(v) { v = String(v || ''); if (v === 'kids') return 'children'; if (v === 'solo') return 'alone'; if (v === 'partner-children') return 'both'; return HH.some(function (h) { return h.value === v; }) ? v : ''; }
  function household() { var p = read(); return p && p.hh ? hhNorm(p.hh['with']) : ''; }
  function householdLabel() { var v = household(); var h = HH.filter(function (x) { return x.value === v; })[0]; return h ? h.label : ''; }
  function householdPhrase() { var v = household(); var h = HH.filter(function (x) { return x.value === v; })[0]; return h ? h.phrase : ''; }
  function hasChildren() { var v = household(); return v === 'children' || v === 'both'; }
  function hasPartner() { var v = household(); return v === 'partner' || v === 'both'; }

  /* ---- destination, including "comparing both" -------------------------------------------- */
  function destMode() { var p = read(); var d = p && p.dest; return d === 'au' || d === 'nz' || d === 'both' ? d : ''; }
  function destLabel() { var d = destMode(); return d === 'au' ? 'Australia' : d === 'nz' ? 'New Zealand' : d === 'both' ? 'Comparing both countries' : ''; }

  /* ---- write side ----------------------------------------------------------------------------
     patch: { dest, profession, household, stage, origin } — any subset. Merges into the one
     store move.js owns, marks the plan as set, and tells every listener on the page. */
  function write(patch) {
    var p = null; try { p = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    p = (p && typeof p === 'object') ? p : {};
    if (!p.hh || typeof p.hh !== 'object') p.hh = { 'with': '', work: '', bands: [] };
    if (patch.dest !== undefined) p.dest = (patch.dest === 'au' || patch.dest === 'nz' || patch.dest === 'both') ? patch.dest : '';
    if (patch.profession !== undefined) p.profession = String(patch.profession || '');
    if (patch.household !== undefined) { p.hh['with'] = hhNorm(patch.household); p.party = ''; }
    if (patch.stage !== undefined) {
      if (jstage(patch.stage)) { p.journeyStage = patch.stage; p.stage = JMAP().journeyToMove[patch.stage] || p.stage || ''; }
      else if (STAGES[patch.stage]) { p.stage = patch.stage; p.journeyStage = JMAP().moveToJourney[patch.stage] || ''; }
    }
    if (patch.origin !== undefined) p.origin = String(patch.origin || '');
    if (p.dest || p.profession || p.hh['with'] || p.stage || p.journeyStage) p.set = true;
    p.updated = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('ethicare:context', { detail: read() })); } catch (e) {}
    return read();
  }
  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('ethicare:context', { detail: null })); } catch (e) {}
  }
  function onChange(fn) { window.addEventListener('ethicare:context', function (e) { fn(e.detail, e); }); }

  /* ---- the answers strip ---------------------------------------------------------------------
     mount(el, { fields: ['dest','profession','household','stage'], intro: '…', compact: true })
     One line of what shapes this page, and a Change control that opens the answers in place.
     Quiet by design: no name, no email, no "sign up". When nothing is known it shows one
     sentence and the same control. Every change writes and fires ethicare:context. */
  var STRIP_CSS = '.ecx{grid-column:1/-1;flex:1 1 100%;width:100%;box-sizing:border-box;font-family:var(--body,Manrope,sans-serif);background:#fff;border:1px solid #C9DED3;border-left:4px solid #A6C84A;border-radius:14px;padding:12px 16px;margin:0 0 clamp(20px,2.6vw,30px);font-size:15px;line-height:1.5;color:#333}'
    + '.ecx-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px}.ecx-k{font-family:var(--display,"Work Sans",sans-serif);font-weight:700;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:#2F5E49;margin-right:4px}'
    + '.ecx-v{font-family:var(--display,"Work Sans",sans-serif);font-weight:600;color:#02615D}.ecx-sep{color:#9BB9AE}.ecx-btn{margin-left:auto;background:none;border:1px solid #C9DED3;border-radius:999px;padding:5px 13px;font-family:var(--display,"Work Sans",sans-serif);font-weight:600;font-size:13.5px;color:#02615D;cursor:pointer;min-height:32px}.ecx-btn:hover{border-color:#02615D}'
    + '.ecx-ed{display:none;margin-top:12px;padding-top:12px;border-top:1px solid #E6F1ED}.ecx.is-open .ecx-ed{display:block}.ecx-l{display:block;font-family:var(--display,"Work Sans",sans-serif);font-weight:600;font-size:13.5px;color:#02615D;margin:0 0 6px}'
    /* 30 Sep 2026: four questions as four dropdowns, two to a row. Sixteen pills laid out
       flat was more to read than the page underneath them, and the stage question alone
       ran to eight. A select is one line whatever the option list holds. */
    + '.ecx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px 16px}'
    + '.ecx-f{margin:0;min-width:0}'
    + '.ecx select{width:100%}'
    + '.ecx select{font-family:var(--body,Manrope,sans-serif);font-size:15px;color:#333;border:1px solid #C9DED3;border-radius:10px;padding:8px 12px;min-height:40px;max-width:100%;background:#fff}'
    + '.ecx-foot{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin-top:12px;font-size:13.5px;color:#555}.ecx-foot button{background:none;border:0;padding:0;font:inherit;color:#02615D;text-decoration:underline;text-underline-offset:3px;cursor:pointer}'
    + '.ecx-note{font-size:13.5px;color:#555;margin:0}@media(max-width:560px){.ecx-btn{margin-left:0}}';
  var cssDone = false;
  function ensureCss() { if (cssDone) return; cssDone = true; var st = document.createElement('style'); st.id = 'ecx-css'; st.textContent = STRIP_CSS; document.head.appendChild(st); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function profOptions() {
    var cat = window.ETHICARE_PROFESSIONS, out = [];
    try { var list = cat && typeof cat.listAll === 'function' ? cat.listAll() : []; for (var i = 0; i < list.length; i++) out.push({ value: list[i].key, label: list[i].label, group: list[i].group || '' }); } catch (e) {}
    return out;
  }
  /* One field: a label and a select. Every answer set is a list of [value, label]. */
  function sel(field, label, opts, current, placeholder) {
    var id = 'ecx-' + field;
    var h = '<div class="ecx-f"><label class="ecx-l" for="' + id + '">' + esc(label) + '</label>'
      + '<select id="' + id + '" data-f="' + field + '"><option value="">' + esc(placeholder) + '</option>';
    for (var i = 0; i < opts.length; i++) {
      h += '<option value="' + esc(opts[i][0]) + '"' + (current === opts[i][0] ? ' selected' : '') + '>' + esc(opts[i][1]) + '</option>';
    }
    return h + '</select></div>';
  }

  function mount(el, opts) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return null;
    opts = opts || {}; var fields = opts.fields || ['dest', 'profession', 'household', 'stage'];
    ensureCss();
    /* Most tools centre their app in a flex wrapper with no wrapping. A strip dropped in as a
       sibling would then sit beside the app in a narrow column, so let the wrapper wrap and give
       the strip the app's own width. */
    try {
      var par = el.parentElement, pcs = par && getComputedStyle(par);
      if (pcs && pcs.display === 'flex' && pcs.flexWrap === 'nowrap') {
        par.style.flexWrap = 'wrap';
        var sib = el.nextElementSibling, mw = sib && getComputedStyle(sib).maxWidth;
        el.style.maxWidth = (mw && mw !== 'none') ? mw : '980px';
        if (!el.style.margin) el.style.margin = '14px auto 0';
      }
    } catch (e) {}
    var open = false;
    function paint() {
      var p = read() || {}, parts = [];
      if (fields.indexOf('profession') >= 0 && profession()) parts.push(professionLabel() || profession());
      if (fields.indexOf('dest') >= 0 && destMode()) parts.push(destLabel());
      if (fields.indexOf('household') >= 0 && household()) parts.push(householdPhrase());
      if (fields.indexOf('stage') >= 0 && stage()) parts.push(stageLabel());
      var known = parts.length > 0;
      var h = '<div class="ecx-row">';
      if (known) { h += '<span class="ecx-k">Your answers</span>' + parts.map(function (t) { return '<span class="ecx-v">' + esc(t) + '</span>'; }).join('<span class="ecx-sep">&middot;</span>'); }
      else { h += '<span class="ecx-note">' + esc(opts.intro || 'Four answers, and every tool here stops showing you what does not apply.') + '</span>'; }
      h += '<button type="button" class="ecx-btn" aria-expanded="' + (open ? 'true' : 'false') + '">' + (open ? 'Done' : (known ? 'Change' : 'Set up in 30 seconds')) + '</button></div>';
      h += '<div class="ecx-ed">';
      h += '<div class="ecx-grid">';
      if (fields.indexOf('dest') >= 0) h += sel('dest', 'Country', [['nz', 'New Zealand'], ['au', 'Australia'], ['both', 'Comparing both']], destMode(), 'Choose\u2026');
      var po = profOptions();
      if (fields.indexOf('profession') >= 0 && po.length) {
        h += sel('profession', 'Profession', po.map(function (o) { return [o.value, o.label]; }), profession(), 'Choose\u2026');
      }
      if (fields.indexOf('household') >= 0) h += sel('household', 'Who is coming', HH.map(function (o) { return [o.value, o.label]; }), household(), 'Choose\u2026');
      if (fields.indexOf('stage') >= 0 && J().length) h += sel('stage', 'Where you are up to', J().map(function (x) { return [x.id, x.where]; }), stage(), 'Choose\u2026');
      h += '</div>';
      /* Inside My Move (pack/pack.js) the answers ARE saved with us, so the page it sits in says
         so through data-strip-foot; the public tools keep the device-only line. */
      var foot = document.body.getAttribute('data-strip-foot') || 'Saved in this browser only. Nothing is sent to us.';
      h += '<div class="ecx-foot"><span>' + esc(foot) + '</span>' + (known ? '<button type="button" data-clear>Clear my answers</button>' : '') + '</div></div>';
      el.className = 'ecx' + (open ? ' is-open' : ''); el.innerHTML = h;
    }
    el.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      if (t.classList.contains('ecx-btn')) { open = !open; paint(); return; }
      if (t.hasAttribute('data-clear')) { open = false; clear(); paint(); return; }
      var grp = t.parentNode && t.parentNode.getAttribute ? t.parentNode.getAttribute('data-f') : null;
      if (grp && t.classList.contains('ecx-p')) { var patch = {}; patch[grp] = t.getAttribute('data-v'); write(patch); paint(); }
    });
    el.addEventListener('change', function (e) {
      var f = e.target.getAttribute && e.target.getAttribute('data-f');
      if (!f) return;
      var patch = {}; patch[f] = e.target.value;
      write(patch); paint();
      /* paint() replaces the markup, so the select that was just used is gone; put focus back
         on its replacement or a keyboard user is dropped at the top of the page. */
      try { var again = el.querySelector('[data-f="' + f + '"]'); if (again) again.focus(); } catch (er) {}
    });
    window.addEventListener('ethicare:context', function () { paint(); });
    paint();
    return { repaint: paint };
  }

  /* Anonymous context line — profession · country · stage. Never a name, never an email. */
  function summary() {
    if (!has()) return '';
    var p = read();
    return [professionLabel() || profession(), destLabel(), stageLabel(), p.regStatus, householdPhrase()].filter(Boolean).join(' \u00b7 ');
  }

  /* Rewrite any link marked data-ctx-link so it carries the context. Progressive: without a plan
     the href is untouched. */
  function decorate(root) {
    var els = (root || document).querySelectorAll('a[data-ctx-link]');
    for (var i = 0; i < els.length; i++) {
      var h = els[i].getAttribute('href'); if (!h) continue;
      els[i].setAttribute('href', withContext(h));
    }
  }

  window.EthicareContext = {
    key: KEY, read: read, has: has, dest: dest, country: country, countryName: countryName, first: first,
    profession: profession, professionLabel: professionLabel, pathwayProfession: pathwayProfession,
    applyDestination: applyDestination, stage: stage, stageLabel: stageLabel, next: next,
    withContext: withContext, summary: summary, decorate: decorate,
    /* 28 Sep 2026 */
    destMode: destMode, destLabel: destLabel, household: household, householdLabel: householdLabel, householdPhrase: householdPhrase,
    hasChildren: hasChildren, hasPartner: hasPartner, HH: HH, write: write, clear: clear, onChange: onChange, mount: mount,
    /* 29 Sep 2026 — the eight stages */
    journey: J, stageWhere: stageWhere, stageNumber: stageNumber, moveStage: moveStage
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { decorate(); });
  else decorate();
})();
