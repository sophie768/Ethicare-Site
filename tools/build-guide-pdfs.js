/* ============================================================================
   Ethicare Resourcing — guide PDF builder
   Produces one A4 PDF per guide from the chapters that are already on the site.

   WHY IT WORKS THIS WAY
   The chapters are the source of truth. Rather than maintain a second, parallel
   copy of the words for print, this assembles the real chapter markup into one
   document and lets Chromium print it, so a PDF can never drift from the page
   it came from. Re-run it whenever a chapter changes.

   guide-print.css already does the hard part: it is written against the real
   markup of all three guide families and turns photographic heroes into title
   blocks, hides site chrome and sets A4 with 14mm margins. This file adds only
   what a bound document needs that a single page does not — a cover, a contents
   page, chapter breaks and continuous page numbers.

   USAGE   node tools/build-guide-pdfs.js [slug ...]
           A local server must be serving the site root on PORT (see below), so
           that every image, font and stylesheet resolves exactly as it does in
           a browser. Without one the PDFs build but come out unstyled.
   OUTPUT  assets/downloads/<slug>.pdf
   ============================================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8766;
const ORIGIN = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, 'assets', 'downloads');

/* Every stylesheet any chapter uses, so an assembled page looks like the page it
   came from. guide-print.css must stay last: it is the override layer. */
const SHEETS = [
  'shell.css', 'prose-links.css', 'stacked-hero.css', 'guide-graphics.css',
  'guide-mobile.css', 'disclose.css', 'hero.css', 'guide-hero-split.css',
  'secbar.css', 'readable.css', 'next-step.css', 'guide-cover.css',
  'guide-figure.css', 'family.css', 'practice.css', 'guide-print.css'
];

const GUIDES = require('./guide-manifest.json');

/* ---------- assembling one chapter ---------- */

/* Relative URLs inside a chapter resolve against that chapter's own folder, and
   the chapters sit at different depths. Rewriting them to absolute is what lets
   fifteen chapters from three directories live in one document. */
