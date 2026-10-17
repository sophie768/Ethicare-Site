#!/bin/bash
# guides/nz/*.html are mirrors of the live guides/*.html chapters (Netlify serves guides/<name>.html first).
# Regenerate the mirrors from the live files so the two never drift.
cd "$(dirname "$0")/.."
for pair in "renting-in-new-zealand renting-in-new-zealand" "driving-and-licences driving-and-licences" "before-you-leave before-you-leave" "new-zealand-first-month your-first-month" "aotearoa-in-short aotearoa-in-short" "money-tax-and-banking money-tax-and-banking" "te-ao-maori-at-work te-ao-maori-at-work" "new-zealand-checklist relocation-checklist"; do
  set -- $pair
  [ -f guides/$1.html ] && sed -e 's#"\.\./#"../../#g' -e "s#url('\.\./#url('../../#g" guides/$1.html > guides/nz/$2.html
done
