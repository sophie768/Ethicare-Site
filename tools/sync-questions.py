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
     notices by reading;
  4. (29 Sep 2026) writes the eight-stage JOURNEY BAND on every guide page from
     the `journey` list, writes journey.js for the tools and the answers strip,
     renumbers "Stage 0N" references when the order changes, and checks
     move.js against the same list. Each band carries data-stage, the
     id of the page's own stage; the first run inferred it from the number the
     old band left out.

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
JOURNEY = DATA["journey"]
MIG = DATA.get("journey_migration", {})
BY_ID = {j["id"]: j for j in JOURNEY}
OLD2ID = MIG.get("old_number_to_id", {})
# old band number -> new band number, for the one-off renumbering of prose references
OLDN2NEWN = {int(k): BY_ID[v]["n"] for k, v in OLD2ID.items()}

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



# ---------------------------------------------------------------- the journey
BAND_RE = re.compile(r'<nav class="journey-band"([^>]*)>([\s\S]*?)</nav>')
STAGE_REF = re.compile(r"Stage 0([1-8])")


def band_country(nav_attrs, body):
    if "Australia" in nav_attrs or "/australia" in body: return "au"
    return "nz"


def band_html(country, current_id, current_text):
    """Two shapes, both from the file: a STAGE page lists all eight with its own marked current
    and titles itself 'Stage 0N of 08'; a REFERENCE guide (no stage) lists all eight unmarked
    and says 'jump in anywhere'."""
    cname = "Australia" if country == "au" else "New Zealand"
    lis = []
    for j in JOURNEY:
        cur = j["id"] == current_id
        li_open = '      <li class="tl current" aria-current="step">' if cur else '      <li class="tl">'
        lis.append(li_open + f'<a href="{j["href"][country]}"><i>{j["n"]}</i><span class="lab">{esc(j["label"])}</span></a></li>')
    title = (f'Stage 0{BY_ID[current_id]["n"]} of 08' if current_id else 'jump in anywhere')
    aria = "Where you are in the eight-stage journey" if current_id else "The " + cname + " relocation journey"
    stage_attr = current_id or "none"
    return (f'<nav class="journey-band" data-stage="{stage_attr}" aria-label="{aria}">\n'
            f'  <div class="wrap">\n'
            f'    <p class="jb-title">Your {cname} journey &middot; <b>{title}</b></p>\n'
            f'    <ol class="timeline">\n' + "\n".join(lis) + "\n"
            f'    </ol>\n'
            f'    <p class="jb-current">{current_text}</p>\n'
            f'  </div>\n'
            f'</nav>')


def sync_band(out, rel, problems):
    """Rewrite the page's journey band from the file. Returns the new text."""
    m = BAND_RE.search(out)
    if not m:
        return out
    attrs, body = m.group(1), m.group(2)
    country = band_country(attrs, body)
    cur = re.search(r'data-stage="([a-z]+)"', attrs)
    if cur:
        current_id = cur.group(1) if cur.group(1) in BY_ID else None
    else:
        # first run: the page's own stage is the item the old band marked current
        cm0 = re.search(r'<li class="tl current"[^>]*><a[^>]*><i>(\d)</i>', body)
        if cm0:
            current_id = OLD2ID.get(cm0.group(1))
            if not current_id:
                problems.append((rel, f"no migration entry for old stage {cm0.group(1)}"))
                return out
        else:
            current_id = None
    cm = re.search(r'<p class="jb-current">([\s\S]*?)</p>', body)
    current_text = cm.group(1).strip() if cm else ""
    if current_id:
        current_text = re.sub(r"Stage 0\d", f"Stage 0{BY_ID[current_id]['n']}", current_text, count=1)
    return out[:m.start()] + band_html(country, current_id, current_text) + out[m.end():]


