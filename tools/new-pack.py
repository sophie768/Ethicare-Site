#!/usr/bin/env python3
"""Make a new My Move space for one candidate.

    python3 tools/new-pack.py "Clint" "Varghese" nz
    python3 tools/new-pack.py "Thandi" "Mokoena" au

Copies the worked example for that country to pack/<firstname>-<surname>-<6 random>.html,
mints the space's store key, writes both into the page's PACK object, and prints the link
to send. Everything else — the letter, travel, the chosen guides — you then rewrite in that
one file (see pack/README.md).

Why a tool for a copy: the slug and the key are the security. A slug someone could guess
is an open door, and a key reused from another pack would put two candidates in one space.
Random ones, generated here, never typed. Never change a key once the link has been sent —
their saved space is under it.
"""
import re
import secrets
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLE = {"nz": "clint-varghese-9f2c.html", "au": "thandi-mokoena-4k7d.html"}


def slugify(s):
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "candidate"


def main():
    if len(sys.argv) != 4 or sys.argv[3] not in EXAMPLE:
        print(__doc__)
        sys.exit(2)
    first, surname, country = sys.argv[1], sys.argv[2], sys.argv[3]
    slug = f"{slugify(first)}-{slugify(surname)}-{secrets.token_hex(3)}"
    key = secrets.token_urlsafe(24)   # 32 characters, URL-safe, ~192 bits
    src = ROOT / "pack" / EXAMPLE[country]
    dst = ROOT / "pack" / f"{slug}.html"
    if dst.exists():
        sys.exit(f"{dst} already exists — run again")
    html = src.read_text(encoding="utf-8")

    html = re.sub(r"slug: '[^']*'", f"slug: '{slug}'", html, count=1)
    html = re.sub(r"first: '[^']*'", f"first: '{first.strip()}'", html, count=1)
    # the store key: replace the example's, or add one after spaceLabel if it has none
    if re.search(r"^\s*key: '[^']*',", html, re.M):
        html = re.sub(r"key: '[^']*'", f"key: '{key}'", html, count=1)
    else:
        html = html.replace(
            "  spaceLabel: 'Candidate space',",
            "  spaceLabel: 'Candidate space',\n"
            "  /* The store key: this space is saved with us, keyed to it. Minted by tools/new-pack.py;\n"
            "     never reuse one, never change it (their saved space is under it). */\n"
            f"  key: '{key}',", 1)
        html = html.replace('<body data-strip-intro=', '<body data-strip-foot="Saved to your space, and on this device." data-strip-intro=', 1)
    # a copy of the worked example must not carry its demo band
    html = re.sub(r"^\s*demo: [^\n]*\n", "", html, flags=re.M)
    html = html.replace("<title>Example · ", "<title>")

    dst.write_text(html, encoding="utf-8")
    print(f"made   pack/{dst.name}")
    print(f"link   https://ethicareresourcing.com/pack/{slug}")
    print(f"key    {key}   (already in the file; this is the my_move row's key in Supabase)")
    print()
    print("Now rewrite the PACK object at the foot of that file — headings, letter, facts, travel,")
    print("guides, suggested, files — then commit. The link works as soon as the deploy is live.")


if __name__ == "__main__":
    main()
