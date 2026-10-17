#!/usr/bin/env python3
"""
Ethicare Resourcing — provider directory builder.

Renders the "companies to consider" block from tools/provider-data.json into
every page that data file lists, between two markers:

    <!-- PROVIDER-DIRECTORY:START -->  ... generated ...  <!-- PROVIDER-DIRECTORY:END -->

Run it after any edit to provider-data.json:

    python3 -I tools/build-provider-directory.py

Why the markup is generated into the HTML rather than rendered by JavaScript:
every company name and every evidence line is content, and this site keeps its
content in its pages. The script only toggles which pane is visible.

Why the evidence line is not optional: the whole claim this block makes to a
candidate is "we checked one narrow thing and here it is". An entry without
'evidence' is a recommendation we have not earned, so the build refuses it.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)

DATA = json.load(open('tools/provider-data.json', encoding='utf-8'))
START, END = '<!-- PROVIDER-DIRECTORY:START -->', '<!-- PROVIDER-DIRECTORY:END -->'


def esc(s):
    """Escape only what must be escaped. Entities already in the data stay."""
    return s.replace('&', '&amp;').replace('&amp;#', '&#').replace('&amp;nd', '&nd') \
            .replace('&amp;md', '&md').replace('&amp;rs', '&rs').replace('&amp;ls', '&ls') \
            .replace('&amp;amp;', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def monogram(name):
    """Initials for the logo tile when no logo file exists."""
    skip = {'the', 'of', 'and', 'international', 'worldwide', 'my', 'on', 'to'}
    words = [w for w in re.findall(r"[A-Za-z]+", name) if w.lower() not in skip]
    return ''.join(w[0].upper() for w in words[:2]) or name[:2].upper()


def logo_cell(e):
    path = e.get('logo')
    if path and os.path.exists(path):
        return ('<span class="svc-logo"><img src="/%s" alt="" width="60" height="36" '
                'loading="lazy" decoding="async"></span>' % path)
    return '<span class="svc-logo" aria-hidden="true"><span class="svc-mono">%s</span></span>' % monogram(e['name'])


def company(e):
    if not e.get('evidence'):
        sys.exit('REFUSED: "%s" has no evidence line. Check the company\'s own site '
                 'and write what you found, or remove the entry.' % e['name'])
    return (
        '          <li class="svc-co">\n'
        '            %s\n'
        '            <div>\n'
        '              <a class="svc-n" href="%s" target="_blank" rel="noopener">%s</a>\n'
        '              <p class="svc-d">%s</p>\n'
        '              <span class="svc-ev">%s Checked %s.</span>\n'
        '            </div>\n'
        '          </li>\n'
    ) % (logo_cell(e), esc(e['url']), esc(e['name']), e['desc'], e['evidence'], e['checked'])


def group_block(gkey, items, origin_known, dest):
    g = DATA['groups'][gkey]
    head = ('      <div class="svc-group">\n'
            '        <div class="svc-gh"><svg class="ic" width="26" height="26" aria-hidden="true" '
            'focusable="false"><use href="#%s"/></svg><h3>%s</h3></div>\n') % (g['icon'], g['title'])
    if items:
        return head + ('        <p class="svc-note">%s</p>\n        <ul class="svc-list">\n%s        </ul>\n      </div>\n'
                       % (g['note'], ''.join(company(e) for e in items)))
    text = (DATA['absent'][gkey] if origin_known else DATA['pending'])
    text = text.replace('{DEST}', dest['label']).replace('{AUTH}', dest['authority'])
    return head + '        <p class="svc-pending">%s</p>\n      </div>\n' % text


def footer(groups, dest):
    base = ('Options to compare, not recommendations. Ethicare takes no fee if you book with any of them. '
            'The line under each name is all we checked &mdash; read reviews yourself and get three quotes.')
    if 'pets' in groups:
        base += (' The rules that decide whether your pet can travel are '
                 '<a href="%s" target="_blank" rel="noopener">%s&rsquo;s, not the company&rsquo;s</a>.') \
                % (dest['authorityUrl'], dest['authority'])
    else:
        base += ' Compare the whole journey &mdash; collection, customs, delivery, insurance.'
    return '      <p class="svc-foot">%s</p>\n' % base


def build(page):
    dest = DATA['destinations'][page['dest']]
    groups = page['groups']
    pets = groups == ['pets']
    rows = [e for e in DATA['entries'] if e['dest'] == page['dest']]
    known = {e['origin'] for e in rows}

    opts, panes = [], ''
    for o in DATA['origins']:
        sel = ' selected' if o['code'] == DATA['origins'][0]['code'] else ''
        opts.append('            <option value="%s"%s>%s</option>' % (o['code'], sel, o['label']))
        inner = ''.join(
            group_block(g, [e for e in rows if e['origin'] == o['code'] and e['group'] == g],
                        o['code'] in known, dest)
            for g in groups)
        panes += '      <div class="svc-pane" data-pane="%s"%s>\n%s%s      </div>\n' % (
            o['code'], '' if not sel == '' else '', inner, footer(groups, dest))
    # first pane visible, rest hidden
    panes = re.sub(r'<div class="svc-pane" data-pane="(?!%s")' % DATA['origins'][0]['code'],
                   lambda m: m.group(0).replace('<div class="svc-pane"', '<div hidden class="svc-pane"'), panes)

    return (
        '%s\n<section class="section svc-dir" id="services" style="background:var(--warm);">\n'
        '  <div class="wrap reading">\n'
        '    <span class="eyebrow">Companies to consider</span>\n'
        '    <h2>%s</h2>\n'
        '    <p class="lead">A starting point for your own research. Choose where you are moving from and '
        'you will see companies that publish %s on that route.</p>\n\n'
        '    <div class="svc-pick">\n'
        '      <div class="svc-f">\n        <label for="svc-from">Moving from</label>\n'
        '        <select id="svc-from">\n%s\n        </select>\n      </div>\n'
        '      <div class="svc-f">\n        <span class="svc-lab">Moving to</span>\n'
        '        <div class="svc-fixed">%s</div>\n      </div>\n    </div>\n\n%s  </div>\n</section>\n'
        '<script>(function(){var d=document.querySelector(".svc-dir");if(!d)return;'
        'var s=d.querySelector("#svc-from");s.addEventListener("change",function(){'
        'd.querySelectorAll(".svc-pane").forEach(function(p){p.hidden=p.getAttribute("data-pane")!==s.value;});});})();</script>\n%s'
    ) % (START,
         'Who can fly your pet' if pets else 'Who can move your belongings',
         'a pet service' if pets else 'a service',
         '\n'.join(opts), dest['label'], panes, END)


changed = 0
for page in DATA['pages']:
    f = page['file']
    src = open(f, encoding='utf-8').read()
    block = build(page)

    if START in src and END in src:
        out = src[:src.index(START)] + block + src[src.index(END) + len(END):]
    else:
        # First run: place it after the first full section inside <main>.
        i = src.find('<main')
        j = src.find('</section>', src.find('<section', i)) + len('</section>')
        out = src[:j] + '\n' + block + src[j:]

    if 'provider-directory.css' not in out:
        out = out.replace('</head>', '  <link rel="stylesheet" href="../../provider-directory.css">\n</head>', 1)

    if out != src:
        open(f, 'w', encoding='utf-8').write(out)
        changed += 1
    n = sum(1 for e in DATA['entries'] if e['dest'] == page['dest'] and e['group'] in page['groups'])
    print('  %-46s %2d companies' % (f, n))

print('\n%d pages rewritten. %d companies listed, %d names deliberately excluded.'
      % (changed, len(DATA['entries']), len(DATA['excluded'])))
