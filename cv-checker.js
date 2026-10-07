/* CV Checker — Ethicare Resourcing.
   Everything runs on the device. The pasted text is held in memory only: it is
   never uploaded, never written to storage, and is gone when the tab closes. */
(function () {
  var ta = document.querySelector('[data-cv]');
  if (!ta) return;
  var meter = document.querySelector('[data-meter]');
  var runBtn = document.querySelector('[data-run]');
  var clearBtn = document.querySelector('[data-clear]');
  var out = document.querySelector('[data-results]');
  var head = document.querySelector('[data-headline]');
  var wrap = document.querySelector('[data-resultwrap]');
  var destSel = document.getElementById('rvDest');
  var profSel = document.getElementById('rvProf');
  var profNote = document.querySelector('[data-profnote]');
  var SK = window.EthicareCVSkills || null;
  var racts = document.querySelector('[data-racts]');
  var printMeta = document.querySelector('[data-printmeta]');
  var YEAR = new Date().getFullYear();

  var FILLER = ['excellent communication skills', 'good communication skills', 'strong communication skills', 'team player', 'works well in a team', 'work well in a team', 'hard working', 'hardworking', 'strong work ethic', 'passionate about', 'dedicated professional', 'highly motivated', 'self-motivated', 'self motivated', 'attention to detail', 'goes the extra mile', 'go the extra mile', 'fast-paced environment', 'fast paced environment', 'works well under pressure', 'work well under pressure', 'flexible and adaptable', 'proven track record', 'results-driven', 'can-do attitude', 'thinks outside the box', 'think outside the box', 'excellent interpersonal skills'];
  var NEEDS_EVIDENCE = ['cultural competence', 'culturally competent', 'cultural safety', 'patient advocacy', 'patient advocate', 'holistic care', 'compassionate care'];
  var PASSIVE = ['responsible for', 'duties included', 'duties involved', 'involved in', 'assisted in', 'assisted with', 'tasked with', 'helped to', 'in charge of', 'participated in', 'my duties'];

  var PERSONAL = [
    { re: /date of birth|\bd\.?o\.?b\b|\bborn\s+(?:on|in)\s+\d/i, label: 'Date of birth' },
    { re: /marital status|\bmarried\b|\bdivorced\b|\bwidowed\b/i, label: 'Marital status' },
    { re: /\bnationality\b/i, label: 'Nationality' },
    { re: /passport (?:no|number)|identity number|\bid number\b|national insurance|emirates id|\bnric\b/i, label: 'A passport or identity number' },
    { re: /\bage\s*[:\-]\s*\d{2}\b|\b\d{2}\s+years\s+old\b/i, label: 'Your age' },
    { re: /\bgender\s*[:\-]|\bsex\s*[:\-]/i, label: 'Gender' },
    { re: /\breligion\b/i, label: 'Religion' },
    { re: /\bdependants?\b|\bdependents?\b|number of children/i, label: 'Dependants' },
    { re: /place of birth/i, label: 'Place of birth' },
    { re: /\bphotograph\b/i, label: 'A reference to a photograph' }
  ];

  var LOCAL = [
    { re: /\bband\s*[2-9]\s*[ab]?\b/i, label: 'Band 5, Band 6 and so on', why: 'Pay bands do not exist in either country. Give the role and what you were accountable for instead.' },
    { re: /agenda for change|\bafc\b/i, label: 'Agenda for Change', why: 'The framework means nothing here. Describe the level of the role in words.' },
    { re: /\bnhs trust\b|\bthe trust\b|\btrust grade\b|\bfoundation trust\b/i, label: 'Trust', why: 'Say hospital, service or health board. Trust is a UK organisational term.' },
    { re: /\bccg\b|\bicb\b|\bpct\b/i, label: 'CCG, ICB or PCT', why: 'Commissioning bodies do not travel. Cut them, or write out what the organisation did.' },
    { re: /\bcqc\b/i, label: 'CQC', why: 'Write it out once, or drop it. The equivalent bodies here are different and work differently.' },
    { re: /\bwte\b/i, label: 'WTE', why: 'FTE is the term used in both countries.' },
    { re: /\bsho\b|\bstaff grade\b/i, label: 'SHO or staff grade', why: 'Grade names differ. Describe the responsibility rather than the grade.' },
    { re: /\bahp\b/i, label: 'AHP', why: 'Write allied health in full the first time you use it.' },
    { re: /\bcomserve\b|community service year/i, label: 'Community service', why: 'Name the country that required it and say what the year involved.' }
  ];

  var SECTIONS = [
    { name: 'A summary at the top', re: /candidate summary|professional summary|personal summary|career summary|personal statement|\bprofile\b|summary of experience/i, hard: true },
    { name: 'Clinical expertise or skills', re: /clinical expertise|clinical skills|core skills|key skills|areas of expertise|technical skills|clinical competenc|scope of practice/i, hard: true },
    { name: 'Employment history', re: /employment|work experience|career history|professional experience|work history|clinical posts|appointments held/i, hard: true },
    { name: 'Education and qualifications', re: /education|qualification|academic|\bdegree\b|\bbsc\b|\bmsc\b|\bdiploma\b/i, hard: true },
    { name: 'Soft skills', re: /soft skills|personal skills|transferable skills|interpersonal skills|personal attributes/i, hard: false },
    { name: 'Recent professional development', re: /continu\w* professional development|\bcpd\b|professional development|courses attended|training courses/i, hard: false },
    { name: 'Equipment or systems by name', re: /equipment|systems used|modalit|scanners|assessments used|\bpacs\b|\bris\b/i, hard: false },
    { name: 'References', re: /referee|references/i, hard: false }
  ];

  var SCALE = [/\b\d+\s*(?:patients|scans|cases|lists|examinations|exams|births|deliveries|clients|beds|staff|students|theatres|sessions|referrals|reports)/gi, /\bteam of \d+/gi, /\b1 in \d+/gi, /\b\d+\s*(?:per|a|an)\s+(?:day|week|shift|session|month|year)/gi, /\b\d+%/g, /\b\d+\s*(?:bed|chair|bay)\b/gi];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function wordCount(s) { s = s.trim(); return s ? s.split(/\s+/).length : 0; }
  function found(list, lower) {
    var hits = [];
    for (var i = 0; i < list.length; i++) { if (lower.indexOf(list[i]) !== -1) hits.push(list[i]); }
    return hits;
  }
  function dest() { return destSel && destSel.value === 'au' ? 'Australia' : 'New Zealand'; }

  function updateMeter() {
    var w = wordCount(ta.value);
    /* Cleanup on correction (DESIGN-SYSTEM.md form standard): once there is enough to check,
       the box stops reporting itself invalid and the "not enough text" card goes with it. */
    if (ta.getAttribute('aria-invalid') === 'true' && w >= 40) clearShort();
    if (!w) { meter.textContent = 'Nothing pasted yet.'; return; }
    var pages = Math.max(1, Math.round(w / 500));
    meter.textContent = w.toLocaleString() + (w === 1 ? ' word' : ' words') + ' \u00b7 roughly ' + pages + (pages === 1 ? ' page' : ' pages') + ' at eleven point';
  }

  /* ---------- the checks ---------- */
  function checkLength(t) {
    var w = wordCount(t), pages = Math.max(1, Math.round(w / 500));
    if (w < 250) return { s: 'fix', t: 'There is not much here', p: 'About ' + w + ' words. A clinical CV that a reader can act on usually runs to two or three pages. If you pasted only part of it, paste the rest — several of the checks below look at the whole document.' };
    if (w < 400) return { s: 'watch', t: 'Shorter than a reader expects', p: 'About ' + w + ' words, roughly one page. Senior readers are not looking for brevity here — they are looking for evidence. The usual missing part is scale: what you actually carried, day to day.' };
    if (w <= 1800) return { s: 'good', t: 'The length is right', p: 'About ' + w + ' words, roughly ' + pages + ' pages. That is the range a hiring manager in ' + dest() + ' expects.' };
    if (w <= 2600) return { s: 'watch', t: 'Long, but not unusual', p: 'About ' + w + ' words, roughly ' + pages + ' pages. Long is fine for a senior clinical CV as long as nothing repeats. The usual culprit is the same skills listed once in a skills section and again under every job.' };
    return { s: 'fix', t: 'Longer than it needs to be', p: 'About ' + w + ' words, roughly ' + pages + ' pages. Past about five, a reader stops reading and starts skimming for reasons to stop. Cut the repetition and shorten roles before 2010 to a title, an employer and dates.' };
  }

  function checkContact(t) {
    var email = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(t);
    var intl = /\+\s?\d[\d\s().\-]{7,}/.test(t);
    var localNum = /(?:^|[^\d+])0\d[\d\s().\-]{8,}/.test(t);
    if (email && intl) return { s: 'good', t: 'A reader can reach you', p: 'An email address and a number with an international dialling code. That sounds small; it is the single most common reason a shortlisted candidate is never contacted.' };
    if (email && localNum) return { s: 'fix', t: 'Your number will not dial from here', p: 'There is a number on the page but no international dialling code, so a recruiter in ' + dest() + ' cannot call it. Put the full code on the front of it.' };
    if (email) return { s: 'watch', t: 'No phone number we can see', p: 'We found an email address but no number. Add a mobile with the country code in front, and make sure it is one that works if you are abroad.' };
    return { s: 'fix', t: 'No contact details we can find', p: 'No email address on the page. If your details sit in a header, a text box or an image, most recruitment systems will not read them either. Put them in plain text at the top.' };
  }

  function checkRegistration(t) {
    var re = /registrat|registered with|\bahpra\b|\bhcpc\b|\bnmc\b|medical council|\bapc\b|annual practising certificate|registration number/i;
    var m = re.exec(t);
    if (!m) return { s: 'fix', t: 'Registration is not mentioned', p: 'Nothing on the page says where you are registered or where you are in the process for ' + dest() + '. It is the first thing a reader checks, and its absence reads as not started. One line at the top is enough.' };
    if (m.index < 1100) return { s: 'good', t: 'Registration is on page one', p: 'Where a reader looks for it. If your wording is vague about the stage you are at, the pathway checker will give you the right words for it.' };
    return { s: 'watch', t: 'Registration is buried', p: 'It is on the page, but far enough down that a reader skimming page one would not find it. Move it to the header block, under your contact details.' };
  }

  function checkPersonal(t) {
    var hits = [];
    for (var i = 0; i < PERSONAL.length; i++) { if (PERSONAL[i].re.test(t)) hits.push(PERSONAL[i].label); }
    if (!hits.length) return { s: 'good', t: 'No personal details that should not be there', p: 'No date of birth, nationality, marital status or identity number. Convention in both countries is that none of it belongs on a CV, and including it can make a reader uneasy about handling the document at all.' };
    return { s: 'fix', t: 'Details that do not belong on the page', p: 'These are standard on a CV in some countries and are not asked for in ' + dest() + '. Take them off. Where an immigration or registration process needs them, they are collected separately and securely.', list: hits };
  }

  function checkLocal(t) {
    var hits = [];
    for (var i = 0; i < LOCAL.length; i++) { if (LOCAL[i].re.test(t)) hits.push(LOCAL[i].label + ' \u2014 ' + LOCAL[i].why); }
    if (!hits.length) return { s: 'good', t: 'Nothing that needs translating', p: 'We did not find pay bands, commissioning bodies or grade names that a reader here would have to guess at.' };
    return { s: hits.length > 2 ? 'fix' : 'watch', t: 'Terms that will not travel', p: 'A reader in ' + dest() + ' will not know what these mean, and most will not stop to look them up. Say what the thing was instead of naming it.', list: hits };
  }

  function checkPhrases(t) {
    var lower = t.toLowerCase();
    var f = found(FILLER, lower), e = found(NEEDS_EVIDENCE, lower);
    var all = f.concat(e);
    if (!all.length) return { s: 'good', t: 'No stock phrases', p: 'Nothing here that appears on every other CV in the pile.' };
    return { s: f.length > 3 ? 'fix' : 'watch', t: 'Claims a reader has read a hundred times', p: 'None of these is untrue. They are just unevidenced, so they carry no weight, and you will be asked for an example of each at interview anyway. Replace each one with the example you would give.', list: all };
  }

  function checkSections(t) {
    var missing = [], hardMissing = 0;
    for (var i = 0; i < SECTIONS.length; i++) {
      if (!SECTIONS[i].re.test(t)) { missing.push(SECTIONS[i].name); if (SECTIONS[i].hard) hardMissing++; }
    }
    if (!missing.length) return { s: 'good', t: 'A reader can find every section', p: 'All eight of the things a reader goes looking for are somewhere on the page.' };
    return { s: hardMissing ? 'fix' : 'watch', t: hardMissing ? 'Sections a reader will go looking for' : 'A few sections a reader may miss', p: 'We could not find a heading for these. It may be there and worded differently — headings are what a reader scans for, so plain ones beat clever ones.', list: missing };
  }

  function checkScale(t) {
    var hits = {}, n = 0;
    for (var i = 0; i < SCALE.length; i++) {
      var m = t.match(SCALE[i]);
      if (m) for (var j = 0; j < m.length; j++) { var k = m[j].toLowerCase().trim(); if (!hits[k]) { hits[k] = 1; n++; } }
    }
    if (n >= 4) return { s: 'good', t: 'The scale of the work is on the page', p: 'Numbers like these are what turn a list of duties into evidence, and they are the part a reader remembers.' };
    if (n >= 1) return { s: 'watch', t: 'Some scale, but not much', p: 'We found ' + n + (n === 1 ? ' figure' : ' figures') + ' that give a sense of volume. Add a couple more: patients or scans a day, the size of the team, how often you were on call, the size of the department.' };
    return { s: 'fix', t: 'Nothing tells a reader the scale', p: 'There are no numbers here, so every job reads as a job description rather than your work. A reader has no way to tell a quiet service from a busy one. Patients a day, list sizes, team size, on-call frequency.' };
  }

  function checkDates(t) {
    var re = /\b(19[7-9]\d|20[0-4]\d)\s*(?:\u2013|\u2014|-|to|until)\s*((?:19[7-9]\d|20[0-4]\d)|present|current|date|now)\b/gi;
    var m, ranges = [];
    while ((m = re.exec(t)) !== null) {
      var end = /^\d{4}$/.test(m[2]) ? parseInt(m[2], 10) : YEAR;
      ranges.push([parseInt(m[1], 10), end]);
    }
    if (!ranges.length) return { s: 'fix', t: 'No date ranges we can read', p: 'A reader builds your chronology from dates, and without them cannot tell how long you have done anything. Give every role a month and year at each end.' };
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var gaps = [], reach = ranges[0][1];
    for (var i = 1; i < ranges.length; i++) {
      if (ranges[i][0] - reach >= 2) gaps.push(reach + ' to ' + ranges[i][0]);
      if (ranges[i][1] > reach) reach = ranges[i][1];
    }
    if (gaps.length) return { s: 'watch', t: 'Possible gaps in the chronology', p: 'Reading the dates in order, there may be time unaccounted for. If there is a reason, give it a line of its own \u2014 an unexplained gap invites worse assumptions than the truth, and dates read out of order can look like one.', list: gaps.slice(0, 3) };
    if (ranges.length === 1) return { s: 'watch', t: 'Only one dated role', p: 'One date range on the page. A reader wants the sequence, not just the current job. Date every role, most recent first.' };
    return { s: 'good', t: 'The chronology holds together', p: ranges.length + ' dated roles in sequence, with nothing obviously unaccounted for.' };
  }

  function checkVoice(t) {
    var lower = t.toLowerCase(), hits = found(PASSIVE, lower);
    if (!hits.length) return { s: 'good', t: 'Written in the active voice', p: 'No duty lists. Led, managed, developed, trained \u2014 that is what a reader is looking for.' };
    if (hits.length <= 2) return { s: 'watch', t: 'A little duty-list language', p: 'A few phrases describe the job rather than what you did in it. Swap them for what you did: led, ran, set up, trained, redesigned.', list: hits };
    return { s: 'fix', t: 'It reads as a job description', p: 'Phrases like these describe what the post involved, not what you contributed \u2014 and a reader cannot tell a strong clinician from an average one in the same post. Rewrite each as something you did.', list: hits };
  }

  var CHECKS = [checkContact, checkRegistration, checkPersonal, checkLocal, checkSections, checkScale, checkDates, checkVoice, checkPhrases, checkLength];

  /* ---------- profession checks (cv-skills-data.js, shared with the CV builder) ----------
     Does this CV give an employer here the clinical evidence they need to shortlist? Nothing in
     the library is mandatory: an area that is absent is never reported as a weakness on its own.
     We only say when a whole dimension is unstated, when a stated area is thin, or when
     equipment is described rather than named. */
  function profession(t) {
    if (!SK) return null;
    var chosen = profSel && profSel.value;
    if (chosen) return { key: chosen, guessed: false };
    var g = SK.detect(t);
    return g ? { key: g, guessed: true } : null;
  }
  /* "mental health" mid-sentence, but CT, MRI and EMDR stay as they are */
  function lc(n) { return /^[A-Z][A-Z]/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1); }
  function names(list) { list = list.map(lc); return list.length < 3 ? list.join(' and ') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]; }

  function checkAreas(t, P) {
    var pr = P.primary; if (!pr) return null;
    var found = pr.areas.filter(function (a) { return SK.any(t, a.terms); });
    if (!found.length) return { s: 'fix', t: 'It is not clear ' + pr.title, p: 'Employers often shortlist on this, and a reader will not assume a skill you have not written down. Say which apply to you, for example ' + pr.examples + '. Leave out any you do not do; nobody does all of them.' };
    return { s: 'good', t: 'Your ' + pr.noun + ' are easy to find', p: 'A reader scanning for these would find them. Make sure each one also shows up in the jobs where you did it, so a reader can tell how recent and how regular it is.', list: found.map(function (a) { return a.name; }) };
  }

  function checkDepth(t, P) {
    var pr = P.primary; if (!pr) return null;
    var withDepth = pr.areas.filter(function (a) { return a.depth && SK.any(t, a.terms); });
    if (!withDepth.length) return null;
    var thin = withDepth.filter(function (a) { return SK.hitsIn(t, a.depth.terms).length < 3; });
    if (!thin.length) return { s: 'good', t: 'There is detail behind your ' + names(withDepth.map(function (a) { return a.name; })), p: 'Enough specifics for a reader to judge the level you work at, which is what decides whether you are put forward.' };
    if (thin.length === 1) {
      var a = thin[0];
      return { s: 'watch', t: 'You mention ' + lc(a.name) + ', but not much about your ' + lc(a.name) + ' practice', p: 'A reader hiring for ' + lc(a.name) + ' looks for specifics before anything else. Consider adding ' + a.depth.ask + ', where they apply to you.' };
    }
    return { s: 'watch', t: 'Not much detail behind ' + names(thin.map(function (a) { return a.name; })), p: 'A reader hiring for these looks for specifics before anything else. Consider adding the following, where they apply to you.', list: thin.map(function (a) { return a.name + ': ' + a.depth.ask; }) };
  }

  function checkAlso(t, P, label) {
    if (!P.also || !P.also.length) return null;
    var missing = P.also.filter(function (d) { return !SK.any(t, d.terms); });
    if (!missing.length) return { s: 'good', t: 'The rest of what a reader in your profession looks for is there', p: P.also.map(function (d) { return d.name; }).join(', ') + ': all on the page.' };
    return { s: 'watch', t: missing.length === 1 ? 'One more thing a reader in your profession looks for' : 'More that a reader in your profession looks for', p: 'We could not find these. Add the ones that apply to you: they are often what separates two otherwise similar CVs.', list: missing.map(function (d) { return d.name + ': ' + d.ask; }) };
  }

  function checkKit(t, P) {
    var k = P.kit; if (!k) return null;
    var hasBrands = k.brands && k.brands.length, brand = hasBrands && SK.any(t, k.brands);
    var sys = k.systems && k.systems.length ? SK.any(t, k.systems) : true;
    var generic = k.generic && k.generic.length && SK.any(t, k.generic);
    if (!hasBrands) {
      if (sys) return { s: 'good', t: 'Your clinical system is named', p: 'A practice reading this knows how quickly you would find your way around theirs.' };
      return { s: 'watch', t: 'Name the system you work in', p: 'We could not find ' + k.systemsName + '. A practice here will want to know how quickly you would find your way around theirs.' };
    }
    if (brand && sys) return { s: 'good', t: 'Equipment named the way a reader wants it', p: 'Manufacturer and model, and the systems around them. A department can match that to what it runs.' };
    if (brand) return { s: 'watch', t: 'Name your systems too', p: 'Your equipment is named. Add ' + k.systemsName + ': it tells a reader how quickly you would find your way around theirs.' };
    return { s: 'watch', t: generic ? 'Your equipment is described, not named' : 'No equipment named', p: 'Departments here run particular makes, and a reader matching you to theirs looks for the manufacturer and model: ' + k.example + '.' + (sys ? '' : ' Name ' + k.systemsName + ' as well.') };
  }

  function profChecks(t) {
    var pf = profession(t);
    if (profNote) profNote.textContent = '';
    if (!pf || pf.key === 'other') {
      if (profNote) profNote.textContent = pf ? '' : 'Choose your profession above and we will also check the clinical detail employers in it scan for, such as modalities, therapeutic approaches and equipment by name.';
      return [];
    }
    var P = SK.get(pf.key), label = SK.label(pf.key);
    if (profNote && pf.guessed) profNote.textContent = 'Checked as a CV for ' + label.toLowerCase().replace(/ — .*/, '') + '. If that is wrong, choose your profession above.';
    return [checkAreas(t, P), checkDepth(t, P), checkAlso(t, P, label), checkKit(t, P)].filter(Boolean);
  }

  /* ---------- render ---------- */
  var LABEL = { fix: 'A reader notices this', watch: 'Worth a second look', good: 'Reads well' };
  var ORDER = { fix: 0, watch: 1, good: 2 };

  function run() {
    var t = ta.value;
    if (wordCount(t) < 40) {
      /* The one validation failure this tool has. The message announces (role="alert"), the
         textarea is marked invalid and described by it, and focus goes to the textarea — the
         control that failed — rather than to the results heading below it. */
      head.textContent = 'Paste a bit more and we can be useful';
      out.innerHTML = '<article class="rv-card watch" id="cvc-short" role="alert"><div class="rv-top"><span class="rv-pill watch">Not enough to read</span><h3>There is not enough text to check</h3></div><p>Open your CV, select all of it, copy, and paste the whole document into the box above. Formatting does not matter and headings are welcome \u2014 several of the checks look for them.</p></article>';
      wrap.hidden = false;
      if (racts) racts.hidden = true;
      ta.setAttribute('aria-invalid', 'true');
      ta.setAttribute('aria-describedby', 'cvc-short');
      ta.focus();
      return;
    }
    clearShort();
    var results = [];
    for (var i = 0; i < CHECKS.length; i++) { results.push(CHECKS[i](t)); }
    results = results.concat(profChecks(t));
    results.sort(function (a, b) { return ORDER[a.s] - ORDER[b.s]; });

    var fixes = 0, watches = 0;
    for (var j = 0; j < results.length; j++) { if (results[j].s === 'fix') fixes++; else if (results[j].s === 'watch') watches++; }

    if (fixes > 2) head.textContent = fixes + ' things a reader would notice before anything else';
    else if (fixes) head.textContent = fixes === 1 ? 'One thing to fix, then it is in good shape' : 'Two things to fix, then it is in good shape';
    else if (watches) head.textContent = 'Nothing a reader would trip on, and ' + watches + ' worth a second look';
    else head.textContent = 'This one reads the way it should';

    var html = '';
    for (var k = 0; k < results.length; k++) {
      var r = results[k];
      html += '<article class="rv-card ' + r.s + '"><div class="rv-top"><span class="rv-pill ' + r.s + '">' + LABEL[r.s] + '</span><h3>' + esc(r.t) + '</h3></div><p>' + esc(r.p) + '</p>';
      if (r.list && r.list.length) {
        html += '<ul class="rv-list">';
        for (var l = 0; l < r.list.length; l++) { html += '<li>' + esc(r.list[l]) + '</li>'; }
        html += '</ul>';
      }
      html += '</article>';
    }
    out.innerHTML = html;
    wrap.hidden = false;
    show();
  }

  function destName() { return destSel && destSel.value === 'au' ? 'Australia' : 'New Zealand'; }
  function show() {
    if (racts) racts.hidden = false;
    if (printMeta) printMeta.textContent = 'Ethicare Resourcing CV check \u2014 for applications to ' + destName() + '. Guidance a reader here might give, not a decision; you are welcome to disagree with any of it. ethicareresourcing.com/cv-checker';
    var y = wrap.getBoundingClientRect().top + window.pageYOffset - 78;
    window.scrollTo({ top: y, behavior: 'smooth' });
    head.setAttribute('tabindex', '-1');
    head.focus({ preventScroll: true });
  }
  function clearShort() {
    ta.removeAttribute('aria-invalid');
    ta.removeAttribute('aria-describedby');
    if (document.getElementById('cvc-short')) { out.innerHTML = ''; wrap.hidden = true; if (racts) racts.hidden = true; }
  }

  ta.addEventListener('input', updateMeter);
  runBtn.addEventListener('click', run);
  clearBtn.addEventListener('click', function () {
    ta.value = '';
    clearShort();
    updateMeter();
    out.innerHTML = '';
    wrap.hidden = true;
    if (racts) racts.hidden = true;
    ta.focus();
  });
  if (destSel) destSel.addEventListener('change', function () { if (!wrap.hidden) run(); });
  if (profSel && SK) {
    SK.PROFESSIONS.forEach(function (p) { var o = document.createElement('option'); o.value = p.value; o.textContent = p.label; profSel.appendChild(o); });
    profSel.addEventListener('change', function () {
      var ctx = window.EthicareContext, c = SK.TO_CONTEXT[profSel.value];
      if (ctx && ctx.write && c) ctx.write({ profession: c });
      if (!wrap.hidden) run();
    });
  }
  /* 28 Sep 2026 — shared answers (candidate-context.js): seed from what the candidate has already said, write back what they say here, and show the strip. */
  (function () {
    var ctx = window.EthicareContext; if (!ctx || !destSel) return;
    function seed() {
      var changed = false, d = ctx.dest();
      if (d && destSel.value !== d) { destSel.value = d; changed = true; }
      var pk = SK && ctx.profession && SK.FROM_CONTEXT[ctx.profession()];
      if (pk && profSel && profSel.value !== pk) { profSel.value = pk; changed = true; }
      if (changed && !wrap.hidden) run();
    }
    seed();
    destSel.addEventListener('change', function () { if (ctx.write && ctx.destMode() !== 'both') ctx.write({ dest: destSel.value }); });
    ctx.onChange(seed);
    ctx.mount('#ctx-strip', { intro: 'Tell us where you are applying and the checks that change with the destination follow.' });
  })();
  if (racts) { var printBtn = racts.querySelector('[data-print]'); if (printBtn) printBtn.addEventListener('click', function () { window.print(); }); }
  updateMeter();

  /* ---------------------------------------------------------------------------
     Bring in the CV built on /build-your-cv.

     The two tools are about one document and could not pass it between them.
     Note what this deliberately does NOT do: it does not give this page a store.
     The copy above promises "nothing is uploaded and nothing is saved", and a
     pasted CV is a name, a phone number and an employment history — exactly the
     kind of thing that promise exists to protect. So the flow is one-way: the
     builder already holds a draft the user chose to save there, and we read it
     into memory here. Nothing new is written.
     --------------------------------------------------------------------------- */
  var BUILDER_KEY = 'ethicare-cv-builder-v1';

  function builderDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(BUILDER_KEY) || 'null');
      if (!d || !d.f) return null;
      var f = d.f;
      /* a draft with no name and no roles is an empty form, not a CV */
      var hasRole = Array.isArray(f.roles) && f.roles.some(function (r) { return r && (r.title || r.org); });
      if (!f.name && !hasRole) return null;
      return d;
    } catch (e) { return null; }
  }

  function draftToText(d) {
    var f = d.f, L = [];
    function push(s) { if (s && String(s).trim()) L.push(String(s).trim()); }
    function blank() { L.push(''); }

    push(f.name);
    push(f.jobTitle);
    push([f.email, f.mobile, f.location].filter(Boolean).join(' | '));
    push(f.rights);
    push(f.regLine);
    if (f.board || f.regNumber) push([f.board, f.regNumber].filter(Boolean).join(' '));
    blank();

    var summary = [f.sumWho, f.sumBring, f.sumOnly, f.sumWhy].filter(function (x) { return x && x.trim(); });
    if (summary.length) { push('PROFESSIONAL SUMMARY'); summary.forEach(push); blank(); }

    if (Array.isArray(f.expertise) && f.expertise.some(function (e) { return e.group || e.items; })) {
      push('CLINICAL EXPERTISE');
      f.expertise.forEach(function (e) { if (e.group || e.items) push((e.group ? e.group + ': ' : '') + (e.items || '')); });
      blank();
    }
    if (f.equipment) { push('EQUIPMENT AND SYSTEMS'); push(f.equipment); blank(); }

    if (Array.isArray(f.roles) && f.roles.length) {
      push('EMPLOYMENT HISTORY');
      f.roles.forEach(function (r) {
        if (!r.title && !r.org) return;
        push([r.title, r.org, r.loc].filter(Boolean).join(', ') + (r.dates ? '  ' + r.dates : ''));
        String(r.bullets || '').split('\n').forEach(function (b) { if (b.trim()) push('- ' + b.trim()); });
        blank();
      });
    }
    if (Array.isArray(f.soft) && f.soft.some(function (s) { return s.skill || s.story; })) {
      push('WORKING STYLE');
      f.soft.forEach(function (s) { if (s.skill || s.story) push((s.skill ? s.skill + ': ' : '') + (s.story || '')); });
      blank();
    }
    if (Array.isArray(f.edu) && f.edu.some(function (e) { return e.qual; })) {
      push('EDUCATION');
      f.edu.forEach(function (e) { if (e.qual) push([e.qual, e.inst, e.loc].filter(Boolean).join(', ') + (e.dates ? '  ' + e.dates : '')); });
      blank();
    }
    if (Array.isArray(f.cpd) && f.cpd.some(function (c) { return c.title; })) {
      push('RECENT CPD');
      f.cpd.forEach(function (c) { if (c.title) push([c.title, c.provider, c.date].filter(Boolean).join(', ')); });
      blank();
    }
    if (d.refsMode === 'request') { push('REFERENCES'); push('Available on request.'); }
    else if (Array.isArray(f.refs) && f.refs.some(function (r) { return r.name; })) {
      push('REFERENCES');
      f.refs.forEach(function (r) { if (r.name) push([r.name, r.role, r.org, r.rel, r.email].filter(Boolean).join(', ')); });
    }
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function mountImport() {
    var acts = document.querySelector('.rv-acts');
    if (!acts || !builderDraft()) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'rv-btn quiet';
    b.textContent = 'Use the CV I built here';
    b.addEventListener('click', function () {
      var d = builderDraft();
      if (!d) return;
      if (ta.value.trim() && !confirm('Replace what is in the box with the CV you built?')) return;
      ta.value = draftToText(d);
      updateMeter();
      if (destSel && d.dest) destSel.value = d.dest;
      if (profSel && d.profession && d.profession !== 'other') profSel.value = d.profession;
      ta.focus();
      run();
    });
    acts.appendChild(b);
  }
  mountImport();

})();
