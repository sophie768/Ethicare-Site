/* MY FILE — the save-for-later / mark-as-read / notes layer (V1, agreed 30 Aug 2026).

   THIS IS NOT ETHICARE MOVE AND NOT MY MOVE. Three different things write to localStorage
   and their names used to collide dangerously:
     ethicare_myfile_v1  — THIS file: saved pages, read state, page notes
     ethicare_portal_v1  — the Ethicare Move plan (move.js), named before the rename
     ethicare_mymove_v2  — the My Move dashboard (my-move-planner.jsx)
   Until 30 Aug 2026 this one was called `ethicare_mymove_v1`, which read as an older version
   of `_v2` and was one tidy-up away from being deleted along with every saved page and note.
   It is now `ethicare_myfile_v1`, and old data is migrated in on first load.

   Nothing leaves the browser; that privacy line is part of the UI copy.
   Pages include this script; a [data-myfile-dash] container (Ethicare Move) also gets the dashboard
   and suppresses the floating widget. Upgrade path: swap the storage fns for account sync later. */
(function () {
  var KEY = 'ethicare_myfile_v1';
  var LEGACY_KEY = 'ethicare_mymove_v1'; /* pre-30-Aug-2026 name. Migrate once, then leave alone. */
  function load() {
    try {
      var v = localStorage.getItem(KEY);
      if (v) return JSON.parse(v) || {};
      /* First load since the rename: adopt whatever the old key held. The old key is left in
         place deliberately — deleting a user's only copy on a guess is not a migration. */
      var old = localStorage.getItem(LEGACY_KEY);
      if (old) {
        var parsed = JSON.parse(old) || {};
        localStorage.setItem(KEY, JSON.stringify(parsed));
        return parsed;
      }
    } catch (e) {}
    return {};
  }
  function store() { d.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  var d = load(); d.saved = d.saved || {}; d.read = d.read || {}; d.notes = d.notes || {};
  function norm(p) { return (p || location.pathname).replace(/\/index\.html$/, '/').replace(/\.html$/, ''); }
  function pageTitle() { return document.title.replace(/\s*\|\s*Ethicare.*$/, ''); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function slugTitle(u) { var s = u.replace(/\/$/, '').split('/').pop() || 'Home'; return s.replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  var here = norm();

  var css = '.mm{position:fixed;right:16px;bottom:16px;z-index:940;display:flex;background:#02615D;border-radius:999px;box-shadow:0 10px 30px rgba(1,49,47,.35);overflow:hidden}' +
  '.mm-b{appearance:none;border:0;background:none;cursor:pointer;font-family:"Work Sans",sans-serif;font-weight:600;font-size:13.5px;color:#fff;min-height:48px;padding:12px 16px;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}' +
  '.mm-b+.mm-b{border-left:1px solid rgba(255,255,255,.25)}' +
  '.mm-b:hover{background:#014E4B}.mm-b:focus-visible{outline:3px solid #FCFBF8;outline-offset:-4px}' +
  '.mm-b .tk{color:#C6E084;font-weight:700}' +
  '.mm-panel{position:fixed;right:16px;bottom:76px;z-index:941;width:min(360px,calc(100vw - 32px));background:#FCFBF8;border:1px solid #C9DED3;border-radius:16px;box-shadow:0 18px 44px rgba(1,49,47,.25);padding:18px}' +
  '.mm-panel h2{font-family:"Work Sans",sans-serif;font-weight:600;font-size:15.5px;color:#02615D;margin:0 0 10px}' +
  '.mm-panel textarea{width:100%;box-sizing:border-box;min-height:120px;resize:vertical;border:1.5px solid #C9DED3;border-radius:10px;background:#fff;padding:10px 12px;font-family:Manrope,sans-serif;font-size:14.5px;line-height:1.6;color:#333}' +
  '.mm-panel textarea:focus{outline:none;border-color:#02615D}' +
  '.mm-st{font-family:"Work Sans",sans-serif;font-weight:600;font-size:12px;color:#2F5E49;margin:8px 0 0;min-height:15px}' +
  '.mm-priv{font-size:12.5px;line-height:1.5;color:#555;margin:10px 0 0}' +
  '.mm-all{display:inline-block;font-family:"Work Sans",sans-serif;font-weight:600;font-size:13.5px;color:#02615D;text-decoration:underline;text-underline-offset:3px;margin-top:10px}' +
  '@media (max-width:640px){.mm{right:12px;bottom:12px}.mm-b{padding:12px 13px;font-size:12.5px}.mm-panel{right:12px;bottom:72px}}' +
  '@media print{.mm,.mm-panel{display:none!important}}' +
  '.mmd-list{display:grid;gap:12px;margin-top:18px}' +
  '.mmd-i{background:#fff;border:1px solid #C9DED3;border-radius:14px;padding:16px 18px}' +
  '.mmd-i .t{font-family:"Work Sans",sans-serif;font-weight:600;font-size:16px;color:#02615D;text-decoration:none}' +
  '.mmd-i .t:hover{text-decoration:underline;text-underline-offset:3px}' +
  '.mmd-m{font-family:"Work Sans",sans-serif;font-weight:600;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#2F5E49;margin-top:5px}' +
  '.mmd-m .un{color:#555}' +
  '.mmd-note{margin-top:10px}' +
  '.mmd-note summary{cursor:pointer;list-style:none;font-family:"Work Sans",sans-serif;font-weight:600;font-size:13.5px;color:#2F5E49}' +
  '.mmd-note summary::-webkit-details-marker{display:none}' +
  '.mmd-note[open] summary{margin-bottom:8px}' +
  '.mmd-note textarea{width:100%;box-sizing:border-box;min-height:90px;resize:vertical;border:1.5px solid #C9DED3;border-radius:10px;background:#FCFBF8;padding:9px 11px;font-family:Manrope,sans-serif;font-size:14px;line-height:1.6;color:#333}' +
  '.mmd-note .pv{font-size:13.5px;line-height:1.55;color:#555;white-space:pre-line}' +
  '.mmd-acts{display:flex;flex-wrap:wrap;gap:8px 10px;margin-top:12px}' +
  '.mmd-acts button{appearance:none;cursor:pointer;font-family:"Work Sans",sans-serif;font-weight:600;font-size:12.5px;color:#02615D;background:#fff;border:1px solid #C9DED3;border-radius:999px;min-height:44px;padding:9px 16px}' +
  '.mmd-acts button:hover{background:#E3ECE5;border-color:#72A471}' +
  '.mmd-acts button:focus-visible{outline:3px solid #02615D;outline-offset:2px;box-shadow:0 0 0 2px #FCFBF8}' +
  '.mmd-empty{font-size:15px;line-height:1.6;color:#555;background:#fff;border:1px dashed #C9DED3;border-radius:14px;padding:18px 20px;max-width:62ch}' +
  '.mmd-clear{appearance:none;cursor:pointer;background:none;border:0;font-family:"Work Sans",sans-serif;font-weight:600;font-size:13px;color:#A34438;text-decoration:underline;text-underline-offset:3px;margin-top:16px;padding:6px 0}';
  var st = document.createElement('style'); st.id = 'mymove-css'; st.textContent = css; document.head.appendChild(st);

  var dash = document.querySelector('[data-myfile-dash]');

  /* ---------- floating widget (content pages) ---------- */
  if (!dash) {
    var bar = document.createElement('div'); bar.className = 'mm'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'My file — save this page, mark it read, keep notes');
    bar.innerHTML = '<button type="button" class="mm-b" data-mm="save"></button><button type="button" class="mm-b" data-mm="read"></button><button type="button" class="mm-b" data-mm="note" aria-expanded="false"></button>';
    var panel = document.createElement('div'); panel.className = 'mm-panel'; panel.hidden = true; panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Your notes on this page');
    panel.innerHTML = '<h2>Your notes on this page</h2><textarea placeholder="Questions to ask, things to check, how you feel about it&hellip;"></textarea><p class="mm-st" aria-live="polite"></p><p class="mm-priv">Saved in this browser only &mdash; nothing is sent to Ethicare.</p><a class="mm-all" href="/move#myfile">Everything you&rsquo;ve saved &rarr;</a>';
    document.body.appendChild(bar); document.body.appendChild(panel);
    var bSave = bar.querySelector('[data-mm="save"]'), bRead = bar.querySelector('[data-mm="read"]'), bNote = bar.querySelector('[data-mm="note"]');
    var ta = panel.querySelector('textarea'), stEl = panel.querySelector('.mm-st'), tmr;
    function paint() {
      var s = !!d.saved[here], r = !!d.read[here], n = d.notes[here] && d.notes[here].txt;
      bSave.innerHTML = s ? '<span class="tk">&#10003;</span>Saved' : 'Save for later';
      bSave.setAttribute('aria-pressed', s);
      bRead.innerHTML = r ? '<span class="tk">&#10003;</span>Read' : 'Mark as read';
      bRead.setAttribute('aria-pressed', r);
      bNote.innerHTML = 'Notes' + (n ? '<span class="tk">&bull;</span>' : '');
    }
    bSave.addEventListener('click', function () {
      if (d.saved[here]) delete d.saved[here]; else d.saved[here] = { t: pageTitle(), ts: Date.now() };
      store(); paint();
    });
    bRead.addEventListener('click', function () {
      if (d.read[here]) delete d.read[here]; else { d.read[here] = Date.now(); if (!d.saved[here]) d.saved[here] = { t: pageTitle(), ts: Date.now() }; }
      store(); paint();
    });
    bNote.addEventListener('click', function () {
      panel.hidden = !panel.hidden; bNote.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) { ta.value = (d.notes[here] && d.notes[here].txt) || ''; ta.focus(); }
    });
    ta && ta.addEventListener('input', function () {
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        var v = ta.value.trim();
        if (v) { d.notes[here] = { txt: ta.value, ts: Date.now(), t: pageTitle() }; } else { delete d.notes[here]; }
        store(); paint(); stEl.textContent = 'Saved in this browser';
        setTimeout(function () { stEl.textContent = ''; }, 1800);
      }, 450);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; bNote.setAttribute('aria-expanded', 'false'); bNote.focus(); } });
    paint();
    return;
  }

  /* ---------- dashboard (Ethicare Move) ---------- */
  var listEl = dash.querySelector('[data-myfile-list]') || dash;
  function items() {
    var urls = {}; Object.keys(d.saved).forEach(function (u) { urls[u] = 1; }); Object.keys(d.notes).forEach(function (u) { urls[u] = 1; }); Object.keys(d.read).forEach(function (u) { urls[u] = 1; });
    return Object.keys(urls).sort(function (a, b) {
      var ta2 = (d.saved[a] && d.saved[a].ts) || (d.notes[a] && d.notes[a].ts) || d.read[a] || 0;
      var tb = (d.saved[b] && d.saved[b].ts) || (d.notes[b] && d.notes[b].ts) || d.read[b] || 0;
      return tb - ta2;
    });
  }
  function render() {
    var us = items();
    dash.hidden = !us.length && location.hash !== '#myfile';
    if (dash.hidden) return;
    if (!us.length) { listEl.innerHTML = '<div class="mmd-empty"><strong>Nothing here yet.</strong> On any guide, profession or destination page, use the buttons in the bottom corner to save it for later, mark it read, or keep notes. It all collects here &mdash; in this browser only.</div>'; return; }
    var h = '<div class="mmd-list">';
    us.forEach(function (u) {
      /* Entries saved before 31 Aug 2026 may hold the literal "Guide" — the old
         resources tile title() fell back to that word. Treat it as no title so those
         rows read as their page instead, rather than migrating anyone's storage. */
      var st = (d.saved[u] && d.saved[u].t) || (d.notes[u] && d.notes[u].t) || '';
      var t = (!st || st === 'Guide') ? slugTitle(u) : st;
      var note = d.notes[u] && d.notes[u].txt;
      h += '<div class="mmd-i" data-u="' + esc(u) + '"><a class="t" href="' + esc(u) + '">' + esc(t) + '</a>' +
        '<p class="mmd-m">' + (d.read[u] ? 'Read &#10003;' : '<span class="un">Not read yet</span>') + (d.saved[u] ? ' &middot; saved ' + new Date(d.saved[u].ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '') + '</p>' +
        '<details class="mmd-note"' + (note ? ' open' : '') + '><summary>' + (note ? 'Your notes' : 'Add a note') + '</summary>' +
        (note ? '<p class="pv">' + esc(note) + '</p>' : '') +
        '<textarea data-note>' + esc(note || '') + '</textarea></details>' +
        '<div class="mmd-acts"><button type="button" data-act="read">' + (d.read[u] ? 'Mark unread' : 'Mark as read') + '</button><button type="button" data-act="remove">Remove</button></div></div>';
    });
    h += '</div><button type="button" class="mmd-clear" data-act="clear">Clear everything saved on this device</button>';
    listEl.innerHTML = h;
    listEl.querySelectorAll('.mmd-note .pv').forEach(function (pv) { pv.style.display = 'none'; }); /* textarea is the editor; preview only needed pre-open */
    listEl.querySelectorAll('.mmd-note textarea').forEach(function (t2) {
      var tmr2;
      t2.addEventListener('input', function () {
        clearTimeout(tmr2);
        tmr2 = setTimeout(function () {
          var u = t2.closest('.mmd-i').getAttribute('data-u'), v = t2.value.trim();
          if (v) d.notes[u] = { txt: t2.value, ts: Date.now(), t: (d.saved[u] && d.saved[u].t) || slugTitle(u) }; else delete d.notes[u];
          store();
        }, 450);
      });
    });
  }
  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'clear') { if (confirm('Remove everything saved on this device? This cannot be undone.')) { d = { saved: {}, read: {}, notes: {} }; store(); render(); } return; }
    var u = b.closest('.mmd-i').getAttribute('data-u');
    if (act === 'read') { if (d.read[u]) delete d.read[u]; else d.read[u] = Date.now(); }
    if (act === 'remove') { delete d.saved[u]; delete d.read[u]; delete d.notes[u]; }
    store(); render();
  });
  window.addEventListener('hashchange', render);
  render();
})();
