/* Ask Ethicare — server-side LLM proxy.
   The API key lives ONLY in Netlify env vars; it is never sent to the browser.
   Set ONE of:  ANTHROPIC_API_KEY  |  OPENAI_API_KEY   (Site config → Environment variables)
   Contract with ask-ethicare.js:  POST {system, messages} → 200 {text} */

const MODEL_ANTHROPIC = 'claude-sonnet-4-5';
const MODEL_OPENAI = 'gpt-4o';
const MAX_TOKENS = 1200;

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return json(400, { error: 'Malformed JSON' }); }

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-12) : [];
  const system = typeof payload.system === 'string' ? payload.system : '';
  if (!messages.length) return json(400, { error: 'No messages' });

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
        messages: (system ? [{ role: 'system', content: system }] : []).concat(messages)
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
