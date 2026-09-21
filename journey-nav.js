/* Ethicare — journey navigation and saving.
   Two jobs, one small file, no dependencies:

   1. FORWARD AND BACK. The journey guides had a "Continue to Stage 06" panel and no way
      back; destination chapters already ship their own .ch-nav, so this leaves those
      alone. Where a page sits in a known sequence, it gets Previous · position · Next.
      Where it does not, it still gets a Back control, because "how do I get back to
      where I was" is the most common thing a reader wants and the browser button is not
      always where a phone reader looks.

   2. SAVING. A candidate reads twenty guides across three sessions and can currently
      keep none of them. Saved items live in one localStorage key and surface on /move.
      There is no account yet, so the copy says exactly that — device-local, and when
      accounts arrive the saved list is one of the things that syncs. The key is the
      list itself; nothing else writes to it.

   Styles are injected from here so a page needs one script tag and no stylesheet. */
(function () {
  'use strict';
  var KEY = 'ethicare_saved_v1';
  var MAX = 60;

  /* The guide sequences, labelled against the EIGHT-STAGE journey (names agreed 8 Sep 2026;
     the six-step labels retired the same day). `s` is the page's stage — visas and Preparing
     to move are both Stage 07, so the bar reads the stage, never the array index. Order is
     the reading order on the pages themselves — change it there and here together, or the
     bar and the journey band will disagree. */
  var STAGES = 8;
  var SEQ = [
    { name: 'Your New Zealand journey', all: '/resources', steps: [
      { u: '/guides/moving-to-new-zealand', t: 'Is it right for me?', s: 1 },
      { u: '/guides/new-zealand-registration', t: 'Can I work here?', s: 4 },
      { u: '/guides/new-zealand-interview', t: 'CV & interview', s: 6 },
      { u: '/guides/new-zealand-visa', t: 'Immigration & visas', s: 7 },
      { u: '/guides/new-zealand-relocation', t: 'Preparing to move', s: 7 },
      { u: '/guides/living-in-new-zealand', t: 'Living & thriving', s: 8 }
    ] },
    { name: 'Your Australian journey', all: '/resources', steps: [
      { u: '/guides/moving-to-australia', t: 'Is it right for me?', s: 1 },
      { u: '/guides/australia-registration', t: 'Can I work here?', s: 4 },
      { u: '/guides/australia-interview', t: 'CV & interview', s: 6 },
      { u: '/guides/australia-visa', t: 'Immigration & visas', s: 7 },
      { u: '/guides/australia-relocation', t: 'Preparing to move', s: 7 },
      { u: '/guides/living-in-australia', t: 'Living & thriving', s: 8 }
    ] }
  ];
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var CSS =
    '.jn-bar{max-width:1180px;margin:clamp(34px,4.5vw,52px) auto 0;padding:22px clamp(22px,3vw,32px) clamp(40px,5vw,64px);border-top:1px solid rgba(2,97,93,.65);' +
      'display:grid;grid-template-columns:1fr auto 1fr;gap:14px 20px;align-items:center}' +
    '.jn-bar a,.jn-bar button{font-family:"Work Sans",ui-sans-serif,sans-serif;text-decoration:none;color:#02615D}' +
    '.jn-step{display:flex;flex-direction:column;gap:3px;min-height:48px;justify-content:center;font-size:15.5px;font-weight:600;line-height:1.3}' +
    '.jn-step .k{font-size:11.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#2F5E49}' +
    '.jn-step.next{text-align:right;grid-column:3}' +
    '.jn-step:hover{color:#01312F}' +
    '.jn-mid{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}' +
    '.jn-pos{font-family:"Work Sans",ui-sans-serif,sans-serif;font-size:12.5px;font-weight:600;color:#555}' +
    '.jn-all{font-size:13.5px;font-weight:600;text-decoration:underline!important;text-underline-offset:3px}' +
    '.jn-save{display:inline-flex;align-items:center;gap:9px;min-height:48px;padding:12px 20px;border-radius:999px;white-space:nowrap;' +
      'border:1.5px solid rgba(2,97,93,.45);background:#FCFBF8;font-size:14.5px;font-weight:600;color:#02615D;cursor:pointer}' +
    '.jn-save:hover{border-color:#02615D}' +
    '.jn-save .tick{width:16px;height:16px;border-radius:4px;border:1.5px solid rgba(2,97,93,.5);display:grid;place-items:center;font-size:11px;line-height:1;color:transparent}' +
    '.jn-save[aria-pressed="true"]{background:#02615D;border-color:#02615D;color:#fff}' +
    '.jn-save[aria-pressed="true"] .tick{border-color:rgba(255,255,255,.7);color:#fff}' +
    '.jn-note{grid-column:1/-1;margin:4px 0 0;font-family:"Manrope",ui-sans-serif,sans-serif;font-size:13px;line-height:1.55;color:#555}' +
    '@media(max-width:700px){.jn-bar{grid-template-columns:1fr;padding-left:20px;padding-right:20px}' +
      '.jn-step.next{text-align:left;grid-column:1}.jn-mid{align-items:flex-start;text-align:left}}' +
    /* saved list, used on /move */
    '.jn-saved{display:grid;gap:3px;background:rgba(2,97,93,.14);border-radius:14px;overflow:hidden}' +
    '.jn-saved .row{display:grid;grid-template-columns:1fr auto;gap:12px 20px;align-items:center;background:#fff;padding:20px 22px}' +
    '.jn-saved .row a{font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:15.5px;color:#02615D;text-decoration:none;line-height:1.35}' +
    '.jn-saved .row .k{display:block;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2F5E49;margin-bottom:6px}' +
    '.jn-saved .row button{min-height:44px;min-width:44px;border:0;background:none;color:#2F5E49;font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:13.5px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}' +
    '.jn-saved .row button:hover{color:#A34438}' +
    '.jn-empty{font-family:"Manrope",ui-sans-serif,sans-serif;font-size:15.5px;line-height:1.6;color:#555;margin:0}';

  function css() {
    if (document.getElementById('jn-css')) return;
    var s = document.createElement('style');
    s.id = 'jn-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function read() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && Object.prototype.toString.call(o.items) === '[object Array]') return o;
    } catch (e) {}
    return { v: 1, items: [] };
  }
  function write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  function path() { return location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '') || '/'; }
  function title() { return (document.title || path()).split('|')[0].replace(/\s+$/, ''); }

  /* A label for the thing being saved, read from its own URL. Kept crude on purpose —
     one word, and no page has to declare anything. */
  function kind() {
    var p = path();
    if (/^\/guides\//.test(p)) return 'Guide';
    if (/^\/destinations\//.test(p)) return 'Destination';
    if (/^\/jobs\/vacancy\//.test(p)) return 'Live role';
    if (/^\/jobs\//.test(p)) return 'Profession';
    if (/^\/insights\//.test(p)) return 'Insight';
    if (/(pathway-checker|cost-calculator|build-your-cv|interview-prep|before-you-accept|moving-checklist)/.test(p)) return 'Tool';
    return 'Page';
  }

  function isSaved(p) {
    var it = read().items, i;
    for (i = 0; i < it.length; i++) if (it[i].u === p) return true;
    return false;
  }
  function toggle() {
    var o = read(), p = path(), i;
    for (i = 0; i < o.items.length; i++) {
      if (o.items[i].u === p) { o.items.splice(i, 1); write(o); return false; }
    }
    o.items.unshift({ u: p, t: title(), k: kind(), ts: Date.now() });
    if (o.items.length > MAX) o.items.length = MAX;
    write(o);
    return true;
  }
  function remove(p) {
    var o = read(), i;
    for (i = 0; i < o.items.length; i++) if (o.items[i].u === p) { o.items.splice(i, 1); break; }
    write(o);
  }

  function where() {
    var p = path(), s, i, j;
    for (i = 0; i < SEQ.length; i++) {
      s = SEQ[i];
      for (j = 0; j < s.steps.length; j++) if (s.steps[j].u === p) return { seq: s, i: j };
    }
    return null;
  }

  function esc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function saveBtn() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'jn-save';
    b.setAttribute('data-jn-save', '');
    var on = isSaved(path());
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.innerHTML = '<span class="tick" aria-hidden="true">\u2713</span><span class="lab">' + (on ? 'Saved' : 'Save this') + '</span>';
    b.addEventListener('click', function () {
      var now = toggle();
      b.setAttribute('aria-pressed', now ? 'true' : 'false');
      b.querySelector('.lab').textContent = now ? 'Saved' : 'Save this';
      if (window.track) window.track(now ? 'page_saved' : 'page_unsaved', { kind: kind() });
    });
    return b;
  }

  /* Back: the previous step where there is one, otherwise the last thing in the
     breadcrumb, otherwise browser history. Never a dead control. */
  function backTarget() {
    var c = document.querySelector('.crumb a:last-of-type, .art-crumb a:last-of-type, .st-crumb a:last-of-type, nav[aria-label="Breadcrumb"] a:last-of-type');
    return c ? { href: c.getAttribute('href'), label: c.textContent.trim() } : null;
  }

  function bar() {
    if (document.querySelector('.ch-nav') || document.querySelector('.jn-bar')) return;
    var main = document.querySelector('main') || document.body;
    var w = where(), el = document.createElement('nav');
    el.className = 'jn-bar';
    el.setAttribute('aria-label', 'Page navigation');
    var html = '';
    if (w) {
      var prev = w.i > 0 ? w.seq.steps[w.i - 1] : null;
      var next = w.i < w.seq.steps.length - 1 ? w.seq.steps[w.i + 1] : null;
      html += prev
        ? '<a class="jn-step prev" href="' + prev.u + '"><span class="k">\u2190 Previous</span>' + esc(prev.t) + '</a>'
        : '<span></span>';
      html += '<div class="jn-mid"><span class="jn-pos">' + esc(w.seq.name) + ' \u00b7 Stage ' + pad(w.seq.steps[w.i].s) + ' of ' + pad(STAGES) +
        '</span><a class="jn-all" href="' + w.seq.all + '">All stages and guides</a></div>';
      html += next
        ? '<a class="jn-step next" href="' + next.u + '"><span class="k">Next \u2192</span>' + esc(next.t) + '</a>'
        : '<span></span>';
    } else {
      var b = backTarget();
      html += b
        ? '<a class="jn-step prev" href="' + esc(b.href) + '"><span class="k">\u2190 Back to</span>' + esc(b.label) + '</a>'
        : '<a class="jn-step prev" href="/resources"><span class="k">\u2190 Back to</span>Guides &amp; resources</a>';
      html += '<div class="jn-mid"></div><span></span>';
    }
    el.innerHTML = html;
    el.querySelector('.jn-mid').appendChild(saveBtn());
    var note = document.createElement('p');
    note.className = 'jn-note';
    note.textContent = 'Saving adds this page to your list on Move. It is stored in this browser, on this device \u2014 so it will not follow you to your phone, and clearing your browsing data clears it.';
    el.appendChild(note);
    main.appendChild(el);
  }

  /* Used by /move to show what has been kept. */
  function renderSaved(host) {
    if (!host) return;
    css();
    var items = read().items;
    if (!items.length) {
      host.innerHTML = '<p class="jn-empty">Nothing saved yet. There is a <b>Save this</b> button at the foot of every guide, ' +
        'profession page and destination chapter \u2014 use it as you read and the useful ones collect here.</p>';
      return;
    }
    host.innerHTML = '<div class="jn-saved">' + items.map(function (it) {
      return '<div class="row"><a href="' + esc(it.u) + '"><span class="k">' + esc(it.k) + '</span>' + esc(it.t) + '</a>' +
        '<button type="button" data-jn-rm="' + esc(it.u) + '">Remove</button></div>';
    }).join('') + '</div>';
    host.onclick = function (e) {
      var b = e.target.closest ? e.target.closest('[data-jn-rm]') : null;
      if (!b) return;
      remove(b.getAttribute('data-jn-rm'));
      renderSaved(host);
    };
  }

  window.EthicareSaved = {
    key: KEY, read: read, toggle: toggle, remove: remove, render: renderSaved,
    count: function () { return read().items.length; }
  };

  function init() { css(); bar(); renderSaved(document.querySelector('[data-saved-list]')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
