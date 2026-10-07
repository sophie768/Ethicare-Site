/* ============================================================================
   Ethicare Resourcing — form safety net (7 Oct 2026)

   Every Netlify form that ends on /thank-you is sent through here instead of a
   plain browser submit, so the site can SEE whether Netlify accepted it.

     1. Post to Netlify Forms, as before. Accepted → go to the thank-you page.
        Nothing about the normal path changes: same record, same notification.
     2. Refused (Netlify answers 404 when it does not know the form — which is
        what happened on 7 Oct when `contact` was deleted in the dashboard) or
        the post fails outright → send the same fields to
        /.netlify/functions/form-backup, which emails them to the office with an
        ACTION NEEDED subject. Then go to the thank-you page: the message arrived.
     3. Both fail → stay on the page, keep everything they typed, and say plainly
        that it did not send, with the email address to use instead.

   A person should never be shown "sent" for a message that went nowhere.

   Leaves alone: any form whose own script already called preventDefault (the
   guide pack on /move-steps handles its own sending), and forms that do not end
   on /thank-you. The pathway checker, cost calculator and /apply submit through
   their own code; /apply also writes to Supabase, which is its own backup.
   ============================================================================ */
(function () {
  'use strict';

  /* ---- One list of everyone who gets in touch (7 Oct 2026) -----------------------------
     Every accepted submission is also copied to the `leads` table in Supabase through
     /.netlify/functions/capture, so enquiries live in one place rather than a dozen
     Netlify form lists. Fire and forget, keepalive: it never delays or blocks the
     submission, and if it fails the Netlify record and the email are unaffected.
     Also used directly by the pathway checker and cost calculator, which submit through
     their own code: window.EthicareLead.send('<source>', {fields}). */
  var EMPLOYER = { 'vacancy': 1, 'employer-enquiry': 1 };
  function pick(f, re) { for (var k in f) if (re.test(k) && f[k]) return f[k]; return ''; }
  function sendLead(source, f) {
    try {
      if (!window.fetch || !f || f['bot-field'] || f['bot-trap']) return;
      var clean = {}, n = 0;
      for (var k in f) {
        if (n >= 60 || /^(form-name|bot-field|bot-trap|_subject)$/.test(k)) continue;
        var v = f[k]; if (v == null || v === '') continue;
        clean[k] = typeof v === 'string' ? v.slice(0, 2000) : v; n++;
      }
      var q = new URLSearchParams(location.search);
      var yes = function (v) { return v === true || /^(yes|true)$/i.test(String(v || '')); };
      var body = {
        kind: 'lead', source: source, page: location.pathname,
        email: pick(clean, /^e-?mail$/i) || pick(clean, /email/i),
        name: clean.name || [clean.first_name, clean.last_name].filter(Boolean).join(' '),
        phone: pick(clean, /^(phone|mobile|tel)/i),
        profession: pick(clean, /^(profession|role|modality)$/i),
        destination: clean.destination || clean.dest || '',
        timeline: clean.timeline || clean.timeframe || '',
        based_in: clean.based_in || '',
        wants_call: clean.contact_preference || '',
        role_alerts: yes(clean.role_alerts) || yes(clean.opt_roles),
        quarterly_update: yes(clean.quarterly_update) || yes(clean.opt_quarterly),
        who: EMPLOYER[source] || /employer/i.test(clean.enquiry_type || '') ? 'employer' : 'candidate',
        referral_source: clean.utm_source || q.get('utm_source') || q.get('ref') || '',
        payload: clean
      };
      fetch('/.netlify/functions/capture', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {});
    } catch (e) {}
  }
  window.EthicareLead = { send: sendLead };

  if (!window.fetch || !window.FormData) return;          // very old browser: native submit, as before

  var BACKUP = '/.netlify/functions/form-backup';
  var MAIL = 'hello@ethicareresourcing.com';

  function isOurs(form) {
    if (!form || form.tagName !== 'FORM') return false;
    if (!form.hasAttribute('data-netlify') && !form.hasAttribute('netlify')) return false;
    var action = form.getAttribute('action') || '';
    return action.indexOf('/thank-you') === 0;
  }

  function fieldsOf(form) {
    var out = {}, files = [];
    new FormData(form).forEach(function (v, k) {
      if (typeof v !== 'string') { if (v && v.name) files.push(v.name); return; }
      out[k] = out[k] ? out[k] + ', ' + v : v;               // checkbox groups arrive as one line
    });
    return { fields: out, files: files };
  }

  function hasFile(form) {
    var inputs = form.querySelectorAll('input[type="file"]');
    for (var i = 0; i < inputs.length; i++) if (inputs[i].files && inputs[i].files.length) return true;
    return false;
  }

  function showFailure(form, btn, label) {
    if (btn) { btn.disabled = false; btn.textContent = label; }
    var box = form.querySelector('.fs-fail');
    if (!box) {
      box = document.createElement('p');
      box.className = 'fs-fail';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'margin:18px 0 0;padding:14px 16px;border-radius:10px;background:#FBEDEA;border:1px solid #E7B9AF;color:#3E4B47;font-size:15px;line-height:1.55';
      (btn && btn.parentNode ? btn.parentNode : form).appendChild(box);
    }
    box.innerHTML = '<strong style="color:#A34438">This did not send.</strong> Everything you typed is still here &mdash; please try again in a minute, or email <a href="mailto:' + MAIL + '" style="color:#02615D;font-weight:600">' + MAIL + '</a> and we will pick it up from there.';
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!isOurs(form) || e.defaultPrevented) return;
    if (form.dataset.fsSending === '1') { e.preventDefault(); return; }   // no double sends
    e.preventDefault();

    var action = form.getAttribute('action');
    var btn = form.querySelector('button[type="submit"], input[type="submit"]');
    var label = btn ? (btn.textContent || btn.value) : '';
    if (btn) { btn.disabled = true; if (btn.tagName === 'BUTTON') btn.textContent = 'Sending…'; }
    form.dataset.fsSending = '1';

    var file = hasFile(form);
    var body = file ? new FormData(form) : new URLSearchParams(new FormData(form)).toString();
    var opts = { method: 'POST', body: body };
    if (!file) opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    function done() { sendLead(form.getAttribute('name') || 'form', fieldsOf(form).fields); window.location.href = action; }

    function backup(status) {
      var f = fieldsOf(form);
      return fetch(BACKUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: form.getAttribute('name') || '',
          fields: f.fields,
          files: f.files,
          page: location.pathname,
          status: status
        })
      }).then(function (r) {
        if (r.ok) return done();
        throw new Error('backup ' + r.status);
      });
    }

    /* Post to the form's own action, exactly where the native submit went: that is the
       request Netlify answered with a 404 when the form was missing. */
    fetch(action, opts)
      .then(function (r) {
        if (r.ok) return done();
        return backup('HTTP ' + r.status);
      }, function () {
        return backup('network');
      })
      .catch(function () {
        form.dataset.fsSending = '';
        showFailure(form, btn, label);
      });
  });
})();
