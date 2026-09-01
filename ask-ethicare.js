/* Ask Ethicare V1 — UI + transport. Prototype: window.claude.complete (this preview).
   Production: POST /.netlify/functions/ask-ethicare (OpenAI key stays server-side). */
(function () {
  var form = document.querySelector('[data-aske-form]');
  if (!form || !window.ASK_ETHICARE_KB) return;
  var KB = window.ASK_ETHICARE_KB;
  var input = form.querySelector('textarea');
  var goBtn = form.querySelector('.aske-go');
  var thread = document.querySelector('[data-aske-thread]');
  var chips = document.querySelector('[data-aske-chips]');
  var history = [];   // {role, content} — user/assistant only; session memory, never stored
  var busy = false;

  /* rotating placeholder */
  var examples = [
    'Can I work in New Zealand as a UK radiographer?',
    'We\u2019ve been offered $120,000 in Christchurch. Could a family of four live comfortably?',
    'I\u2019m a sonographer. Is Australia or New Zealand easier for registration?',
    'I\u2019ve already accepted a job in Auckland. What should I organise before we move?',
    'Which parts of Australia suit a radiographer with young children?'
  ];
  var pi = 0, rotor = setInterval(function () {
    if (document.activeElement === input || input.value) return;
    pi = (pi + 1) % examples.length; input.setAttribute('placeholder', examples[pi]);
  }, 4200);

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* markdown-lite: **bold**, paragraphs, "- " lists */
  function render(md) {
    var blocks = md.trim().split(/\n{2,}/), out = '';
    blocks.forEach(function (b) {
      var lines = b.split('\n');
      if (lines.every(function (l) { return /^\s*[-\u2022]\s+/.test(l); })) {
        out += '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-\u2022]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      } else out += '<p>' + inline(b.replace(/\n/g, '<br>')) + '</p>';
    });
    return out;
  }
  function inline(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function liveJobsContext() {
    var jobs = window.ETHICARE_JOBS;
    if (!jobs || !jobs.length) return 'Live Ethicare vacancies: unavailable right now — route people to the jobs page rather than guessing.';
    return 'Live Ethicare vacancies right now (' + jobs.length + ' — never invent others; packages are "competitive"):\n' +
      jobs.slice(0, 24).map(function (j) { return '- ' + (j.title || j.role || 'Role') + (j.country ? ' — ' + j.country : ''); }).join('\n');
  }

  function systemPrompt() {
    return KB.system + '\n\nResource ids you may return under NEXT_ACTIONS:\n' +
      Object.keys(KB.resources).map(function (k) { return k + ' = ' + KB.resources[k].t; }).join('\n') +
      '\n\n' + liveJobsContext();
  }

  async function askLLM(messages) {
    if (window.claude && window.claude.complete) {
      return window.claude.complete({ system: systemPrompt(), max_tokens: 1200, messages: messages });
    }
    var r = await fetch('/.netlify/functions/ask-ethicare', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt(), messages: messages })
    });
    if (!r.ok) throw new Error('ask-ethicare ' + r.status);
    return (await r.json()).text;
  }

  function track(props) { try { if (window.plausible) window.plausible('Ask Ethicare', { props: props }); } catch (e) {} }

  function parse(text) {
    var handoff = /(^|\n)HANDOFF\s*(\n|$)/.test(text);
    text = text.replace(/(^|\n)HANDOFF\s*/g, '\n');
    var parts = text.split(/\nNEXT_ACTIONS\s*\n?/);
    var body = parts[0].trim();
    var ids = (parts[1] || '').split('\n').map(function (l) { return l.trim().toLowerCase().replace(/[^a-z_]/g, ''); })
      .filter(function (id) { return KB.resources[id]; }).slice(0, 4);
    return { body: body, ids: ids, handoff: handoff };
  }

  function actionsHtml(ids, handoff) {
    var h = '';
    if (handoff) h += '<div class="aske-handoff"><p><strong>This might be worth discussing with us.</strong> Some situations need a person, not a summary.</p><a href="/contact">Talk to the Ethicare team &rarr;</a></div>';
    if (ids.length) h += '<div class="aske-acts">' + ids.map(function (id) {
      var r = KB.resources[id];
      return '<a class="aske-act" href="' + r.u + '"><span class="at">' + r.t + '</span><span class="ad">' + r.d + '</span><span class="ag" aria-hidden="true">&rarr;</span></a>';
    }).join('') + '</div>';
    return h;
  }

  function feedbackHtml(n) {
    return '<div class="aske-fb" data-fb="' + n + '"><span>Was this useful?</span><button type="button" data-fb-yes>Yes</button><button type="button" data-fb-no>Not quite</button></div>';
  }

  async function ask(q) {
    if (busy || !q.trim()) return;
    busy = true; goBtn.disabled = true; clearInterval(rotor);
    thread.hidden = false;
    var n = history.length;
    var turn = document.createElement('div');
    turn.className = 'aske-turn';
    turn.innerHTML = '<p class="aske-you"><span>You asked</span>' + esc(q.trim()) + '</p><div class="aske-ans"><p class="aske-wait">Ethicare is thinking&hellip;</p></div>';
    thread.appendChild(turn);
    input.value = ''; input.setAttribute('placeholder', 'Keep asking \u2014 I\u2019ll remember what you\u2019ve told me');
    track({ event: 'question' });
    history.push({ role: 'user', content: q.trim() });
    var ans = turn.querySelector('.aske-ans');
    try {
      var raw = await askLLM(history.slice(-12));
      history.push({ role: 'assistant', content: raw });
      var p = parse(raw);
      ans.innerHTML = render(p.body) + actionsHtml(p.ids, p.handoff) + feedbackHtml(n);
    } catch (e) {
      ans.innerHTML = '<p><strong>Ask Ethicare is briefly unavailable.</strong> Everything it draws on is still here: the <a href="/pathway-checker">pathway checker</a>, the <a href="/resources">guides library</a>, or <a href="/contact">the team</a>.</p>';
    }
    busy = false; goBtn.disabled = false;
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); }
  });
  if (chips) chips.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    input.value = b.getAttribute('data-q') || b.textContent;
    input.focus(); ask(input.value);
  });
  thread.addEventListener('click', function (e) {
    var fb = e.target.closest('.aske-fb'); if (!fb) return;
    if (e.target.hasAttribute('data-fb-yes')) { track({ event: 'useful' }); fb.innerHTML = '<span>Thanks \u2014 noted.</span>'; }
    else if (e.target.hasAttribute('data-fb-no')) {
      fb.innerHTML = '<span>What was wrong?</span>' + ['Out of date', 'Didn\u2019t answer it', 'Too generic', 'Something else'].map(function (r) { return '<button type="button" data-fb-r="' + r + '">' + r + '</button>'; }).join('');
    } else if (e.target.hasAttribute('data-fb-r')) {
      track({ event: 'not-quite', reason: e.target.getAttribute('data-fb-r') });
      fb.innerHTML = '<span>Thanks \u2014 that helps us improve it.</span>';
    }
  });
})();
