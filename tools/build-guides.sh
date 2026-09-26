#!/usr/bin/env bash
# =============================================================================
# Ethicare Resourcing — rebuild every guide PDF
#
#   ./tools/build-guides.sh                 all fourteen
#   ./tools/build-guides.sh wellington-relocation-guide   just one
#
# Three steps, because each needs a different tool:
#   1. build    Chromium prints the real chapters to A4 (tools/build-guide-pdfs.js)
#   2. stamp    a running foot is added from page two, so the cover stays clean
#   3. compress lossless recompression — stamping roughly doubles the file size,
#               and this puts it back. Nothing is downsampled; the pages are
#               identical, only the object streams are packed.
#
# A local server must be serving the site root on port 8766 first:
#   python3 -m http.server 8766
#
# Offline build (no access to Google Fonts): set FONT_CSS and FONT_DIR to a
# local @font-face stylesheet and the folder holding the woff2 files.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

if ! curl -sf -o /dev/null "http://localhost:${PORT:-8766}/shell.css"; then
  echo "No server on port ${PORT:-8766}. Run: python3 -m http.server ${PORT:-8766}" >&2
  exit 1
fi

echo "— building"
node tools/build-guide-pdfs.js "$@"

echo "— stamping page numbers"
python3 - "$@" <<'PY'
import json, sys, io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor

only = set(sys.argv[1:])
for g in json.load(open('tools/guide-manifest.json', encoding='utf-8')):
    if only and g['slug'] not in only:
        continue
    path = f"assets/downloads/{g['slug']}.pdf"
    label = f"{g['title']} · Ethicare Resourcing"
    reader, writer = PdfReader(path), PdfWriter()
    for i, page in enumerate(reader.pages):
        if i > 0:                                   # never on the cover
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=A4)
            c.setFont("Helvetica", 7.5)
            c.setFillColor(HexColor("#5C6B57"))
            c.drawString(40, 30, label)
            c.drawRightString(A4[0] - 40, 30, str(i + 1))
            c.save(); buf.seek(0)
            page.merge_page(PdfReader(buf).pages[0])
        writer.add_page(page)
    writer.add_metadata({"/Title": g['title'], "/Author": "Ethicare Resourcing"})
    with open(path, "wb") as f:
        writer.write(f)
    print(f"   {g['slug']:<36} {len(reader.pages):>3} pages")
PY

echo "— compressing"
for f in assets/downloads/*.pdf; do
  qpdf --object-streams=generate --compress-streams=y --recompress-flate \
       --compression-level=9 "$f" "$f.opt" 2>/dev/null && mv "$f.opt" "$f"
  printf "   %-40s %6s KB\n" "$(basename "$f")" "$(( $(stat -c%s "$f") / 1024 ))"
done
echo "done."
