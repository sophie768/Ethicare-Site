/* ============================================================================
   Ethicare Resourcing — regional brochure builder
   A short, image-led A4 brochure per region. Sixteen to twenty pages, meant to
   be read once and forwarded to a partner, not used as a reference manual.

   HOW IT DIFFERS FROM build-guide-pdfs.js
   That one prints every chapter in full — right for the national guide, which is
   a reference document. This one DIGESTS each chapter: the lead line, the strongest
   facts, one photograph, and the opening of each section. The detail stays on the
   site, where it can be corrected. A brochure that tries to hold everything stops
   being a brochure.

   WHAT IT DELIBERATELY LEAVES OUT
   Prices. The destination chapters removed weekly rents and monthly budget tables
   on purpose, and say why: "A figure that was true when a page was written is
   misleading a year later." A web page can be fixed; a PDF someone downloaded in
   March cannot. Employer names and salary figures are out for the same reason,
   plus the standing rule that only Health New Zealand · Te Whatu Ora is named.

   USAGE   node tools/build-brochures.js [slug ...]      (server on :8766)
   OUTPUT  assets/downloads/<slug>-brochure.pdf
   ============================================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8766;
const ORIGIN = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, 'assets', 'downloads');
const GUIDES = require('./guide-manifest.json').filter(g => g.maori);   // regions only

/* Anything carrying a price is dropped rather than reworded: a number that cannot be
   corrected after sending is worse than no number. */
const PRICEY = /(\$|£|€)\s?\d|\bper week\b|\bweekly rent\b|\ba month\b.*\d|NZD|GBP/i;

/* Unsourced superlatives. The chapters still carry a few ("the cheapest housing in New
   Zealand", "the shortest commutes in the country") and a brochure is the worst place for
   them: a ranking that shifts with one quarter's data, printed in a file that cannot be
   corrected. They are skipped here; removing them from the chapters themselves is a
   separate editorial pass, and the claim should come back only with a source and a date. */
const CLAIMY = /\b(cheapest|most affordable|lowest (?:actual )?(?:price|rent|cost)|shortest commutes?|highest rents?|most expensive|best in the country|only place in)\b/i;
const skip = (t) => PRICEY.test(t) || CLAIMY.test(t);

