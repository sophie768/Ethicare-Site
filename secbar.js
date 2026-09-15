/* ==========================================================================
   STICKY SECTION BAR — behaviour
   1. Highlights the bucket you are currently reading (scroll spy).
   2. On mobile the heavy sections sit behind "Show details" (site.js), so a
      bar tap opens the target section BEFORE scrolling — otherwise you land
      on a bare heading and assume the page is broken.
   Requires secbar.css. No-op on pages without nav.secbar.
   ========================================================================== */
(function () {
  var bar = document.querySelector('nav.secbar');
  if (!bar) return;
  var links = [].slice.call(bar.querySelectorAll('a[href^="#"]'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if (!links.length) return;

  function spy() {
    var i = 0;
    for (var n = 0; n < targets.length; n++) {
      if (targets[n] && targets[n].getBoundingClientRect().top <= 150) i = n;
    }
    links.forEach(function (a, n) {
      if (n === i) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
    });
  }
  spy();
  addEventListener('scroll', spy, { passive: true });
  addEventListener('resize', spy);

  function reveal(sec) {
    if (!sec) return;
    var t = sec.querySelector('.mc-toggle');
    if (t && t.getAttribute('aria-expanded') === 'false') t.click();
  }
  function offset() { return matchMedia('(max-width:760px)').matches ? 52 : 136; }

  links.forEach(function (a, n) {
    a.addEventListener('click', function (e) {
      var sec = targets[n];
      if (!sec) return;
      e.preventDefault();
      reveal(sec);
      var y = sec.getBoundingClientRect().top + scrollY - offset();
      scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });

  if (location.hash) setTimeout(function () { reveal(document.querySelector(location.hash)); }, 60);
})();
