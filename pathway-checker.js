/* ================================================================
   ETHICARE RESOURCING — Registration pathway checker (/pathway-checker)
   Vanilla controller. All regulator data, URLs, statuses and result
   copy live in pathway-checker-data.js — never in here.
   Answers draft-save to localStorage. ?profession={id} preselects.
   ================================================================ */
(function () {
  'use strict';

  var app = document.getElementById('pw-app');
  if (!app) return;

  /* The form is as long as YOUR answers make it. Profession-specific questions used to pile onto
     step 5 alongside English and career stage — an NZ doctor met seven questions on one screen,
     which is a wall, not a form. They now have their own step, and that step only exists for the
     professions that have questions. The counter reflects the real length rather than a fixed 5. */
  var RESULT = 7;
  function qsteps() { return profQuestionSet() ? 6 : 5; }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  var LSK = 'ethicare_pathway_checker_draft_v1';
  var SENT = 'ethicare_pathway_checker_sent_v1';
  var A0 = { profession: '', destination: '', qualCountry: '', qualLevel: '', recentCountry: '', registered: '', regCountry: '', practising: '', lastPractised: '', regProgress: '', english: '', doctorStage: '', doctorSpecialist: '', doctorSpecQual: '', odpExp: '', odpStanding: '' };
  /* Profession question fields are declared in the DATA file, so derive them here rather than
     keeping a parallel list by hand. The hand-kept version had already fallen behind twice:
     a field missing from A0 is dropped when the saved draft is restored, so the answer looks
     accepted, survives until the page reloads, and then silently reverts to unanswered. */
  (function () {
    var d = window.ETHICARE_PATHWAYS, q = d && d.profQuestions;
    if (!q) return;
    Object.keys(q).forEach(function (k) {
      (q[k].questions || []).forEach(function (x) { if (x.field && !(x.field in A0)) A0[x.field] = ''; });
    });
  })();
  var L0 = { name: '', email: '', phone: '', country: '', dest: '', timeframe: '', consent: false, priorities: [], party: '' };

  var st = { step: 1, answers: assign({}, A0), err: '', errKeys: [], lead: assign({}, L0), leadErr: '', leadDone: false, emailMe: false };
  var moveFocus = false;   // set on step changes only — never while someone is typing

  function assign(t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; } return t; }
  function D() { return window.ETHICARE_PATHWAYS || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var DRAFT_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // a month-old draft is dropped rather than shown as current
  function save() { try { localStorage.setItem(LSK, JSON.stringify({ answers: st.answers, step: st.step, ts: Date.now() })); } catch (e) {} }

  /* ---------------- state ---------------- */
  function setA(k, v) {
    var a = st.answers;
    a[k] = v;
    st.err = '';
    save(); render();
  }
  function targets() { var v = st.answers.destination; return v === 'australia' ? ['au'] : v === 'new-zealand' ? ['nz'] : ['au', 'nz']; }
  function profOf() { var d = D(); if (!d) return null; var id = st.answers.profession; for (var i = 0; i < d.professions.length; i++) if (d.professions[i].id === id) return d.professions[i]; return null; }
  function odpBranch() { var a = st.answers; return a.profession === 'anaesthetic-technician' && a.qualCountry === 'United Kingdom' && targets().indexOf('nz') >= 0; }

  /* ---------------- notes ---------------- */
  function englishNote(cc) {
    var a = st.answers, d = D();
    if (!a.english) return null;
    var href = cc === 'au' ? d.english.au.url : null;
    var tests = ['IELTS', 'OET', 'PTE', 'TOEFL', 'Another test'], body;
    var FIRST_LANG = 'English is my first language';
    var RECOG_ROUTE = 'I trained and practised in English in a recognised country';
    var recog = (d.english && d.english.recognisedCountries) || [];
    if (a.english === FIRST_LANG || a.english === RECOG_ROUTE) {
      /* Both regulators run an exemption, and neither takes it on your word: each is tied to a
         country list AND to where you were educated. So we say "likely", name the list, and
         send them to the standard rather than declaring an exemption we cannot grant. */
      var qc = a.qualCountry, on = !!qc && recog.indexOf(qc) >= 0;
      body = a.english === FIRST_LANG
        ? 'There is a first-language route with both regulators, but it is not granted on nationality alone — it is tied to a list of recognised countries and to where you were educated. '
        : 'That route exists with both regulators. It turns on where you were educated and examined, not on where you were born. ';
      body += on
        ? 'Your qualification from ' + theCountry(qc).replace(/^The /, 'the ') + ' is on the list that recurs in both standards, so an exemption is likely. Check the conditions before you rely on it — they usually reach back to your secondary schooling as well as your degree.'
        : (qc
          ? 'Your qualification from ' + theCountry(qc).replace(/^The /, 'the ') + ' is not on the list that recurs in both standards, so plan for a test unless the regulator tells you otherwise. It is worth asking rather than assuming.'
          : 'Tell us where you qualified and we can be more specific.');
      body += ' Commonly recognised: ' + recog.join(', ') + '.';
    }
    else if (tests.indexOf(a.english) >= 0) body = 'Keep your ' + (a.english === 'Another test' ? 'test' : a.english) + ' evidence and check it meets the current standard — requirements vary by regulator and change (Australian minimum test scores changed in April 2026).';
    else if (a.english === 'No' || a.english === 'I\u2019m not sure') body = 'Most regulators require evidence of English-language competence for initial registration. Check the current standard early — and before booking any test.';
    else body = 'Education and professional pathways can satisfy some regulators\u2019 English standards — confirm the current criteria before relying on this route.';
    return { title: 'English-language evidence', body: body, css: 'mint', href: href, linkLabel: href ? 'Current English standard' : null };
  }
  /* Profession-specific follow-ups. The set lives in the data file so adding a profession
     never means touching this renderer. A question tagged with a country is only asked when
     that country is actually a destination — no point asking about a NZ scope of practice
     from someone looking only at Australia. */
  function profQuestionSet() {
    var d = D() || {}, prof = profOf();
    if (!prof) return null;
    var set = (d.profQuestions || {})[prof.record];
    if (!set) return null;
    var tg = targets();
    /* A question that cannot change YOUR answer should not be on YOUR screen. `when` gates a
       question on an earlier answer, which is how the consultant-only VOC4 criteria stay off a
       registrar's form. */
    var av = st.answers;
    var qs = set.questions.filter(function (q) {
      if (q.cc && tg.indexOf(q.cc) < 0) return false;
      if (q.when && (q.when.in || []).indexOf(av[q.when.field]) < 0) return false;
      return true;
    });
    return qs.length ? { kicker: set.kicker, questions: qs } : null;
  }
  function profQuestionsBlock() {
    var set = profQuestionSet(), a = st.answers;
    if (!set) return '';
    return '<div class="pw-follow"><div class="pw-followk">' + esc(set.kicker) + '</div>' +
      set.questions.map(function (q, i) {
        var control;
        if (q.type === 'select') {
          /* A long list is a dropdown, not fifty buttons. Options come from a named rule so
             the list has one home, with the escape hatches appended after it. */
          var d2 = D() || {}, rule = (d2.rules || {})[q.optionsFrom] || { countries: [] };
          var rows = rule.countries.map(function (c) { return [c, c]; }).concat(q.extras || []);
          control = '<div class="pw-f" style="max-width:520px"><div class="pw-sel">' +
            '<select id="pw-' + esc(q.field) + '" data-field="' + esc(q.field) + '" aria-label="' + esc(q.q) + '">' +
            '<option value="">' + esc(q.placeholder || 'Select\u2026') + '</option>' +
            rows.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (a[q.field] === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
            '</select>' + chev() + '</div></div>';
        } else {
          control = '<div class="pw-opts row">' + optRow(q.opts, q.field, a[q.field]) + '</div>';
        }
        return '<div class="pw-q2' + (i === 0 ? ' flush' : '') + '">' + esc(q.q) + '</div>' + control +
          (q.hint ? '<p class="pw-hint">' + esc(q.hint) + '</p>' : '');
      }).join('') + '</div>';
  }
  /* What the answers MEAN. Kept separate from the questions so the data file stays a list of
     questions and this file stays the place where guidance is written. Nothing here promises
     an outcome — each note names the condition and hands the decision back to the regulator. */
  var lastProfFired = null;
  function profAnswerNotes(key, cc) {
    var a = st.answers, out = [];
    lastProfFired = null;
    if (key === 'occupational-therapist' && cc === 'nz') {
      /* Eligibility is computed from answers we ALREADY have — country of qualification and
         current registration — rather than asked again. The only genuine unknowns are the
         programme's WFOT accreditation and whether a qualifying referee exists. */
      var ot = (D().rules || {}).nzOtAbridged || { countries: [], wfotNamed: [] };
      var qualIn = ot.countries.indexOf(a.qualCountry) >= 0;
      var regIn = a.registered === 'yes' && ot.countries.indexOf(a.regCountry) >= 0;
      var toAu = a.registered === 'yes' && a.regCountry === 'Australia';
      var wfotOnlyThree = qualIn && ot.wfotNamed.indexOf(a.qualCountry) < 0;   // South Africa
      if (toAu) {
        out.push({ title: 'Neither overseas pathway applies to you', group: 'route', body: 'Registered with Ahpra in Australia, you come to New Zealand under Trans-Tasman mutual recognition rather than the overseas-trained route — a different and generally faster process. Do not start an overseas application by mistake.', css: 'mint', href: 'https://www.otboard.org.nz/site/rp/ttmra?nav=sidebar', linkLabel: 'OTBNZ — TTMRA' });
      } else if (qualIn && regIn && a.otWfot === 'yes') {
        out.push({ title: 'You look like an abridged pathway applicant', group: 'route', body: 'You qualified in ' + theCountry(a.qualCountry).replace(/^The /, 'the ') + ', you are currently registered in a listed country, and your programme is WFOT-accredited — that is the combination the abridged pathway is written for. The Board still decides, so apply on the abridged form and let them confirm it rather than assuming either way.' + (wfotOnlyThree ? ' One caution specific to South Africa: the Board’s page names four countries in its heading but only the UK, Ireland and Canada in the qualification requirement. That inconsistency is theirs, not ours — ask them directly before you pay the fee.' : ''), css: 'mint', href: ot.abridgedUrl, linkLabel: 'OTBNZ abridged pathway' });
      } else if (qualIn && regIn && a.otWfot === 'unsure') {
        out.push({ title: 'One thing to check before you apply', group: 'route', body: 'Your country of qualification and your registration both fit the abridged pathway. The remaining condition is that the programme itself is WFOT-accredited, and that is worth confirming first — it decides which application form you complete and which documents you gather.', css: 'sand', href: ot.wfotUrl, linkLabel: 'WFOT approved programmes' });
      } else if (qualIn && regIn && a.otWfot === 'no') {
        out.push({ title: 'The standard overseas pathway applies', group: 'route', body: 'The abridged pathway needs a WFOT-accredited programme as well as the country and registration conditions. Without it you apply through the standard route: the same standard, more scrutiny of your course content, and a detailed syllabus alongside your certificate and transcript.', css: 'sand', href: ot.url, linkLabel: 'OTBNZ — overseas qualified' });
      } else if (qualIn && !regIn) {
        out.push({ title: 'Qualified in a listed country, but not registered there', group: 'route', body: 'The abridged pathway asks for both: a qualification from the UK, Ireland, Canada or South Africa AND current registration in one of them. You have the first. If your registration has lapsed or sits elsewhere, expect the standard overseas pathway — worth confirming with the Board, because it changes the documents you gather.', css: 'sand', href: ot.abridgedUrl, linkLabel: 'OTBNZ abridged pathway' });
      } else if (a.qualCountry) {
        out.push({ title: 'The standard overseas pathway applies', group: 'route', body: 'The abridged pathway is limited to qualifications from the UK, Ireland, Canada and South Africa with current registration in one of those countries. Everyone else goes through the standard route. That is not a lesser outcome — the standard is identical — but the Board looks more closely at your course content, so a detailed syllabus or course description matters as much as your certificate.', css: 'sand', href: ot.url, linkLabel: 'OTBNZ — overseas qualified' });
      }
      out.push({ title: 'English: an exemption may apply to you', group: 'need', body: 'OTBNZ asks for proof of English only if English is <strong>not</strong> your first language, and it accepts OET or IELTS. If English is your first language you should not need a test at all. We would still advise checking the Board’s current English language policy before planning around it — requirements change, and the Board publishes this one separately from the main application page.', css: 'mint', href: 'https://otboard.org.nz/document/8497/704%20English%20language%20policy%20for%20registration.pdf', linkLabel: 'OTBNZ English language policy' });
      if (a.otReferee === 'no' || a.otReferee === 'unsure') {
        out.push({ title: 'Your referees need one specific person', group: 'need', body: 'Three referees, and at least one must be an occupational therapist you have worked with for more than six months in the last two years. On the standard pathway that person is also asked to read your competence self-assessment and confirm it represents your practice fairly. If you are not sure who that would be, start thinking about it now rather than at the point of applying.', css: 'sand' });
      }
      out.push({ title: 'What it costs and how long it takes', group: 'cost', body: 'Registration as an overseas-qualified applicant is ' + ot.fee + '. A practising certificate is ' + ot.apc + ', and you need one before you can work. Processing takes ' + ot.processing + ' — several documents must be posted rather than uploaded, so build the postage into your timeline. The Board may also require primary source verification of your identity and qualifications, at your own cost, and you only find that out after assessment.', css: 'mint' });
    }
    if (key === 'doctor' && cc === 'nz') {
      /* Scope first, then pathway. The Council names four vocational pathways and the
         qualification's ORIGIN picks between them, so a UK CCT and a South African, Canadian
         or American fellowship are genuinely different routes — not the same route with a
         different certificate. Career stage decides whether any of that applies at all. */
      var R = D().rules || {};
      var chs = R.nzDoctorComparable || { countries: [], url: '' };
      var voc4 = R.nzVoc4 || { countries: [] };
      var stage = a.doctorStage || (a.doctorSpecialist === 'yes' ? 'smo' : '');
      /* Two different countries, two different tests. `qual` is the PRIMARY medical degree and
         drives the competent authority route; `specQual` is where the specialist award was
         issued and drives VOC4. Using one for both is how an Indian MBBS with a UK CCT ends up
         scored wrongly twice — refused the fast track it qualifies for, and offered a competent
         authority route it does not. */
      var qual = a.qualCountry, recent = a.recentCountry || a.regCountry || a.qualCountry;
      var specQual = a.docSpecCountry || a.qualCountry;
      var australasian = specQual === 'New Zealand' || specQual === 'Australia';

      if (stage === 'smo') {
          var appr = R.nzApprovedAustralasian || { byProfession: {} };
          var mine = appr.byProfession[a.profession];
          out.push({ title: mine ? 'The approved Australasian qualification for ' + mine.area + ' is ' + mine.quals[0].split(' — ')[0] : 'First, is your qualification on the Council\u2019s Australasian list?', group: 'route', body: (mine ? 'For ' + mine.area + ' the Council lists <strong>' + mine.quals[0] + '</strong>. ' : '') + 'That distinction decides your pathway, and it is a qualification test rather than a country one. Hold the listed Australasian fellowship and you apply through <strong>VOC1</strong> (if you already hold general registration) or <strong>VOC2</strong> (if you do not). Hold anything else and the Council treats it, in its own words, as an <strong>overseas postgraduate qualification</strong> — which is what routes you to VOC3 or the VOC4 fast-track below.', css: 'mint', href: appr.url, linkLabel: 'MCNZ — approved Australasian qualifications' });
          /* Prefer what they TOLD us over what we infer from their country: a UK-trained doctor
             can hold FRANZCP, and a fellowship from elsewhere is not a CCT. */
          if (a.qualLevel === 'australasian') out.push({ title: 'You hold the Australasian fellowship — that is the short route', group: 'route', body: 'This is the qualification New Zealand trains its own specialists to, so you are not being assessed against a foreign standard. You apply through <strong>VOC1</strong> if you already hold general registration, or <strong>VOC2</strong> if you do not. Neither VOC3 nor the VOC4 fast-track applies to you — they exist for qualifications the Council treats as overseas.', css: 'mint', href: R.nzVoc12Url, linkLabel: 'MCNZ — VOC1 and VOC2' });
          if (a.qualLevel !== 'australasian' && voc4.countries.indexOf(specQual) >= 0) { lastProfFired = { rule: voc4, country: specQual };
          out.push({ title: 'VOC4 fast-track may be open to you', group: 'route', body: 'You hold a postgraduate qualification from ' + theCountry(specQual).replace(/^The /, 'the ') + ', so the Council\u2019s <strong>VOC4</strong> fast-track may apply. Five things have to line up: an acceptable primary medical qualification; a postgraduate qualification on the Council\u2019s <strong>approved list</strong> (updated ' + voc4.qualListDate + '); an approved area of medicine; <strong>24 months in the past 5 years at 0.5 FTE or more, including 12 months in the last 18</strong> — all of it in a comparable health system country; and a New Zealand job offer at consultant or specialist level. Processing is ' + voc4.processing + '.', css: 'mint', href: voc4.url, linkLabel: 'MCNZ — VOC4 fast-track' });
          /* The country is necessary, never sufficient — and the card above reads as an
             invitation. The list covers NINE areas of medicine and radiology is not among
             them, so a UK radiologist holding a CCT would otherwise be told the fast track
             may be open when it is closed to their specialty outright. Read at source
             27 August 2026 from the list PDF, not from the VOC4 landing page. */
          if (voc4.approvedAreas) out.push({ title: 'Check your area of medicine against the list — it is shorter than people expect', group: 'route', body: 'The fast track covers nine areas, and the list is the eligibility test rather than a guide to it: <strong>' + voc4.approvedAreas.join('</strong>; <strong>') + '</strong>. ' + esc(voc4.notOnList || '') + (voc4.countryScope ? ' ' + esc(voc4.countryScope) : ''), css: 'sand', href: voc4.listUrl || voc4.qualListUrl, linkLabel: 'MCNZ — approved qualifications list (PDF)' });
          if (voc4.ukAwardRule && specQual === 'United Kingdom') out.push({ title: 'What has to sit alongside the fellowship', group: 'need', body: esc(voc4.ukAwardRule) + ' There is no third option, which is the part worth checking before you apply rather than after.', css: 'sand' });
          if (voc4.voc3Carveouts) out.push({ title: 'Two cases the fast track deliberately sends elsewhere', group: 'need', body: 'Named in the list\u2019s own footnotes: <strong>' + voc4.voc3Carveouts.join('</strong> <strong>') + '</strong> Neither is a refusal \u2014 both are assessments by the college that trains the specialty, which is a different application rather than a lesser one.', css: 'sand' });
          var miss = [];
          if (a.docRecent24 === 'no') miss.push('the 24 months in 5 years at 0.5 FTE');
          if (a.docRecent12 === 'no') miss.push('the 12 months within the last 18');
          if (a.docOffer === 'no' || a.docOffer === 'exploring') miss.push('a New Zealand job offer at consultant or specialist level');
          if (a.docRecent24 || a.docRecent12 || a.docOffer) {
            var offerOnly = miss.length === 1 && miss[0].indexOf('job offer') >= 0;
            out.push({
              title: miss.length ? (offerOnly ? 'One thing outstanding, and it is the ordinary one' : 'Where your answers sit against VOC4') : 'Your answers meet the VOC4 criteria we can check',
              group: 'route',
              body: miss.length
                ? (offerOnly
                  ? 'On the criteria we can check, the only one outstanding is <strong>the job offer</strong> — and almost nobody has it at this stage. It does not weaken your position: it sets the order. Secure the role, then apply, rather than applying and waiting. Your recency answers are the part that would be genuinely hard to fix, and those look met.'
                  : 'Against the Council’s published criteria, the gap is <strong>' + miss.join('</strong>, and <strong>') + '</strong>. That is worth knowing now rather than after you have paid. Recency gaps close with time in post; a job offer closes with a job. Neither is a permanent bar, and neither is something we would gloss over.')
                : 'You told us you have the 24 months in 5 years at 0.5 FTE, the 12 months within the last 18, and a consultant-level New Zealand offer. Those are the criteria we can test from your answers. What remains is the part only the Council can confirm — that your qualification is on the approved list by name, and that your recent practice was in a comparable health system country.',
              css: miss.length ? 'sand' : 'mint', href: voc4.url, linkLabel: 'MCNZ — VOC4 fast-track'
            });
          }
          if (a.docIntent === 'temporary') out.push({ title: 'For a defined period, look at the locum scope first', group: 'route', body: 'You told us you are thinking of up to 12 months. The <strong>special purpose — locum tenens</strong> scope exists for exactly that, and it is a lighter application than vocational registration. Be clear about the trade: it is temporary, and it does not convert into vocational registration — deciding to stay means a fresh application through VOC3 or VOC4. If there is a real chance you will stay, the vocational route first is usually the cheaper path overall.', css: 'sand' });
          out.push({ title: 'The comparable health system list applies to you too', group: 'route', body: 'This is the part that catches specialists out. VOC4\u2019s recency requirement must be served in a country the Council recognises as having a comparable health system — so the country list is not a general-scope-only concern. A consultant with the right fellowship whose recent practice sits outside those countries does not meet the recency test.', css: 'sand', href: chs.url, linkLabel: 'MCNZ — comparable health system criteria' });
          var xi = voc4.extraInfoSpecialties || [], myArea = mine && mine.area;
          if (myArea && xi.join('|').toLowerCase().indexOf(myArea.toLowerCase()) >= 0) {
            out.push({ title: 'Your specialty carries an extra step on VOC4', group: 'need', body: '' + myArea.charAt(0).toUpperCase() + myArea.slice(1) + ' is one of three areas where the Council asks for <strong>additional information</strong> on a VOC4 application — the others being obstetrics &amp; gynaecology and anatomical pathology. It is not an obstacle, just a form to have ready rather than a surprise mid-assessment. It is also why the Council notes that ' + myArea.toLowerCase() + ' applications may take longer than the ' + (voc4.processing || '').split(';')[0].trim() + ' target.', css: 'sand', href: voc4.url, linkLabel: 'MCNZ — VOC4 fast-track' });
          /* The country is necessary, never sufficient — and the card above reads as an
             invitation. The list covers NINE areas of medicine and radiology is not among
             them, so a UK radiologist holding a CCT would otherwise be told the fast track
             may be open when it is closed to their specialty outright. Read at source
             27 August 2026 from the list PDF, not from the VOC4 landing page. */
          if (voc4.approvedAreas) out.push({ title: 'Check your area of medicine against the list — it is shorter than people expect', group: 'route', body: 'The fast track covers nine areas, and the list is the eligibility test rather than a guide to it: <strong>' + voc4.approvedAreas.join('</strong>; <strong>') + '</strong>. ' + esc(voc4.notOnList || '') + (voc4.countryScope ? ' ' + esc(voc4.countryScope) : ''), css: 'sand', href: voc4.listUrl || voc4.qualListUrl, linkLabel: 'MCNZ — approved qualifications list (PDF)' });
          if (voc4.ukAwardRule && specQual === 'United Kingdom') out.push({ title: 'What has to sit alongside the fellowship', group: 'need', body: esc(voc4.ukAwardRule) + ' There is no third option, which is the part worth checking before you apply rather than after.', css: 'sand' });
          if (voc4.voc3Carveouts) out.push({ title: 'Two cases the fast track deliberately sends elsewhere', group: 'need', body: 'Named in the list\u2019s own footnotes: <strong>' + voc4.voc3Carveouts.join('</strong> <strong>') + '</strong> Neither is a refusal \u2014 both are assessments by the college that trains the specialty, which is a different application rather than a lesser one.', css: 'sand' });
          }
          if (voc4.recentAdditions) out.push({ title: 'The list changes — check it by date', group: 'need', body: 'The approved-qualification list was last updated <strong>' + esc(voc4.listUpdated) + '</strong>, adding <strong>' + voc4.recentAdditions.join('</strong>, <strong>') + '</strong>. If anyone told you VOC4 was closed to your specialty more than a few months ago, that advice may simply be out of date. Read the current list rather than trusting a summary — including ours.', css: 'mint', href: voc4.listUrl, linkLabel: 'MCNZ — approved qualifications (PDF)' });
          if (voc4.epicFirst) out.push({ title: 'Start the verification before the application', group: 'need', body: voc4.epicFirst + ' This is the most common cause of a VOC4 application sitting still while the applicant believes it is being assessed.', css: 'sand' });
          if (voc4.registrationMeeting) out.push({ title: 'The last step happens after you land', group: 'need', body: voc4.registrationMeeting + ' ' + (voc4.variations || ''), css: 'mint' });
          out.push({ title: 'Check your qualification by name, not by country', group: 'need', body: 'This is where fast-track applications come unstuck. Two doctors from the same country, with different awarding bodies or different specialties, can end up on different pathways. Read your own qualification off the Council\u2019s list before you plan a timeline around it.', css: 'sand', href: voc4.qualListUrl || R.nzApprovedQualsUrl, linkLabel: 'MCNZ — approved qualifications' });
        } else {
          out.push({ title: 'VOC3 — assessed on its merits', group: 'route', body: 'You trained and qualified as a specialist outside New Zealand and Australia, and your qualification is not from the UK, Ireland or Australia, so the fast-track does not apply. That puts you on <strong>VOC3</strong>: the Council assesses your training, qualification and experience case by case. A South African, Canadian or American fellowship is a well-recognised qualification and is regularly assessed this way — it is a different route, not a lesser one, and it takes longer because the assessment is individual.', css: 'sand', href: R.nzVoc3Url, linkLabel: 'MCNZ — VOC3' });
        }
        var ps = R.nzPsychiatryStandard;
        if (ps && a.profession === 'psychiatrist') {
          out.push({ title: 'What they will actually compare you against', group: 'need', body: 'Vocational registration in psychiatry needs either the <strong>FRANZCP</strong> or an international postgraduate psychiatry qualification <strong>assessed against the FRANZCP standard</strong> — a comparison, not a rejection. Rather than leave that abstract, here is the standard itself: <strong>' + ps.years + '</strong>, made up of ' + ps.components.map(function (c) { return c.charAt(0).toLowerCase() + c.slice(1); }).join('; ') + '. Read your own training against that list before you apply. Where it lines up, say so explicitly in your application; where it does not, that is the part ' + ps.college + ' will focus on, and knowing which it is beforehand is worth more than a general reassurance.', css: 'mint', href: ps.url, linkLabel: 'MCNZ — the psychiatry vocational scope' });
        }
        out.push({ title: 'Vocational registration starts provisionally', group: 'need', body: 'An international medical graduate granted vocational registration works a period of <strong>provisional vocational registration</strong> under supervision first, while the Council satisfies itself you can practise independently in your field. Plan for it: it affects your first contract, not just your paperwork.', css: 'sand', href: R.nzProvVocUrl, linkLabel: 'MCNZ — provisional vocational registration' });
        var lt = R.nzLocumTenens || { byProfession: {} }, ltp = lt.byProfession[a.profession];
        if (ltp) {
          var ltc = ltp.byCountry[qual] || ltp.byCountry['Australia and New Zealand'] && (qual === 'Australia' || qual === 'New Zealand') ? (ltp.byCountry[qual] || ltp.byCountry['Australia and New Zealand']) : null;
          out.push({
            title: ltc ? 'For locum work, the Council names the ' + ltp.area.toLowerCase() + ' qualifications it accepts from ' + theCountry(qual).replace(/^The /, 'the ') : 'Locum specialist appointments have their own approved list',
            group: 'need',
            body: (ltc ? 'Its list for ' + ltp.area.toLowerCase() + ' from ' + theCountry(qual).replace(/^The /, 'the ') + ' reads: <strong>' + ltc.join('</strong>; <strong>') + '</strong>. ' : 'The Council publishes a separate list of approved qualifications for locum tenens specialist appointments, organised by specialty and then by country. ') + lt.note + ' This is a <strong>locum</strong> list and a separate question from vocational registration — and the copy we hold is dated ' + lt.docDate + ', so treat it as the shape of the requirement and check the current page for your own qualification.',
            css: 'sand', href: lt.url, linkLabel: 'MCNZ — approved qualifications for locum tenens appointments'
          });
        }
        if (a.doctorSpecQual === 'no') out.push({ title: 'The award has to be in hand', group: 'route', body: 'Every vocational pathway is built around a completed, awarded specialist qualification. Until yours is issued, the general scope is the realistic route and the vocational application follows later.', css: 'sand' });
      } else if (stage === 'registrar' || stage === 'sho') {
        out.push({ title: 'General scope — the right scope for where you are', group: 'route', body: 'The Council describes the general scope as resident doctors, RMOs and doctors in vocational training, which is exactly where a ' + (stage === 'sho' ? 'resident or SHO' : 'registrar or specialty trainee') + ' sits. Vocational registration comes later, once specialist training is complete — there is nothing to gain by aiming at it now.', css: 'mint', href: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/general-scope/', linkLabel: 'MCNZ — general scope pathways' });
        var ca = R.nzDoctorCompetentAuthority || { countries: [] };
        if (ca.countries.indexOf(qual) >= 0) { lastProfFired = { rule: ca, country: qual };
          out.push({ title: 'Competent authority pathway — the shortest general-scope route', group: 'route', body: 'The Council recognises exactly two competent authorities: the <strong>General Medical Council</strong> in the UK and the <strong>Irish Medical Council</strong>. You hold a primary medical degree from ' + theCountry(qual).replace(/^The /, 'the ') + ', so this may be your route — but the test is the degree <strong>and</strong> the internship, both completed there. Where you are registered now is not what this pathway looks at, which is the part people misread.', css: 'mint', href: ca.url, linkLabel: 'MCNZ — competent authority pathway' });
        }
        if (recent && chs.countries.indexOf(recent) >= 0) { lastProfFired = lastProfFired || { rule: chs, country: recent };
          out.push({ title: 'The Comparable Health System pathway may fit', group: 'route', body: 'Your recent practice is in ' + theCountry(recent).replace(/^The /, 'the ') + ', which the Council currently recognises. The test is 33 of the last 48 months, at least 20 hours a week, in the same area of medicine and at a similar level of responsibility to the New Zealand job — so the role you are offered has to match the experience. It leads to provisional general registration: 12 months supervised before it becomes general.', css: 'mint', href: chs.url, linkLabel: 'MCNZ — comparable health system' });
        } else if (recent) {
          out.push({ title: 'Not a comparable health system — expect NZREX', group: 'route', body: 'Your recent practice is not in one of the countries the Council recognises as comparable, so that route is not open on these answers. The usual alternative in the general scope is the <strong>NZREX Clinical</strong> examination. It is longer, and knowing now is what makes your timeline real.', css: 'sand', href: 'https://www.mcnz.org.nz/registration/getting-registered/registration-exam-nzrex/', linkLabel: 'MCNZ — NZREX' });
        }
      } else {
        out.push({ title: 'Scope decides everything else — settle it first', group: 'route', body: 'If your specialist training is <strong>complete</strong>, you are a vocational applicant and the country lists do not apply — the Council picks between VOC1, VOC2, VOC3 and the VOC4 fast-track by where your postgraduate qualification comes from. If it is <strong>not complete</strong>, you are a general-scope applicant and the comparable health system route or NZREX is the question. The Council\u2019s own self-assessment tool settles it in a few minutes.', css: 'mint', href: 'https://www.mcnz.org.nz/registration/getting-registered/tool/', linkLabel: 'MCNZ — registration self-assessment tool' });
      }
    }
    /* Imaging fees apply across every MRTB scope, so they hang off the country not the scope. */
    if (cc === 'nz' && ['imaging', 'mri', 'sonographer'].indexOf(key) >= 0) {
      var mf = (D().rules || {}).nzMrtbFees;
      if (mf) {
        var viaTtmra = a.registered === 'yes' && a.regCountry === 'Australia' && key === 'imaging';
        out.push({ title: viaTtmra ? 'Trans-Tasman costs less than half the international route' : 'What the Board charges, and the gap between the two doors', group: 'cost', body: 'Registration is <strong>' + mf.registration.ttmra + ' through Trans-Tasman</strong> and <strong>' + mf.registration.international + ' as an internationally qualified applicant</strong> \u2014 same Board, same person, different door. Your first practising certificate is ' + mf.apc.initial + ' on top, and adding a second scope later is ' + mf.registration.additionalScope + '. ' + mf.allNote, css: 'mint', href: mf.url, linkLabel: 'MRTB \u2014 fees from 16 February 2026' });
        if (key === 'sonographer' || key === 'mri') out.push({ title: 'And this is what the TTMRA exclusion costs you', group: 'cost', body: 'Because Trans-Tasman does not reach ' + (key === 'mri' ? 'MRI' : 'sonography') + ', you pay the <strong>' + mf.registration.international + '</strong> international fee rather than the ' + mf.registration.ttmra + ' one \u2014 even if you are already registered in Australia. An Australian radiographer who also scans meets both prices at once: the cheap door for the general scope, the dear one for this. Worth knowing before you budget for one and get billed for the other.', css: 'sand' });
        out.push({ title: 'The two costs nobody budgets for', group: 'cost', body: 'If the Board directs you to its <strong>online examination</strong> that is ' + mf.exams.online + ', and a <strong>cardiac sonography registration examination assessment</strong> is ' + mf.exams.cardiacSonography + ' \u2014 a separate and dearer thing. Neither applies to everyone, so do not budget for them until the Board says so. Separately: renew a practising certificate late and it rises from ' + mf.apc.renewalOnTime + ' to <strong>' + mf.apc.renewalLate + '</strong> once it is ' + mf.apc.lateFrom + '. A letter of good standing is ' + mf.documents.goodStanding + '.', css: 'sand' });
      }
    }
    if (key === 'physiotherapist' && cc === 'au') {
      var pf = (D().rules || {}).auPhysioFees;
      if (pf) {
        var eq = a.qualCountry, ex = ((D().rules || {}).auPhysioExpressFlyr || {}).countries || [], fl = ((D().rules || {}).auPhysioFlyr || {}).countries || [];
        var onEx = ex.indexOf(eq) >= 0, onFl = fl.indexOf(eq) >= 0;
        out.push({ title: 'The pathway is worth more than A$6,000 to you', group: 'cost', body: 'This is the widest cost spread of any profession we cover, which is why the route matters before the paperwork does. <strong>Express FLYR A$1,650</strong> (' + pf.expressFlyr.parts.join('; ') + '). <strong>FLYR A$3,422</strong> (' + pf.flyr.parts.join('; ') + '). <strong>APEP A$7,814</strong> (' + pf.apep.parts.join('; ') + ').' + (onEx ? ' On your answers you are on the <strong>Express FLYR</strong> list — the cheapest and fastest of the three.' : onFl ? ' On your answers you are on the <strong>FLYR</strong> list — the middle route.' : ''), css: 'mint', href: pf.url, linkLabel: 'Australian Physiotherapy Council — fees and processing times' });
        out.push({ title: 'The advertised total is the first-time-pass price', group: 'cost', body: 'Resits are charged in full: ' + pf.resits + ' A capability assessment resit alone costs more than the entire Express FLYR pathway. Nobody advertises that, and it is the difference between a budget and a shock.', css: 'sand' });
        out.push({ title: 'What the Council actually promises on timing', group: 'cost', body: '<strong>Express FLYR: ' + pf.processing.expressFlyr + '. Eligibility assessment: ' + pf.processing.eligibility + '. Skills assessment for migration: ' + pf.migration.processing + '.</strong> ' + pf.processing.note + ' You will see an overall APEP duration quoted in various places — it is not on the Council’s own timings page, so we do not repeat it as though it were a commitment.', css: 'sand' });
        out.push({ title: 'Migration assessment is a separate purchase', group: 'cost', body: 'If you need a skilled migration visa, that is a different application again: <strong>' + pf.migration.complete + '</strong> for a complete skills assessment for permanent residence or skilled regional, or <strong>' + pf.migration.additional + '</strong> for an additional one. It buys you a visa assessment, not registration — do not pay for it unless your visa route requires it. An internal review of any Council decision is ' + pf.internalReview + '.', css: 'mint' });
      }
    }
    if (key === 'psychologist' && cc === 'au') {
      var pb = (D().rules || {}).auPsyBA;
      if (pb) {
        out.push({ title: 'Three different questions, and people answer the wrong one first', group: 'route', body: '<strong>Can I practise?</strong> That is Ahpra and the Psychology Board. <strong>Can I call myself a clinical psychologist?</strong> That is an <em>area of practice endorsement</em> on top of general registration. <strong>Do I need a migration assessment?</strong> That is the APS — a separate organisation that is not the registration gateway. ' + pb.aps + ' People routinely start with the APS because it is the name they know, and it does not move them one step closer to practising.', css: 'mint', href: pb.url, linkLabel: 'Psychology Board — overseas applicants' });
        out.push({ title: 'The route, in the Board’s own order', group: 'route', body: pb.sequence.map(function (s, i) { return '<strong>' + (i + 1) + '.</strong> ' + s; }).join('<br>'), css: 'sand', href: pb.url, linkLabel: 'Psychology Board — transitional program' });
        out.push({ title: '“Provisional” does not mean they think you are a novice', group: 'need', body: 'This is the part that offends experienced clinicians, so it is worth being plain: provisional registration is the category you <em>hold while completing</em> the transitional program, not a judgement on your career. ' + pb.transitional.meanwhile + ' ' + pb.provisionalCaveat, css: 'mint' });
        out.push({ title: 'What the transitional program actually requires', group: 'need', body: '<strong>The job:</strong> ' + pb.transitional.work + ' <strong>The plan:</strong> ' + pb.transitional.plan + ' <strong>The finish:</strong> ' + pb.transitional.finish + ' Note the order this forces — you need an Australian position before you can complete the program, so the job comes first, not last.', css: 'sand' });
        out.push({ title: 'The exam need not be the last hurdle', group: 'need', body: pb.exam + ' Most people leave it to the end and then wait on a result. Sitting it during the program removes it from the critical path.', css: 'mint' });
        var pa = a.psychAuArea;
        if (pa && pa !== 'unsure') {
          var endorsed = pa !== 'general';
          out.push({ title: endorsed ? 'Your area is an endorsement, not a registration' : 'General registration is the whole of it for you', group: 'route', body: endorsed ? pb.endorsement + ' So the sequence is general registration first, then endorsement assessed separately — and it is possible to hold the first without the second. That is not a failure state: you can practise as a psychologist within your competence, you simply cannot use the endorsed title.' : 'With no specialist area to endorse, general registration is the whole question for you — one process rather than two.', css: 'sand' });
          if (endorsed) {
            var code = pb.apsCodes[pa];
            out.push({ title: 'And it decides your migration occupation too', group: 'need', body: code ? 'If you later need a skilled migration assessment and you hold the matching Australian endorsement, the APS can assess you as <strong>' + esc(code) + '</strong>. Without that endorsement the outcome is generally <strong>' + esc(pb.apsFallback) + '</strong> — the same person, a different occupation code, and it can change which visa lists you appear on.' : 'For migration, the APS assesses against the endorsement you actually hold. Without a matching Australian endorsement the outcome is generally <strong>' + esc(pb.apsFallback) + '</strong>, which can change which visa lists you appear on.', css: 'sand' });
          }
        }
      }
    }
    if (key === 'psychologist') {
      if (a.psychIntern === 'no' || a.psychIntern === 'partial') out.push({ title: 'The internship is the part to resolve first', body: 'You have told us your training did not include a full supervised internship, and that is the requirement that most often stops an overseas psychology application — in both countries. Get a view on it from the regulator before you spend money on anything else, because the answer can change whether the move is realistic this year.', css: 'sand' });
      if (cc === 'nz' && a.psychScope && a.psychScope !== 'unsure') {
        var scopeLabel = { clinical: 'clinical', counselling: 'counselling', educational: 'educational', general: 'general psychologist' }[a.psychScope];
        out.push({ title: 'You are applying into the ' + scopeLabel + ' scope', body: (a.psychScope === 'clinical' ? 'That is the scope most public sector roles are written around, which is helpful — and also the one with the most specific training requirements. ' : a.psychScope === 'general' ? 'The general scope is broader than the specialist scopes but opens fewer of the roles that name a scope in the job description. Worth checking against the roles you actually want. ' : 'Roles in this scope are fewer in number than clinical ones and concentrated in particular services, so location matters more than it would otherwise. ') + 'The Board grants the scope your training supports, so confirm the match before you apply rather than after.', css: 'mint' });
      }
      if (cc === 'au' && a.psychEndorse === 'yes') out.push({ title: 'Endorsement is a second assessment', body: 'General registration and an area of practice endorsement are decided separately, and the endorsement is the slower of the two. Your overseas specialist title does not carry across on its own. Plan for registration first and endorsement alongside it, not as one step.', css: 'sand' });
    }
    if (key === 'dietitian' && cc === 'au' && (a.dietPlacement === 'no' || a.dietPlacement === 'unsure')) out.push({ title: 'Supervised placement is assessed too', body: 'Dietitians Australia looks at supervised professional practice alongside the academic qualification. If your programme did not include a placement, or you are not certain it did, confirm it early — it is easier to evidence now than to reconstruct later.', css: 'sand' });
    /* Nursing sits in the shared builder, not in present()'s, for the same reason midwifery
       does: registered and enrolled nurses are supported:false in both countries, so present()
       never runs for them and anything pushed there is dead code. This builder feeds BOTH the
       recruited and the not-recruited paths, which is what "the guidance is free whether or not
       we ever place you" actually requires. Read the notes off the record so the verified
       content has exactly one home. */
    if (key === 'nursing' && cc === 'nz') {
      var nu = ((D().records || {}).nursing || {}).nz || {};
      /* The exemption question is settled for enrolled nurses and open for everyone else, so
         they get different notes rather than one hedged paragraph covering both. */
      var scopeNote = a.profession === 'enrolled-nurse' ? nu.enNote : nu.selfCheckNote;
      if (scopeNote) out.push(scopeNote);
      /* Order is deliberate: the market note comes BEFORE cost and OSCE. The Council itself
         tells IQNs to explore work before paying for registration, and a candidate who reads
         only the first note should get that one rather than a fee table. */
      if (nu.marketNote) out.push(nu.marketNote);
      if (nu.registrationGateNote) out.push(nu.registrationGateNote);
      if (nu.hoursGateNote) out.push(nu.hoursGateNote);
      if (nu.osceNote) out.push(nu.osceNote);
      if (nu.costNote) out.push(nu.costNote);
    }
    if (key === 'nursing' && cc === 'au') {
      /* Same shared-builder reasoning as New Zealand: nurses are supported:false in both
         countries, so present() never runs for them. */
      var na = ((D().records || {}).nursing || {}).au || {};
      if (a.profession === 'enrolled-nurse') {
        if (na.enNote) out.push(na.enNote);
      } else {
        /* Pathway 2 is placed second only because Pathway 1 has to be named first for it to
           make sense. It is the note most likely to change what someone believes. */
        if (na.streamlinedNote) out.push(na.streamlinedNote);
        if (na.pathway2Note) out.push(na.pathway2Note);
        if (na.notStreamlinedNote) out.push(na.notStreamlinedNote);
        if (na.npNote) out.push(na.npNote);
        if (na.timingNote) out.push(na.timingNote);
        if (na.orientationNote) out.push(na.orientationNote);
      }
    }
    /* Australia, completed specialists. The Board runs three doors and the difference between
       them is worth more to a consultant than anything else on the page, so name the one that
       applies to THEIR specialty rather than describing all three. */
    if (key === 'doctor' && cc === 'au' && a.doctorStage === 'smo') {
      var R2 = D().rules || {}, ex = R2.auExpeditedSpecialist, sr = R2.auSpecialistRecognition;
      var mine = ex && ex.byProfession && ex.byProfession[a.profession];
      var st2 = mine && mine.status;
      if (st2 === 'open') {
        out.push({ title: 'Australia has a fast track, and ' + mine.specialty.toLowerCase() + ' is on it', group: 'route', body: 'The <strong>Expedited Specialist pathway</strong> lets you apply <strong>directly to Ahpra</strong> for specialist registration, with no specialist-college comparability assessment \u2014 the step that takes the longest on the ordinary route. One condition decides it, and it is not your specialty or your country: your exact qualification must be named on the Board\u2019s <strong>accepted qualifications list</strong>. Check yours by name before you plan around this.', css: 'mint' });
        out.push({ title: 'What follows registration on the fast track', group: 'need', body: 'It is expedited, not unconditional. You complete <strong>six months of supervised practice</strong> in Australia, with reports from the supervising health service and your supervisors, plus Board-approved orientation and cultural safety requirements. Worth knowing before you agree a start date or a package.', css: 'sand' });
      } else if (st2 === 'assessing') {
        out.push({ title: mine.specialty + ' is being assessed \u2014 not yet open', group: 'route', body: 'Australia\u2019s Expedited Specialist pathway does not currently cover you. Ahpra confirmed in January 2026 that <strong>' + mine.specialty.toLowerCase() + '</strong> qualifications were being assessed for the accepted list, so this may change \u2014 but a qualification only counts once it has actually been added. Plan on <strong>specialist recognition</strong>, and treat the fast track as a possible bonus rather than the plan.', css: 'sand' });
      } else if (st2 === 'considering') {
        out.push({ title: mine.specialty + ' is a named priority, which is not the same as open', group: 'route', body: 'This is the detail worth being precise about, because the language around it invites the wrong conclusion. <strong>' + mine.specialty + '</strong> is named among the next specialties under consideration for the Expedited Specialist pathway \u2014 alongside dermatology, general surgery and otolaryngology \u2014 but none of them are open. Being a priority confers nothing until a qualification is added to the accepted list. Your route today is <strong>specialist recognition</strong>.', css: 'sand' });
      }
      if (st2 !== 'open' && sr) {
        out.push({ title: 'Specialist recognition is the normal route, not the fallback', group: 'route', body: 'The relevant Australian specialist college assesses your training against an Australian-trained specialist and returns one of three findings: <strong>substantially comparable</strong>, <strong>partially comparable</strong> or <strong>not comparable</strong>. The first two both lead to specialist registration \u2014 the college sets requirements you complete first. You will need a primary medical qualification recognised by <strong>both</strong> the AMC and the World Directory of Medical Schools, and to have completed every training and examination requirement to practise in your specialty in the country where you trained.', css: 'mint' });
      }
      out.push({ title: 'If you are coming for a year or two, read this first', group: 'need', body: 'The <strong>short term training</strong> pathway covers up to 24 months of specialist or advanced training, and it is the one most often mistaken for a way in. It does <strong>not</strong> lead to specialist registration, or to ongoing registration in Australia. It is a good way to spend two years and a poor way to start a career there \u2014 if you intend to stay, choose the pathway that gets you there and start it now.', css: 'sand' });
    }
    /* Australian OT. Same shared-builder route as nurses — supported:{au:false}. The
       lead note is the process change, because a therapist working from an out-of-date guide
       is mis-planning the whole move, not just one step. */
    if (key === 'occupational-therapist' && cc === 'au') {
      var oa = ((D().records || {})['occupational-therapist'] || {}).au || {};
      ['changedNote', 'routesNote', 'outcomeNote', 'competenceNote', 'migrationNote'].forEach(function (k) {
        if (oa[k]) out.push(oa[k]);
      });
    }
    /* New Zealand imaging. The MRTB registers into SCOPES, and the two things candidates get
       wrong are which modalities need their own scope and which scopes TTMRA reaches. */
    if (cc === 'nz' && (key === 'imaging' || key === 'mri' || key === 'sonographer')) {
      var ms = (D().rules || {}).nzMrtbScopes;
      var fromAu = /austral/i.test(a.regCountry || '');
      if (ms) {
        if (a.profession === 'radiographer') {
          out.push({ title: 'CT does not need its own registration', group: 'route', body: 'This one costs people time, because they go looking for a requirement that is not there. <strong>CT sits inside the Medical Imaging Technologist scope</strong>, as do <strong>mammography</strong> and <strong>angiography</strong>, where you have appropriate training. You register once, in the MIT scope, and your CT experience counts as experience rather than as a second registration. It matters commercially rather than legally — CT is often what gets you the job.', css: 'mint' });
        }
        if (fromAu && key === 'imaging') {
          out.push({ title: 'Trans-Tasman recognition reaches your general scope, and stops there', group: 'route', body: 'If you are registered with Ahpra you can use <strong>Trans-Tasman Mutual Recognition</strong> for the <strong>Medical Imaging Technologist</strong>, <strong>Radiation Therapist</strong> and <strong>Nuclear Medicine Technologist</strong> scopes. It does <strong>not</strong> cover <strong>MRI</strong> or <strong>sonography</strong> — for either of those you apply as an internationally qualified applicant and go through full assessment. So if you scan MRI as well as general, you have two routes running at once, on two different timelines. Worth knowing before you assume the whole move is a formality.', css: 'sand' });
        }
        if (fromAu && (key === 'mri' || key === 'sonographer')) {
          out.push({ title: 'Trans-Tasman recognition does not cover this scope', group: 'route', body: 'Australian registration reaches the Medical Imaging Technologist, Radiation Therapist and Nuclear Medicine Technologist scopes in New Zealand. It does <strong>not</strong> reach <strong>MRI</strong> or <strong>sonography</strong>. For this scope you apply as an internationally qualified applicant, and the Board assesses your qualification and clinical experience in full. The Board states this on its Trans-Tasman page and again in its examination policy, so it is not a grey area.', css: 'sand' });
        }
        if (key === 'mri') {
          out.push({ title: 'No formal MRI qualification is not the end of it', group: 'route', body: 'This route is genuinely hard to find, and it is the reason an experienced MRI radiographer should not rule New Zealand out. The Board\u2019s prescribed qualifications include a route needing all three of: an <strong>undergraduate medical imaging or radiation therapy qualification approved by the Board</strong>, at least <strong>2.5 years FTE MRI practice</strong> meeting its clinical experience requirements, and a <strong>pass in a Board MRI examination</strong>. Employer-trained MRI experience can count — what it needs is to be documented, and the Board has a separate MRI clinical experience form for exactly that.', css: 'mint' });
        }
        out.push({ title: 'Registration is not the thing that lets you work', group: 'need', body: 'You cannot practise in a protected scope without <strong>both</strong> registration and a current <strong>annual practising certificate</strong>. The timing catches people out: you must wait until you are <strong>resident in New Zealand, or can evidence your move</strong>, before applying for the APC. So it is deliberately the last step, not something to chase in parallel — budget for the gap between being registered and being able to start.', css: 'sand' });
        if (!fromAu && ms.examIsNotAutomatic) {
          out.push({ title: 'You do not automatically sit an exam', group: 'route', body: 'This is the most common misreading of the New Zealand route, and it is worth being clear about before it puts you off. The Board <strong>assesses your qualification, clinical education and experience first</strong>. If it finds them equivalent to the New Zealand standard, you progress towards registration and there is no examination. Its <strong>online examination is what can be offered if the assessment finds your qualification is not equivalent</strong> — an alternative route to registration rather than a hurdle everyone clears. Do not budget the exam fee until the Board has told you it applies.', css: 'mint', href: ms.examUrl, linkLabel: 'MRTB — online examination' });
        }
        if (ms.processing) {
          out.push({ title: 'What the Board publishes on timing', group: 'need', body: '<strong>' + ms.processing + '</strong> That clock starts from a complete application and a cleared payment, not from the day you submit — so missing documents do not pause it, they restart it. Assemble the full set before you apply: certified qualification certificate, official transcript, full course curriculum, clinical logbook, the Board’s clinical experience form, CV, employment certificates, registration and certificates of good standing, criminal-history checks, and English-language evidence where it is required.', css: 'sand', href: ms.overseasUrl, linkLabel: 'MRTB — internationally qualified' });
        }
      }
    }
    /* Australian medical radiation — narrow to ONE of the four doors from the answers we already
       hold, rather than routing everyone into a generic "assessment". Which door you are at is
       the whole question, and it is decided before any money is spent. */
    if (cc === 'au' && (key === 'imaging' || key === 'mri')) {
      var mr = (D().rules || {}).auMedRadRoutes;
      if (mr) {
        var qc = a.qualCountry || '', rc = a.regCountry || '';
        var nzReg = /new zealand/i.test(rc) && a.registered === 'yes';
        var ukIe = /united kingdom|ireland/i.test(qc);
        var isNm = a.profession === 'nuclear-medicine';
        if (nzReg) {
          out.push({ title: 'Mutual recognition, but only with a current practising certificate', group: 'route', body: 'This is the shortest route into Australia and the one most often misdescribed. It is not “you qualified in New Zealand” — it is <strong>current MRTB registration <em>and</em> a current New Zealand practising certificate</strong>. Hold both, in the Medical Imaging Technologist, Radiation Therapist or Nuclear Medicine Technologist scope, and you can apply for <strong>general registration in Australia under the Trans-Tasman Mutual Recognition Act</strong>. Let the practising certificate lapse and the door closes: you would apply for general registration and submit the New Zealand qualification like any other overseas one. Same degree, same person, a different process, and the difference is a certificate that expires annually.', css: 'mint', href: mr.pathwaysUrl, linkLabel: 'MRPBA — registration pathways' });
        } else if (ukIe && !isNm) {
          var cbBody = /ireland/i.test(qc) ? 'Ireland (<strong>CORU</strong>)' : 'the United Kingdom (<strong>HCPC</strong>)';
          out.push({ title: 'You may be on the Comparable Regulator Pathway', group: 'route', body: 'The Board recognises the regulators of ' + cbBody + ' as comparable for the <strong>diagnostic radiography</strong> and <strong>radiation therapy</strong> divisions. That is a materially shorter route than a full portfolio assessment. One condition does the work, and it is about timing rather than the degree: <strong>your qualification must have been accredited by that regulator at the time you completed your studies</strong> — not accredited now, accredited then. Check your exact qualification against the Board’s list before you assume it, because a programme that gained accreditation after your cohort does not carry you.', css: 'mint', href: mr.recognisedUrl, linkLabel: 'MRPBA — is my qualification recognised?' });
        } else if (ukIe && isNm) {
          out.push({ title: 'The HCPC and CORU shortcut is not open to nuclear medicine', group: 'route', body: 'Worth saying plainly, because you will read about it and it does not apply to you. The <strong>Comparable Regulator Pathway is limited to the diagnostic radiography and radiation therapy divisions</strong> and is <strong>explicitly not available to internationally qualified nuclear medicine technologists</strong>. Your routes are the Recognised International Qualification Pathway, if the Board has already assessed your exact qualification, or a full portfolio assessment. Plan for the longer one and be pleased if the first applies.', css: 'sand', href: mr.pathwaysUrl, linkLabel: 'MRPBA — registration pathways' });
        }
        if (!nzReg) {
          out.push({ title: 'Check whether your exact qualification is already recognised — first', group: 'route', body: 'This is the ten-minute check that decides months. If the Board has <strong>already assessed the same qualification as yours — ' + mr.recognisedTest + ' —</strong> and found it substantially equivalent, or based on similar competencies, to an approved Australian qualification, you are on the <strong>Recognised International Qualification Pathway</strong> and no individual assessment is needed. It is open to all three divisions. The test is exact: a different year or a renamed degree from the same university is a different qualification. Look yours up before you prepare a portfolio you may not need.', css: 'mint', href: mr.recognisedUrl, linkLabel: 'MRPBA — is my qualification recognised?' });
          out.push({ title: 'If it is not on the list, the assessment comes before the application', group: 'need', body: 'The order is the part people get wrong, and getting it wrong costs a cycle. On the <strong>Qualification Assessment Pathway</strong> the Board <strong>must assess your qualification portfolio before you apply for registration</strong> — not alongside it. A portfolio means every medical radiation practice qualification you hold, submitted on the Board’s <strong>' + mr.portfolioForm + '</strong> form. Three outcomes are possible: <strong>' + mr.assessmentOutcomes.join('</strong>; <strong>') + '</strong>. The middle one is the one to plan for — relevant, but with further requirements before general registration.', css: 'sand', href: mr.assessmentUrl, linkLabel: 'MRPBA — assessment of international qualifications' });
          out.push({ title: 'An exam is not automatically part of this', group: 'route', body: 'Nothing in the Australian route says “internationally qualified, therefore examination”, and reading it that way puts people off a move they would have made. The <strong>national examination is used where a more detailed objective assessment of professional capability is required</strong> — in circumstances the Board determines, after it has assessed your qualification. So the honest sequence is: assessment first, then any additional requirements, which <em>can</em> include the examination. Do not budget for it, or rule the move out because of it, before the Board has told you it applies.', css: 'mint', href: mr.examUrl, linkLabel: 'MRPBA — national examination' });
        }
      }
    }
    /* Nuclear medicine + CT. Not "do you do CT" but "what is the CT for" — the Board draws
       the line at diagnostic CT, and both over- and under-scoping are common. */
    if (cc === 'nz' && a.profession === 'nuclear-medicine') {
      var nc = (D().rules || {}).nzNuclearMedicineCt;
      if (nc) {
        out.push({ title: 'PET/CT does not automatically mean a second scope', group: 'route', body: 'The question is not whether you use CT — it is what the CT is <em>for</em>. Operating SPECT/CT and PET/CT for <strong>attenuation correction, anatomical fusion and transmission imaging</strong> sits inside the Nuclear Medicine Technologist scope. You do not need the Medical Imaging Technologist scope to do it, and applying for one you do not need adds time and cost to your application.', css: 'mint' });
        out.push({ title: 'Independent diagnostic CT is the exception', group: 'need', body: 'If you report and perform <strong>diagnostic CT</strong> in your own right, the Board requires one of three things on top of your nuclear medicine registration: a <strong>practising certificate in the Medical Imaging Technologist scope</strong>, <strong>completion of a Board-approved CT education programme</strong>, or <strong>evidence of CT competency obtained elsewhere that the Board assesses and approves</strong>. That third route is the one most overseas practitioners have without realising it — if your CT training was formal and documented, it may be assessable as it stands rather than repeated. Worth establishing early, because it changes what a New Zealand employer can roster you to do.', css: 'sand' });
      }
    }
    if (key === 'speech-language-therapist' && cc === 'au') {
      var sp = (D().rules || {}).auSpa;
      if (sp) {
        var sa = sp.assoc[a.sltAssocAu], trained2 = sa && a.qualCountry === sa.country,
            mraAu = !!sa && trained2 && !sa.suspended && !sa.excluded;
        out.push({ title: 'CPSP is the thing to aim at, and it is not membership', group: 'route', body: 'Speech pathology is self-regulating in Australia — there is no Ahpra registration. What matters is <strong>' + esc(sp.credential) + '</strong>, and joining the association does not confer it: overseas-trained speech pathologists become eligible only by completing a skills assessment. ' + sp.whyCredential, css: 'mint', href: sp.url, linkLabel: 'Speech Pathology Australia' });
        if (mraAu) {
          out.push({ title: 'The Mutual Recognition Agreement looks open to you', group: 'route', body: 'You trained in ' + esc(sa.country) + ' and hold ' + esc(sa.name) + ' ' + esc(sa.credential) + ' — the two things the MRA requires together. Note the Association names the <strong>exact credential</strong>, not just the association, so ordinary membership is not the same answer as certified membership. You will need a letter of good standing from ' + esc(sa.name) + '.', css: 'mint', href: sp.guideUrl, linkLabel: 'SPA — OSQCA guide for applicants' });
        } else if (sa && sa.suspended) {
          out.push({ title: 'Canada is a signatory, but the MRA route is currently closed', group: 'route', body: sp.canadaNote + ' This is the most perishable fact on this page — it follows a change at the Canadian end rather than an Australian policy shift, so confirm it with the Association before you plan around it either way.', css: 'sand', href: sp.guideUrl, linkLabel: 'SPA — OSQCA guide for applicants' });
        } else if (sa && sa.excluded) {
          out.push({ title: 'One exclusion applies to you specifically', group: 'route', body: 'NZSTA Full Members are covered by the MRA <strong>with the exception of those who ' + esc(sa.excluded) + '</strong>. That is you, so the OSQCA route applies instead — a longer process, but an open one.', css: 'sand', href: sp.guideUrl, linkLabel: 'SPA — OSQCA guide for applicants' });
        } else if (sa && !trained2) {
          out.push({ title: 'Membership alone will not open the MRA', group: 'route', body: 'The MRA requires that you completed your qualifying degree in the member country <strong>and</strong> hold that country’s credential. You hold ' + esc(sa.name) + ' ' + esc(sa.credential) + ' but trained in ' + esc(a.qualCountry || 'another country') + ', so the OSQCA route applies.', css: 'sand', href: sp.guideUrl, linkLabel: 'SPA — OSQCA guide for applicants' });
        }
        if (!mraAu) {
          out.push({ title: 'OSQCA: four stages, and what each one costs', group: 'need', body: sp.stages.map(function (s) { return '<strong>Stage ' + s.n + '</strong> — ' + s.focus + '. ' + s.fee + ', outcome ' + s.outcome + '.'; }).join('<br>') + '<br><br>' + sp.totalFee + ' if you clear every stage first time. ' + sp.resubmitNote + ' ' + sp.noOsce, css: 'sand', href: sp.guideUrl, linkLabel: 'SPA — OSQCA guide for applicants' });
          out.push({ title: 'The portfolio is where most of the work sits', group: 'need', body: sp.portfolioNote + ' If your practice has been entirely paediatric language or entirely adult dysphagia, that is the thing to plan around early — not a bar, but it shapes which cases you can build. ' + esc(sp.aqf), css: 'mint' });
        }
        if (a.sltEnglishAu === 'mra-uni') out.push({ title: 'You look exempt from the English test', group: 'need', body: 'An entry-level qualification conducted in English at a university in the UK, Canada, New Zealand, the USA or Ireland exempts you from English testing altogether. Note it keys off the <strong>university’s country</strong>, not the language alone. The Association can still ask for evidence if something in your application raises a question.', css: 'mint' });
        else if (a.sltEnglishAu) out.push({ title: 'The English standard here is high — and OET counts', group: 'need', body: 'Two routes, not one: <strong>' + esc(sp.english.ielts) + '</strong>, or <strong>' + esc(sp.english.oet) + '</strong>. ' + sp.english.validity + ' Worth knowing this is deliberately above the visa standard — the Department of Home Affairs asks only for ‘competent’ English, so clearing the visa bar does not clear this one.', css: 'sand' });
        out.push({ title: 'Two years, then it lapses — so time the application', group: 'need', body: sp.validity + ' There is no advantage in being assessed years before you intend to move, and a real cost if the clock runs out. ' + sp.appeal, css: 'sand' });
      }
    }
    if (key === 'speech-language-therapist' && cc === 'nz') {
      var nz1 = (D().rules || {}).nzNzsta;
      if (nz1) {
        var am = nz1.assoc[a.sltAssoc], dys = a.sltDysphagia === 'yes',
            trainedThere = am && a.qualCountry === am.country,
            mraOk = !!am && trainedThere && dys;
        out.push({ title: 'Membership, not registration — but it works like registration', group: 'route', body: nz1.selfRegulated, css: 'mint', href: nz1.qap.url, linkLabel: 'NZSTA — becoming a member' });
        if (mraOk) {
          out.push({ title: 'The Mutual Recognition Agreement looks open to you', group: 'route', body: 'You trained in ' + esc(am.country) + ' and hold ' + esc(am.name) + ' membership, which is the combination the <strong>MRA</strong> is built on — and you meet the dysphagia competency, without which the MRA is closed. It is an expedited process rather than automatic recognition: NZSTA still asks for its own evidence, including a letter of good standing sent directly from ' + esc(am.name) + ' and a criminal conviction record dated within three months. Cost is ' + nz1.mra.fee + '.', css: 'mint', href: nz1.mra.url, linkLabel: 'NZSTA — Mutual Recognition Agreement' });
        } else if (am && !trainedThere) {
          out.push({ title: 'Your membership will not carry you through the MRA — and this catches people out', group: 'route', body: 'You hold ' + esc(am.name) + ' membership but trained in ' + esc(a.qualCountry || 'another country') + ', and the MRA does not work that way. ' + nz1.mra.trainedRule + ' NZSTA answers this exact question on its own page, so it is settled rather than a judgement call. Your route is the <strong>Qualifications Approval Process</strong> — not a lesser outcome, but a different form and a different fee, and worth knowing before you pay for the wrong one.', css: 'sand', href: nz1.qap.url, linkLabel: 'NZSTA — Qualifications Approval Process' });
        } else if (am && !dys) {
          out.push({ title: 'Dysphagia closes the MRA, but not the door', group: 'route', body: 'You cannot apply under the MRA without meeting the dysphagia competency requirements. Since 12 June 2023 you may apply under the <strong>Qualifications Approval Process</strong> instead, and NZSTA may grant Registered Membership carrying the condition <strong>' + esc(nz1.dysphagiaCondition) + '</strong>. Be clear-eyed about what that means: NZSTA states it will restrict the job opportunities open to you here. It is workable for community, paediatric and education-based roles and a genuine obstacle in acute adult work — so if dysphagia competence is within reach where you are now, it is worth completing before you apply.', css: 'sand', href: nz1.qap.url, linkLabel: 'NZSTA — Qualifications Approval Process' });
        } else {
          out.push({ title: 'The Qualifications Approval Process is your route', group: 'route', body: 'The MRA is only open to certified members of ASHA, SAC, RCSLT, Speech Pathology Australia or IASLT who also trained in that association’s country. Everyone else applies through the <strong>Qualifications Approval Process</strong>, which is the ordinary route rather than a fallback: NZSTA assesses your qualification and experience individually. Cost is ' + nz1.qap.fee + ', and processing takes ' + nz1.qap.processing + '.', css: 'sand', href: nz1.qap.url, linkLabel: 'NZSTA — Qualifications Approval Process' });
        }
        if (a.sltHours === 'no') out.push({ title: 'Your recent hours point to a Return to Practice condition', group: 'need', body: 'Registered Membership expects certified evidence of <strong>1,000 hours in the past five years</strong>. Below that, NZSTA does not decline you — one of its published outcomes is <strong>Registered Member — Return to Practice</strong>, which is membership with a plan attached rather than a refusal. Worth raising with an employer early, because it shapes your first months rather than your application.', css: 'sand' });
        if (a.sltSupervised === 'newgrad' || a.sltSupervised === 'no') out.push({ title: 'Newly qualified is a recognised category here', group: 'need', body: 'A year of supervised clinical practice — 36 weeks full-time, 30 hours a week — is the threshold for unrestricted Registered Membership. Without it, NZSTA can grant <strong>Registered Member — New Graduate</strong>. That is a real category with its own framework, not a deferral, so the honest answer is apply and be assessed rather than wait a year.', css: 'sand' });
        out.push({ title: 'What NZSTA will want, and the one deadline inside it', group: 'need', body: 'Both routes ask for: ' + nz1.qap.criteria.slice(0, 5).join('; ') + '. Two documents carry their own clocks — the criminal conviction record must be dated <strong>no more than three months</strong> before NZSTA receives it, and a letter of good standing no more than a year, sent directly from your association. Order them in the right order and you will not pay twice.', css: 'mint' });
        out.push({ title: 'There is no appeal, so the route matters more than usual', group: 'need', body: nz1.appealNote, css: 'sand' });
      }
    }
    if (key === 'anaesthetic-technician' && cc === 'nz') {
      var at = (D().rules || {}).nzMscAt;
      if (at) {
        var atUk = a.qualCountry === 'United Kingdom',
            atQ = a.atQual, isAtQual = atQ === 'at-degree' || atQ === 'at-diploma',
            exp2 = a.atExp === '2plus' || a.atExp === '5plus',
            standing = a.registered === 'yes';
        if (atUk && (isAtQual || atQ === 'odp')) {
          if (exp2 && standing) {
            out.push({ title: 'The Council’s wording here is unusually firm', group: 'route', body: 'For a UK-issued anaesthetic technology qualification, with <strong>two years’ FTE post-qualification specialised experience</strong> and registration in good standing, the Council says an applicant <strong>' + esc(at.uk.outcome) + '</strong>. Regulators rarely say "will be eligible", so that is worth taking at face value — and the second half travels with it: supervised practice may still be asked of you. Note the six-month supervision figure you may have read applies to New Zealand new graduates, not to you; for an overseas applicant it depends on the Council’s assessment, so plan for the possibility without assuming the length.', css: 'mint', href: at.url, linkLabel: 'MSC — internationally qualified anaesthetic technicians' });
          } else if (a.atExp && !exp2) {
            out.push({ title: 'The UK route turns on the two-year mark', group: 'route', body: 'The published UK route needs <strong>two years’ full-time equivalent</strong> post-qualification specialised anaesthetic experience. You are below it for now, which changes the timing rather than the destination — and if your degree is a bachelor’s, the Council’s alternative route (relevant degree, appropriate clinical experience, and its anaesthetic technician examination) may be open sooner. Worth an individual assessment before you commit to a move.', css: 'sand', href: at.url, linkLabel: 'MSC — internationally qualified anaesthetic technicians' });
          }
          if (exp2 && !standing) out.push({ title: 'Good standing is part of the UK route', group: 'need', body: 'The route assumes current registration in good standing. If yours has lapsed or carries conditions, that is the piece to resolve first — the Council asks for a letter of good standing from every authority you have registered with.', css: 'sand' });
        } else if (!atUk && (isAtQual || atQ === 'odp' || atQ === 'periop')) {
          out.push({ title: 'Assessed on its own evidence, case by case', group: 'route', body: at.otherCountries + ' That is slower than the UK route and it is not a lesser one — the same registration sits at the end of it. The documents do most of the work here: a certified certificate, a full transcript, and a syllabus setting out subject content and hours for each year. The syllabus is the one people do not have to hand, so request it from your training institution early.', css: 'sand', href: at.url, linkLabel: 'MSC — internationally qualified anaesthetic technicians' });
        }
        if (atQ === 'nursing' || atQ === 'health-degree' || atQ === 'periop' || (atQ === 'odp' && !atUk)) {
          out.push({ title: 'A title that does not say “anaesthetic technology” is not a dead end', group: 'route', body: 'The Council’s prescribed qualifications include a second route: <strong>' + esc(at.examRoute) + '</strong> So a nursing or perioperative degree plus real anaesthetic practice can lead somewhere, where a straight qualification comparison would not. The Council decides whether your degree and experience fit it. One caution worth having early: the examination carries a substantial fee of its own — the largest single cost in this process — so confirm the route applies to you before you budget for it.', css: 'mint', href: at.feesUrl, linkLabel: 'MSC — fees' });
        }
        out.push({ title: 'Three requirements people meet too early or too late', group: 'need', body: '<strong>Good standing:</strong> ' + at.goodStanding + ' Order it too soon and it expires. <strong>Police checks:</strong> ' + at.police + ' Note that is age <strong>16</strong>, not 18 — a common and costly misreading. <strong>Cultural competence:</strong> ' + at.cultural, css: 'sand' });
        out.push({ title: 'English: check the pathways before booking a test', group: 'need', body: at.english.pathways + ' ' + at.english.test + ' ' + at.english.excluded + ' Pathway two is stricter than it sounds — English must have been the <strong>sole</strong> language of instruction AND assessment — but if it applies, it saves you the test entirely.', css: 'mint' });
        out.push({ title: 'Then the certificate, and the order it comes in', group: 'need', body: 'Assessment takes ' + at.processing + ' ' + at.apc + ' So the sequence is registration, then the move, then the practising certificate — not all at once, and you cannot start work in the scope until the last one is in hand.', css: 'sand' });
      }
    }
    /* Sonography and MRI sit outside Trans-Tasman recognition. An Australian-registered
       sonographer arrives assuming mutual recognition covers them; it does not. */
    if (cc === 'nz' && (a.profession === 'sonographer' || a.profession === 'mri')) {
      var ms = (D().rules || {}).nzMrtbScopes, meScope = a.profession === 'mri' ? 'MRI' : 'sonography';
      if (ms && (a.regCountry === 'Australia' || a.qualCountry === 'Australia')) {
        out.push({ title: 'Trans-Tasman recognition does not reach ' + meScope, group: 'route', body: 'This one catches Australian practitioners out. Mutual recognition covers the <strong>' + ms.ttmraScopes.join('</strong>, <strong>') + '</strong> scopes \u2014 and <strong>not ' + ms.ttmraExcluded.join(' or ') + '</strong>. So however well established you are in Australia, you apply to the Board as an <strong>internationally qualified</strong> practitioner, with your qualification and clinical experience assessed against the New Zealand scope. Same Board, different door, and a materially different fee.', css: 'sand' });
      }
    }
    if (key === 'dietitian' && cc === 'au') {
      var dd = (D().rules || {}).auDietitianDsr;
      if (dd) {
        out.push({ title: 'Nobody can stop you working \u2014 but the credential decides what you can bill', group: 'route', body: dd.notRegistered + ' So this is a commercial decision rather than a legal one, and worth making deliberately rather than by default.', css: 'mint', href: dd.url, linkLabel: 'Dietitians Australia \u2014 overseas-educated dietitians' });
        out.push({ title: 'Three stages, and both exams are online', group: 'route', body: dd.stages.map(function (s, i) { return '<strong>' + (i + 1) + '.</strong> ' + s; }).join('<br>') + '<br><br>No travel to Australia is needed for either exam.', css: 'sand' });
        out.push({ title: 'The three-year clock starts earlier than people think', group: 'need', body: 'It starts from <strong>' + dd.clock.from + '</strong> \u2014 not from passing an exam. Both exams must be passed and the APD Program joined inside it. ' + dd.clock.consequence + ' ' + dd.clock.attempts + ' The two interact badly: a resit costs you an attempt <em>and</em> months of the clock.', css: 'mint' });
        out.push({ title: 'Read the exam calendar before you plan the move', group: 'need', body: 'The MCQ runs in <strong>' + dd.calendar.mcq + '</strong>; the oral <strong>' + dd.calendar.oral + '</strong>. But MCQ results take <strong>' + dd.calendar.mcqResults + '</strong> \u2014 so a March MCQ result may not arrive before the April oral application closes, which in practice pairs a March MCQ with the <strong>October</strong> oral. Add the assessment stage (' + dd.calendar.assessment + ') and a realistic run from application to DSR is closer to a year than a quarter. Plan the relocation around that, not around the exam dates alone.', css: 'sand' });
        out.push({ title: 'Two things that fail applications before they are assessed', group: 'need', body: '<strong>Documents:</strong> ' + dd.docTrap + ' <strong>Cultural awareness:</strong> ' + dd.cultural + ' Both are avoidable and both are common.', css: 'mint' });
        out.push({ title: 'What they want evidence of', group: 'need', body: '<strong>Placement:</strong> ' + dd.placement + ' <strong>Recency:</strong> ' + dd.recency, css: 'sand' });
        out.push({ title: 'If migration is the real goal, the door opens sooner', group: 'route', body: dd.migration + ' Worth knowing if a visa is on your critical path \u2014 you may not need to wait for the oral exam and APD before starting the visa process. It is a separate application either way.', css: 'mint' });
        out.push({ title: 'Then the credential itself', group: 'route', body: dd.apd, css: 'sand' });
      }
    }
    /* Fellowship ≠ specialist registration. Said plainly, because the person who needs it
       usually believes the opposite. */
    if (cc === 'nz' && (profOf() || {}).record === 'doctor' && a.qualLevel === 'fellowship-no-cct') {
      var fnc = (D().rules || {}).nzDoctorComparable;
      out.push({ title: 'A fellowship exam is not specialist registration — and that changes your route', group: 'route', body: 'This is worth being precise about, because it is the single most common misreading of the UK system. <strong>FRCR, MRCP, FRCA and their equivalents are examinations sat during training.</strong> The <strong>CCT</strong> is what completes that training and places you on the GMC specialist register. Holding the fellowship without the CCT means you are not yet a specialist for registration purposes here either — so the vocational (specialist) pathways are not the ones to aim at, and applying into them invites a decline on the first criterion rather than a discussion.', css: 'mint' });
      if (fnc) out.push({ title: 'What is open to you instead is often better news', group: 'route', body: 'The <strong>' + esc(fnc.pathway) + '</strong> sits under the <strong>general scope</strong>, and it turns on <strong>' + esc(fnc.basis) + '</strong> rather than on holding a completed specialist award. If you have been working in the United Kingdom, that is exactly the evidence it asks for. So the honest answer — fellowship, no CCT — does not close a door; it points at a different and genuinely available one. The Council’s <strong>Competent Authority</strong> pathway may also apply if your primary medical degree and internship were both completed in the UK or Ireland.', css: 'sand', href: fnc.url, linkLabel: 'MCNZ — Comparable Health System pathway' });
      var voc4r = (D().rules || {}).nzVoc4 || {};
      /* RESOLVED 27 August 2026 against the approved-qualification list PDF itself. Every UK
         entry is Fellowship/Membership AND (CCT by the GMC or PMETB, OR CCST by the STA) —
         no third limb, and the Portfolio Pathway is named nowhere in the document. */
      out.push({ title: 'And if your specialist registration came through the Portfolio Pathway', group: 'need', body: (voc4r.portfolioPathway ? esc(voc4r.portfolioPathway) : '') + ' We checked that against the list itself rather than inferring it from the pathway page, because the answer decides which application you make and a wrong guess costs a decline rather than a conversation.', css: 'mint' });
    }
    if (key === 'midwifery' && cc === 'nz') {
      var mw = ((D().records || {}).midwifery || {}).nz || {};
      /* Ordered by what changes a decision, not by where it sits in the process. */
      if (mw.altPathwayNote) out.push(mw.altPathwayNote);
      if (mw.conditionsNote) out.push(mw.conditionsNote);
      if (mw.englishNote) out.push(mw.englishNote);
    }
    if (key === 'dietitian' && cc === 'nz') {
      var dr = (D().rules || {}).nzDietitianRoutes || { straightToRegistration: [], straightToExams: [], url: '' };
      var worked = a.recentCountry || a.regCountry || a.qualCountry;
      var origin = dr.straightToRegistration.indexOf(worked) >= 0 ? 'reg'
        : dr.straightToExams.indexOf(worked) >= 0 ? 'exam' : 'roq';
      if (worked) lastProfFired = { rule: dr, country: worked };
      var dHref = dr.url, dLabel = 'Dietitians Board — overseas trained';
      if (a.dietRecent === 'no' || a.dietRecent === 'unsure') out.push({ title: 'Check the recency requirement first', group: 'need', body: 'Twelve months of practice averaging 20 hours a week within the last three years, in the country where you are registered or credentialled, is a core requirement rather than a preference — it applies before any of the four routes opens. If you fall short, that is the conversation to have with the Board before you spend anything on an application.', css: 'sand', href: dHref, linkLabel: dLabel });
      if (origin === 'reg') out.push({ title: 'You look like a Straight to Registration applicant', group: 'route', body: 'Dietitians who have worked as registered dietitians in the UK or South Africa can go straight to registration — no recognition-of-qualifications step, <strong>no MCQ and no OSCE</strong>. The test is where you have <strong>worked as a registered dietitian</strong>, not where you trained. You submit an eligibility application, the Board grants provisional registration once an employer supports it, and full registration follows 12 months of supervised practice. It is the shortest of the four routes by some distance.', css: 'mint', href: dHref, linkLabel: dLabel });
      else if (origin === 'exam' && a.dietSubspec === 'yes') out.push({ title: 'The subspecialist route may fit you better', group: 'route', body: 'Having worked as a registered dietitian in ' + theCountry(worked).replace(/^The /, 'the ') + ' with three or more years of subspecialised experience in the last five, you may be able to use the Board’s subspecialist route rather than the examination route. It registers you provisionally with a scope condition limiting you to that subspecialty — faster in, narrower once there. Worth weighing deliberately rather than defaulting to it.', css: 'mint', href: dHref, linkLabel: dLabel });
      else if (origin === 'exam') out.push({ title: 'You look like a Straight to Examinations applicant', group: 'route', body: 'Dietitians who have worked as registered dietitians in Ireland or Canada skip the recognition-of-qualifications step but still sit two examinations: the written MCQ administered through <strong>Dietitians Australia</strong>, then the Board\u2019s oral <strong>OSCE</strong>. Both are currently sat online, so neither means travelling to New Zealand. Provisional registration and 12 months of supervised practice follow.', css: 'mint', href: dHref, linkLabel: dLabel });
      else if (worked) out.push({ title: 'Expect the full route: recognition, then examinations', group: 'route', body: 'Where you have not worked as a registered dietitian in the UK, South Africa, Ireland or Canada, the Board starts you with recognition of qualifications first, then the multi-choice examination and the OSCE, then provisional registration and 12 months of supervised practice. It is the longest of the four routes, and knowing that at the start is what makes it manageable.', css: 'sand', href: dHref, linkLabel: dLabel });
      out.push({ title: 'You will need an employer before you finish registering', group: 'need', body: 'Every route ends in provisional registration, and provisional registration requires a New Zealand employer who supports it and provides the 12 months of supervised practice. The job search is not something that waits until you are registered — it runs alongside, and the two finish together. This is the part of the process people plan for last and should plan for first.', css: 'mint' });
    }
    if (key === 'social-worker' && a.swYears === 'lt2') out.push({ title: 'Early-career applications often carry conditions', body: 'With less than two years of post-qualifying practice, expect the possibility of conditions such as supervision attached to registration. That is a normal starting point rather than a mark against you, but it affects which roles you can take on arrival.', css: 'sand' });
    if (key === 'speech-language-therapist' && (a.sltCert === 'no' || a.sltCert === 'unsure')) out.push({ title: 'The certificate is what employers read', body: 'With no statutory register in either country, the professional credential does the work a registration would. If you do not hold one, or are unsure, that is the first thing to establish — it is what an employer will ask for.', css: 'sand' });
    return out;
  }
  /* Cultural competence is a REQUIREMENT, not a nicety, and it surprises people. Under the
     HPCA Act 2003 every New Zealand responsible authority must set standards of cultural
     competence, so it applies across the regulated professions rather than to one of them;
     several boards discharge it through a specific named course you must complete before or
     shortly after registration. Australia handles it as cultural safety inside the National
     Scheme rather than a course, but it is assessed. Excluded where registration is not
     statutory, and where the profession's own record already spells the course out. */
  var HPCA_REGULATED = ['doctor', 'specialist-doctor', 'radiologist', 'gp', 'imaging', 'mri', 'sonographer', 'radiation-therapist', 'nuclear-medicine', 'physiotherapist', 'psychologist', 'dietitian', 'social-worker', 'anaesthetic-technician', 'nurse', 'midwife', 'pharmacist', 'podiatrist', 'optometrist'];
  function cultureNote(cc, key, reg) {
    if (cc === 'nz') {
      if (HPCA_REGULATED.indexOf(key) < 0) return null;
      return { title: 'Cultural competence is a registration requirement', group: 'need', body: 'Under the Health Practitioners Competence Assurance Act 2003, ' + reg + ' must set standards of cultural competence — including competence to work with Māori — and you are assessed against them like any other standard. In practice most boards discharge this through a specific course, often the Ngā Paerewa Te Tiriti e-learning modules, completed around the point of registration. It is not a formality and it is not optional; build it into your timeline. Requirements differ by board and change, so confirm the current one with yours.', css: 'sand' };
    }
    return { title: 'Cultural safety is part of the assessment', group: 'need', body: 'Australia treats this as cultural safety rather than a single course, and it runs through the National Scheme — Ahpra’s codes of conduct, and for several professions an explicit training component inside the assessment itself. Physiotherapy’s FLYR routes, for example, include cultural safety training as a required step. Expect it to appear as a requirement rather than a recommendation.', css: 'sand' };
  }
  /* Note bodies are author-written and a few need bold to carry a distinction that matters
     (which scope, which of four routes). Everything is still escaped — we only put back
     <strong> and <em> afterwards, so no attribute, tag or URL from the data can inject. */
  function noteText(s) {
    return esc(s || '')
      .replace(/&lt;(\/?)(strong|em)&gt;/g, '<$1$2>');
  }
  function startedNote(cc, reg) {
    var p = st.answers.regProgress;
    var hit = p === 'already' || p === 'both' || (cc === 'au' && p === 'australia') || (cc === 'nz' && p === 'new-zealand');
    if (!hit) return null;
    return { title: 'You\u2019ve already started', body: 'You told us you\u2019ve begun registration here — keep going with ' + reg + ', and we can support the job-search side in parallel.', css: 'mint' };
  }
  function recencyNote(reg) {
    var a = st.answers;
    if (a.practising !== 'no') return null;
    if (a.lastPractised !== '3-5' && a.lastPractised !== '5plus') return null;
    return { title: 'Recency of practice', body: 'You\u2019ve been out of practice for a while. Regulators treat recency differently and nothing here is automatic — but it\u2019s worth checking ' + reg + '\u2019s recency expectations early.', css: 'sand' };
  }

  /* ---------------- recognition outlook ---------------- */
  function outlookFor(cc, key, r, isSpec) {
    var d = D(), a = st.answers;
    var o = d.outlooks && d.outlooks[key + '.' + cc];
    if (!o) return null;
    var tier = o.base, why = (o.whys && o.whys[o.base]) || '';
    var basis = a.qualCountry ? 'Based on your training in ' + a.qualCountry : 'Based on your answers';
    var regC = a.registered === 'yes' ? a.regCountry : '';
    var auSpecDoctor = key === 'doctor' && cc === 'au' && isSpec;
    if (auSpecDoctor) { tier = 'assessed'; why = 'Specialist recognition is an individual comparability assessment by the AMC and the relevant specialist college — requirements vary by specialty and jurisdiction.'; }
    if (o.strong && !auSpecDoctor) {
      var c = o.strong.basis === 'registration' ? regC : a.qualCountry;
      var stageOK = !o.strong.stageOnly || o.strong.stageOnly.indexOf(a.doctorStage || '') >= 0;
      if (c && stageOK && o.strong.countries.indexOf(c) >= 0) {
        tier = 'strong'; why = o.strong.why.replace('{country}', c).replace('{theCountry}', theCountry(c).replace(/^The /, 'the '));
        basis = (o.strong.basis === 'registration' ? 'Based on your registration in ' : 'Based on your training in ') + c;
      }
    }
    if (o.also && tier === o.base && !auSpecDoctor) {
      var c2 = o.also.basis === 'registration' ? regC : a.qualCountry;
      if (c2 && o.also.countries.indexOf(c2) >= 0) {
        tier = o.also.tier; why = o.also.why.replace('{country}', c2);
        basis = (o.also.basis === 'registration' ? 'Based on your registration in ' : 'Based on your training in ') + c2;
      }
    }
    if (o.ttmra && regC && ((cc === 'nz' && regC === 'Australia') || (cc === 'au' && regC === 'New Zealand'))) {
      tier = 'strong'; why = d.rules.ttmra.why.replace('{country}', regC).replace('{theCountry}', theCountry(regC).replace(/^The /, 'the ')); basis = 'Trans-Tasman mutual recognition';
    }
    if (r.status === 'streamlined' && tier !== 'strong') { tier = 'strong'; why = 'The streamlined pathway described above currently applies to your combination — the regulator confirms eligibility.'; }
    var T = d.outlookTiers;
    return {
      tier: tier, label: T[tier].label, why: why, basis: basis, stamp: o.lastReviewed || '',
      segs: ['strong', 'assessed', 'exam'].map(function (t) { return { short: T[t].short, css: t === tier ? T[t].on : T[t].off, current: t === tier ? 'true' : 'false' }; })
    };
  }

  /* ---------------- resolve a result ---------------- */
  function resolve(cc) {
    var d = D(), a = st.answers;
    var prof = profOf() || d.professions[d.professions.length - 1];
    var key = prof.record;
    /* A profession whose record is missing used to make resolve() throw, which left the form
       incrementing past the last step with no result and a "07 / 05" counter. A data gap should
       degrade to the honest answer — go to the regulator — not to a broken page. */
    var rec = key === 'other' ? (d.records.other || {}).any : (d.records[key] || {})[cc];
    if (!rec) {
      var nr = d.notRecruited || {};
      rec = {
        regulator: 'The regulator for your profession', status: 'individual', notRecruited: true,
        headline: 'Go straight to the regulator',
        paras: ['We do not hold verified pathway detail for this profession here, and we will not guess at it. The regulator sets the rules and makes every decision.'],
        officialUrl: nr.regulatorsPage, steps: [], buttons: []
      };
    }
    var base = rec;
    var r = assign({}, base);
    var notes = [];
    var fired = null;   // the country-conditioned pathway that actually applied, if any
    var isSpec = prof.specialist || a.doctorStage === 'smo' || a.doctorSpecialist === 'yes';

    /* Profession-specific note, first in the list. Every record carries one: it is the thing
       about THIS profession that the generic registration story does not tell you — scopes,
       divisions, which body actually assesses you, whether registration is statutory at all.
       Country-specific by construction, because it lives on base = records[key][cc]. */
    if (base.profNote) notes.push(base.profNote);
    profAnswerNotes(key, cc).forEach(function (n) { notes.push(n); });
    if (lastProfFired) fired = lastProfFired;

    if (key === 'physiotherapist' && cc === 'nz') {
      var list = d.rules.nzPhysioExpress.countries;
      var byReg = a.registered === 'yes' && list.indexOf(a.regCountry) >= 0;
      var byQual = list.indexOf(a.qualCountry) >= 0;
      if (byReg || byQual) {
        r = assign({}, r, base.express);
        fired = { rule: d.rules.nzPhysioExpress, country: byQual ? a.qualCountry : a.regCountry };
      }
      /* Fast Track is qualification-specific, so it only fires on the country of QUALIFICATION
         — being registered in Hong Kong with an Indian degree is not the same thing. */
      var ft = d.rules.nzPhysioFastTrack;
      if (!byReg && !byQual && ft.countries.indexOf(a.qualCountry) >= 0) {
        notes.push({ title: 'Your qualification may be on the Fast Track list', group: 'route', body: 'The Board has pre-assessed some qualifications and identified exactly which competencies it wants extra evidence for. The list currently covers ' + (ft.detail[a.qualCountry] || 'selected qualifications from ' + a.qualCountry) + '. There is no separate application: you apply through the International General pathway and the Board identifies your degree and contacts you. Worth preparing the additional evidence now rather than waiting to be asked.', css: 'mint', href: ft.url, linkLabel: 'Fast Track pathway and evidence templates' });
        fired = { rule: ft, country: a.qualCountry };
      }
      if (base.scopeNote) notes.push(base.scopeNote);
      if (a.registered === 'yes' && a.regCountry === 'Australia') notes.push({ title: 'Use the Australian TTMR route', group: 'route', body: 'Registered in Australia, you come in under Trans-Tasman mutual recognition rather than either international pathway — a separate application and generally the quickest of the five.', css: 'mint', href: 'https://physioboard.org.nz/australian-ttmr-pathway', linkLabel: 'Australian TTMR pathway' });
    }
    if (key === 'physiotherapist' && cc === 'au') {
      var ex = d.rules.auPhysioExpressFlyr.countries.indexOf(a.qualCountry) >= 0;
      var fl = d.rules.auPhysioFlyr.countries.indexOf(a.qualCountry) >= 0;
      if (ex || fl) {
        var n = assign({}, ex ? base.expressFlyrNote : base.flyrNote);
        n.body = n.body.replace('{country}', a.qualCountry).replace('{theCountry}', theCountry(a.qualCountry).replace(/^The /, 'the '));
        if (fl && d.rules.auPhysioFlyr.note) n.body += ' ' + d.rules.auPhysioFlyr.note;
        n.href = ex ? d.rules.auPhysioExpressFlyr.url : d.rules.auPhysioFlyr.url;
        n.linkLabel = ex ? 'Express FLYR country list' : 'FLYR country list';
        notes.push(n);
        fired = { rule: ex ? d.rules.auPhysioExpressFlyr : d.rules.auPhysioFlyr, country: a.qualCountry };
      }
    }
    if (key === 'doctor' && cc === 'au') {
      if (isSpec) {
        r = assign({}, r, { headline: base.specialist.headline, paras: base.specialist.paras });
        if (a.doctorSpecQual === 'no') notes.push(base.specialist.noSpecQualNote);
      } else if (a.registered === 'yes' && d.rules.auDoctorCompetentAuthority.countries.indexOf(a.regCountry) >= 0) {
        var ca = assign({}, base.caNote); ca.body = ca.body.replace('{country}', a.regCountry).replace('{theCountry}', theCountry(a.regCountry).replace(/^The /, 'the ')); notes.push(ca);
        fired = { rule: d.rules.auDoctorCompetentAuthority, country: a.regCountry };
      }
    }
    if (key === 'anaesthetic-technician' && cc === 'nz' && a.qualCountry === d.rules.nzOdpUkCountry) {
      if (a.odpExp === 'yes' && a.odpStanding === 'yes') {
        r = assign({}, r, base.recognised);
        fired = { rule: d.rules.nzOdpUk, country: d.rules.nzOdpUkCountry };
      } else notes.push(base.ukShortfallNote);
    }
    if (key === 'psychologist' && cc === 'nz') {
      /* Scope first: it decides both what they may practise and what we can represent them
         for, and it is the thing a job title silently gets wrong. Then the two training
         criteria people fail on, then money, then the two expectation-setters. */
      if (base.scopeNote) notes.push(base.scopeNote);
      if (base.criteriaNote) notes.push(base.criteriaNote);
      if (base.hoursNote) notes.push(base.hoursNote);
      var cautionLevels = (d.rules || {}).psychNzCautionLevels || [];
      if (cautionLevels.indexOf(a.qualLevel) >= 0 && base.cautionNote) notes.push(base.cautionNote);
      if (base.feeNote) notes.push(base.feeNote);
      if (base.timingNote) notes.push(base.timingNote);
      if (base.outcomeNote) notes.push(base.outcomeNote);
      if (base.rakaMauiNote) notes.push(base.rakaMauiNote);
    }

    if (key !== 'other') {
      var e = englishNote(cc); if (e) notes.push(e);
      var cu = cultureNote(cc, key, r.regulator); if (cu) notes.push(cu);
      var s = startedNote(cc, r.regulator); if (s) notes.push(s);
      var rc = recencyNote(r.regulator); if (rc) notes.push(rc);
    }
    r.notes = notes.filter(Boolean);
    /* A route that keys off your PROGRAMME rather than your country. Without this the summary
       falls through to "no country-based streamlined route covers this combination", which is
       technically true and reads as a flat contradiction of the abridged-pathway note above it. */
    if (key === 'occupational-therapist' && cc === 'nz') r.profRoute = 'the Board\u2019s abridged pathway';
    if (key === 'doctor' && cc === 'nz' && isSpec) {
      /* The general-scope ladder tells a consultant to secure an offer "at a matching level";
         the vocational route needs a consultant/specialist-level offer and a different order
         of steps entirely. Both are verified — serve the one that matches their scope. */
      r = assign({}, r, { steps: [
        'Confirm your postgraduate qualification against the Council\u2019s approved list, and that your area of medicine is an approved one',
        'Start primary source verification through EPIC before you apply — the Council cannot begin without evidence it is under way',
        'Secure a New Zealand job offer at consultant or specialist level, and provide three references on the RP6 form',
        'Apply through myMCNZ — processing is 20 working days from a complete application, longer for psychiatry',
        'Attend your registration meeting in New Zealand within two weeks of starting, then work under supervision before applying to move to the full vocational scope'
      ] });
    }
    r.fired = fired;
    r.ttmra = a.registered === 'yes' && ((cc === 'nz' && a.regCountry === 'Australia') || (cc === 'au' && a.regCountry === 'New Zealand'));
    r.outlookData = outlookFor(cc, key, r, isSpec);
    return present(cc, r, prof, key);
  }

  /* "Why you're seeing this" — names what drove the result: the profession, the country
     of qualification/registration, and the regulator's OWN term for the pathway. A country
     condition is never eligibility on its own, and its absence is never a barrier. */
  function aOrAn(label) { return (/^[aeiou]/i.test(label) ? 'an ' : 'a ') + label; }
  function theCountry(c) {
    return /^(United |Netherlands|Philippines|United Arab Emirates|UAE|Gambia|Bahamas|Maldives|Czech)/.test(c) ? 'The ' + c : c;
  }
  function whyLines(cc, r, prof) {
    var a = st.answers, d = D();
    var who = prof && prof.id !== 'other' ? aOrAn(prof.label) : 'an internationally qualified healthcare professional';
    var where = a.qualCountry ? ' who qualified in ' + theCountry(a.qualCountry).replace(/^The /, 'the ') : '';
    var recent = a.recentCountry && a.recentCountry !== a.qualCountry && a.recentCountry !== a.regCountry
      ? ', practising most recently in ' + theCountry(a.recentCountry).replace(/^The /, 'the ') : '';
    var regd = a.registered === 'yes' && a.regCountry
      ? ((a.regCountry === a.qualCountry && !recent) ? ' and is registered there'
        : ' and is currently registered in ' + theCountry(a.regCountry).replace(/^The /, 'the ')) : '';
    var lines = ['You told us you are ' + who + where + recent + regd + '.'];
    if (r.fired) {
      lines.push(theCountry(r.fired.country) + ' is currently included within ' + r.fired.rule.regulator + '\u2019s ' +
        r.fired.rule.pathway + ', which covers applicants with ' + r.fired.rule.basis +
        ' \u2014 subject to the regulator\u2019s full eligibility criteria. Meeting the country condition is not eligibility on its own.');
    } else if (r.ttmra) {
      lines.push('Because you\u2019re registered in ' + a.regCountry + ', ' + (d.rules.ttmraTerm || 'Trans-Tasman Mutual Recognition') +
        ' may apply. You still apply to the regulator, which confirms eligibility.');
    } else if (r.profRoute) {
      lines.push('Your answers point at ' + r.profRoute + ' rather than at a country-based rule. This is one of the professions that keys off where and how you trained rather than which passport you hold — the regulator still confirms eligibility.');
    } else if (a.qualCountry) {
      var regName = /^the /i.test(r.regulator) ? r.regulator : 'The ' + r.regulator;
      lines.push(regName + ' does not currently run a country-based streamlined route that covers this combination \u2014 which is not a barrier. It means your qualification is assessed individually, and recognition, further assessment or conditions all remain possible.');
    }
    return lines;
  }

  /* A profession Ethicare does not currently recruit in this country. TWO cases, and the
     original version conflated them by stripping all pathway detail from both:

     · A profession we hold a VERIFIED record for. No role to offer, but the registration
       guidance is good and it stays. Saying "we have no job, so we will tell you nothing"
       contradicts the whole open-access position — the guidance is free whether or not we
       ever place you. What is removed is the recruitment CTA, not the help.
     · The `other` catch-all, where we have nothing verified to say. That one still hands
       straight over to the regulator register, because inventing guidance would be worse
       than declining to give it.

     Driven by `supported` in pathway-checker-data.js. */
  function notRecruited(cc, r, prof, key) {
    var d = D(), nr = d.notRecruited, country = cc === 'au' ? 'Australia' : 'New Zealand';
    var carried = [];
    if (key && key !== 'other') {
      if (r.profNote) carried.push(r.profNote);
      profAnswerNotes(key, cc).forEach(function (n) { carried.push(n); });
      var cuN = cultureNote(cc, key, r.regulator); if (cuN) carried.push(cuN);
    }
    function fill(s) { return String(s).replace(/\{country\}/g, country); }
    var isOther = !prof || prof.id === 'other';
    var buttons = [];
    if (r.officialUrl) buttons.push({ label: 'Go to ' + r.regulator, href: r.officialUrl, cls: 'pw-b1', arrow: '\u2197', external: true });
    buttons.push({ label: 'All official regulators', href: nr.regulatorsPage, cls: buttons.length ? 'pw-b2' : 'pw-b1', arrow: '\u2192', external: false });
    // the relocation half applies whatever the profession — never a regulator link on its own
    buttons.push({ label: 'Guides for the whole move', href: '/resources', cls: 'pw-b2', arrow: '\u2192', external: false });
    var who = prof && prof.id !== 'other' ? aOrAn(prof.label) : 'an internationally qualified healthcare professional';
    var base = {
      cc: cc, country: country,
      tile: cc === 'au' ? 'AU' : 'NZ',
      tileCls: cc === 'au' ? 'pw-tile au' : 'pw-tile nz',
      pillCss: d.statuses.outside.pillCss, statusLabel: d.statuses.outside.label,
      regLine: r.regulator, regulator: r.regulator, status: 'outside',
      officialUrl: r.officialUrl || '',
      notes: carried,
      lead: [buttons[0]], rest: buttons.slice(1),
      recordKey: (prof && prof.record) || '',
      outlook: null, notRecruited: true,
      lastChecked: 'Registration information last checked: ' + (r.lastReviewed || d.meta.lastReviewedDefault)
    };
    if (isOther) {
      return assign(base, {
        headline: fill(nr.headline), paras: nr.paras.map(fill), steps: [], notes: [],
        why: ['You told us you are ' + who + ' looking at ' + country + '. That sits outside the professions we recruit there, and we do not hold verified guidance for it either \u2014 so rather than guess, we point you at the official register.']
      });
    }
    /* No role, but the route still stands. The pill still says the honest thing. */
    var noRole = 'We are not recruiting this profession into ' + country + ' at the moment, so there is no role we can put in front of you. The registration route below still applies, and it is still yours to use \u2014 free, whether you ever work with us or not.';
    return assign(base, {
      headline: r.headline,
      paras: [noRole].concat(r.paras || []),
      steps: r.steps || [],
      why: ['You told us you are ' + who + ' looking at ' + country + '. We are not recruiting that profession there at the moment, so this is the registration route without a job attached.']
    });
  }

  function present(cc, r, prof, key) {
    var d = D();
    if (prof && prof.supported && prof.supported[cc] === false) return notRecruited(cc, r, prof, key);
    var status = d.statuses[r.status];
    var jobs = prof.jobs[cc] || d.meta.jobs;
    var buttons = (r.buttons || []).map(function (b) {
      var href = b.hrefKey === 'OFFICIAL' ? r.officialUrl : (b.hrefKey === 'JOBS' ? jobs : b.hrefKey);
      var cls = b.kind === 'primary' ? 'pw-b1' : (b.kind === 'secondary' ? 'pw-b2' : 'pw-b3');
      return { label: b.label, href: href, cls: cls, arrow: b.external ? '\u2197' : '\u2192', external: !!b.external };
    });
    var notes = (r.notes || []).map(function (n) { return assign({}, n, { cls: n.css === 'sand' ? 'pw-note sand' : 'pw-note', hasLink: !!n.href }); });
    return {
      cc: cc,
      country: cc === 'au' ? 'Australia' : 'New Zealand',
      tile: cc === 'au' ? 'AU' : 'NZ',
      tileCls: cc === 'au' ? 'pw-tile au' : 'pw-tile nz',
      pillCss: status.pillCss, statusLabel: status.label,
      regLine: r.regulator + (r.assessor ? ' \u00b7 Assessment: ' + r.assessor : ''),
      regulator: r.regulator, status: r.status, officialUrl: r.officialUrl || '',
      jobsHref: jobs || '',
      recordKey: (prof && prof.record) || '',
      headline: r.headline, paras: r.paras || [], notes: notes,
      steps: (r.steps || []).map(function (t, i) { return { n: String(i + 1), t: t }; }),
      lead: buttons.length ? [buttons[0]] : [],
      rest: buttons.slice(1),
      outlook: r.outlookData || null,
      why: whyLines(cc, r, prof),
      // the outlook stamp records WHAT was verified; prefer it over the record's bare month
      lastChecked: 'Registration information last checked: ' + (
        (r.outlookData && r.outlookData.stamp && r.outlookData.stamp.length > (r.lastReviewed || '').length)
          ? r.outlookData.stamp : (r.lastReviewed || d.meta.lastReviewedDefault))
    };
  }

  function results() {
    if (st.step !== RESULT || !D()) return [];
    if (st.answers.profession === 'other') {
      var card = resolve('nz');
      card.country = 'Australia & New Zealand'; card.tile = 'AU \u00b7 NZ';
      card.tileCls = 'pw-tile both'; card.cc = 'both';
      card.regLine = 'Both countries publish the full list of regulated professions — that is where your route starts';
      card.headline = 'We don\u2019t currently recruit this profession into Australia or New Zealand';
      card.paras = (card.paras || []).map(function (p) { return p.replace(/New Zealand/g, 'Australia or New Zealand'); });
      card.why = ['You told us your profession is outside the list we recruit into. Rather than guess at a pathway, we point you to the official registers, which name every regulated profession and the body responsible for it.'];
      return [card];
    }
    return targets().map(resolve);
  }

  /* ---------------- validation ---------------- */
  /* Returns {key,label} pairs, not strings. The key is the answer field, which lets the
     renderer mark the unanswered question itself rather than only listing it in a footnote
     beside Continue — and the list is never truncated, because "and more" tells someone
     they are stuck without telling them where. */
  function missing() {
    var a = st.answers, s = st.step, m = [];
    var need = function (k, label) { m.push({ key: k, label: label }); };
    if (s === 1 && !a.profession) need('profession', 'your profession');
    if (s === 2 && !a.destination) need('destination', 'where you\u2019d like to work');
    if (s === 3) {
      if (!a.qualCountry) need('qualCountry', 'where you qualified');
      if (!a.qualLevel) need('qualLevel', 'your qualification level');
      if ((profOf() || {}).record === 'doctor' && (a.qualLevel === 'cct' || a.qualLevel === 'overseas-pg' || a.qualLevel === 'australasian') && !a.docSpecCountry) need('docSpecCountry', 'where your specialist award was issued');
    }
    if (s === 4) {
      if (!a.registered) need('registered', 'your registration status');
      if (!a.regProgress) need('regProgress', 'whether you\u2019ve started registration');
    }
    if (s === 5) {
      if (!a.practising) need('practising', 'whether you\u2019re practising');
      if (a.practising === 'no' && !a.lastPractised) need('lastPractised', 'when you last practised');
      if (!a.english) need('english', 'the English question');
      var isDocP = (profOf() || {}).record === 'doctor';
      if (isDocP && !a.doctorStage) need('doctorStage', 'the career stage question');
      if (isDocP && (a.doctorStage === 'smo' || a.doctorSpecialist === 'yes') && !a.doctorSpecQual) need('doctorSpecQual', 'the specialist qualification question');
    if (odpBranch()) { if (!a.odpExp) need('odpExp', 'the experience question'); if (!a.odpStanding) need('odpStanding', 'the good-standing question'); }
    }
    if (s === 6) {
      var pset = profQuestionSet();
      if (pset) pset.questions.forEach(function (q) {
        if (!a[q.field]) need(q.field, 'the question about ' + q.q.replace(/\?$/, '').replace(/^[A-Z]/, function (c) { return c.toLowerCase(); }));
      });
    }
    return m;
  }
  function missingKeys() { return missing().map(function (x) { return x.key; }); }
  function phrase(list) {
    var l = list.map(function (x) { return x.label; });
    if (l.length === 1) return l[0];
    return l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1];
  }

  /* ---------------- markup helpers ---------------- */
  function sel(cur, v) { return cur === v ? ' is-sel' : ''; }
  function opts(list, cur) {
    return list.map(function (o) { return '<option value="' + esc(o) + '"' + (cur === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }
  function countrySelect(id, key, cur, cls) {
    var d = D() || {};
    return '<div class="pw-sel' + (cls ? ' ' + cls : '') + '"><select id="' + id + '" data-field="' + key + '">' +
      '<option value="">Select a country&hellip;</option>' + opts(d.countriesTop || [], cur) +
      '<option value="" disabled>──────────</option>' + opts(d.countriesAll || [], cur) + '</select>' + chev() + '</div>';
  }
  function chev() { return '<svg viewBox="0 0 24 24" fill="none" stroke="#5C6B68" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>'; }
  function req() { return ' <span class="pw-req">*</span>'; }
  function optn() { return ' <span class="pw-opt-note">(optional)</span>'; }
  function btnRow(list, key, cur, cls) {
    return list.map(function (o) {
      return '<button type="button" class="pw-pick' + (cls ? ' ' + cls : '') + sel(cur, o.id) + '" data-pick="' + key + '" data-v="' + esc(o.id) + '">' + esc(o.label) + '</button>';
    }).join('');
  }
  function pairs(arr) { return arr.map(function (x) { return { id: x[0], label: x[1] }; }); }

  /* ---------------- progress ----------------
     A sidebar restating the whole process competed with the question itself. The
     question is now the only thing with weight; progress is a count and a hairline. */
  function progressHead() {
    var step = st.step;
    var pct = Math.round(((step - 1) / qsteps()) * 100);
    return '<div class="pw-top">' +
      '<div class="pw-topline">' +
        '<span class="pw-src">Based on official regulator guidance</span>' +
        '<span class="pw-count"><b>' + pad(step) + '</b> / ' + pad(qsteps()) + '</span>' +
      '</div>' +
      '<div class="pw-bar"><i style="width:' + pct + '%"></i></div></div>';
  }

  function head(n, title) {
    return '<h3 class="pw-ask">' + esc(title) + '</h3>';
  }
  var ICONS = {
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="#02615D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c1.5-3.4 4.4-5 8-5s6.5 1.6 8 5"></path></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="#02615D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="#02615D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 2 9l10 5 10-5-10-5z"></path><path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5"></path></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="none" stroke="#02615D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="m9 13 2 2 4-4"></path><path d="M9 4h6"></path></svg>'
  };

  /* ---------------- steps ---------------- */
  function step1() {
    var d = D() || {}, a = st.answers;
    var groups = (d.groups || []).map(function (g) {
      var items = (d.professions || []).filter(function (p) { return p.group === g; });
      return { name: g, items: items };
    });
    groups.push({ name: 'Something else', items: (d.professions || []).filter(function (p) { return p.id === 'other'; }) });
    var body = groups.map(function (g) {
      if (!g.items.length) return '';
      return '<div class="pw-group"><div class="pw-gk">' + esc(g.name) + '</div><div class="pw-grid prof">' +
        g.items.map(function (p) { return '<button type="button" class="pw-pick prof' + sel(a.profession, p.id) + '" data-pick="profession" data-v="' + esc(p.id) + '">' + esc(p.label) + '</button>'; }).join('') +
        '</div></div>';
    }).join('');
    return head(1, 'What is your profession?') +
      '<p class="pw-sub">Registration rules differ substantially between professions, so we\u2019ll ask the questions that matter for yours.</p>' + body;
  }

  function step2() {
    var a = st.answers;
    var list = [
      { id: 'australia', tile: 'AU', cls: 'au', label: 'Australia', desc: 'Warmer climate, bigger cities, state-based systems' },
      { id: 'new-zealand', tile: 'NZ', cls: 'nz', label: 'New Zealand', desc: 'One national system, outdoors on your doorstep' },
      { id: 'both', tile: 'AU\u00b7NZ', cls: 'both', label: 'Both', desc: 'Weighing them up — see both routes side by side' },
      /* No "I'm not sure" here: it produced exactly the same result as "Both" — two buttons for
         one outcome, which makes the form look like it is not listening. */
    ];
    return head(2, 'Where would you like to work?') +
      '<p class="pw-sub">Choose both if you\u2019re weighing them up — we\u2019ll show the two starting points side by side.</p>' +
      '<div class="pw-grid dest">' + list.map(function (o) {
        return '<button type="button" class="pw-dest' + sel(a.destination, o.id) + '" data-pick="destination" data-v="' + o.id + '">' +
          '<span class="pw-tile ' + o.cls + '">' + esc(o.tile) + '</span><span class="pw-dl">' + esc(o.label) + '</span><span class="pw-dd">' + esc(o.desc) + '</span></button>';
      }).join('') + '</div>';
  }

  /* Three screens, one topic each. The pathway turns on WHERE you qualified and where
     you have practised recently — not on the name of your institution. Anything that does
     not change the guidance stayed out of the flow. */
  function step3() {
    var d = D() || {}, a = st.answers;
    /* Doctors get named awards rather than generic levels — see doctorQualLevels in the data
       file. Where we know the fellowship for their specialty, name it in the option so they are
       matching a certificate rather than interpreting a category. */
    var isDoc3 = (profOf() || {}).record === 'doctor';
    var appr3 = ((d.rules || {}).nzApprovedAustralasian || {}).byProfession || {};
    var mine3 = appr3[a.profession];
    var lvlList = isDoc3 ? (d.doctorQualLevels || []).map(function (q) {
      var lab = q.label;
      if (q.id === 'australasian' && mine3) lab += ' — ' + mine3.quals[0].split(' — ')[0];
      return { id: q.id, label: lab };
    }) : (d.qualLevels || []).filter(function (q) {
      return !q.onlyRecord || q.onlyRecord === (profOf() || {}).record;
    }).map(function (q) {
      if (!q.labelBy && !q.labelDefault) return q;
      return { id: q.id, label: q.labelBy && q.labelBy[a.profession] ? q.labelBy[a.profession] : (q.labelDefault || q.label) };
    });
    var levels = lvlList.map(function (q) { return '<option value="' + esc(q.id) + '"' + (a.qualLevel === q.id ? ' selected' : '') + '>' + esc(q.label) + '</option>'; }).join('');
    return head(3, 'Where did you complete your qualification?') +
      '<p class="pw-sub">We ask where you trained, not your nationality \u2014 registration pathways are built around qualifications and training.</p>' +
      '<div class="pw-fields">' +
        '<div class="pw-f wide"><label for="pw-qc">' + (isDoc3 ? 'Where did you do your basic medical training?' : 'Country where you qualified') + req() + '</label>' + countrySelect('pw-qc', 'qualCountry', a.qualCountry) +
          '<p class="pw-hint">' + (isDoc3 ? 'Your primary medical degree \u2014 the MBBS, MBChB or equivalent. This is the one the competent authority route is read against, and it is often a different country from your specialist award.' : 'Some regulators assess differently depending on where you trained. A qualification from elsewhere is not a barrier \u2014 it may simply follow another pathway.') + '</p></div>' +
        '<div class="pw-f"><label for="pw-ql">' + (isDoc3 ? 'Which specialist award do you hold?' : 'Level of that qualification') + req() + '</label><div class="pw-sel"><select id="pw-ql" data-field="qualLevel"><option value="">Select&hellip;</option>' + levels + '</select>' + chev() + '</div>' +
          '<p class="pw-hint">' + (isDoc3 ? 'The Council sorts applicants by which award they hold, not by seniority — so this is the question that picks your pathway.' : 'If your award sits between two, choose the closest. Regulators assess the qualification itself, not the label.') + '</p></div>' +
        (isDoc3 && (a.qualLevel === 'cct' || a.qualLevel === 'overseas-pg' || a.qualLevel === 'australasian')
          ? '<div class="pw-f"><label for="pw-sc">Where was your specialist award issued?' + req() + '</label>' + countrySelect('pw-sc', 'docSpecCountry', a.docSpecCountry) +
            '<p class="pw-hint">Asked separately because the two are read against different lists. A doctor with an overseas primary degree and a UK CCT is on one pathway for the degree and another for the fellowship — collapsing them into one answer gets both wrong.</p></div>'
          : '') +
        '<div class="pw-f"><label for="pw-rec">Where have you practised most recently?' + optn() + '</label>' + countrySelect('pw-rec', 'recentCountry', a.recentCountry) +
          '<p class="pw-hint">If that differs from where you qualified, say so \u2014 recent practice can change the pathway.</p></div>' +
      '</div>';
  }

  /* Some pathways are open only to people from particular countries. That logic used to run
     invisibly: we read the answer, decided, and told them at the end. Someone choosing India
     had no way of knowing a UK/Ireland/Canada route even existed, and someone choosing Canada
     could not tell they had just landed on one. Both are the same failure — the rule was in
     the machine, not on the page. So we print the regulator's actual list, mark the country
     the answers point at, and say plainly which side of it they are on.
     Two subtleties this has to get right, or it misleads:
       · WHICH answer a list is read against differs. Most are about where you qualified;
         the Medical Council's comparable health system list is about where you have recently
         PRACTISED. Reading the wrong field would tell a doctor they are on a list they are not.
       · A list is never eligibility. Say so every time, next to the list, not in the footer. */
  function countryRoutesPanel() {
    var d = D() || {}, a = st.answers, ccs = targets();
    if (!a.profession || a.profession === 'other') return '';
    /* Rules are keyed by whichever the regulator actually distinguishes. Most professions are
       their own record, but every medical specialty shares the record 'doctor' — so matching
       on the picker id alone found NOTHING for a psychiatrist and printed the "no country-specific
       shortcut" panel, which is the precise opposite of the truth: VOC4 is a country shortcut and
       psychiatry is on it. Match on the id OR the record. */
    var myRec = (profOf() || {}).record;
    var applies = function (ru) {
      var p = ru.prof, hit = function (x) { return x === a.profession || x === myRec; };
      return Array.isArray(p) ? p.some(hit) : hit(p);
    };
    var rules = [];
    Object.keys(d.rules || {}).forEach(function (k) {
      var ru = d.rules[k];
      if (!ru || !ru.prof || !ru.countries || ccs.indexOf(ru.cc) < 0 || !applies(ru)) return;
      /* Rules declare the career stage they belong to; honour it. A consultant does not need the
         general-scope competent-authority route and a registrar cannot use VOC4, so showing both
         to both is not transparency, it is noise that makes the relevant one harder to find. */
      if (ru.stage && a.doctorStage && ru.stage !== a.doctorStage) return;
      rules.push({ label: ru.shortLabel, countries: ru.countries, scopeCaveat: ru.scopeCaveat, cc: ru.cc, matchOn: ru.matchOn, url: ru.url });
      (ru.alsoRoutes || []).forEach(function (x) { rules.push({ label: x.shortLabel, countries: x.countries, cc: ru.cc, matchOn: ru.matchOn, url: ru.url }); });
    });
    var cName = function (cc) { return cc === 'nz' ? 'New Zealand' : 'Australia'; };
    var caveat = '<p class="pw-hint" style="margin:16px 0 0;font-size:13.5px">Reproduced from the regulators\u2019 own pages and checked on the dates shown. They change without notice \u2014 confirm on the official page before you apply. Ethicare accepts no responsibility for decisions made on what you read here.</p>';
    if (!rules.length) {
      return '<div class="pw-follow"><div class="pw-followk">Before you choose</div>' +
        '<p class="pw-hint" style="margin:0;font-size:14.5px">For this profession there is no country-specific shortcut \u2014 everyone follows the same assessment, wherever they trained. Where you qualified still shapes what the regulator looks at, but it does not put you on a different route, so there is no list to be on or off.</p>' + caveat + '</div>';
    }
    /* Whose qualification we mean. A country list is meaningless until the candidate knows which
       certificate is being read against it, and that is role-specific — a psychiatrist's is the
       FRANZCP, not "a specialist qualification". Name it where the data knows it. */
    var appr = (d.rules || {}).nzApprovedAustralasian || { byProfession: {} };
    var myQ = (appr.byProfession || {})[a.profession];
    var qLine = myQ ? '<p class="pw-hint" style="margin:0 0 4px;font-size:14.5px">For ' + esc(myQ.area) + ', the qualification these lists are read against is <strong>' + esc(myQ.quals[0]) + '</strong>. Hold it and the Australasian route applies; hold something else and the lists below decide which assessment you go through.</p>' : '';
    var pickFor = function (r) { return r.matchOn === 'recent' ? (a.recentCountry || a.regCountry || a.qualCountry) : a.qualCountry; };
    var anyPicked = rules.some(function (r) { return !!pickFor(r); });
    var onAny = rules.some(function (r) { var p = pickFor(r); return p && r.countries.indexOf(p) >= 0; });
    var chip = function (c, hit) {
      return '<span style="display:inline-block;white-space:nowrap;padding:5px 11px;border-radius:999px;font-size:13px;line-height:1.2;font-weight:' + (hit ? '700' : '500') + ';' +
        (hit ? 'background:#02615D;color:#FCFBF8' : 'background:#FCFBF8;color:#2F5E49;border:1px solid rgba(2,97,93,.35)') + '">' + esc(c) + (hit ? ' \u2713' : '') + '</span>';
    };
    var body0 = qLine;
    var body = rules.map(function (r) {
      var picked = pickFor(r);
      var hit = picked && r.countries.indexOf(picked) >= 0;
      /* Before they answer, the whole list IS the content — it is how someone sees where they
         stand. After they answer it is 29 chips of noise around one fact, so collapse to the
         verdict and keep the list one click away rather than deleting it. */
      var others = r.countries.filter(function (c) { return c !== picked; });
      var wrap = function (cs) { return '<div style="display:flex;flex-wrap:wrap;gap:8px">' + cs.join('') + '</div>'; };
      var chips = !picked
        ? wrap(r.countries.map(function (c) { return chip(c, false); }))
        : (hit ? wrap([chip(picked, true)]) : '') +
          '<details style="margin-top:' + (hit ? '10px' : '0') + '"><summary style="cursor:pointer;font-size:13.5px;color:#2F5E49;font-weight:600">' +
          esc(hit ? 'See the other ' + others.length + ' countries on this list' : 'See the ' + r.countries.length + ' countries on this list') +
          '</summary><div style="margin-top:10px">' + wrap(others.map(function (c) { return chip(c, false); })) + '</div></details>';
      return '<div style="margin-top:16px"><p style="margin:0 0 4px;font-family:var(--display,\'Work Sans\',sans-serif);font-weight:600;font-size:15px;color:#02615D">' +
        esc(r.label) + (targets().length > 1 ? ' \u00b7 ' + cName(r.cc) : '') + (hit ? ' \u2014 you are on this list' : (picked ? ' \u2014 ' + esc(picked) + ' is not on this list' : '')) + '</p>' +
        '<p style="margin:0 0 8px;font-size:13.5px;color:#2F5E49">' +
        esc(r.matchOn === 'recent' ? 'Read against where you have practised recently \u2014 not where you qualified' : 'Read against where you qualified') + '</p>' +
        chips +
        (r.scopeCaveat ? '<p style="margin:10px 0 0;font-size:13.5px;color:#2F5E49">' + esc(r.scopeCaveat) + '</p>' : '') + '</div>';
    }).join('');
    var verdict = !anyPicked
      ? 'Choose your country below and we will mark it against these lists as you go.'
      : onAny
        ? 'Your answers put you on one of the lists above. Being on a list is never eligibility on its own \u2014 the regulator applies its full criteria either way \u2014 but it is the route to ask about by name rather than starting a full assessment by default.'
        : 'Your answers do not put you on these lists. That is not a barrier and it is not a lesser outcome: it means the standard assessment route, which is the one most applicants use. The standard is identical; the evidence is more detailed.';
    return '<div class="pw-follow"><div class="pw-followk">Country-specific routes for this profession</div>' +
      '<p class="pw-hint" style="margin:0 0 4px;font-size:14.5px">Some routes are open only to people from particular countries. Here are the ones that exist for your profession, so you can see where you stand rather than take our word for it.</p>' +
      body0 + body + '<p class="pw-hint" style="margin:18px 0 0;font-size:14.5px">' + esc(verdict) + '</p>' + caveat + '</div>';
  }

  function step4() {
    var a = st.answers;
    var regRows = [
      { id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' },
      { id: 'not-required', label: 'My country does not require professional registration' },
      { id: 'previous', label: 'Previously registered, but not currently' },
      /* No "I'm not sure" here either. A clinician knows whether they hold registration, and
         offering the option implies we think they might not. */
    ].map(function (o) {
      return '<button type="button" class="pw-opt' + sel(a.registered, o.id) + '" data-pick="registered" data-v="' + o.id + '"><span>' + esc(o.label) + '</span>' + tick() + '</button>';
    }).join('');
    var h = head(4, 'Are you registered to practise where you are now?') +
      '<p class="pw-sub">Several streamlined routes key off your current registration rather than off where you trained.</p>' +
      '<div class="pw-opts">' + regRows + '</div>';
    if (a.registered === 'yes') {
      h += '<div class="pw-follow"><div class="pw-f"><label for="pw-rc">Country of current registration</label>' + countrySelect('pw-rc', 'regCountry', a.regCountry) + '</div></div>';
    }
    h += '<div class="pw-q2">Have you already started registration in Australia or New Zealand?</div>' +
      '<div class="pw-opts row">' + optRow([['no', 'Not yet'], ['australia', 'Australia'], ['new-zealand', 'New Zealand'], ['both', 'Both'], ['already', 'I\u2019m already registered']], 'regProgress', a.regProgress) + '</div>';
    return h;
  }

  function step5() {
    var d = D() || {}, a = st.answers;
    var isDoc = (profOf() || {}).record === 'doctor';
    var isSpecQ = isDoc && (a.doctorStage === 'smo' || a.doctorSpecialist === 'yes');
    var h = head(5, 'How recently have you been practising?') +
      '<p class="pw-sub">Time out of practice can add a return-to-practice requirement, so it is worth being accurate.</p>' +
      '<div class="pw-opts row">' + optRow([['yes', 'I am practising now'], ['no', 'Not at the moment']], 'practising', a.practising) + '</div>';
    if (a.practising === 'no') {
      h += '<div class="pw-q2">When did you last practise?</div><div class="pw-opts row">' +
        optRow([['lt1', 'Less than a year ago'], ['1-2', '1\u20132 years ago'], ['3-5', '3\u20135 years ago'], ['5plus', 'More than 5 years ago']], 'lastPractised', a.lastPractised) + '</div>';
    }
    h += '<div class="pw-q2">Have you already demonstrated English-language competence for registration?</div>' +
      '<div class="pw-f" style="max-width:520px"><div class="pw-sel"><select id="pw-en" data-field="english" aria-label="English-language competence"><option value="">Select&hellip;</option>' + opts(d.englishOptions || [], a.english) + '</select>' + chev() + '</div>' +
      '<p class="pw-hint">If you trained in English in a recognised country, an exemption may apply instead of a test. Requirements vary by regulator and change, so we link you to the current standard rather than guessing.</p></div>';
    if (isDoc) {
      /* Career stage decides the SCOPE before any pathway question makes sense: a resident or
         registrar is a general-scope applicant, a consultant is a vocational one. Asking "are
         you a specialist?" got shrugs — people answer their job title reliably. */
      h += '<div class="pw-q2">Where are you in your career?</div><div class="pw-opts">' +
        optRow([['sho', 'Resident / SHO — postgraduate, not in specialty training'],
                ['registrar', 'Registrar / specialty trainee — in training, not yet completed'],
                ['smo', 'Consultant / SMO — completed specialist training']], 'doctorStage', a.doctorStage) + '</div>' +
        '<p class="pw-hint">The Council registers doctors in scopes, and this is what decides which one you are applying into.</p>';
    }
    if (isSpecQ) {
      h += '<div class="pw-q2">Do you hold a completed specialist qualification?</div><div class="pw-opts row">' +
        optRow([['yes', 'Yes'], ['no', 'No']], 'doctorSpecQual', a.doctorSpecQual) + '</div>';
    }
    if (odpBranch()) {
      h += '<div class="pw-follow"><div class="pw-followk">Because you trained in the UK</div>' +
        '<div class="pw-q2 flush">Do you have at least two years of relevant post-qualification anaesthetic or theatre experience?</div><div class="pw-opts row">' +
        optRow([['yes', 'Yes'], ['no', 'No']], 'odpExp', a.odpExp) + '</div>' +
        '<div class="pw-q2">Are you currently registered and in good standing?</div><div class="pw-opts row">' +
        optRow([['yes', 'Yes'], ['no', 'No']], 'odpStanding', a.odpStanding) + '</div></div>';
    }
    return h;
  }

  function tick() { return '<svg class="pw-tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'; }
  function optRow(list, key, cur) {
    return list.map(function (o) {
      return '<button type="button" class="pw-opt' + sel(cur, o[0]) + '" data-pick="' + key + '" data-v="' + esc(o[0]) + '"><span>' + esc(o[1]) + '</span>' + tick() + '</button>';
    }).join('');
  }

  function step6() {
    var set = profQuestionSet();
    return head(6, set && set.kicker ? set.kicker : 'A few things specific to your profession') +
      '<p class="pw-sub">These are the questions that actually change your answer — they are different for every profession, which is why they come last.</p>' +
      profQuestionsBlock();
  }
  function formHtml() {
    var step = st.step;
    var body = step === 1 ? step1() : step === 2 ? step2() : step === 3 ? step3() : step === 4 ? step4() : step === 5 ? step5() : step6();
    /* The message sits ABOVE the button row, at card width. It used to be a flex item in the
       nav row's narrow right-hand slot, sized for the old three-item truncated string; now
       that it lists everything outstanding it would wrap to six lines there and shove the
       primary action down the page. role="alert" still announces it from here. */
    var nav = (st.err ? '<p class="pw-err" role="alert">' + esc(st.err) + '</p>' : '') +
      '<div class="pw-nav">' +
      (step > 1 ? '<button type="button" class="pw-back" data-act="back">\u2190 Back</button>' : '<span></span>') +
      '<div class="pw-navr">' +
      '<button type="button" class="pw-next" data-act="next">' + (step === qsteps() ? 'See my starting point' : 'Continue') + ' \u2192</button>' +
      '</div></div>';
    return '<div class="pw-card">' + progressHead() +
      '<div class="pw-main">' + body + nav + '</div>' +
      (step === qsteps() ? '<p class="pw-priv">Your result first \u2014 no contact details needed.</p>' : '') + '</div>';
  }

  /* ---------------- result ---------------- */
  /* One country's briefing. Every value here comes from the data layer: no fee,
     timeframe or requirement is asserted that has not been verified against the
     regulator, which is why costs and timings link out rather than print a number. */
  function resultCard(r) {
    var many = results().length > 1;
    var out = [];

    if (many) out.push('<div class="pw-bhd"><span class="pw-bcc">' + esc(r.country) + '</span></div>');

    out.push('<section class="pw-bsec"><h3 class="pw-bk">Your regulator</h3>' +
      '<p class="pw-bfact">' + esc(r.regulator) + '</p>' +
      '<p class="pw-bnote">This is the regulator responsible for your profession in ' + esc(r.country) + '.</p></section>');

    out.push('<section class="pw-bsec"><h3 class="pw-bk">' + (r.notRecruited ? 'Where this leaves you' : 'Your registration pathway') + '</h3>' +
      '<p class="pw-bhead">' + esc(r.headline) + '</p>' +
      (r.statusLabel ? '<p class="pw-bmeta">' + esc(r.statusLabel) + '</p>' : '') + '</section>');

    var means = (r.why || []).concat(r.paras || []);
    if (means.length) {
      out.push('<section class="pw-bsec"><h3 class="pw-bk">What this means for you</h3>' +
        means.slice(0, 2).map(function (p) { return '<p class="pw-bp">' + esc(p) + '</p>'; }).join('') + '</section>');
    }

    if (r.steps && r.steps.length) {
      /* Steps arrive in two shapes: the steps() helper's {n,t} objects, and plain strings
         where a profession's real sequence was written out by hand. Normalise rather than
         forcing one \u2014 the hand-written ones are the accurate ones. */
      out.push('<section class="pw-bsec"><h3 class="pw-bk">Your route to registration</h3><ol class="pw-route">' +
        r.steps.map(function (s, i) {
          var n = typeof s === 'string' ? ('0' + (i + 1)).slice(-2) : s.n;
          var t = typeof s === 'string' ? s : s.t;
          return '<li><span class="pw-rn">' + esc(n) + '</span><span class="pw-rt">' + esc(t) + '</span></li>';
        }).join('') +
        '</ol></section>');
    }

    if (r.outlook) {
      out.push('<section class="pw-bsec"><h3 class="pw-bk">What depends on individual assessment</h3>' +
        '<p class="pw-bhead sm">' + esc(r.outlook.label) + '</p>' +
        (r.outlook.why ? '<p class="pw-bp">' + esc(r.outlook.why) + '</p>' : '') +
        (r.outlook.basis ? '<p class="pw-bbasis">' + esc(r.outlook.basis) + '</p>' : '') + '</section>');
    }

    /* Notes used to land in a single bucket headed "What you may also be asked for", which
       was true of about half of them: a note saying which pathway your answers point to is
       the ANSWER, not an extra ask, and one giving verified fees is neither. As the profession
       detail deepened, that one heading turned a good result page into a wall. Notes now carry
       an optional group and render under a heading that matches what they actually are;
       anything without a group keeps the original behaviour. */
    /* The detail is worth having and the wall of text is not. Only one group is the ANSWER —
       which route your answers point to — and it stays open. Requirements and the rest fold
       into disclosures: every word still there, none of it in the way. A reader who wants the
       short version gets four lines; a reader planning the move opens what applies to them. */
    var GROUPS = [
      { key: 'route', label: 'What your answers point to', open: true },
      { key: 'need', label: 'What you will need to provide' },
      { key: '', label: 'What you may also be asked for' }
    ];
    var noteHtml = function (n) {
      return '<div class="pw-may"><p class="pw-mayk">' + esc(n.title) + '</p><p class="pw-bp">' + noteText(n.body) + '</p>' +
        (n.hasLink ? '<a href="' + esc(n.href) + '" target="_blank" rel="noopener">' + esc(n.linkLabel) + ' \u2197</a>' : '') + '</div>';
    };
    var foldHtml = function (n) {
      return '<details class="pw-fold" style="border-top:1px solid rgba(2,97,93,.22)">' +
        '<summary style="cursor:pointer;padding:12px 0;font-family:var(--display,\'Work Sans\',sans-serif);font-weight:600;font-size:15.5px;color:#02615D;list-style:none;display:flex;justify-content:space-between;gap:16px;align-items:baseline">' +
        '<span>' + esc(n.title) + '</span><span aria-hidden="true" style="font-weight:400;color:#2F5E49">+</span></summary>' +
        '<p class="pw-bp" style="margin:0 0 12px">' + noteText(n.body) + '</p>' +
        (n.hasLink ? '<a href="' + esc(n.href) + '" target="_blank" rel="noopener" style="display:inline-block;margin-bottom:14px">' + esc(n.linkLabel) + ' \u2197</a>' : '') +
        '</details>';
    };
    var costNotes = (r.notes || []).filter(function (n) { return n.group === 'cost'; });
    if (r.notes && r.notes.length) {
      GROUPS.forEach(function (g) {
        var set = r.notes.filter(function (n) { return (n.group || '') === g.key; });
        if (!set.length) return;
        out.push('<section class="pw-bsec"><h3 class="pw-bk">' + esc(g.label) + '</h3>' +
          (g.open ? set.map(noteHtml).join('') : set.map(foldHtml).join('')) + '</section>');
      });
    }

    /* The country lists belong to the ANSWER, not the question. On the question step this was a
       verdict shown before the person had finished answering — it pre-empted their own input,
       made the step long, and repeated what the result already says. Here it earns its place:
       it shows the working behind the routes named above. */
    var crp = countryRoutesPanel();
    if (crp) out.push('<section class="pw-bsec"><h3 class="pw-bk">The lists behind this</h3>' + crp + '</section>');

    /* Where we HAVE verified a fee against the regulator's own page, print it. The blanket
       "we don't print unverified numbers" line stays for everywhere we have not — but it
       cannot sit on the same page as a verified figure, which is what it was doing. */
    out.push('<section class="pw-bsec"><h3 class="pw-bk">Fees and processing times</h3>' +
      (costNotes.length ? costNotes.map(function (n) { return '<p class="pw-bp">' + noteText(n.body) + '</p>'; }).join('')
        : '<p class="pw-bp">We don\u2019t print a fee or a processing time we haven\u2019t verified against the regulator\u2019s current schedule — they change, and a stale number is worse than none. Both are published on the official page below.</p>') +
      '</section>');

    /* What the registry knows about the records behind THIS result. A stale pathway is the
       one failure mode that costs a candidate money, so it is stated on the result itself
       rather than left to an internal audit page nobody outside Ethicare reads. */
    var prov = '';
    var REG = window.ETHICARE_REGISTRY;
    if (REG && r.recordKey) {
      var worst = REG.worstFor(r.recordKey, r.cc);
      var say = {
        overdue: 'Our record of this pathway is past its review date, or could not be confirmed at source last time we looked. Treat it as a starting point and check the regulator\u2019s own page before you act on it.',
        changing: 'A change to this pathway has been announced or is out for consultation. What the regulator publishes today may not be what applies when you apply \u2014 check the official page below.',
        retired: 'This pathway has been superseded. Go straight to the regulator.',
        due: 'This record is due for its next review shortly. It was accurate when last checked against the regulator\u2019s own page.'
      }[worst];
      if (say && worst !== 'due') prov = '<p class="pw-prov ' + esc(worst) + '">' + say + '</p>';
    }

    var official = r.officialUrl || (r.lead.concat(r.rest).filter(function (b) { return b.external; })[0] || {}).href || '';
    out.push('<section class="pw-bsec pw-official"><h3 class="pw-bk">Check it with the regulator</h3>' +
      '<p class="pw-bfact sm">' + esc(r.regulator) + '</p>' +
      (official ? '<a class="pw-offlink" href="' + esc(official) + '" target="_blank" rel="noopener">Official registration guidance \u2197</a>' : '') +
      '<p class="pw-bnote">Ethicare helps you understand the process. Your regulator makes the final assessment and registration decision.</p>' +
      '<p class="pw-checked">' + esc(r.lastChecked) + '</p>' + prov + '</section>');

    if (r.rest && r.rest.length) {
      out.push('<div class="pw-btns end">' + r.rest.map(btnLink).join('') + '</div>');
    }
    return '<article class="pw-brief">' + out.join('') + '</article>';
  }

  /* Registration is the first decision, not the last one. The result used to end at the
     regulator's door; this routes on to the three things people ask next — what could I
     do, can we afford it, and what happens to the rest of our life. */
  function onwardBlock(res) {
    if (!res || !res.length) return '';
    var served = res.filter(function (r) { return !r.notRecruited && r.jobsHref; });
    var links = [];
    if (served.length) {
      links.push({ href: served[0].jobsHref, k: 'Roles', t: 'See the roles we are recruiting', n: 'What is actually open for your profession right now, and where.' });
    } else {
      links.push({ href: '/jobs/professions', k: 'Roles', t: 'The professions we recruit', n: 'We do not place every profession. This is the list, honestly.' });
    }
    links.push({ href: '/cost-calculator', k: 'Money', t: 'Could we afford the move?', n: 'Set-up costs, the flights, the first months\u2019 rent \u2014 before you commit to anything.' });
    var au = res.some(function (r) { return r.cc === 'au'; }), nz = res.some(function (r) { return r.cc === 'nz'; });
    var plan = (au && !nz) ? { href: '/guides/moving-to-australia', t: 'Plan the move to Australia' }
      : (nz && !au) ? { href: '/guides/moving-to-new-zealand', t: 'Plan the move to New Zealand' }
      : { href: '/resources', t: 'Plan the whole move' };
    links.push({ href: plan.href, k: 'The move', t: plan.t, n: 'Visas, shipping, schools, banking and the order to do them in.' });
    return '<section class="pw-next"><h3>Where next</h3><div class="pw-nextgrid">' +
      links.map(function (l) {
        return '<a class="pw-nextc" href="' + esc(l.href) + '"><span class="k">' + esc(l.k) + '</span>' +
          '<span class="t">' + esc(l.t) + '</span><span class="n">' + esc(l.n) + '</span>' +
          '<span class="go" aria-hidden="true">\u2192</span></a>';
      }).join('') + '</div></section>';
  }

  /* Render one presented button (label/href/cls/arrow/external) as an anchor.
     Used by the brief's closing button row. */
  function btnLink(b) {
    if (!b || !b.href) return '';
    return '<a class="' + esc(b.cls || 'pw-b2') + '" href="' + esc(b.href) + '"' +
      (b.external ? ' target="_blank" rel="noopener"' : '') + '>' +
      esc(b.label) + ' ' + (b.arrow || '\u2192') + '</a>';
  }

  /* Two destinations: a genuine comparison first, then each briefing in full. */
  function compareBlock(res) {
    if (res.length < 2) return '';
    var rows = [
      { k: 'Regulator', v: function (r) { return r.regulator; } },
      { k: 'Your pathway', v: function (r) { return r.headline; } },
      { k: 'Assessment expectation', v: function (r) { return r.notRecruited ? 'Not a profession we recruit' : (r.outlook ? r.outlook.label : 'Individually assessed'); } },
      { k: 'Information checked', v: function (r) { return String(r.lastChecked).replace('Registration information last checked: ', ''); } }
    ];
    var cols = res.map(function (r) { return '<div class="pw-ccol"><h4>' + esc(r.country) + '</h4>' +
      rows.map(function (row) { return '<div class="pw-crow"><span class="pw-ck">' + esc(row.k) + '</span><span class="pw-cv">' + esc(row.v(r)) + '</span></div>'; }).join('') +
      ((r.officialUrl) ? '<a class="pw-offlink sm" href="' + esc(r.officialUrl) + '" target="_blank" rel="noopener">Official source \u2197</a>' : '') +
      '</div>'; }).join('');
    var stands = '';
    var t0 = res[0].outlook && res[0].outlook.tier, t1 = res[1].outlook && res[1].outlook.tier;
    var rank = { strong: 0, assessed: 1, exam: 2 };
    if (t0 && t1 && rank[t0] !== rank[t1]) {
      var easier = rank[t0] < rank[t1] ? res[0] : res[1], harder = rank[t0] < rank[t1] ? res[1] : res[0];
      stands = '<div class="pw-stands"><h4>What stands out</h4><p>On what you have told us, the ' + esc(easier.country) +
        ' route looks the more straightforward of the two, while ' + esc(harder.country) +
        ' is more likely to involve a further assessment stage. That does not make it the better move \u2014 pay, the roles actually open, where you would live and what you want outside work all matter more than which registration is quicker.</p></div>';
    } else if (t0 && t1) {
      stands = '<div class="pw-stands"><h4>What stands out</h4><p>Both routes look broadly comparable at this stage, so registration is unlikely to be the thing that decides between them. Pay, available roles and where you would want to live are the more useful comparison.</p></div>';
    }
    return '<div class="pw-compare"><h3 class="pw-comph">How your pathways compare</h3><div class="pw-cgrid">' + cols + '</div>' + stands + '</div>';
  }

  /* Every result is "no roles in this profession": still ask for nothing (Brief §10 — never
     let someone hand over details and only then find out we have no job for them), but do NOT
     send them away. This is a recruitment AND relocation tool: the visa, the money, the
     schools, the suburbs and what a week actually costs are identical questions whatever
     profession you hold. The previous copy said "we are not the right people for this
     particular move", which gave away the half of the product that does still apply. */
  function outsidePanel() {
    var d = D() || {};
    var reg = (d.notRecruited && d.notRecruited.regulatorsPage) || '/resources/healthcare-regulators';
    return '<div class="pw-lead" id="pw-lead-panel">' +
      '<h3>What we can still help with</h3>' +
      '<p class="pw-leadp">There is no role for us to put in front of you, so we are not going to ask for your details. But registration is only one half of this move. The visa, the money, the schools, where to actually live and what a week there really costs are the same questions whatever your profession \u2014 and every bit of that is free to read here, with no account and nothing sent to us. Your regulator is the authority on the registration itself; the rest of it we can genuinely help you think through.</p>' +
      '<div class="pw-leadbtns">' +
      '<a class="pw-b1" href="/resources">Guides for the whole move \u2192</a>' +
      '<a class="pw-b2" href="' + esc(reg) + '">All official regulators \u2192</a>' +
      '<a class="pw-b2" href="/jobs/professions">The professions we do recruit \u2192</a>' +
      '</div></div>';
  }

  function leadPanel(res) {
    var d = D() || {}, l = st.lead;
    if (st.leadDone) {
      return '<div class="pw-done"><span class="pw-donei"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg></span>' +
        '<div><h3>Thanks, ' + esc((l.name.trim().split(/\s+/)[0]) || 'there') + ' — we\u2019ve got it</h3>' +
        '<p>' + (st.emailMe ? 'Your starting point is on its way to you, and ' : 'Someone from the team will be in touch shortly. In the meantime, your starting point above links straight to the official regulator — and ') + 'our <a href="/guides/australia-registration">Australia</a> and <a href="/guides/new-zealand-registration">New Zealand</a> registration guides walk the whole journey.</p></div></div>';
    }
    var chips = (d.priorities || []).map(function (p) {
      return '<button type="button" class="pw-chip' + (l.priorities.indexOf(p) >= 0 ? ' is-sel' : '') + '" data-act="priority" data-v="' + esc(p) + '">' + esc(p) + '</button>';
    }).join('');
    var party = (d.party || []).map(function (p) {
      return '<button type="button" class="pw-pick wide' + (l.party === p ? ' is-sel' : '') + '" data-act="party" data-v="' + esc(p) + '">' + esc(p) + '</button>';
    }).join('');
    var served = (res || []).filter(function (r) { return !r.notRecruited; }).map(function (r) { return r.country; });
    var where = (!served.length || served.length === (res || []).length) ? 'Australia or New Zealand' : served.join(' and ');
    return '<div class="pw-lead" id="pw-lead-panel">' +
      '<h3>' + (st.emailMe ? 'Email my starting point to me' : 'Want help with the next step?') + '</h3>' +
      '<p class="pw-leadp">' + (st.emailMe
        ? 'Add your name and email and we\u2019ll send this starting point to you — worth keeping, and worth showing whoever is moving with you. The Ethicare team sees the same summary, so we can help with the next step if you want us to.'
        : 'If you\u2019d like, tell us a little more about your plans and the Ethicare team can contact you about suitable opportunities in ' + esc(where) + '. No pressure — the result above is yours either way.') + '</p>' +
      '<div class="pw-fields">' +
        '<div class="pw-f"><label for="pw-ln">First name' + req() + '</label><input id="pw-ln" data-lead="name" value="' + esc(l.name) + '" autocomplete="given-name"></div>' +
        '<div class="pw-f"><label for="pw-le">Email' + req() + '</label><input id="pw-le" type="email" data-lead="email" value="' + esc(l.email) + '" autocomplete="email"></div>' +
        '<div class="pw-f"><label for="pw-lp">WhatsApp / mobile' + optn() + '</label><input id="pw-lp" type="tel" inputmode="tel" data-lead="phone" value="' + esc(l.phone) + '" autocomplete="tel"></div>' +
        '<div class="pw-f"><label for="pw-lc">Current country</label><div class="pw-sel"><select id="pw-lc" data-lead="country"><option value="">Select&hellip;</option>' + opts(d.countriesTop || [], l.country) + '<option value="" disabled>──────────</option>' + opts(d.countriesAll || [], l.country) + '</select>' + chev() + '</div></div>' +
        '<div class="pw-f"><label for="pw-ld">Preferred destination</label><div class="pw-sel"><select id="pw-ld" data-lead="dest"><option value="">Select&hellip;</option>' + opts(['Australia', 'New Zealand', 'Either', 'Not sure yet'], l.dest) + '</select>' + chev() + '</div></div>' +
        '<div class="pw-f"><label for="pw-lt">Expected move timeframe</label><div class="pw-sel"><select id="pw-lt" data-lead="timeframe"><option value="">Select&hellip;</option>' + opts(d.timeframes || [], l.timeframe) + '</select>' + chev() + '</div></div>' +
      '</div>' +
      '<div class="pw-q">What matters most about your move? <span class="pw-opt-note">(choose up to three)</span></div><div class="pw-row wrap">' + chips + '</div>' +
      '<div class="pw-q">Who would be moving with you?</div><div class="pw-row wrap">' + party + '</div>' +
      '<button type="button" class="pw-consent' + (l.consent ? ' is-sel' : '') + '" data-act="consent"><i>' + (l.consent ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>' : '') + '</i>' +
      '<span>I\u2019d like Ethicare to contact me about relevant opportunities. See our <a href="/privacy-policy">privacy policy</a>.' + (st.emailMe ? ' <em>Optional — we\u2019ll email your starting point either way.</em>' : '') + '</span></button>' +
      '<div class="pw-leadbtns"><button type="button" class="pw-b1" data-act="submit">' + (st.emailMe ? 'Send me my starting point' : 'Send to the Ethicare team') + '</button>' +
      '<a class="pw-b2" href="/apply">Register fully &amp; send your CV \u2192</a>' +
      (st.leadErr ? '<span class="pw-err" role="alert">' + esc(st.leadErr) + '</span>' : '') + '</div></div>';
  }

  var CONFIRM = {
    'Medical Council of New Zealand': {
      url: 'https://www.mcnz.org.nz/registration/getting-registered/tool/',
      label: 'Open the Council\u2019s self-assessment tool',
      body: 'The Medical Council publishes its own registration self-assessment tool, and it is the authority on which pathway you qualify for. This page tells you what the route is called and what to expect of it \u2014 which is what takes ten minutes off the front of that conversation. Do both, in this order.'
    },
    'Nursing Council of New Zealand': {
      url: 'https://www.nursingcouncil.org.nz/IQN/',
      label: 'Open the Council\u2019s self-assessment tool',
      body: 'The Nursing Council publishes its own self-assessment tool, and it answers the question that decides both your cost and your timeline \u2014 whether you personally need the competence assessment. This page tells you what that assessment involves; only the Council can tell you whether it applies to you.'
    }
  };
  function confirmBlock(res) {
    var seen = {}, out = [];
    res.forEach(function (r) {
      var c = CONFIRM[r.regulator];
      if (!c || seen[r.regulator]) return;
      seen[r.regulator] = 1;
      out.push('<div class="pw-confirm"><div class="pw-confirmk">Confirm this with the regulator</div>' +
        '<p class="pw-confirmb">' + c.body + '</p>' +
        '<a class="pw-cb" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.label) +
        '<span aria-hidden="true"> \u2192</span></a></div>');
    });
    return out.join('');
  }
  function resultHtml() {
    var res = results();
    var prof = profOf(), a = st.answers;
    var bits = [];
    if (prof && prof.id !== 'other') bits.push(prof.label);
    if (a.qualCountry) bits.push('trained in ' + theCountry(a.qualCountry).replace(/^The /, 'the '));
    if (a.recentCountry && a.recentCountry !== a.qualCountry) bits.push('practising most recently in ' + theCountry(a.recentCountry).replace(/^The /, 'the '));
    if (a.registered === 'yes' && a.regCountry) bits.push('registered in ' + theCountry(a.regCountry).replace(/^The /, 'the '));
    var title = prof && prof.id === 'other' ? 'Where to start' : 'Your starting point';
    var allOutside = !!res.length && res.every(function (r) { return r.notRecruited; });
    return '<div class="pw-card solo">' +
      '<div class="pw-resulth"><div><span class="eyebrow">Registration pathway checker</span><h2>' + esc(title) + '</h2>' +
      '<p class="pw-rsum">' + esc(bits.length ? 'Based on what you told us: ' + bits.join(' \u00b7 ') : 'Based on what you told us') + '</p></div>' +
      '<div class="pw-resacts"><button type="button" class="pw-b2" data-act="back">Change my answers</button>' +
      '<button type="button" class="pw-b2" data-act="print">Print or save as PDF</button>' +
      (st.leadDone || allOutside ? '' : '<button type="button" class="pw-b2" data-act="emailme">Email this to me</button>') +
      '<button type="button" class="pw-b3" data-act="restart">Start again</button></div></div>' +
      confirmBlock(res) +
      compareBlock(res) +
      '<div class="pw-briefs">' + res.map(resultCard).join('') + '</div>' +
      onwardBlock(res) +
      '<p class="pw-disc">General guidance, not a registration assessment and not immigration advice. Everything here is taken from the regulator’s own published guidance on the date shown, but requirements change without notice and only the regulator can decide your application. <strong>Ethicare accepts no responsibility for decisions taken on the strength of this page — check the official source before you apply, pay a fee or resign a post.</strong></p>' +
      (allOutside ? outsidePanel() : leadPanel(res)) + '</div>';
  }

  /* ---------------- lead form plumbing ---------------- */
  function readLead() {
    ['name', 'email', 'phone', 'country', 'dest', 'timeframe'].forEach(function (k) {
      var el = app.querySelector('[data-lead="' + k + '"]');
      if (el) st.lead[k] = el.value;
    });
  }
  function submitLead() {
    readLead();
    var l = st.lead;
    if (!l.name.trim() || !/.+@.+\..+/.test(l.email)) { st.leadErr = 'A first name and a valid email are needed.'; render(); return; }
    // marketing consent is never the price of getting your own result — only the
    // "contact me about opportunities" route requires the tick
    if (!st.emailMe && !l.consent) { st.leadErr = 'Please tick the consent box so we\u2019re allowed to contact you.'; render(); return; }
    var form = document.getElementById('pw-netlify-form');
    if (!form) { st.leadDone = true; st.leadErr = ''; render(); return; }
    var res = results().map(function (r) { return r.country + ': ' + r.statusLabel + ' — ' + r.regulator + (r.outlook ? ' — outlook: ' + r.outlook.label : ''); }).join(' | ');
    var payload = assign({}, st.answers, {
      name: l.name, email: l.email, phone: l.phone, country: l.country, dest: l.dest,
      timeframe: l.timeframe, priorities: l.priorities.join(', '), party: l.party,
      consent: l.consent ? 'yes' : 'no', result_summary: res,
      email_copy: st.emailMe ? 'yes — candidate asked for their starting point by email' : 'no'
    });
    Object.keys(payload).forEach(function (k) {
      var el = form.elements[k];
      if (el) el.value = payload[k];
    });
    try { localStorage.setItem(SENT, '1'); } catch (e) {}
    HTMLFormElement.prototype.submit.call(form);
  }

  /* ---------------- events ---------------- */
  app.addEventListener('click', function (e) {
    var p = e.target.closest('[data-pick]');
    if (p) { setA(p.getAttribute('data-pick'), p.getAttribute('data-v')); return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'next') {
      var m = missing();
      if (m.length) {
        st.err = (m.length === 1 ? 'One thing still to answer: ' : 'Still to answer: ') + phrase(m) + '.';
        st.errKeys = missingKeys();
        moveFocus = 'error';
        render();
        return;
      }
      st.errKeys = [];
      if (st.step === 1 && st.answers.profession === 'other') { goResult(); return; }
      if (st.step === qsteps()) { goResult(); return; }
      /* "Started" is the first advance off step 1, not a page view: opening the checker and
         leaving is not a use of it, and counting it would flatter the completion rate. */
      if (st.step === 1 && window.track) window.track('pathway_started', { profession: st.answers.profession, country: st.answers.destination });
      st.step++; st.err = ''; st.errKeys = []; moveFocus = true; save(); render();
    } else if (act === 'back') {
      st.step = Math.max(1, st.step === RESULT && st.answers.profession === 'other' ? 1 : st.step - 1);
      st.err = ''; st.errKeys = []; moveFocus = true; save(); render();
    } else if (act === 'print') {
      window.print();
    } else if (act === 'emailme') {
      readLead(); st.emailMe = true; moveFocus = true; render();
    } else if (act === 'restart') {
      try { localStorage.removeItem(LSK); localStorage.removeItem(SENT); } catch (er) {}
      st = { step: 1, answers: assign({}, A0), err: '', errKeys: [], lead: assign({}, L0), leadErr: '', leadDone: false, emailMe: false };
      moveFocus = true;
      render();
    } else if (act === 'priority') {
      readLead();
      var v = b.getAttribute('data-v'), i = st.lead.priorities.indexOf(v);
      if (i >= 0) st.lead.priorities.splice(i, 1); else if (st.lead.priorities.length < 3) st.lead.priorities.push(v);
      render();
    } else if (act === 'party') {
      readLead();
      var pv = b.getAttribute('data-v');
      st.lead.party = st.lead.party === pv ? '' : pv;
      render();
    } else if (act === 'consent') {
      readLead(); st.lead.consent = !st.lead.consent; st.leadErr = ''; render();
    } else if (act === 'submit') {
      submitLead();
    }
  });
  app.addEventListener('change', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-field');
    if (f) { setA(f, e.target.value); return; }
    var l = e.target.getAttribute && e.target.getAttribute('data-lead');
    if (l) st.lead[l] = e.target.value;
  });

  function goResult() {
    var map = { australia: 'Australia', 'new-zealand': 'New Zealand', both: 'Either', unsure: 'Not sure yet' };
    if (window.track) window.track('pathway_completed', {
      profession: st.answers.profession, country: st.answers.destination, reg_progress: st.answers.regProgress
    });
    st.step = RESULT; st.err = '';
    st.lead.dest = st.lead.dest || map[st.answers.destination] || '';
    moveFocus = true;
    save(); render();
  }

  /* One render path. On a step change (never on a keystroke) focus moves to the new
     step's heading so keyboard and screen-reader users are not left where the old
     panel used to be; the heading is also the live-region announcement. */
  function focusEl(el) {
    if (!el) return;
    if (!el.hasAttribute('tabindex') && 'BUTTON INPUT SELECT A'.indexOf(el.tagName) === -1) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }
  /* Focus moves with preventScroll so the browser cannot jump somewhere arbitrary — which
     leaves US responsible for the viewport. Steps are different heights (step 5 with a
     profession block is roughly twice step 2), so without this a Continue from a long step
     lands you halfway down the next one, or past it entirely. Scroll to the top of the panel,
     under the sticky header, and only when we are not already there. Never scrollIntoView:
     it moves the nearest scrollable ancestor too and can drag the whole page sideways. */
  function headerGap() {
    var h = document.querySelector('.site-header');
    if (!h) return 16;
    var pos = getComputedStyle(h).position;
    return (pos === 'sticky' || pos === 'fixed') ? h.getBoundingClientRect().height + 18 : 16;
  }
  function bringIntoView(el) {
    if (!el) return;
    var top = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - headerGap());
    if (Math.abs(window.pageYOffset - top) < 24) return;   // already in place; don't jitter
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' }); }
    catch (e) { window.scrollTo(0, top); }
  }
  function render() {
    app.innerHTML = st.step === RESULT ? resultHtml() : formHtml();

    /* Flag every question still unanswered — but filter the remembered list through the LIVE
       one first. Without this the marker outlives the problem: answering the question
       re-renders, and the stale key re-applied the clay rule to a question that was now fine.
       An error that does not clear on correction is worse than the banner it replaced. */
    var stillMissing = st.step === RESULT ? [] : missingKeys();
    st.errKeys = (st.errKeys || []).filter(function (k) { return stillMissing.indexOf(k) > -1; });
    if (!st.errKeys.length) st.err = '';
    var firstBad = null;
    st.errKeys.forEach(function (k) {
      // the form answers through TWO attributes: buttons use data-pick, selects use
      // data-field. Missing data-field meant step 3 (all selects) was never marked at all.
      var ctl = app.querySelector('[data-pick="' + k + '"], [data-field="' + k + '"]');
      var grp = ctl && ctl.closest ? (ctl.closest('.pw-opts') || ctl.closest('.pw-grid') || ctl.closest('.pw-f') || ctl.parentNode) : null;
      if (grp && grp.setAttribute) {
        grp.setAttribute('data-unanswered', '1');
        if (!firstBad) firstBad = ctl;
      }
    });

    if (!moveFocus) return;
    var mode = moveFocus;
    moveFocus = false;
    // on a failed Continue, land on the question that is missing rather than the step heading
    if (mode === 'error' && firstBad) {
      focusEl(firstBad);
      bringIntoView(firstBad.closest('.pw-follow') || firstBad.closest('.pw-f') || firstBad);
      return;
    }
    focusEl(app.querySelector('.pw-main h3, .pw-ask, .pw-resulth h2'));
    bringIntoView(app);
  }

  /* ---------------- boot ---------------- */
  var draftFresh = false;
  try {
    var raw = localStorage.getItem(LSK);
    if (raw) {
      var dr = JSON.parse(raw);
      var fresh = dr && (!dr.ts || Date.now() - dr.ts < DRAFT_MAX_AGE);
      if (dr && dr.answers && fresh) {
        // only keys the current form defines — drops answers from retired fields
        var keep = {};
        Object.keys(A0).forEach(function (k) { if (typeof dr.answers[k] === 'string') keep[k] = dr.answers[k]; });
        st.answers = assign({}, A0, keep);
        // never restore straight into a result — regulator data may have changed since;
        // the answers come back, the verdict is recomputed on the next Continue
        /* Restore the ANSWERS but not the position. Arriving from a link and landing on step 5
           mid-form is disorienting — you cannot see what you already told us and it reads as a
           broken page. Starting at step 1 with everything prefilled costs a few clicks and shows
           the person their own answers on the way through. */
        st.step = 1;
        draftFresh = true;
      } else if (!fresh) { localStorage.removeItem(LSK); localStorage.removeItem(SENT); }
    }
  } catch (e) {}
  try {
    var q = (location.search.match(/[?&]profession=([^&]+)/) || [])[1];
    if (q) {
      var id = decodeURIComponent(q), d0 = D();
      if (d0 && d0.professions.some(function (p) { return p.id === id; })) { st.answers.profession = id; st.step = id === 'other' ? 1 : 2; }
    }
    var qd = (location.search.match(/[?&]destination=([^&]+)/) || [])[1];
    if (qd) {
      var dst = decodeURIComponent(qd);
      if (['australia', 'new-zealand', 'both', 'unsure'].indexOf(dst) >= 0 && st.answers.profession) { st.answers.destination = dst; st.step = 3; }
    }
  } catch (e) {}
  try {
    if (/[?&]submitted=1/.test(location.search) || (localStorage.getItem(SENT) === '1' && draftFresh)) { st.leadDone = true; if (st.step !== RESULT) st.step = RESULT; }
  } catch (e) {}

  if (!D()) {
    var t = setInterval(function () { if (D()) { clearInterval(t); render(); } }, 120);
    setTimeout(function () { clearInterval(t); }, 8000);
  }
  render();
})();