def renumber_stage_refs(out, rel, changed_order):
    """One-off: when the band order changed, every 'Stage 0N' in prose still carries the old
    number. Map old -> new once, guarded by a marker so it can never run twice on a page."""
    if not changed_order or "<!-- journey renumbered -->" in out:
        return out
    if not STAGE_REF.search(out):
        return out
    # never touch the band itself — it is generated from the file with the new numbers
    m = BAND_RE.search(out)
    head, band, tail = (out[:m.start()], m.group(0), out[m.end():]) if m else (out, "", "")
    fix = lambda t: STAGE_REF.sub(lambda mm: f"Stage 0{OLDN2NEWN[int(mm.group(1))]}", t)
    out = fix(head) + band + fix(tail)
    return out.replace("</head>", "<!-- journey renumbered -->\n</head>", 1)


def journey_js():
    rows = []
    for j in JOURNEY:
        rows.append("  { n: %d, id: %s, label: %s, there: %s, where: %s, href: %s, questions: %s }" % (
            j["n"], json.dumps(j["id"]), json.dumps(j["label"]), json.dumps(j.get("label_there", j["label"])),
            json.dumps(j["where"]), json.dumps(j["href"], ensure_ascii=False),
            json.dumps(j.get("questions", [j["question"]] if j.get("question") else []))))
    return ("/* GENERATED by tools/sync-questions.py from questions.json — do not edit here.\n"
            "   The eight stages of the journey, in order. Every band, the answers strip, Move and the\n"
            "   tools read this; the wording is decided in questions.json and nowhere else. */\n"
            "window.ETHICARE_JOURNEY = [\n" + ",\n".join(rows) + "\n];\n"
            "window.ETHICARE_JOURNEY_MAP = " + json.dumps({
                "moveToJourney": MIG.get("move_stage_to_journey", {}),
                "journeyToMove": MIG.get("journey_to_move_stage", {})}, indent=2) + ";\n")


def check_move(problems):
    """/move renders the eight stages from journey.js at run time, so there is nothing static to
    compare — but move.js keys its tool table and stage items by journey id, so every id it names
    must exist in questions.json, and it must name all eight."""
    p = ROOT / "move.js"
    if not p.exists():
        return
    src = p.read_text(encoding="utf-8")
    ids = set(re.findall(r"""case\s+'([a-z]+)'\s*:""", src))
    want = {j["id"] for j in JOURNEY}
    missing = want - ids
    if missing:
        problems.append(("move.js", f"journey stages without a case in stages(): {sorted(missing)}"))
    unknown = ids - want - {"nz", "au", "both", "any"}
    if unknown:
        problems.append(("move.js", f"stage cases not in questions.json: {sorted(unknown)}"))


NUMBERED = re.compile(r"\b[Qq]uestion (one|two|three|four|five|six|\d)\b")
ORDER_CHANGED = any(k != v for k, v in OLDN2NEWN.items())

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
    band_pages = []
    band_problems = []
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

        # ---- 2c. the journey band -----------------------------------------
        if BAND_RE.search(out):
            out = renumber_stage_refs(out, rel, changed_order=ORDER_CHANGED)
            before_band = out
            out = sync_band(out, rel, band_problems)
            if out != before_band:
                band_pages.append(rel.as_posix())

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

    check_move(band_problems)
    print(f"\n=== journey bands written: {len(band_pages)}")
    for f in band_pages:
        print("   ", f)
    print(f"\n=== journey problems: {len(band_problems)}")
    for f, t in band_problems:
        print(f"   {f}  ·  {t}")
    js_path = ROOT / "journey.js"
    js_new = journey_js()
    js_stale = (not js_path.exists()) or js_path.read_text(encoding="utf-8") != js_new
    print(f"\n=== journey.js: {'stale — will be written' if js_stale else 'current'}")

    print(f"\n=== a question linked somewhere other than its canonical page: {len(href_problems)}")
    for f, q, href in sorted(set(href_problems)):
        print(f'   {f}  ·  "{q}" -> {href}')

    if args.check:
        print("\n(check only, nothing written)")
        return 1 if (variant_hits or numbered_hits or href_problems or changed or band_problems or js_stale) else 0

    for f, text in changed.items():
        (ROOT / f).write_text(text, encoding="utf-8")
    if js_stale:
        js_path.write_text(js_new, encoding="utf-8")
        print("wrote journey.js")
    print(f"\nwrote {len(changed)} pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
