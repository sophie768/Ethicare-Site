/* Ethicare loading lines — what a tool is doing while it works, one line at a time.
   Dry, true and on-theme; the wit stays in the margins (Brand Voice, "Dry wit"), so each set
   carries at most one wry line and every other line describes real work. Utility text only:
   never a heading, never a promise.
   window.EthicareLoading.start(el, 'ask')  -> returns stop()
   window.EthicareLoading.wrap(promise, el, 'send', 800) -> resolves after the promise AND 800 ms */
(function () {
  if (window.EthicareLoading) return;
  var LINES = {
    generic: ['Putting the kettle on\u2026', 'Reading the small print\u2026', 'Checking the review date\u2026'],
    pack: ['Putting your pack together\u2026', 'Finding your regulator\u2026', 'Timing the slow documents\u2026', 'Leaving out what doesn\u2019t apply\u2026', 'Putting the kettle on\u2026'],
    ask: ['Reading the guidance\u2026', 'Checking it\u2019s still current\u2026', 'Finding the page that owns this\u2026', 'Keeping fact and opinion apart\u2026', 'Putting the kettle on\u2026'],
    checker: ['Matching your training to the Board\u2019s route\u2026', 'Reading the Board\u2019s rules, not ours\u2026', 'Checking which certificates expire first\u2026'],
    finder: ['Weighing thirteen regions against what you said\u2026', 'Checking who has a tertiary hospital\u2026', 'Looking up the rents\u2026'],
    cost: ['Adding up the fees\u2026', 'Converting the currency\u2026', 'Checking nothing is counted twice\u2026'],
    send: ['Sending\u2026', 'On its way to a person\u2026']
  };
  var CSS = '.ecl{display:inline-flex;align-items:center;gap:10px;font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:15px;color:#2F5E49}.ecl-dot{width:10px;height:10px;border-radius:50%;background:#72A471;flex:none;animation:ecl-pulse 1.2s ease-in-out infinite}.ecl-txt{transition:opacity .25s}.ecl-txt.is-out{opacity:0}@keyframes ecl-pulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){.ecl-dot{animation:none}.ecl-txt{transition:none}}';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function css() { if (document.getElementById('ecl-css')) return; var s = document.createElement('style'); s.id = 'ecl-css'; s.textContent = CSS; document.head.appendChild(s); }
  function pick(set) { return (Array.isArray(set) ? set : LINES[set] || LINES.generic).slice(); }

  function start(el, set, opts) {
    if (!el) return function () {};
    opts = opts || {}; css();
    var lines = pick(set), i = 0, interval = opts.interval || 1500;
    el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.classList.add('ecl');
    el.innerHTML = '<span class="ecl-dot" aria-hidden="true"></span><span class="ecl-txt"></span>';
    var txt = el.querySelector('.ecl-txt');
    txt.textContent = lines[0];
    var t = setInterval(function () {
      i = (i + 1) % lines.length;
      if (reduced) { txt.textContent = lines[i]; return; }
      txt.classList.add('is-out');
      setTimeout(function () { txt.textContent = lines[i]; txt.classList.remove('is-out'); }, 250);
    }, interval);
    return function stop() { clearInterval(t); };
  }

  function wrap(promise, el, set, minMs) {
    var stop = start(el, set), t0 = Date.now(), min = typeof minMs === 'number' ? minMs : 800;
    var settle = function (fn) { return function (v) { var wait = Math.max(0, min - (Date.now() - t0)); return new Promise(function (res, rej) { setTimeout(function () { stop(); try { res(fn(v)); } catch (e) { rej(e); } }, wait); }); }; };
    return Promise.resolve(promise).then(settle(function (v) { return v; }), settle(function (e) { throw e; }));
  }

  window.EthicareLoading = { LINES: LINES, pick: pick, start: start, wrap: wrap };
})();
