#!/usr/bin/env python3
"""Rewrite every page's site header from _header.html.

    python3 sync-header.py --check     report what would change, write nothing
    python3 sync-header.py             write it

The header is inline in each page on purpose (crawlable, works with JS off), so
it has to be copied rather than included. Before this script existed it was
copied by hand, and 859 pages had drifted into 17 different versions of the same
nav — including six that advertised Australian professions we redirect away, and
56 whose Ethicare logo linked to /destinations/ instead of home.

What is preserved from each page: its aria-current key, and nothing else. A page
that marks no nav item keeps marking none. Everything else in the block comes
from the fragment, so a nav change is a one-line edit there plus a re-run.
"""
import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
FRAGMENT = ROOT / "_header.html"

# Directories whose HTML is not a site page: build inputs, downloadable
# documents, private candidate packs and design prototypes.
SKIP_DIRS = ("assets", "_forms", "prototypes", "pack", "netlify", "node_modules")

HEADER_RE = re.compile(r"<header class=\"site-header\"[^>]*>.*?</header>", re.S)
CURRENT_RE = re.compile(r"<a\s[^>]*?href=\"([^\"]+)\"[^>]*?\saria-current=\"page\"", re.S)
CUR_TOKEN_RE = re.compile(r"\{\{CUR:([^}]*)\}\}")


def canonical_template() -> str:
    """The fragment with its authoring comment stripped — comments never ship."""
    text = FRAGMENT.read_text(encoding="utf-8")
    # Strip the authoring comment first. It documents the markup and therefore
    # quotes the opening tag, so searching the raw file finds the quotation
    # rather than the element — which is exactly the bug this line prevents.
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    start = text.find("<header class=\"site-header\"")
    if start < 0:
        sys.exit("_header.html has no <header class=\"site-header\"> element")
    # No trailing newline: HEADER_RE matches up to </header> exactly, so a
    # trailing newline here would make the block never compare equal and the
    # sync would add one more blank line on every run.
    return text[start:].strip()


def render(template: str, current: str | None) -> str:
    """Expand {{CUR:…}}: the one token matching `current` becomes aria-current."""
    matched = False

    def sub(m: re.Match) -> str:
        nonlocal matched
        if current is not None and m.group(1) == current and not matched:
            matched = True
            return ' aria-current="page"'
        return ""

    out = CUR_TOKEN_RE.sub(sub, template)
    # A key that is not a top-level item (e.g. /insights, which only appears in
    # the About sub-menu) has no token. Mark the first plain link to it instead,
    # so those pages keep the highlight they already had.
    if current is not None and not matched:
        needle = f'<a href="{current}">'
        i = out.find(needle)
        if i >= 0:
            out = out[:i] + f'<a href="{current}" aria-current="page">' + out[i + len(needle):]
    return out


def pages():
    for p in sorted(ROOT.rglob("*.html")):
        rel = p.relative_to(ROOT)
        if rel.name == "_header.html" or rel.parts[0] in SKIP_DIRS:
            continue
        yield p, rel


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report only, write nothing")
    args = ap.parse_args()

    template = canonical_template()
    changed, same, skipped = [], 0, []

    for path, rel in pages():
        text = path.read_text(encoding="utf-8", errors="replace")
        m = HEADER_RE.search(text)
        if not m:
            skipped.append(str(rel))
            continue
        found = CURRENT_RE.search(m.group(0))
        header = render(template, found.group(1) if found else None)
        if header == m.group(0):
            same += 1
            continue
        changed.append(str(rel))
        if not args.check:
            path.write_text(text[:m.start()] + header + text[m.end():], encoding="utf-8")

    verb = "would be rewritten" if args.check else "rewritten"
    print(f"{len(changed)} {verb}, {same} already current, {len(skipped)} without a header")
    for s in skipped:
        print(f"   no header: {s}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
