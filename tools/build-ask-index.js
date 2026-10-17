#!/usr/bin/env node
/* Ask Ethicare — builds the search index the assistant answers from (12 Oct 2026).

   Reads the site's own pages (guides, profession pages, destination guides and the main
   candidate pages), splits each into sections by heading, and writes
   netlify/functions/ask-index.json. The function searches it for every question, so answers
   come from what the site actually says, with a link to the page.

   It also collects every link the pages make to an OFFICIAL site (regulators, immigration,
   tax, government) into the same file, so the assistant can point to the right official
   page as well as the guide.

   Run:   node tools/build-ask-index.js
   It also runs on every Netlify deploy (netlify.toml), so the index never falls behind the
   guides. No dependencies. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'netlify', 'functions', 'ask-index.json');
const OFFICIAL = require(path.join(ROOT, 'netlify', 'functions', 'ask-official.json'));

/* Which pages go in. Destination chapters are in: they answer "what is X like" questions.
   Vacancy adverts are out: live roles reach the assistant separately, and change daily. */
const INCLUDE = [/^guides\//, /^jobs\/[^/]+\.html$/, /^destinations\//, /^resources\//,
  /^(australia|new-zealand|can-i-work-there|take-home-pay|what-could-i-earn|settling-in|is-it-worth-it|before-you-accept|cost-calculator|pathway-checker|destination-finder|about-ethicare|apply|register-interest|candidate-stories|index)\.html$/];
const EXCLUDE = [/mock/i, /redesign/i, /^jobs\/vacancy\//, /^jobs\/index\.html$/];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'Claude outputs') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return out;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', middot: '·', hellip: '…', rarr: '→', larr: '←', eacute: 'é', times: '×', deg: '°', pound: '£', euro: '€', bull: '•', shy: '' };
function decode(s) {
  return s.replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); })
    .replace(/&([a-z]+);/gi, function (m, n) { return ENT[n.toLowerCase()] !== undefined ? ENT[n.toLowerCase()] : m; });
}
function clean(s) { return decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }

function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
function isOfficial(host) {
  return OFFICIAL.domains.some(function (d) { return host === d || host.endsWith('.' + d); });
}

const files = walk(ROOT, []).filter(function (f) {
  return INCLUDE.some(function (r) { return r.test(f); }) && !EXCLUDE.some(function (r) { return r.test(f); });
});

/* Community, diaspora, faith, support and everyday contacts (12 Oct 2026). The community and
   contacts guides carry Ethicare's own curated list of organisations; they are collected with the
   heading they sit under, so Ask Ethicare can point someone to "their people" with a link.
   Shops and event sites are marked commercial, so the answer says Ethicare does not endorse them. */
const COMMUNITY_PAGES = /^guides\/(australia|new-zealand)-(community|contacts)\.html$/;
const COMMERCIAL = /alittlebitofbritain|asiangrocer|britishfoodimports|newworld|sashopnz|somethingfromhome|taiping|ukfoods|worsshop|eventbrite|meetup|internations|britishexpats|englishlanguage|swooshenglish|stuff\.co\.nz|playhq|parkrun/;
const SKIP = /facebook|linkedin|instagram|twitter|x\.com|fonts\.g|ethicareresourcing|tewhatuora|healthnz/;
const community = new Map();
const seen = new Set();
const chunks = [];
const links = new Map(); // url -> {u, t, host, pages:Set}
let pages = 0;