function text(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

function absolutise(html, dir) {
  const fix = (u) => (!u || /^(https?:|data:|mailto:|tel:|#|\/)/i.test(u)) ? u
    : ORIGIN + '/' + path.posix.normalize(path.posix.join(dir, u));
  html = html.replace(/(<[^>]+\ssrc=")([^"]+)(")/gi, (m, a, u, b) => a + fix(u) + b);
  html = html.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, u) => `url(${q}${fix(u)}${q})`);
  return html;
}

/* ---------- digesting one chapter ---------- */

function digest(file) {
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dir = path.posix.dirname(file);
  const main = raw.slice(raw.indexOf('<main'), raw.indexOf('</main>'));

  const title = (/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(raw) || [, path.basename(file, '.html')])[1];
  const eyebrow = (/<div class="eyebrow"[^>]*>([\s\S]*?)<\/div>/i.exec(raw) || [, ''])[1];
  let lead = (/<p class="lead"[^>]*>([\s\S]*?)<\/p>/i.exec(main) || [, ''])[1];
  if (CLAIMY.test(text(lead))) {
    lead = lead.split(/(?<=\.)\s+/).filter(sent => !CLAIMY.test(text(sent))).join(' ');
  }

  /* Pictures carry a brochure. Prefer a captioned figure from the body; otherwise take
     the chapter's own hero photograph, which every destination chapter carries as an
     inline background on .hero .photo. */
  const fig = /<figure class="photo-fig"[\s\S]*?<\/figure>/i.exec(main);
  /* Chapters carry their hero three different ways, and some (.hero.nophoto) carry none. */
  const heroBg = /background:\s*url\((['"]?)([^'")]+\.(?:jpg|jpeg|png|webp))\1/i.exec(raw);
  const heroImg = /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp))"/i.exec(main);
  const heroSrc = (heroBg && heroBg[2]) || (heroImg && heroImg[1]) || '';
  const hero = heroSrc ? ORIGIN + '/' + path.posix.normalize(path.posix.join(dir, heroSrc)) : '';

  /* the k/v pairs the chapters already use become an at-a-glance panel */
  const facts = [];
  const factRe = /<div class="fact"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let fm;
  while ((fm = factRe.exec(main)) && facts.length < 3) {
    const k = (/<div class="k"[^>]*>([\s\S]*?)<\/div>/i.exec(fm[1]) || [, ''])[1];
    /* the outer match consumes the value's own closing tag, so accept the end of the
       captured block as a terminator too — otherwise every panel comes back empty */
    const v = (/<div class="v"[^>]*>([\s\S]*?)(?:<\/div>|$)/i.exec(fm[1]) || [, ''])[1];
    if (k && v && !skip(text(v)) && !skip(text(k))) facts.push({ k: text(k), v: text(v) });
  }

  /* each h2, with the first paragraph under it — the argument, not the evidence */
  const sections = [];
  const parts = main.split(/<h2[^>]*>/i).slice(1);
  for (const part of parts) {
    const h = text(part.slice(0, part.indexOf('</h2>')));
    const body = part.slice(part.indexOf('</h2>') + 5);
    const paras = [...body.matchAll(/<p(?![^>]*class="(?:lead|sx-note|cap)")[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => m[1]).filter(p => text(p).length > 60 && !skip(text(p)));
    if (h && paras.length) sections.push({ h, p: paras.slice(0, 2) });
    if (sections.length >= 8) break;
  }

  return {
    title: text(title), eyebrow: text(eyebrow), lead: absolutise(lead, dir),
    fig: fig ? absolutise(fig[0], dir) : '', hero, facts, sections
  };
}

/* ---------- the document ---------- */

function letter(g) {
  return `<section class="bpage bletter">
  <p class="salute">Nau mai ki ${g.maori}</p>
  <h2>Welcome to ${g.title}</h2>
  <p>Moving country is a bold thing to do, and it is rarely only about the job. This guide is here to make the practical parts easier: where people live, what the work is like, how you would get around, and what an ordinary week might actually feel like.</p>
  <p>It is written by people who arrange these moves for a living, which means two things. We know the questions that arrive at two in the morning. And we would rather tell you the awkward parts now than have you find them in month three.</p>
  <p>Nothing in here is a pitch. If ${g.title} turns out to be the wrong answer for you, this guide should help you work that out just as quickly &mdash; and that is a good outcome, not a failed one.</p>
  <p>Whatever you decide, you are welcome to ask us anything at all.</p>
  <p class="sign">Sophie</p>
  <p class="role">Founder, Ethicare Resourcing</p>
</section>`;
}

function chapterBlock(c, i) {
  const facts = c.facts.length ? `<div class="bfacts">${c.facts.map(f =>
    `<div><span class="k">${f.k}</span><span class="v">${f.v}</span></div>`).join('')}</div>` : '';
  const secs = c.sections.map(s =>
    `<div class="bsec"><h3>${s.h}</h3>${s.p.map(x => `<p>${x}</p>`).join('')}</div>`).join('');
  return `<section class="bpage bchap">
  <div class="bhead">
    ${c.hero ? `<div class="bband"><img src="${c.hero}" alt=""></div>` : ''}
    <div class="bopen">
      <span class="bnum">${String(i + 1).padStart(2, '0')}</span>
      <div><span class="beb">${c.eyebrow}</span><h2>${c.title}</h2></div>
    </div>
    ${c.lead ? `<p class="blead">${c.lead}</p>` : ''}
    ${facts}
  </div>
  ${c.fig}
  <div class="bcols">${secs}</div>
</section>`;
}

function compose(g, chapters) {
  const toc = chapters.map((c, i) =>
    `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${c.title}</span></li>`).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${g.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;1,500&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:22mm 20mm 24mm}
@page:first{margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:'Manrope',sans-serif;font-size:10.5pt;line-height:1.72;color:#333;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h2,h3{font-family:'Work Sans',sans-serif;color:#02615D;margin:0}
img{max-width:100%;display:block}
/* Only the front and back matter take a whole sheet. Chapters flow, because a forced
   page per chapter left every one of them two-thirds empty — and a brochure that is
   mostly white space reads as unfinished rather than generous. */
.bpage{break-before:page;page-break-before:always}
.bchap{break-before:page;page-break-before:always;margin-top:0}
/* cover */
.bcover{position:relative;width:210mm;height:297mm;display:flex;flex-direction:column;justify-content:flex-end;padding:0 26mm 36mm;color:#fff;overflow:hidden;background:#02615D}
.bcover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.bcover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,97,93,.22) 0%,rgba(2,97,93,.52) 48%,rgba(1,49,47,.94) 100%)}
.bcover .in{position:relative;z-index:1}
.bcover .eb{display:block;font-family:'Work Sans',sans-serif;font-weight:700;font-size:9.5pt;letter-spacing:.18em;text-transform:uppercase;color:#C6E084;margin-bottom:9mm}
.bcover h1{font-family:'Work Sans',sans-serif;font-weight:600;font-size:40pt;line-height:1;letter-spacing:-.025em;color:#fff;margin:0 0 3mm}
.bcover .mi{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16pt;color:#C6E084;margin:0 0 9mm}
.bcover .say{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:13pt;line-height:1.45;color:#DCEAE5;margin:0 0 12mm;max-width:32ch}
.bcover .meta{font-family:'Work Sans',sans-serif;font-size:9pt;line-height:1.75;color:#BBD9D2}
.bcover .meta strong{display:block;color:#fff;font-weight:600;font-size:10pt}
/* letter */
.bletter{padding-top:8mm}
.bletter .salute{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:13pt;color:#2F5E49;margin:0 0 3mm}
.bletter h2{font-size:26pt;font-weight:600;letter-spacing:-.02em;margin:0 0 11mm}
.bletter p{max-width:58ch;margin:0 0 7mm;font-size:11pt;line-height:1.85}
.bletter .sign{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17pt;color:#02615D;margin:10mm 0 0}
.bletter .role{font-family:'Work Sans',sans-serif;font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase;color:#5C6B57;margin:1mm 0 0}
/* contents */
.btoc{padding-top:8mm}
.btoc h2{font-size:22pt;margin:0 0 8mm}
.btoc ol{list-style:none;margin:0;padding:0}
.btoc li{display:flex;gap:8mm;align-items:baseline;padding:5.4mm 0;border-top:.4pt solid #C9DED3}
.btoc li:last-child{border-bottom:.4pt solid #C9DED3}
.btoc .n{font-family:'Work Sans',sans-serif;font-weight:700;font-size:9pt;color:#A6C84A;letter-spacing:.08em}
.btoc .t{font-family:'Work Sans',sans-serif;font-weight:600;font-size:12pt;color:#02615D}
/* chapter */
/* the photograph runs to the trimmed edge of the text block, which is what stops a
   chapter opener reading like a web page that happens to be on paper */
/* the opener stays in one piece: photograph, number, title and standfirst together */
.bhead{break-inside:avoid;page-break-inside:avoid}
.bband{margin:0 0 11mm}
.bband img{width:100%;height:118mm;object-fit:cover;border-radius:3mm}
.bopen{display:flex;gap:8mm;align-items:flex-start;border-top:1.6pt solid #02615D;padding-top:7mm;margin-bottom:9mm}
.bnum{font-family:'Work Sans',sans-serif;font-weight:300;font-size:30pt;line-height:.9;color:#A6C84A}
.beb{display:block;font-family:'Work Sans',sans-serif;font-weight:700;font-size:8pt;letter-spacing:.15em;text-transform:uppercase;color:#2F5E49;margin-bottom:2mm}
.bchap h2{font-size:24pt;font-weight:600;letter-spacing:-.02em;line-height:1.05}
.blead{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:13.5pt;line-height:1.55;color:#02615D;margin:0 0 11mm;max-width:44ch}
.bchap figure{margin:0 0 6mm}
.bchap figure img{width:100%;height:62mm;object-fit:cover;border-radius:3mm}
.bchap figcaption{font-family:'Work Sans',sans-serif;font-weight:600;font-size:8pt;color:#5C6B57;margin-top:2mm}
.bfacts{display:grid;grid-template-columns:repeat(3,1fr);gap:9mm;background:#E3ECE5;border-radius:3mm;padding:10mm;margin:2mm 0 0}
.bfacts .k{display:block;font-family:'Work Sans',sans-serif;font-weight:700;font-size:7.5pt;letter-spacing:.11em;text-transform:uppercase;color:#2F5E49;margin-bottom:1.5mm}
.bfacts .v{display:block;font-family:'Work Sans',sans-serif;font-weight:600;font-size:10pt;color:#02615D;line-height:1.35}
/* One column, not two. A CSS grid will not fragment across sheets in Chromium, so a
   two-column body always jumped whole to the next page and left the opener half empty.
   A single measure flows, and at this leading it reads better anyway. */
.bcols{max-width:64ch}
.bcols .bsec+.bsec{margin-top:8mm}
.bsec{break-inside:avoid;page-break-inside:avoid;margin:0}
.bsec h3{font-size:12.5pt;font-weight:600;margin:0 0 4mm;line-height:1.3}
.bsec p{margin:0 0 4.5mm;font-size:10.5pt;line-height:1.8;color:#3d3d3d}
.bsec p:last-child{margin-bottom:0}
/* closing */
.bend{padding-top:8mm}
.bend h2{font-size:24pt;margin:0 0 6mm}
.bend p{max-width:56ch;font-size:11pt;line-height:1.82;margin:0 0 6mm}
.bend .links{margin-top:8mm;border-top:.4pt solid #C9DED3;padding-top:5mm}
.bend .links div{padding:4mm 0;border-bottom:.4pt solid #E3ECE5;font-size:10pt}
.bend .links b{font-family:'Work Sans',sans-serif;color:#02615D}
.bnote{margin-top:9mm;font-size:8.5pt;line-height:1.6;color:#5C6B57;max-width:70ch}
/* Icons inside chapter content are inline SVGs with no width or height. Outside the
   site's stylesheet they fall back to 300x150px, which is how a link arrow became a
   billboard. Size them here and they behave. */
svg{width:9px;height:9px;vertical-align:baseline;margin-left:2px;flex:none}
/* link cards arrive from the chapters unstyled; give them a list treatment */
.linkcard{display:block;padding:3.4mm 0;border-bottom:.4pt solid #E3ECE5;text-decoration:none;color:inherit;break-inside:avoid}
.linkcard .lk{font-family:'Work Sans',sans-serif;font-weight:700;font-size:7.5pt;letter-spacing:.11em;text-transform:uppercase;color:#2F5E49;margin-bottom:1mm}
.linkcard .ln{font-family:'Work Sans',sans-serif;font-weight:600;font-size:10.5pt;color:#02615D}
.linkcard .ld{font-size:9pt;line-height:1.6;color:#555;margin-top:1mm}
a{color:#02615D;text-decoration:none}
h2,h3{break-after:avoid;page-break-after:avoid}
figure,.bfacts{break-inside:avoid;page-break-inside:avoid}
</style></head><body>
<section class="bcover">
  ${g.cover ? `<img src="${ORIGIN}/${g.cover}" alt="">` : ''}
  <div class="in">
    <span class="eb">Relocation guide &middot; New Zealand</span>
    <h1>${g.title}</h1>
    <p class="mi">${g.maori}</p>
    <p class="say">${g.strap}</p>
    <p class="meta"><strong>Ethicare Resourcing</strong>${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} &middot; ethicareresourcing.com</p>
  </div>
</section>
${letter(g)}
<section class="bpage btoc"><h2>What&rsquo;s inside</h2><ol>${toc}</ol>
  <p class="bnote">This is the short version. Every section here has a fuller chapter on our website, kept up to date &mdash; so if something looks time-sensitive, check there. We have left rents, salaries and other figures out on purpose: a number that was right when this was written would be quietly wrong by the time you read it, and a PDF cannot be corrected once it is sent. Those live on the site instead.</p>
</section>
${chapters.map(chapterBlock).join('\n')}
<section class="bpage bend">
  <h2>Where to go next</h2>
  <p>You do not need a moving date, a decision or a CV to talk to us. If ${g.title} is on your list, tell us what you do and what you are weighing up, and we will be straight with you about whether we can help.</p>
  <p>Everything on our website is free to read whether or not you ever work with us.</p>
  <div class="links">
    <div><b>The full ${g.title} guide</b> &mdash; ethicareresourcing.com/destinations/${g.slug.replace('-relocation-guide', '')}-new-zealand</div>
    <div><b>Registration pathway checker</b> &mdash; ethicareresourcing.com/pathway-checker</div>
    <div><b>What reaches your bank account</b> &mdash; ethicareresourcing.com/take-home-pay</div>
    <div><b>What the move itself costs</b> &mdash; ethicareresourcing.com/cost-calculator</div>
    <div><b>Talk to us</b> &mdash; hello@ethicareresourcing.com</div>
  </div>
</section>
</body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const list = only.length ? GUIDES.filter(g => only.includes(g.slug)) : GUIDES;
  const browser = await chromium.launch();
  for (const g of list) {
    const chapters = g.chapters.map(digest);
    const tmp = path.join(ROOT, 'tools', `.bro-${g.slug}.html`);
    fs.writeFileSync(tmp, compose(g, chapters), 'utf8');

    const page = await browser.newPage();
    if (process.env.FONT_DIR) {
      await page.route('**/fontsrc/**', r => r.fulfill({
        path: path.join(process.env.FONT_DIR, r.request().url().split('/fontsrc/')[1]),
        contentType: 'font/woff2'
      }));
    }
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    /* A dead local server produces a perfectly valid PDF with no photographs in it,
       which is the worst kind of failure: it looks like a build that worked. Count the
       misses and refuse to write the file. */
    const lost = [];
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(ORIGIN)) lost.push(r.url()); });
    page.on('requestfailed', r => { if (r.url().startsWith(ORIGIN)) lost.push(r.url()); });
    await page.goto('file://' + tmp, { waitUntil: 'domcontentloaded' });
    if (process.env.FONT_CSS) await page.addStyleTag({ content: fs.readFileSync(process.env.FONT_CSS, 'utf8') });
    await page.emulateMedia({ media: 'print' });
    await Promise.race([
      page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {})))),
      page.waitForTimeout(8000)
    ]);
    if (lost.length) {
      throw new Error(`${g.slug}: ${lost.length} asset(s) did not load — is the server on :${PORT}?\n  ` +
        [...new Set(lost)].slice(0, 3).map(u => u.replace(ORIGIN, '')).join('\n  '));
    }
    const file = path.join(OUT, g.slug.replace('-relocation-guide', '') + '-brochure.pdf');
    await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
    await page.close();
    if (!process.env.KEEP_HTML) fs.unlinkSync(tmp);
    console.log(`${path.basename(file).padEnd(38)} ${String(Math.round(fs.statSync(file).size / 1024)).padStart(5)} KB`);
  }
  await browser.close();
})();
