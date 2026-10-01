#!/usr/bin/env python3
"""
Ethicare Resourcing — static pre-launch audit.

Walks every page the sitemap lists and checks, without a browser:
  · every internal link resolves to a file, a directory index, a netlify
    redirect or an anchor that exists on the target page;
  · every image, stylesheet and script src resolves;
  · no page names a hospital where a candidate is concerned. Naming the
    hospitals of a city as information about that city is fine — that is what
    a destination guide is for — but a placement, a vacancy or a candidate's
    story says "a hospital in Palmerston North", never the hospital. Only
    Health New Zealand · Te Whatu Ora is named as an employer (Sophie,
    26 Sep 2026). Advisers' own affiliations on /clinical-standard are their
    CVs, not employers, and stay;
  · no page still offers a printed guide;
  · titles and meta descriptions exist and are within length.

    python3 tools/audit-links.py
"""
import os, re, sys, html, glob
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

SITEMAP = 'sitemap.xml'
if not os.path.exists(SITEMAP):
    sys.exit('No sitemap.xml — run tools/build-sitemap.js first')

urls = re.findall(r'<loc>https://ethicareresourcing\.com(/[^<]*)</loc>', open(SITEMAP).read())


def file_for(url):
    if url == '/':
        return 'index.html'
    p = url.lstrip('/')
    for cand in (p + '.html', p.rstrip('/') + '/index.html'):
        if os.path.exists(cand):
            return cand
    return None


# netlify.toml redirects are legitimate link targets.
toml = open('netlify.toml').read()
REDIRECTS = {m for m in re.findall(r'from\s*=\s*"(/[^"*]+)"', toml)}

# Hospitals must not be named as employers. Health New Zealand · Te Whatu Ora is
# the one permitted name; these are the patterns that have crept in before.
HOSPITAL = re.compile(
    r'\b([A-Z][a-zA-Z’\'-]+(?:\s+[A-Z][a-zA-Z’\'-]+){0,3}\s+'
    r'(?:Hospital|Health Service|Health Network|Medical Centre|Infirmary))\b')
HOSPITAL_OK = re.compile(r'(Health New Zealand|Te Whatu Ora|the hospital|a hospital|base hospital|'
                         r'public hospital|tertiary hospital|private hospital|'
                         # generic service descriptions, not the name of a place
                         r'Mental Health Service|Community Health Service|Health Service in)', re.I)
# Only a candidate-facing mention is a problem; city information is the point
# of a destination guide.
CANDIDATE_CTX = re.compile(r'\b(placed|placement|we placed|recruit|vacanc|role at|our candidate)\b', re.I)
# The clinical board members' own affiliations are their CVs.
HOSPITAL_EXEMPT_PAGES = {'clinical-standard.html'}

# Health New Zealand · Te Whatu Ora may be explained as the health system — a
# guide cannot describe the public system without naming it — but is never
# named as Ethicare's client. "We work with large healthcare organisations"
# is the line (Sophie, 27 Sep 2026).
CLIENT_CLAIM = re.compile(r'(working with|we work with|we recruit for|our client|placed (?:\w+ ){0,3}(?:at|with)|all with|'
                          r'on behalf of|partner(?:ed|ing)? with)[^.]{0,60}(Health New Zealand|Te Whatu Ora)', re.I)

PRINT_OFFER = re.compile(r'printed guide|Prefer it on paper|Request printed guide|request a printed', re.I)

broken_links = defaultdict(list)
broken_assets = defaultdict(list)
hospitals = defaultdict(set)
print_offers = []
client_claims = []
meta_issues = []

anchors_cache = {}


def anchors(path):
    if path not in anchors_cache:
        src = open(path, encoding='utf-8', errors='ignore').read()
        anchors_cache[path] = set(re.findall(r'\bid="([^"]+)"', src)) | set(re.findall(r'\bname="([^"]+)"', src))
    return anchors_cache[path]


