/* Ask Ethicare V1 — UI + transport.
   The system prompt is NOT here and must not come back: the browser sends only the conversation
   and the live job titles, and netlify/functions/ask-ethicare.js owns the prompt and the
   guardrails. See the note at the top of ask-ethicare-knowledge.js for why. */
(function () {
  var form = document.querySelector('[data-aske-form]');
  if (!form || !window.ASK_ETHICARE_KB) return;
  /* Loading lines rotate while the model thinks (loading-lines.js). Lazy-loaded so no page
     needs another tag. Resolved RELATIVE TO THIS SCRIPT, not from "/": the site's own root
     is the deploy root in production but not in preview or any sub-path host, so the
     absolute form 404ed everywhere except the live domain — and because the call site
     degrades safely to a no-op, nothing broke loudly enough to notice. */
  if (!window.EthicareLoading) {
    var me = document.querySelector('script[src*="ask-ethicare.js"]');
    var base = me ? me.getAttribute('src').replace(/ask-ethicare\.js.*$/, '') : '/';
    var ls = document.createElement('script'); ls.src = base + 'loading-lines.js'; ls.defer = true;
    document.head.appendChild(ls);
  }
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

  /* Markdown-lite: paragraphs, "- " and "1. " lists, **bold**. The prompt forbids links and
     headings because this renderer cannot show them — but a model that slips still must not
     leak syntax at the reader, so [text](url) is converted rather than printed and a stray
     leading # is dropped. */
  function render(md) {
    var blocks = String(md || '').trim().split(/\n{2,}/), out = '';
    blocks.forEach(function (b) {
      var lines = b.split('\n');
      if (lines.every(function (l) { return /^\s*[-\u2022]\s+/.test(l); })) {
        out += '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-\u2022]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      } else if (lines.length > 1 && lines.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) {
        out += '<ol>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>';
      /* Escape FIRST, then insert the break. inline() begins with esc(), so a <br> substituted
         before it was escaped back into visible "&lt;br&gt;" — and the shape that triggers it,
         a bold heading line followed by body text, is precisely what the prompt asks for.
         esc() leaves \n alone, so the newlines are still there to replace afterwards. */
      } else out += '<p>' + inline(b.replace(/^#{1,6}\s+/gm, '')).replace(/\n/g, '<br>') + '</p>';
    });
    return out;
  }
  function inline(s) {
    return esc(s)
      /* esc() has already turned the quotes and angle brackets safe, so the only thing being
         reconstructed here is an anchor around text we control the escaping of. Relative paths
         and https only — never a bare javascript: or data: target. */
      .replace(/\[([^\]]+)\]\((\/[A-Za-z0-9\-._~/#?=&amp;%]*|https:\/\/[A-Za-z0-9\-._~:/#?=&amp;%]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /* Job titles as DATA, not as prompt text — the function sanitises them and writes the
     wording around them. Nothing the browser sends can shape how the model is instructed. */
  function liveJobs() {
    var jobs = window.ETHICARE_JOBS;
    if (!jobs || !jobs.length) return [];
    return jobs.slice(0, 24).map(function (j) {
      return { title: String(j.title || j.role || ''), country: String(j.country || '') };
    });
  }

  /* 28 Sep 2026 — the candidate's own answers from the shared strip, as DATA. The function
     whitelists every value; nothing here can shape the prompt. */
  function candidateContext() {
    var ctx = window.EthicareContext; if (!ctx || !ctx.has()) return null;
    return { profession: ctx.profession(), dest: ctx.destMode ? ctx.destMode() : ctx.dest(), household: ctx.household ? ctx.household() : '', stage: ctx.stage() };
  }

  async function askLLM(messages) {
    var r = await fetch('/.netlify/functions/ask-ethicare', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, jobs: liveJobs(), context: candidateContext() })
    });
    if (!r.ok) { var err = new Error('ask-ethicare ' + r.status); err.status = r.status; throw err; }
    return (await r.json()).text;
  }

  /* Through window.track, not window.plausible. Plausible loads with `defer`, so a direct call
     made before it parses is simply lost — analytics.js queues until the transport exists, caps
     prop length, and is the single place the transport changes when the Postgres event table
     lands. Ask Ethicare was the one feature calling the vendor directly. */
  function track(name, props) { try { if (window.track) window.track(name, props); } catch (e) {} }

  /* The control block is written by a model, so it arrives bolded, hashed or indented often
     enough to matter. An exact `\nNEXT_ACTIONS` match therefore missed it and printed the
     machinery to the reader — the words NEXT_ACTIONS followed by raw ids. Match loosely, then
     scrub anything that still looks like the block out of the body: losing the cards is a
     tolerable failure, showing them as prose is not. */
  /* 6 Oct 2026: also accept the ids on the same line, comma-separated ("NEXT_ACTIONS: a, b") —
     seen when testing on a phone; the prompt asks for one per line but a model does not always
     listen, and the failure printed the ids to the reader. */
  var RE_NEXT = /^[ \t>*#_]*\**\s*NEXT[ _]?ACTIONS\s*:?\s*\**[ \t]*[a-z_, \t]*$/im;
  var RE_HANDOFF = /^[ \t>*#_]*\**\s*HANDOFF\s*:?\s*\**[ \t]*$/im;

  function parse(text) {
    text = String(text || '');
    var handoff = RE_HANDOFF.test(text);
    text = text.replace(new RegExp(RE_HANDOFF.source, 'gim'), '');
    var body = text, tail = '';
    var m = text.match(RE_NEXT);
    if (m) {
      var at = text.indexOf(m[0]);
      body = text.slice(0, at);
      tail = text.slice(at + m[0].length);
    }
    if (m) tail = m[0].replace(/^[^A-Za-z]*NEXT[ _]?ACTIONS\s*:?\s*\**/i, '') + '\n' + tail;
    var ids = tail.split(/[\n,]/).map(function (l) { return l.trim().toLowerCase().replace(/[^a-z_]/g, ''); })
      .filter(function (id) { return KB.resources[id]; }).slice(0, 4);
    /* Belt and braces — but only over a TRAILING run. Three ids are ordinary words (jobs,
       professions, apply), and the prompt asks for short bold headings, so scrubbing every
       matching line deleted a legitimate "**Jobs**" heading out of the middle of a good answer
       with nothing to show it had gone. Residue of a missed control block can only be at the
       end, so walk back from there and stop at the first line that is real prose. */
    body = body.replace(new RegExp(RE_NEXT.source, 'gim'), '');
    var lines = body.split('\n');
    while (lines.length) {
      var last = lines[lines.length - 1].trim();
      if (!last) { lines.pop(); continue; }
      if (KB.resources[last.toLowerCase().replace(/[^a-z_]/g, '')]) { lines.pop(); continue; }
      break;
    }
    return { body: lines.join('\n').trim(), ids: ids, handoff: handoff };
  }

  function actionsHtml(ids, handoff) {
    var h = '';
    if (handoff) h += '<div class="aske-handoff"><p><strong>This might be worth discussing with us.</strong> Some situations need a person, not a summary.</p><a href="/contact">Talk to the Ethicare team &rarr;</a></div>';
    /* The model can only be TOLD the id list; it can still return one that is not in the
       browser map (a typo, a hallucination, or the two lists drifting apart). Unfiltered,
       that threw on r.u and the whole answer vanished behind a catch. Drop unknown ids and
       render what is left. */
    ids = ids.filter(function (id) { return !!KB.resources[id]; });
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
    var asked = q.trim();          /* the question itself — n is the history index, not the text */
    var turn = document.createElement('div');
    turn.className = 'aske-turn';
    turn.innerHTML = '<p class="aske-you"><span>You asked</span>' + esc(q.trim()) + '</p><div class="aske-ans"><p class="aske-wait">Ethicare is thinking&hellip;</p></div>';
    thread.appendChild(turn);
    /* Bring the turn into view (2 Oct 2026). On the homepage this form sits 38,000px down a
       62,000px page, and the answer takes about twenty seconds to arrive — long enough to look
       away, scroll, and never see it land. On /ask the form IS the page so nobody noticed.
       `nearest` rather than `center` so a page that is already showing the thread does not
       jump under the reader. */
    try { turn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    input.value = ''; input.setAttribute('placeholder', 'Keep asking \u2014 I\u2019ll remember what you\u2019ve told me');
    track('assistant_question');
    history.push({ role: 'user', content: q.trim() });
    var ans = turn.querySelector('.aske-ans');
    var stopWait = window.EthicareLoading ? window.EthicareLoading.start(ans.querySelector('.aske-wait'), 'ask') : function () {};
    try {
      var raw = await askLLM(history.slice(-12));
      history.push({ role: 'assistant', content: raw });
      var p = parse(raw);
      /* An answer with nothing to click is the one outcome the whole feature exists to avoid,
         so a parse miss or an omitted block falls back rather than ending in a dead stop. */
      /* Filter BEFORE the routed test, not only at render time: an answer whose ids are all
         unknown is not routed, and counting it as routed both skips the fallback and files
         a misleading `routed: yes` against it. */
      p.ids = p.ids.filter(function (id) { return !!KB.resources[id]; });
      var routed = p.ids.length > 0;
      if (!routed) p.ids = ['pathway_checker', 'talk_to_team'].filter(function (id) { return KB.resources[id]; });
      track('assistant_answered', { routed: routed ? 'yes' : 'no', handoff: p.handoff ? 'yes' : 'no' });
      stopWait();
      ans.innerHTML = render(p.body) + actionsHtml(p.ids, p.handoff) + feedbackHtml(n);
      /* Twenty seconds is long enough to have scrolled away; put the answer back in front of
         them, but only if it is off-screen, so a reader already looking at it is left alone. */
      try {
        var r = turn.getBoundingClientRect();
        if (r.bottom < 0 || r.top > (window.innerHeight || 0)) turn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e2) {}
    } catch (e) {
      stopWait();
      /* A single "briefly unavailable" for every failure told nobody anything — not the reader,
         and not us. 503 means the key is not set, which is a configuration fault and will not
         fix itself on a retry; everything else is worth one retry. The question is kept either
         way, because retyping it is the thing that makes people give up (3 Oct 2026). */
      var st = e && e.status, cfg = st === 503, many = st === 429;
      var lead = cfg ? 'Ask Ethicare is not available at the moment.'
               : many ? 'That is a lot of questions in a short time.'
               : 'Ask Ethicare could not answer just then.';
      var line = cfg ? 'This one is at our end, not yours, and we are on it.'
               : many ? 'Give it a minute and try again.'
               : 'It is usually momentary. Your question is still here — try it again.';
      track('assistant_failed', { status: String(st || 'network') });
      ans.innerHTML = '<p><strong>' + lead + '</strong> ' + line + '</p>' +
        (cfg || many ? '' : '<p style="margin-top:12px"><button type="button" class="aske-retry">Try that again</button></p>') +
        '<p>In the meantime, these cover most of it: the <a href="/pathway-checker">pathway checker</a>, ' +
        'the <a href="/resources">guides library</a>, or <a href="/contact">the team</a>.</p>';
      var again = ans.querySelector('.aske-retry');
      if (again) again.addEventListener('click', function () { ask(asked); });
      try { input.value = asked; input.focus(); } catch (e3) {}
    }
    busy = false; goBtn.disabled = false;
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); }
  });
  /* A chip used to submit on click. "Registration" fired "Can I work there?" at the model with
     no profession and no country attached, and the answer could only be general — which reads
     as the tool being vague rather than the question being vague. It now fills the box and puts
     the cursor at the end, so the question can be finished before it is asked (3 Oct 2026). */
  if (chips) chips.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var q = b.getAttribute('data-q') || b.textContent;
    input.value = q;
    input.focus();
    try { input.setSelectionRange(q.length, q.length); } catch (e4) {}
    track('assistant_chip', { chip: (b.textContent || '').trim().slice(0, 30) });
  });
  /* A question handed over in the URL: /ask?q=… — this is how the foot of a long page
     sends a reader here with their question already framed. The value is read as a string
     and only ever placed with .value (never innerHTML), and it is capped to the same
     length the textarea enforces, so a crafted link can do nothing a typed question
     could not. The parameter is then dropped from the address bar so a reload or a
     shared link doesn't silently re-ask. */
  (function fromURL() {
    var q;
    try { q = new URLSearchParams(window.location.search).get('q'); } catch (err) { return; }
    if (!q) return;
    q = String(q).trim().slice(0, 1200);
    if (!q) return;
    input.value = q;
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    } catch (err) { /* replaceState unavailable — harmless, the question still asks */ }
    ask(q);
  })();

  thread.addEventListener('click', function (e) {
    var fb = e.target.closest('.aske-fb'); if (!fb) return;
    if (e.target.hasAttribute('data-fb-yes')) { track('assistant_rated', { verdict: 'useful' }); fb.innerHTML = '<span>Thanks \u2014 noted.</span>'; }
    else if (e.target.hasAttribute('data-fb-no')) {
      fb.innerHTML = '<span>What was wrong?</span>' + ['Out of date', 'Didn\u2019t answer it', 'Too generic', 'Something else'].map(function (r) { return '<button type="button" data-fb-r="' + r + '">' + r + '</button>'; }).join('');
    } else if (e.target.hasAttribute('data-fb-r')) {
      track('assistant_rated', { verdict: 'not-useful', reason: e.target.getAttribute('data-fb-r') });
      fb.innerHTML = '<span>Thanks \u2014 that helps us improve it.</span>';
    }
  });
})();

