#!/usr/bin/env python3
"""
Ethicare Resourcing — editorial audit.

tools/audit-links.py checks that the site is wired up correctly. This one
checks what the words actually say, across every page the sitemap lists:

  · banned words and the brochure tics ("honest", "genuinely", "simply",
    "no pressure", "truly") that the plain-English pass is removing;
  · statements written as though every reader were British;
  · New Zealand pages still calling the senior role "consultant";
  · sentences that start lower case, which is what a careless
    find-and-replace leaves behind;
  · stated reading times that do not match the page's word count;
  · "reviewed"/"checked" dates that have gone stale;
  · paragraphs repeated word for word on more than two pages, which
    means a fact has more than one home;
  · Australian pages that mention nursing;
  · punctuation damage: double spaces, space before a comma, an unclosed
    quote, "  ." and friends.

    python3 tools/audit-copy.py            # everything
    python3 tools/audit-copy.py banned uk  # named checks only
"""
import os, re, sys, html, datetime
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

TODAY = datetime.date.today()

urls = re.findall(r'<loc>https://ethicareresourcing\.com(/[^<]*)</loc>',
                  open('sitemap.xml', encoding='utf-8').read())


def file_for(url):
    if url == '/':
        return 'index.html'
    p = url.lstrip('/')
    for c in (p + '.html', p.rstrip('/') + '/index.html'):
        if os.path.exists(c):
            return c
    return None


def body(src):
    """Visible prose of <main>, tags and scripts stripped."""
    i, j = src.find('<main'), src.find('</main>')
    frag = src[i:j] if i >= 0 and j > i else src
    frag = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', frag, flags=re.S)
    frag = re.sub(r'<!--.*?-->', ' ', frag, flags=re.S)
    # Inline tags close up: "<a ...>New Zealand</a>." is "New Zealand.", not
    # "New Zealand .". Replacing every tag with a space invents punctuation
    # damage that is not on the page.
    frag = re.sub(r'</?(?:a|b|i|u|em|strong|span|small|sup|sub|code|abbr|mark|'
                  r'time|cite|q|var|kbd|s|del|ins|wbr|br)\b[^>]*>', '', frag)
    return re.sub(r'[ \t]+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', frag)))


pages = []
for u in urls:
    f = file_for(u)
    if f:
        pages.append((u, f, open(f, encoding='utf-8').read()))

findings = defaultdict(list)       # check -> [(url, detail)]
want = set(a.lower() for a in sys.argv[1:])
run = lambda name: (not want) or name in want


# ---------------------------------------------------------------- banned
# "simply", "honestly" and "truly" are ordinary English in the sense of
# "merely" or "to a high degree", and the site uses them that way almost
# everywhere. What is worth catching is self-praise and the reassurance
# tics, so the pattern looks for those constructions, not the bare words.
BANNED = re.compile(
    r'\b(seamless|world-class|cutting-edge|state-of-the-art|unlock\w*|'
    r'elevate|leverage|robust|bespoke|unrivalled|best-in-class)\b'
    r'|no pressure|no obligation|no hard sell|rest assured|look no further'
    r'|\b(we|our|ethicare)\b[^.<]{0,28}\b(honest|genuine|transparent)\b', re.I)

# ------------------------------------------------------------------- uk
UK_ANCHORED = re.compile(
    r'\b(unlike the NHS|than the NHS|as in the NHS|compared with the NHS|'
    r'than you(?:’|\')?re used to in the UK|than in the UK|'
    r'back in the UK|your UK (?:trust|hospital|department)|UK-style)\b', re.I)

# ------------------------------------------------------------------ smo
NZ_CONSULTANT = re.compile(
    r'consultant (posts?|presence|rota|grade|appointment|group)|'
    r'consultant-(delivered|led|light)', re.I)

# --------------------------------------------------------------- caselow
LOWER_START = re.compile(r'(?<=[.!?])\s+([a-z][a-z’\']{2,})')
LOWER_OK = {'iwi', 'te', 'whanau', 'wh', 'e', 'mm', 'cm', 'km', 'kg', 'ml',
            'pp', 'eg', 'ie', 'etc', 'via', 'per', 'www', 'http', 'https'}

# ------------------------------------------------------------------ punc
PUNCT = [(re.compile(r'[a-z] {2,}[A-Za-z]'), 'double space'),
         (re.compile(r'\s+,'), 'space before comma'),
         (re.compile(r'\s+\.(?=\s|$)'), 'space before full stop'),
         (re.compile(r'\.\s*\.(?!\.)'), 'double full stop'),
         (re.compile(r',\s*,'), 'double comma'),
         (re.compile(r'\b(a|an|the|and|or|of|to|in|for|with)\s+\1\b', re.I), 'repeated word')]