for url in urls:
    f = file_for(url)
    if f is None:
        broken_links['(sitemap)'].append(url)
        continue
    src = open(f, encoding='utf-8', errors='ignore').read()
    base = os.path.dirname(f)

    # ---- links ------------------------------------------------------------
    for href in re.findall(r'<a\b[^>]*?href="([^"]+)"', src):
        href = html.unescape(href)
        if href.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', '#')):
            continue
        # hrefs built inside a script are templates, not paths
        if "'+" in href or '${' in href or '"+' in href:
            continue
        target, _, frag = href.partition('#')
        target = target.split('?', 1)[0]      # a query string is not part of the path
        if not target:
            continue
        if target.startswith('/'):
            if target in REDIRECTS:
                continue
            cand = target.lstrip('/')
        else:
            cand = os.path.normpath(os.path.join(base, target))
        resolved = None
        for c in (cand, cand + '.html', os.path.join(cand, 'index.html')):
            if os.path.isfile(c):
                resolved = c
                break
        if resolved is None:
            broken_links[f].append(href)
        elif frag and resolved.endswith('.html') and frag not in anchors(resolved):
            broken_links[f].append(href + '   (anchor)')

    # ---- assets -----------------------------------------------------------
    for attr in re.findall(r'(?:src|href)="([^"]+\.(?:jpg|jpeg|png|webp|svg|gif|css|js|pdf))"', src):
        attr = html.unescape(attr)
        if attr.startswith(('http://', 'https://', 'data:')):
            continue
        cand = attr.lstrip('/') if attr.startswith('/') else os.path.normpath(os.path.join(base, attr))
        if not os.path.isfile(cand):
            broken_assets[f].append(attr)

    # ---- editorial rules --------------------------------------------------
    text = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', src)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', text))
    if f not in HOSPITAL_EXEMPT_PAGES:
        for m in HOSPITAL.finditer(text):
            name = m.group(1)
            if HOSPITAL_OK.search(name):
                continue
            if not CANDIDATE_CTX.search(text[max(0, m.start() - 160):m.end() + 160]):
                continue
            hospitals[name].add(f)
    if PRINT_OFFER.search(text):
        print_offers.append(f)
    m = CLIENT_CLAIM.search(text)
    if m:
        client_claims.append((f, text[max(0, m.start() - 40):m.end() + 40].strip()))

    # ---- metadata ---------------------------------------------------------
    # A raw " inside a content attribute ends it early, so the crawler reads a
    # truncated description and nobody notices. Curly quotes or &quot; instead.
    for m in re.finditer(r'<meta [^>]*?(?:name|property)="(?:description|og:description|'
                         r'twitter:description|og:title|twitter:title)" content="[^"]*"([^>]*)>', src):
        if m.group(1).strip() not in ('', '/'):
            meta_issues.append((f, 'unescaped quote inside a meta content attribute'))
    t = re.search(r'<title>([^<]*)</title>', src)
    d = re.search(r'<meta name="description" content="([^"]*)"', src)
    if not t:
        meta_issues.append((f, 'no <title>'))
    elif len(html.unescape(t.group(1))) > 60:
        meta_issues.append((f, f'title {len(html.unescape(t.group(1)))} chars'))
    if not d:
        meta_issues.append((f, 'no meta description'))
    elif len(html.unescape(d.group(1))) > 160:
        meta_issues.append((f, f'description {len(html.unescape(d.group(1)))} chars'))

# ---- things queued for deletion that something still uses -----------------
# DELETE-THESE.md is a running list, so it goes stale as the site changes. A page
# or a script that still points at a listed file turns the next tidy-up into a
# broken link. This caught guides/nz/your-first-month.html, which three scripts
# used for Ethicare Move's first-thirty-days step long after the page itself had
# stopped linking to it \u2014 the reference lived only in JavaScript.
doomed_used = []
if os.path.exists('DELETE-THESE.md'):
    # The whole line, not the first word: several queued exports have spaces in
    # their filenames ("Welcome to Wellington - Akhil Lakhia and Sarah.html"), and
    # split()[0] silently turned those into "Welcome", which matches nothing. A
    # queued file then looks unqueued, which is how this list got audited wrong on
    # 30 September 2026.
    listed = [l.strip() for l in open('DELETE-THESE.md', encoding='utf-8')
              if l.startswith('    ') and l.strip()]
    listed = [i for i in listed if i and ('/' in i or i.endswith(('.html', '.js')))]
    doomed = set(listed)
    doomed_dirs = tuple(i for i in listed if i.endswith('/'))
    survivors = []
    for pat in ('**/*.html', '*.js'):
        for p in glob.glob(pat, recursive=True):
            if p.startswith('.git') or p in doomed or p.startswith(doomed_dirs):
                continue
            survivors.append(p)
    blob = ''.join(open(p, encoding='utf-8', errors='ignore').read() for p in survivors)
    for item in listed:
        stem = item[:-5] if item.endswith('.html') else item
        # netlify.toml keeps naming a deleted path on purpose: that is the 301.
        if '/' + stem in blob or '"' + stem in blob:
            doomed_used.append(item)

