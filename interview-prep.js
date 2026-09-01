/* ================================================================
   ETHICARE RESOURCING — Interview & application prep (/interview-prep)
   Vanilla controller. All content lives in interview-prep-data.js.
   Answers save to localStorage. ?destination=au|nz preselects.
   ================================================================ */
(function () {
'use strict';
var D = window.IPData;
if (!D) { return; }

var KEY = 'ethicare-interview-prep-v1';
var S = { dest: 'nz', profession: 'nursing', done: {}, star: {}, practised: {}, prac: {}, open: {}, wopen: {}, check: {} };

var RATINGS = [{ v: 'ready', label: 'Ready' }, { v: 'work', label: 'Needs work' }, { v: 'stuck', label: 'No idea yet' }];
var CHECKS = [
  'One real situation, not a general policy',
  'Clear what I did, not what the team did',
  'Says how it ended \u2014 including if it went badly',
  'Nothing in it could identify a patient'
];

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function $(sel) { return document.querySelector(sel); }

function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p.dest === 'au' || p.dest === 'nz') { S.dest = p.dest; }
      if (p.profession) { S.profession = p.profession; }
      ['done', 'star', 'practised', 'prac', 'check'].forEach(function (k) { if (p[k] && typeof p[k] === 'object') { S[k] = p[k]; } });
    }
  } catch (e) {}
  var q = (location.search.match(/[?&]destination=(au|nz)/) || [])[1];
  if (q) { S.dest = q; }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      dest: S.dest, profession: S.profession, done: S.done,
      star: S.star, practised: S.practised, prac: S.prac, check: S.check
    }));
  } catch (e) {}
}

/* ---------------- destination + progress ---------------- */

function renderDest() {
  var el = $('#ip-dest');
  if (!el) { return; }
  el.innerHTML = [['nz', 'New Zealand'], ['au', 'Australia']].map(function (o) {
    return '<button type="button" class="ip-pill' + (S.dest === o[0] ? ' on' : '') + '" data-dest="' + o[0] + '"' +
      (S.dest === o[0] ? ' aria-current="true"' : '') + '>' + o[1] + '</button>';
  }).join('');
}

var _dCache = {};
function plan() {
  if (!_dCache[S.dest]) { _dCache[S.dest] = D.data(S.dest); }
  return _dCache[S.dest];
}

function renderProgress() {
  var groups = plan(), total = 0, done = 0;
  groups.forEach(function (g) {
    g.items.forEach(function (it) { total++; if (S.done[it.id]) { done++; } });
  });
  var pct = total ? Math.round((done / total) * 100) : 0;
  var head, note;
  if (done === 0) { head = 'Nothing ticked yet'; note = 'Work down the list. Anything you cannot tick is a thing to sort before you apply, not a reason to wait.'; }
  else if (done < total * 0.4) { head = done + ' of ' + total + ' done'; note = 'Early days. The CV and the referees are the two that hold applications up most.'; }
  else if (done < total * 0.8) { head = done + ' of ' + total + ' done'; note = 'Most of the way through the paperwork. The examples below are what the interview actually turns on.'; }
  else if (done < total) { head = done + ' of ' + total + ' done'; note = 'Close. Whatever is left unticked is worth a conversation with your consultant.'; }
  else { head = 'All ' + total + ' done'; note = 'You are ready. Print this and take your examples in with you.'; }
  var el = $('#ip-progress');
  if (!el) { return; }
  el.innerHTML = '<div><p class="ip-pg-h">' + esc(head) + '</p><p class="ip-pg-n">' + esc(note) + '</p></div>' +
    '<div class="ip-pg-track" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Readiness">' +
    '<div class="ip-pg-fill" style="width:' + pct + '%"></div></div>';
}

/* ---------------- checklist ---------------- */

