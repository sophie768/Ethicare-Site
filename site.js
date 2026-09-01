// Ethicare static site — shared behaviour (scroll reveal + collapsibles + carousel).
// Header navigation lives in nav.js.
(function () {
  // ---------- Mobile nav ----------
  // Lives in nav.js now: one implementation shared by every page that renders
  // the header, rather than a copy here and a copy inlined per page.

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Scroll reveal (auto) ----------
  if (!reduce && 'IntersectionObserver' in window) {
    // Inject reveal styles via JS so content stays visible if JS never runs.
    var st = document.createElement('style');
    st.textContent = '.om-h{opacity:0;transform:translateY(20px);transition:opacity .6s cubic-bezier(.22,.61,.36,1),transform .6s cubic-bezier(.22,.61,.36,1);will-change:opacity,transform}.om-h.om-show{opacity:1;transform:none}';
    document.head.appendChild(st);

    var STAGGER = '.cards,.tiles,.work,.terms,.roster,.quiet,.why4,.two,.glance-grid,.howto-grid,.place-grid,.guide-grid,.authority-grid,.grid,.dests,.why,.plib,.ins-grid,.contacts,.tiers,.journey,.jgrid,.steps';
    var BLOCK = '[data-reveal],.feature,.sophie,.ctabox,.reassurance,.final,.complete,.close-ins,.visa-signpost,.glance-card,.panel,.emp,.pullquote,.editorial-item,.proof-panel';

    var foldThreshold = window.innerHeight * 0.85;
    var hide = function (el) {
      // only hide things that are below the fold on load (avoids above-fold flash)
      if (el.getBoundingClientRect().top > foldThreshold) { el.classList.add('om-h'); return true; }
      return false;
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        if (el.__omKids) {
          el.__omKids.forEach(function (kid, i) {
            setTimeout(function () { kid.classList.add('om-show'); }, i * 85);
          });
        } else {
          el.classList.add('om-show');
        }
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.12 });

    // Stagger containers: hide + observe, animate children in sequence
    [].forEach.call(document.querySelectorAll(STAGGER), function (c) {
      var kids = [].filter.call(c.children, function (k) { return k.nodeType === 1; });
      if (!kids.length) return;
      var any = false;
      kids.forEach(function (k) { if (hide(k)) any = true; });
      if (!any) return;
      c.__omKids = kids.filter(function (k) { return k.classList.contains('om-h'); });
      io.observe(c);
    });

    // Standalone blocks
    [].forEach.call(document.querySelectorAll(BLOCK), function (b) {
      if (b.closest(STAGGER)) return; // already handled as a stagger child
      if (hide(b)) io.observe(b);
    });
  }

  // ---------- Mobile collapsible sections (scannability) ----------
  // Wrap the detail of any [data-mobile-collapse] section into a panel with a
  // toggle. Visibility is CSS-gated (guide-mobile.css): open on desktop,
  // collapsed-by-default on mobile. No-op on pages without the marker.
  [].forEach.call(document.querySelectorAll('[data-mobile-collapse]'), function (sec) {
    var anchor = sec.querySelector('.lead') || sec.querySelector('h2');
    if (!anchor) return;
    var host = anchor.parentNode;
    var rest = [];
    var n = anchor.nextElementSibling;
    while (n) { rest.push(n); n = n.nextElementSibling; }
    if (!rest.length) return;

    var panel = document.createElement('div');
    panel.className = 'mc-panel';
    var pid = 'mc-' + Math.random().toString(36).slice(2, 8);
    panel.id = pid;
    rest.forEach(function (el) { panel.appendChild(el); });

    var showLabel = sec.getAttribute('data-mc-label') || 'Show details';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mc-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', pid);
    btn.innerHTML = '<span class="mc-txt">' + showLabel + '</span><span class="mc-ico" aria-hidden="true">+</span>';

    host.insertBefore(btn, anchor.nextSibling);
    host.insertBefore(panel, btn.nextSibling);

    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.mc-txt').textContent = open ? 'Hide details' : showLabel;
    });
  });

  // ---------- Journey carousel ----------
  var jcar = document.querySelector('[data-journey]');
  if (jcar) {
    var slides = [].slice.call(jcar.querySelectorAll('.jslide'));
    var dotsWrap = jcar.querySelector('[data-jdots]');
    var jidx = 0;
    var go = function (n) {
      jidx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === jidx); });
      [].slice.call(dotsWrap.children).forEach(function (d, i) { d.setAttribute('aria-current', i === jidx ? 'true' : 'false'); });
    };
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.className = 'jdot'; b.type = 'button';
      b.setAttribute('aria-label', 'Go to stage ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
    });
    var jp = jcar.querySelector('[data-jprev]'); if (jp) jp.addEventListener('click', function () { go(jidx - 1); });
    var jn = jcar.querySelector('[data-jnext]'); if (jn) jn.addEventListener('click', function () { go(jidx + 1); });
    go(0);
  }
})();


