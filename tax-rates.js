/* ============================================================================
   Ethicare Resourcing — tax, levy and contribution rates
   The ONLY place any of these numbers live. take-home-pay.js reads them; it
   contains no figures of its own.

   WHY THIS FILE EXISTS SEPARATELY
   A take-home pay figure is something people budget a life around, and on a
   static site nothing updates itself. The risk is not that a rate changes — it
   is that a rate changes quietly and the page keeps answering with authority.
   In the year to September 2026, New Zealand's income tax brackets did not move
   at all, while the ACC earner's levy and the KiwiSaver minimum both did, and
   Australia's second tax bracket dropped from 16c to 15c. Anyone maintaining
   this would remember to check the income tax rates. Almost nobody would think
   to check the KiwiSaver default.

   SO: every number below carries the date it took effect and the page it came
   from, and `meta.reviewBy` is the date after which the calculator stops
   answering and says it needs checking rather than serving a stale figure.

   WHEN TO REVIEW
     1 April  — New Zealand tax year. Income tax, ACC earner's levy, KiwiSaver.
     1 July   — Australian financial year. Income tax, Medicare levy, super, LITO.
   Both are known dates. Diarise them; do not wait to be told.

   Where a future rate has already been published (ACC publishes a year ahead),
   it is included with its own `from` date and the calculator switches over on
   the day by itself. That is the only kind of automatic updating a static file
   can honestly do.
   ============================================================================ */

window.ETHICARE_TAX = (function () {
  'use strict';

  /* Every figure below was read from the official source on this date. */
  var meta = {
    reviewedOn: '2026-09-26',
    /* After this date the calculator refuses to show a figure. Set just past the
       next Australian financial year rollover, so both countries get a look. */
    reviewBy: '2027-08-31'
  };

  var SRC = {
    nzIncomeTax: 'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals',
    nzAcc: 'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/acc-clients-and-carers/acc-earners-levy-rates',
    nzKiwiSaver: 'https://www.ird.govt.nz/kiwisaver/kiwisaver-individuals/employee-contributions',
    auIncomeTax: 'https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents',
    auSuper: 'https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee',
    auLito: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset',
    auMedicare: 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy'
  };

  /* Brackets are [upper limit of the band, marginal rate]. The last band uses
     Infinity. Tax is worked out band by band, never by applying one rate to the
     whole salary — that error overstates tax badly just above a threshold. */
  var nz = {
    label: 'New Zealand',
    currency: 'NZ$',

    incomeTax: [{
      from: '2025-04-01',
      note: 'Unchanged for the 2026-27 tax year.',
      source: SRC.nzIncomeTax,
      brackets: [
        [15600, 0.105],
        [53500, 0.175],
        [78100, 0.30],
        [180000, 0.33],
        [Infinity, 0.39]
      ]
    }],

    /* Collected through PAYE alongside income tax, and capped: above the cap no
       further levy is charged, which is why a flat percentage is wrong at high
       salaries. Rates are GST inclusive, as IRD states them.
       The 2027-28 row is already published — it switches over on 1 April 2027
       without anyone touching this file. */
    accLevy: [
      { from: '2026-04-01', rate: 0.0175, cap: 156641, maxLevy: 2741.22, source: SRC.nzAcc },
      { from: '2027-04-01', rate: 0.0183, cap: 160244, maxLevy: 2932.47, source: SRC.nzAcc }
    ],

    /* Employee contributions are worked out on gross pay but come out of pay
       after PAYE, so they reduce take-home without reducing tax. The minimum
       rose from 3% to 3.5% on 1 April 2026; 3% remains available only to members
       granted a temporary rate reduction, which is why it is flagged rather than
       offered as an ordinary choice. Employer contributions are on top of salary
       and are taxed (ESCT) before they land in the account, so they affect the
       account balance, not take-home pay, and are not modelled here. */
    kiwiSaver: {
      from: '2026-04-01',
      defaultRate: 0.035,
      source: SRC.nzKiwiSaver,
      options: [
        { rate: 0.03, label: '3% (temporary reduction)', note: 'Only available if IRD has approved a temporary rate reduction.' },
        { rate: 0.035, label: '3.5% (minimum)' },
        { rate: 0.04, label: '4%' },
        { rate: 0.06, label: '6%' },
        { rate: 0.08, label: '8%' },
        { rate: 0.10, label: '10%' },
        { rate: 0, label: 'Not a member', note: 'New arrivals are not automatically enrolled until they start work, and may opt out.' }
      ]
    }
  };

  var au = {
    label: 'Australia',
    currency: 'A$',

    incomeTax: [{
      from: '2026-07-01',
      note: 'The 18,201–45,000 band fell from 16c to 15c for 2026-27.',
      source: SRC.auIncomeTax,
      brackets: [
        [18200, 0],
        [45000, 0.15],
        [135000, 0.30],
        [190000, 0.37],
        [Infinity, 0.45]
      ]
    }],

    /* 2% for most earners. The levy reduces or disappears at low incomes and can
       be increased by the Medicare levy surcharge for higher earners without
       private hospital cover — neither is modelled, and both are named in the
       page's caveats rather than hidden. */
    medicareLevy: { rate: 0.02, source: SRC.auMedicare },

    /* Reduces tax payable, never below zero, and never produces a refund of the
       Medicare levy. It matters for part-time roles and is invisible above
       $66,667, which is why it is modelled rather than waved away: without it
       the figure is wrong for anyone on a 0.6 FTE imaging contract. */
    lito: {
      from: '2026-07-01',
      source: SRC.auLito,
      max: 700,
      firstThreshold: 37500, firstTaper: 0.05,
      secondThreshold: 45000, secondTaper: 0.015,
      cutOut: 66667
    },

    /* Paid by the employer on top of salary, or carved out of a quoted package —
       which of the two is the single most common misunderstanding in an
       Australian offer, so the calculator asks rather than assumes. Never part
       of take-home pay either way. */
    superGuarantee: { from: '2025-07-01', rate: 0.12, source: SRC.auSuper }
  };

  /* Pick the row whose `from` date is the latest one not in the future. */
  function current(rows, today) {
    var now = today || new Date().toISOString().slice(0, 10), pick = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].from <= now && (!pick || rows[i].from > pick.from)) pick = rows[i];
    }
    return pick || rows[0];
  }

  function stale(today) {
    return (today || new Date().toISOString().slice(0, 10)) > meta.reviewBy;
  }

  return { meta: meta, nz: nz, au: au, current: current, stale: stale, sources: SRC };
})();
