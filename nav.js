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
