#!/usr/bin/env python3
"""
Ethicare Resourcing — add a vacancy from a short spec.

A vacancy is two things: a block in jobs/jobs-data.js (the board, the homepage
band, the "current opportunities" strip on each profession page) and a page in
jobs/vacancy/. This writes both from one spec, cloning the established page so
every advert has the same chrome, structured data and side panel.

The page never names the employer or the hospital — "a tertiary teaching
hospital in Hamilton" — and never prints a pay figure: the advert's own text
is the source of facts, not of copy. Write the spec in Ethicare's voice.

    python3 tools/new-vacancy.py spec.json          write page + data block
    python3 tools/new-vacancy.py spec.json --check  show what would be written

Spec fields (JSON):
  slug            "body-imaging-radiologist-waikato"      the URL and the id
  title           "Consultant Radiologist · Body Imaging"  board card title
  h1              "Consultant Radiologist, Body Imaging — Hamilton"
  eyebrow         "Consultant Radiologist · Body imaging · Public sector"
  profession      "Consultant Radiologist"     must match a profession page's
                                                "current opportunities" filter
  professionGuide "/jobs/consultant-radiologist-new-zealand"    the page the side
                  panel links to. Not every specialty has its own guide and most
                  never will, so a specialty we have not written up points at its
                  family hub instead — /jobs/medicine-new-zealand.
  guideLabel      "Medicine in New Zealand"     optional; what that link calls the
                  destination. Defaults to the profession, which is only right when
                  the guide really is that profession's own.
  checker         "radiologist"                pathway-checker profession id
  sector          "Public sector"
  region          "Waikato"                    as jobs-data.js already spells it
  city            "Hamilton"
  country         "New Zealand"
  countryCode     "NZ"
  types           ["Permanent","Full-time"]
  hours           "80 hours a fortnight (1.0 FTE)"     optional, shown as a chip
  positions       2                            optional, "Two positions" chip
  posted          "2026-09-27"
  closes          "2026-10-22"                 optional; drives "closing soon"
  pay             "Competitive — set by the ASMS MECA scale"
  lifestyle       one sentence for the board card
  summary         one sentence, ≤160 chars, for the card and meta description
  intro           the paragraph under the H1 — starts "Ethicare is recruiting…"
  about           list of paragraphs
  involves        list of bullets
  aboutYou        list of bullets
  place           heading + paragraph, e.g. {"h":"About Hamilton","p":"…"}
"""
import json, os, re, sys, html

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
TEMPLATE = 'jobs/vacancy/breast-radiologist-waikato.html'

check = '--check' in sys.argv
spec_path = [a for a in sys.argv[1:] if not a.startswith('--')][0]
S = json.load(open(spec_path, encoding='utf-8'))

esc = lambda s: (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;'))
jesc = lambda s: json.dumps(s)[1:-1]

slug = S['slug']
page = f'jobs/vacancy/{slug}.html'
url = f'https://ethicareresourcing.com/jobs/vacancy/{slug}'
loc = f"{S['city']}, {S['country']}"
assert len(S['summary']) <= 160, f"summary is {len(S['summary'])} chars; keep it under 160"
for key in ('intro', 'summary', 'lifestyle', 'place'):
    v = json.dumps(S[key])
    assert not re.search(r'Health New Zealand|Te Whatu Ora|Hospital\b', v), f'{key} names the employer or a hospital'

t = open(TEMPLATE, encoding='utf-8').read()

# ---- head -------------------------------------------------------------------
t = re.sub(r'<title>[^<]*</title>', f"<title>{esc(S['title'])} | {esc(S['city'])} | Ethicare</title>", t, 1)
t = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + esc(S['summary']) + m.group(2), t)
t = re.sub(r'(<meta (?:property|name)="(?:og|twitter):description" content=")[^"]*(")', lambda m: m.group(1) + esc(S['summary']) + m.group(2), t)
t = re.sub(r'(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")', lambda m: m.group(1) + esc(f"{S['title']} | {S['city']} | Ethicare Resourcing") + m.group(2), t)
t = t.replace('https://ethicareresourcing.com/jobs/vacancy/breast-radiologist-waikato', url)

# ---- structured data --------------------------------------------------------
ld = [{
    "@context": "https://schema.org/", "@type": "JobPosting",
    "title": S['title'],
    "description": f"<p>{S['summary']}</p><p>{S['lifestyle']}</p><p>A {S['sector'].lower()} role in {loc}, supported by Ethicare Resourcing: registration, visas and relocation.</p>",
    "datePosted": S['posted'],
    **({"validThrough": S['closes'] + "T23:59:00+13:00"} if S.get('closes') else {}),
    "employmentType": "FULL_TIME" if 'Full-time' in S['types'] else "PART_TIME",
    "occupationalCategory": S['profession'],
    "hiringOrganization": {"@type": "Organization", "name": "Ethicare Resourcing", "sameAs": "https://ethicareresourcing.com/", "logo": "https://ethicareresourcing.com/assets/logo-mark.png"},
    "jobLocation": {"@type": "Place", "address": {"@type": "PostalAddress", "addressLocality": S['city'], "addressRegion": S['region'], "addressCountry": S['countryCode']}},
    "identifier": {"@type": "PropertyValue", "name": "Ethicare Resourcing", "value": slug},
    "url": url,
    "applicantLocationRequirements": {"@type": "Country", "name": S['country']},
}, {
    "@context": "https://schema.org/", "@type": "BreadcrumbList",
    "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://ethicareresourcing.com/"},
        {"@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://ethicareresourcing.com/jobs/"},
        {"@type": "ListItem", "position": 3, "name": S['title'], "item": url}]
}]
t = re.sub(r'(<script type="application/ld\+json">\n)[\s\S]*?(\n</script>)',
           lambda m: m.group(1) + json.dumps(ld, ensure_ascii=False, separators=(',', ':')) + m.group(2), t, 1)