function renderChecklist() {
  var el = $('#ip-checklist');
  if (!el) { return; }
  el.innerHTML = plan().map(function (g) {
    var total = g.items.length, done = 0;
    g.items.forEach(function (it) { if (S.done[it.id]) { done++; } });
    return '<section class="ip-card" id="' + esc(g.id) + '" data-screen-label="' + esc(g.title) + '">' +
      '<div class="ip-ch"><span class="ip-when">' + esc(g.when) + '</span><span class="ip-count">' + done + ' of ' + total + '</span></div>' +
      '<h2>' + esc(g.title) + '</h2><p class="ip-intro">' + esc(g.intro) + '</p>' +
      g.items.map(function (it) {
        var on = !!S.done[it.id];
        return '<div class="ip-row"><button type="button" class="ip-box' + (on ? ' on' : '') + '" data-done="' + esc(it.id) + '" aria-pressed="' + on + '"><span aria-hidden="true">' + (on ? '\u2713' : '') + '</span><span class="ip-sr">' + esc(it.title) + '</span></button>' +
          '<div><p class="ip-it' + (on ? ' on' : '') + '">' + esc(it.title) + '</p>' +
          (it.note ? '<p class="ip-note">' + esc(it.note) + '</p>' : '') +
          (it.ctaHref ? '<a class="ip-cta" href="' + esc(it.ctaHref) + '">' + esc(it.ctaLabel).replace(/\s+→$/, '\u00a0→') + '</a>' : '') +
          '</div></div>';
      }).join('') + '</section>';
  }).join('');
}

/* ---------------- worked examples ---------------- */

var _wCache = {};
function workedAll() {
  if (!_wCache[S.dest]) {
    var m = {}, a = D.worked(S.dest), b = D.workedMore(S.dest), k;
    for (k in b) { if (Object.prototype.hasOwnProperty.call(b, k)) { m[k] = b[k]; } }
    for (k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) { m[k] = a[k]; } }
    _wCache[S.dest] = m;
  }
  return _wCache[S.dest];
}
function findWorked(key) {
  if (!key) { return null; }
  return workedAll()[key] || null;
}
function workedHtml(ex, dark) {
  return '<div class="ip-ex' + (dark ? ' dk' : '') + '">' +
    '<p class="ip-ex-k">How someone else answered it</p>' +
    '<p class="ip-ex-s">' + esc(ex.setting) + '</p>' +
    '<div class="ip-ex-b">' + ex.beats.map(function (b) {
      return '<div><p class="ip-ex-l">' + esc(b[0]) + '</p><p class="ip-ex-t">' + esc(b[1]) + '</p></div>';
    }).join('') + '</div>' +
    (ex.why ? '<p class="ip-ex-w"><strong>Why it works</strong> \u2014 ' + esc(ex.why) + '</p>' : '') +
    '<p class="ip-ex-f">Not yours to use. The situation belongs to someone in another country and another specialty \u2014 take the shape of it and put your own case in.</p></div>';
}

/* ---------------- STAR bank ---------------- */

function renderStar() {
  var el = $('#ip-star');
  if (!el) { return; }
  el.innerHTML = D.starList().map(function (s) {
    var v = S.star[s.id] || {};
    var ex = findWorked(s.ex);
    var open = !!S.wopen['star_' + s.id];
    var parts = [['sit', 'The situation', 'Where, when, what was happening', 2], ['act', 'What I did', 'You, not the team', 2], ['res', 'How it ended', 'Including if it went badly', 1]];
    return '<div class="ip-star-c"><p class="ip-tag">' + esc(s.tag) + '</p><p class="ip-prompt">' + esc(s.prompt) + '</p>' +
      '<div class="ip-star-f">' + parts.map(function (p) {
        return '<div><label class="ip-lbl" for="star-' + s.id + '-' + p[0] + '">' + esc(p[1]) + '</label>' +
          '<textarea id="star-' + s.id + '-' + p[0] + '" rows="' + p[3] + '" placeholder="' + esc(p[2]) + '" data-star="' + s.id + '" data-part="' + p[0] + '">' + esc(v[p[0]] || '') + '</textarea></div>';
      }).join('') + '</div>' +
      (ex ? '<button type="button" class="ip-link lime" data-wopen="star_' + s.id + '">' + (open ? 'Hide the example' : 'See how someone else answered this') + '</button>' : '') +
      (ex && open ? workedHtml(ex, true) : '') + '</div>';
  }).join('');
}

/* ---------------- question bank ---------------- */

