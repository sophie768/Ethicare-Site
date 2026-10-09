// Ethicare static site — shared behaviour (scroll reveal + collapsibles + carousel).
// Header navigation lives in nav.js.

/* ----------------------------------------------------------------------------------
   ONE SWITCH for emailing a candidate their own result (1 Oct 2026).

   The pathway checker and the cost calculator can both email someone the result they
   just worked out. Both send through /.netlify/functions/send-result, which needs
   RESEND_API_KEY set in Netlify AND the sending domain verified in Resend. Until that
   is done a send fails silently, so the offer is hidden rather than made and broken.

   WHEN THE KEY IS SET: change this to true. Both tools then offer "Email me my result"
   / "Email me my estimate", and /request-a-guide emails the guide (send-guide). Nothing
   else has to change, and the lead is captured either way — the capture goes to Netlify
   Forms, which needs no key at all.

   7 Oct 2026: RESEND_API_KEY set in Netlify (Production only, secret). Switched on. */
window.ETHICARE_EMAIL_LIVE = true;
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

/* "My pack" (7 Oct 2026): the header counter and every "Add to my pack" button live in
   pack-core.js. Loaded from here and from site.js so every page gets it; whichever runs
   first loads it, the other sees the flag and stops. */
(function () {
  if (window.EthicarePack || window.__ecPackLoading) return;
  window.__ecPackLoading = true;
  var s = document.createElement('script'); s.src = '/pack-core.js'; s.async = true;
  (document.head || document.documentElement).appendChild(s);
})();


/* ---------------------------------------------------------------------------
   LAST PAGE READ (9 Oct 2026) — for "Pick up where you left off" on the
   homepage's welcome-back screen. Device only: one key in localStorage holding
   the path and heading of the last guide, destination, job or tool page read.
   Nothing is sent anywhere. Cleared by "Not you? Clear my answers".
   --------------------------------------------------------------------------- */
(function () {
  try {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    if (!/^\/(guides|destinations|jobs|insights)\/|^\/(plan|pathway-checker|cost-calculator|destination-finder|interview-prep|build-your-cv|cv-checker|take-home-pay|moving-checklist|my-pack|australia|new-zealand)$/.test(p)) return;
    if (/^\/jobs\/?$/.test(p)) return;
    var h = document.querySelector('main h1') || document.querySelector('h1');
    var t = (h ? (h.innerText || h.textContent) : document.title.split(/[|·]/)[0]).replace(/\s+/g, ' ').trim().slice(0, 80);
    if (t) localStorage.setItem('ethicare_last_v1', JSON.stringify({ path: p, title: t, at: Date.now() }));
  } catch (e) {}
})();
