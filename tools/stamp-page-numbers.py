#!/usr/bin/env python3
"""Stamp a running foot onto a built guide PDF.

Chromium prints its header and footer on every sheet including the cover, and gives
no way to skip the first. So the guides are printed without one and the foot is added
here, from page two, leaving the cover clean.

Usage: python3 tools/stamp-page-numbers.py <pdf> "<left hand text>"
"""
import sys, io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor

def stamp(path, label):
    reader = PdfReader(path)
    writer = PdfWriter()
    total = len(reader.pages)
    for i, page in enumerate(reader.pages):
        if i > 0:                                  # never on the cover
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=A4)
            c.setFont("Helvetica", 7.5)
            c.setFillColor(HexColor("#5C6B57"))
            c.drawString(40, 30, label)
            c.drawRightString(A4[0] - 40, 30, f"{i + 1}")
            c.save()
            buf.seek(0)
            page.merge_page(PdfReader(buf).pages[0])
        writer.add_page(page)
    writer.add_metadata({"/Title": label.split(" · ")[0], "/Author": "Ethicare Resourcing"})
    with open(path, "wb") as f:
        writer.write(f)
    return total

if __name__ == "__main__":
    n = stamp(sys.argv[1], sys.argv[2])
    print(f"{sys.argv[1]}: {n} pages stamped")