function qCardHtml(q, prefix) {
  var id = prefix ? prefix + '_' + q.id : q.id;
  var cur = S.practised[id] || '';
  var flagged = cur === 'work' || cur === 'stuck';
  var ex = flagged ? findWorked(id) : null;
  var wOpen = !!S.wopen[id];
  var open = !!S.open[id];
  var checks = S.check[id] || {};
  return '<div class="ip-q"><p class="ip-q-t' + (cur === 'ready' ? ' done' : '') + '">' + esc(q.q) + '</p>' +
    '<p class="ip-note"><strong>A strong answer covers</strong> \u2014 ' + esc(q.a) + '</p>' +
    '<div class="ip-rate">' + RATINGS.map(function (o) {
      return '<button type="button" class="ip-chip ' + o.v + (cur === o.v ? ' on' : '') + '" data-rate="' + id + '" data-val="' + o.v + '" aria-pressed="' + (cur === o.v) + '">' + o.label + '</button>';
    }).join('') + '</div>' +
    '<div class="ip-qa"><button type="button" class="ip-link" data-open="' + id + '">' + (open ? 'Hide my answer' : 'Practise this answer') + '</button>' +
    (ex ? '<button type="button" class="ip-link fern" data-wopen="' + id + '">' + (wOpen ? 'Hide the example' : 'See how someone else answered this') + '</button>' : '') + '</div>' +
    (ex && wOpen ? workedHtml(ex, false) : '') +
    (open ? '<div class="ip-prac"><label class="ip-sr" for="prac-' + id + '">Your answer</label>' +
      '<textarea id="prac-' + id + '" rows="5" placeholder="Say it out loud first, then type roughly what you said. Leave out anything that could identify a patient." data-prac="' + id + '">' + esc(S.prac[id] || '') + '</textarea>' +
      '<p class="ip-check-h">Read it back against these four. They are what a panel is listening for.</p>' +
      '<div class="ip-checks">' + CHECKS.map(function (c, i) {
        var on = !!checks[i];
        return '<label class="ip-check' + (on ? ' on' : '') + '"><input type="checkbox" data-check="' + id + '" data-i="' + i + '"' + (on ? ' checked' : '') + '><span>' + c + '</span></label>';
      }).join('') + '</div></div>' : '') + '</div>';
}