/* ---- typewriter placeholder (6 Oct 2026) ---------------------------------------------------
   The question box types real questions to itself until someone touches it. Static placeholder
   text says "example"; a question being typed says "this is where you type". Stops for good on
   focus, on input, and when the thread opens. Honours prefers-reduced-motion. */
(function () {
  'use strict';
  var box = document.querySelector('.ask-instrument .aske-box'), ta = document.getElementById('aske-in');
  if (!box || !ta || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var Q = ['Can I work in New Zealand as a UK radiographer?', 'What could I earn in Australia after tax?', 'Could my partner work on my visa?', 'Where would suit a family with two careers?', 'How much would the move cost us upfront?', 'I\u2019m a sonographer from South Africa \u2014 can I register in Australia?'];
  var el = document.createElement('span'); el.className = 'aske-type'; el.setAttribute('aria-hidden', 'true'); box.appendChild(el); box.classList.add('is-typing');
  var qi = 0, ci = 0, dir = 1, timer = null, stopped = false;
  function stop() { if (stopped) return; stopped = true; clearTimeout(timer); el.remove(); box.classList.remove('is-typing'); }
  function tick() {
    if (stopped) return;
    var q = Q[qi];
    if (dir > 0) { ci++; el.textContent = q.slice(0, ci); if (ci >= q.length) { dir = -1; timer = setTimeout(tick, 2200); return; } timer = setTimeout(tick, 38 + Math.random() * 40); }
    else { ci -= 3; if (ci <= 0) { ci = 0; el.textContent = ''; dir = 1; qi = (qi + 1) % Q.length; timer = setTimeout(tick, 500); return; } el.textContent = q.slice(0, ci); timer = setTimeout(tick, 18); }
  }
  ['focus', 'input', 'pointerdown', 'touchstart'].forEach(function (ev) { ta.addEventListener(ev, stop, { once: true, passive: true }); });
  document.querySelectorAll('[data-aske-chips] button').forEach(function (b) { b.addEventListener('click', stop, { once: true }); });
  timer = setTimeout(tick, 900);
})();
