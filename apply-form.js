/* ================================================================
   ETHICARE RESOURCING — Candidate registration wizard (/apply)
   Vanilla controller for the 4-step form. Submits to Netlify Forms
   (multipart, incl. CV) via fetch, then shows an in-page confirmation.
   No framework — progressive, accessible, draft-saving.
   ================================================================ */
(function () {
  'use strict';

  var form = document.getElementById('reg-form');
  if (!form) return;

  var DRAFT_KEY = 'ethicare_apply_draft_v1';
  var SUBMIT_KEY = 'ethicare_apply_submitted_v1';
  var CV_MAX = 8 * 1024 * 1024; // Netlify Forms caps uploads ~8MB
  var TOTAL = 4;

  /* ---------- option data ---------- */
  var RESIDENCE = ['United Kingdom','Ireland','South Africa','Iran','India','United Arab Emirates','Philippines','Australia','New Zealand','Canada','United States','Nigeria','Kenya','Zimbabwe','Pakistan','Sri Lanka','Egypt','Other'];

  var NATIONALITY = ['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Republic of the)','Congo (DRC)','Costa Rica','Côte d’Ivoire','Croatia','Cuba','Cyprus','Czechia','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','São Tomé and Príncipe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','Other'];

  var PROFESSION = ['Medical imaging / radiography','Sonography','Nuclear medicine','Radiation therapy','MRI','Mammography','Medicine — consultant radiology','Medicine — general practice','Anaesthetic technology / theatre','Psychology','Physiotherapy','Occupational therapy'];
  var EXPERIENCE = ['Less than 1 year','1–2 years','3–5 years','6–10 years','More than 10 years'];
  var HEARD = ['LinkedIn','A colleague or friend','Google search','The Ethicare website','Social media','A recruitment event','Other'];

  var STAGES = [
    ['Not started yet', 'I haven’t begun the registration process.'],
    ['Researching requirements', 'Finding out what I need to register.'],
    ['Gathering documents', 'Collecting my qualifications and evidence.'],
    ['Application submitted', 'I’ve applied and I’m awaiting the outcome.'],
    ['Under assessment', 'My application is being assessed now.']
  ];
  var TIMELINES = ['As soon as possible','Within 3 months','3–6 months','6–12 months','12+ months','Just exploring'];
  var DEPENDENTS = ['1','2','3','4','5','6+'];
  var COSTS = ['Yes — I’d like to talk it through','Thanks, I’ve got it covered','Not sure yet'];
  var OPEN_AREA = 'Open to anywhere';
  var AU_AREAS = ['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','ACT','Northern Territory'];
  var NZ_AREAS = ['Auckland','Wellington','Canterbury','Waikato','Bay of Plenty','Otago','Manawatū','Northland'];

  /* ---------- state ---------- */
  var state = { step: 1, cvName: '', cvSize: 0 };
  var cvFile = null;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function hidden(name) { return form.querySelector('input[type="hidden"][name="' + name + '"]'); }
  function getVal(name) { var el = hidden(name); return el ? el.value : ''; }
  function setVal(name, v) { var el = hidden(name); if (el) el.value = v; }

  /* ONE onboarding (candidate-journey review, 14 Sep 2026). Move already asked which country;
     do not ask again here. Only the destination is carried — it is the one answer whose label
     is identical in both places — and only into an EMPTY field on a form with no draft, so a
     person who has already answered here is never overruled. The option card is selected the
     same way loadDraft reflects a saved answer. */
  function seedFromContext() {
    try {
      var ctx = window.EthicareContext;
      if (!ctx || !ctx.has() || getVal('destination')) return;
      var d = ctx.applyDestination(); if (!d) return;
      setVal('destination', d);
      $all('[data-group="destination"] .reg-opt').forEach(function (o) { o.classList.toggle('is-selected', o.getAttribute('data-value') === d); });
    } catch (e) {}
  }

  /* Arriving from a vacancy: /apply?role=<slug>[&intent=later]. The role is kept with the
     submission (hidden field role_of_interest, so the team knows which advert) and named in the
     aside, so \"Apply through Ethicare\" on a role page is an application for THAT role rather
     than a generic registration. intent=later is the \"interested but not ready\" door: same form,
     no different promise \u2014 the copy just says so. */
  function readRole() {
    try {
      var m = /[?&]role=([a-z0-9-]+)/.exec(location.search); if (!m) return;
      var slug = m[1], title = slug.replace(/-/g, ' ').replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
      var later = /[?&]intent=later/.test(location.search);
      setVal('role_of_interest', slug + (later ? ' (interested, not ready yet)' : ''));
      var lede = document.querySelector('.reg-aside .lede');
      if (lede) lede.innerHTML = (later
        ? 'You said you\u2019re interested in <b>' + title.replace(/</g, '&lt;') + '</b> but not ready to apply. Tell us where you\u2019re up to and we\u2019ll keep the role in mind \u2014 no CV needed yet, and nothing goes to the employer.'
        : 'You\u2019re applying for <b>' + title.replace(/</g, '&lt;') + '</b>. Tell us a little about you and where you\u2019re up to \u2014 about three minutes. The employer is not named or contacted until you say so.');
    } catch (e) {}
  }

  function prettySize(bytes) {
    if (!bytes) return '';
    var kb = bytes / 1024;
    if (kb < 1024) return Math.max(1, Math.round(kb)) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
  }

  /* ---------- populate <select> lists ---------- */
  function fillSelect(id, list, placeholder) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var html = '<option value="">' + placeholder + '</option>';
    for (var i = 0; i < list.length; i++) {
      html += '<option value="' + list[i].replace(/"/g, '&quot;') + '">' + list[i] + '</option>';
    }
    sel.innerHTML = html;
  }
  fillSelect('f-residence', RESIDENCE, 'Select…');
  fillSelect('f-nationality', NATIONALITY, 'Select…');
  fillSelect('f-profession', PROFESSION, 'Select…');
  fillSelect('f-experience', EXPERIENCE, 'Select…');
  fillSelect('f-heard', HEARD, 'Select…');

  /* ---------- render option groups (stage / timeline / dependents / cost) ---------- */
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';

  function renderStages() {
    var box = document.getElementById('grp-stage');
    box.innerHTML = STAGES.map(function (s) {
      return '<button type="button" class="reg-opt reg-opt-row" data-value="' + s[0] + '">' +
        '<span class="reg-radio"></span>' +
        '<span class="reg-opt-txt"><span class="reg-opt-title">' + s[0] + '</span>' +
        '<span class="reg-opt-desc">' + s[1] + '</span></span>' +
        '<span class="reg-tick">' + CHECK + '</span></button>';
    }).join('');
  }
  function renderTimeline() {
    var box = document.getElementById('grp-timeline');
    box.innerHTML = TIMELINES.map(function (t) {
      return '<button type="button" class="reg-opt reg-opt-pill" data-value="' + t + '"><span>' + t + '</span><span class="reg-tick sm">' + CHECK + '</span></button>';
    }).join('');
  }
  function renderDependents() {
    var box = document.getElementById('grp-dependents');
    box.innerHTML = DEPENDENTS.map(function (d) {
      return '<button type="button" class="reg-opt reg-opt-num" data-value="' + d + '"><span>' + d + '</span></button>';
    }).join('');
  }
  function renderCost() {
    var box = document.getElementById('grp-cost');
    box.innerHTML = COSTS.map(function (c) {
      return '<button type="button" class="reg-opt reg-opt-pill wide" data-value="' + c + '"><span>' + c + '</span><span class="reg-tick sm">' + CHECK + '</span></button>';
    }).join('');
  }
  renderStages(); renderTimeline(); renderDependents(); renderCost();

  function renderAreas() {
    var dest = getVal('destination');
    var list = [OPEN_AREA].concat(dest === 'Aotearoa New Zealand' ? NZ_AREAS : AU_AREAS);
    var selected = getVal('preferred_areas') ? getVal('preferred_areas').split(' · ') : [];
    var box = document.getElementById('grp-areas');
    box.innerHTML = list.map(function (a) {
      var on = selected.indexOf(a) !== -1;
      return '<button type="button" class="reg-chip' + (on ? ' is-selected' : '') + (a === OPEN_AREA ? ' open' : '') + '" data-value="' + a + '">' +
        '<svg class="chk" viewBox="0 0 24 24" fill="none" stroke="#02615D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' +
        '<span>' + a + '</span></button>';
    }).join('');
  }

  /* ---------- single-select groups (delegation) ---------- */
  $all('[data-group]').forEach(function (grp) {
    grp.addEventListener('click', function (e) {
      var opt = e.target.closest('.reg-opt');
      if (!opt || !grp.contains(opt)) return;
      var field = grp.getAttribute('data-group');
      setVal(field, opt.getAttribute('data-value'));
      $all('.reg-opt', grp).forEach(function (o) { o.classList.remove('is-selected'); });
      opt.classList.add('is-selected');
      clearErr(field);
      if (field === 'destination') { setVal('preferred_areas', ''); renderAreas(); }
      if (field === 'relocating_with') toggleDependents();
      saveDraft();
    });
  });

  /* ---------- areas multi-select (delegation) ---------- */
  document.getElementById('grp-areas').addEventListener('click', function (e) {
    var chip = e.target.closest('.reg-chip');
    if (!chip) return;
    var v = chip.getAttribute('data-value');
    var cur = getVal('preferred_areas') ? getVal('preferred_areas').split(' · ') : [];
    var i = cur.indexOf(v);
    if (i === -1) cur.push(v); else cur.splice(i, 1);
    setVal('preferred_areas', cur.join(' · '));
    chip.classList.toggle('is-selected');
    clearErr('preferred_areas');
    saveDraft();
  });

  function toggleDependents() {
    var wrap = document.getElementById('dependents-wrap');
    var show = getVal('relocating_with') === 'With my family';
    wrap.style.display = show ? '' : 'none';
    if (!show) { setVal('dependents', ''); $all('#grp-dependents .reg-opt').forEach(function (o) { o.classList.remove('is-selected'); }); }
  }

  /* ---------- draft persistence ---------- */
  function collect() {
    var data = { step: state.step };
    $all('input, select, textarea', form).forEach(function (el) {
      if (!el.name || el.type === 'file') return;
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else data[el.name] = el.value;
    });
    return data;
  }
  function saveDraft() {
    try {
      var d = collect();
      delete d['form-name']; delete d['bot-field']; delete d.cv;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {}
  }
  function loadDraft() {
    var d;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { d = null; }
    if (!d) return;
    Object.keys(d).forEach(function (k) {
      if (k === 'step') return;
      var el = form.querySelector('[name="' + CSS.escape(k) + '"]');
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!d[k];
      else el.value = d[k];
    });
    // reflect hidden-field selections into the option UI
    $all('[data-group]').forEach(function (grp) {
      var field = grp.getAttribute('data-group');
      var v = getVal(field);
      $all('.reg-opt', grp).forEach(function (o) {
        o.classList.toggle('is-selected', v && o.getAttribute('data-value') === v);
      });
    });
    // reflect checkbox custom boxes
    syncCheckUI();
    toggleDependents();
    renderAreas();
    var st = parseInt(d.step, 10); if (st >= 1 && st <= TOTAL) state.step = st;
  }

  /* ---------- custom checkboxes (consent / newsletter) ---------- */
  function syncCheckUI() {
    $all('.reg-check input[type="checkbox"]').forEach(function (cb) {
      cb.closest('.reg-check').classList.toggle('is-on', cb.checked);
    });
  }
  $all('.reg-check input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      cb.closest('.reg-check').classList.toggle('is-on', cb.checked);
      if (cb.name === 'consent') clearErr('consent');
      saveDraft();
    });
  });

  /* ---------- text/select inputs: clear error + save on change ---------- */
  $all('input, select, textarea', form).forEach(function (el) {
    if (!el.name || el.type === 'file' || el.type === 'checkbox') return;
    el.addEventListener('input', function () { clearErr(el.name); saveDraft(); });
    el.addEventListener('change', function () { clearErr(el.name); saveDraft(); });
  });

  /* ---------- CV upload ---------- */
  var cvInput = document.getElementById('f-cv');
  var dropzone = document.getElementById('cv-dropzone');
  var cvCard = document.getElementById('cv-card');

  function showCv() {
    if (state.cvName) {
      dropzone.style.display = 'none';
      cvCard.style.display = 'flex';
      $('#cv-name', cvCard).textContent = state.cvName;
      $('#cv-meta', cvCard).textContent = prettySize(state.cvSize) + ' · ready to submit';
    } else {
      dropzone.style.display = '';
      cvCard.style.display = 'none';
    }
  }
  function onFile(file) {
    if (!file) return;
    if (!/\.(pdf|docx?)$/i.test(file.name)) { setErr('cv', 'Please upload a PDF, DOC or DOCX file.'); return; }
    if (file.size > CV_MAX) { setErr('cv', 'That file is over 8 MB — please upload a smaller version.'); return; }
    cvFile = file; state.cvName = file.name; state.cvSize = file.size;
    clearErr('cv'); showCv();
  }
  cvInput.addEventListener('change', function () { onFile(cvInput.files && cvInput.files[0]); });
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('is-drag'); });
  dropzone.addEventListener('dragleave', function (e) { e.preventDefault(); dropzone.classList.remove('is-drag'); });
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('is-drag');
    var dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      try { cvInput.files = dt.files; } catch (err) {}
      onFile(dt.files[0]);
    }
  });
  $('#cv-remove').addEventListener('click', function () {
    cvFile = null; state.cvName = ''; state.cvSize = 0;
    try { cvInput.value = ''; } catch (e) {}
    showCv();
  });

  /* ---------- validation ---------- */
  /* The error boxes were visible but invisible to assistive tech: no aria-invalid on the
     field, and no aria-describedby tying the message to it, so a screen-reader user was told
     something failed but never which field or why. role="alert" on the box makes the message
     announce when it appears; the id/describedby pair makes it readable from the field. */
  function setErr(key, msg) {
    var box = form.querySelector('[data-err="' + key + '"]');
    if (box) {
      if (!box.id) box.id = 'reg-err-' + key;
      box.setAttribute('role', 'alert');
      box.querySelector('.reg-err-txt').textContent = msg;
      box.style.display = 'flex';
    }
    var input = form.querySelector('[name="' + key + '"]');
    if (input && (input.tagName === 'INPUT' || input.tagName === 'SELECT') && input.type !== 'hidden') {
      input.setAttribute('data-error', '1');
      input.setAttribute('aria-invalid', 'true');
      if (box && box.id) input.setAttribute('aria-describedby', box.id);
    }
  }
  function clearErr(key) {
    var box = form.querySelector('[data-err="' + key + '"]');
    if (box) box.style.display = 'none';
    var input = form.querySelector('[name="' + key + '"]');
    if (input && input.removeAttribute) {
      input.removeAttribute('data-error');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }
  function validateStep(step) {
    var e = {};
    var v = function (name) { var el = form.querySelector('[name="' + name + '"]'); return (el ? el.value : '').trim(); };
    if (step === 1) {
      if (!v('full_name')) e.full_name = 'Please enter your full name.';
      if (!v('email')) e.email = 'Please enter your email address.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) e.email = 'That doesn’t look like a valid email.';
      if (!v('phone')) e.phone = 'Please enter a phone number.';
      if (!v('country_of_residence')) e.country_of_residence = 'Please select your country of residence.';
      if (!v('nationality')) e.nationality = 'Please select your nationality.';
      if (!v('profession')) e.profession = 'Please select your profession.';
      if (!v('years_experience')) e.years_experience = 'Please select your years of experience.';
      if (!v('job_title')) e.job_title = 'Please enter your current job title.';
    } else if (step === 2) {
      if (!getVal('destination')) e.destination = 'Please choose Australia or New Zealand.';
      if (!getVal('registration_stage')) e.registration_stage = 'Let us know where you are with registration.';
    } else if (step === 3) {
      if (!getVal('relocate_timeline')) e.relocate_timeline = 'Please choose a timeline.';
      if (!getVal('relocating_with')) e.relocating_with = 'Please let us know who’s relocating.';
      if (getVal('relocating_with') === 'With my family' && !getVal('dependents')) e.dependents = 'How many will relocate with you?';
      if (!getVal('preferred_areas')) e.preferred_areas = 'Pick at least one area — or choose “Open to anywhere”.';
    } else if (step === 4) {
      if (!state.cvName) e.cv = 'Please upload your CV.';
      if (!form.querySelector('[name="consent"]').checked) e.consent = 'Please accept the privacy terms to continue.';
    }
    return e;
  }

  /* ---------- step navigation + chrome ---------- */
  function paint() {
    for (var i = 1; i <= TOTAL; i++) {
      var panel = document.getElementById('step-' + i);
      if (panel) panel.style.display = (i === state.step) ? '' : 'none';
    }
    // stepper
    $all('.reg-step').forEach(function (el) {
      var n = parseInt(el.getAttribute('data-n'), 10);
      el.classList.toggle('done', n < state.step);
      el.classList.toggle('current', n === state.step);
    });
    // progress
    var pct = Math.round(((state.step - 1) / TOTAL) * 100);
    var bar = document.getElementById('reg-progress'); if (bar) bar.style.width = pct + '%';
    // footer buttons
    document.getElementById('btn-back').style.visibility = state.step > 1 ? 'visible' : 'hidden';
    document.getElementById('btn-next-label').textContent = state.step < TOTAL ? 'Continue' : 'Submit registration';
    saveDraft();
  }
  /* Scrolling alone left keyboard and screen-reader users wherever the Continue button was,
     with no way to know which field to go back to. Focus moves to the first thing that failed. */
  function goToErrors(e) {
    var keys = Object.keys(e);
    keys.forEach(function (k) { setErr(k, e[k]); });
    window.scrollTo({ top: form.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
    var first = form.querySelector('[name="' + keys[0] + '"]');
    if (!first || first.type === 'hidden') first = form.querySelector('[data-group="' + keys[0] + '"] button, #grp-' + keys[0] + ' button');
    if (first && first.focus) { try { first.focus({ preventScroll: true }); } catch (er) { first.focus(); } }
  }
  function next() {
    var e = validateStep(state.step);
    if (Object.keys(e).length) { goToErrors(e); return; }
    /* Fired on the step being LEFT, so drop-off is the last step reached, not the last
       step rendered — a person who opens step 3 and abandons it has still reached 3. */
    if (window.track) window.track('apply_step', { step: state.step });
    if (state.step < TOTAL) { state.step++; paint(); window.scrollTo({ top: form.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' }); }
    else submit();
  }
  function back() { if (state.step > 1) { state.step--; paint(); } }

  document.getElementById('btn-next').addEventListener('click', next);
  document.getElementById('btn-back').addEventListener('click', back);
  form.addEventListener('submit', function (e) { e.preventDefault(); next(); });

  /* ---------- submit ---------- */
  function submit() {
    var e = validateStep(4);
    if (Object.keys(e).length) { goToErrors(e); return; }
    if (window.track) window.track('apply_submitted', {
      country: getVal('destination'),
      profession: getVal('profession') || (form.querySelector('[name="profession"]') || {}).value,
      cv_attached: state.cvName ? 'yes' : 'no',
      visibility_opt_in: (form.querySelector('[name="employer_visibility"]') || {}).checked ? 'yes' : 'no'
    });
    var btn = document.getElementById('btn-next');
    btn.disabled = true;
    document.getElementById('btn-next-label').textContent = 'Sending…';
    clearSubmitError();

    // native multipart submit — Netlify Forms only reliably captures file uploads on a standard (non-AJAX) form navigation
    var dest = getVal('destination') || '—';
    var rel = getVal('relocating_with') || '—';
    if (rel === 'With my family' && getVal('dependents')) rel += ' · ' + getVal('dependents') + ' relocating';
    try {
      sessionStorage.setItem(SUBMIT_KEY, JSON.stringify({
        first: (label('full_name') || '').trim().split(/\s+/)[0] || '',
        dest: dest,
        timeline: getVal('relocate_timeline') || '—',
        stage: getVal('registration_stage') || '—',
        relocating: rel,
        areas: getVal('preferred_areas') ? getVal('preferred_areas').replace(/ · /g, ', ') : '—',
        cv: state.cvName || '—',
        visibility: form.querySelector('[name="employer_visibility"]') && form.querySelector('[name="employer_visibility"]').checked
          ? 'Open to employer introductions'
          : 'Ethicare team only'
      }));
    } catch (err) {}
    // Queryable capture: fire a JSON copy of the form to the Supabase-backed
    // endpoint before the native (Netlify Forms) navigation. Keepalive so it
    // survives the redirect; best-effort, never blocks the submit.
    try {
      var cap = {};
      $all('[name]', form).forEach(function (el) {
        if (!el.name || el.type === 'file') return;
        cap[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      });
      fetch('/.netlify/functions/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ kind: 'application', page: '/apply', data: cap })
      }).catch(function () {});
    } catch (e2) {}
    HTMLFormElement.prototype.submit.call(form); // bypasses the submit-event handler; Netlify redirects to the form's action (?submitted=1) after capture
  }
  function submitError(msg) {
    var box = document.getElementById('reg-submit-error');
    box.querySelector('span').textContent = msg;
    box.style.display = 'flex';
  }
  function clearSubmitError() {
    var box = document.getElementById('reg-submit-error'); if (box) box.style.display = 'none';
  }

  function label(name) { var el = form.querySelector('[name="' + name + '"]'); return el ? el.value : ''; }
  function showDone(d) {
    try { localStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(SUBMIT_KEY); } catch (e) {}
    var dest = d.dest || '—';
    var regBody = dest === 'Australia' ? 'AHPRA' : (dest === 'Aotearoa New Zealand' ? 'your New Zealand board' : 'your registration board');
    var destLabel = dest === 'Australia' ? 'Australia' : (dest === 'Aotearoa New Zealand' ? 'New Zealand' : 'your destination');

    var setTxt = function (id, t) { var el = document.getElementById(id); if (el) el.textContent = t; };
    setTxt('done-name', d.first ? (', ' + d.first) : '');
    setTxt('done-dest-line', destLabel);
    setTxt('done-regbody', regBody);
    setTxt('sum-destination', dest);
    setTxt('sum-timeline', d.timeline || '—');
    setTxt('sum-stage', d.stage || '—');
    setTxt('sum-relocating', d.relocating || '—');
    setTxt('sum-areas', d.areas || '—');
    setTxt('sum-cv', d.cv || '—');
    setTxt('sum-visibility', d.visibility || 'Ethicare team only');

    document.getElementById('reg-card').style.display = 'none';
    var done = document.getElementById('reg-done');
    done.style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('btn-register-another').addEventListener('click', function () {
    cvFile = null; state = { step: 1, cvName: '', cvSize: 0 };
    try { cvInput.value = ''; } catch (e) {}
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    form.reset();
    $all('.reg-opt').forEach(function (o) { o.classList.remove('is-selected'); });
    $all('input[type="hidden"]', form).forEach(function (h) { if (h.name !== 'form-name') h.value = ''; });
    setVal('form-name', 'candidate-registration');
    syncCheckUI(); showCv(); toggleDependents(); renderAreas();
    document.getElementById('reg-done').style.display = 'none';
    document.getElementById('reg-card').style.display = '';
    var btn = document.getElementById('btn-next'); btn.disabled = false;
    paint();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- boot ---------- */
  if (/[?&]submitted=1/.test(location.search)) {
    var stash = null;
    try { stash = JSON.parse(sessionStorage.getItem(SUBMIT_KEY)); } catch (e) {}
    showDone(stash || {});
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  } else {
    loadDraft();
    seedFromContext();
    readRole();
  }
  syncCheckUI(); showCv(); toggleDependents(); renderAreas();
  paint();
})();
