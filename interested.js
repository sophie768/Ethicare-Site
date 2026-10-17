/* ============================================================================
   Outreach landing page — tailoring (7 Oct 2026)

   The link in a social post decides who the page speaks to:
     /interested?to=au&role=sonographer&utm_source=linkedin&utm_campaign=oct-sonography
   to    nz | au | both
   role  one of the keys in ROLES below
   utm_* kept in hidden fields and sent with the lead, so every enquiry says which post it came from.

   It also fills the answers strip (country, profession) so that the rest of the site — the
   pack, the pathway checker, Plan — is already tailored when they click through.

   Standing rules built in, so a link set up in a hurry cannot break them:
     - Australia + a role outside medical imaging → Sophie's wording (imaging at present,
       more in the coming weeks, register interest), never a promise of roles.
     - Australia never mentions nursing: an Australian nursing link drops the role.
     - Nothing here says Ethicare does not recruit a profession.
   ============================================================================ */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var C = window.EthicareContext;

  /* key: [headline plural, select option, profession key, NZ jobs page, AU jobs page, imaging] */
  var ROLES = {
    'radiographer':        ['Radiographers', 'Radiographer / medical imaging', 'imaging', 'radiographer-new-zealand', 'radiographer-australia', 1],
    'sonographer':         ['Sonographers', 'Sonographer', 'sonography', 'sonographer-new-zealand', 'sonographer-australia', 1],
    'radiation-therapist': ['Radiation therapists', 'Radiation therapist', 'radtherapy', 'radiation-therapist-new-zealand', 'radiation-therapist-australia', 1],
    'nuclear-medicine':    ['Nuclear medicine technologists', 'Nuclear medicine technologist', 'nuclearmed', 'nuclear-medicine-new-zealand', 'nuclear-medicine-australia', 1],
    'radiologist':         ['Radiologists', 'Doctor', 'medicine', 'consultant-radiologist-new-zealand', 'consultant-radiologist-australia', 1],
    'doctor':              ['Doctors', 'Doctor', 'medicine', 'medicine-new-zealand', '', 0],
    'psychiatrist':        ['Psychiatrists', 'Doctor', 'medicine', 'psychiatrist-new-zealand', '', 0],
    'gp':                  ['GPs', 'Doctor', 'medicine', 'gp-new-zealand', '', 0],
    'physiotherapist':     ['Physiotherapists', 'Physiotherapist', 'physio', 'physiotherapist-new-zealand', '', 0],
    'occupational-therapist': ['Occupational therapists', 'Occupational therapist', 'ot', 'occupational-therapist-new-zealand', '', 0],
    'psychologist':        ['Psychologists', 'Psychologist', 'psychology', 'psychologist-new-zealand', '', 0],
    'social-worker':       ['Social workers', 'Social worker', 'socialwork', 'social-worker-new-zealand', '', 0],
    'anaesthetic-technician': ['Anaesthetic technicians', 'Anaesthetic technician / ODP', 'anaesthetic', 'anaesthetic-technician-new-zealand', '', 0],
    'speech-therapist':    ['Speech and language therapists', 'Speech and language therapist', 'speech', 'speech-language-therapist-new-zealand', '', 0],
    'dietitian':           ['Dietitians', 'Another healthcare role', 'dietetics', 'dietitian-new-zealand', '', 0],
    'nurse':               ['Nurses and midwives', 'Nurse or midwife', 'nursing', 'nursing-midwifery-new-zealand', '', 0]
  };
  var PHOTO = { nz: '/assets/nz-life/wellington-waterfront-commute.jpg', au: '/assets/au-life/family-beach.jpg', both: '/assets/nz-life/piha-surf.jpg' };
  var CN = { nz: 'New Zealand', au: 'Australia' };

  var to = (q.get('to') || '').toLowerCase(); if (!/^(nz|au|both)$/.test(to)) to = '';
  var key = (q.get('role') || '').toLowerCase(); var R = ROLES[key] || null;
  if (to === 'au' && R && R[2] === 'nursing') { R = null; key = ''; }      /* Australia never mentions nursing */
  var auNotYet = to === 'au' && R && !R[5];

  /* ---- hero ---- */
  var hero = document.querySelector('[data-qi-hero]');
  if (hero) hero.style.setProperty('--qi-photo', 'url(' + (PHOTO[to] || PHOTO.nz) + ')');
  var h1 = document.querySelector('[data-qi-h1]'), sub = document.querySelector('[data-qi-sub]');
  var where = to === 'nz' || to === 'au' ? CN[to] : 'New Zealand or Australia';
  if (h1 && (R || to)) h1.textContent = (R ? R[0] + ': thinking' : 'Thinking') + ' about working in ' + where + '?';
  if (sub) {
    if (auNotYet) sub.textContent = 'For roles in Australia we are focusing on medical imaging at present, and that will change in the coming weeks. Tell us you are interested and we will contact you with more information nearer the time.';
    else if (to === 'au') sub.textContent = 'Medical imaging roles across Australia. We check your registration route first, speak to the employer for you and stay with you through the move.';
    else if (to === 'nz') sub.textContent = 'Permanent roles across New Zealand’s health system. We speak to the employer for you, help with registration and the move, and stay with you through the first year.';
  }

  /* ---- the form ---- */
  var form = document.querySelector('form[name="quick-interest"]');
  if (form) {
    var dv = to === 'nz' ? 'New Zealand' : to === 'au' ? 'Australia' : to === 'both' ? 'Either' : '';
    if (dv) { var r = form.querySelector('input[name="destination"][value="' + dv + '"]'); if (r) r.checked = true; }
    if (to === 'au') {
      Array.prototype.forEach.call(form.querySelectorAll('select[name="profession"] option'), function (o) { if (o.textContent === 'Nurse or midwife') o.remove(); }); }
    if (R) { var sel = form.elements['profession']; if (sel) sel.value = R[1]; }
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { var v = (q.get(k) || '').slice(0, 80); if (form.elements[k]) form.elements[k].value = v; });
    if (form.elements['audience']) form.elements['audience'].value = [to || 'any', key || 'any'].join('/');
  }

  /* ---- explore tiles, tailored ---- */
  var tiles = document.querySelector('[data-qi-tiles]');
  if (tiles && (R || to)) {
    var c = to === 'au' ? 'au' : 'nz';
    var page = R ? (c === 'au' ? R[4] : R[3]) : '';
    var t = [['/pathway-checker', 'Check my registration route', 'Your regulator and the likely route' + (R ? ' for ' + R[0].toLowerCase() : '')]];
    if (auNotYet) t.push(['/jobs/coming-to-australia#notify', 'Australia: what is coming', 'Where we are recruiting now, and how to hear first']);
    else if (page) t.push(['/jobs/' + page, R[0] + ' in ' + CN[c], 'The role, registration and indicative pay']);
    else t.push(['/jobs/', 'Live roles', 'What is open now']);
    t.push(['/my-pack', 'Create my pack', 'The guides you need for ' + (to === 'both' || !to ? 'both countries' : CN[to]) + ', in one email']);
    t.push([to === 'au' ? '/australia' : to === 'nz' ? '/new-zealand' : '/', 'What life looks like', to === 'au' || to === 'nz' ? 'Everyday life in ' + CN[to] : 'The two countries side by side']);
    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    tiles.innerHTML = t.map(function (x) { return '<a href="' + x[0] + '">' + esc(x[1]) + '<span>' + esc(x[2]) + '</span></a>'; }).join('');
  }

  /* ---- carry the audience into the rest of the site (this device only) ---- */
  if (C && C.write && (R || to === 'nz' || to === 'au' || to === 'both')) {
    var patch = {};
    if (to) patch.dest = to;
    if (R) patch.profession = R[2];
    try { C.write(patch); } catch (e) {}
  }

  try { if (window.plausible && (to || key)) window.plausible('Landing', { props: { audience: (to || 'any') + '/' + (key || 'any'), source: q.get('utm_source') || '' } }); } catch (e) {}
})();