function renderQuestions() {
  var b = bank();
  var sel = $('#ip-prof');
  if (sel && !sel.dataset.built) {
    sel.innerHTML = D.professions().map(function (o) {
      return '<option value="' + o.value + '"' + (o.value === S.profession ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
    sel.dataset.built = '1';
  }
  if (sel) { sel.value = S.profession; }

  var el = $('#ip-core');
  if (el) {
    el.innerHTML = '<h3>Asked of everyone</h3><p class="ip-intro">Whatever your profession, prepare for these.</p>' +
      b.core.map(function (q) { return qCardHtml(q, null); }).join('');
  }

  var keys = S.profession === 'all'
    ? D.professions().filter(function (p) { return p.value !== 'all'; }).map(function (p) { return p.value; })
    : [S.profession];
  var labels = {};
  D.professions().forEach(function (p) { labels[p.value] = p.label; });
  var pel = $('#ip-prof-qs');
  if (pel) {
    pel.innerHTML = keys.map(function (k) {
      var items = b.byProf[k] || b.byProf.other;
      return '<div class="ip-card"><h3>' + esc(labels[k] || 'Your profession') + '</h3>' +
        items.map(function (q) { return qCardHtml(q, k); }).join('') + '</div>';
    }).join('');
  }
  renderWeak();
}

/* ---------------- flagged summary ---------------- */

function weakSpots() {
  var b = bank();
  var keys = S.profession === 'all'
    ? D.professions().filter(function (p) { return p.value !== 'all'; }).map(function (p) { return p.value; })
    : [S.profession];
  var out = [];
  b.core.forEach(function (q) {
    var v = S.practised[q.id];
    if (v === 'work' || v === 'stuck') { out.push({ q: q.q, v: v }); }
  });
  keys.forEach(function (k) {
    (b.byProf[k] || b.byProf.other).forEach(function (q) {
      var v = S.practised[k + '_' + q.id];
      if (v === 'work' || v === 'stuck') { out.push({ q: q.q, v: v }); }
    });
  });
  return out;
}

function renderWeak() {
  var el = $('#ip-weak');
  if (!el) { return; }
  var w = weakSpots();
  if (!w.length) { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = '<p class="ip-eyebrow">Bring these to your consultant</p>' +
    '<h3>' + w.length + (w.length === 1 ? ' question to work on' : ' questions to work on') + '</h3>' +
    '<p class="ip-intro">Everything you have flagged, in one list. Talking three of these through with someone is worth more than reading the whole page again.</p>' +
    '<div class="ip-weak-l">' + w.map(function (x, i) {
      return '<div class="ip-weak-i"><span class="ip-n">' + (i + 1 < 10 ? '0' + (i + 1) : i + 1) + '</span><p>' + esc(x.q) + '</p>' +
        '<span class="ip-weak-t">' + (x.v === 'work' ? 'Needs work' : 'No idea yet') + '</span></div>';
    }).join('') + '</div>' +
    '<div class="ip-weak-a"><button type="button" class="btn btn-primary" id="ip-copy">Copy the list</button>' +
    '<a class="ip-link" href="/contact">Talk to the team &rarr;</a></div>';
}

/* ---------------- onward ---------------- */

function renderOnward() {
  var el = $('#ip-onward');
  if (!el) { return; }
  el.innerHTML = D.onward.map(function (o) {
    var href = o.href || (S.dest === 'nz' ? o.nz : o.au);
    return '<a class="ip-on" href="' + esc(href) + '"><p class="ip-on-q">' + esc(o.question) + '</p><p class="ip-on-l">' + esc(o.label) + '</p></a>';
  }).join('');
}

/* ---------------- render + events ---------------- */

var _bCache = {};
function bank() {
  if (!_bCache[S.dest]) { _bCache[S.dest] = D.questionBank(S.dest); }
  return _bCache[S.dest];
}

function renderAll() {
  renderDest(); renderProgress(); renderChecklist(); renderStar(); renderQuestions(); renderOnward();
}

document.addEventListener('click', function (e) {
  var t = e.target.closest ? e.target.closest('[data-dest],[data-done],[data-rate],[data-open],[data-wopen],#ip-copy,#ip-reset,#ip-print') : null;
  if (!t) { return; }
  if (t.dataset.dest) {
    if (S.dest === t.dataset.dest) { return; }
    S.dest = t.dataset.dest; save(); renderAll(); return;
  }
  if (t.dataset.done) {
    var k = t.dataset.done;
    if (S.done[k]) { delete S.done[k]; } else { S.done[k] = true; }
    save(); renderProgress(); renderChecklist(); return;
  }
  if (t.dataset.rate) {
    var id = t.dataset.rate, v = t.dataset.val;
    if (S.practised[id] === v) { delete S.practised[id]; } else { S.practised[id] = v; }
    save(); renderQuestions(); return;
  }
  if (t.dataset.open) {
    var o = t.dataset.open;
    S.open[o] = !S.open[o];
    renderQuestions(); return;
  }
  if (t.dataset.wopen) {
    var wk = t.dataset.wopen;
    S.wopen[wk] = !S.wopen[wk];
    if (wk.indexOf('star_') === 0) { renderStar(); } else { renderQuestions(); }
    return;
  }
  if (t.id === 'ip-print') { window.print(); return; }
  if (t.id === 'ip-reset') {
    if (!window.confirm('Clear everything you have ticked and written on this page?')) { return; }
    S.done = {}; S.star = {}; S.practised = {}; S.prac = {}; S.open = {}; S.wopen = {}; S.check = {};
    save(); renderAll(); return;
  }
  if (t.id === 'ip-copy') {
    var txt = weakSpots().map(function (x, i) { return (i + 1) + '. ' + x.q + ' (' + (x.v === 'work' ? 'needs work' : 'no idea yet') + ')'; }).join('\n');
    try {
      navigator.clipboard.writeText(txt);
      t.textContent = 'Copied';
      setTimeout(function () { t.textContent = 'Copy the list'; }, 1800);
    } catch (err) {}
  }
});

document.addEventListener('input', function (e) {
  var t = e.target;
  if (t.dataset && t.dataset.star) {
    var s = S.star[t.dataset.star] || (S.star[t.dataset.star] = {});
    s[t.dataset.part] = t.value;
    save(); return;
  }
  if (t.dataset && t.dataset.prac) { S.prac[t.dataset.prac] = t.value; save(); }
});

document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.id === 'ip-prof') { S.profession = t.value; save(); renderQuestions(); return; }
  if (t.dataset && t.dataset.check) {
    var c = S.check[t.dataset.check] || (S.check[t.dataset.check] = {});
    c[t.dataset.i] = t.checked;
    save();
    var lab = t.closest('.ip-check');
    if (lab) { lab.classList.toggle('on', t.checked); }
  }
});

load();
renderAll();
})();
