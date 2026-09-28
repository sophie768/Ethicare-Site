#!/usr/bin/env python3
"""
Ethicare Resourcing — point the registration guide and checklist links at the
pages that hold them.

Fifty-five links across the site offered a registration guide or checklist as a
PDF download. None of those PDFs exist, and none should: each guide page says so
itself — "a checklist built into the page so nothing you tick goes out of date" —
and the pages are titled "… registration guide and checklist". The downloads
were a reference to something the site deliberately decided not to produce.

So the links now go to the page, and the checklist links to its #checklist
anchor. Wording that promised a file ("Registration guide (PDF)", "Download
PDF") is corrected in the same pass, because a link that says PDF and opens a
web page is the same broken promise in a quieter voice.

    python3 tools/fix-registration-links.py --check
    python3 tools/fix-registration-links.py
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
STALE = {l.strip() for l in open('/tmp/claude-0/stale-dirs.txt')} if os.path.exists('/tmp/claude-0/stale-dirs.txt') else set()

NZ_REG = '/guides/new-zealand-registration-'
AU_REG = '/guides/australia-registration-'

TARGET = {
    'ethicare-mrtb-registration-guide':                        NZ_REG + 'mrtb',
    'ethicare-mrtb-registration-checklist':                    NZ_REG + 'mrtb#checklist',
    'ethicare-pbnz-registration-guide':                        NZ_REG + 'pbnz',
    'ethicare-pbnz-registration-checklist':                    NZ_REG + 'pbnz#checklist',
    'ethicare-psychologist-nzpb-registration-guide':           NZ_REG + 'nzpb',
    'ethicare-psychologist-nzpb-registration-checklist':       NZ_REG + 'nzpb#checklist',
    'Occupational_Therapy_OTBNZ_Registration_Guide':           NZ_REG + 'otbnz',
    'Occupational_Therapy_OTBNZ_Registration_Checklist':       NZ_REG + 'otbnz#checklist',
    'Anaesthetic_Technician_MSCNZ_Registration_Guide':         NZ_REG + 'mscnz',
    'Anaesthetic_Technician_MSCNZ_Registration_Checklist':     NZ_REG + 'mscnz#checklist',
    # GPs and radiologists both register with the Medical Council, so both point
    # at the one MCNZ guide rather than at two files that never existed.
    'GP_MCNZ_Registration_Guide':                              NZ_REG + 'mcnz',
    'GP_MCNZ_Registration_Checklist':                          NZ_REG + 'mcnz#checklist',
    'Radiologist_MCNZ_Registration_Guide':                     NZ_REG + 'mcnz',
    'Radiologist_MCNZ_Registration_Checklist':                 NZ_REG + 'mcnz#checklist',
    # The three MRPBA professions share one Board and one guide.
    'ethicare-radiographer-australia-registration-guide':      AU_REG + 'mrpba',
    'ethicare-radiographer-australia-registration-checklist':  AU_REG + 'mrpba#checklist',
    'ethicare-radiation-therapist-australia-registration-guide':     AU_REG + 'mrpba',
    'ethicare-radiation-therapist-australia-registration-checklist': AU_REG + 'mrpba#checklist',
    'ethicare-nuclear-medicine-australia-registration-guide':        AU_REG + 'mrpba',
    'ethicare-nuclear-medicine-australia-registration-checklist':    AU_REG + 'mrpba#checklist',
    # Sonographers are accredited rather than registered — ASMIRT and ASAR.
    'ethicare-sonographer-australia-accreditation-guide':      AU_REG + 'asar',
}

# The interview guide is a page too, and there is one per country.
INTERVIEW = 'ethicare-interview-preparation-guide'

# Wording that promised a file.
LABELS = [
    ('Registration guide (PDF)',   'Registration guide'),
    ('Registration checklist (PDF)', 'Registration checklist'),
    ('Download PDF <span class="lime">&darr;</span>', 'Open the guide <span class="lime">&rarr;</span>'),
    ('Download PDF <span class="lime">↓</span>', 'Open the guide <span class="lime">→</span>'),
]

HREF = re.compile(r'href="\.{0,2}/?assets/downloads/([A-Za-z0-9_-]+)\.pdf"')


def main():
    check = '--check' in sys.argv
    touched, links, unknown = [], 0, set()

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
            rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
            src = open(p, encoding='utf-8').read()
            if '/assets/downloads/' not in src and 'assets/downloads/' not in src:
                continue
            n = 0

            def sub(m):
                nonlocal n
                stem = m.group(1)
                if stem == INTERVIEW:
                    # An "interview guide" link on an Australian page means the
                    # Australian one; everywhere else, New Zealand.
                    au = 'australia' in rel or rel.startswith('jobs/') and 'australia' in rel
                    dest = '/guides/australia-interview' if au else '/guides/new-zealand-interview'
                elif stem in TARGET:
                    dest = TARGET[stem]
                else:
                    if not os.path.exists(os.path.join(ROOT, 'assets/downloads', stem + '.pdf')):
                        unknown.add(stem)
                    return m.group(0)
                # A link from a page to itself is not a link; it is removed by
                # the caller, so leave it alone here and report it.
                n += 1
                return f'href="{dest}"'

            out = HREF.sub(sub, src)
            for old, new in LABELS:
                if old in out:
                    out = out.replace(old, new)
            if out != src:
                links += n
                touched.append((rel, n))
                if not check:
                    open(p, 'w', encoding='utf-8').write(out)

    if unknown:
        print('Still pointing at files that do not exist:')
        for u in sorted(unknown):
            print('  ', u)
    for f, n in sorted(touched):
        print(f'{n:>3}  {f}')
    print(f"\n{len(touched)} files, {links} links" + ('   (check only)' if check else ''))
    return 1 if unknown else 0


if __name__ == '__main__':
    sys.exit(main())
