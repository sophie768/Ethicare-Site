/* Ethicare — event capture.
   No cookies, no identifiers, no personal data. Fails silently: a broken or blocked
   analytics endpoint must never break a page.

   One interface, `track(name, props)`, so call sites never change when the transport
   does. Today that transport is Plausible custom events (already loaded site-wide as
   script.tagged-events.js, which exposes window.plausible). When the Postgres events
   table in "Ethicare Candidate Database Spec.md" exists, this file gains a second
   send and every call site stays exactly as written.

   Event names and props are the fixed fifteen in "Ethicare Analytics Spec.md". Adding
   one here without adding it there is how an event list gets to eighty. */
(function () {
  var QUEUE = [];

  /* Plausible is `defer`, so early calls land before window.plausible exists. Its own
     stub handles this, but only once the script has parsed — queue until then. */
  function send(name, props) {
    try {
      if (typeof window.plausible === 'function') {
        window.plausible(name, props && Object.keys(props).length ? { props: props } : undefined);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function drain() {
    while (QUEUE.length) {
      var ev = QUEUE[0];
      if (!send(ev[0], ev[1])) return;
      QUEUE.shift();
    }
  }

  window.track = function (name, props) {
    if (!name) return;
    var clean = {};
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === undefined || v === null || v === '') return;
        /* Everything is coerced to a short string: Plausible props are strings, and this
           also stops a stray object or a long free-text value being sent by accident. */
        clean[k] = String(v).slice(0, 60);
      });
    }
    if (!send(name, clean)) {
      QUEUE.push([name, clean]);
      if (QUEUE.length > 30) QUEUE.shift();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drain);
  } else {
    drain();
  }
  window.addEventListener('load', drain);
  setInterval(drain, 4000);
})();
