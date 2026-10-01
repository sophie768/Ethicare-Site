#!/usr/bin/env node
// =============================================================================
// Ethicare Resourcing — generate the Australian half of tools/guide-manifest.json
//
// The New Zealand entries were written by hand. The Australian guides follow an
// identical folder shape, so rather than hand-copying nineteen more blocks we
// read each guide's own index page and take the title, the hero photograph and
// the chapter order straight from it. That way the PDF can never drift out of
// step with the website: re-run this whenever a chapter is added or reordered.
//
//   node tools/gen-au-manifest.js            print the entries
//   node tools/gen-au-manifest.js --write    merge them into guide-manifest.json
// =============================================================================
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

// The state and territory guides, then the city guides. Order here is the order
// they appear on /destinations/australia, and the order of the download page.
const AU = [
  ['new-south-wales-australia', 'State relocation guide'],
  ['victoria-australia',        'State relocation guide'],
  ['queensland-australia',      'State relocation guide'],
  ['western-australia-australia','State relocation guide'],
  ['south-australia-australia', 'State relocation guide'],
  ['tasmania-australia',        'State relocation guide'],
  ['sydney-australia',          'City relocation guide'],
  ['melbourne-australia',       'City relocation guide'],
  ['brisbane-australia',        'City relocation guide'],
  ['gold-coast-australia',      'City relocation guide'],
  ['perth-australia',           'City relocation guide'],
  ['adelaide-australia',        'City relocation guide'],
  ['canberra-australia',        'City relocation guide'],
  ['darwin-australia',          'City relocation guide'],
  ['hobart-australia',          'City relocation guide'],
  ['newcastle-australia',       'City relocation guide'],
  ['geelong-australia',         'City relocation guide'],
  ['bundaberg-australia',       'City relocation guide'],
  ['bunbury-australia',         'City relocation guide'],
  ['mandurah-australia',        'City relocation guide'],
];

// A guide's PDF is named for the place, not the folder: hobart-australia becomes
// hobart-relocation-guide, which is what the download links say.
const slugOf = dir => dir.replace(/-australia$/, '') + '-relocation-guide';

const decode = s => s
  .replace(/&rsquo;/g, '’').replace(/&amp;/g, '&')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

function entry(dir, eyebrowKind) {
  const idx = path.join('destinations', dir, 'index.html');
  const html = read(idx);

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!h1) throw new Error(`${idx}: no <h1>`);
  // Four of the newer guides title their hero "Moving to Geelong" rather than
  // just "Geelong". The PDF cover wants the place name, so the prefix comes off.
  const title = decode(h1[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '))
    .replace(/^Moving to\s+/i, '');

  // The cover is the first real photograph on the page. Some guides set their
  // hero with an <img>, others with a CSS background-image, so both are read;
  // the logo mark and Sophie's portrait are chrome, not the hero, and are skipped.
  const cover = [...html.matchAll(/(?:src=|url\()['"]?(\/?assets\/[^"')]+\.(?:jpg|jpeg|png|webp))/gi)]
    .map(m => m[1].replace(/^\//, ''))
    .find(s => !/logo-mark|photo-sophie|og-default/.test(s));
  if (!cover) throw new Error(`${idx}: no cover photograph`);
  if (!fs.existsSync(path.join(ROOT, cover))) throw new Error(`${idx}: cover missing on disk — ${cover}`);

  // Chapters in the order the index lists them, de-duplicated.
  const seen = new Set();
  const chapters = [];
  for (const m of html.matchAll(new RegExp(`href="/destinations/${dir}/([a-z0-9-]+)"`, 'g'))) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const file = path.join('destinations', dir, m[1] + '.html');
    if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`${idx}: links to a missing chapter — ${file}`);
    chapters.push(file);
  }
  if (chapters.length < 5) throw new Error(`${idx}: only ${chapters.length} chapters found`);

  return {
    slug: slugOf(dir),
    title,
    eyebrow: `${eyebrowKind} · Australia`,
    strap: `Where you would work, where you would live, and what an ordinary week looks like in ${title}.`,
    cover,
    chapters,
  };
}

// The national guide is assembled from /guides/, not from a destination folder.
function national() {
  const html = read('destinations/australia-relocation-guide.html');
  const seen = new Set();
  const chapters = [];
  for (const m of html.matchAll(/href="\/guides\/([a-z0-9-]+)"/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const file = path.join('guides', m[1] + '.html');
    if (fs.existsSync(path.join(ROOT, file))) chapters.push(file);
  }
  const cover = 'assets/au-destination-hero.jpg';
  if (!fs.existsSync(path.join(ROOT, cover))) throw new Error(`national cover missing — ${cover}`);
  return {
    slug: 'moving-to-australia',
    title: 'Moving to Australia',
    eyebrow: 'The national guide',
    strap: 'A new role, a different pace of life and somewhere new to call home.',
    cover,
    chapters,
  };
}

const out = [national(), ...AU.map(([d, k]) => entry(d, k))];

if (process.argv.includes('--write')) {
  const mf = JSON.parse(read('tools/guide-manifest.json'));
  const nz = mf.filter(g => !out.some(o => o.slug === g.slug));
  fs.writeFileSync(path.join(ROOT, 'tools/guide-manifest.json'),
    JSON.stringify([...nz, ...out], null, 1) + '\n');
  console.log(`guide-manifest.json: ${nz.length} New Zealand + ${out.length} Australia = ${nz.length + out.length}`);
} else {
  console.log(JSON.stringify(out, null, 1));
}
