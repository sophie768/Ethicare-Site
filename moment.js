/* ==========================================================================
   ETHICARE — moment.js (15 Oct 2026)
   Three small, shared things, so every page uses the same rules:

   1. Greeting   — destination-aware opening ("Kia ora. Welcome back.") from the
                   answers saved on this device, plus a time-of-day line from the
                   visitor's OWN clock. Shown once per visit (session), never on
                   every navigation, never to a first-time visitor with nothing saved.
   2. Clocks     — the destination's local time and date from the browser's own
                   IANA time-zone data (Intl), never a hard-coded offset, so daylight
                   saving and the date line are the browser's calculation. Ticks on
                   the minute, text only, no layout change, no screen-reader chatter.
   3. Good to know — one quiet line from a small verified list (good-to-know-data.js),
                   the candidate's country and place first, rotating by visit.

   Sophie, 14 Oct 2026: credible first, welcoming second, playful only occasionally.
   No emoji, no exclamation marks, no slogans, no "message from your future home".
   Nothing here is stored beyond a visit counter, and nothing is sent anywhere.

   Markup hooks (all optional; mount() finds whatever a page has):
     [data-moment-greet]        text → the opening ("Kia ora. Welcome back.")
     [data-moment-greet-line]   text → the time-of-day line, or hidden when none
     [data-moment-tile]         a destination clock tile (dest from saved answers)
     [data-moment-clock="Zone"] inline "6:42 am · Thursday 16 October" for that zone
         data-moment-label="Perth" prefixes the label; data-moment-compare="1" adds
         "already tomorrow for you" when the calendar dates differ.
     [data-moment-world]        the homepage strip (NZ · Sydney · Perth + other cities)
     [data-moment-fact]         one Good to know line, with optional data-moment-place
   ========================================================================== */