for url, f, src in pages:
    t = body(src)

    if run('banned'):
        for m in BANNED.finditer(t):
            findings['banned'].append((url, f'“{m.group(0)}” — …{t[max(0,m.start()-45):m.end()+45].strip()}…'))

    if run('uk'):
        for m in UK_ANCHORED.finditer(t):
            findings['uk'].append((url, f'…{t[max(0,m.start()-50):m.end()+50].strip()}…'))

    if run('smo') and 'new-zealand' in f:
        for m in NZ_CONSULTANT.finditer(t):
            findings['smo'].append((url, f'…{t[max(0,m.start()-50):m.end()+50].strip()}…'))

    if run('caselow'):
        for m in LOWER_START.finditer(t):
            w = m.group(1).lower()
            if w in LOWER_OK or re.search(r'\b(no|vol|fig|dr|mr|mrs|ms|st|approx)\.\s*$', t[:m.start()+1], re.I):
                continue
            findings['caselow'].append((url, f'…{t[max(0,m.start()-45):m.end()+25].strip()}…'))

    if run('nursing') and 'australia' in f and re.search(r'\bnurs(e|es|ing)\b', t, re.I):
        m = re.search(r'\bnurs(e|es|ing)\b', t, re.I)
        findings['nursing'].append((url, f'…{t[max(0,m.start()-50):m.end()+50].strip()}…'))

    if run('readtime'):
        m = re.search(r'Kettle on\.?\s*(?:A longer read\s*\u2014\s*)?about (\d+)\s*min', t, re.I)
        if m:
            claimed = int(m.group(1))
            ck = re.search(r'<section[^>]*id="checklist".*?</section>', src, re.S)
            reading = len(t.split()) - (len(body(ck.group(0)).split()) if ck else 0)
            actual = max(5, round(reading / 200))
            if abs(claimed - actual) > max(2, actual * .25):
                findings['readtime'].append((url, f'says {claimed} min, reading body is {reading} words (≈{actual} min)'))

    if run('dates'):
        # "reviewed 30 June 2026" is usually how a page dates a REGULATOR's own
        # list, not its own review. Only the site's own status wording counts.
        for m in re.finditer(r'(Checked|Last updated|Last reviewed|Updated|Reviewed)[^.<]{0,22}?'
                             r'(\d{1,2}\s+)?(January|February|March|April|May|June|July|August|'
                             r'September|October|November|December)\s+(\d{4})', t):
            mon = ['january','february','march','april','may','june','july','august',
                   'september','october','november','december'].index(m.group(3).lower()) + 1
            age = (TODAY.year - int(m.group(4))) * 12 + TODAY.month - mon
            # 17 Oct 2026: this was >= 4 months, and it hid 64 pages stamped
            # "July 2026" three months earlier — including every registration
            # guide. On a site making regulatory claims a quarter is already
            # long enough for a fee, a pathway or an English requirement to
            # have moved, so the threshold is two months.
            if age >= 2:
                findings['dates'].append((url, f'{m.group(0).strip()} — {age} months old'))

    if run('punc'):
        for rx, what in PUNCT:
            for m in rx.finditer(t):
                findings['punc'].append((url, f'{what}: …{t[max(0,m.start()-40):m.end()+40].strip()}…'))


# ------------------------------------------------------------ duplicates
if run('dupes'):
    seen = defaultdict(set)
    for url, f, src in pages:
        for s in re.split(r'(?<=[.!?])\s+', body(src)):
            s = s.strip()
            if len(s.split()) >= 18:
                seen[s].add(url)
    # The site deliberately repeats its signposts — "anything national lives
    # once in Moving to New Zealand" and the like — so a repeated sentence is
    # usually the one-fact-one-home pattern working as intended. What is worth
    # flagging is a repeated sentence carrying a FIGURE: a number maintained in
    # five places gets updated in one and goes stale in the other four.
    FIGURE = re.compile(r'(?:NZ\$|AU\$|£|\$)\s?\d|'
                        r'\b\d[\d,.]*\s*(?:%|per cent|weeks?|months?|days?|'
                        r'hours?|years?|working days)\b')
    for s, us in seen.items():
        if len(us) > 2 and FIGURE.search(s):
            findings['dupes'].append((f'{len(us)} pages', s[:150] + ('…' if len(s) > 150 else '')))


# ------------------------------------------------------------- figures
# A maintenance register rather than a fault list. Any money figure that
# appears on three or more pages has to be found and changed in all of them
# the day it moves; this prints where each one lives so none is missed.
if run('figures'):
    money = defaultdict(set)
    for url, f, src in pages:
        for m in re.finditer(r'(?:NZ\$|AU\$|\$|£)\s?\d{2,3}(?:,\d{3})+', body(src)):
            money[m.group(0).replace(' ', '')].add(url)
    for fig, us in sorted(money.items(), key=lambda kv: -len(kv[1])):
        if len(us) > 2:
            findings['figures'].append((f'{fig} — {len(us)} pages', ', '.join(sorted(us))))


ORDER = ['banned', 'uk', 'smo', 'caselow', 'nursing', 'readtime', 'dates', 'punc', 'dupes', 'figures']
TITLES = {'banned': 'Banned words and brochure tics',
          'uk': 'Written as though every reader were British',
          'smo': 'New Zealand pages still saying "consultant"',
          'caselow': 'Sentence starting lower case',
          'nursing': 'Australian page mentioning nursing',
          'readtime': 'Stated reading time does not match the page',
          'dates': 'Stale reviewed/checked date',
          'punc': 'Punctuation damage',
          'dupes': 'Same figure, same sentence, three or more pages',
          'figures': 'Money figures to keep in step (maintenance register)'}

total = 0
for k in ORDER:
    if not run(k):
        continue
    rows = findings[k]
    total += len(rows)
    print(f'\n=== {TITLES[k]}: {len(rows)}')
    for where, detail in rows[:60]:
        print(f'  {where}\n      {detail}')
    if len(rows) > 60:
        print(f'  …and {len(rows)-60} more')

print(f'\n{len(pages)} pages checked, {total} things to look at.')
