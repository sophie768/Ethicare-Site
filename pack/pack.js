/* Your Ethicare — a candidate's private space.
   Reads window.PACK from the page it is loaded into (one small file per candidate), paints
   every section, and keeps their notes and plan ON THE DEVICE.

   WHY DEVICE-LOCAL. The site has no candidate database, and the rest of the product is
   already built this way (/move, the checklist, the calculator). Notes a candidate types
   about their own move are the last thing to start collecting server-side without the
   processing basis, notice, access and retention decided first — ASK-ETHICARE.md §6. The
   page says plainly where they live and gives a way to take them out. If that changes, the
   copy changes in the same release.

   Voice: Microcopy.md. Personalise on their CHOICES; the first name appears once, in the
   welcome; nothing that sounds like surveillance; nothing with a deadline attached. */
(function () {
  var P = window.PACK || {};
  var KEY = 'ethicare_pack_' + (P.slug || 'x') + '_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  var S = { notes: '', plan: [] };
  try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') { S.notes = o.notes || ''; S.plan = Array.isArray(o.plan) ? o.plan : []; } } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

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
    { id: 'plan', label: 'Your plan', icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9' },
    { id: 'travel', label: 'Travel & stay', icon: 'M3 8h18v12H3ZM9 8V4h6v4M9 12v4M15 12v4' },
    { id: 'guides', label: 'Guides & packing', icon: 'M4 5h16M4 12h16M4 19h10' },
    { id: 'files', label: 'Files & receipts', icon: 'M3 6h6l2 2.5h10V20H3Z' }
  ];
  /* A section with nothing in it is dropped everywhere at once — rail, routing and print.
     The first version filtered only the rail, so #travel on a pack with no travel data
     still opened an empty panel under a real heading, and print showed an empty box. */
  function has(id) { return (id === 'travel' || id === 'guides' || id === 'files') ? (P[id] || []).length > 0 : true; }
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
    document.title = (P.title || 'Your Ethicare') + ' \u00b7 Ethicare Resourcing';
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
      timer = setTimeout(function () { save(); flash('Saved on this device'); }, 600);
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
    var out = (P.title || 'My Ethicare space') + '\n' +
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
  function route() { show((location.hash || '#space').replace('#', '')); }

  /* Print shows every section under one heading, so the screen h1 (the open section's
     title) is wrong for paper. Each panel carries its own title as a data attribute that
     pack.css prints as a heading, the h1 becomes the pack's name, and the standfirst says
     when it was printed - the page keeps changing, so a printout needs a date. */
  ACTIVE.forEach(function (s) {
    var p = $('[data-panel="' + s.id + '"]');
    if (p) p.setAttribute('data-print-title', ((P.headings || {})[s.id] || {}).title || s.label);
  });
  window.addEventListener('beforeprint', function () {
    $('[data-h1]').textContent = P.title || 'Your Ethicare';
    $('[data-sub]').textContent = 'As it stood on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. The page online may have changed since.';
  });
  window.addEventListener('afterprint', function () { show((location.hash || '#space').replace('#', ''), true); });

  paintTop(); paintRail(); paintSpace(); paintTravel(); paintGuides(); paintFiles();
  wireNotes(); paintPlan(); wirePlan(); wireExport();
  window.addEventListener('hashchange', route);
  route();
})();