# ---- links built by JavaScript -------------------------------------------
# The planner and the profession catalogue build links at runtime, which the
# page walk above never sees. Any site path or download named in a script
# must exist too — the planner offered a PDF that did not for eleven months.
js_missing = []
for jsf in sorted(f for f in os.listdir('.') if f.endswith('.js')):
    src = open(jsf, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r"['\"](/(?:guides|jobs|destinations|assets/downloads)/[A-Za-z0-9_./-]+?)(?:#[a-z-]+)?['\"](\s*\+)?", src):
        if m.group(2):
            continue        # a prefix being concatenated, not a whole path
        p = m.group(1).lstrip('/')
        if not (os.path.isfile(p) or os.path.isfile(p + '.html') or os.path.isfile(os.path.join(p, 'index.html'))):
            js_missing.append((jsf, m.group(1)))

# ---- pages nothing links to ----------------------------------------------
# A page no one can click is not broken, so nothing above catches it: it just sits
# there, indexable, carrying a claim or a candidate's name long after the decision
# that made it was reversed. Walk out from the homepage and see what is never
# reached. Script-built links count — the job board draws every vacancy card from
# jobs-data.js, so a static walk alone would report thirty-five live vacancies as
# orphans, which is how this check reads wrong if you write it in a hurry.
EXPECTED_ORPHANS = ('404.html', 'thank-you.html', 'coming-soon.html', '_header.html')
# Finished pages held back on purpose (Sophie, 1 Oct 2026): Ethicare recruits medical
# imaging, radiation therapy, nuclear medicine and radiology in Australia, so these six
# wait until it recruits the rest. They must stay off the live site entirely — no link,
# no sitemap entry, noindex in the page and an X-Robots-Tag in netlify.toml — so this
# check reports them as dormant rather than as orphans, and shouts if one is linked.
DORMANT = (
    'jobs/allied-health-australia.html',
    'jobs/mental-health-australia.html',
    'jobs/nursing-midwifery-australia.html',
    'jobs/medicine-australia.html',
    'jobs/theatre-perioperative-australia.html',
    'jobs/psychologist-australia.html',
)
EXPECTED_DIRS = ('_forms/', 'pack/', 'assets/', 'prototypes/')

def _targets(text, base):
    for m in re.finditer(r'href="([^"]+)"', text):
        h = m.group(1)
        if not h or h[0] in '#?' or h.startswith(('mailto:', 'tel:', 'http', 'javascript:')):
            continue
        h = h.split('#')[0].split('?')[0]
        if not h:
            continue
        p = h if h.startswith('/') else '/' + os.path.normpath(
            os.path.join('/' + os.path.dirname(base), h)).lstrip('/')
        p = REDIRECTS.get(p, p)
        b = p.lstrip('/')
        for c in (b, b + '.html', os.path.join(b.rstrip('/'), 'index.html')):
            if os.path.isfile(c) and c.endswith('.html'):
                yield c
                break

REDIRECTS = {}
if os.path.exists('netlify.toml'):
    _t = open('netlify.toml', encoding='utf-8').read()
    for m in re.finditer(r'from\s*=\s*"([^"]+)"\s*\n\s*to\s*=\s*"([^"]+)"', _t):
        REDIRECTS[m.group(1)] = m.group(2)

def _queued(k):
    return k in doomed or k.startswith(doomed_dirs) if 'doomed' in dir() else False

live_pages = [f for f in glob.glob('**/*.html', recursive=True)
              if not f.startswith('.git') and f not in doomed and not f.startswith(doomed_dirs)]
script_paths = {}
for jsf in glob.glob('*.js') + glob.glob('*/*.js'):
    if jsf in doomed or jsf.startswith(doomed_dirs):
        continue
    txt = open(jsf, encoding='utf-8', errors='ignore').read()
    hits = set()
    for m in re.finditer(r'["\'](/[A-Za-z0-9/_.-]+)["\']', txt):
        b = m.group(1).lstrip('/')
        for c in (b, b + '.html', os.path.join(b.rstrip('/'), 'index.html')):
            if os.path.isfile(c) and c.endswith('.html'):
                hits.add(c)
                break
    script_paths[jsf] = hits

