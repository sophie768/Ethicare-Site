#!/usr/bin/env python3
"""Keep the six questions worded the same way everywhere.

    python3 tools/sync-questions.py --check    report drift, write nothing
    python3 tools/sync-questions.py            fix it

questions.json decides the wording, the destination and the call to action.
This script does three things with that file:

  1. rewrites the question block on the homepage and on /move, so both
     surfaces ask all six in the same words and send you to the same page;
  2. replaces any known variant wording anywhere else on the site
     ("Can I register?" -> "Can I work there?", and the rest of the map in
     questions.json);
  3. fails --check if a question is followed by a link that does not match
     its canonical destination, because the same question pointing at two
     different pages is the harder half of this bug and the half nobody
     notices by reading.

Why this exists: the homepage asked six questions, /move answered four, and
exactly one of them was worded identically on both. "Could we afford it?"
against "Can we afford it?" is a single word, which is worse than being
plainly different -- it reads as though nobody checked. "Where could we
live?" matched word for word and still pointed at two different pages
depending on which surface you came from.

Numbered references are the other half. Anything that says "question three"
breaks the moment the set changes, and the set has already changed once, so
this script also reports them and they get named instead of numbered.
"""
import argparse
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "questions.json").read_text(encoding="utf-8"))
QS = DATA["questions"]
VARIANTS = DATA["variants"]

SKIP_DIRS = ("assets", "_forms", "prototypes", "pack", "netlify", "node_modules", "tools", ".git")
# Superseded pages that are already queued for deletion — see DELETE-THESE.md.
SKIP_FILES = ("new-zealand-redesign.html", "home-router.html")

# A page that is a superseded export is title-cased; live pages are lower-case.
def pages():
    for p in sorted(ROOT.rglob("*.html")):
        rel = p.relative_to(ROOT)
        if rel.parts[0] in SKIP_DIRS:
            continue
        if re.search(r"[A-Z]", p.name) or p.name in SKIP_FILES:
            continue
        yield p, rel


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def home_block():
    """The homepage cards: <a class="act"> with a question, a blurb and a CTA."""
    out = []
    for q in QS:
        out.append(
            f'      <a class="act" href="{q["href"]}">'
            f'<span class="q">{esc(q["q"])}</span>'
            f'<span class="sub2">{esc(q["sub"])}</span>'
            f'<span class="go">{esc(q["cta"])} <i aria-hidden="true">&rarr;</i></span></a>'
        )
    return "\n".join(out)


def move_block():
    """The /move cards: numbered, with the longer blurb, and the plan question
    pointed at the library because on /move the planner is the page you are on."""
    out = []
    for i, q in enumerate(QS, 1):
        href = q.get("href_move", q["href"])
        cta = q.get("cta_move", q["cta"])
        out.append(
            f'      <a class="pt-q" href="{href}">'
            f'<span class="n">{i:02d}</span>'
            f'<h3>{esc(q["q"])}</h3>'
            f'<p>{esc(q["sub_long"])}</p>'
            f'<span class="go">{esc(cta)} <i aria-hidden="true">&rarr;</i></span></a>'
        )
    return "\n".join(out)


NUMBERED = re.compile(r"\b[Qq]uestion (one|two|three|four|five|six|\d)\b")

# "Can I work here?" is the journey band's own stage-four label, not drift.
# It means something "Can I work there?" does not: the band only ever appears
# inside one country's guide set, so "here" is that country, and the label
# leads to that country's registration guide rather than to the pathway
# checker. The two strings never meet on a page. Outside a journey band,
# though, "Can I work here?" IS drift, so it is reported.
HERE = "Can I work here?"
BAND = re.compile(r'<nav class="journey-band"[\s\S]*?</nav>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    changed = {}
    variant_hits = []
    numbered_hits = []
    href_problems = []

    for path, rel in pages():
        src = path.read_text(encoding="utf-8")
        out = src

        # ---- 1. the two question blocks ---------------------------------
        if rel.as_posix() == "index.html":
            out = re.sub(
                r'(<div class="acts">\n)[\s\S]*?(\n    </div>)',
                lambda m: m.group(1) + home_block() + m.group(2), out, count=1)
            out = out.replace(
                "Six honest questions, and a tool for each",
                "Six honest questions, and a tool for each")
        if rel.as_posix() == "move.html":
            out = re.sub(
                r'(<div class="pt-q4">\n)[\s\S]*?(\n    </div>)',
                lambda m: m.group(1) + move_block() + m.group(2), out, count=1)
            out = out.replace(
                "<h2 style=\"max-width:24ch\">Four questions your plan helps you answer.</h2>",
                "<h2 style=\"max-width:24ch\">Six questions your plan helps you answer.</h2>")
            out = out.replace(
                "<!-- The four questions a move actually turns on.",
                "<!-- The six questions a move actually turns on.")

        # ---- 2. variant wordings anywhere -------------------------------
        for bad, good in VARIANTS.items():
            if bad in out:
                variant_hits.append((rel.as_posix(), bad, good, out.count(bad)))
                out = out.replace(bad, good)

        # ---- 2b. "here" outside a journey band --------------------------
        if HERE in out:
            outside = BAND.sub(" ", out)
            if HERE in outside:
                variant_hits.append((rel.as_posix(), HERE + " (outside a journey band)",
                                     QS[0]["q"], outside.count(HERE)))

        # ---- 3. numbered references -------------------------------------
        for m in NUMBERED.finditer(html.unescape(re.sub(r"<[^>]+>", " ", src))):
            numbered_hits.append((rel.as_posix(), m.group(0)))

        # ---- 4. a canonical question pointing somewhere else ------------
        for q in QS:
            for m in re.finditer(
                    r'<a[^>]+href="([^"]+)"[^>]*>(?:(?!</a>).)*?' + re.escape(esc(q["q"])),
                    out, re.S):
                href = m.group(1).split("?")[0].rstrip("/") or "/"
                want = {q["href"].rstrip("/") or "/"}
                if q.get("href_move"):
                    want.add(q["href_move"].rstrip("/") or "/")
                for alt in q.get("href_alt", []):
                    want.add(alt.rstrip("/") or "/")
                if href not in want and not href.startswith("#"):
                    href_problems.append((rel.as_posix(), q["q"], m.group(1)))

        if out != src:
            changed[rel.as_posix()] = out

    # ------------------------------------------------------------- report
    print(f"questions.json: {len(QS)} questions\n")
    print(f"=== pages rewritten: {len(changed)}")
    for f in sorted(changed):
        print("   ", f)

    print(f"\n=== variant wordings replaced: {len(variant_hits)}")
    for f, bad, good, n in variant_hits:
        print(f'   {f}  ·  "{bad}" -> "{good}"  (x{n})')

    print(f"\n=== numbered references (name them instead): {len(numbered_hits)}")
    for f, t in sorted(set(numbered_hits)):
        print(f"   {f}  ·  {t}")

    print(f"\n=== a question linked somewhere other than its canonical page: {len(href_problems)}")
    for f, q, href in sorted(set(href_problems)):
        print(f'   {f}  ·  "{q}" -> {href}')

    if args.check:
        print("\n(check only, nothing written)")
        return 1 if (variant_hits or numbered_hits or href_problems or changed) else 0

    for f, text in changed.items():
        (ROOT / f).write_text(text, encoding="utf-8")
    print(f"\nwrote {len(changed)} pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
