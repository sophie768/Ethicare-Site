/* THE READING JOURNEY — read / still-to-read state on the guide library (/resources).
   Agreed 30 Aug 2026: the six steps ARE the reading journey and they live here, not in a
   second copy inside /move. This script is the only thing that was missing.

   Reads and writes the SAME store as the floating widget on guide pages:
     ethicare_myfile_v1  { saved: {url:{t,ts}}, read: {url:ts}, notes: {url:{...}} }
   so ticking a guide here and reading it there are the same act. Do not introduce a
   second key — see the header of mymove.js for why that nearly cost us the lot.

   No markup changes to the 50 tiles: each anchor is wrapped at runtime so the control
   can sit over it without nesting a button inside a link. */
(function () {
  var KEY = 'ethicare_myfile_v1';
  var LEGACY = 'ethicare_mymove_v1';
  var d;
  try { d = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY)) || {}; } catch (e) { d = {}; }
  d.saved = d.saved || {}; d.read = d.read || {}; d.notes = d.notes || {};
  function store() { d.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  /* must match norm() in mymove.js or the two views disagree about the same page */
  function norm(p) { return (p || '').replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/[?#].*$/, ''); }

  var tiles = [].slice.call(document.querySelectorAll('a.lib-item'));
  if (!tiles.length) return;

  var css = '.lib-wrap{display:flex;flex-direction:column;gap:8px}' +
  '.lib-wrap>a.lib-item{flex:1 1 auto}' +
  '.rp-btn{align-self:flex-start;position:relative;appearance:none;cursor:pointer;font-family:var(--display,"Work Sans"),sans-serif;font-weight:600;font-size:12.5px;line-height:1;white-space:nowrap;' +
    'min-height:32px;padding:8px 12px;border-radius:999px;border:1px solid #C9DED3;background:#FCFBF8;color:#2F5E49;transition:background .15s ease,border-color .15s ease,color .15s ease}' +
  '.rp-btn:hover{background:#E3ECE5;border-color:#72A471}' +
  '.rp-btn:focus-visible{outline:3px solid #02615D;outline-offset:2px;box-shadow:0 0 0 2px #FCFBF8}' +
  '.rp-btn::after{content:"";position:absolute;inset:-6px}' +
  '.rp-btn.on{background:#02615D;border-color:#02615D;color:#fff}' +
  '.rp-btn.on:hover{background:#014E4B;border-color:#014E4B}' +
  '.rp-btn.done{background:#E3ECE5;border-color:#72A471;color:#2F5E49}' +
  '.lib-wrap.is-read>a.lib-item .foot{color:#2F5E49}' +
  '.rp-state{display:inline-flex;align-items:center;gap:6px;font-family:var(--display,"Work Sans"),sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#2F5E49}' +
  '.rp-prog{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;margin:0 0 18px;font-family:var(--display,"Work Sans"),sans-serif;font-weight:600;font-size:13.5px;color:#2F5E49}' +
  '.rp-bar{flex:0 0 160px;height:6px;border-radius:3px;background:#D6E1DA;overflow:hidden}' +
  '.rp-bar i{display:block;height:100%;background:#72A471;border-radius:3px;transition:width .3s ease}' +
  '.rp-none{color:#555;font-weight:500}' +
  '@media (max-width:600px){.rp-bar{flex-basis:100%}}';
  var st = document.createElement('style'); st.id = 'resources-progress-css'; st.textContent = css;
  document.head.appendChild(st);

  /* wrap each tile so a real <button> can sit beside the link rather than inside it */
  tiles.forEach(function (a) {
    var w = document.createElement('div'); w.className = 'lib-wrap';
    a.parentNode.insertBefore(w, a); w.appendChild(a);
    var u = norm(a.getAttribute('href'));
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rp-btn'; b.setAttribute('data-u', u);
    w.appendChild(b);
  });

  /* Two tile shapes carry their title in different elements: .lib-card in an <h3>,
     .dl-tile in <span class="tt">. Looking only for h3 meant every stepped tile was
     saved — and announced to screen readers — as the literal word "Guide", which is
     what "Your file" on /move was listing. Falls back to the slug, never to a generic. */
  /* Thirteen guides exist once per country and their headings are identical — "Salary &
     pay, explained" is both /guides/new-zealand-salary and /guides/australia-salary. Saved
     side by side in "Your file" those rows were indistinguishable, which is the whole job of
     that list. The tile knows its country; append it.

     But three tiles (/cv-checker, /build-your-cv, /interview-prep) appear in BOTH country
     columns pointing at the same URL, so they are one saved page, not two, and a country
     suffix there would be a lie. Rather than hardcode that list, work it out: a URL that
     appears under more than one data-country is country-agnostic. */
  var COUNTRIES = (function () {
    var m = {};
    tiles.forEach(function (t) {
      var u = norm(t.getAttribute('href') || ''), c = t.getAttribute('data-country') || '';
      (m[u] = m[u] || {})[c] = 1;
    });
    return m;
  })();
  function countrySuffix(a) {
    var c = a.getAttribute('data-country');
    if (c !== 'nz' && c !== 'au') return '';
    var seen = COUNTRIES[norm(a.getAttribute('href') || '')] || {};
    if (Object.keys(seen).length > 1) return '';
    return c === 'au' ? ' \u00b7 AU' : ' \u00b7 NZ';
  }
  function title(a) {
    var el = a.querySelector('h3, .tt');
    var t = el ? el.textContent.trim() : '';
    if (!t) {
      var u = (a.getAttribute('href') || '').replace(/[?#].*$/, '').replace(/\/$/, '').split('/').pop() || '';
      t = u.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    return t ? t + countrySuffix(a) : 'Saved page';
  }

  function paintTile(w) {
    var a = w.querySelector('a.lib-item'), b = w.querySelector('.rp-btn');
    var u = b.getAttribute('data-u');
    var read = !!d.read[u], listed = !!d.saved[u];
    w.classList.toggle('is-read', read);
    b.className = 'rp-btn' + (read ? ' done' : listed ? ' on' : '');
    /* Set the three states inline as well as by class: this control is injected into a page
       with its own stylesheet, and an inline value cannot be lost to a cascade surprise. */
    if (read) { b.style.cssText = 'background:#E3ECE5;border-color:#72A471;color:#2F5E49'; }
    else if (listed) { b.style.cssText = 'background:#02615D;border-color:#02615D;color:#fff'; }
    else { b.style.cssText = 'background:#FCFBF8;border-color:#C9DED3;color:#2F5E49'; }
    b.textContent = read ? 'Read \u2713' : listed ? 'On your list' : 'Add to my list';
    b.setAttribute('aria-pressed', String(read || listed));
    b.setAttribute('aria-label', (read ? 'Read: ' : listed ? 'On your list: ' : 'Add to my list: ') + title(a));
    var foot = a.querySelector('.foot');
    if (foot && !foot.hasAttribute('data-orig')) foot.setAttribute('data-orig', foot.innerHTML);
    if (foot) foot.innerHTML = read ? '<span class="rp-state">Read \u2713</span>' : foot.getAttribute('data-orig');
  }

  function paintProgress() {
    /* The step ids sit on <p class="sectlabel">, not on a wrapping section — so a step's
       tiles are the .lib-wrap elements in the siblings that FOLLOW it, up to the next label. */
    var labels = [].slice.call(document.querySelectorAll('p.sectlabel[id^="step-"]'));
    labels.forEach(function (label) {
      var ws = [], n = label.nextElementSibling;
      while (n && !(n.matches && n.matches('p.sectlabel[id^="step-"]'))) {
        if (n.querySelectorAll) ws = ws.concat([].slice.call(n.querySelectorAll('.lib-wrap')));
        n = n.nextElementSibling;
      }
      if (!ws.length) return;
      var total = ws.length, read = 0, listed = 0;
      ws.forEach(function (w) {
        var u = w.querySelector('.rp-btn').getAttribute('data-u');
        if (d.read[u]) read++; else if (d.saved[u]) listed++;
      });
      var el = label.nextElementSibling;
      if (!el || !el.classList || !el.classList.contains('rp-prog')) {
        el = document.createElement('p'); el.className = 'rp-prog'; el.setAttribute('aria-live', 'polite');
        label.parentNode.insertBefore(el, label.nextSibling);
      }
      var pct = Math.round((read / total) * 100);
      el.innerHTML = read || listed
        ? '<span>' + read + ' of ' + total + ' read</span>' +
          '<span class="rp-bar"><i style="width:' + pct + '%"></i></span>' +
          (listed ? '<span>' + listed + ' still to read</span>' : '')
        : '<span class="rp-none">' + total + ' guides in this step. Add the ones you want and they will show as read once you have been through them.</span>';
    });
  }

  function paint() {
    document.querySelectorAll('.lib-wrap').forEach(paintTile);
    paintProgress();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.rp-btn');
    if (!b) return;
    e.preventDefault();
    var u = b.getAttribute('data-u');
    var a = b.closest('.lib-wrap').querySelector('a.lib-item');
    if (d.read[u]) { delete d.read[u]; delete d.saved[u]; }        /* read -> cleared */
    else if (d.saved[u]) { d.read[u] = Date.now(); }               /* listed -> read */
    else { d.saved[u] = { t: title(a), ts: Date.now() }; }         /* nothing -> listed */
    store(); paint();
  });

  paint();
})();