# ---- body -------------------------------------------------------------------
chips = ''.join(f'<span class="chip">{esc(x)}</span>' for x in S['types'])
if S.get('positions', 1) > 1:
    chips += f'<span class="chip">{["","","Two","Three","Four"][S["positions"]]} positions</span>'
if S.get('hours'):
    chips += f'<span class="chip">{esc(S["hours"])}</span>'
chips += ('<span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
          '<path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>' + esc(loc) + '</span>')
if S.get('closes'):
    d = S['closes']; y, m, dd = d.split('-')
    months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    chips += f'<span class="chip">Closes {int(dd)} {months[int(m)]} {y}</span>'

ul = lambda items: '<ul class="ticks">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'
main = f'''<header class="v-hero"><div class="wrap">
  <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="sep">›</span><a href="/jobs/">Jobs</a><span class="sep">›</span><span class="here">{S['title']}</span></nav>
  <span class="eyebrow">{S['eyebrow']}</span>
  <h1>{S['h1']}</h1>
  <div class="chips">{chips}</div>
  <p class="intro">{S['intro']}</p>
</div></header>
<section class="v-body"><div class="wrap"><div class="v-grid">
  <div class="v-main">
    <h2>About the role</h2>
    {''.join(f'<p>{p}</p>' for p in S['about'])}
    <h2>What the role involves</h2>{ul(S['involves'])}
    <h2>About you</h2>
    {ul(S['aboutYou'])}
    <h2>{S['place']['h']}</h2>
    <p>{S['place']['p']}</p>
  </div>
  <aside class="v-side">

    <div class="acts"><a href="/apply?role={slug}" class="btn btn-primary">Apply through Ethicare</a><a href="/contact" class="btn btn-secondary">Ask about this role</a></div>
    <div class="v-alt"><button type="button" data-v-save hidden aria-pressed="false">Save for later</button><a href="/pathway-checker?profession={S['checker']}&amp;destination={S['country'].lower().replace(' ', '-')}" data-ctx-link>Check whether I can register</a><a href="/apply?role={slug}&amp;intent=later">Interested but not ready</a></div>
    <p class="note">We support you the whole way: registration with the Medical Council or your professional board, visas for you and your family, and the relocation itself. The employer is never named until you choose to apply.</p>
    <a class="gl" href="{S['professionGuide']}">Read the {S.get('guideLabel') or S['profession']} guide <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
  </aside>
</div></div></section>'''
s = t.index('<header class="v-hero">'); e = t.index('</section>', t.index('<aside class="v-side">')) + len('</section>')
t = t[:s] + main + t[e:]

# ---- SEO comment ------------------------------------------------------------
t = re.sub(r'<!-- SEO[\s\S]*?-->',
           f"<!-- SEO — Page Title: {S['title']} jobs in {loc} | URL Slug: /jobs/vacancy/{slug} | SEO Title: {S['title']}, {S['city']} {S['countryCode']} | Ethicare Resourcing | Meta Description: {S['summary']} -->", t)

# ---- jobs-data block --------------------------------------------------------
block = '  {\n' + ',\n'.join([
    f'    slug: "{slug}"',
    f'    title: "{jesc(S["title"])}"',
    f'    profession: "{jesc(S["profession"])}"',
    f'    professionGuide: "{S["professionGuide"]}"',
    f'    sector: "{S["sector"]}"',
    f'    region: "{jesc(S["region"])}"',
    f'    location: "{jesc(loc)}"',
    f'    country: "{S["country"]}"',
    f'    types: {json.dumps(S["types"])}',
    f'    posted: "{S["posted"]}"',
] + ([f'    closes: "{S["closes"]}"'] if S.get('closes') else []) + [
    f'    pay: "{jesc(S["pay"])}"',
    f'    lifestyle: "{jesc(S["lifestyle"])}"',
    f'    summary: "{jesc(S["summary"])}"',
    f'    detail: "/jobs/vacancy/{slug}"',
]) + '\n  }'

data = open('jobs/jobs-data.js', encoding='utf-8').read()
if f'slug: "{slug}"' in data:
    print(f'{slug} is already on the board — the page is rewritten, the data block left alone')
    new_data = data
else:
    i = data.index('window.ETHICARE_JOBS = [') + len('window.ETHICARE_JOBS = [')
    new_data = data[:i] + '\n' + block + ',' + data[i:]

if check:
    print(main[:1500]); print('\n…\n'); print(block)
else:
    open(page, 'w', encoding='utf-8').write(t)
    open('jobs/jobs-data.js', 'w', encoding='utf-8').write(new_data)
    print(f'wrote {page} and its jobs-data.js block')
