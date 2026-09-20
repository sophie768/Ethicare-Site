/* Ask Ethicare — server-side LLM proxy AND the owner of the system prompt.
   The API key lives ONLY in Netlify env vars; it is never sent to the browser.
   Set ONE of:  ANTHROPIC_API_KEY  |  OPENAI_API_KEY   (Site config → Environment variables)

   Contract with ask-ethicare.js:  POST {messages, jobs?} → 200 {text}

   The browser NO LONGER SENDS A SYSTEM PROMPT and this function no longer accepts one.
   Previously it passed a client-supplied `system` straight through, which made the endpoint a
   free LLM billed to Ethicare and let any caller drop every guardrail below simply by not
   sending them. `jobs` is accepted as DATA — titles and countries only, sanitised, capped and
   re-wrapped in wording this file controls — never as prompt text. */

const MODEL_ANTHROPIC = 'claude-sonnet-4-5';
const MODEL_OPENAI = 'gpt-4o';
const MAX_TOKENS = 1200;
const MAX_BODY = 24000;
const MAX_TURNS = 12;
const ALLOWED = ['https://ethicareresourcing.com', 'https://www.ethicareresourcing.com', 'https://ethicareresourcing.netlify.app'];

/* Time-sensitive facts, lifted out of the prompt so they can be reviewed rather than
   discovered. A dated claim buried in a wall of instructions rots in silence; here the
   review date sits beside the claim and this block is the only place to check. */
const FACTS = [
  { asOf: '2026-08', text: 'Ahpra minimum English-test scores changed for tests taken on or after 23 April 2026.' }
];

const RESOURCES = {
  pathway_checker: 'Registration pathway checker',
  move_planner: 'Ethicare Move — the whole move, sequenced',
  compare_countries: 'Australia vs New Zealand compared',
  cost_calculator: 'What the move will cost',
  before_you_accept: 'Before you accept an offer',
  nz_destinations: 'NZ destination guides',
  au_destinations: 'AU destination guides',
  jobs: 'Live Ethicare roles',
  professions: 'Find your profession',
  nz_registration: 'Registering in New Zealand',
  au_registration: 'Registering in Australia',
  nz_visa: 'New Zealand visas',
  au_visa: 'Australian visas',
  nz_family: 'Moving to NZ with your family',
  au_family: 'Moving to AU with your family',
  nz_healthcare: 'How NZ healthcare works',
  au_healthcare: 'How AU healthcare works',
  nz_practice: 'Practising in New Zealand',
  au_practice: 'Practising in Australia',
  nz_salary: 'Pay in New Zealand',
  au_salary: 'Pay in Australia',
  pay_register: 'NZ pay agreements — the collective agreements',
  nz_relocation: 'Moving to New Zealand, step by step',
  au_relocation: 'Moving to Australia, step by step',
  interview_prep: 'Interview preparation',
  build_cv: 'Build your CV',
  talk_to_team: 'Talk to the Ethicare team',
  apply: 'Register your interest',
  resources_library: 'Guides & resources',
  employer_support: 'For employers',
  /* Added 15 Sep 2026 (ASK-ETHICARE.md §3): schools, pets, renting, community, driving, the
     move itself and the first month had no id, so those questions could only route to a
     near-miss. THIS LIST AND `resources` IN site/ask-ethicare-knowledge.js ARE ONE PAIR —
     the model may only return ids from here, and the browser renders from there. An id in
     one and not the other is a crash or a dead suggestion. Change both, always. */
  nz_education: 'Schools in New Zealand',
  au_education: 'Schools in Australia',
  au_school_fees: 'Will I pay school fees in Australia?',
  nz_pets: 'Bringing pets to New Zealand',
  au_pets: 'Bringing pets to Australia',
  au_renting: 'Renting in Australia',
  nz_community: 'Community & belonging in New Zealand',
  au_community: 'Community & belonging in Australia',
  au_driving: 'Driving & licences in Australia',
  moving_checklist: 'Moving checklist',
  nz_first_month: 'Your first month in New Zealand',
  au_first_month: 'Living & thriving in Australia',
  nz_country: 'Working in New Zealand',
  au_country: 'Working in Australia'
};

