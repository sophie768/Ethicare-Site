/* ================================================================
   ETHICARE RESOURCING — Cost of moving calculator (/cost-calculator)
   Vanilla controller. Every fee, tenancy rule, airfare and planning
   estimate lives in relocation-cost-data.js — never in here.
   Answers save to localStorage. ?destination=au|nz and ?profession={id}
   preselect. Print styles turn the estimate into the document.
   ================================================================ */
(function () {
  'use strict';

  var app = document.getElementById('cc-app');
  if (!app) return;

  var LSK = 'ethicare_cost_calculator_v1';
  var MAX_AGE = 90 * 24 * 60 * 60 * 1000;   // an estimate older than a quarter is stale — fees move
  var S0 = {
    stage: 1, dest: 'au', region: 'QLD', origin: 'uk', who: 'me', followPartner: true,
    kidsSchool: 0, kidsPre: 0, profession: 'imaging', examChoice: null, temp: 'no', tempWeeks: 2,
    furnish: 'unfurnished', transport: 'public', shipping: 'excess',
    employer: 'unsure', employerHow: 'unknown', covers: {}, currency: 'dest', overrides: {}
  };
  var st = assign({}, S0);
  var moveFocus = false;   // set on stage changes only — never while someone is typing

  var STAGES = [
    { n: 1, short: 'Your move', label: 'Your move' },
    { n: 2, short: 'Before you leave', label: 'Before you leave' },
    { n: 3, short: 'Getting established', label: 'Getting established' },
    { n: 4, short: 'Your support', label: 'Your support' },
    { n: 5, short: 'Your estimate', label: 'Your estimated moving budget' }
  ];
  var TAGS = {
    official: { label: 'Official fee', css: 't-official' },
    calculated: { label: 'Calculated', css: 't-calc' },
    estimate: { label: 'Planning estimate', css: 't-est' },
    yours: { label: 'Your figure', css: 't-yours' }
  };

  /* ---------------- helpers ---------------- */
  function assign(t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; } return t; }
  function D() { return window.ETHICARE_COSTS || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; }
  function fmt(n) { return '$' + Math.round(n).toLocaleString('en-AU'); }
  function isAU() { return st.dest === 'au'; }
  function cc() { return isAU() ? 'au' : 'nz'; }
  function code() { return D().currency.code[st.dest]; }
  function save() { try { var o = assign({}, st); delete o.seeded; localStorage.setItem(LSK, JSON.stringify({ st: o, ts: Date.now() })); } catch (e) {} summary(); }
  /* A compact read-only summary for My Move's money line (my-move reads SUMMARY_KEY, never LSK).
     Written only once the estimate has been reached, so a half-answered stage 1 never shows as a budget. */
  var SUMMARY_KEY = 'ethicare_cost_summary_v1';
  function summary() {
    try {
      if (!D() || st.stage < 5) return;
      var t = totals();
      localStorage.setItem(SUMMARY_KEY, JSON.stringify({
        grand: Math.round(t.grand), costToYou: Math.round(t.costToYou), contribution: Math.round(t.contribution),
        upfront: Math.round(t.upfront), showUpfront: t.showUpfront, employer: st.employer,
        currency: code(), dest: st.dest, region: regionLabel(), ts: Date.now()
      }));
    } catch (e) {}
  }
  function set(patch) { assign(st, patch); save(); render(); }
  function setOverride(id, value) {
    var next = assign({}, st.overrides);
    if (value === undefined || value === '') delete next[id]; else next[id] = value;
    st.overrides = next; save();
  }
  function ov(id) { var v = st.overrides[id]; return (v === undefined || v === '') ? null : v; }
  function ten() { var d = D(); return isAU() ? (d.tenancy[st.region] || d.tenancy.AUNS) : d.tenancyNZ; }
  function rent() { var v = ov('rent'); return v === null ? (D().rentWeekly[st.region] || 600) : num(v); }
  function tempWeekly() { var v = ov('tempWeekly'); return v === null ? (D().tempWeekly[st.region] || 1200) : num(v); }
  function regionLabel() {
    var list = D().regions[st.dest];
    for (var i = 0; i < list.length; i++) if (list[i].value === st.region) return list[i].label;
    return '';
  }

  /* Whether an exam applies is the single biggest swing in a registration budget, so we
     ask rather than assume — but we seed a sensible default from profession and origin.
     Nurses and midwives from a comparable jurisdiction are usually exempt; the Australian
     medical radiation exam applies to almost every overseas applicant. */
  function examDefault() {
    var p = st.profession, comparable = st.origin === 'uk' || st.origin === 'ie';
    if (isAU()) {
      if (p === 'imaging' || p === 'radtherapy') return 'yes';
      if (p === 'nursing' || p === 'midwifery') return comparable ? 'no' : 'yes';
      if (p === 'medicine') return comparable ? 'no' : 'unsure';
      return 'no';
    }
    /* New Zealand authorities decide competence assessment case by case. */
    if (p === 'nursing' || p === 'midwifery' || p === 'imaging' || p === 'sonography') return comparable ? 'no' : 'unsure';
    return 'no';
  }
  function examEff() { return st.examChoice || examDefault(); }

  function household() {
    var kidsSchool = num(st.kidsSchool), kidsPre = num(st.kidsPre), kids = kidsSchool + kidsPre;
    var first = st.who === 'first';
    var hasPartner = st.who === 'partner' || st.who === 'family' || (first && st.followPartner);
    return {
      kids: kids, kidsSchool: kidsSchool, kidsPre: kidsPre, first: first, hasPartner: hasPartner,
      adults: first ? 1 : (hasPartner ? 2 : 1),
      initialKids: first ? 0 : kids,
      laterAdults: (first && st.followPartner) ? 1 : 0,
      laterKids: first ? kids : 0
    };
  }

  /* ---------------- a cost row ---------------- */
  function row(o) {
    var edited = ov(o.id) !== null;
    var amount = edited ? num(ov(o.id)) : Math.max(0, Math.round(o.amount || 0));
    var lid = o.id + '_later';
    var lEdited = ov(lid) !== null;
    var later = o.later == null ? null : (lEdited ? num(ov(lid)) : Math.max(0, Math.round(o.later)));
    var tag = edited ? 'yours' : (o.tag || 'estimate');
    return {
      id: o.id, label: o.label, note: o.note || '', tag: tag,
      value: edited ? String(ov(o.id)) : String(Math.round(o.amount || 0)),
      laterValue: later == null ? '' : (lEdited ? String(ov(lid)) : String(Math.round(o.later))),
      edited: edited, hasLater: o.later != null,
      href: o.href || '', hrefLabel: o.hrefLabel || 'Official source',
      amount: amount, later: later || 0,
      total: amount + (later || 0),
      category: o.category || null
    };
  }

  function rowsLeave() {
    var d = D(), h = household(), c = cc();
    var visa = d.visa[c];
    var reg = d.registration[c][st.profession] || d.registration[c].other;
    var flight = (d.flights[st.origin] || d.flights.other)[c];
    var med = d.documents.medicals[c], medChild = d.documents.medicalsChild[c];
    var out = [];

    out.push(row({
      id: 'registration', label: 'Professional registration', tag: reg.tag || 'estimate', category: 'registration',
      note: reg.breakdown + ' Getting registered only — any examination is shown separately below.',
      amount: reg.fee, href: reg.href, hrefLabel: 'Fees published by ' + reg.body
    }));

    var eff = examEff();
    if (eff !== 'no') {
      out.push(row({
        id: 'exam', label: 'Examination and clinical assessment', tag: reg.exam ? (reg.examTag || 'estimate') : 'yours', category: 'exam',
        note: (eff === 'unsure' ? 'You are not sure yet, so we have shown this rather than leave it out. ' : '')
          + (reg.exam ? reg.examNote : (reg.examUnknownNote || d.registration.exam.unknownNote)),
        amount: reg.exam || 0, href: reg.href, hrefLabel: 'Pathway and fees from ' + reg.body
      }));
    }

    out.push(row({
      id: 'visa', label: 'Government visa charges', tag: 'official', category: 'visa',
      note: visa.name + '. ' + visa.effective + ' ' + visa.note,
      amount: isAU() ? visa.primary + ((h.hasPartner && !h.first) ? visa.adult : 0) + h.initialKids * visa.child : visa.primary,
      later: h.first ? (isAU() ? h.laterAdults * visa.adult + h.laterKids * visa.child : 0) : null,
      href: visa.href, hrefLabel: visa.source
    }));

    out.push(row({
      id: 'adviser', label: 'Immigration adviser (optional)', tag: 'yours',
      note: 'Only if you choose to use one. Many people apply without an adviser \u2014 this is never a compulsory cost.',
      amount: 0
    }));

    out.push(row({
      id: 'medicals', label: 'Medical and health examinations', tag: 'estimate',
      note: 'Per person included in the visa application, through a panel physician. Chest X-rays are usually part of the quoted price.',
      amount: med * h.adults + medChild * h.initialKids,
      later: h.first ? med * h.laterAdults + medChild * h.laterKids : null
    }));

    out.push(row({
      id: 'police', label: 'Police certificates', tag: 'estimate',
      note: 'One per adult, for every country you have lived in for 12 months or more in the last ten years. Add more if that applies to you.',
      amount: d.documents.police * h.adults,
      later: h.first ? d.documents.police * h.laterAdults : null
    }));

    out.push(row({
      id: 'certification', label: 'Document certification and verification', tag: 'estimate',
      note: 'Certified copies, translations and courier costs for qualifications, references and identity documents.',
      amount: d.documents.certification
    }));

    out.push(row({
      id: 'english', label: 'English language test', tag: 'yours',
      note: 'Only if you still need to sit one. Around ' + fmt(d.documents.english) + ' covers a typical IELTS or OET sitting \u2014 leave it at zero if you are exempt.',
      amount: 0
    }));

    out.push(row({
      id: 'flights', label: 'Flights', tag: 'estimate', category: 'flights',
      note: 'One-way indicative fares from ' + (d.flights[st.origin] || d.flights.other).label + '. A real quote will always beat our figure \u2014 replace it as soon as you have one.',
      amount: flight.adult * h.adults + flight.child * h.initialKids,
      later: h.first ? flight.adult * h.laterAdults + flight.child * h.laterKids : null
    }));

    out.push(row({
      id: 'baggage', label: 'Additional baggage', tag: 'estimate', category: 'flights',
      note: 'Extra checked bags for the flight over, priced per adult. Usually cheaper bought in advance than at the airport.',
      amount: d.baggage * h.adults,
      later: h.first ? d.baggage * h.laterAdults : null
    }));

    out.push(row({
      id: 'domestic', label: 'Domestic connecting flight', tag: 'estimate', category: 'flights',
      note: 'Important if you are moving to a regional area \u2014 international flights rarely land where you are working.',
      amount: d.domestic * (h.adults + h.initialKids),
      later: h.first ? d.domestic * (h.laterAdults + h.laterKids) : null
    }));

    out.push(row({
      id: 'shipping', label: 'Shipping and excess baggage', tag: st.shipping === 'cases' ? 'yours' : 'estimate', category: 'shipping',
      note: st.shipping === 'ship'
        ? 'A planning figure for a part-container of household belongings. Removal quotes vary enormously \u2014 enter a real one as soon as you have it.'
        : (st.shipping === 'excess'
          ? 'Unaccompanied excess baggage \u2014 boxes sent separately, rather than a full container.'
          : 'Suitcases only, so nothing to ship.'),
      amount: d.shipping[st.shipping] || 0
    }));

    out.push(row({
      id: 'pet', label: 'Pet relocation', tag: 'yours',
      note: 'Pet relocation costs vary considerably by country, animal and import requirements. Get a specialist quote and enter it here.',
      amount: 0
    }));

    return out;
  }

  function rowsEstablish() {
    var d = D(), h = household(), t = ten();
    var weekly = tempWeekly(), weeks = num(st.tempWeeks), r = rent();
    var out = [];

    out.push(row({
      id: 'temp', label: 'Temporary accommodation', tag: st.temp === 'yes' ? 'yours' : 'calculated', category: 'temp',
      note: st.temp === 'yes'
        ? 'Your employer is providing this, so nothing to fund. Add a figure if you expect to extend your stay at your own cost.'
        : weeks + ' week' + (weeks === 1 ? '' : 's') + ' at ' + fmt(weekly) + ' a week' + (st.temp === 'partial' ? ', with your employer covering about half.' : '.'),
      amount: st.temp === 'yes' ? 0 : (st.temp === 'partial' ? weekly * weeks * 0.5 : weekly * weeks)
    }));

    out.push(row({
      id: 'bond', label: 'Rental bond', tag: 'calculated',
      note: t.bondWeeks + ' weeks of rent at ' + fmt(r) + ' a week. Held by the tenancy authority and returned at the end of the tenancy if there is nothing to claim.',
      amount: r * t.bondWeeks, href: t.href, hrefLabel: t.source
    }));

    out.push(row({
      id: 'advance', label: 'Rent in advance', tag: 'calculated',
      note: t.advanceWeeks + ' weeks of rent, paid before you move in.',
      amount: r * t.advanceWeeks, href: t.href, hrefLabel: t.source
    }));

    out.push(row({
      id: 'homeSetup', label: 'Basic household setup', tag: 'estimate',
      note: 'Bedding, kitchen essentials, small household items and basic furniture where needed \u2014 for a ' + (st.furnish === 'unfurnished' ? 'unfurnished' : (st.furnish === 'part' ? 'part-furnished' : 'furnished')) + ' place. Reduce it if you are shipping your own things.',
      amount: d.homeSetup[st.furnish] + d.homeSetup.perChild * h.kids
    }));

    out.push(row({
      id: 'transport', label: 'Initial transport budget', tag: 'estimate',
      note: st.transport === 'buy'
        ? 'A starting figure for a reliable used car, before registration and insurance. Our destination guides say where a car really is necessary.'
        : (st.transport === 'hire' ? 'Around four weeks of car hire while you get settled.'
          : (st.transport === 'employer' ? 'Your employer is providing transport, so nothing to fund here.'
            : 'Public transport cards, initial fares and a few taxis while you find your feet.')),
      amount: d.transport[st.transport]
    }));

    if (h.kidsSchool > 0) {
      out.push(row({
        id: 'schoolSetup', label: 'School setup', tag: 'estimate',
        note: 'Uniform, stationery, a device where the school expects one, and initial activities \u2014 per school-age child.',
        amount: d.schoolSetup * h.kidsSchool
      }));
      if (isAU()) {
        var sch = d.school482[st.region] || d.school482.AUNS;
        out.push(row({
          id: 'schoolTuition', label: 'State-school tuition', tag: sch.prefill > 0 ? 'official' : 'yours',
          note: sch.prefill > 0 ? sch.line : sch.line + ' We leave this at zero until you have confirmed your position \u2014 add the amount if a fee applies to you.',
          amount: sch.prefill, href: sch.href, hrefLabel: 'Check the official state rules'
        }));
      }
    }

    if (h.kidsPre > 0) {
      out.push(row({
        id: 'childcareSetup', label: 'Childcare or preschool setup', tag: 'estimate',
        note: 'Enrolment costs, deposits and the first few weeks while you settle in. Ongoing childcare is a cost-of-living question, not a moving cost.',
        amount: d.childcareSetup * h.kidsPre
      }));
    }

    return out;
  }

  function rowsBuffer() {
    var d = D(), h = household();
    return [row({
      id: 'buffer', label: 'Initial living-cost buffer', tag: 'estimate',
      note: 'Roughly a month of everyday expenses \u2014 food, transport, phone and the small things \u2014 for ' + h.adults + ' adult' + (h.adults === 1 ? '' : 's') + (h.initialKids ? ' and ' + h.initialKids + ' child' + (h.initialKids === 1 ? '' : 'ren') : '') + ' until your first full salary arrives.',
      amount: d.buffer.adult * h.adults + d.buffer.child * h.initialKids
    })];
  }

  function roundish(n) { return Math.round(n / 100) * 100; }
  function drivers(t) {
    return t.leave.concat(t.est, t.buf).filter(function (r) { return r.total > 0; })
      .sort(function (a, b) { return b.total - a.total; }).slice(0, 3);
  }

  /* ---------------- totals ---------------- */
  function totals() {
    var leave = rowsLeave(), est = rowsEstablish(), buf = rowsBuffer();
    var all = leave.concat(est, buf);
    var sum = function (rows, key) { var t = 0; for (var i = 0; i < rows.length; i++) t += rows[i][key]; return t; };
    var leaveT = sum(leave, 'total'), estT = sum(est, 'total'), bufT = sum(buf, 'total');
    var grand = leaveT + estT + bufT;

    var covered = 0;
    for (var i = 0; i < all.length; i++) if (all[i].category && st.covers[all[i].category]) covered += all[i].total;
    var stated = st.employer === 'yes' ? num(ov('employerAmount')) : 0;
    var direct = st.employer === 'yes' && (st.employerHow === 'direct' || st.employerHow === 'combination');
    var contribution = Math.min(grand, stated + (direct ? covered : 0));
    var costToYou = Math.max(0, grand - contribution);

    var upfront = costToYou, showUpfront = false, upfrontCopy = '';
    if (st.employer === 'yes' && st.employerHow === 'reimbursed') {
      upfront = grand - (direct ? covered : 0); showUpfront = true;
      upfrontCopy = 'You have told us your employer reimburses relocation costs. That means you may need to pay some or all of these costs yourself before the contribution reaches you \u2014 so plan for the full amount being available, even though your eventual cost is lower.';
    } else if (st.employer === 'yes' && st.employerHow === 'combination') {
      upfront = grand - covered; showUpfront = true;
      upfrontCopy = 'Part of your package is reimbursed, so some of these costs will leave your account before the contribution arrives. Plan for this figure being available, and ask your employer which costs they settle directly.';
    } else if (st.employer === 'yes' && st.employerHow === 'unknown') {
      upfront = grand; showUpfront = true;
      upfrontCopy = 'You are not sure yet how the contribution is paid. Until you know, plan on the basis that you may need to fund the move yourself and be reimbursed later \u2014 and ask your employer to confirm in writing what is paid upfront.';
    } else if (st.employer === 'unsure') {
      upfront = grand; showUpfront = true;
      upfrontCopy = 'You have not confirmed any employer contribution yet, so this figure assumes you fund the move yourself. Relocation support is a reasonable thing to ask about \u2014 many healthcare employers offer it, and we can help you raise it.';
    }

    return {
      leave: leave, est: est, buf: buf, all: all,
      leaveT: leaveT, estT: estT, bufT: bufT, grand: grand,
      initial: sum(all, 'amount'), later: sum(all, 'later'),
      contribution: contribution, costToYou: costToYou,
      upfront: upfront, showUpfront: showUpfront, upfrontCopy: upfrontCopy
    };
  }

  /* ---------------- view pieces ---------------- */
  function pills(list, current, key, cls) {
    var h = '';
    for (var i = 0; i < list.length; i++) {
      var o = list[i], on = String(current) === String(o.value);
      h += '<button type="button" class="cc-pill' + (cls ? ' ' + cls : '') + (on ? ' is-sel' : '') + '" data-set="' + esc(key) + '" data-val="' + esc(o.value) + '"' + (on ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(o.label) + '</button>';
    }
    return h;
  }
  function options(list, current) {
    var h = '';
    for (var i = 0; i < list.length; i++) h += '<option value="' + esc(list[i].value) + '"' + (list[i].value === current ? ' selected' : '') + '>' + esc(list[i].label) + '</option>';
    return h;
  }
  function tag(kind) { return '<span class="cc-tag ' + TAGS[kind].css + '">' + TAGS[kind].label + '</span>'; }

  function rowHTML(r) {
    var h = '<div class="cc-row"><div class="cc-rmain"><div class="cc-rhead"><span class="cc-rl">' + esc(r.label) + '</span>' + tag(r.tag) + '</div>';
    h += '<p class="cc-rn">' + esc(r.note) + '</p>';
    if (r.href || r.edited) {
      h += '<div class="cc-racts">';
      if (r.href) h += '<a href="' + esc(r.href) + '" target="_blank" rel="noopener">' + esc(r.hrefLabel) + ' &rarr;</a>';
      if (r.edited) h += '<button type="button" class="cc-link" data-reset="' + esc(r.id) + '">Use our figure instead</button>';
      h += '</div>';
    }
    h += '</div><div class="cc-rval"><div class="cc-money"><span class="cc-sym" aria-hidden="true">$</span>';
    h += '<input type="text" inputmode="numeric" value="' + esc(r.value) + '" data-ov="' + esc(r.id) + '" aria-label="' + esc(r.label) + ' \u2014 amount in ' + code() + '">';
    h += '</div>';
    if (r.hasLater) {
      h += '<div class="cc-later"><span>Family later</span><div class="cc-money sm"><span class="cc-sym" aria-hidden="true">$</span>';
      h += '<input type="text" inputmode="numeric" value="' + esc(r.laterValue) + '" data-ov="' + esc(r.id) + '_later" aria-label="' + esc(r.label) + ' for family joining later \u2014 amount in ' + code() + '"></div></div>';
    }
    return h + '</div></div>';
  }

  function rowsHTML(rows, label, total) {
    var h = '<div class="cc-card cc-rows">';
    for (var i = 0; i < rows.length; i++) h += rowHTML(rows[i]);
    h += '<div class="cc-total"><span>' + esc(label) + '</span><span>' + fmt(total) + '</span></div></div>';
    return h;
  }

  function tabs() {
    var h = '<nav class="cc-tabs" aria-label="Calculator steps" data-print-hide>';
    for (var i = 0; i < STAGES.length; i++) {
      var s = STAGES[i], on = st.stage === s.n;
      h += '<button type="button" class="cc-tab' + (on ? ' is-sel' : '') + '" data-stage="' + s.n + '"' + (on ? ' aria-current="step"' : '') + '><span class="n">' + (s.n === 5 ? '\u2713' : s.n) + '</span>' + esc(s.short) + '</button>';
    }
    return h + '</nav>';
  }

  /* ---------------- stages ---------------- */
  function stage1() {
    var d = D(), h = household();
    var origins = [];
    for (var k in d.flights) if (Object.prototype.hasOwnProperty.call(d.flights, k)) origins.push({ value: k, label: d.flights[k].label });
    var s = '<div class="cc-stage"><div class="cc-shead"><span class="cc-stepn">Step 1 of 4</span><h2 tabindex="-1">Your move</h2><p class="cc-ssub">Where you are going, where you are coming from, and who is coming with you.</p></div>';
    if (st.seeded) s += '<p class="cc-hint" style="margin:-6px 0 18px">Prefilled from your plan on <a href="/move" style="color:#02615D;font-weight:600">Move</a>. Change anything that is not right.</p>';

    s += '<div class="cc-card"><h3>Where are you moving?</h3><div class="cc-choices two">'
      + '<button type="button" class="cc-dest' + (isAU() ? ' is-sel' : '') + '" data-set="dest" data-val="au"><span class="cc-flag au">AU</span><span class="cc-dl">Australia</span><span class="cc-dd">Fees, visa charges and tenancy rules by state or territory</span></button>'
      + '<button type="button" class="cc-dest' + (!isAU() ? ' is-sel' : '') + '" data-set="dest" data-val="nz"><span class="cc-flag nz">NZ</span><span class="cc-dl">New Zealand</span><span class="cc-dd">One national tenancy rule, and no school tuition for dependants</span></button>'
      + '</div>';
    s += '<h3 class="mt">' + (isAU() ? 'Which state or territory?' : 'Which area?') + '</h3><div class="cc-row-pills">' + pills(d.regions[st.dest], st.region, 'region', 'sm') + '</div></div>';

    s += '<div class="cc-card"><h3>Where are you moving from?</h3><p class="cc-hint">This shapes our indicative flight costs only.</p>'
      + '<label class="cc-lab" for="cc-origin">Country you are flying from</label>'
      + '<select id="cc-origin" class="cc-select" data-set="origin">' + options(origins, st.origin) + '</select></div>';

    s += '<div class="cc-card"><h3>Who is moving?</h3><div class="cc-choices stack">' + pills([
      { value: 'me', label: 'Just me' },
      { value: 'partner', label: 'Me and my partner' },
      { value: 'kids', label: 'Me and my child or children' },
      { value: 'family', label: 'Me, my partner and our children' },
      { value: 'first', label: 'I am moving first and my family will follow' }
    ], st.who, 'who', 'wide') + '</div>';

    if (st.who === 'first') {
      s += '<div class="cc-inset"><p class="cc-q">Is a partner following later?</p><div class="cc-row-pills">'
        + pills([{ value: 'y', label: 'Yes' }, { value: 'n', label: 'No, just children' }], st.followPartner ? 'y' : 'n', 'followPartner', 'sm')
        + '</div></div>';
    }
    if (st.who === 'kids' || st.who === 'family' || st.who === 'first') {
      s += '<div class="cc-fields">'
        + '<div><label class="cc-lab" for="cc-ks">School-age children</label><input id="cc-ks" class="cc-nb" type="text" inputmode="numeric" value="' + esc(st.kidsSchool) + '" data-num="kidsSchool"></div>'
        + '<div><label class="cc-lab" for="cc-kp">Children under school age</label><input id="cc-kp" class="cc-nb" type="text" inputmode="numeric" value="' + esc(st.kidsPre) + '" data-num="kidsPre"></div>'
        + '</div>';
    }
    s += '</div>';
    return s + '</div>';
  }

  function stage2() {
    var d = D(), t = totals();
    var profs = [];
    for (var k in d.registration.labels) if (Object.prototype.hasOwnProperty.call(d.registration.labels, k)) profs.push({ value: k, label: d.registration.labels[k] });
    var s = '<div class="cc-stage"><div class="cc-shead"><span class="cc-stepn">Step 2 of 4</span><h2 tabindex="-1">Before you leave</h2><p class="cc-ssub">Registration, visas, documents and getting everyone there. Change any figure you already know \u2014 the estimate improves every time you do.</p></div>';
    s += '<div class="cc-card"><h3>Your profession</h3><p class="cc-hint">So we can show the right registration costs — the regulator, the fee and the pathway all change with it.</p>'
      + '<label class="cc-lab" for="cc-prof">Profession</label><select id="cc-prof" class="cc-select" data-set="profession">' + options(profs, st.profession) + '</select>'
      + '<h3 class="mt">Does your pathway include an examination?</h3>'
      + '<p class="cc-hint">An examination or clinical assessment can cost more than everything else in your registration put together, so it is worth answering honestly. Nurses and midwives with recent practice in ' + esc(d.registration.exam.streamlined) + ' are usually exempt.</p>'
      + '<div class="cc-row-pills">' + pills([
        { value: 'no', label: 'No examination required' }, { value: 'yes', label: 'Yes, an examination applies' }, { value: 'unsure', label: 'Not sure yet' }
      ], examEff(), 'examChoice', 'sm') + '</div>'
      + '<p class="cc-stampline">' + esc(d.registrationChecked || ('Registration fees checked ' + d.lastChecked + '.')) + '</p></div>';
    s += '<div class="cc-card"><h3>What do you plan to bring?</h3><div class="cc-row-pills">' + pills([
      { value: 'cases', label: 'Suitcases only' }, { value: 'excess', label: 'Boxes sent separately' }, { value: 'ship', label: 'A part-container of belongings' }
    ], st.shipping, 'shipping', 'sm') + '</div></div>';
    s += rowsHTML(t.leave, 'Before you leave', t.leaveT);
    s += '<div class="cc-note"><p>Immigration adviser and migration agent fees are optional third-party costs \u2014 you are not required to use one. Government charges are the only compulsory part.' + (isAU() ? '' : ' ' + esc(d.visa.nz.note)) + '</p></div>';
    return s + '</div>';
  }

  function stage3() {
    var d = D(), h = household(), t = ten(), tt = totals(), r = rent();
    var s = '<div class="cc-stage"><div class="cc-shead"><span class="cc-stepn">Step 3 of 4</span><h2 tabindex="-1">Getting established</h2><p class="cc-ssub">Somewhere to stay, then somewhere to live. Securing a rental is usually the largest single cost of arriving.</p></div>';

    s += '<div class="cc-card"><h3>Is temporary accommodation provided by your employer?</h3><div class="cc-row-pills">' + pills([
      { value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'partial', label: 'Partially' }, { value: 'unsure', label: 'Not sure' }
    ], st.temp, 'temp', 'sm') + '</div>';
    if (st.temp !== 'yes') {
      s += '<div class="cc-fields mt"><div><span class="cc-lab">Weeks you expect to need</span><div class="cc-row-pills">'
        + pills([{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 6, label: '6' }], num(st.tempWeeks), 'tempWeeks', 'sm num')
        + '</div></div>'
        + '<div><label class="cc-lab" for="cc-tw">Estimated weekly cost</label><div class="cc-money"><span class="cc-sym" aria-hidden="true">$</span><input id="cc-tw" type="text" inputmode="numeric" value="' + esc(String(tempWeekly())) + '" data-ov="tempWeekly"></div></div></div>';
    }
    s += '</div>';

    s += '<div class="cc-card"><h3>Securing a rental</h3><p class="cc-hint">Enter the weekly rent you expect to pay. We apply the tenancy rules where you are moving to work out the cash you need up front.</p>'
      + '<div class="cc-fields"><div><label class="cc-lab" for="cc-rent">Expected weekly rent</label><div class="cc-money"><span class="cc-sym" aria-hidden="true">$</span><input id="cc-rent" type="text" inputmode="numeric" value="' + esc(String(r)) + '" data-ov="rent"></div></div>'
      + '<div class="cc-tagwrap">' + tag(ov('rent') === null ? 'estimate' : 'yours') + '</div></div>'
      + '<div class="cc-inset lg"><p class="cc-bond">Cash required to secure the rental: ' + fmt(r * t.bondWeeks + r * t.advanceWeeks) + '</p>'
      + '<p class="cc-bondrule">' + esc(t.rule) + ' The bond is refundable at the end of the tenancy, less anything properly owed; rent in advance pays for part of your tenancy and is not a refundable deposit.</p>'
      + '<div class="cc-racts"><a href="' + esc(t.href) + '" target="_blank" rel="noopener">' + esc(t.source) + ' &rarr;</a><span class="cc-stamp">Last checked ' + esc(d.lastChecked) + '</span></div></div></div>';

    s += '<div class="cc-card"><h3>Will your accommodation be furnished?</h3><div class="cc-row-pills">' + pills([
      { value: 'furnished', label: 'Furnished' }, { value: 'part', label: 'Part furnished' }, { value: 'unfurnished', label: 'Unfurnished' }
    ], st.furnish, 'furnish', 'sm') + '</div>'
      + '<h3 class="mt">How will you get around at first?</h3><div class="cc-row-pills">' + pills([
        { value: 'public', label: 'Public transport at first' }, { value: 'buy', label: 'Buying a car' }, { value: 'hire', label: 'Hiring a car' },
        { value: 'employer', label: 'Employer providing transport' }, { value: 'unsure', label: 'Not sure' }
      ], st.transport, 'transport', 'sm') + '</div></div>';

    if (h.kidsSchool > 0) {
      var sch = isAU() ? (d.school482[st.region] || d.school482.AUNS) : null;
      s += '<div class="cc-panel"><span class="eyebrow">Schooling</span>'
        + '<p class="cc-ph">' + (isAU() ? esc(regionLabel()) + ' \u2014 ' + esc(sch.verdict) : 'State-school tuition: depends on your visa') + '</p>'
        + '<p class="cc-pb">' + esc(isAU() ? sch.line : d.nzSchool.line) + '</p>'
        + '<p class="cc-pc">' + (isAU()
          ? 'This is the likely position based on what you have entered, for dependent children of a subclass 482 holder. Where we cannot determine your eligibility, school tuition stays out of your total until you confirm it.'
          : 'You may still need to budget for uniforms, stationery, devices, transport, before and after-school care and activities. Our school setup figure covers the first of these.') + '</p>'
        + '<a class="cc-plink" href="' + esc(isAU() ? sch.href : d.nzSchool.officialHref) + '" target="_blank" rel="noopener">Check the official rules &rarr;</a></div>';
    }

    return s + rowsHTML(tt.est, 'Getting established', tt.estT) + '</div>';
  }

  function stage4() {
    var t = totals();
    var s = '<div class="cc-stage"><div class="cc-shead"><span class="cc-stepn">Step 4 of 4</span><h2 tabindex="-1">Your support</h2><p class="cc-ssub">What your employer is contributing, and what you need in the bank before your first full salary arrives.</p></div>';

    s += '<div class="cc-card"><h3>Is your employer contributing towards relocation?</h3><div class="cc-row-pills">' + pills([
      { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Not sure yet' }
    ], st.employer, 'employer', 'sm') + '</div>';

    if (st.employer === 'yes') {
      s += '<div class="cc-fields mt"><div><label class="cc-lab" for="cc-emp">Relocation contribution</label><div class="cc-money"><span class="cc-sym" aria-hidden="true">$</span>'
        + '<input id="cc-emp" type="text" inputmode="numeric" value="' + esc(ov('employerAmount') === null ? '0' : String(ov('employerAmount'))) + '" data-ov="employerAmount"></div></div></div>';
      s += '<h3 class="mt">How is it provided?</h3><div class="cc-choices stack">' + pills([
        { value: 'upfront', label: 'Paid upfront' },
        { value: 'reimbursed', label: 'Reimbursed after I pay' },
        { value: 'direct', label: 'Employer pays specific costs directly' },
        { value: 'combination', label: 'A combination' },
        { value: 'unknown', label: 'I don\u2019t know yet' }
      ], st.employerHow, 'employerHow', 'wide') + '</div>';
      if (st.employerHow === 'direct' || st.employerHow === 'combination') {
        var covers = [
          { value: 'flights', label: 'Flights' }, { value: 'visa', label: 'Visa' }, { value: 'registration', label: 'Registration' },
          { value: 'temp', label: 'Temporary accommodation' }, { value: 'shipping', label: 'Shipping' }
        ];
        s += '<h3 class="mt">Which costs does your employer pay directly?</h3><p class="cc-hint">Anything selected here still counts in the total cost of moving, but you will not need the cash yourself.</p><div class="cc-row-pills">';
        for (var i = 0; i < covers.length; i++) {
          var on = !!st.covers[covers[i].value];
          s += '<button type="button" class="cc-pill sm' + (on ? ' is-sel' : '') + '" data-cover="' + covers[i].value + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + covers[i].label + '</button>';
        }
        s += '</div>';
      }
    }
    s += '</div>';

    s += '<div class="cc-card cc-rows"><h3>Don\u2019t forget the gap before your first salary</h3><p class="cc-hint">You may arrive several weeks before your first full salary lands. Make sure you have enough available for everyday expenses until it does.</p>';
    for (var j = 0; j < t.buf.length; j++) s += rowHTML(t.buf[j]);
    s += '<div class="cc-total"><span>Initial buffer</span><span>' + fmt(t.bufT) + '</span></div></div>';
    return s + '</div>';
  }

  function sumCard(title, rows, label, total, extra) {
    var h = '<div class="cc-sum"><h3>' + esc(title) + '</h3>';
    for (var i = 0; i < rows.length; i++) {
      h += '<div class="cc-sline"><span>' + esc(rows[i].label) + '</span><span>' + fmt(rows[i].total) + '</span></div>';
    }
    h += '<div class="cc-ssub2"><span>' + esc(label) + '</span><span>' + fmt(total) + '</span></div>';
    return h + (extra || '') + '</div>';
  }

  function stage5() {
    var d = D(), t = totals(), h = household(), C = code();
    var bits = [h.adults + (h.first ? ' adult moving first' : (h.adults === 1 ? ' adult' : ' adults'))];
    if (h.kids) bits.push(h.kids + (h.kids === 1 ? ' child' : ' children'));
    bits.push(d.registration.labels[st.profession] || '');

    var beforeLeave = t.leaveT, afterLand = t.estT + t.bufT;
    var s = '<div class="cc-stage"><div class="cc-summary"><div class="cc-sumhead"><div>'
      + '<span class="eyebrow">Your moving budget</span>'
      + '<p class="cc-big" tabindex="-1">Around ' + C + ' ' + fmt(roundish(t.grand)) + '</p>'
      + '<p class="cc-bigsub">For ' + esc(bits.join(' \u00b7 ')) + ', moving ' + esc((d.flights[st.origin] || d.flights.other).label) + ' to ' + esc(regionLabel()) + '.</p>'
      + '<p class="cc-bignote">This includes the costs and assumptions you selected. Every variable figure can still be changed.</p></div>'
      + '<div class="cc-sumacts" data-print-hide><button type="button" class="cc-b2" data-print>Print or save as PDF</button><a class="cc-b3" href="/contact">Talk it through with us</a></div></div></div>';

    /* The three numbers that actually matter, in the order they matter. */
    s += '<div class="cc-three">'
      + '<div class="cc-th"><span class="cc-thk">Estimated total move cost</span><span class="cc-thv">' + C + ' ' + fmt(t.grand) + '</span></div>'
      + '<div class="cc-th lead"><span class="cc-thk">Costs that fall before you leave</span><span class="cc-thv">' + C + ' ' + fmt(beforeLeave) + '</span>'
      + '<span class="cc-thn">Registration, visas, documents and flights are mostly paid while you are still at home.</span></div>'
      + '<div class="cc-th"><span class="cc-thk">Employer support</span><span class="cc-thv">' + (t.contribution > 0 ? 'Up to ' + C + ' ' + fmt(t.contribution) : 'None recorded') + '</span>'
      + '<span class="cc-thn">' + (t.contribution > 0 ? 'Worth confirming how and when this is paid before you rely on it.' : 'Tell us about a relocation package in step 4 and we will factor it in.') + '</span></div>'
      + '</div>';

    /* Cash-flow timing, which is a different question from who ultimately pays. */
    s += '<div class="cc-timing"><h3>Before you leave, and after you land</h3><div class="cc-tgrid">'
      + '<div><span class="cc-tk">Before you leave</span><span class="cc-tv">' + C + ' ' + fmt(beforeLeave) + '</span><span class="cc-tn">Registration, visas, medicals, police checks, flights and shipping.</span></div>'
      + '<div><span class="cc-tk">After you land</span><span class="cc-tv">' + C + ' ' + fmt(afterLand) + '</span><span class="cc-tn">Temporary accommodation, bond and advance rent, transport, household setup and your first month.</span></div>'
      + '</div></div>';

    /* Where a change of assumption would actually move the total. */
    var dr = drivers(t);
    if (dr.length) {
      s += '<div class="cc-drivers"><h3>Your biggest costs</h3><ol class="cc-drlist">'
        + dr.map(function (r, i) { return '<li><span class="cc-drn">' + (i + 1) + '</span><span class="cc-drl">' + esc(r.label) + '</span><span class="cc-drv">' + C + ' ' + fmt(r.total) + '</span></li>'; }).join('')
        + '</ol><p class="cc-drnote">These are the figures most likely to change your overall budget, so they are the ones worth pricing properly before you commit to a departure date.</p></div>';
    }

    var later = (h.first && t.later > 0)
      ? '<div class="cc-two"><p class="cc-twoh">Moving in two stages</p><div class="cc-sline"><span>Your initial move</span><span>' + fmt(t.initial) + '</span></div><div class="cc-sline"><span>Family joining later</span><span>' + fmt(t.later) + '</span></div></div>'
      : '';

    s += '<div class="cc-sums">'
      + sumCard('Before you leave', t.leave, 'Subtotal', t.leaveT)
      + sumCard('Getting established', t.est, 'Subtotal', t.estT)
      + sumCard('Initial buffer', t.buf, 'Subtotal', t.bufT, later)
      + '</div>';

    s += '<div class="cc-band"><div class="cc-figs">'
      + '<div><span class="cc-fk">Total cost of moving</span><span class="cc-fv">' + C + ' ' + fmt(t.grand) + '</span></div>'
      + '<div><span class="cc-fk">Employer contribution</span><span class="cc-fv">' + (t.contribution > 0 ? '\u2212 ' : '') + C + ' ' + fmt(t.contribution) + '</span></div>'
      + '<div><span class="cc-fk">Estimated cost to you</span><span class="cc-fv">' + C + ' ' + fmt(t.costToYou) + '</span></div>'
      + '</div>';

    var curs = [{ value: 'dest', label: C }, { value: 'GBP', label: 'GBP' }, { value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }, { value: 'ZAR', label: 'ZAR' }];
    s += '<div class="cc-curs" data-print-hide><span class="cc-ck">Show in</span>';
    for (var i = 0; i < curs.length; i++) {
      var on = st.currency === curs[i].value;
      s += '<button type="button" class="cc-cur' + (on ? ' is-sel' : '') + '" data-cur="' + curs[i].value + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + curs[i].label + '</button>';
    }
    s += '</div>';
    if (st.currency !== 'dest') {
      var rate = (d.currency.rates[C] || {})[st.currency];
      if (rate) {
        var conv = function (n) { return st.currency + ' ' + Math.round(n * rate).toLocaleString('en-AU'); };
        s += '<p class="cc-conv">Indicative exchange rate as at ' + esc(d.currency.rates.asOf) + ': total ' + conv(t.grand) + ', your share ' + conv(t.costToYou) + '. Rates move daily \u2014 treat this as a guide only.</p>';
      }
    }
    s += '</div>';

    if (t.showUpfront) {
      s += '<div class="cc-upfront"><span class="eyebrow">Cash you may need available upfront</span>'
        + '<p class="cc-uv">Up to ' + C + ' ' + fmt(t.upfront) + '</p>'
        + '<p class="cc-ub">' + esc(t.upfrontCopy) + '</p></div>';
    }

    s += '<div class="cc-card cc-prov"><h3>Where these figures come from</h3><div class="cc-provgrid">'
      + '<p><strong>Official fee</strong> \u2014 a published government or regulator charge.</p>'
      + '<p><strong>Calculated</strong> \u2014 worked out from an official rule, such as a rental bond.</p>'
      + '<p><strong>Planning estimate</strong> \u2014 our realistic starting figure, meant to be replaced.</p>'
      + '<p><strong>Your figure</strong> \u2014 a number you have entered yourself.</p></div>'
      + '<p class="cc-stampline">Fees and tenancy rules checked ' + esc(d.lastChecked) + '. They change \u2014 always confirm against the official source before making a financial decision. This is a moving budget, not a cost-of-living calculator.</p></div>';

    s += '<div class="cc-next" data-print-hide><h3>Continue planning your move</h3><p>The cost is one part of the picture. These take you through the rest.</p><div class="cc-nextgrid">'
      + '<a href="/moving-checklist"><span class="t">Your moving checklist</span><span class="l">What do I need to organise? &rarr;</span></a>'
      + '<a href="/pathway-checker"><span class="t">Registration pathway checker</span><span class="l">Can I register professionally? &rarr;</span></a>'
      + '<a href="/guides/cost-of-relocating"><span class="t">The relocation cost guide</span><span class="l">Why each cost lands when it does &rarr;</span></a>'
      + '<a href="' + (isAU() ? '/destinations/australia' : '/destinations/') + '"><span class="t">Destination guides</span><span class="l">Where should I live? &rarr;</span></a>'
      + '</div></div>';

    return s + '</div>';
  }

  function view() {
    var d = D();
    if (!d) return '<div class="cc-stage"><div class="cc-card"><h3>Loading your figures\u2026</h3><p class="cc-hint">If this stays on screen, the cost data has not loaded. The <a href="/guides/cost-of-relocating">relocation cost guide</a> covers the same ground in full.</p></div></div>';
    var body = st.stage === 1 ? stage1() : st.stage === 2 ? stage2() : st.stage === 3 ? stage3() : st.stage === 4 ? stage4() : stage5();
    var nav = '<div class="cc-nav" data-print-hide>';
    nav += st.stage > 1 ? '<button type="button" class="cc-back" data-stage="' + (st.stage - 1) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>Back</button>' : '<span></span>';
    nav += st.stage < 5
      ? '<button type="button" class="cc-nextb" data-stage="' + (st.stage + 1) + '">' + (st.stage === 4 ? 'See my estimate' : 'Continue') + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'
      : '<button type="button" class="cc-b3" data-restart>Start again</button>';
    return tabs() + body + nav + '</div>';
  }

  /* ---------------- render ---------------- */
  function render() {
    var a = document.activeElement, key = null, pos = null;
    if (a && app.contains(a) && a.tagName === 'INPUT') {
      key = a.getAttribute('data-ov') ? 'ov:' + a.getAttribute('data-ov') : (a.getAttribute('data-num') ? 'num:' + a.getAttribute('data-num') : null);
      try { pos = a.selectionStart; } catch (e) {}
    }
    app.innerHTML = view();
    if (key) {
      var sel = key.indexOf('ov:') === 0 ? '[data-ov="' + key.slice(3) + '"]' : '[data-num="' + key.slice(4) + '"]';
      var el = app.querySelector(sel);
      if (el) { el.focus(); if (pos != null) { try { el.setSelectionRange(pos, pos); } catch (e) {} } }
    } else if (moveFocus) {
      var head = app.querySelector('.cc-stage h2');
      if (head) head.focus();
    }
    moveFocus = false;
  }

  /* ---------------- events ---------------- */
  app.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('button') : null;
    if (!el || !app.contains(el)) return;

    var stage = el.getAttribute('data-stage');
    if (stage) {
      var to = parseInt(stage, 10);
      /* Started = the first move off stage 1. Completed = reaching stage 5, the estimate.
         The total is BUCKETED, never sent exactly: an exact relocation budget against a
         session is personal data by another route. See "Ethicare Analytics Spec.md". */
      if (window.track) {
        if (st.stage === 1 && to === 2) window.track('calculator_started', { country: cc() });
        if (to === 5 && st.stage !== 5) {
          var t = 0;
          try { t = totals().grand || 0; } catch (e) {}
          var band = t < 5000 ? 'under-5k' : t < 10000 ? '5-10k' : t < 20000 ? '10-20k' : 'over-20k';
          window.track('calculator_completed', { country: cc(), band: band });
        }
      }
      moveFocus = true; set({ stage: to }); window.scrollTo(0, Math.max(0, app.getBoundingClientRect().top + window.pageYOffset - 96)); return;
    }

    var key = el.getAttribute('data-set');
    if (key) {
      var v = el.getAttribute('data-val');
      if (key === 'dest') return set({ dest: v, region: v === 'au' ? 'QLD' : 'akl' });
      if (key === 'followPartner') return set({ followPartner: v === 'y' });
      if (key === 'tempWeeks') return set({ tempWeeks: num(v) });
      var p = {}; p[key] = v; return set(p);
    }

    var cov = el.getAttribute('data-cover');
    if (cov) {
      var next = assign({}, st.covers);
      if (next[cov]) delete next[cov]; else next[cov] = true;
      return set({ covers: next });
    }

    var cur = el.getAttribute('data-cur');
    if (cur) return set({ currency: cur });

    var reset = el.getAttribute('data-reset');
    if (reset) { setOverride(reset, undefined); return render(); }

    if (el.hasAttribute('data-print')) return window.print();

    if (el.hasAttribute('data-restart')) {
      try { localStorage.removeItem(LSK); localStorage.removeItem(SUMMARY_KEY); } catch (e2) {}
      st = assign({}, S0, { covers: {}, overrides: {} });
      moveFocus = true; save(); return render();
    }
  });

  app.addEventListener('input', function (e) {
    var el = e.target;
    if (el.tagName !== 'INPUT') return;
    var id = el.getAttribute('data-ov');
    if (id) { setOverride(id, el.value); return render(); }
    var k = el.getAttribute('data-num');
    if (k) { var p = {}; p[k] = num(el.value); return set(p); }
  });

  app.addEventListener('change', function (e) {
    var el = e.target;
    if (el.tagName !== 'SELECT') return;
    var key = el.getAttribute('data-set');
    if (!key) return;
    /* a new profession means a new pathway — drop any exam answer given for the old one */
    if (key === 'profession') return set({ profession: el.value, examChoice: null });
    var p = {}; p[key] = el.value; set(p);
  });

  /* ---------------- boot ---------------- */
  try {
    var raw = localStorage.getItem(LSK);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.st && parsed.ts && (Date.now() - parsed.ts) < MAX_AGE) st = assign({}, S0, parsed.st);
    }
  } catch (e) {}

  var q = new RegExp('[?&]destination=(au|nz|australia|new-zealand)').exec(window.location.search);
  if (q) { st.dest = q[1].charAt(0) === 'a' ? 'au' : 'nz'; if (D() && !D().regions[st.dest].some(function (r) { return r.value === st.region; })) st.region = st.dest === 'au' ? 'QLD' : 'akl'; }
  var qp = new RegExp('[?&]profession=([a-z]+)').exec(window.location.search);
  if (qp && D() && D().registration.labels[qp[1]]) st.profession = qp[1];

  /* ONE onboarding (candidate-journey review, 14 Sep 2026): a fresh visit with no saved estimate
     and no URL intent starts from what Move already knows — destination, origin, who is coming,
     and the profession where the key exists in this tool's own list. S0's defaults (Australia,
     QLD, UK, just me, imaging) are otherwise asserted on the reader's behalf; a plan they wrote is
     a better default than one we guessed. Every field stays editable. */
  try {
    var ctx = window.EthicareContext, saved = !!localStorage.getItem(LSK);
    if (ctx && ctx.has() && !saved && !q && !qp) {
      var p = ctx.read() || {}, dd = ctx.dest();
      if (dd) { st.dest = dd; st.region = dd === 'au' ? 'QLD' : 'akl'; }
      if (p.origin && D() && D().flights[p.origin]) st.origin = p.origin;
      if (p.profession && D() && D().registration.labels[p.profession]) st.profession = p.profession;
      var w = p.hh && p.hh['with'];
      if (w === 'alone') st.who = 'me'; else if (w === 'partner') st.who = 'partner'; else if (w === 'kids') st.who = 'kids'; else if (w === 'both') st.who = 'family';
      st.seeded = true;
    }
  } catch (e) {}

  if (!D()) {
    var tries = 0, poll = setInterval(function () {
      if (D() || ++tries > 60) { clearInterval(poll); render(); }
    }, 60);
  }
  render();
})();
