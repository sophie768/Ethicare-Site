/* My Plan — an Ethicare candidate's private space.
   Reads window.PACK from the page it is loaded into (one small file per candidate), paints
   every section, and keeps what the candidate writes — their plan, their notes, the answers
   that shape the site's tools, the stages they have ticked off — in their space.

   TWO MODES, decided by PACK.key.
   · key present (every pack made from 29 Sep 2026): the space is SAVED WITH US through
     /.netlify/functions/my-move, keyed to that long random key, so it follows the candidate
     between devices and the team can see where they are when asked to help. The device
     keeps a copy so the page works offline and in a webview that drops storage; the server
     copy wins whenever the two disagree and nothing local is unsaved.
   · no key (older packs): everything stays on the device, exactly as before, and the page
     says so. Nothing on such a pack reaches us.
   The privacy line on the page is written by this file from the mode, so the copy can
   never say one thing while the code does another.

   THE EIGHT STAGES. The "Your move" section is move.js — the same engine as the public
   /move — painting into this page. Its answers live in ethicare_portal_v1, the store the
   whole site's tools read, so the candidate's answers here are the answers everywhere on
   this device; in saved mode that store is what gets carried to the server and back.

   Voice: Microcopy.md. Personalise on their CHOICES; the first name appears once, in the
   welcome; nothing that sounds like surveillance; nothing with a deadline attached. */
