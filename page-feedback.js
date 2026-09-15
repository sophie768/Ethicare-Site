/* <page-feedback> — "Was this page useful?" for every content page. Two buttons, then one
   optional line, posted to the Netlify form `page-feedback` with the page path and an anonymous
   context line (profession · destination · stage from ethicare_profile_v1 — never a name or an
   email). Remembers the answer per page. Analytics go through window.track like Ask Ethicare.
   The static form Netlify needs at build time lives in site/_forms/page-feedback.html.
   Usage: <script src="/page-feedback.js" defer></script> … <page-feedback></page-feedback>
   Attributes: label · page (defaults to location.pathname) · to (who reads it; default "a person") */
(function () {
  if (window.customElements && customElements.get('page-feedback')) return;
  var UP = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
  var DOWN = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>';
  var REASONS = ['Out of date', 'Didn\u2019t answer my question', 'Too generic', 'Hard to find things', 'Something else'];
  var CSS = ':host{display:block;font-family:Manrope,ui-sans-serif,system-ui,sans-serif;color:#333}*{box-sizing:border-box}' +
    '.card{background:#fff;border:1px solid #C9DED3;border-radius:16px;padding:18px 22px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px}' +
    '.q{font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:16.5px;color:#02615D;margin:0}' +
    '.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    'button{font:inherit;cursor:pointer}' +
    '.pill{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 16px;border-radius:999px;border:1.5px solid #02615D;background:#fff;color:#02615D;font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:14.5px}' +
    '.pill:hover{background:#E6F1ED}.pill[aria-pressed="true"]{background:#02615D;color:#fff}' +
    '.pill.sm{min-height:40px;padding:8px 14px;font-size:13.5px}' +
    '.more{flex-basis:100%;display:grid;gap:10px}' +
    '.more p{margin:0;font-size:15px;line-height:1.55;color:#555}' +
    'label{font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:14.5px;color:#02615D}' +
    'textarea{width:100%;min-height:56px;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(2,97,93,.65);font:inherit;font-size:15px;color:#333;resize:vertical}' +
    '.send{display:inline-flex;align-items:center;min-height:44px;padding:10px 18px;border-radius:12px;border:0;background:#02615D;color:#fff;font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:15px}.send:hover{background:#01312F}' +
    '.skip{border:0;background:none;padding:10px 4px;color:#02615D;font-family:"Work Sans",ui-sans-serif,sans-serif;font-weight:600;font-size:14.5px;text-decoration:underline;text-decoration-color:#72A471;text-underline-offset:4px}' +
    '.done{font-size:15.5px;line-height:1.55;color:#2F5E49;margin:0}.fine{flex-basis:100%;font-size:13.5px;line-height:1.5;color:#555;margin:0}' +
    ':host(:focus-within) .card{border-color:#02615D}button:focus-visible,textarea:focus-visible{outline:3px solid #02615D;outline-offset:2px;box-shadow:0 0 0 2px #FCFBF8}' +
    '@media print{:host{display:none}}';

  function track(name, props) { try { if (window.track) window.track(name, props); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function context() {
    try {
      var p = JSON.parse(localStorage.getItem('ethicare_profile_v1') || '{}') || {};
      return [p.profession, p.destination, p.stage, p.party, p.from].filter(Boolean).join(' \u00b7 ');
    } catch (e) { return ''; }
  }

  class PageFeedback extends HTMLElement {
    connectedCallback() {
      this.page = this.getAttribute('page') || location.pathname;
      this.key = 'ec-fb:' + this.page;
      this.root = this.attachShadow({ mode: 'open' });
      var seen = null; try { seen = localStorage.getItem(this.key); } catch (e) {}
      this.state = seen ? { step: 'done', verdict: seen, again: true } : { step: 'ask' };
      this.render();
      this.root.addEventListener('click', this.onClick.bind(this));
      this.root.addEventListener('submit', this.onSubmit.bind(this));
    }
    label() { return this.getAttribute('label') || 'Was this page useful?'; }
    to() { return this.getAttribute('to') || 'a person'; }
    render() {
      var s = this.state, h = '<style>' + CSS + '</style><div class="card" role="group" aria-label="' + esc(this.label()) + '">';
      if (s.step === 'ask' || s.step === 'reason' || s.step === 'comment') {
        h += '<p class="q">' + esc(this.label()) + '</p><div class="row">' +
          '<button type="button" class="pill" data-v="useful" aria-pressed="' + (s.verdict === 'useful') + '">' + UP + 'Yes</button>' +
          '<button type="button" class="pill" data-v="not-useful" aria-pressed="' + (s.verdict === 'not-useful') + '">' + DOWN + 'Not quite</button></div>';
      }
      if (s.step === 'reason') {
        h += '<div class="more"><p>Sorry about that. What got in the way?</p><div class="row">' + REASONS.map(function (r) { return '<button type="button" class="pill sm" data-r="' + esc(r) + '">' + esc(r) + '</button>'; }).join('') + '</div></div>';
      }
      if (s.step === 'comment') {
        h += '<form class="more" novalidate><label for="fb-c">' + (s.verdict === 'useful' ? 'Anything that would have made it more useful? Optional.' : 'What were you looking for? A line is plenty.') + '</label>' +
          '<textarea id="fb-c" name="comment" rows="2" maxlength="600"></textarea>' +
          '<div class="row"><button type="submit" class="send">Send</button><button type="button" class="skip" data-skip>No, that\u2019s all</button></div></form>';
      }
      if (s.step === 'done') {
        h += '<p class="done">' + (s.again ? 'Thanks for telling us about this page.' : s.sent ? 'Thank you. It goes to ' + esc(this.to()) + ', and it helps decide what we fix next.' : 'Thank you \u2014 noted.') + '</p>';
      }
      h += '<p class="fine" aria-live="polite">' + (s.step === 'done' ? '' : 'Anonymous, and read by ' + esc(this.to()) + '.') + '</p></div>';
      this.root.innerHTML = h;
      var ta = this.root.querySelector('textarea'); if (ta && s.focus) ta.focus();
    }
    onClick(e) {
      var v = e.target.closest('[data-v]'), r = e.target.closest('[data-r]'), skip = e.target.closest('[data-skip]');
      if (v) {
        var verdict = v.getAttribute('data-v');
        track('page_rated', { page: this.page, verdict: verdict });
        this.state = verdict === 'useful' ? { step: 'comment', verdict: verdict, focus: false } : { step: 'reason', verdict: verdict };
        this.render(); return;
      }
      if (r) { this.state.reason = r.getAttribute('data-r'); this.state.step = 'comment'; this.state.focus = true; track('page_rated', { page: this.page, verdict: 'not-useful', reason: this.state.reason }); this.render(); return; }
      if (skip) { this.finish(false); }
    }
    onSubmit(e) {
      e.preventDefault();
      var comment = (this.root.querySelector('textarea') || {}).value || '';
      if (!comment.trim() && !this.state.reason) { this.finish(false); return; }
      var body = new URLSearchParams({ 'form-name': 'page-feedback', page: this.page, title: document.title, verdict: this.state.verdict, reason: this.state.reason || '', comment: comment.trim(), context: context() }).toString();
      var live = /ethicareresourcing\.com$|netlify\.app$/.test(location.hostname);
      var done = this.finish.bind(this, true);
      if (!live) { done(); return; }
      var fine = this.root.querySelector('.fine'); if (fine) fine.textContent = 'On its way to a person\u2026';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body }).then(done, done);
    }
    finish(sent) {
      try { localStorage.setItem(this.key, this.state.verdict || 'useful'); } catch (e) {}
      this.state = { step: 'done', sent: sent, verdict: this.state.verdict };
      this.render();
    }
  }
  customElements.define('page-feedback', PageFeedback);
})();
