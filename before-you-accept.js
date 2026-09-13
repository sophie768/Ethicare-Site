/* ================================================================
   ETHICARE RESOURCING — Before you accept the job (/before-you-accept)
   Vanilla controller. All checklist content lives in
   before-you-accept-data.js — never in here.
   Answers save to localStorage. ?destination=au|nz preselects.
   Print styles turn the confirmed list and the open questions into
   the document you take into the conversation.
   ================================================================ */
(function () {
  'use strict';

  var app = document.getElementById('oc-app');
  if (!app) return;

  var LSK = 'ethicare_offer_check_v1';
  var MAX_AGE = 180 * 24 * 60 * 60 * 1000;   // an offer decision is short-lived; six months is generous
  var S0 = { dest: 'au', done: {}, showAll: false };
  var st = assign({}, S0);
  var copied = false, copyTimer = null;

  function assign(t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; } return t; }
  function D() { return window.ETHICARE_OFFER_CHECK || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isNZ() { return st.dest === 'nz'; }
  function retirement() { return isNZ() ? 'KiwiSaver' : 'superannuation'; }
  function fill(s) { return String(s == null ? '' : s).split('{{retirement}}').join(retirement()); }
  function save() { try { localStorage.setItem(LSK, JSON.stringify({ st: st, ts: Date.now() })); } catch (e) {} }
  function set(patch) { assign(st, patch); save(); render(); }
  function groups() { return D().groups; }
  function count() {
    var g = groups(), total = 0, done = 0;
    for (var i = 0; i < g.length; i++) for (var j = 0; j < g[i].items.length; j++) { total++; if (st.done[g[i].items[j].id]) done++; }
    return { total: total, done: done, open: total - done };
  }

  /* Everything left unticked that carries a question becomes one, sharpest first. */
  function outstanding() {
    var g = groups(), out = [];
    for (var i = 0; i < g.length; i++) {
      for (var j = 0; j < g[i].items.length; j++) {
        var it = g[i].items[j];
        if (!st.done[it.id] && it.q) out.push({ q: fill(it.q), from: g[i].title, p: it.p || 3 });
      }
    }
    return out.sort(function (a, b) { return a.p - b.p; });
  }
  function topN() { return Math.max(1, D().questionCount || 5); }

  /* ---------------- view ---------------- */
  function destRow() {
    var h = '<div class="oc-destrow" data-print-hide><span class="oc-destk">This role is in</span>';
    var opts = [{ v: 'au', l: 'Australia' }, { v: 'nz', l: 'New Zealand' }];
    for (var i = 0; i < opts.length; i++) {
      var on = st.dest === opts[i].v;
      h += '<button type="button" class="oc-pill' + (on ? ' is-sel' : '') + '" data-dest="' + opts[i].v + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + opts[i].l + '</button>';
    }
    return h + '</div>';
  }

  function progress() {
    var c = count(), pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
    var head = c.done === c.total ? 'Every point confirmed' : c.done + ' of ' + c.total + ' confirmed';
    var note = c.done === 0
      ? 'Work down the list. Anything you leave becomes a question you can take back to the employer.'
      : (c.done === c.total ? 'You know what you are being offered.' : c.open + ' still to confirm with your employer.');
    return '<div class="oc-prog"><div><p class="oc-progh">' + esc(head) + '</p><p class="oc-progn">' + esc(note) + '</p></div>'
      + '<div class="oc-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Points confirmed"><i style="width:' + pct + '%"></i></div>'
      + '<div class="oc-progacts" data-print-hide><button type="button" class="oc-b3" data-print>Print or save as PDF</button>'
      + (c.done ? '<button type="button" class="oc-link" data-reset>Clear my ticks</button>' : '') + '</div></div>';
  }

  function itemHTML(it) {
    var on = !!st.done[it.id];
    var h = '<div class="oc-item' + (on ? ' is-done' : '') + '">'
      + '<button type="button" class="oc-tog" data-toggle="' + esc(it.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">'
      + '<i aria-hidden="true">' + (on ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : '') + '</i>'
      + '<span>' + esc(fill(it.title)) + '</span></button>';
    if (it.note) h += '<p class="oc-in">' + esc(fill(it.note)) + '</p>';
    if (it.ctaHref) h += '<a class="oc-cta" href="' + esc(it.ctaHref) + '">' + esc(it.ctaLabel || 'Read more') + ' &rarr;</a>';
    return h + '</div>';
  }

  function groupHTML(g) {
    var done = 0;
    for (var i = 0; i < g.items.length; i++) if (st.done[g.items[i].id]) done++;
    var h = '<section class="oc-group" id="' + esc(g.id) + '" data-screen-label="' + esc(g.title) + '">'
      + '<div class="oc-ghead"><h2>' + esc(g.title) + '</h2><span class="oc-gcount">' + done + ' of ' + g.items.length + '</span></div>'
      + '<p class="oc-gintro">' + esc(g.intro) + '</p>';
    for (var j = 0; j < g.items.length; j++) h += itemHTML(g.items[j]);
    return h + '</section>';
  }

  function askHTML() {
    var list = outstanding(), n = topN();
    if (!list.length) {
      return '<div class="oc-ask"><span class="eyebrow light">Nothing outstanding</span>'
        + '<h2>You know what you are signing</h2>'
        + '<p class="oc-askp">You have confirmed every point on this list. That is a rarer position than you might think, and a good one to be in before you sign anything &mdash; keep a copy for your own records.</p>'
        + '<div class="oc-askacts" data-print-hide><a class="oc-b1" href="/contact">Talk it through with us</a></div></div>';
    }
    var shown = st.showAll ? list : list.slice(0, n);
    var head = list.length <= n
      ? (list.length === 1 ? 'One thing you still need to ask' : list.length + ' things you still need to ask')
      : n + ' things you still need to ask';
    var h = '<div class="oc-ask"><span class="eyebrow light">Take these with you</span>'
      + '<h2>' + esc(head) + '</h2>'
      + '<p class="oc-askp">Built from what you have not yet confirmed, sharpest first. Copy them into an email, or take them into the call as they are.</p>'
      + '<div class="oc-qs">';
    for (var i = 0; i < shown.length; i++) {
      h += '<div class="oc-q"><span class="oc-qn">' + (i + 1) + '</span><div><p class="oc-qt">' + esc(shown[i].q) + '</p><p class="oc-qf">' + esc(shown[i].from) + '</p></div></div>';
    }
    h += '</div><div class="oc-askacts" data-print-hide><button type="button" class="oc-b1' + (copied ? ' is-copied' : '') + '" data-copy>' + (copied ? 'Copied' : 'Copy my questions') + '</button>';
    if (list.length > n) h += '<button type="button" class="oc-b2" data-more>' + (st.showAll ? 'Show the top ' + n + ' only' : 'Show all ' + list.length) + '</button>';
    h += '<a class="oc-b2" href="/guides/negotiating-your-offer">How to raise them</a></div></div>';
    return h;
  }

  function view() {
    if (!D()) {
      return '<div class="oc-group"><h2>Loading the checklist&hellip;</h2><p class="oc-gintro">If this stays on screen, the checklist data has not loaded. <a href="/guides/negotiating-your-offer">Negotiating your offer</a> covers the same ground in writing.</p></div>';
    }
    var g = groups(), h = destRow() + progress();
    for (var i = 0; i < g.length; i++) h += groupHTML(g[i]);
    return h + askHTML();
  }

  function render() {
    var a = document.activeElement;
    var keep = a && app.contains(a) ? a.getAttribute('data-toggle') : null;
    app.innerHTML = view();
    if (keep) {
      var el = app.querySelector('[data-toggle="' + keep + '"]');
      if (el) el.focus();
    }
  }

  /* ---------------- events ---------------- */
  function copyQuestions() {
    var list = outstanding(), n = topN();
    var take = st.showAll ? list : list.slice(0, n);
    var text = take.map(function (q, i) { return (i + 1) + '. ' + q.q; }).join('\n');
    var done = function () {
      copied = true; render();
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () { copied = false; render(); }, 2400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); done();
    } catch (e) {}
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('button') : null;
    if (!el || !app.contains(el)) return;

    var id = el.getAttribute('data-toggle');
    if (id) {
      var next = assign({}, st.done);
      if (next[id]) delete next[id]; else next[id] = true;
      return set({ done: next });
    }
    var dest = el.getAttribute('data-dest');
    if (dest) return set({ dest: dest });
    if (el.hasAttribute('data-more')) return set({ showAll: !st.showAll });
    if (el.hasAttribute('data-copy')) return copyQuestions();
    if (el.hasAttribute('data-print')) return window.print();
    if (el.hasAttribute('data-reset')) return set({ done: {}, showAll: false });
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
  if (q) st.dest = q[1].charAt(0) === 'a' ? 'au' : 'nz';

  if (!D()) {
    var tries = 0, poll = setInterval(function () {
      if (D() || ++tries > 60) { clearInterval(poll); render(); }
    }, 60);
  }
  render();
})();