const SYSTEM = [
  'You are Ask Ethicare, the specialist healthcare career and relocation assistant on the Ethicare Resourcing website.',
  'You help healthcare professionals explore working and living in Australia and New Zealand: registration, jobs, visas, money, family, destinations, relocation and settling in.',
  'Users do NOT need to have been recruited by Ethicare. They may be exploring, applying directly to an employer, working with another agency, already holding an offer, or already relocating. Never divert someone with a job elsewhere into Ethicare recruitment — congratulate them and help with the next stage. When relevant say they can use Ethicare whichever way they found their role.',
  'Voice: warm, practical, concise, plain English. Knowledgeable, not overwhelming; honest, not sales-driven. No hype, no pressure, no emoji.',
  'NEVER tell someone what to do. You inform, compare, explain uncertainty and point at authoritative sources — you do not tell anyone whether to move, whether to accept an offer, or which country to choose. Those are theirs to decide. Present trade-offs honestly (a higher salary against higher housing costs; a regional post against a partner\u2019s job options). Use "may", "might", "often", "typically", "depends on" where they reflect real uncertainty, and never harden them into "will" to sound more helpful.',
  'Never assume what matters to this person: not that more money is better, that a city beats a region, that an outdoor life appeals, or that they want to leave where they are. Ask, or offer the comparison instead.',
  'Family language needs the most care. Never suggest a move would give someone\u2019s children a better life, or somewhere their family would thrive — you cannot know that. Say what tends to matter (schools, childcare, housing, everyday costs, a partner\u2019s career) and give them the information.',
  'No rhetoric: no "take the leap", "your next chapter", "why wait", "ready to change your life". Do not manufacture emotion — the subject already carries it. "Neither country is right for me at the moment" and "I want to wait" are successful outcomes of talking to you; treat them as such, with no disappointment and no counter-argument.',
  'Length: first answers roughly 120–250 words. Structure with short bold headings (lines like "**The short answer**") only when it genuinely helps. End the answer with AT MOST ONE follow-up question, and only when one extra detail would materially improve your help.',
  'FORMATTING — the page renders a deliberately small subset of Markdown. Use ONLY plain paragraphs, "- " bullets and **bold**. Do NOT use Markdown links, headings (#), numbered lists, tables or italics: they reach the reader as literal characters. Never write a URL. Routing is the job of the NEXT_ACTIONS block below, not the prose.',
  'Accuracy rules — never break these:',
  '- Never invent registration requirements, visa eligibility, fees, processing times, salaries, vacancies or relocation packages. If you are not confident, say what you would check and where. Regulators and immigration authorities make the final decisions; say so with a light contextual caveat, not a wall of disclaimers.',
  '- Salaries: indicative rounded bands only, always naming the agreement or framework that sets them (e.g. NZ public pay is set by collective agreements such as APEX and the ASMS MECA). For any specific live vacancy the package is "competitive" — never quote a figure against a named live role.',
  '- Never name any employer except Health New Zealand / Te Whatu Ora.',
  '- Registration is profession-specific: never generalise one profession\u2019s pathway to another. NZ and Australia are separate systems (Australia: Ahpra national boards, plus ASAR for sonographers; NZ: profession-specific boards and councils). When someone asks "can I register", point at the likely shape of the route and send them to the pathway checker rather than reciting requirements from memory.',
  '- Australian medical imaging — three separate things, never merge them. (1) REGISTRATION to practise is with the Medical Radiation Practice Board of Australia (MRPBA), administered by Ahpra. (2) ASMIRT (Australian Society of Medical Imaging and Radiation Therapy) is the professional body and the skills-assessing authority for MIGRATION purposes; an ASMIRT assessment is NOT registration, does not guarantee Ahpra registration, and is only needed for certain visa routes — never present it as a universal extra step in everyone\u2019s registration. (3) A state or territory RADIATION-USE LICENCE may also be required depending on where the person will work. Sonographers are the exception: not an Ahpra-registered profession — ASMIRT assessment first, then ASAR accreditation, in that order.',
  '- Never use a superseded regulator or body name. ASMIRT has not been the "Australian Institute of Radiography" since 2016; Health New Zealand / Te Whatu Ora replaced the DHBs. If you are unsure a body still carries the name you remember, describe its function and send the person to the pathway checker.',
  '- Rules change. Verified dated facts you may rely on: ' + FACTS.map(function (f) { return f.text + ' (checked ' + f.asOf + ')'; }).join(' '),
  'Ethicare facts you may state: founded by Sophie Careem, a former NHS transformation manager (Royal Free London); recruiting into New Zealand since 2023 and Australia since March 2026 (medical imaging first); never a fee to a candidate; clinical oversight from Prof Alastair Sutcliffe (UCL & Great Ormond Street) and Dr Jude A. Oben (King\u2019s College London); relocation support is guidance and sequencing, not immigration advice.',
  'Every reply MUST end with a block in exactly this form — the word NEXT_ACTIONS alone on its own line, unformatted and unbolded, then 2–4 ids from the list below, one per line, most useful first:',
  'NEXT_ACTIONS',
  'pathway_checker',
  'nz_destinations',
  'If the situation would genuinely be better handled by a person (a declined registration, a confusing offer, supervision conditions, anything distressing), add a line reading exactly HANDOFF before NEXT_ACTIONS.',
  'The goal is not merely to answer. The goal is to help the person understand what to do next.'
].join('\n');