for (const f of files) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) continue;
  const canon = (html.match(/<link rel="canonical" href="https:\/\/ethicareresourcing\.com([^"]*)"/) || [])[1];
  const url = canon !== undefined ? (canon || '/') : '/' + f.replace(/(index)?\.html$/, '');
  if (seen.has(url)) continue;
  seen.add(url);
  pages++;

  const title = clean((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]).replace(/\s*[|·]\s*Ethicare.*$/i, '');
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
  const main = body.match(/<main[\s\S]*?<\/main>/i);
  if (main) body = main[0];

  // Official links, with the words the page uses for them.
  body.replace(/<a\b[^>]*href="(https?:\/\/[^"#]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, function (_, u, t) {
    const host = hostOf(u);
    // Health NZ's own site is left out of the directory: its recruitment centre competes for
    // the same candidates (Sophie, 6 Oct 2026). Guides may still mention it in passing.
    if (!host || !isOfficial(host) || /tewhatuora|healthnz/.test(host)) return _;
    let text = clean(t).replace(/[\u2192\u2190]/g, '').trim();
    if (text.length > 70) text = text.slice(0, text.lastIndexOf(' ', 70)) + '\u2026';
    if (!links.has(u)) links.set(u, { u: u, t: text, host: host, n: 0 });
    const l = links.get(u);
    if (l.t.length < 4 || (text.length > l.t.length && !/\u2026$/.test(text))) l.t = text;
    l.n++;
    return _;
  });

  if (COMMUNITY_PAGES.test(f)) {
    const country = /australia/.test(f) ? 'AU' : 'NZ';
    let heading = '';
    body.split(/(?=<h[234][\s>])/i).forEach(function (part) {
      const hm = part.match(/^<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
      if (hm) heading = clean(hm[1]);
      part.replace(/<a\b[^>]*href="(https?:\/\/[^"#]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, function (_, u, t) {
        const host = hostOf(u);
        if (!host || SKIP.test(host)) return _;
        let text = clean(t).replace(/[\u2192\u2190]/g, '').trim();
        if (text.length > 80) text = text.slice(0, text.lastIndexOf(' ', 80)) + '\u2026';
        if (!community.has(u)) community.set(u, { u: u, t: text || host, h: heading, host: host, country: country,
          type: isOfficial(host) ? 'official' : (COMMERCIAL.test(host) ? 'commercial' : 'community') });
        return _;
      });
    });
  }

  // Sections: split at h2/h3, keeping the nearest id for a deep link.
  const parts = body.split(/(?=<h[23][\s>])/i);
  let sectionId = '';
  for (const part of parts) {
    const hm = part.match(/^<h[23]([^>]*)>([\s\S]*?)<\/h[23]>/i);
    const heading = hm ? clean(hm[2]) : '';
    const own = hm && hm[1].match(/\bid="([A-Za-z][\w-]*)"/);
    const anchorId = own ? own[1] : sectionId;
    // a <section id> opened inside this part names the parts that follow it
    const secs = part.match(/<section\b[^>]*>/gi);
    if (secs) { const m = secs[secs.length - 1].match(/\bid="([A-Za-z][\w-]*)"/); sectionId = m ? m[1] : ''; }
    let text = clean(hm ? part.slice(hm[0].length) : part);
    if (text.length < 60) continue;
    const anchor = anchorId ? '#' + anchorId : '';
    // long sections become several chunks of about 900 characters, split on sentences
    while (text.length) {
      let piece = text;
      if (text.length > 1100) {
        const cut = text.lastIndexOf('. ', 900);
        piece = text.slice(0, cut > 300 ? cut + 1 : 900);
      }
      text = text.slice(piece.length).trim();
      chunks.push({ u: url + anchor, t: title, h: heading, x: piece });
    }
  }
}

const officialLinks = Array.from(links.values())
  .filter(function (l) { return l.t && l.t.length > 2; })
  .sort(function (a, b) { return b.n - a.n; })
  .slice(0, 400)
  .map(function (l) { return { u: l.u, t: l.t, host: l.host }; });

const out = { built: new Date().toISOString(), pages: pages, chunks: chunks, official: officialLinks, community: Array.from(community.values()) };
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('ask-index: ' + pages + ' pages, ' + chunks.length + ' sections, ' + officialLinks.length + ' official links, ' + community.size + ' community links, ' + Math.round(fs.statSync(OUT).size / 1024) + ' KB');
