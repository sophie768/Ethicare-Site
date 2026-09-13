/* ================================================================
   ETHICARE RESOURCING — Your Moving Checklist (/moving-checklist)
   Vanilla controller. All copy, sections and links live in
   moving-checklist-data.js — never in here.
   Answers, ticks and notes save to localStorage on this device only.
   ================================================================ */
(function () {
  'use strict';

  var app = document.getElementById('mc-app');
  if (!app) return;

  var LSK = 'ethicare_moving_checklist_v1';
  var MAXAGE = 1000 * 60 * 60 * 24 * 120; // a draft older than ~4 months is stale

  var A0 = { dest: null, who: null, pet: null, ages: [] };
  var st = { step: 1, answers: assign({}, A0), err: '', statuses: {}, notes: {}, openNotes: {} };
  var moveFocus = false;

  function assign(t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; } return t; }
  function D() { return window.ETHICARE_CHECKLIST || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function save() {
    try {
      localStorage.setItem(LSK, JSON.stringify({
        step: st.step, answers: st.answers, statuses: st.statuses, notes: st.notes, ts: Date.now()
      }));
    } catch (e) { /* storage unavailable — this session only */ }
  }

  /* ---------------- counts ---------------- */
  function sections() { return D() ? D().build(st.answers) : []; }
  function tally(secs) {
    var t = { total: 0, done: 0, todo: 0, revisit: 0 };
    secs.forEach(function (sec) {
      sec.items.forEach(function (it) {
        t.total++;
        var v = st.statuses[it.id];
        if (v === 'done') t.done++; else if (v === 'todo') t.todo++; else if (v === 'revisit') t.revisit++;
      });
    });
    t.considered = t.done + t.revisit;
    t.pct = t.total ? Math.round((t.considered / t.total) * 100) : 0;
    return t;
  }

  /* ---------------- markup helpers ---------------- */
  function sel(cur, v) { return cur === v ? ' is-sel' : ''; }
  function eyebrow(txt) { return '<span class="eyebrow">' + esc(txt) + '</span>'; }
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';

  /* ---------------- step 1 ---------------- */
  function step1() {
    var d = D(), a = st.answers;
    return '<div class="mc-intro">' + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap">' + eyebrow('Plan your move') + '<img src="assets/heroes/packing-and-shipping.svg" alt="An open packing box with a roll of tape" width="90" height="68" style="width:90px;height:auto;flex:none">' + '</div>' +
      '<h1>Your moving checklist</h1>' +
      '<p class="mc-said">No two international moves look the same.</p>' +
      '<p class="mc-lede">Moving alone raises different questions from relocating with a partner or children \u2014 and sometimes it makes sense for one person to go ahead of everyone else. Answer two questions and we\u2019ll build the checklist that fits your circumstances.</p>' +
      '<p class="mc-meta">Two questions, about thirty seconds. No account, no email \u2014 your ticks and notes stay in this browser.</p></div>' +
      '<div class="mc-qhead"><span class="mc-stepn">Step 1 of 2</span><h2>Where are you considering?</h2></div>' +
      '<div class="mc-grid dest">' + d.destinations.map(function (o) {
        return '<button type="button" class="mc-dest' + sel(a.dest, o.id) + '" data-pick="dest" data-v="' + o.id + '">' +
          '<span class="mc-tile ' + o.cls + '">' + esc(o.tile) + '</span>' +
          '<span class="mc-dl">' + esc(o.label) + '</span>' +
          '<span class="mc-dd">' + esc(o.desc) + '</span></button>';
      }).join('') + '</div>';
  }

  /* ---------------- step 2 ---------------- */
  function step2() {
    var d = D(), a = st.answers;
    var kids = a.who === 'parentKids' || a.who === 'familyKids';
    var h = '<button type="button" class="mc-back" data-act="back">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg>Back to destination</button>' +
      '<div class="mc-qhead"><span class="mc-stepn">Step 2 of 2</span><h2>Who\u2019s making the move?</h2></div>' +
      '<p class="mc-sub">Pick the closest description \u2014 we only ask what changes your checklist.</p>' +
      '<div class="mc-grid who">' + d.households.map(function (o) {
        return '<button type="button" class="mc-who' + sel(a.who, o.id) + '" data-pick="who" data-v="' + o.id + '">' +
          '<span class="mc-wl">' + esc(o.label) + '</span><span class="mc-wd">' + esc(o.desc) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="mc-extras"><div><div class="mc-q">Bringing a pet?</div><div class="mc-row">' +
      '<button type="button" class="mc-pill' + (a.pet === true ? ' is-sel' : '') + '" data-act="pet" data-v="yes">Yes</button>' +
      '<button type="button" class="mc-pill' + (a.pet === false ? ' is-sel' : '') + '" data-act="pet" data-v="no">No</button></div></div>';
    if (kids) {
      h += '<div><div class="mc-q">How old are your children?</div>' +
        '<p class="mc-hint">Select all that apply \u2014 it decides whether you see childcare, primary or secondary information.</p>' +
        '<div class="mc-row wrap">' + d.ages.map(function (o) {
          return '<button type="button" class="mc-pill' + ((a.ages || []).indexOf(o.id) >= 0 ? ' is-sel' : '') + '" data-act="age" data-v="' + o.id + '">' + esc(o.label) + '</button>';
        }).join('') + '</div></div>';
    }
    h += '</div><div class="mc-nav"><button type="button" class="mc-next" data-act="build">Create my checklist' + ARROW + '</button>' +
      (st.err ? '<span class="mc-err" role="alert">' + esc(st.err) + '</span>' : '') + '</div>';
    return h;
  }

  /* ---------------- the checklist ---------------- */
  function itemHtml(it) {
    var v = st.statuses[it.id] || '';
    var noteVal = st.notes[it.id] || '';
    var open = !!st.openNotes[it.id] || !!noteVal;
    var ctas = [];
    if (it.ctaLabel && it.ctaHref) ctas.push({ label: it.ctaLabel, href: it.ctaHref, cls: 'mc-b2' });
    if (it.cta2Label && it.cta2Href) ctas.push({ label: it.cta2Label, href: it.cta2Href, cls: 'mc-b3' });
    var ext = function (h) { return /^https?:/.test(h); };
    return '<div class="mc-item' + (v ? ' s-' + v : '') + '">' +
      '<div class="mc-itop">' +
        '<div class="mc-ibody"><span class="mc-dot' + (v === 'done' ? ' done' : v === 'revisit' ? ' revisit' : '') + '" aria-hidden="true">' + (v === 'done' ? TICK : '') + '</span>' +
        '<div><p class="mc-it">' + esc(it.title) + '</p>' +
        (it.note ? '<p class="mc-in">' + esc(it.note) + '</p>' : '') +
        (it.meta ? '<p class="mc-im">' + esc(it.meta) + '</p>' : '') + '</div></div>' +
        '<div class="mc-status" role="group" aria-label="Status for: ' + esc(it.title) + '">' +
          '<button type="button" class="mc-st' + (v === 'done' ? ' on done' : '') + '" data-act="status" data-id="' + it.id + '" data-v="done" aria-pressed="' + (v === 'done') + '">Done</button>' +
          '<button type="button" class="mc-st' + (v === 'todo' ? ' on todo' : '') + '" data-act="status" data-id="' + it.id + '" data-v="todo" aria-pressed="' + (v === 'todo') + '">To do</button>' +
          '<button type="button" class="mc-st' + (v === 'revisit' ? ' on revisit' : '') + '" data-act="status" data-id="' + it.id + '" data-v="revisit" aria-pressed="' + (v === 'revisit') + '">Revisit</button>' +
        '</div>' +
      '</div>' +
      (ctas.length ? '<div class="mc-ctas">' + ctas.map(function (c) {
        return '<a class="' + c.cls + '" href="' + esc(c.href) + '"' + (ext(c.href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(c.label) + ' ' + (ext(c.href) ? '\u2197' : '\u2192') + '</a>';
      }).join('') + '</div>' : '') +
      '<div class="mc-notewrap">' +
        '<button type="button" class="mc-notetoggle" data-act="note" data-id="' + it.id + '">' + (open ? 'Hide note' : 'Add a note') + '</button>' +
        (open ? '<textarea class="mc-note" data-noteid="' + it.id + '" rows="2" placeholder="Anything you want to remember about this step">' + esc(noteVal) + '</textarea>' : '') +
      '</div></div>';
  }

  function listHtml() {
    var d = D(), a = st.answers, secs = sections(), t = tally(secs);
    var who = d.whoLabel[a.who] || '';
    var dest = d.destLabel[a.dest] || 'Australia or New Zealand';
    var ageBits = (a.ages || []).map(function (x) { return d.ageLabel[x]; }).filter(Boolean).join(', ');
    var bits = [];
    if (who) bits.push(who);
    if (a.pet === true) bits.push('bringing a pet');
    if (ageBits) bits.push('children ' + ageBits);

    var nav = '<nav class="mc-nav-sec" aria-label="Your sections"><span class="mc-navk">Your sections</span>' +
      secs.map(function (sec, i) {
        var c = 0;
        sec.items.forEach(function (it) { var v = st.statuses[it.id]; if (v === 'done' || v === 'revisit') c++; });
        return '<a href="#' + sec.id + '"><span class="n">' + (i + 1 < 10 ? '0' + (i + 1) : (i + 1)) + '</span>' +
          '<span class="t">' + esc(sec.title) + '</span><span class="c">' + c + '/' + sec.items.length + '</span></a>';
      }).join('') + '</nav>';

    var body = secs.map(function (sec) {
      /* Drawings mark STATES and STEPS, small. A section mark at 72px is what these
         files were always right for — the same art fails at hero scale. */
      var secIcon = {
        'the-move': 'before-you-leave',
        money: 'money-tax-and-banking',
        housing: 'driving-and-licences',
        preparation: 'packing-and-shipping',
        children: 'schools-and-education',
        partner: 'partner-registration',
        pets: 'bringing-your-pet',
        'settling-in': 'settling-in'
      }[sec.id];
      var secIconHtml = secIcon ? '<img src="assets/heroes/' + secIcon + '.svg" alt="" width="72" height="54" style="width:72px;height:auto;float:right;margin-left:16px">' : '';
      return '<section id="' + sec.id + '" class="mc-sec" data-screen-label="' + esc(sec.title) + '">' +
        secIconHtml + eyebrow(sec.eyebrow) + '<h2>' + esc(sec.title) + '</h2>' +
        (sec.intro ? '<p class="mc-sintro">' + esc(sec.intro) + '</p>' : '') +
        '<div class="mc-items">' + sec.items.map(itemHtml).join('') + '</div>' +
        '</section>';
    }).join('');

    var complete = t.total > 0 && t.considered === t.total;
    var done = complete ? '<section class="mc-done" data-screen-label="Where you have got to">' +
      '<span class="eyebrow light">Where you\u2019ve got to</span>' +
      '<h2>You\u2019re move-ready on the practical side</h2>' +
      '<p>You\u2019ve been through every question on your list. There will still be profession, employer and visa-specific steps ahead \u2014 but you now know what you\u2019re planning for, which is the hard part.</p>' +
      '<div class="mc-nextgrid">' + d.nextSteps(a.dest).map(function (s) {
        return '<a href="' + esc(s.href) + '"><span class="t">' + esc(s.title) + '</span><span class="l">' + esc(s.label) + ' \u2192</span></a>';
      }).join('') + '</div></section>' : '';

    return '<div class="mc-summary">' +
      '<div class="mc-sumleft">' + eyebrow('Your move') +
        '<h1>Moving to ' + esc(dest) + '</h1>' +
        '<p class="mc-sumline">' + esc(bits.join(' \u00b7 ')) + '</p>' +
        '<div class="mc-sumacts">' +
          '<button type="button" class="mc-b2" data-act="edit">Change my answers</button>' +
          '<button type="button" class="mc-b2" data-act="print">Print or save as PDF</button>' +
          '<button type="button" class="mc-b3" data-act="restart">Start again</button>' +
        '</div>' +
      '</div>' +
      '<div class="mc-sumright">' +
        '<div class="mc-prohead"><span class="mc-prolabel">' + t.considered + ' of ' + t.total + ' considered</span>' +
        '<span class="mc-prostatus">' + (t.done ? t.done + ' done' : '') + (t.done && t.revisit ? ' \u00b7 ' : '') + (t.revisit ? t.revisit + ' to revisit' : '') + '</span></div>' +
        '<div class="mc-pro" role="progressbar" aria-valuenow="' + t.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Checklist progress"><i style="width:' + t.pct + '%"></i></div>' +
        '<p class="mc-pronote">Mark anything you can\u2019t answer yet as <strong>revisit</strong> \u2014 almost nobody knows all of this at the start.</p>' +
      '</div></div>' +
      '<div class="mc-cols">' + nav + '<div class="mc-main">' + body + done + '</div></div>';
  }

  /* ---------------- validation ---------------- */
  function missing() {
    var a = st.answers, m = [];
    if (st.step === 1 && !a.dest) m.push('where you\u2019re considering');
    if (st.step === 2) {
      if (!a.who) m.push('who\u2019s moving');
      if (a.pet === null) m.push('whether you\u2019re bringing a pet');
      if ((a.who === 'parentKids' || a.who === 'familyKids') && !(a.ages || []).length) m.push('your children\u2019s ages');
    }
    return m;
  }

  /* ---------------- events ---------------- */
  app.addEventListener('click', function (e) {
    var p = e.target.closest('[data-pick]');
    if (p) {
      var k = p.getAttribute('data-pick'), v = p.getAttribute('data-v');
      st.answers[k] = v;
      if (k === 'who' && v !== 'parentKids' && v !== 'familyKids') st.answers.ages = [];
      st.err = '';
      if (k === 'dest') { st.step = 2; moveFocus = true; }
      save(); render(); return;
    }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'pet') {
      st.answers.pet = b.getAttribute('data-v') === 'yes'; st.err = ''; save(); render();
    } else if (act === 'age') {
      var id = b.getAttribute('data-v'), list = (st.answers.ages || []).slice(), i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1); else list.push(id);
      st.answers.ages = list; st.err = ''; save(); render();
    } else if (act === 'build') {
      var m = missing();
      if (m.length) { st.err = 'Still needed: ' + m.join(', ') + '.'; render(); return; }
      st.step = 3; st.err = ''; moveFocus = true; save(); render();
    } else if (act === 'back') {
      st.step = 1; st.err = ''; moveFocus = true; save(); render();
    } else if (act === 'edit') {
      st.step = 2; st.err = ''; moveFocus = true; save(); render();
    } else if (act === 'print') {
      window.print();
    } else if (act === 'restart') {
      if (!window.confirm('Clear your answers, ticks and notes and start again?')) return;
      try { localStorage.removeItem(LSK); } catch (er) {}
      st = { step: 1, answers: assign({}, A0), err: '', statuses: {}, notes: {}, openNotes: {} };
      moveFocus = true; render();
    } else if (act === 'status') {
      var sid = b.getAttribute('data-id'), sv = b.getAttribute('data-v');
      if (st.statuses[sid] === sv) delete st.statuses[sid]; else st.statuses[sid] = sv;
      save(); renderKeepScroll();
    } else if (act === 'note') {
      var nid = b.getAttribute('data-id');
      var wasOpen = !!st.openNotes[nid] || !!st.notes[nid];
      if (wasOpen) { st.openNotes[nid] = false; delete st.notes[nid]; }
      else st.openNotes[nid] = true;
      save(); renderKeepScroll(nid);
    }
  });

  // typing must never re-render — that would move the caret
  app.addEventListener('input', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-noteid');
    if (!id) return;
    st.notes[id] = e.target.value;
    save();
  });

  /* ---------------- render ---------------- */
  function render() {
    app.innerHTML = st.step === 3 ? listHtml() : (st.step === 2 ? step2() : step1());
    if (!moveFocus) return;
    moveFocus = false;
    var h = app.querySelector('.mc-qhead h2, .mc-summary h1');
    if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  }
  // ticking an item must not throw the reader back to the top of the page
  function renderKeepScroll(focusNoteId) {
    var y = window.scrollY;
    app.innerHTML = listHtml();
    window.scrollTo(0, y);
    if (focusNoteId) {
      var ta = app.querySelector('[data-noteid="' + focusNoteId + '"]');
      if (ta) ta.focus();
    }
  }

  /* ---------------- boot ---------------- */
  try {
    var raw = localStorage.getItem(LSK);
    if (raw) {
      var dr = JSON.parse(raw);
      var fresh = dr && (!dr.ts || (Date.now() - dr.ts) < MAXAGE);
      if (dr && dr.answers && fresh) {
        st.answers = assign({}, A0, dr.answers);
        st.statuses = dr.statuses || {};
        st.notes = dr.notes || {};
        st.step = st.answers.who && st.answers.dest ? (dr.step === 1 || dr.step === 2 ? dr.step : 3) : (st.answers.dest ? 2 : 1);
      } else if (!fresh) {
        localStorage.removeItem(LSK);
      }
    }
  } catch (e) {}
  try {
    var qd = (location.search.match(/[?&]destination=([^&]+)/) || [])[1];
    if (qd) {
      var v = decodeURIComponent(qd);
      if (['au', 'nz', 'both'].indexOf(v) >= 0 && !st.answers.who) { st.answers.dest = v; st.step = 2; }
    }
  } catch (e) {}

  if (!D()) {
    var t = setInterval(function () { if (D()) { clearInterval(t); render(); } }, 120);
    setTimeout(function () { clearInterval(t); }, 8000);
  }
  render();
})();
