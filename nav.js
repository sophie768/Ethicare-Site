/* Ethicare — header navigation. One implementation shared by every page that
   renders the site header. Breakpoint matches the stylesheets (900px). */
(function () {
  var BP = '(max-width: 900px)';
  function nav() { return document.querySelector('[data-nav]'); }
  function toggle() { return document.querySelector('[data-nav-toggle]'); }
  function isMobile() { return window.matchMedia && window.matchMedia(BP).matches; }

  function close(focusBtn) {
    var n = nav(), t = toggle();
    if (!n || !n.classList.contains('open')) return;
    n.classList.remove('open');
    document.body.classList.remove('nav-open');
    if (t) {
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-label', 'Open menu');
      if (focusBtn) t.focus();
    }
    var open = n.querySelectorAll('.has-sub.open');
    for (var i = 0; i < open.length; i++) open[i].classList.remove('open');
  }

  function open() {
    var n = nav(), t = toggle();
    if (!n) return;
    n.classList.add('open');
    document.body.classList.add('nav-open');
    if (t) {
      t.setAttribute('aria-expanded', 'true');
      t.setAttribute('aria-label', 'Close menu');
    }
  }

  /* associate the button with the panel for screen readers */
  document.addEventListener('DOMContentLoaded', function () {
    var n = nav(), t = toggle();
    if (!n || !t) return;
    if (!n.id) n.id = 'site-nav';
    t.setAttribute('aria-controls', n.id);
    if (!t.hasAttribute('aria-expanded')) t.setAttribute('aria-expanded', 'false');
    t.setAttribute('aria-label', n.classList.contains('open') ? 'Close menu' : 'Open menu');
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nav-toggle]');
    if (t) {
      var n = nav();
      if (n && n.classList.contains('open')) close(false); else open();
      return;
    }

    var link = e.target.closest('[data-nav] a');
    if (link) {
      var item = link.parentNode;
      var isParent = item && item.classList && item.classList.contains('has-sub') && item.querySelector('a') === link;
      if (isParent && isMobile()) {
        e.preventDefault();
        item.classList.toggle('open');
        return;
      }
      close(false);
      return;
    }

    /* tapping the page behind an open panel dismisses it */
    var n2 = nav();
    if (n2 && n2.classList.contains('open') && !e.target.closest('[data-nav]') && !e.target.closest('[data-header]')) {
      close(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') close(true);
  });

  /* leaving mobile width with the panel open would otherwise strand body scroll-lock */
  if (window.matchMedia) {
    var mq = window.matchMedia(BP);
    var onChange = function () { if (!mq.matches) close(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();

/* ============================================================================================
   Reading options (30 Sep 2026)

   Not an accessibility overlay. Overlays sit on top of a page and guess at fixes at runtime,
   which fights the screen reader, magnifier or font settings the reader has already configured
   on their own device, and lets a site claim a compliance it does not have. This does the
   opposite: it changes the real page, only when the reader asks, and remembers the choice.

   The site is built to WCAG 2 AA and these preferences sit on top of that, they do not stand in
   for it. Everything here is also available in the browser and the operating system; it is here
   because a clinician reading a long guide on a phone after a shift should not have to go and
   find it.

   What it offers, and why each one:
     Text size      zoom on :root, so px sizes scale too (this stylesheet is largely px)
     Line spacing   looser leading, letter and word spacing — the change most dyslexic readers
                    report helping more than any particular typeface
     Typeface       Atkinson Hyperlegible, designed by the Braille Institute for low vision,
                    letterforms drawn to be told apart. Loaded only if chosen
     Darker text    body copy to near-black and underlines on links in the text
     Motion         off by default for anyone whose system asks for reduced motion

   Lives in nav.js because nav.js is on every page: one file, no per-page markup. The saved
   choice is applied as the first thing this file does, so it lands before first paint.
   ============================================================================================ */
(function () {
  var KEY = 'ethicare_reading_v1';
  var root = document.documentElement;
  var FONT = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';

  var DEFAULTS = { size: 'md', space: 'normal', font: 'site', ink: 'off', motion: 'auto' };
  function load() {
    try {
      var raw = localStorage.getItem(KEY); if (!raw) return copy(DEFAULTS);
      var p = JSON.parse(raw), out = copy(DEFAULTS);
      for (var k in DEFAULTS) if (typeof p[k] === 'string') out[k] = p[k];
      return out;
    } catch (e) { return copy(DEFAULTS); }
  }
  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }

  var prefs = load();

  function prefersReduced() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function fontLoaded() { return !!document.querySelector('link[data-rp-font-css]'); }
  function loadFont() {
    if (fontLoaded()) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = FONT; l.setAttribute('data-rp-font-css', '');
    document.head.appendChild(l);
  }

  /* ---- darker text, decided per element ----------------------------------------------------
     Only darken body copy that is already a mid-grey on a light background. Pale text on the
     teal bands is left exactly as it is: darkening it would take a passing contrast ratio and
     break it, which is how "high contrast" modes make sites worse than they were. */
  var INK_SEL = 'main p, main li, main dd, main td, main figcaption, .content p, .content li, .content dd, .sub, .sub2, .lead';
  function lum(c) {
    var m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/.exec(c || '');
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.5) return null;   /* effectively transparent */
    return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
  }
  function groundLum(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var l = lum(getComputedStyle(n).backgroundColor);
      if (l !== null) return l;
    }
    return 1;                                                        /* nothing set: white page */
  }
  function paintInk() {
    var on = prefs.ink === 'on', els = document.querySelectorAll(INK_SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!on) { el.classList.remove('rp-dark'); continue; }
      if (el.classList.contains('rp-dark')) continue;
      var text = lum(getComputedStyle(el).color);
      if (text === null) continue;
      if (text > 0.55) continue;                 /* already pale — it is on something dark */
      if (groundLum(el) < 0.6) continue;         /* sitting on a dark band — leave it alone */
      el.classList.add('rp-dark');
    }
  }

  function apply() {
    root.setAttribute('data-rp-size', prefs.size);
    root.setAttribute('data-rp-space', prefs.space);
    root.setAttribute('data-rp-font', prefs.font);
    root.setAttribute('data-rp-ink', prefs.ink);
    var motionOff = prefs.motion === 'off' || (prefs.motion === 'auto' && prefersReduced());
    root.setAttribute('data-rp-motion', motionOff ? 'off' : 'on');
    if (prefs.font === 'hyper') loadFont();
    if (document.body) paintInk();
  }
  apply();

  var CSS = ''
    /* Size: zoom, because most of this site's type is declared in px and a root font-size does
       nothing to px. Applied to the reading area, never to :root — a media query is evaluated
       against the UNZOOMED viewport, so zooming the whole page leaves the header laid out for a
       width it no longer has, and the navigation runs off the right edge. Scaling what someone
       is reading and leaving the site furniture alone is also the better behaviour. */
    + ':root[data-rp-size="lg"] main,:root[data-rp-size="lg"] .content{zoom:1.12}'
    + ':root[data-rp-size="xl"] main,:root[data-rp-size="xl"] .content{zoom:1.25}'
    /* spacing: body copy only — headings and buttons keep their own rhythm */
    + ':root[data-rp-space="loose"] p,:root[data-rp-space="loose"] li,:root[data-rp-space="loose"] dd,'
    + ':root[data-rp-space="loose"] .sub,:root[data-rp-space="loose"] .sub2,:root[data-rp-space="loose"] .lead,'
    + ':root[data-rp-space="loose"] blockquote,:root[data-rp-space="loose"] td'
    + '{line-height:1.9!important;letter-spacing:.012em;word-spacing:.08em}'
    /* typeface */
    + ':root[data-rp-font="hyper"] body,:root[data-rp-font="hyper"] h1,:root[data-rp-font="hyper"] h2,'
    + ':root[data-rp-font="hyper"] h3,:root[data-rp-font="hyper"] h4,:root[data-rp-font="hyper"] p,'
    + ':root[data-rp-font="hyper"] li,:root[data-rp-font="hyper"] a,:root[data-rp-font="hyper"] span,'
    + ':root[data-rp-font="hyper"] td,:root[data-rp-font="hyper"] th,:root[data-rp-font="hyper"] label,'
    + ':root[data-rp-font="hyper"] button,:root[data-rp-font="hyper"] input,:root[data-rp-font="hyper"] select,'
    + ':root[data-rp-font="hyper"] textarea,:root[data-rp-font="hyper"] blockquote,:root[data-rp-font="hyper"] summary,'
    + ':root[data-rp-font="hyper"] figcaption,:root[data-rp-font="hyper"] cite'
    + '{font-family:"Atkinson Hyperlegible",Verdana,sans-serif!important;font-style:normal!important}'
    /* Darker text: applied per element by paintInk() below, never as a blanket rule. A blanket
       rule darkens pale text on the dark teal bands too, which destroys the contrast it is
       meant to improve. The class is only ever set on text already sitting on a light ground. */
    + ':root[data-rp-ink="on"] .rp-dark{color:#1A1A1A!important}'
    + ':root[data-rp-ink="on"] main p a,:root[data-rp-ink="on"] main li a,:root[data-rp-ink="on"] .content p a'
    + '{text-decoration:underline!important;text-underline-offset:3px}'
    /* motion */
    + ':root[data-rp-motion="off"] *,:root[data-rp-motion="off"] *::before,:root[data-rp-motion="off"] *::after'
    + '{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}'
    + ':root[data-rp-motion="off"] .om-h{opacity:1!important;transform:none!important}'
    /* the control and its panel */
    + '.rp-open{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px}'
    + '.rp-open:focus-visible{outline:3px solid currentColor;outline-offset:3px}'
    + '.rp-dlg{border:0;border-radius:18px;padding:0;max-width:520px;width:calc(100% - 32px);background:#fff;color:#333;box-shadow:0 24px 70px rgba(1,49,47,.3)}'
    + '.rp-dlg::backdrop{background:rgba(1,49,47,.5)}'
    + '.rp-in{padding:clamp(20px,3vw,30px);font-family:Manrope,system-ui,sans-serif;font-size:15.5px;line-height:1.6}'
    + '.rp-in h2{font-family:"Work Sans",sans-serif;font-weight:600;font-size:22px;color:#02615D;margin:0 0 6px}'
    + '.rp-in .rp-note{font-size:14px;color:#555;margin:0 0 20px}'
    + '.rp-f{border:0;padding:0;margin:0 0 18px}'
    + '.rp-f legend{font-family:"Work Sans",sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:#2F5E49;padding:0;margin-bottom:8px}'
    + '.rp-opts{display:flex;flex-wrap:wrap;gap:8px}'
    + '.rp-opts label{display:inline-flex;align-items:center;min-height:44px;padding:8px 15px;border:1px solid #C9DED3;border-radius:999px;cursor:pointer;font-weight:600;color:#02615D;background:#fff}'
    + '.rp-opts input{position:absolute;opacity:0;width:1px;height:1px}'
    + '.rp-opts label:has(input:checked){background:#02615D;color:#fff;border-color:#02615D}'
    + '.rp-opts label:has(input:focus-visible){outline:3px solid #02615D;outline-offset:2px}'
    + '.rp-check{display:flex;align-items:flex-start;gap:10px;min-height:44px;cursor:pointer}'
    + '.rp-check input{width:20px;height:20px;margin-top:3px;accent-color:#02615D;flex:0 0 auto}'
    + '.rp-foot{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;border-top:1px solid #E6F1ED;padding-top:16px;margin-top:4px}'
    + '.rp-foot button{min-height:44px;padding:10px 20px;border-radius:999px;font-family:"Work Sans",sans-serif;font-weight:600;font-size:15px;cursor:pointer}'
    + '.rp-reset{background:none;border:1px solid #C9DED3;color:#02615D}'
    + '.rp-done{background:#02615D;border:1px solid #02615D;color:#fff}'
    + '.rp-foot button:focus-visible{outline:3px solid #02615D;outline-offset:2px}';

  var st = document.createElement('style');
  st.setAttribute('data-rp-css', '');
  st.appendChild(document.createTextNode(CSS));
  (document.head || root).appendChild(st);

  /* ---- the control, and the panel behind it ---- */
  function build() {
    var base = document.querySelector('.f-base');
    if (!base || document.querySelector('.rp-open')) return;

    var holder = base.querySelector('span') || base;
    var sep = document.createElement('span'); sep.className = 'f-sep'; sep.textContent = '·';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'rp-open'; btn.textContent = 'Reading options';
    btn.setAttribute('aria-haspopup', 'dialog');
    holder.appendChild(sep); holder.appendChild(btn);

    var dlg = document.createElement('dialog');
    dlg.className = 'rp-dlg'; dlg.setAttribute('aria-labelledby', 'rp-title');
    dlg.innerHTML = ''
      + '<form method="dialog" class="rp-in">'
      + '<h2 id="rp-title">Reading options</h2>'
      + '<p class="rp-note">These change how this site looks for you on this device, and stay set until you change them. Your browser and your phone have their own settings too, and nothing here overrides them.</p>'
      + field('Text size', 'size', [['md', 'Normal'], ['lg', 'Large'], ['xl', 'Largest']])
      + field('Line spacing', 'space', [['normal', 'Normal'], ['loose', 'Loose']])
      + field('Typeface', 'font', [['site', 'Site default'], ['hyper', 'Atkinson Hyperlegible']])
      + '<fieldset class="rp-f"><legend>Contrast and motion</legend>'
      + '<label class="rp-check"><input type="checkbox" data-rp="ink"><span>Darker body text, and underline links inside the text</span></label>'
      + '<label class="rp-check"><input type="checkbox" data-rp="motion"><span>Reduce animation. This is already on if your device asks for reduced motion</span></label>'
      + '</fieldset>'
      + '<div class="rp-foot"><button type="button" class="rp-reset">Reset to default</button><button value="close" class="rp-done">Done</button></div>'
      + '</form>';
    document.body.appendChild(dlg);

    function field(legend, name, opts) {
      var h = '<fieldset class="rp-f"><legend>' + legend + '</legend><div class="rp-opts">';
      for (var i = 0; i < opts.length; i++) {
        h += '<label><input type="radio" name="rp-' + name + '" data-rp="' + name + '" value="' + opts[i][0] + '"><span>' + opts[i][1] + '</span></label>';
      }
      return h + '</div></fieldset>';
    }

    function sync() {
      var r = dlg.querySelectorAll('input[type="radio"]');
      for (var i = 0; i < r.length; i++) r[i].checked = prefs[r[i].getAttribute('data-rp')] === r[i].value;
      dlg.querySelector('[data-rp="ink"]').checked = prefs.ink === 'on';
      dlg.querySelector('[data-rp="motion"]').checked = prefs.motion === 'off' || (prefs.motion === 'auto' && prefersReduced());
    }

    dlg.addEventListener('change', function (e) {
      var t = e.target, k = t.getAttribute && t.getAttribute('data-rp');
      if (!k) return;
      if (t.type === 'radio') prefs[k] = t.value;
      else if (k === 'ink') prefs.ink = t.checked ? 'on' : 'off';
      else if (k === 'motion') prefs.motion = t.checked ? 'off' : (prefersReduced() ? 'auto' : 'on');
      save(prefs); apply();
    });

    dlg.querySelector('.rp-reset').addEventListener('click', function () {
      prefs = copy(DEFAULTS); save(prefs); apply(); sync();
    });

    btn.addEventListener('click', function () {
      sync();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
    dlg.addEventListener('close', function () { try { btn.focus(); } catch (e) {} });
  }

  function ready() { build(); paintInk(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
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
