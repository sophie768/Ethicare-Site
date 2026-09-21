/* Rotating waiting lines. Referenced by ask-ethicare.js since the assistant was built and
   never written, so every page carrying Ask Ethicare 404ed on /loading-lines.js and the
   waiting state silently fell back to nothing. The call site already degrades safely
   (`: function(){}`), which is exactly why the missing file survived unnoticed.

   Contract: window.EthicareLoading.start(el, key) -> stop()
   Writes into `el` and returns a function that clears the timer. Safe with a null element.

   Voice: Microcopy.md, "Waiting periods" and "When someone feels overwhelmed". A waiting
   state is not a place to sell or to hurry someone — it says what is happening and nothing
   more. No ellipsis theatre, no "hang tight", no progress claim we cannot make. */
(function () {
  var SETS = {
    ask: [
      'Reading your question',
      'Checking this against our own guides',
      'Looking for the official source behind it',
      'Making sure this is the right country and profession',
      'Working out what would actually help next'
    ],
    generic: ['Working on it', 'Nearly there']
  };
  /* Slow enough to read, fast enough not to look stuck. Below about 1.5s the line changes
     before it has been read, which reads as noise rather than progress. */
  var EVERY = 2200;

  function start(el, key) {
    var lines = SETS[key] || SETS.generic;
    if (!el) return function () {};
    var i = 0, timer = null;
    el.hidden = false;
    /* aria-live so the state is announced, polite so it never interrupts, and the text is a
       status rather than an instruction. */
    el.setAttribute('aria-live', 'polite');
    el.textContent = lines[0];
    timer = setInterval(function () {
      i = (i + 1) % lines.length;
      el.textContent = lines[i];
    }, EVERY);
    return function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      el.textContent = '';
      el.hidden = true;
    };
  }

  window.EthicareLoading = { start: start, sets: SETS };
})();