(function () {
  var P = window.PACK || {};
  var KEY = 'ethicare_pack_' + (P.slug || 'x') + '_v1';   /* the device copy of the space */
  var PORTAL = 'ethicare_portal_v1';                       /* the site-wide answers (move.js owns it) */
  var SAVED = typeof P.key === 'string' && /^[A-Za-z0-9_-]{24,64}$/.test(P.key);
  var API = '/.netlify/functions/my-move';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  var S = { notes: '', plan: [], base: '', pending: false };
  try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') { S.notes = o.notes || ''; S.plan = Array.isArray(o.plan) ? o.plan : []; S.base = o.base || ''; S.pending = !!o.pending; } } } catch (e) {}
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  /* every change goes to the device at once and, in saved mode, to the space shortly after */
  function save() { saveLocal(); if (SAVED) { S.pending = true; saveLocal(); queuePush(); } }

  /* Each section's own title and standfirst. The h1 changes with the section rather than
     every panel carrying its own — one h1 per view, never two, and never a skipped level. */
  /* Icons on the site's 24-grid: plain strokes at width 2, currentColor, no arc smaller
     than the render size. Two earlier paths were invented and did not survive plotting —
     a "paper plane" that was really a four-pointed star, and a "book" whose only
     book-like feature was a pair of r=2.5 arcs that go sub-pixel at 19px, leaving a blank
     rounded rectangle. The lines and checklist glyphs here are the ones resources.html
     already uses for these concepts. If a glyph needs a curve to be legible, it is the
     wrong glyph for this size. */
  var SECTIONS = [
    { id: 'space', label: 'Your space', icon: 'M3 10.5 12 4l9 6.5M5.5 9.5V20h13V9.5' },
    { id: 'move', label: 'Your move', icon: 'M4 12h13M13 6l6 6-6 6' },
    { id: 'plan', label: 'Your plan', icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9' },
    { id: 'travel', label: 'Travel & stay', icon: 'M3 8h18v12H3ZM9 8V4h6v4M9 12v4M15 12v4' },
    { id: 'guides', label: 'Guides & packing', icon: 'M4 5h16M4 12h16M4 19h10' },
    { id: 'files', label: 'Files & receipts', icon: 'M3 6h6l2 2.5h10V20H3Z' }
  ];
  /* A section with nothing in it is dropped everywhere at once — rail, routing and print.
     The first version filtered only the rail, so #travel on a pack with no travel data
     still opened an empty panel under a real heading, and print showed an empty box. */
  function has(id) {
    if (id === 'travel' || id === 'guides' || id === 'files') return (P[id] || []).length > 0;
    /* the eight stages need move.js and journey.js on the page; an older pack without them drops the section */
    if (id === 'move') return !!($('[data-panel="move"]') && window.ETHICARE_JOURNEY);
    return true;
  }
  var ACTIVE = SECTIONS.filter(function (s) { return has(s.id); });
  SECTIONS.forEach(function (s) { if (!has(s.id)) { var p = $('[data-panel="' + s.id + '"]'); if (p) p.remove(); } });

  /* ---------- masthead ---------- */
  function paintTop() {
    /* Deep teal is constant in both countries; the accent for small text and hairlines is
       not. pack.css switches on this attribute — fern-text and sage for NZ, clay and sand
       for AU (CLAUDE.md: apricot never carries text on a light surface). */
    document.documentElement.setAttribute('data-country', P.country === 'au' ? 'au' : 'nz');
    $('[data-whoname]').textContent = P.spaceLabel || 'Candidate space';
    $('[data-av]').textContent = (P.first || 'E').charAt(0).toUpperCase();
    document.title = (P.title || 'My Plan') + ' \u00b7 Ethicare Resourcing';
    if (P.route) $('[data-route]').textContent = P.route;
    /* A worked example must say so on the page itself, not only in a source comment - the
       page gets printed and screenshotted, and a fictional pack read as a real one is a
       data-protection incident about a person who does not exist. */
    if (P.demo) {
      document.title = 'Example \u00b7 ' + document.title;
      var d = el('div', 'demo', '<div class="in"><b>Worked example.</b> ' + esc(P.demo === true ? 'A fictional candidate, written to test this page. Nothing on it is about a real person.' : P.demo) + '</div>');
      d.setAttribute('role', 'note');
      var shell = $('.shell'); shell.parentNode.insertBefore(d, shell);
    }
  }

  /* ---------- the rail ---------- */
  function paintRail() {
    var ul = $('[data-rail]');
    ACTIVE.forEach(function (s) {
      var li = el('li');
      li.innerHTML = '<a href="#' + s.id + '" data-nav="' + s.id + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + s.icon + '"/></svg>' +
        '<span>' + esc(s.label) + '</span></a>';
      ul.appendChild(li);
    });
  }

  /* ---------- sections ---------- */
  function paintSpace() {
    var box = $('[data-letter]'), sig = $('.sig', box);
    (P.letter || []).forEach(function (para) { box.insertBefore(el('p', null, para), sig); });
    var sg = P.signoff || {};
    $('[data-signname]').textContent = sg.name || 'Sophie and the Ethicare team';
    $('[data-signrole]').textContent = sg.role || 'Ethicare Resourcing';
    var f = $('[data-facts]');
    (P.facts || []).forEach(function (row) {
      f.appendChild(el('div', null, '<b>' + esc(row[0]) + '</b><span>' + esc(row[1]) + '</span>'));
    });
    if (!(P.facts || []).length) $('[data-facts-block]').hidden = true;
  }

  function paintRows(host, rows) {
    rows.forEach(function (r) {
      host.appendChild(el('div', null,
        '<span class="rk">' + esc(r.k) + '</span>' +
        '<span class="rv">' + esc(r.v) + '</span>' +
        (r.note ? '<span class="rn">' + esc(r.note) + '</span>' : '')));
    });
  }
  function paintTravel() {
    if (!(P.travel || []).length) return;
    paintRows($('[data-travel]'), P.travel);
    if (P.travelLede) $('[data-travel-lede]').textContent = P.travelLede;
  }
  function paintFiles() {
    if (!(P.files || []).length) return;
    paintRows($('[data-files]'), P.files);
  }

  function paintGuides() {
    var list = $('[data-guides]'), gs = P.guides || [];
    if (!gs.length) return;
    gs.forEach(function (g) {
      var a = el('a', 'gcard');
      a.href = g.href;
      a.innerHTML = '<span class="gt">' + esc(g.title) + '</span>' +
        '<span class="ar" aria-hidden="true">&rarr;</span>' +
        (g.why ? '<span class="gw">' + esc(g.why) + '</span>' : '');
      list.appendChild(a);
    });
    /* "Because you…" — Microcopy.md rule 7. Without it a chosen list is a short menu. */
    if (P.guidesWhy) $('[data-guides-why]').textContent = P.guidesWhy;
  }

  /* ---------- notes ---------- */
  var savedEl;
  function flash(msg) {
    if (!savedEl) return;
    savedEl.textContent = msg;
    clearTimeout(flash._t);
    flash._t = setTimeout(function () { savedEl.textContent = ''; }, 2600);
  }
  function wireNotes() {
    var notesEl = $('[data-notes]'); savedEl = $('[data-saved]');
    var timer = null;
    notesEl.value = S.notes;
    notesEl.addEventListener('input', function () {
      S.notes = notesEl.value;
      clearTimeout(timer);
      timer = setTimeout(function () { save(); flash(SAVED ? 'Saving\u2026' : 'Saved on this device'); }, 600);
    });
  }

  /* ---------- plan ---------- */
  function paintPlan() {
    var ul = $('[data-plan]');
    ul.innerHTML = '';
    $('[data-plan-empty]').hidden = S.plan.length > 0;
    S.plan.forEach(function (item, i) {
      var li = el('li', item.done ? 'done' : null);
      var id = 'plan-' + i;
      li.innerHTML = '<input type="checkbox" id="' + id + '"' + (item.done ? ' checked' : '') + '>' +
        '<label class="t" for="' + id + '">' + esc(item.t) + '</label>' +
        '<button type="button" class="x" aria-label="Remove &ldquo;' + esc(item.t) + '&rdquo;">&times;</button>';
      $('input', li).addEventListener('change', function (e) { S.plan[i].done = e.target.checked; save(); paintPlan(); });
      $('.x', li).addEventListener('click', function () { S.plan.splice(i, 1); save(); paintPlan(); flash('Removed'); });
      ul.appendChild(li);
    });
  }
  function wirePlan() {
    var form = $('[data-plan-form]'), input = $('[data-plan-input]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) { input.focus(); return; }
      S.plan.push({ t: v, done: false });
      input.value = ''; save(); paintPlan(); flash('Added to your plan'); input.focus();
    });
    /* Suggested starters, from what we already know about their move. Not pre-ticked and
       not pre-added: a plan someone did not write is a list of instructions. */
    var sug = $('[data-suggest]');
    (P.suggested || []).forEach(function (t) {
      var b = el('button', 'btn ghost', esc(t));
      b.type = 'button';
      b.addEventListener('click', function () {
        if (!S.plan.some(function (i) { return i.t === t; })) { S.plan.push({ t: t, done: false }); save(); paintPlan(); flash('Added to your plan'); }
        b.disabled = true; b.style.opacity = '.5';
      });
      sug.appendChild(b);
    });
    if (!(P.suggested || []).length) $('[data-suggest-block]').hidden = true;
  }

  /* ---------- taking it with them ---------- */
  function asText() {
    var out = (P.title || 'My Plan') + '\n' +
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '\n\n';
    if (S.plan.length) {
      out += 'MY PLAN\n';
      S.plan.forEach(function (i) { out += (i.done ? '[x] ' : '[ ] ') + i.t + '\n'; });
      out += '\n';
    }
    if (S.notes.trim()) out += 'MY NOTES\n' + S.notes.trim() + '\n';
    return out;
  }
  function wireExport() {
    $('[data-copy]').addEventListener('click', function () {
      var t = asText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { flash('Copied'); }, function () { flash('Could not copy \u2014 try the download'); });
      } else { flash('Could not copy \u2014 try the download'); }
    });
    $('[data-download]').addEventListener('click', function () {
      var blob = new Blob([asText()], { type: 'text/plain' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = (P.slug || 'ethicare') + '-notes.txt';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      flash('Downloaded');
    });
  }

  /* ---------- routing ---------- */
  function show(id, quiet) {
    var found = ACTIVE.some(function (s) { return s.id === id; });
    if (!found) id = 'space';
    var meta = null;
    ACTIVE.forEach(function (s) {
      var panel = $('[data-panel="' + s.id + '"]');
      if (panel) panel.hidden = s.id !== id;
      var link = $('[data-nav="' + s.id + '"]');
      if (link) { if (s.id === id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); }
      if (s.id === id) meta = s;
    });
    var heads = (P.headings || {})[id] || {};
    var h1 = $('[data-h1]');
    h1.textContent = heads.title || (meta ? meta.label : '');
    $('[data-sub]').textContent = heads.sub || '';
    /* Only move focus on a real navigation, never on first paint — landing on a page with
       focus already yanked to the heading is disorienting for a screen-reader user. */
    if (show._ready && !quiet) h1.focus();
    show._ready = true;
  }
  function route() {
    var h = location.hash || '#space';
    /* a stage link from a guide (/move#s7 style) lands on the eight stages; move.js opens the stage */
    if (/^#s[1-8]$/.test(h) || h === '#setup' || h === '#doing') h = '#move';
    show(h.replace('#', ''));
  }

  /* ---------- the space: saved with us, or on this device ---------- */
  function readPortal() { try { var o = JSON.parse(localStorage.getItem(PORTAL) || 'null'); return (o && typeof o === 'object') ? o : null; } catch (e) { return null; } }
  function writePortal(o) {
    try { localStorage.setItem(PORTAL, JSON.stringify(o)); } catch (e) {}
    /* move.js and the answers strip repaint on this — the same event candidate-context fires.
       The flag tells wireSync this came DOWN from the space, so it is not sent straight back up. */
    var d = {}; Object.keys(o).forEach(function (k) { d[k] = o[k]; }); d.__fromServer = true;
    try { window.dispatchEvent(new CustomEvent('ethicare:context', { detail: d })); } catch (e) {}
  }
  /* what goes to the server: the two things this page owns, plus the site-wide answers */
  function space() {
    var p = readPortal() || {};
    var a = {}; ['first', 'dest', 'profession', 'origin', 'stage', 'journeyStage', 'hh', 'set'].forEach(function (k) { if (p[k] !== undefined) a[k] = p[k]; });
    return { v: 1, plan: S.plan, notes: S.notes, answers: a, done: p.done || {} };
  }
  /* what comes back: paint the two, hand the answers to the portal, tell the page */
  function apply(d) {
    if (!d || typeof d !== 'object') return;
    S.plan = Array.isArray(d.plan) ? d.plan : S.plan;
    S.notes = typeof d.notes === 'string' ? d.notes : S.notes;
    var p = readPortal() || {}, a = d.answers || {};
    Object.keys(a).forEach(function (k) { p[k] = a[k]; });
    p.done = d.done || {};
    if (p.dest || p.profession || (p.hh && p.hh['with']) || p.journeyStage) p.set = true;
    writePortal(p);
    saveLocal();
    paintPlan();
    var n = $('[data-notes]'); if (n && n.value !== S.notes) n.value = S.notes;
  }
  /* two devices wrote at once: keep everything either of them has */
  function merge(server) {
    var mine = space();
    var seen = {}; var plan = [];
    (mine.plan || []).concat(server.plan || []).forEach(function (i) { if (!i || !i.t) return; var k = i.t.toLowerCase(); if (seen[k]) { if (i.done) seen[k].done = true; return; } seen[k] = { t: i.t, done: !!i.done }; plan.push(seen[k]); });
    var done = {}; Object.keys(server.done || {}).concat(Object.keys(mine.done || {})).forEach(function (k) { done[k] = true; });
    var answers = mine.answers && mine.answers.set ? mine.answers : (server.answers || mine.answers);
    var notes = mine.notes && mine.notes !== server.notes ? (server.notes && mine.notes.indexOf(server.notes) === -1 ? server.notes + '\n\n' + mine.notes : mine.notes) : (server.notes || mine.notes);
    return { v: 1, plan: plan, notes: notes, answers: answers, done: done };
  }
  var pushTimer = null, pushing = false;
  function queuePush() { clearTimeout(pushTimer); pushTimer = setTimeout(push, 900); }
  function push() {
    if (!SAVED || pushing || !S.pending) return;
    pushing = true;
    var body = { k: P.key, slug: P.slug || '', data: space(), base: S.base || '' };
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        pushing = false;
        if (res.status === 200 && res.j && res.j.ok) { S.base = res.j.updated_at || ''; S.pending = false; saveLocal(); flash('Saved to your space'); setState('saved'); return; }
        if (res.status === 409 && res.j && res.j.data) { apply(merge(res.j.data)); S.base = res.j.updated_at || ''; S.pending = true; saveLocal(); queuePush(); return; }
        if (res.status === 410) { closed(); return; }
        flash('Kept on this device \u2014 we will save it to your space when we can'); setState('offline');
      })
      .catch(function () { pushing = false; flash('Kept on this device \u2014 we will save it to your space when we can'); setState('offline'); });
  }
  /* ---- start where they actually are (1 Oct 2026) ------------------------------------------
     A pack belongs to someone we have already placed, so opening it on "Imagine the
     possibilities" and offering them a choice between New Zealand and Australia is worse than
     useless — it is the page telling a woman with a signed offer in Mandurah that she might
     like to consider Dunedin. Only the destination was being seeded, so everything downstream
     stayed generic.

     PACK.seed carries what the team already knows: profession, who is coming, and the stages
     that are genuinely behind them. move.js reads the same store as the public tools, so
     seeding it narrows every stage, every link and every guide list in one go.

     Three rules. It runs ONLY on the first open of a new space, never over a space that has
     anything in it. It fills a field only when the store has no answer for it, so the
     candidate's own answer always wins. And `done` is additive — ticking a stage for them is
     a statement that it is finished, so it is for stages we know are finished, not a guess. */
  function seed() {
    var s = P.seed;
    if (!s || typeof s !== 'object') return;
    var p = readPortal() || {}, touched = false;
    ['profession', 'origin', 'stage', 'journeyStage'].forEach(function (k) {
      if (s[k] && !p[k]) { p[k] = s[k]; touched = true; }
    });
    /* A pack belongs to someone already placed, so the offer is a fact rather than a
       guess. move.js reads it and the numbers stage stops asking what they could earn. */
    if (s.offer === true && p.offer !== true) { p.offer = true; touched = true; }
    if (s.hh && typeof s.hh === 'object') {
      if (!p.hh || typeof p.hh !== 'object') p.hh = { 'with': '', work: '', bands: [] };
      if (s.hh['with'] && !p.hh['with']) { p.hh['with'] = s.hh['with']; touched = true; }
      if (s.hh.work && !p.hh.work) { p.hh.work = s.hh.work; touched = true; }
      if (s.hh.bands && s.hh.bands.length && !(p.hh.bands || []).length) { p.hh.bands = s.hh.bands.slice(); touched = true; }
    }
    if (s.done && typeof s.done === 'object') {
      if (!p.done || typeof p.done !== 'object') p.done = {};
      Object.keys(s.done).forEach(function (k) { if (s.done[k] && !p.done[k]) { p.done[k] = true; touched = true; } });
    }
    if (touched) { p.set = true; writePortal(p); }
  }
  function pull() {
    if (!SAVED) return;
    fetch(API + '?k=' + encodeURIComponent(P.key), { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.status === 410) { closed(); return; }
        if (res.status !== 200 || !res.j || !res.j.ok) { setState('offline'); return; }
        setState('saved');
        if (!res.j.data) {
          /* first open of a new space: whatever this device already holds — notes, a plan,
             answers given on the public tools — becomes the space, so nothing is re-asked.
             The destination is the one thing the pack already knows; never ask it again. */
          var p0 = readPortal() || {};
          if (!p0.dest && (P.country === 'nz' || P.country === 'au')) { p0.dest = P.country; p0.set = true; writePortal(p0); }
          seed();
          S.pending = true; saveLocal(); push(); return;
        }
        if (S.pending) { apply(merge(res.j.data)); S.base = res.j.updated_at || ''; saveLocal(); queuePush(); return; }
        apply(res.j.data); S.base = res.j.updated_at || ''; saveLocal();
      })
      .catch(function () { setState('offline'); });
  }
  /* the link has been closed by the team: say so, plainly, and stop */
  function closed() {
    var m = $('#main-content'); if (!m) return;
    ACTIVE.forEach(function (s) { var p = $('[data-panel="' + s.id + '"]'); if (p) p.hidden = true; });
    $('[data-h1]').textContent = 'This link has been closed';
    $('[data-sub]').textContent = 'Your space is no longer open at this address. If you think that is a mistake, email hello@ethicareresourcing.com and we will sort it out.';
    var rail = $('[data-rail]'); if (rail) rail.hidden = true;
    var note = $('[data-privacy]'); if (note) note.hidden = true;
  }
  function setState(st) {
    var el = $('[data-space-state]'); if (!el) return;
    el.textContent = st === 'saved' ? 'Saved to your space, so it follows you between devices' : 'Not connected right now \u2014 kept on this device until it is';
  }
  /* the privacy line is written from the MODE, never by hand in the page — a page that says
     "nothing is sent to us" while sending things is worse than no page (README) */
  function writePrivacy() {
    var note = $('[data-privacy]'), strip = $('[data-space-state]');
    if (SAVED) {
      if (note) note.innerHTML = '<b>Where this lives.</b> What you write here \u2014 your plan, your notes, your answers and the stages you tick off \u2014 is saved to your Ethicare space, so it follows you between your phone and your laptop, and so the person helping you at Ethicare can see where you are when you ask. It is never shown to an employer. Ask us and we will change it or delete it.';
      if (strip) strip.textContent = 'Saved to your space, so it follows you between devices';
    } else {
      if (note) note.innerHTML = '<b>Where this lives.</b> Your notes and your plan are saved in this browser, on this device only. Nothing is sent to us and we cannot read them \u2014 which also means they will not follow you to your phone, and clearing your browser data clears them. Copy or download them if you want them somewhere else.';
      if (strip) strip.textContent = 'Your notes stay on this device';
    }
  }
  function wireSync() {
    writePrivacy();
    if (!SAVED) return;
    /* changes made through move.js or the answers strip land in the portal store; carry them up */
    window.addEventListener('ethicare:context', function (e) { if (e && e.detail && e.detail.__fromServer) return; S.pending = true; saveLocal(); queuePush(); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-done],[data-here],[data-work],[data-band]') : null;
      if (t) setTimeout(function () { S.pending = true; saveLocal(); queuePush(); }, 60);
    });
    window.addEventListener('online', function () { if (S.pending) push(); else pull(); });
    pull();
  }

  /* Print shows every section under one heading, so the screen h1 (the open section's
     title) is wrong for paper. Each panel carries its own title as a data attribute that
     pack.css prints as a heading, the h1 becomes the pack's name, and the standfirst says
     when it was printed - the page keeps changing, so a printout needs a date. */
  ACTIVE.forEach(function (s) {
    var p = $('[data-panel="' + s.id + '"]');
    if (p) p.setAttribute('data-print-title', ((P.headings || {})[s.id] || {}).title || s.label);
  });
  window.addEventListener('beforeprint', function () {
    $('[data-h1]').textContent = P.title || 'My Plan';
    $('[data-sub]').textContent = 'As it stood on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. The page online may have changed since.';
  });
  window.addEventListener('afterprint', function () { show((location.hash || '#space').replace('#', ''), true); });

  paintTop(); paintRail(); paintSpace(); paintTravel(); paintGuides(); paintFiles();
  wireNotes(); paintPlan(); wirePlan(); wireExport(); wireSync();
  window.addEventListener('hashchange', route);
  route();
})();
