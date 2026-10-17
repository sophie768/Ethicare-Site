#!/usr/bin/env node
/* Shows what Ask Ethicare is given for a question, without calling the model.
   node tools/test-ask.js "how do I register as a radiographer in New Zealand?" */
process.env.ASK_TEST = '1';
const t = require('../netlify/functions/ask-ethicare.js')._test;
const qs = process.argv.slice(2);
(qs.length ? qs : ['is there an age limit for PR after the 482 visa?']).forEach(function (q) {
  console.log('\n### ' + q + '\n' + t.groundingBlock([{ role: 'user', content: q }], {}));
});
