#!/usr/bin/env python3
"""
Ethicare Resourcing — point every guide link at the PDF that now exists.

The site used to end each chapter with "Prefer it on paper? Request the printed
guide", and each guide's own nav bar with a "Request printed guide" button. We
are not printing guides — that was settled on sustainability grounds — so both
now offer the PDF instead. The /request-a-guide URL still works and is now the
downloads index, because 659 pages and any number of shared links point at it.

Every rewrite is checked against a PDF that is actually on disk: a slug with no
PDF stops the run rather than shipping a dead download link.

    python3 tools/link-guides-to-pdfs.py --check    report, change nothing
    python3 tools/link-guides-to-pdfs.py            rewrite
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
STALE = {l.strip() for l in open('/tmp/claude-0/stale-dirs.txt')} if os.path.exists('/tmp/claude-0/stale-dirs.txt') else set()

# The ?guide= values used in links are place slugs; the PDFs are named for the
# guide. Two nationals are spelled differently, the rest follow one rule.
# Two states end in "-australia" themselves, so they are named here rather than
# having the suffix stripped off into "south-relocation-guide".
SPECIAL = {
    'new-zealand-national': 'moving-to-new-zealand',
    'australia-national':   'moving-to-australia',
    'south-australia':      'south-australia-relocation-guide',
    'western-australia':    'western-australia-relocation-guide',
}

def pdf_for(slug):
    if slug in SPECIAL:
        return SPECIAL[slug]
    base = re.sub(r'-(new-zealand|australia)$', '', slug)
    return f'{base}-relocation-guide'

def exists(pdf):
    return os.path.exists(os.path.join(ROOT, 'assets', 'downloads', pdf + '.pdf'))

# ---------------------------------------------------------------- the rewrites
CHAPTER_FOOT = re.compile(
    r'<p class="ch-print"><a href="/request-a-guide\?guide=([a-z0-9-]+)">'
    r'Prefer it on paper\? Request the printed guide &rarr;</a></p>')

NAV_BUTTON = re.compile(
    r'(<a href=")/request-a-guide\?guide=([a-z0-9-]+)("[^>]*>)Request printed guide(</a>)')

def main():
    check = '--check' in sys.argv
    missing, touched, counts = set(), [], {'foot': 0, 'nav': 0, 'other': 0}

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d != '.git']
        parts = os.path.relpath(dirpath, ROOT).split(os.sep)
        if parts[0] == 'destinations' and len(parts) > 1 and parts[1] in STALE:
            continue
        if parts[:2] == ['assets', 'downloads']:
            continue
        for fn in filenames:
            if not fn.endswith('.html'):
                continue
            p = os.path.join(dirpath, fn)
            src = open(p, encoding='utf-8').read()
            if '/request-a-guide' not in src:
                continue
            out, n_foot, n_nav = src, 0, 0

            def foot(m):
                nonlocal n_foot
                pdf = pdf_for(m.group(1))
                if not exists(pdf):
                    missing.add((m.group(1), pdf)); return m.group(0)
                n_foot += 1
                return (f'<p class="ch-print"><a href="/assets/downloads/{pdf}.pdf" download>'
                        f'Download this guide as a PDF &rarr;</a></p>')

            def nav(m):
                nonlocal n_nav
                pdf = pdf_for(m.group(2))
                if not exists(pdf):
                    missing.add((m.group(2), pdf)); return m.group(0)
                n_nav += 1
                return f'{m.group(1)}/assets/downloads/{pdf}.pdf{m.group(3)}Download PDF{m.group(4)}'

            out = CHAPTER_FOOT.sub(foot, out)
            out = NAV_BUTTON.sub(nav, out)

            if out != src:
                counts['foot'] += n_foot
                counts['nav'] += n_nav
                touched.append((os.path.relpath(p, ROOT), n_foot, n_nav))
                if not check:
                    open(p, 'w', encoding='utf-8').write(out)

    if missing:
        print('NO PDF for these guide slugs — nothing was written:')
        for slug, pdf in sorted(missing):
            print(f'  ?guide={slug}  ->  assets/downloads/{pdf}.pdf')
        sys.exit(1)

    print(f"{len(touched)} files  ·  {counts['foot']} chapter footers  ·  {counts['nav']} nav buttons"
          + ('   (check only, nothing written)' if check else ''))

if __name__ == '__main__':
    main()
