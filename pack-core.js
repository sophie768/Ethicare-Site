/* ============================================================================
   Ethicare Resourcing — "My pack", the shared part (7 Oct 2026)

   One pack, everywhere. A candidate collects guides from any page — the Create my
   pack page, a destination page's "Add to my pack", Plan Ethicare — and the same
   list is waiting on /my-pack to be emailed in one go.

   Stored on this device only (localStorage `ethicare_pack_v1`: an array of catalogue
   ids from pack-data.js). Nothing leaves the browser until the candidate presses
   "Email me my pack".

   This file is loaded on every page by nav.js / site.js. It does three things:
     1. window.EthicarePack — has / add / remove / toggle / list / count / set
     2. wires every [data-pack-add="<id>"] button: label, pressed state, click
     3. shows a small "My pack (n)" link in the header once the pack has something in it
   ============================================================================ */
(function () {
  'use strict';
  if (window.EthicarePack) return;

  var KEY = 'ethicare_pack_v1';
  var ID_RE = /^[a-z0-9-]{2,60}$/;

  function read() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string' && ID_RE.test(x); }) : [];
    } catch (e) { return []; }
  }
  function write(a) {
    var seen = {}, out = [];
    a.forEach(function (x) { if (ID_RE.test(x) && !seen[x]) { seen[x] = 1; out.push(x); } });
    try { localStorage.setItem(KEY, JSON.stringify(out.slice(0, 120))); } catch (e) {}
    paint();
    try { window.dispatchEvent(new CustomEvent('ethicare:pack', { detail: { ids: out } })); } catch (e) {}
    return out;
  }

  var API = {
    list: read,
    count: function () { return read().length; },
    has: function (id) { return read().indexOf(id) !== -1; },
    add: function (id) { var a = read(); if (a.indexOf(id) === -1) a.push(id); write(a); },
    remove: function (id) { write(read().filter(function (x) { return x !== id; })); },
    toggle: function (id) { if (API.has(id)) API.remove(id); else API.add(id); return API.has(id); },
    set: function (ids) { write(ids || []); },
    clear: function () { write([]); }
  };
  window.EthicarePack = API;

  /* ---- styles: one small block, injected so no page needs a stylesheet change ---- */
  var css = '' +
    '.pk-add{display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:8px 15px;border-radius:999px;border:1.5px solid currentColor;background:transparent;color:inherit;font:600 14px/1 "Work Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap;transition:background .15s ease,color .15s ease}' +
    '.pk-add .pk-i{display:inline-block;width:14px;text-align:center;font-weight:700}' +
    '.pk-add[aria-pressed="true"]{background:#A6C84A;border-color:#A6C84A;color:#01312F}' +
    '.pk-add:focus-visible{outline:3px solid #A6C84A;outline-offset:2px}' +
    '.pk-add.pk-mini{min-height:28px;padding:5px 10px;font-size:12.5px;border-width:1px;color:#2F5E49;border-color:#C9DED3}' +
    '.pk-add.pk-mini[aria-pressed="true"]{color:#01312F;border-color:#A6C84A}' +
    '.pk-nav{display:none;align-items:center;gap:8px;margin-right:6px;padding:8px 14px;border-radius:999px;background:#E6F1ED;color:#02615D!important;font:600 14.5px/1 "Work Sans",system-ui,sans-serif;text-decoration:none!important;white-space:nowrap}' +
    '.pk-nav.on{display:inline-flex}' +
    '.pk-nav b{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#02615D;color:#fff;font-size:12.5px}' +
    '.pk-nav:hover{background:#C9DED3}' +
    '@media(max-width:900px){.pk-nav{position:fixed;right:14px;bottom:14px;z-index:60;box-shadow:0 10px 26px -10px rgba(1,49,47,.55);background:#02615D;color:#fff!important}.pk-nav b{background:#A6C84A;color:#01312F}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---- buttons ---- */
  function label(btn) {
    var on = API.has(btn.getAttribute('data-pack-add'));
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.innerHTML = on ? '<span class="pk-i" aria-hidden="true">&#10003;</span>In my pack' : '<span class="pk-i" aria-hidden="true">+</span>Add to my pack';
  }
  function paintButtons() {
    var b = document.querySelectorAll('[data-pack-add]');
    for (var i = 0; i < b.length; i++) {
      if (!b[i].classList.contains('pk-add')) b[i].classList.add('pk-add');
      if (b[i].tagName === 'BUTTON' && !b[i].type) b[i].type = 'button';
      label(b[i]);
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pack-add]');
    if (!b) return;
    e.preventDefault();
    var on = API.toggle(b.getAttribute('data-pack-add'));
    try { if (window.plausible) window.plausible(on ? 'Pack add' : 'Pack remove', { props: { item: b.getAttribute('data-pack-add'), page: location.pathname } }); } catch (x) {}
  });

  /* ---- header counter ---- */
  var nav = null;
  function ensureNav() {
    if (nav || /^\/my-pack/.test(location.pathname)) return nav;
    var cta = document.querySelector('.site-header .nav-cta');
    if (!cta || !cta.parentNode) return null;
    nav = document.createElement('a');
    nav.className = 'pk-nav';
    nav.href = '/my-pack';
    cta.parentNode.insertBefore(nav, cta);
    return nav;
  }
  function paintNav() {
    var n = API.count(), el = ensureNav();
    if (!el) return;
    el.innerHTML = 'My pack <b>' + n + '</b>';
    el.setAttribute('aria-label', 'My pack, ' + n + ' guide' + (n === 1 ? '' : 's'));
    el.classList.toggle('on', n > 0);
  }

  function paint() { paintButtons(); paintNav(); }
  API.paint = paint;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
  /* Tools such as Plan redraw their panels after load; label any button they add. */
  if (window.MutationObserver) {
    var queued = false;
    new MutationObserver(function (list) {
      if (queued) return;
      for (var i = 0; i < list.length; i++) {
        var n = list[i].addedNodes;
        for (var j = 0; j < n.length; j++) {
          if (n[j].nodeType === 1 && (n[j].hasAttribute('data-pack-add') || n[j].querySelector('[data-pack-add]'))) {
            queued = true;
            (window.requestAnimationFrame || setTimeout)(function () { queued = false; paintButtons(); });
            return;
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  window.addEventListener('storage', function (e) { if (e.key === KEY) paint(); });
})();
