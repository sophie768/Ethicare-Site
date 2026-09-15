/* Ask Ethicare V1 — UI + transport.
   The system prompt is NOT here and must not come back: the browser sends only the conversation
   and the live job titles, and netlify/functions/ask-ethicare.js owns the prompt and the
   guardrails. See the note at the top of ask-ethicare-knowledge.js for why. */
(function () {
  var form = document.querySelector('[data-aske-form]');
  if (!form || !window.ASK_ETHICARE_KB) return;
  /* Loading lines rotate while the model thinks (site/loading-lines.js). Lazy-loaded so no page needs another tag. */
  if (!window.EthicareLoading) { var ls = document.createElement('script'); ls.src = '/loading-lines.js'; ls.defer = true; document.head.appendChild(ls); }
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

  async function askLLM(messages) {
    var r = await fetch('/.netlify/functions/ask-ethicare', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, jobs: liveJobs() })
    });
    if (!r.ok) throw new Error('ask-ethicare ' + r.status);
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
  var RE_NEXT = /^[ \t>*#_]*\**\s*NEXT[ _]?ACTIONS\s*:?\s*\**[ \t]*$/im;
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
    var ids = tail.split('\n').map(function (l) { return l.trim().toLowerCase().replace(/[^a-z_]/g, ''); })
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
      var routed = p.ids.length > 0;
      if (!routed) p.ids = ['pathway_checker', 'talk_to_team'].filter(function (id) { return KB.resources[id]; });
      track('assistant_answered', { routed: routed ? 'yes' : 'no', handoff: p.handoff ? 'yes' : 'no' });
      stopWait();
      ans.innerHTML = render(p.body) + actionsHtml(p.ids, p.handoff) + feedbackHtml(n);
    } catch (e) {
      stopWait();
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
    if (e.target.hasAttribute('data-fb-yes')) { track('assistant_rated', { verdict: 'useful' }); fb.innerHTML = '<span>Thanks \u2014 noted.</span>'; }
    else if (e.target.hasAttribute('data-fb-no')) {
      fb.innerHTML = '<span>What was wrong?</span>' + ['Out of date', 'Didn\u2019t answer it', 'Too generic', 'Something else'].map(function (r) { return '<button type="button" data-fb-r="' + r + '">' + r + '</button>'; }).join('');
    } else if (e.target.hasAttribute('data-fb-r')) {
      track('assistant_rated', { verdict: 'not-useful', reason: e.target.getAttribute('data-fb-r') });
      fb.innerHTML = '<span>Thanks \u2014 that helps us improve it.</span>';
    }
  });
})();
