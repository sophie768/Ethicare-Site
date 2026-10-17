/* Register with Ethicare: one question at a time (9 Oct 2026).
   The form in register-interest.html is complete without this file: every question shows and it
   posts to Netlify Forms. This turns it into the Capital One pattern used on Plan Ethicare and the
   destination finder: one question, a progress line, Continue and Back. Answers the site already
   holds (profession, country, first name) are filled in and their questions skipped, with a Change
   link. On a successful-looking submit it remembers, on this device only, that the person has
   registered, so the homepage nudge and the tool prompts stop asking. form-safety.js does the
   actual sending. */
(function () {
  'use strict';
  var form = document.querySelector('.rg-form'); if (!form) return;
  var steps = [].slice.call(form.querySelectorAll('.rg-step'));
  var prog = form.querySelector('.rg-prog'), known = form.querySelector('.rg-known');
  var next = form.querySelector('.rg-next'), back = form.querySelector('.rg-back'), submit = form.querySelector('.rg-submit');
  var err = form.querySelector('.rg-err');
  var REG_KEY = 'ethicare_registered_v1';

  function val(name) {
    var els = form.elements[name]; if (!els) return '';
    if (els.length !== undefined && els.tagName !== 'SELECT') { for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value; return ''; }
    return (els.value || '').trim();
  }
  function setRadio(name, v) { var els = form.elements[name]; if (!els || !v) return; for (var i = 0; i < els.length; i++) els[i].checked = els[i].value === v; }

  /* where the person came from, for the team (?from=destination-finder etc.) */
  try { var m = /[?&]from=([a-z0-9-]+)/.exec(location.search); form.elements.source_page.value = m ? m[1] : (document.referrer ? new URL(document.referrer).pathname : ''); } catch (e) {}

  /* ---- seed from what the site already knows --------------------------------------------- */
  var C = window.EthicareContext, prefilled = [];
  try {
    if (C && C.read && C.read()) {
      var pk = C.profession && C.profession();
      if (pk) { var o = form.querySelector('#rg-prof option[data-key="' + pk + '"]'); if (o && pk !== 'other') { form.elements.profession.value = o.value; prefilled.push('profession'); } }
      var d = C.destMode && C.destMode(), dv = d === 'nz' ? 'New Zealand' : d === 'au' ? 'Australia' : d === 'both' ? 'Either' : '';
      if (dv) { setRadio('destination', dv); prefilled.push('destination'); }
      var f = C.first && C.first(); if (f && !form.elements.name.value) form.elements.name.value = f + ' ';
    }
  } catch (e) {}

  var order = steps.slice(), todo, k = 0;
  function key(s) { return s.getAttribute('data-step'); }
  function build(all) { todo = all ? order.slice() : order.filter(function (s) { return prefilled.indexOf(key(s)) < 0; }); k = 0; }
  build(false);

  var LABEL = { profession: function () { return val('profession'); }, destination: function () { var v = val('destination'); return v === 'Either' ? 'Either country' : v; } };
  function paintKnown() {
    var shown = prefilled.filter(function (p) { return todo.every(function (s) { return key(s) !== p; }); });
    if (!shown.length) { known.hidden = true; return; }
    known.hidden = false;
    known.innerHTML = 'Using what you told us: <strong>' + shown.map(function (p) { return String(LABEL[p]()).replace(/</g, '&lt;'); }).join(' &middot; ') + '</strong> <button type="button" data-rg-change>Change</button>';
  }

  function ok(s) {
    var n = key(s);
    if (n === 'contact') {
      var e = val('email');
      if (!val('name')) return 'Please add your name.';
      if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Please add an email address we can reply to.';
      return '';
    }
    return val(n) ? '' : 'Please choose an answer, or go back.';
  }
  function showErr(t) { err.textContent = t || ''; err.hidden = !t; }

  function paint(focus) {
    showErr('');
    steps.forEach(function (s) { s.hidden = todo[k] !== s; });
    var last = k === todo.length - 1;
    prog.hidden = false;
    prog.querySelector('.rg-n').textContent = 'Question ' + (k + 1) + ' of ' + todo.length;
    prog.querySelector('.rg-bar span').style.width = Math.round(((k + 1) / todo.length) * 100) + '%';
    next.hidden = last; submit.hidden = !last; back.hidden = k === 0;
    paintKnown();
    if (focus) { var q = todo[k].querySelector('input:not([type=radio]),select') || todo[k].querySelector('input[type=radio]'); try { q.focus({ preventScroll: true }); } catch (e) {} }
  }

  next.addEventListener('click', function () {
    var m = ok(todo[k]); if (m) { showErr(m); return; }
    if (k < todo.length - 1) { k++; paint(true); }
  });
  back.addEventListener('click', function () { if (k > 0) { k--; paint(true); } });
  known.addEventListener('click', function (e) { if (e.target.closest('[data-rg-change]')) { build(true); paint(true); } });
  /* a tile answer moves on by itself after a beat, the way people expect from a quiz */
  form.addEventListener('change', function (e) {
    if (e.target.type !== 'radio') return;
    showErr('');
    setTimeout(function () { if (todo[k] && todo[k].contains(e.target) && k < todo.length - 1) { k++; paint(true); } }, 220);
  });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file' && !next.hidden) { e.preventDefault(); next.click(); }
  });

  /* registered first; form-safety.js (loaded after this file) then sends */
  form.addEventListener('submit', function (e) {
    for (var i = 0; i < order.length; i++) {
      var m = ok(order[i]);
      if (m) { e.preventDefault(); e.stopImmediatePropagation(); k = Math.max(0, todo.indexOf(order[i])); if (todo.indexOf(order[i]) < 0) { build(true); k = order.indexOf(order[i]); } paint(true); showErr(m); return; }
    }
    try { localStorage.setItem(REG_KEY, String(Date.now())); } catch (er) {}
    try {
      if (C && C.write) {
        var sel = form.querySelector('#rg-prof option:checked'), pk = sel && sel.getAttribute('data-key');
        var dv = val('destination'), dm = dv === 'New Zealand' ? 'nz' : dv === 'Australia' ? 'au' : dv === 'Either' ? 'both' : undefined;
        var patch = {}; if (pk) patch.profession = pk; if (dm) patch.dest = dm;
        var nm = val('name').split(/\s+/)[0]; if (nm) patch.name = nm;
        C.write(patch);
      }
    } catch (er) {}
    try { if (window.track) window.track('register_submit', { from: form.elements.source_page.value || '' }); } catch (er) {}
  });

  paint(false);
})();