reached, queue = {'index.html'}, ['index.html']
while queue:
    cur = queue.pop()
    try:
        src = open(cur, encoding='utf-8', errors='ignore').read()
    except OSError:
        continue
    nxt = set(_targets(src, cur))
    for jsf, hits in script_paths.items():
        if os.path.basename(jsf) in src:
            nxt |= hits
    for t in nxt:
        if t not in reached:
            reached.add(t)
            queue.append(t)

unreachable = sorted(f for f in live_pages
                     if f not in reached
                     and f not in EXPECTED_ORPHANS
                     and f not in DORMANT
                     and not f.startswith(EXPECTED_DIRS))

# A dormant page that something now links to, or that lost its noindex, is live by
# accident — which is the whole thing this is here to prevent.
dormant_leaks = []
for f in DORMANT:
    if not os.path.isfile(f):
        dormant_leaks.append((f, 'file is gone'))
        continue
    if f in reached:
        dormant_leaks.append((f, 'something links to it'))
    # The 301 in netlify.toml is what actually keeps these off the site: the URL serves
    # coming-to-australia instead, so the page is unreachable however it is linked. The
    # noindex below is the fallback for the day a redirect is removed.
    if 'netlify.toml' in globals().get('_NETLIFY', '') or True:
        _nt = open('netlify.toml', encoding='utf-8').read() if os.path.exists('netlify.toml') else ''
        if 'from = "/%s"' % f[:-5] not in _nt:
            dormant_leaks.append((f, 'no redirect in netlify.toml'))
    head = open(f, encoding='utf-8', errors='ignore').read(4000)
    # The tag itself, not the word: the comment above each tag explains why the page is
    # noindexed, so a substring search for "noindex" passes even after the tag is deleted.
    # Found by deleting one on purpose and watching this check say everything was fine.
    if not re.search(r'<meta\s+name="robots"\s+content="[^"]*noindex', head, re.I):
        dormant_leaks.append((f, 'no noindex meta tag'))
    if os.path.exists(SITEMAP) and f[:-5] in open(SITEMAP, encoding='utf-8').read():
        dormant_leaks.append((f, 'listed in the sitemap'))

# ---------------------------------------------------------------- report ----
def section(title, n):
    print(f'\n=== {title}: {n}')

section('pages audited', len(urls))

section('broken links', sum(len(v) for v in broken_links.values()))
for f in sorted(broken_links):
    for h in sorted(set(broken_links[f])):
        print(f'   {f}  ->  {h}')

section('missing assets', sum(len(v) for v in broken_assets.values()))
for f in sorted(broken_assets):
    for a in sorted(set(broken_assets[f])):
        print(f'   {f}  ->  {a}')

section('hospitals named in a candidate context', len(hospitals))
for name in sorted(hospitals):
    fs = sorted(hospitals[name])
    print(f'   {name}  ({len(fs)} pages, e.g. {fs[0]})')

section('Health New Zealand named as our client', len(client_claims))
for f, s in client_claims[:20]:
    print(f'   {f}  ·  …{s}…')
section('pages still offering a printed guide', len(print_offers))
for f in print_offers[:20]:
    print('  ', f)

quote_bugs = [x for x in meta_issues if 'unescaped quote' in x[1]]
over_t = [x for x in meta_issues if 'title' in x[1] and 'quote' not in x[1]]
over_d = [x for x in meta_issues if 'description' in x[1] and 'quote' not in x[1]]
section('queued for deletion but still in use', len(doomed_used))
for item in doomed_used:
    print('  ', item)
section('dormant pages that leaked into the live site', len(dormant_leaks))
for f, why in dormant_leaks:
    print(f'   {f}  ·  {why}')
section('live pages nothing links to', len(unreachable))
for f in unreachable:
    print('  ', f)
section('paths named in scripts that do not exist', len(js_missing))
for jsf, p in sorted(set(js_missing)):
    print(f'   {jsf}  ->  {p}')
section('meta tags cut short by an unescaped quote', len(quote_bugs))
for f, _ in quote_bugs:
    print('  ', f)
section('over-long titles', len(over_t))
section('over-long or missing descriptions', len(over_d))

fatal = (sum(len(v) for v in broken_links.values()) + sum(len(v) for v in broken_assets.values())
         + len(print_offers) + len(hospitals) + len(quote_bugs) + len(js_missing) + len(client_claims) + len(doomed_used) + len(dormant_leaks))
print(f'\n{"PASS" if fatal == 0 else "ISSUES"} — {fatal} blocking problems')
sys.exit(0 if fatal == 0 else 1)
