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
   4. STAGES and NEXT mirror move.js — move.js is the source of truth; change both together. */
(function () {
  var KEY = 'ethicare_portal_v1';
  /* move-steps.html (the eight-stage rebuild that replaces /move on the September swap) keeps the
     same answers under three keys of its own. Read those too, so a candidate who answered on either
     page is remembered on both, and nothing has to be re-asked across the swap. */
  var WHERE_KEY = 'ethicare_move_where_v1', WHO_KEY = 'ethicare_move_who_v1', HHX_KEY = 'ethicare_move_hh_v1';

  /* mirror of move.js STAGES (label) + TOOL (next step). Only what a page outside /move needs. */
  var STAGES = {
    exploring: { label: 'Just exploring the idea',        next: { title: 'Check your registration pathway', href: '/pathway-checker' } },
    applying:  { label: 'Applying or interviewing',       next: { title: 'Get ready to apply', href: '/interview-prep' } },
    offer:     { label: 'I have an offer to consider',    next: { title: 'Understand the offer in front of you', href: '/before-you-accept' } },
    moving:    { label: 'Accepted \u2014 planning the move', next: { title: 'Work out what the move will cost', href: '/cost-calculator' } },
    arrived:   { label: 'Already here',                    next: { title: 'Your first thirty days', href: '/guides/nz/your-first-month', au: '/guides/living-in-australia' } }
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
    /* fill from move-steps where the plan is silent. WHERE 'nz'|'au' → dest; WHO → party.
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
  function stage() { var p = read(); return p && STAGES[p.stage] ? p.stage : ''; }
  function first() { var p = read(); return p && p.first ? String(p.first).trim().slice(0, 40) : ''; }
  function stageLabel() { var s = stage(); return s ? STAGES[s].label : ''; }
  function next() {
    var s = stage(); if (!s) return null;
    var n = STAGES[s].next, href = (s === 'arrived' && dest() === 'au') ? n.au : n.href;
    return { title: s === 'arrived' && dest() === 'au' ? 'Living and thriving in Australia' : n.title, href: href };
  }
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

  /* Anonymous context line — profession · country · stage. Never a name, never an email. */
  function summary() {
    if (!has()) return '';
    var p = read();
    return [professionLabel() || profession(), countryName(), stageLabel(), p.regStatus, p.party].filter(Boolean).join(' \u00b7 ');
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
    withContext: withContext, summary: summary, decorate: decorate
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { decorate(); });
  else decorate();
})();
