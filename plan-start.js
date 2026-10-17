/* Plan Ethicare: getting started (9 Oct 2026).
   Sophie: "look at the layouts for capital one … it can be much clearer than this."
   The answers strip asked four things at once in a row of drop-downs. This asks them one at a
   time, in a single column, with a progress line and one Continue button, the way Capital One's
   eligibility check does. Answers are held here until the last question and written in ONE
   EthicareContext.write(), so move.js repaints once rather than jumping the page about on every
   click. Someone who already has answers sees a short summary of them instead, with a way back
   into the questions. Nothing is required: every question can be skipped, and "Skip to the
   eight stages" goes straight to the plan. The answers strip (#ctx-strip) stays in the page for
   move.js, hidden by CSS on this page only. */
(function () {
  var ctx = window.EthicareContext;
  var root = document.querySelector('[data-ps]');
  if (!ctx || !root) return;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function profs() {
    var cat = window.ETHICARE_PROFESSIONS, out = [];
    try { var l = cat && typeof cat.listAll === 'function' ? cat.listAll() : []; for (var i = 0; i < l.length; i++) out.push({ v: l[i].key, l: l[i].label, g: l[i].group || 'Other' }); } catch (e) {}
    return out;
  }
  var J = (window.ETHICARE_JOURNEY || []);

  var Q = [
    { f: 'dest', t: 'Where are you thinking of moving?', type: 'tiles',
      o: [['nz', 'New Zealand'], ['au', 'Australia'], ['both', 'Not sure yet', 'I want to compare the two']] },
    { f: 'profession', t: 'What is your profession?', h: 'So we show you the right registration body and pay.', type: 'select' },
    { f: 'household', t: 'Who is coming with you?', h: 'Schools, partner work and visas depend on it.', type: 'tiles',
      o: (ctx.HH || []).map(function (x) { return [x.value, x.label]; }) },
    { f: 'stage', t: 'Where are you up to?', h: 'We open your plan at this stage. Every other stage stays open to you.', type: 'tiles',
      o: J.map(function (x) { return [x.id, x.where]; }) },
    /* name last (Sophie, 9 Oct 2026): asked first, it feels like signing up */
    { f: 'name', t: 'Last one: what should we call you?', h: 'Just your first name, so your plan can greet you. It stays on this device.', type: 'text', optional: true }
  ];

  var A = {}, i = 0, mode = '';

  function current() {
    var p = ctx.read() || {};
    return { name: ctx.first ? ctx.first() : '', dest: ctx.destMode ? ctx.destMode() : '', profession: ctx.profession(), household: ctx.household ? ctx.household() : '', stage: ctx.stage() };
  }

  function label(f, v) {
    var q = Q.filter(function (x) { return x.f === f; })[0];
    if (!v || !q) return '';
    if (f === 'profession') { var p = profs().filter(function (x) { return x.v === v; })[0]; return p ? p.l : ''; }
    if (q.o) { var o = q.o.filter(function (x) { return x[0] === v; })[0]; return o ? (f === 'dest' && v === 'both' ? 'Comparing both countries' : o[1]) : ''; }
    return v;
  }

  /* ---- the questions -------------------------------------------------------------------- */
  function paintQ(focus) {
    var q = Q[i], v = A[q.f] || '', n = Q.length;
    var h = '<div class="ps-card" role="group" aria-labelledby="ps-q">'
      + '<div class="ps-prog"><span class="ps-step">Question ' + (i + 1) + ' of ' + n + '</span>'
      + '<span class="ps-bar" aria-hidden="true"><span style="width:' + Math.round(((i + 1) / n) * 100) + '%"></span></span></div>'
      + '<h3 class="ps-q" id="ps-q" tabindex="-1">' + esc(q.t) + '</h3>'
      + (q.h ? '<p class="ps-h">' + esc(q.h) + '</p>' : '');
    if (q.type === 'text') {
      h += '<label class="sr-only" for="ps-in">First name</label><input class="ps-in" id="ps-in" type="text" maxlength="40" autocomplete="given-name" value="' + esc(v) + '" placeholder="First name">';
    } else if (q.type === 'select') {
      var groups = {}, order = [];
      profs().forEach(function (p) { if (!groups[p.g]) { groups[p.g] = []; order.push(p.g); } groups[p.g].push(p); });
      h += '<label class="sr-only" for="ps-sel">Profession</label><div class="ps-selw"><select class="ps-sel" id="ps-sel"><option value="">Choose your profession</option>';
      order.forEach(function (g) { h += '<optgroup label="' + esc(g) + '">'; groups[g].forEach(function (p) { h += '<option value="' + esc(p.v) + '"' + (p.v === v ? ' selected' : '') + '>' + esc(p.l) + '</option>'; }); h += '</optgroup>'; });
      h += '</select></div>';
    } else {
      h += '<div class="ps-tiles' + (q.o.length > 4 ? ' is-long' : '') + '" role="radiogroup" aria-labelledby="ps-q">';
      q.o.forEach(function (o, k) {
        var on = o[0] === v;
        h += '<button type="button" class="ps-tile' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" tabindex="' + (on || (!v && k === 0) ? '0' : '-1') + '" data-v="' + esc(o[0]) + '">'
          + '<span class="ps-dot" aria-hidden="true"></span><span class="ps-tl">' + esc(o[1]) + (o[2] ? '<span class="ps-ts">' + esc(o[2]) + '</span>' : '') + '</span></button>';
      });
      h += '</div>';
    }
    var last = i === n - 1;
    h += '<div class="ps-acts">'
      + '<button type="button" class="ps-go" data-ps-next>' + (last ? 'Show my plan' : 'Continue') + ' <span aria-hidden="true">&rarr;</span></button>'
      + (i > 0 ? '<button type="button" class="ps-back" data-ps-back><span aria-hidden="true">&larr;</span> Back</button>' : '')
      + '<button type="button" class="ps-skip" data-ps-skipq>' + (q.optional ? 'Skip' : 'Skip this question') + '</button>'
      + '</div></div>'
      + '<p class="ps-out"><button type="button" data-ps-skipall>Skip to the eight stages</button> &middot; Your plan is saved in this browser and nothing is sent to us. To use it on another device, get your link at the bottom of the page.</p>';
    root.innerHTML = h;
    if (focus) { var el = root.querySelector('#ps-in') || root.querySelector('#ps-q'); try { el.focus({ preventScroll: true }); } catch (e) {} }
  }

  function grab() {
    var q = Q[i];
    if (q.type === 'text') { var t = root.querySelector('#ps-in'); A.name = t ? t.value.replace(/[<>]/g, '').trim().slice(0, 40) : ''; }
    if (q.type === 'select') { var s = root.querySelector('#ps-sel'); A.profession = s ? s.value : ''; }
  }

  function finish() {
    var patch = {};
    ['name', 'dest', 'profession', 'household', 'stage'].forEach(function (f) { if (A[f] !== undefined) patch[f] = A[f]; });
    ctx.write(patch);
    if (window.track) window.track('plan_start_done', {});
    paintSummary();
    var j = document.getElementById('journey');
    if (j) setTimeout(function () { j.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
  }

  /* ---- the summary, once there are answers -------------------------------------------- */
  function paintSummary() {
    mode = 'sum'; document.body.classList.remove('ps-asking'); document.body.classList.add('ps-done');
    var c = current(), first = c.name;
    var n = ctx.stageNumber ? ctx.stageNumber() : 0, nx = ctx.next ? ctx.next() : null;
    var chips = [label('dest', c.dest), label('profession', c.profession), label('household', c.household)].filter(Boolean);
    var stg = J.filter(function (x) { return x.id === c.stage; })[0];
    var h = '<h2 class="ps-hello">' + (first ? 'Hello ' + esc(first) + ', here is your plan.' : 'Here is your plan.') + '</h2>'
      + '<div class="ps-sum">'
      + (chips.length ? '<p class="ps-now-k">Your answers</p><ul class="ps-chips">' + chips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '')
      + (stg ? '<p class="ps-now"><span class="ps-now-k">You are at</span> Stage ' + n + ' of ' + J.length + ': <strong>' + esc(stg.there) + '</strong></p>' : '')
      + '<div class="ps-acts">'
      + '<a class="ps-go" href="#journey" data-ps-tojourney>' + (stg ? 'Open my stage' : 'See the eight stages') + ' <span aria-hidden="true">&rarr;</span></a>'
      + '<button type="button" class="ps-back" data-ps-edit>Change my answers</button>'
      + '</div></div>';
    root.innerHTML = h;
  }

  function ask(fromStart) {
    mode = 'ask'; document.body.classList.add('ps-asking'); document.body.classList.remove('ps-done');
    A = current(); i = 0; paintQ(!fromStart);
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button,a') : null; if (!t) return;
    if (t.classList.contains('ps-tile')) {
      A[Q[i].f] = t.getAttribute('data-v');
      [].forEach.call(root.querySelectorAll('.ps-tile'), function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
      return;
    }
    if (t.hasAttribute('data-ps-next')) { grab(); if (i < Q.length - 1) { i++; paintQ(true); } else finish(); return; }
    if (t.hasAttribute('data-ps-back')) { grab(); if (i > 0) { i--; paintQ(true); } return; }
    if (t.hasAttribute('data-ps-skipq')) { if (Q[i].f !== 'name') A[Q[i].f] = ''; else grab(); if (i < Q.length - 1) { i++; paintQ(true); } else finish(); return; }
    if (t.hasAttribute('data-ps-skipall')) { grab(); finish(); return; }
    if (t.hasAttribute('data-ps-edit')) { ask(false); var hero = document.querySelector('.pt-hero'); if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t.hasAttribute('data-ps-tojourney')) { e.preventDefault(); var j = document.getElementById('journey'); if (j) j.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  /* tiles behave as one radio group: arrows move and choose; Enter continues */
  root.addEventListener('keydown', function (e) {
    if (mode !== 'ask') return;
    var t = e.target;
    if (t.classList && t.classList.contains('ps-tile') && /^Arrow/.test(e.key)) {
      var all = [].slice.call(root.querySelectorAll('.ps-tile')), k = all.indexOf(t);
      k = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? (k + 1) % all.length : (k - 1 + all.length) % all.length;
      e.preventDefault(); all[k].focus(); all[k].click(); return;
    }
    if (e.key === 'Enter' && (t.id === 'ps-in')) { e.preventDefault(); var b = root.querySelector('[data-ps-next]'); if (b) b.click(); }
  });
  /* "Change my answers" anywhere else on the page (move.js cards) opens these questions */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-editanswers]') : null; if (!t) return;
    e.preventDefault(); e.stopImmediatePropagation();
    ask(false); var hero = document.querySelector('.pt-hero'); if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);
  ctx.onChange(function () { if (mode === 'sum') paintSummary(); });

  root.hidden = false;
  if (ctx.has()) paintSummary(); else ask(true);
})();
