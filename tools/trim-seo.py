#!/usr/bin/env python3
"""
Ethicare Resourcing — bring page titles and meta descriptions inside the length
Google will actually show.

Titles: a search result gives a title about sixty characters before it is cut
off mid-word. Almost every title here ends "· Ethicare Resourcing", which spends
twenty-two of them on the brand, so the suffix becomes "· Ethicare" and the rest
is the page's subject. Where the subject itself is a heading plus a descriptive
subtitle — "Healthcare in Christchurch: hospitals, tertiary care and everyday
medicine" — the subtitle is dropped from the title and left to the description,
which is where it is read anyway.

Descriptions: Google shows roughly 160 characters and truncates the rest, so a
170-character description loses almost nothing and is left alone. Only the ones
past 180 are cut, and then to whole sentences within 160 — never mid-word, never
mid-clause. One that cannot be cut cleanly is left alone and reported, because a
mangled sentence is worse than a long one.

The <title>, og:title, twitter:title, og:description, twitter:description and
the SEO comment at the foot of each page are all kept in step.

    python3 tools/trim-seo.py --check     report, change nothing
    python3 tools/trim-seo.py             apply
"""
import os, re, sys, html

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

TITLE_MAX, DESC_MAX = 60, 160
DESC_TRIM_OVER = 180     # below this, truncation in the result costs nothing
BRAND = ' · Ethicare'

BRAND_RE = re.compile(r'\s*[·|]\s*Ethicare(\s+Resourcing)?\s*$')
# The subtitle separator: a colon, a pipe or an em/en dash with spaces round it.
SPLIT_RE = re.compile(r'\s*(?::|\||—|–)\s+')


def shorten_title(t):
    stem = t
    for _ in range(3):                      # one page carries the brand twice
        stem2 = BRAND_RE.sub('', stem)
        if stem2 == stem:
            break
        stem = stem2
    stem = stem.strip()
    if len(stem) + len(BRAND) > TITLE_MAX:
        head = SPLIT_RE.split(stem)[0].strip()
        if head and len(head) + len(BRAND) <= TITLE_MAX:
            stem = head
        elif head:
            stem = head                     # still long, but honest and unmangled
    return stem + BRAND


def shorten_desc(d):
    d = d.strip()
    if len(d) <= DESC_MAX:
        return d
    # whole sentences first
    out = ''
    for part in re.split(r'(?<=[.!?])\s+', d):
        if not out:
            out = part
        elif len(out) + 1 + len(part) <= DESC_MAX:
            out = out + ' ' + part
        else:
            break
    if len(out) <= DESC_MAX:
        return out.strip()
    # one very long sentence: cut at the last clause boundary that fits
    for sep in ('—', '–', ';', ',', ' and ', ' · '):
        idx = out.rfind(sep, 0, DESC_MAX)
        if idx > DESC_MAX // 2:
            return out[:idx].rstrip(' ,;—–').strip()
    return None                              # nothing clean; leave it be


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


check = '--check' in sys.argv
urls = re.findall(r'<loc>https://ethicareresourcing\.com(/[^<]*)</loc>', open('sitemap.xml').read())


def file_for(u):
    if u == '/':
        return 'index.html'
    p = u.lstrip('/')
    for c in (p + '.html', p.rstrip('/') + '/index.html'):
        if os.path.exists(c):
            return c


changed_t = changed_d = 0
files = set()
unfixable = []
samples = []

for u in urls:
    f = file_for(u)
    if not f:
        continue
    src = open(f, encoding='utf-8').read()
    out = src

    m = re.search(r'<title>([^<]*)</title>', out)
    if m:
        old = html.unescape(m.group(1))
        if len(old) > TITLE_MAX:
            new = shorten_title(old)
            if new != old:
                out = out.replace(f'<title>{m.group(1)}</title>', f'<title>{esc(new)}</title>')
                for prop in ('og:title', 'twitter:title'):
                    out = re.sub(rf'(<meta (?:name|property)="{prop}" content=")[^"]*(")',
                                 lambda mm: mm.group(1) + esc(new) + mm.group(2), out)
                out = re.sub(r'(\n  SEO Title: )[^\n]*', lambda mm: mm.group(1) + new, out)
                changed_t += 1
                if len(samples) < 12:
                    samples.append(('T', f, old, new))

    m = re.search(r'<meta name="description" content="([^"]*)"', out)
    if m:
        old = html.unescape(m.group(1))
        if len(old) > DESC_TRIM_OVER:
            new = shorten_desc(old)
            if new is None:
                unfixable.append((f, len(old)))
            elif new != old:
                for prop in ('description', 'og:description', 'twitter:description'):
                    out = re.sub(rf'(<meta (?:name|property)="{prop}" content=")[^"]*(")',
                                 lambda mm: mm.group(1) + esc(new) + mm.group(2), out)
                out = re.sub(r'(\n  Meta Description: )[^\n]*', lambda mm: mm.group(1) + new, out)
                changed_d += 1
                if len(samples) < 12:
                    samples.append(('D', f, old, new))

    if out != src:
        files.add(f)
        if not check:
            open(f, 'w', encoding='utf-8').write(out)

print(f'{len(files)} files  ·  {changed_t} titles  ·  {changed_d} descriptions'
      + ('   (check only, nothing written)' if check else ''))
if unfixable:
    print(f'\n{len(unfixable)} descriptions could not be cut cleanly and were left alone:')
    for f, n in unfixable:
        print(f'   {n:>4}  {f}')
print('\nsamples:')
for kind, f, old, new in samples:
    print(f'  [{kind}] {f}')
    print(f'      {len(old):>3}  {old[:120]}')
    print(f'   -> {len(new):>3}  {new[:120]}')