(function () {
  'use strict';
  var W = window, D = document;
  var ZONES = {
    nz: { zone: 'Pacific/Auckland', label: 'New Zealand', sub: 'Auckland, Wellington, Christchurch' },
    sydney: { zone: 'Australia/Sydney', label: 'Sydney', sub: 'New South Wales' },
    melbourne: { zone: 'Australia/Melbourne', label: 'Melbourne', sub: 'Victoria' },
    brisbane: { zone: 'Australia/Brisbane', label: 'Brisbane', sub: 'Queensland' },
    perth: { zone: 'Australia/Perth', label: 'Perth', sub: 'Western Australia' },
    adelaide: { zone: 'Australia/Adelaide', label: 'Adelaide', sub: 'South Australia' },
    hobart: { zone: 'Australia/Hobart', label: 'Hobart', sub: 'Tasmania' },
    darwin: { zone: 'Australia/Darwin', label: 'Darwin', sub: 'Northern Territory' }
  };
  var AU_ORDER = ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'hobart', 'darwin'];

  function ctx() { return W.EthicareContext || null; }
  function dest() { var c = ctx(); try { return c && c.destMode ? c.destMode() : ''; } catch (e) { return ''; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function reduced() { try { return W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ---- 1. greeting ------------------------------------------------------- */
  /* A stable per-session coin, so "night owl" or "G'day" is decided once a visit, not re-rolled
     on every page: a visitor who saw G'day on the hub sees it on their page too. */
  function coin() {
    var v = ss('ethicare_moment_coin');
    if (v === null) { v = String(Math.floor(Math.random() * 12)); ss('ethicare_moment_coin', v); }
    return +v;
  }
  function opening(d) {
    if (d === 'nz') return 'Kia ora. Welcome back.';
    if (d === 'au') return coin() % 4 === 0 ? 'G’day. Welcome back.' : 'Welcome back.';
    return 'Welcome back.';
  }
  function timeLine(now) {
    var h;
    try { h = (now || new Date()).getHours(); } catch (e) { return ''; }
    if (typeof h !== 'number' || isNaN(h)) return '';
    if (h >= 5 && h < 9) return 'You’re up early.';
    if (h >= 9 && h < 12) return 'Good morning.';
    if (h >= 12 && h < 17) return 'Good afternoon.';
    if (h >= 17 && h < 22) return 'Good evening.';
    return coin() % 3 === 0 ? 'Hello, night owl.' : 'Good evening.';
  }
  /* The time-of-day line is shown once per session; after that the opening stands alone. */
  var greeted = null;
  function greeting() {
    if (greeted) return greeted;              /* once per page load, however many times it is asked */
    var d = dest(), first = !ss('ethicare_greeted_v1');
    if (first) ss('ethicare_greeted_v1', '1');
    greeted = { open: opening(d), line: first ? timeLine() : '' };
    return greeted;
  }

  /* ---- 2. clocks --------------------------------------------------------- */
  function fmt(zone, opts) {
    try { return new Intl.DateTimeFormat('en-NZ', Object.assign({ timeZone: zone }, opts)); } catch (e) { return null; }
  }
  function parts(zone, now) {
    var t = fmt(zone, { hour: 'numeric', minute: '2-digit', hour12: true }), d = fmt(zone, { weekday: 'long', day: 'numeric', month: 'long' }), k = fmt(zone, { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (!t || !d || !k) return null;
    return { time: t.format(now).replace(/\s?([ap])\.?m\.?/i, ' $1m').toLowerCase().replace(/^0/, ''), date: d.format(now), key: k.format(now) };
  }
  function shortDate(zone, now) { var d = fmt(zone, { weekday: 'short', day: 'numeric', month: 'short' }); return d ? d.format(now) : ''; }
  function hm(zone, now) { var f = fmt(zone, { hour: 'numeric', minute: 'numeric', hour12: false }); if (!f) return null; var m = f.format(now).match(/(\d+)\D+(\d+)/); return m ? { h: +m[1] % 12, m: +m[2] } : null; }
  /* a small analogue face: SVG, hands set by rotation, once a minute */
  function faceSvg() {
    return '<svg class="mo-face" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18.5" class="mo-fc"/>' +
      '<line x1="20" y1="3.5" x2="20" y2="6" class="mo-tick"/><line x1="36.5" y1="20" x2="34" y2="20" class="mo-tick"/><line x1="20" y1="36.5" x2="20" y2="34" class="mo-tick"/><line x1="3.5" y1="20" x2="6" y2="20" class="mo-tick"/>' +
      '<line x1="20" y1="20" x2="20" y2="10.5" class="mo-hh"/><line x1="20" y1="20" x2="20" y2="7" class="mo-mh"/><circle cx="20" cy="20" r="1.6" class="mo-pin"/></svg>';
  }
  function setFace(svg, zone, now) {
    var t = hm(zone, now); if (!t || !svg) return;
    var hh = svg.querySelector('.mo-hh'), mh = svg.querySelector('.mo-mh');
    if (hh) hh.setAttribute('transform', 'rotate(' + ((t.h + t.m / 60) * 30) + ' 20 20)');
    if (mh) mh.setAttribute('transform', 'rotate(' + (t.m * 6) + ' 20 20)');
  }
  function localKey(now) { var k = fmt(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }); return k ? k.format(now) : ''; }
  /* "already tomorrow for you" — only when the calendar dates genuinely differ */
  function compareLine(zone, now) {
    var there = parts(zone, now), here = localKey(now);
    if (!there || !here || there.key === here) return '';
    return there.key > here ? 'already tomorrow for you' : 'still yesterday for you';
  }
  var ticking = [];
  function paintAll() { var now = new Date(); ticking.forEach(function (f) { try { f(now); } catch (e) {} }); }
  function schedule() {
    if (schedule.started) return; schedule.started = true;
    function arm() { var ms = 60000 - (Date.now() % 60000) + 50; setTimeout(function () { if (!D.hidden) paintAll(); arm(); }, ms); }
    arm();
    D.addEventListener('visibilitychange', function () { if (!D.hidden) paintAll(); });
  }
  function setText(el, s) { if (el && el.textContent !== s) el.textContent = s; }

  function inlineClock(el) {
    var zone = el.getAttribute('data-moment-clock'), label = el.getAttribute('data-moment-label') || '', cmp = el.getAttribute('data-moment-compare') === '1';
    if (!zone || !fmt(zone, {})) { el.hidden = true; return; }
    el.innerHTML = (label ? '<span class="mo-l">' + label + '</span> ' : '') + '<time class="mo-t"></time><span class="mo-d"></span><span class="mo-c"></span>';
    var t = el.querySelector('.mo-t'), d = el.querySelector('.mo-d'), c = el.querySelector('.mo-c');
    function paint(now) {
      var p = parts(zone, now); if (!p) return;
      setText(t, p.time); setText(d, ' · ' + p.date);
      var cl = cmp ? compareLine(zone, now) : ''; setText(c, cl ? ' · ' + cl : '');
    }
    paint(new Date()); ticking.push(paint); schedule();
  }

  function tileHtml(key) {
    var z = ZONES[key];
    return '<div class="mo-tile" data-mo-key="' + key + '">' + faceSvg() + '<div class="mo-tb"><p class="mo-k">' + z.label + '</p><p class="mo-v"><time></time></p><p class="mo-s"><span class="mo-date"></span><span class="mo-cmp"></span></p><p class="mo-sub">' + z.sub + '</p></div></div>';
  }
  function bindTile(tile) {
    var key = tile.getAttribute('data-mo-key'), z = ZONES[key];
    var t = tile.querySelector('time'), dd = tile.querySelector('.mo-date'), c = tile.querySelector('.mo-cmp');
    var face = tile.querySelector('.mo-face');
    function paint(now) { var p = parts(z.zone, now); if (!p) return; setText(t, p.time); setText(dd, p.date); var cl = compareLine(z.zone, now); setText(c, cl ? ' · ' + cl : ''); setFace(face, z.zone, now); }
    paint(new Date()); ticking.push(paint); schedule();
  }
  /* the home strip: small faces in one row, nothing more */
  function itemHtml(key) { var z = ZONES[key]; return '<div class="mo-item" data-mo-key="' + key + '">' + faceSvg() + '<div class="mo-ib"><p class="mo-k">' + z.label + '</p><p class="mo-t2"><time></time><span class="mo-d2"></span></p></div></div>'; }
  function bindItem(it) {
    var z = ZONES[it.getAttribute('data-mo-key')], t = it.querySelector('time'), d = it.querySelector('.mo-d2'), face = it.querySelector('.mo-face');
    function paint(now) { var p = parts(z.zone, now); if (!p) return; setText(t, p.time); setText(d, ' · ' + shortDate(z.zone, now)); setFace(face, z.zone, now); }
    paint(new Date()); ticking.push(paint); schedule();
  }
  /* Destination tile for the dashboard: NZ, or Sydney for Australia, or both when comparing.
     "Other cities" lets them look without changing the saved destination. */
  function destTile(el) {
    var d = dest(), keys = d === 'nz' ? ['nz'] : d === 'au' ? ['sydney'] : d === 'both' ? ['nz', 'sydney'] : [];
    if (!keys.length) { el.hidden = true; return; }
    var others = AU_ORDER.filter(function (k) { return keys.indexOf(k) === -1; });
    el.innerHTML = '<div class="mo-tiles">' + keys.map(tileHtml).join('') + '</div>' +
      '<details class="mo-more"><summary>Other cities</summary><div class="mo-tiles mo-tiles-more">' + (keys.indexOf('nz') === -1 ? tileHtml('nz') : '') + others.map(tileHtml).join('') + '</div></details>';
    Array.prototype.forEach.call(el.querySelectorAll('.mo-tile'), bindTile);
  }
  function world(el) {
    var keys = ['nz', 'sydney', 'perth'], more = ['melbourne', 'brisbane', 'adelaide', 'hobart', 'darwin'];
    el.innerHTML = '<div class="mo-row">' + keys.map(itemHtml).join('') + '<details class="mo-more"><summary>Other cities</summary><div class="mo-row mo-row-more">' + more.map(itemHtml).join('') + '</div></details></div>';
    Array.prototype.forEach.call(el.querySelectorAll('.mo-item'), bindItem);
  }

  /* ---- 3. Good to know --------------------------------------------------- */
  function pickFact(country, place) {
    var all = W.ETHICARE_FACTS || [];
    if (!all.length) return null;
    var pool = all.filter(function (f) { return (!country || f.country === country) && (!place || f.place === place); });
    if (!pool.length && place) pool = all.filter(function (f) { return !country || f.country === country; });
    if (!pool.length) pool = all;
    /* place-specific lines first when there are any, then the general ones */
    pool = pool.filter(function (f) { return place && f.place === place; }).concat(pool.filter(function (f) { return !(place && f.place === place); }));
    var k = 'ethicare_gtk_' + (country || 'all') + '_' + (place || 'any'), n = +(ls(k) || 0);
    ls(k, String(n + 1));
    return pool[n % pool.length];
  }
  function fact(el) {
    var d = el.getAttribute('data-moment-country') || dest(), place = el.getAttribute('data-moment-place') || '';
    var country = d === 'nz' ? 'nz' : d === 'au' ? 'au' : '';
    var f = pickFact(country, place);
    if (!f) { el.hidden = true; return; }
    el.innerHTML = '<span class="mo-gk">Did you know?</span><span class="mo-gt"></span>';
    el.querySelector('.mo-gt').textContent = f.text;
    if (f.source) el.setAttribute('title', 'Source: ' + f.source);
    el.hidden = false;
  }

  /* ---- mount ------------------------------------------------------------- */
  function mount(root) {
    root = root || D;
    var c = ctx(), known = false; try { known = !!(c && c.has && c.has()); } catch (e) {}
    var g = null;
    Array.prototype.forEach.call(root.querySelectorAll('[data-moment-greet]'), function (el) {
      if (!known) return; g = g || greeting(); setText(el, g.open);
      if (!reduced()) el.classList.add('mo-in');
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-moment-greet-line]'), function (el) {
      if (!known) { el.hidden = true; return; } g = g || greeting(); if (g.line) { setText(el, g.line); el.hidden = false; } else el.hidden = true;
    });
    /* hub eyebrows: "Kia ora" on the New Zealand hub, "G'day" one visit in four on the Australian one */
    Array.prototype.forEach.call(root.querySelectorAll('[data-moment-hub]'), function (el) {
      var h = el.getAttribute('data-moment-hub'), base = el.textContent.replace(/^.*\u00b7\s*/, '');
      if (h === 'nz') setText(el, 'Kia ora \u00b7 ' + base);
      else if (h === 'au' && coin() % 4 === 0) setText(el, 'G\u2019day \u00b7 ' + base);
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-moment-tile]'), function (el) { if (known) destTile(el); else el.hidden = true; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-moment-clock]'), inlineClock);
    Array.prototype.forEach.call(root.querySelectorAll('[data-moment-world]'), world);
    Array.prototype.forEach.call(root.querySelectorAll('[data-moment-fact]'), function (el) {
      /* dashboard lines need a known destination; a guide names its own country/place */
      if (!known && !el.getAttribute('data-moment-country')) { el.hidden = true; return; } fact(el);
    });
  }
  W.EthicareMoment = { greeting: greeting, timeLine: timeLine, opening: opening, parts: parts, compareLine: compareLine, pickFact: pickFact, mount: mount, zones: ZONES };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { mount(); }); else mount();
})();