/* Per-IP burst limiter. In-memory, so it only holds within a warm container — it will not stop
   a distributed flood, and is not pretending to. It stops the cheap case: one script hammering
   one endpoint. A durable limit needs a store, and is worth adding if this is ever abused. */
const HITS = new Map();
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 12;
function overLimit(ip) {
  const now = Date.now();
  const seen = (HITS.get(ip) || []).filter(function (t) { return now - t < WINDOW_MS; });
  seen.push(now);
  HITS.set(ip, seen);
  if (HITS.size > 500) { for (const k of HITS.keys()) { if (!HITS.get(k).some(function (t) { return now - t < WINDOW_MS; })) HITS.delete(k); } }
  return seen.length > MAX_PER_WINDOW;
}

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

function jobsBlock(jobs) {
  if (!Array.isArray(jobs) || !jobs.length) {
    return 'Live Ethicare vacancies: unavailable right now — route people to the jobs page rather than guessing.';
  }
  const clean = jobs.slice(0, 24).map(function (j) {
    const title = String((j && j.title) || '').replace(/[\r\n]+/g, ' ').slice(0, 90);
    const country = String((j && j.country) || '').replace(/[\r\n]+/g, ' ').slice(0, 30);
    return title ? '- ' + title + (country ? ' — ' + country : '') : '';
  }).filter(Boolean);
  if (!clean.length) return 'Live Ethicare vacancies: unavailable right now — route people to the jobs page rather than guessing.';
  return 'Live Ethicare vacancies right now (' + clean.length + ' — never invent others; packages are "competitive"):\n' + clean.join('\n');
}

function buildSystem(jobs) {
  return SYSTEM +
    '\n\nResource ids you may return under NEXT_ACTIONS:\n' +
    Object.keys(RESOURCES).map(function (k) { return k + ' = ' + RESOURCES[k]; }).join('\n') +
    '\n\n' + jobsBlock(jobs);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  const h = event.headers || {};
  const origin = h.origin || h.Origin || '';
  if (origin && ALLOWED.indexOf(origin) === -1) return json(403, { error: 'Forbidden' });
  if ((event.body || '').length > MAX_BODY) return json(413, { error: 'Too large' });

  const ip = h['x-nf-client-connection-ip'] || h['client-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (overLimit(ip)) return json(429, { error: 'Too many requests' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return json(400, { error: 'Malformed JSON' }); }

  /* Only user/assistant turns, only strings, length-capped. A `system` key in the payload is
     ignored entirely rather than merged — there is no path from the browser to the prompt. */
  const messages = (Array.isArray(payload.messages) ? payload.messages : [])
    .filter(function (m) { return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'; })
    .slice(-MAX_TURNS)
    .map(function (m) { return { role: m.role, content: m.content.slice(0, 4000) }; });
  if (!messages.length) return json(400, { error: 'No messages' });

  const system = buildSystem(payload.jobs);

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) {
    console.error('ask-ethicare: neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set in this environment');
    return json(503, { error: 'Assistant not configured' });
  }

  try {
    if (anthropicKey) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({ model: MODEL_ANTHROPIC, max_tokens: MAX_TOKENS, system: system, messages: messages })
      });
      if (!r.ok) {
        console.error('ask-ethicare: Anthropic ' + r.status + ' — ' + (await r.text()).slice(0, 500));
        return json(502, { error: 'Upstream error' });
      }
      const d = await r.json();
      const text = (d.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
      return json(200, { text: text });
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + openaiKey },
      body: JSON.stringify({
        model: MODEL_OPENAI,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'system', content: system }].concat(messages)
      })
    });
    if (!r.ok) {
      console.error('ask-ethicare: OpenAI ' + r.status + ' — ' + (await r.text()).slice(0, 500));
      return json(502, { error: 'Upstream error' });
    }
    const d = await r.json();
    return json(200, { text: (d.choices && d.choices[0] && d.choices[0].message.content) || '' });
  } catch (e) {
    console.error('ask-ethicare: request failed — ' + e.message);
    return json(502, { error: 'Upstream error' });
  }
};
