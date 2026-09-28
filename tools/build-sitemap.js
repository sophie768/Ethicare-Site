#!/usr/bin/env node
// =============================================================================
// Ethicare Resourcing — generate sitemap.xml and robots.txt
//
//   node tools/build-sitemap.js
//
// What goes in: every page that a visitor can reach and that we want indexed.
//
// What stays out, and why:
//   · the six Australian profession pages netlify.toml 301s to
//     /jobs/coming-to-australia — Australia is live for medical imaging only,
//     and a sitemap that lists a redirect is a sitemap that lies;
//   · anything netlify.toml marks noindex: /pack/ (the link is the
//     credential), /prototypes/, /_forms/, /thank-you;
//   · 404, the header partial, and the holding page;
//   · assets/, tools/ and anything that is not a page.
//
// lastmod is read from git when the working tree is a repository, because the
// commit date is when the page actually changed. Without git it falls back to
// the file's modification time. It is never invented: a page whose date cannot
// be established is listed without one, which is valid and honest.
// =============================================================================
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://ethicareresourcing.com';

// Directories never crawled for pages.
const SKIP_DIRS = new Set(['.git', 'assets', 'tools', 'node_modules', 'prototypes', '_forms', 'pack']);

// Individual pages held back.
const SKIP_FILES = new Set([
  '404.html', '_header.html', 'coming-soon.html', 'thank-you.html',
  'home-router.html', 'new-zealand-redesign.html',
]);

// Paths that netlify.toml redirects away: listing them would advertise a 301.
const REDIRECTED = new Set(
  (fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8').match(/from\s*=\s*"(\/[^"*]+)"/g) || [])
    .map(s => s.match(/"(.+)"/)[1])
);

// Priority is a hint, not a ranking: the front door and the country pages
// first, then the things people come looking for, then the chapters.
function priority(url) {
  if (url === '/') return '1.0';
  if (/^\/(new-zealand|australia|jobs\/?)$/.test(url)) return '0.9';
  if (/^\/(destinations|guides|resources|move|contact|apply|employers)\/?$/.test(url)) return '0.8';
  if (/^\/jobs\//.test(url)) return '0.8';
  if (/\/(welcome|why|index)?$/.test(url) && url.split('/').length <= 3) return '0.7';
  return '0.6';
}

let gitDates = null;
function lastmod(rel) {
  if (gitDates === null) {
    gitDates = new Map();
    try {
      execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, stdio: 'ignore' });
      gitDates.ok = true;
      gitDates.fallbacks = 0;
    } catch { gitDates.ok = false; }
  }
  if (gitDates.ok) {
    if (gitDates.has(rel)) return gitDates.get(rel);
    let d = null;
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', rel],
        { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (out) d = out.slice(0, 10);
    } catch { /* a file git has never seen has no commit date */ }
    gitDates.set(rel, d);
    if (d) return d;
    gitDates.fallbacks++;
  }
  try { return fs.statSync(path.join(ROOT, rel)).mtime.toISOString().slice(0, 10); }
  catch { return null; }
}

// A page's URL: index.html becomes its directory, everything else drops .html.
function urlFor(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel.slice(0, -'.html'.length);
}

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      // Every live guide folder is <place>-new-zealand or <place>-australia,
      // and each has a superseded bare-named twin. The naming rule catches all
      // of them except South Australia and Western Australia, whose own names
      // end in "-australia" — so a folder is also dropped when the longer
      // spelling of it exists alongside.
      if (path.relative(ROOT, dir) === 'destinations') {
        const live = /-(new-zealand|australia)$/.test(e.name)
          && !fs.existsSync(path.join(dir, e.name + '-australia'))
          && !fs.existsSync(path.join(dir, e.name + '-new-zealand'));
        if (!live) continue;
      }
      walk(abs);
    } else if (e.name.endsWith('.html')) {
      if (SKIP_FILES.has(e.name) && !rel.includes('/')) continue;
      // The superseded exports are title-cased; live pages are all lower-case.
      if (/[A-Z]/.test(e.name)) continue;
      const url = urlFor(rel);
      if (REDIRECTED.has(url)) continue;
      pages.push({ rel, url });
    }
  }
})(ROOT);

pages.sort((a, b) => a.url.localeCompare(b.url));

const body = pages.map(p => {
  const d = lastmod(p.rel);
  return '  <url>\n'
    + `    <loc>${ORIGIN}${p.url}</loc>\n`
    + (d ? `    <lastmod>${d}</lastmod>\n` : '')
    + `    <priority>${priority(p.url)}</priority>\n`
    + '  </url>';
}).join('\n');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + body + '\n</urlset>\n');

fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  `# Ethicare Resourcing
# Candidates' private spaces are unlisted rather than secret — the link is the
# credential — so they are kept out of crawlers as well as out of the sitemap.
User-agent: *
Allow: /
Disallow: /pack/
Disallow: /prototypes/
Disallow: /_forms/
Disallow: /thank-you

Sitemap: ${ORIGIN}/sitemap.xml
`);

console.log(`sitemap.xml: ${pages.length} pages`);
console.log(`lastmod source: ${gitDates && gitDates.ok ? 'git commit dates' : 'file modification times'}`
  + (gitDates && gitDates.ok && gitDates.fallbacks
      ? ` (${gitDates.fallbacks} pages git could not date, so their mtime was used)` : ''));
console.log('robots.txt written');
