/* Essential / Dig deeper — opens the <details class="ddwrap"> layer when an in-page
   anchor targets something inside it (tri-bar links, "On this page" navs, hash loads).
   Progressive enhancement: without JS the summary click still works natively. */
(function () {
  function openFor(el) {
    var d = el && el.closest ? el.closest('details') : null;
    while (d) { d.open = true; d = d.parentElement ? d.parentElement.closest('details') : null; }
  }
  function fromHash() {
    if (!location.hash) return;
    var t = document.getElementById(location.hash.slice(1));
    if (t) openFor(t);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (!a) return;
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (u.pathname !== location.pathname || !u.hash) return;
    var t = document.getElementById(u.hash.slice(1));
    if (t) openFor(t); /* open before default navigation so the scroll lands */
  });
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
