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
    /* The slide-in, made louder (12 Oct 2026, Sophie: "pop up needs to be more impactful").
       Dark teal card with a lime button and three ticks, rather than a white card that sat
       quietly in the corner. Still not a modal: nothing is blocked and focus is not taken. */
    + '.rgn{position:fixed;right:24px;bottom:24px;z-index:80;width:min(400px,calc(100vw - 48px));overflow:hidden;background:linear-gradient(150deg,#02615D 0%,#01413E 60%,#01312F 100%);color:#fff;border-radius:22px;box-shadow:0 34px 80px -24px rgba(1,49,47,.75),0 0 0 1px rgba(255,255,255,.06) inset;padding:28px 28px 24px;transform:translateY(28px) scale(.97);opacity:0;transition:transform .5s cubic-bezier(.2,1.3,.4,1),opacity .35s ease}'
    + '.rgn::before{content:"";position:absolute;right:-70px;top:-70px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(166,200,74,.42) 0%,rgba(166,200,74,0) 70%);pointer-events:none}'
    + '.rgn.is-in{transform:none;opacity:1}'
    + '.rgn-e{position:relative;display:inline-block;font-family:"Work Sans",sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#01312F;background:#A6C84A;border-radius:999px;padding:5px 11px;margin:0 0 14px}'
    + '.rgn-k{position:relative;font-family:"Work Sans",sans-serif;font-weight:600;font-size:26px;line-height:1.15;letter-spacing:-.015em;color:#fff;margin:0 40px 10px 0}'
    + '.rgn-d{position:relative;font-size:15.5px;line-height:1.55;color:#D5E7E0;margin:0 0 14px}'
    + '.rgn-l{position:relative;list-style:none;margin:0 0 20px;padding:0;display:grid;gap:8px}'
    + '.rgn-l li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.45;color:#fff}'
    + '.rgn-l li::before{content:"";flex:none;width:20px;height:20px;margin-top:1px;border-radius:50%;background:#A6C84A url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27%3E%3Cpath d=%27M5.5 10.3l3 3 6-6.6%27 fill=%27none%27 stroke=%27%2301312F%27 stroke-width=%272.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E") center/20px no-repeat}'
    + '.rgn a.rgn-go{position:relative;display:flex;justify-content:center;align-items:center;gap:10px;min-height:56px;border-radius:14px;background:#A6C84A;color:#01312F;font-family:"Work Sans",sans-serif;font-weight:700;font-size:17px;text-decoration:none;box-shadow:0 12px 26px -12px rgba(166,200,74,.9);transition:background .15s ease,transform .15s ease}'
    + '.rgn a.rgn-go:hover{background:#C6E084;transform:translateY(-1px)}.rgn a.rgn-go:focus-visible{outline:3px solid #fff;outline-offset:3px}'
    + '.rgn-x{position:absolute;z-index:1;top:14px;right:14px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:22px;line-height:1;cursor:pointer}'
    + '.rgn-x:hover{background:rgba(255,255,255,.22)}.rgn-x:focus-visible{outline:3px solid #A6C84A;outline-offset:2px}'
    + '@media(max-width:640px){.rgn{right:0;left:0;bottom:0;width:auto;border-radius:18px 18px 0 0;padding:16px 58px 16px 22px;display:flex;align-items:center;gap:12px}'
    + '.rgn-e,.rgn-d,.rgn-l{display:none}.rgn-k{font-size:17px;margin:0;flex:1}.rgn a.rgn-go{min-height:46px;padding:0 18px;font-size:15px;flex:none}.rgn-x{top:50%;transform:translateY(-50%);width:34px;height:34px}.rgn-long{display:none}}'
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
      n.innerHTML = '<span class="rgn-e">Free &middot; takes a minute</span><p class="rgn-k">Looking to move in the next year?</p>'
        + '<p class="rgn-d">Register with Ethicare and we&rsquo;ll look out for roles that fit you.</p>'
        + '<ul class="rgn-l"><li>Tell us your profession and where you&rsquo;d like to work</li><li>We look out for roles that match</li><li>Nothing goes to an employer without your say-so</li></ul>'
        + '<a class="rgn-go" href="/register-interest?from=home-nudge"><span>Register<span class="rgn-long"> with Ethicare</span></span> <span aria-hidden="true">&rarr;</span></a>'
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
