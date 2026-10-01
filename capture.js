/* ============================================================================
   Ethicare — client capture helper (site-wide)
   Fire-and-forget POST to the capture endpoint. Never blocks the UI, never
   throws, and uses keepalive so it survives a page navigation (e.g. a form
   that then redirects). Personal data still also goes through the page's own
   flow (Netlify Forms for /apply); this is the queryable record on top.

   Usage:
     EthicareCapture.lead({ source:'coming-to-australia', email, profession });
     EthicareCapture.plan({ email, payload });           // or { anon_key, payload }
     EthicareCapture.application({ ...allFormFields });   // used by /apply
   ============================================================================ */
(function () {
  'use strict';
  var ENDPOINT = '/.netlify/functions/capture';

  function send(kind, payload) {
    try {
      var body = Object.assign({ kind: kind, page: location.pathname }, payload || {});
      // carry a referral param through if present (?ref=)
      try {
        var ref = new URLSearchParams(location.search).get('ref');
        if (ref && !body.ref && !body.referral_source) body.ref = ref;
      } catch (e) {}
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify(body)
      }).catch(function () {});
    } catch (e) { /* never let capture break a page */ }
  }

  window.EthicareCapture = {
    send: send,
    lead: function (p) { return send('lead', p); },
    plan: function (p) { return send('plan', p); },
    application: function (data) { return send('application', { data: data }); }
  };
})();