function absolutise(html, dir) {
  const fix = (u) => {
    if (!u || /^(https?:|data:|mailto:|tel:|#|\/)/i.test(u)) return u;
    return ORIGIN + '/' + path.posix.normalize(path.posix.join(dir, u));
  };
  html = html.replace(/(<[^>]+\s(?:src|poster)=")([^"]+)(")/gi, (m, a, u, b) => a + fix(u) + b);
  html = html.replace(/(<img[^>]+srcset=")([^"]+)(")/gi, (m, a, set, b) =>
    a + set.split(',').map(s => {
      const [u, d] = s.trim().split(/\s+/);
      return fix(u) + (d ? ' ' + d : '');
    }).join(', ') + b);
  html = html.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, u) => `url(${q}${fix(u)}${q})`);
  return html;
}

/* Keep the chapter, drop the site. The print stylesheet hides most of this
   anyway; removing it outright keeps the assembled file small and stops any
   stray script from running. */
function stripChrome(body) {
  const kill = [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /<header class="site-header"[\s\S]*?<\/header>/i,
    /<footer class="site-footer"[\s\S]*?<\/footer>/i,
    /<button class="backtop"[\s\S]*?<\/button>/i,
    /<aside class="sidebar"[\s\S]*?<\/aside>/i,
    /<a class="skip-link"[\s\S]*?<\/a>/i,
    /<page-feedback\b[^>]*>[\s\S]*?<\/page-feedback>/gi,
    /<nav class="wf-onward"[\s\S]*?<\/nav>/gi,
    /<!--[\s\S]*?-->/g
  ];
  kill.forEach(re => { body = body.replace(re, ''); });
  return body;
}

function chapterHTML(file, index) {
  const full = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dir = path.posix.dirname(file);
  let body = full.slice(full.indexOf('<body'), full.lastIndexOf('</body>'));
  body = body.slice(body.indexOf('>') + 1);
  body = absolutise(stripChrome(body), dir);

  const t = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(body);
  const title = t ? t[1].replace(/<[^>]+>/g, '').trim() : path.basename(file, '.html');
  return { html: `<section class="pdfch" id="ch${index}">${body}</section>`, title };
}

/* ---------- the document ---------- */

function compose(guide, chapters) {
  const links = SHEETS.map(s => `<link rel="stylesheet" href="${ORIGIN}/${s}">`).join('\n');
  const toc = chapters.map((c, i) =>
    `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${c.title}</span></li>`).join('\n');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>${guide.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;1,500&display=swap" rel="stylesheet">
${links}
<style>
@page{size:A4;margin:16mm 14mm 18mm}
/* The cover is the one page that bleeds. Chromium honours @page:first, so the sheet
   loses its margins for page one only and the artwork can reach the paper edge. */
@page:first{margin:0}
html,body{background:#fff}
body{font-family:'Manrope',sans-serif;color:#333}
/* each chapter opens a new sheet */
.pdfch{break-before:page;page-break-before:always}
.pdfch:first-of-type{break-before:auto;page-break-before:auto}
/* the cover is the one full-bleed page in the document */
.pdfcover{break-after:page;page-break-after:always;position:relative;width:210mm;height:297mm;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;background:#02615D;overflow:hidden;padding:0 20mm 28mm}
.pdfcover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
/* A wash rather than a flat opacity: the photograph keeps its colour at the top and
   the type sits on solid enough teal at the foot to stay legible on any image. */
.pdfcover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,97,93,.30) 0%,rgba(2,97,93,.55) 45%,rgba(1,49,47,.93) 100%)}
.pdfcover .in{position:relative;z-index:1}
.pdfcover .eb{font-family:'Work Sans',sans-serif;font-weight:700;font-size:10pt;letter-spacing:.16em;text-transform:uppercase;color:#C6E084;display:block;margin-bottom:10mm}
.pdfcover h1{font-family:'Work Sans',sans-serif;font-weight:600;font-size:34pt;line-height:1.04;letter-spacing:-.02em;color:#fff;margin:0 0 6mm;max-width:20ch}
.pdfcover .say{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:14pt;line-height:1.4;color:#DCEAE5;margin:0 0 12mm;max-width:34ch}
.pdfcover .meta{font-family:'Work Sans',sans-serif;font-size:9.5pt;color:#BBD9D2;line-height:1.7}
.pdfcover .meta strong{color:#fff;font-weight:600}
/* contents */
.pdftoc{break-after:page;page-break-after:always;padding-top:6mm}
.pdftoc h2{font-family:'Work Sans',sans-serif;font-weight:600;font-size:20pt;color:#02615D;margin:0 0 8mm}
.pdftoc ol{list-style:none;margin:0;padding:0}
.pdftoc li{display:flex;gap:6mm;align-items:baseline;padding:3.4mm 0;border-top:.3pt solid #C9DED3;font-size:11pt}
.pdftoc li:last-child{border-bottom:.3pt solid #C9DED3}
.pdftoc .n{font-family:'Work Sans',sans-serif;font-weight:700;font-size:9pt;color:#2F5E49;letter-spacing:.08em}
.pdftoc .t{font-family:'Work Sans',sans-serif;font-weight:600;color:#02615D}
.pdfnote{margin-top:10mm;font-size:9pt;line-height:1.6;color:#555;max-width:70ch}
.pdfnote strong{color:#02615D}
/* web furniture that means nothing on paper */
.wf-crumb,.crumb,.breadcrumb,.chapnav,.ch-prev,.ch-next,.backtop,.secbar,.sharebar{display:none !important}
/* never strand a heading at the foot of a sheet */
h1,h2,h3{break-after:avoid;page-break-after:avoid}
figure,table,.gfx,blockquote{break-inside:avoid;page-break-inside:avoid}
</style></head><body class="pdfdoc">
<section class="pdfcover">
  ${guide.cover ? `<img src="${ORIGIN}/${guide.cover}" alt="">` : ''}
  <div class="in">
    <span class="eb">${guide.eyebrow}</span>
    <h1>${guide.title}</h1>
    <p class="say">${guide.strap}</p>
    <p class="meta"><strong>Ethicare Resourcing</strong><br>${guide.chapters.length} chapters &middot; ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}<br>ethicareresourcing.com</p>
  </div>
</section>
<section class="pdftoc">
  <h2>What&rsquo;s inside</h2>
  <ol>${toc}</ol>
  <p class="pdfnote"><strong>This guide is free, and so is everything in it.</strong> Every chapter here is also on the website, where it is kept up to date &mdash; so if you are reading this some months after downloading it, check the site for anything that looks time-sensitive. Fees, tax rates and immigration settings change without much notice.</p>
  <p class="pdfnote">We don&rsquo;t print these. A PDF costs nothing to send and nothing to ship, which felt like the right answer for a company that spends its days moving people around the world.</p>
</section>
${chapters.map(c => c.html).join('\n')}
</body></html>`;
}

/* ---------- build ---------- */

async function build(browser, guide) {
  const chapters = guide.chapters.map((f, i) => chapterHTML(f, i));
  const tmp = path.join(ROOT, 'tools', `.build-${guide.slug}.html`);
  fs.writeFileSync(tmp, compose(guide, chapters), 'utf8');

  const page = await browser.newPage();
  const missing = [];
  page.on('response', r => { if (r.status() >= 400) missing.push(r.status() + ' ' + r.url()); });
  page.on('requestfailed', r => { if (r.url().startsWith(ORIGIN)) missing.push('FAIL ' + r.url()); });

  /* Offline build support. Where the build machine cannot reach Google Fonts, set
     FONT_CSS to a stylesheet of local @font-face rules and FONT_DIR to the folder
     holding the files; anything else off-origin is dropped rather than waited on,
     so a blocked request can never hang the build. */
  if (process.env.FONT_DIR) {
    await page.route('**/fontsrc/**', r => r.fulfill({
      path: path.join(process.env.FONT_DIR, r.request().url().split('/fontsrc/')[1]),
      contentType: 'font/woff2'
    }));
  }
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());

  await page.goto('file://' + tmp, { waitUntil: 'domcontentloaded' });
  if (process.env.FONT_CSS) await page.addStyleTag({ content: fs.readFileSync(process.env.FONT_CSS, 'utf8') });
  await page.emulateMedia({ media: 'print' });
  /* Wait for images, but never indefinitely: decode() on an image whose request was
     blocked or 404'd never settles, which will hang the build rather than fail it. */
  await Promise.race([
    page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {})))),
    page.waitForTimeout(8000)
  ]);
  await page.waitForTimeout(400);

  const file = path.join(OUT, guide.slug + '.pdf');
  /* preferCSSPageSize lets the @page rules above govern, including @page:first, which
     is what allows a full-bleed cover. Chromium's own header/footer is off: it cannot be
     suppressed on page one, so the running foot is stamped afterwards instead. */
  await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
  await page.close();
  fs.unlinkSync(tmp);
  return { file, missing: [...new Set(missing)] };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const list = only.length ? GUIDES.filter(g => only.includes(g.slug)) : GUIDES;
  const browser = await chromium.launch();
  for (const g of list) {
    const { file, missing } = await build(browser, g);
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`${g.slug.padEnd(34)} ${String(kb).padStart(6)} KB` + (missing.length ? `  ⚠ ${missing.length} asset(s) failed` : ''));
    missing.slice(0, 4).forEach(m => console.log('      ' + m.replace(ORIGIN, '')));
  }
  await browser.close();
})();