/* ---------------------------------------------------------------------------
   PROMO BAR — DISABLED 24 Aug 2026 at the client's request.
   The webinar page itself stays live at /webinar-medical-imaging-australia.
   To switch the bar back on, change PROMO_ENABLED to true.
   --------------------------------------------------------------------------- */
var PROMO_ENABLED = false;
/* ---------------------------------------------------------------------------
   PROMO BAR — medical imaging in Australia webinar, Mon 21 September 2026.
   Edit PROMO below, or delete this whole block, to change or remove it.
   endsAfter is inclusive: the bar stops rendering the day after the event,
   so nobody has to remember to take it down.
   --------------------------------------------------------------------------- */
(function () {
  if (!PROMO_ENABLED) return;
  var PROMO = {
    id: 'webinar-medical-imaging-au-2026-09-21',
    tag: 'Free webinar',
    text: '<b>Medical imaging in Australia</b> &middot; a free webinar on Ahpra registration, the roles and the move. Monday 21 September, 7pm UK &amp; Ireland, 8pm South Africa. <b>Places are limited</b> so everyone can ask questions.',
    ctaText: 'Register',
    ctaHref: '/webinar-medical-imaging-australia',
    endsAfter: '2026-09-21'
  };

  try {
    var today = new Date();
    var end = new Date(PROMO.endsAfter + 'T23:59:59');
    if (today > end) return;
    if (localStorage.getItem('ec-promo-dismissed:' + PROMO.id) === '1') return;
  } catch (e) { /* storage blocked: still show the bar */ }

  var header = document.querySelector('.site-header');
  if (!header || !header.parentNode) return;

  var bar = document.createElement('aside');
  bar.className = 'promo-bar';
  bar.setAttribute('aria-label', 'Announcement');
  bar.innerHTML =
    '<div class="pb-in">' +
      '<span class="pb-tag">' + PROMO.tag + '</span>' +
      '<p class="pb-txt">' + PROMO.text + '</p>' +
      '<a class="pb-cta" href="' + PROMO.ctaHref + '">' + PROMO.ctaText + ' <span aria-hidden="true">&rarr;</span></a>' +
      '<button class="pb-x" type="button" aria-label="Dismiss announcement">&times;</button>' +
    '</div>';

  header.parentNode.insertBefore(bar, header);

  bar.querySelector('.pb-x').addEventListener('click', function () {
    bar.remove();
    try { localStorage.setItem('ec-promo-dismissed:' + PROMO.id, '1'); } catch (e) {}
  });
})();


/* ---------------------------------------------------------------------------
   ANALYTICS LOADER
   site.js is on every page, so loading analytics.js from here gives site-wide
   coverage without touching 519 files. Deferred and failure-tolerant: if the
   file is missing or blocked, window.track never appears and every call site
   is written as `if (window.track)`, so nothing breaks.
   Event names and props are the fixed list in "Ethicare Analytics Spec.md".
   --------------------------------------------------------------------------- */
(function () {
  if (window.track) return;
  var base = (function () {
    /* resolve relative to site.js itself, so pages in /guides, /jobs and
       /destinations subdirectories load the same copy */
    var els = document.getElementsByTagName('script');
    for (var i = els.length - 1; i >= 0; i--) {
      var src = els[i].getAttribute('src') || '';
      if (/(^|\/)site\.js(\?|$)/.test(src)) return src.replace(/site\.js.*$/, '');
    }
    return '/';
  })();
  var el = document.createElement('script');
  el.src = base + 'analytics.js';
  el.defer = true;
  document.head.appendChild(el);
})();
