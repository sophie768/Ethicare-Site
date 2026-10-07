/* ============================================================================
   Create my pack — the page (7 Oct 2026)

   Tick the guides you want, get them in one email. The pack itself lives in
   pack-core.js (shared with every "Add to my pack" button on the site); this file
   draws the catalogue, suggests a starter set from the answers strip, and sends.

   Sending, in order — the same shape as every other form since the safety net:
     1. Netlify Forms `my-pack`          the record (and the office notification)
        refused → /.netlify/functions/form-backup emails it to the office instead
     2. /.netlify/functions/send-pack    the candidate's email
     3. /.netlify/functions/capture      a `leads` row in Supabase, fire and forget
   The candidate is told "on its way" only when 1 or its backup succeeded.
   ============================================================================ */
(function () {
  'use strict';
  var ITEMS = window.ETHICARE_PACK_ITEMS || [], GROUPS = window.ETHICARE_PACK_GROUPS || [];
  var P = window.EthicarePack, C = window.EthicareContext;
  var root = document.getElementById('mp-app');
  if (!root || !P || !ITEMS.length) return;

  var BY = {}; ITEMS.forEach(function (i) { BY[i.id] = i; });
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  function ctx(fn) { try { return C && C[fn] ? C[fn]() : ''; } catch (e) { return ''; } }

  var view = ctx('destMode') || 'both';
  var hilite = '';

  /* ---- what fits this person ---- */
  function fits(i, v) { return v === 'both' || i.c === 'both' || i.c === v; }
  function suggestion() {
    var dest = ctx('destMode'), prof = ctx('profession'), hh = ctx('household');
    if (!dest) return [];
    return ITEMS.filter(function (i) {
      if (!fits(i, dest)) return false;
      if (i.both) return dest === 'both';
      if (i.prof) return !!prof && i.prof.indexOf(prof) !== -1;
      if (i.hh) return !!hh && i.hh.indexOf(hh) !== -1;
      return !!i.core;
    }).map(function (i) { return i.id; });
  }
  function describe() {
    var bits = [ctx('destName')], p = ctx('professionLabel'), h = ctx('householdPhrase');
    if (p) bits.push(p.toLowerCase());
    if (h) bits.push(h);
    return bits.filter(Boolean).join(', ');
  }

  /* ---- ?guide=<area> from the old /request-a-guide links ---- */
  (function () {
    var s = new URLSearchParams(location.search).get('guide');
    if (!s) return;
    var map = { 'new-zealand-national': 'moving-to-new-zealand', 'australia-national': 'moving-to-australia' };
    var slug = map[s] || s.replace(/[^a-z0-9-]/gi, '').toLowerCase().replace(/-new-zealand$/, '');
    if (!/^(south|western)-australia$/.test(slug)) slug = slug.replace(/-australia$/, '');
    var id = 'pdf-' + slug;
    if (BY[id]) { P.add(id); hilite = id; if (BY[id].c !== 'both' && view !== 'both' && view !== BY[id].c) view = BY[id].c; }
  })();

  /* ---- first visit: pre-tick what fits, if we know enough ---- */
  var note = '';
  if (!P.count()) {
    var s = suggestion();
    if (s.length) { P.set(s); note = 'We have ticked ' + s.length + ' guides for ' + esc(describe()) + '. Untick anything you do not need.'; }
  }

  /* ---- drawing ---- */
  var listEl = root.querySelector('[data-mp-list]');
  var toolsEl = root.querySelector('[data-mp-tools]');

  function drawTools() {
    var seg = [['nz', 'New Zealand'], ['au', 'Australia'], ['both', 'Both']].map(function (o) {
      return '<button type="button" data-view="' + o[0] + '" aria-pressed="' + (view === o[0]) + '">' + o[1] + '</button>';
    }).join('');
    var sug = suggestion();
    toolsEl.innerHTML = '<div class="mp-seg" role="group" aria-label="Show guides for">' + seg + '</div>' +
      (sug.length ? '<button type="button" class="mp-suggest" data-suggest>Tick the guides that fit my answers</button>' : '') +
      (note ? '<p class="mp-sugnote" role="status">' + note + '</p>' :
        (!ctx('destMode') ? '<p class="mp-sugnote">Answer the three questions above and we will tick the guides that fit, or tick as you go.</p>' : ''));
  }

  function row(i) {
    var on = P.has(i.id);
    var tag = view === 'both' && i.c !== 'both' ? '<span class="tag">' + i.c.toUpperCase() + '</span>' : '';
    return '<li class="mp-item' + (i.id === hilite ? ' hi' : '') + '" id="g-' + i.id + '">' +
      '<input type="checkbox" id="c-' + i.id + '" data-id="' + i.id + '"' + (on ? ' checked' : '') + '>' +
      '<label for="c-' + i.id + '"><span class="t">' + esc(i.t) + tag + '</span><span class="d">' + esc(i.d) + '</span></label>' +
      '<a class="open" href="' + esc(i.u) + '" target="_blank" rel="noopener">' + (i.pdf ? 'PDF' : 'Read') + '<span class="sr-only"> ' + esc(i.t) + '</span> &#8599;</a></li>';
  }
  function chip(i) {
    var on = P.has(i.id), nat = /^Moving to/.test(i.t);
    return '<label class="mp-chip' + (on ? ' on' : '') + (nat ? ' nat' : '') + (i.id === hilite ? ' hi' : '') + '" id="g-' + i.id + '" title="' + esc(i.d) + '">' +
      '<input type="checkbox" data-id="' + i.id + '"' + (on ? ' checked' : '') + '><span class="ck" aria-hidden="true"></span>' + esc(i.t) + '</label>';
  }

  function drawList() {
    var h = '';
    GROUPS.forEach(function (g) {
      var rows = ITEMS.filter(function (i) { return i.g === g[0] && fits(i, view) && (!i.both || view === 'both'); });
      if (!rows.length) return;
      var picked = rows.filter(function (i) { return P.has(i.id); }).length;
      h += '<section class="mp-group" aria-labelledby="h-' + g[0] + '"><h2 id="h-' + g[0] + '">' + esc(g[1]) +
        '<small>' + (picked ? picked + ' of ' + rows.length + ' ticked' : rows.length + ' guides') + '</small></h2>';
      if (g[0] === 'where') {
        h += '<p class="mp-sugnote" style="margin:0 0 10px">A relocation guide for every region, as a PDF.</p><div class="mp-chips">' + rows.map(chip).join('') + '</div>';
      } else {
        h += '<ul class="mp-list">' + rows.map(row).join('') + '</ul>';
      }
      h += '</section>';
    });
    listEl.innerHTML = h;
  }

  /* ---- the panel ---- */
  var pickedEl = root.querySelector('[data-mp-picked]');
  var countEl = root.querySelector('[data-mp-count]');
  function picked() { return P.list().map(function (id) { return BY[id]; }).filter(Boolean); }
  function drawPanel() {
    var p = picked();
    countEl.textContent = p.length ? p.length + ' guide' + (p.length === 1 ? '' : 's') + ' ticked' : 'Nothing ticked yet';
    pickedEl.innerHTML = p.length
      ? p.map(function (i) { return '<li><span>' + esc(i.t) + '</span><button type="button" data-rm="' + i.id + '" aria-label="Remove ' + esc(i.t) + '">&times;</button></li>'; }).join('')
      : '';
    pickedEl.hidden = !p.length;
    var empty = root.querySelector('[data-mp-empty]'); if (empty) empty.hidden = !!p.length;
  }

  function drawAll() { drawTools(); drawList(); drawPanel(); }
  drawAll();
  if (hilite) setTimeout(function () { var el = document.getElementById('g-' + hilite); if (el) el.scrollIntoView({ block: 'center' }); }, 120);

  /* ---- events ---- */
  root.addEventListener('change', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-id');
    if (!id) return;
    if (e.target.checked) P.add(id); else P.remove(id);
  });
  root.addEventListener('click', function (e) {
    var v = e.target.closest('[data-view]');
    if (v) { view = v.getAttribute('data-view'); note = ''; drawTools(); drawList(); return; }
    if (e.target.closest('[data-suggest]')) {
      var s = suggestion(), have = P.list();
      P.set(have.concat(s.filter(function (id) { return have.indexOf(id) === -1; })));
      view = ctx('destMode') || view;
      note = 'Ticked the guides for ' + esc(describe()) + '. Anything you had already ticked is still there.';
      drawAll(); return;
    }
    var rm = e.target.closest('[data-rm]');
    if (rm) { P.remove(rm.getAttribute('data-rm')); return; }
  });
  window.addEventListener('ethicare:pack', function () { drawList(); drawPanel(); });
  window.addEventListener('ethicare:context', function () { var d = ctx('destMode'); if (d) view = d; note = ''; drawAll(); });

  /* ---- sending ---- */
  var form = root.querySelector('form[name="my-pack"]');
  var errEl = root.querySelector('[data-mp-err]');
  function fail(html) { errEl.innerHTML = html; errEl.hidden = false; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errEl.hidden = true;
    var p = picked();
    if (!p.length) return fail('Tick at least one guide first.');
    if (!form.reportValidity()) return;

    var dest = ctx('destMode') || view;
    form.elements['destination'].value = dest === 'nz' ? 'New Zealand' : dest === 'au' ? 'Australia' : 'Comparing both';
    form.elements['profession'].value = ctx('professionLabel') || '';
    form.elements['household'].value = ctx('householdLabel') || '';
    form.elements['pack-count'].value = String(p.length);
    form.elements['pack-contents'].value = p.map(function (i) { return i.t + ' (' + i.u + ')'; }).join('\n');

    var btn = form.querySelector('.mp-go'); btn.disabled = true; btn.textContent = 'Sending…';
    var fd = new FormData(form), fields = {};
    fd.forEach(function (v, k) { if (typeof v === 'string') fields[k] = v; });
    var body = new URLSearchParams(fd).toString();

    function backup(status) {
      return fetch('/.netlify/functions/form-backup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: 'my-pack', fields: fields, page: location.pathname, status: status })
      }).then(function (r) { if (!r.ok) throw new Error('backup'); });
    }

    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .then(function (r) { return r.ok ? null : backup('HTTP ' + r.status); }, function () { return backup('network'); })
      .then(function () {
        var send = fetch('/.netlify/functions/send-pack', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fields.name || '', email: fields.email || '', phone: fields.phone || '',
            destination: dest === 'nz' || dest === 'au' ? dest : '',
            household: ctx('householdPhrase') || '', profession: fields.profession || '', timeline: fields.timeline || '',
            role_alerts: fields.role_alerts || '', quarterly_update: fields.quarterly_update || '',
            pack: fields['pack-contents'], 'bot-trap': fields['bot-field'] || ''
          })
        }).then(function (r) { return r.ok; }, function () { return false; });
        try {
          fetch('/.netlify/functions/capture', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
            body: JSON.stringify({
              kind: 'lead', source: 'my-pack', page: location.pathname, email: fields.email,
              profession: fields.profession, destination: fields.destination,
              payload: { name: fields.name, phone: fields.phone || '', timeline: fields.timeline, household: fields.household,
                pack: P.list(), role_alerts: fields.role_alerts === 'Yes', quarterly_update: fields.quarterly_update === 'Yes',
                role_alerts_wording: fields.role_alerts === 'Yes' ? fields.role_alerts_wording : '',
                quarterly_update_wording: fields.quarterly_update === 'Yes' ? fields.quarterly_update_wording : '' }
            })
          }).catch(function () {});
        } catch (x) {}
        try { if (window.plausible) window.plausible('Pack sent', { props: { count: String(p.length), timeline: fields.timeline || '' } }); } catch (x) {}
        return send;
      })
      .then(function (sent) { done(fields, sent); })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Email me my pack';
        fail('<strong>This did not send.</strong> Your ticks are saved on this device — please try again in a minute, or email <a href="mailto:hello@ethicareresourcing.com">hello@ethicareresourcing.com</a>.');
      });
  });

  function done(f, sent) {
    var first = esc(String(f.name || '').trim().split(/\s+/)[0]);
    var panel = root.querySelector('[data-mp-panel]');
    panel.classList.add('mp-done');
    panel.innerHTML = '<h2>' + (sent ? 'On its way' + (first ? ', ' + first : '') : 'We have your request') + '</h2>' +
      '<p>' + (sent ? 'Your pack is on its way to <strong>' + esc(f.email) + '</strong>. If it has not arrived in a few minutes, check your junk folder.'
        : 'Your list reached us, and Sophie will send your pack by hand shortly. If it has not arrived by tomorrow, email hello@ethicareresourcing.com.') + '</p>' +
      '<p>Your ticks stay here, so you can come back and add to them.</p>' +
      '<div class="acts"><a class="b lime" href="/jobs/">See live roles <span aria-hidden="true">&rarr;</span></a>' +
      '<a class="b" href="/plan">Open Plan Ethicare <span aria-hidden="true">&rarr;</span></a>' +
      '<a class="b" href="/ask">Ask Ethicare a question <span aria-hidden="true">&rarr;</span></a></div>';
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
})();
