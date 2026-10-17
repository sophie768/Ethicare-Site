# Provider logos

Drop a logo in here named after the company and the directory picks it up on the
next build. No JSON to edit.

    assets/providers/send-my-bag.svg
    assets/providers/seven-seas-worldwide.svg

The filename is the company name, lower case, spaces and punctuation replaced by
hyphens — exactly as tools/build-provider-directory.py prints it. SVG is best;
PNG, WebP and JPG also work, and the first one found wins in that order.

The slot is 72x48 with the image capped at 60x36, so a landscape mark sits best.
A tall square logo will still fit, just smaller. Transparent background.

Until a file exists the company shows a lettered tile instead, which is a
perfectly good permanent answer: it keeps the visual rhythm without implying
Ethicare has any relationship with the company.

Then run:

    python3 -I tools/build-provider-directory.py
