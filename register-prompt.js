/* Register with Ethicare: the prompts (9 Oct 2026).
   Sophie: "there must be a way to capture all leads that enter the site … it is still not
   screaming out anywhere" and "maybe even a pop up on the home page?"
   Two things, one destination (/register-interest):
     1. On the homepage, a small card that slides in at the bottom corner once someone has shown
        interest: two-thirds of the way down the page, or 40 seconds in. Never on arrival, once
        per visit, gone for 30 days if closed, and never for anyone who has registered. On a phone
        it is a slim bar along the bottom, not a full-screen box. It is not a modal: nothing is
        blocked, focus is not taken, and Escape closes it.
     2. After a tool has given someone an answer (destination finder results, the cost estimate,
        the plan summary, the pathway checker result), one line card: "Want us to look out for
        roles like this?" — the moment the offer is most useful.
   Nothing here sends anything; it only links. Registered = ethicare_registered_v1 on this device,
   set by register.js on submit. */
(function () {
  'use strict';
  var REG = 'ethicare_registered_v1', SHUT = 'ethicare_regnudge_closed_v1', SEEN = 'ethicare_regnudge_seen';
  function get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } }
  function put(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  function registered() { return !!get(REG); }
  function track(n, p) { try { if (window.track) window.track(n, p || {}); } catch (e) {} }

  var CSS = ''
    + '.rgp{display:flex;flex-wrap:wrap;align-items:center;gap:14px 24px;margin:24px 0 0;padding:20px 24px;border-radius:16px;background:#E6F1ED;border:1px solid #C9DED3;color:#01312F}'
    + '.rgp-t{flex:1 1 300px;min-width:0}.rgp-k{display:block;font-family:"Work Sans",sans-serif;font-weight:600;font-size:18px;line-height:1.3;color:#02615D;margin:0 0 4px}'
    + '.rgp-d{display:block;font-size:15px;line-height:1.55;color:#333}'
    + '.rgp a.rgp-go{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:12px 24px;border-radius:12px;background:#02615D;color:#fff;font-family:"Work Sans",sans-serif;font-weight:600;font-size:15.5px;text-decoration:none;white-space:nowrap}'
    + '.rgp a.rgp-go:hover{background:#014E4B}.rgp a.rgp-go:focus-visible{outline:3px solid #02615D;outline-offset:3px}'
    + '.rgn{position:fixed;right:20px;bottom:20px;z-index:80;width:min(360px,calc(100vw - 40px));background:#fff;border:1px solid #DCE7E1;border-radius:18px;box-shadow:0 24px 60px -20px rgba(1,49,47,.45);padding:22px 22px 20px;transform:translateY(16px);opacity:0;transition:transform .35s ease,opacity .35s ease}'
    + '.rgn.is-in{transform:none;opacity:1}'
    + '.rgn-e{display:block;font-family:"Work Sans",sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:#2F5E49;margin:0 0 8px}'
    + '.rgn-k{font-family:"Work Sans",sans-serif;font-weight:600;font-size:19px;line-height:1.3;color:#01312F;margin:0 32px 8px 0}'
    + '.rgn-d{font-size:15px;line-height:1.55;color:#333;margin:0 0 16px}'
    + '.rgn a.rgn-go{display:flex;justify-content:center;align-items:center;gap:8px;min-height:50px;border-radius:12px;background:#02615D;color:#fff;font-family:"Work Sans",sans-serif;font-weight:600;font-size:16px;text-decoration:none}'
    + '.rgn a.rgn-go:hover{background:#014E4B}.rgn a.rgn-go:focus-visible{outline:3px solid #02615D;outline-offset:3px}'
    + '.rgn-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border:0;border-radius:50%;background:#F3F7F4;color:#02615D;font-size:20px;line-height:1;cursor:pointer}'
    + '.rgn-x:hover{background:#E6F1ED}.rgn-x:focus-visible{outline:3px solid #02615D;outline-offset:2px}'
    + '@media(max-width:640px){.rgn{right:0;left:0;bottom:0;width:auto;border-radius:16px 16px 0 0;padding:14px 56px 14px 18px;display:flex;align-items:center;gap:12px}'
    + '.rgn-e,.rgn-d{display:none}.rgn-k{font-size:15.5px;margin:0;flex:1}.rgn a.rgn-go{min-height:44px;padding:0 16px;font-size:14.5px;flex:none}.rgn-x{top:50%;transform:translateY(-50%)}.rgn-long{display:none}}'
    + '@media (prefers-reduced-motion:reduce){.rgn{transition:none}}';
  var cssDone = false;
  function css() { if (cssDone) return; cssDone = true; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }

  /* ---- 2. the inline card after a tool ------------------------------------------------- */
  function card(from, title, line) {
    return '<div class="rgp" data-rgp><span class="rgp-t"><span class="rgp-k">' + title + '</span><span class="rgp-d">' + line + '</span></span>'
      + '<a class="rgp-go" href="/register-interest?from=' + from + '" data-rgp-go="' + from + '">Register with Ethicare <span aria-hidden="true">&rarr;</span></a></div>';
  }
  var SPOTS = [
    { sel: '.df-out:not([hidden])', from: 'destination-finder', where: 'end', t: 'Want us to look out for roles in places like these?', d: 'Register with Ethicare in a minute. We&rsquo;ll tell you when something fits, and plainly when it doesn&rsquo;t.' },
    { sel: '#cc-app .cc-glance', from: 'cost-calculator', where: 'app', t: 'Want help making the numbers work?', d: 'Register with Ethicare and we&rsquo;ll look out for roles with relocation support that fits your move.' },
    { sel: '.ps-sum', from: 'plan', where: 'after', t: 'Want us to look out for roles while you plan?', d: 'Register with Ethicare in a minute. Nothing goes to an employer without your say-so.' },
    { sel: '.pw-resacts', from: 'pathway-checker', where: 'after', t: 'Want us to look out for roles that fit your registration?', d: 'Register with Ethicare in a minute and we&rsquo;ll be in touch when something suits you.' }
  ];
  function place() {
    if (registered()) return;
    SPOTS.forEach(function (sp) {
      var el = document.querySelector(sp.sel); if (!el) return;
      var host = sp.where === 'app' ? document.getElementById('cc-app') : sp.where === 'end' ? el : el.parentNode;
      if (!host || host.querySelector('[data-rgp]')) return;
      css();
      var w = document.createElement('div'); w.innerHTML = card(sp.from, sp.t, sp.d); var c = w.firstChild;
      if (sp.where === 'after') el.parentNode.insertBefore(c, el.nextSibling); else host.appendChild(c);
    });
  }
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-rgp-go]'); if (a) track('register_prompt_click', { from: a.getAttribute('data-rgp-go') }); });
  if (window.MutationObserver) {
    var pending = false;
    new MutationObserver(function () { if (pending) return; pending = true; setTimeout(function () { pending = false; place(); }, 120); })
      .observe(document.body, { childList: true, subtree: true });
  }

  /* ---- 1. the homepage slide-in --------------------------------------------------------- */
  function nudge() {
    if (!document.body.hasAttribute('data-reg-nudge') || registered() || get(SEEN, true)) return;
    var shut = parseInt(get(SHUT) || '0', 10); if (shut && Date.now() - shut < 30 * 864e5) return;
    var shown = false, t;
    function show() {
      if (shown || registered()) return; shown = true; put(SEEN, '1', true); css();
      window.removeEventListener('scroll', onScroll); clearTimeout(t);
      var n = document.createElement('aside'); n.className = 'rgn'; n.setAttribute('aria-label', 'Register with Ethicare');
      n.innerHTML = '<span class="rgn-e">Free &middot; about a minute</span><p class="rgn-k">Looking to move in the next year?</p>'
        + '<p class="rgn-d">Register with Ethicare and we&rsquo;ll look out for roles that fit you. Nothing goes to an employer without your say-so.</p>'
        + '<a class="rgn-go" href="/register-interest?from=home-nudge">Register<span class="rgn-long"> with Ethicare</span> <span aria-hidden="true">&rarr;</span></a>'
        + '<button type="button" class="rgn-x" aria-label="Close">&times;</button>';
      document.body.appendChild(n);
      requestAnimationFrame(function () { requestAnimationFrame(function () { n.classList.add('is-in'); }); });
      function close() { put(SHUT, String(Date.now())); n.remove(); document.removeEventListener('keydown', esc); track('register_nudge_close'); }
      function esc(e) { if (e.key === 'Escape') close(); }
      n.querySelector('.rgn-x').addEventListener('click', close);
      n.querySelector('.rgn-go').addEventListener('click', function () { track('register_nudge_click'); });
      document.addEventListener('keydown', esc);
      track('register_nudge_shown');
    }
    function onScroll() {
      var max = document.documentElement.scrollHeight - innerHeight;
      if (max > 0 && scrollY / max > 0.6) show();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    t = setTimeout(show, 40000);
  }

  window.EthicareRegister = { registered: registered, place: place };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { place(); nudge(); });
  else { place(); nudge(); }
})();
