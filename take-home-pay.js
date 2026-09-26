/* ============================================================================
   Ethicare Resourcing — take-home pay estimator
   Reads every figure from tax-rates.js. There are no rates in this file, on
   purpose: one place to review means one place that can go stale.

   What it models: income tax, the ACC earner's levy (NZ), KiwiSaver employee
   contributions (NZ), the Medicare levy and the low income tax offset (AU), and
   whether superannuation sits on top of a quoted salary or inside it.

   What it deliberately does NOT model is listed on the page itself, in words,
   next to the answer — the arrival year above all. Someone landing in November
   earns a part-year income, and annualising overstates their first-year tax
   badly. That is the exact year they are budgeting for, so the tool says so
   rather than quietly getting it wrong.
   ============================================================================ */
(function () {
  'use strict';

  var T = window.ETHICARE_TAX;

  /* ---------- maths ---------- */

  /* Band by band, never one rate applied to the whole salary. */
  function progressive(income, brackets) {
    var tax = 0, lower = 0;
    for (var i = 0; i < brackets.length && income > lower; i++) {
      var upper = brackets[i][0], rate = brackets[i][1];
      tax += (Math.min(income, upper) - lower) * rate;
      lower = upper;
    }
    return tax;
  }

  function nzCalc(gross, ksRate, today) {
    var it = T.current(T.nz.incomeTax, today);
    var acc = T.current(T.nz.accLevy, today);
    var tax = progressive(gross, it.brackets);
    var levy = Math.min(gross, acc.cap) * acc.rate;
    var ks = gross * ksRate;
    return {
      gross: gross,
      lines: [
        { k: 'Income tax', v: tax },
        { k: 'ACC earner’s levy', v: levy, note: gross > acc.cap ? 'Capped at ' + money(acc.cap, 'NZ$') + ' of earnings' : '' },
        { k: 'KiwiSaver', v: ks, omit: ksRate === 0 }
      ],
      net: gross - tax - levy - ks,
      aside: null,
      rateNote: 'Income tax from ' + it.from + '. ACC levy and KiwiSaver from ' + acc.from + '.'
    };
  }

  function auCalc(packageAmount, superInside, today) {
    var it = T.current(T.au.incomeTax, today);
    var sg = T.current([T.au.superGuarantee], today);
    /* If super is inside the quoted package, the taxable salary is what is left
       once the employer's contribution is carved out of it. */
    var salary = superInside ? packageAmount / (1 + sg.rate) : packageAmount;
    var tax = progressive(salary, it.brackets);
    var offset = lito(salary);
    var taxAfterOffset = Math.max(0, tax - offset);
    var medicare = salary * T.au.medicareLevy.rate;
    var superAmt = salary * sg.rate;
    return {
      gross: salary,
      lines: [
        { k: 'Income tax', v: taxAfterOffset, note: offset > 0 ? 'After ' + money(offset, 'A$') + ' low income tax offset' : '' },
        { k: 'Medicare levy', v: medicare }
      ],
      net: salary - taxAfterOffset - medicare,
      aside: { k: 'Superannuation', v: superAmt, note: superInside
        ? 'Carved out of the ' + money(packageAmount, 'A$') + ' package. Not money you can spend.'
        : 'Paid by the employer on top of your salary. Not money you can spend.' },
      rateNote: 'Income tax from ' + it.from + '. Super guarantee ' + (sg.rate * 100) + '% from ' + sg.from + '.'
    };
  }

  function lito(income) {
    var L = T.au.lito;
    if (income <= L.firstThreshold) return L.max;
    if (income >= L.cutOut) return 0;
    if (income <= L.secondThreshold) return Math.max(0, L.max - (income - L.firstThreshold) * L.firstTaper);
    var atSecond = L.max - (L.secondThreshold - L.firstThreshold) * L.firstTaper;
    return Math.max(0, atSecond - (income - L.secondThreshold) * L.secondTaper);
  }

  function money(n, cur) {
    return cur + Math.round(n).toLocaleString('en-NZ');
  }

  /* ---------- view ---------- */

  var state = { country: 'nz', gross: 95000, ks: null, superInside: false };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function render() {
    var app = document.getElementById('th-app');
    if (!app || !T) return;

    if (T.stale()) {
      app.innerHTML = '<div class="th-card th-stale"><h2>These figures need checking</h2>' +
        '<p>This estimator holds tax and contribution rates that were last verified on ' + T.meta.reviewedOn +
        ' and were due for review by ' + T.meta.reviewBy + '. Rather than show you a figure that may be out of date, it has stopped.</p>' +
        '<p>Use <a href="https://www.ird.govt.nz/calculators-and-tools" target="_blank" rel="noopener">IRD’s own calculator</a> for New Zealand or ' +
        '<a href="https://www.ato.gov.au/calculators-and-tools" target="_blank" rel="noopener">the ATO’s</a> for Australia, and please ' +
        '<a href="/contact">tell us</a> so we can update this.</p></div>';
      return;
    }

    if (state.ks === null) state.ks = T.nz.kiwiSaver.defaultRate;
    var nzOn = state.country === 'nz';
    var cur = nzOn ? T.nz.currency : T.au.currency;

    app.innerHTML = '';
    var card = el('div', 'th-card');

    /* country */
    var tabs = el('div', 'th-tabs');
    ['nz', 'au'].forEach(function (c) {
      var b = el('button', 'th-tab' + (state.country === c ? ' is-on' : ''), T[c].label);
      b.type = 'button';
      b.setAttribute('aria-pressed', state.country === c ? 'true' : 'false');
      b.onclick = function () { state.country = c; render(); };
      tabs.appendChild(b);
    });
    card.appendChild(tabs);

    /* salary */
    var f = el('div', 'th-field');
    f.appendChild(el('label', 'th-lbl', nzOn
      ? 'Gross annual salary'
      : 'Annual salary or package as advertised'));
    var wrap = el('div', 'th-input');
    wrap.appendChild(el('span', 'th-cur', cur));
    var input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.id = 'th-gross';
    input.value = state.gross ? state.gross.toLocaleString('en-NZ') : '';
    input.setAttribute('aria-label', 'Gross annual salary');
    input.oninput = function () {
      var n = parseInt(String(input.value).replace(/[^0-9]/g, ''), 10);
      state.gross = isFinite(n) ? n : 0;
      update();
    };
    wrap.appendChild(input);
    f.appendChild(wrap);
    card.appendChild(f);

    /* country-specific control */
    if (nzOn) {
      var kf = el('div', 'th-field');
      kf.appendChild(el('label', 'th-lbl', 'Your KiwiSaver contribution'));
      var sel = document.createElement('select');
      sel.className = 'th-select';
      sel.setAttribute('aria-label', 'KiwiSaver contribution rate');
      T.nz.kiwiSaver.options.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = String(o.rate);
        opt.textContent = o.label;
        if (o.rate === state.ks) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.onchange = function () { state.ks = parseFloat(sel.value); update(); };
      kf.appendChild(sel);
      var chosen = T.nz.kiwiSaver.options.filter(function (o) { return o.rate === state.ks; })[0];
      if (chosen && chosen.note) kf.appendChild(el('p', 'th-note', chosen.note));
      card.appendChild(kf);
    } else {
      var sf = el('div', 'th-field');
      sf.appendChild(el('label', 'th-lbl', 'Is superannuation on top of that figure, or inside it?'));
      var seg = el('div', 'th-seg');
      [['top', 'On top of salary', false], ['in', 'Included in the package', true]].forEach(function (o) {
        var b = el('button', 'th-segb' + (state.superInside === o[2] ? ' is-on' : ''), o[1]);
        b.type = 'button';
        b.setAttribute('aria-pressed', state.superInside === o[2] ? 'true' : 'false');
        b.onclick = function () { state.superInside = o[2]; render(); };
        seg.appendChild(b);
      });
      sf.appendChild(seg);
      sf.appendChild(el('p', 'th-note', 'Australian offers quote it both ways, and the difference is real money. If the advert does not say, ask before you compare it with anything.'));
      card.appendChild(sf);
    }

    var out = el('div', 'th-out');
    out.id = 'th-out';
    card.appendChild(out);
    app.appendChild(card);
    update();
  }

  function update() {
    var out = document.getElementById('th-out');
    if (!out) return;
    var nzOn = state.country === 'nz';
    var cur = nzOn ? T.nz.currency : T.au.currency;

    if (!state.gross || state.gross < 1000) {
      out.innerHTML = '<p class="th-empty">Enter a salary to see an estimate.</p>';
      return;
    }
    if (state.gross > 2000000) {
      out.innerHTML = '<p class="th-empty">That is beyond anything this tool should be guessing at. Talk to an accountant.</p>';
      return;
    }

    var r = nzOn ? nzCalc(state.gross, state.ks) : auCalc(state.gross, state.superInside);
    var html = '';

    html += '<div class="th-head"><span class="th-k">Estimated take-home pay</span>' +
      '<span class="th-big">' + money(r.net / 12, cur) + '<small> a month</small></span>' +
      '<span class="th-alt">' + money(r.net / 26, cur) + ' a fortnight &middot; ' + money(r.net, cur) + ' a year</span></div>';

    html += '<div class="th-rows">';
    html += '<div class="th-row"><span>' + (nzOn ? 'Gross salary' : 'Taxable salary') + '</span><b>' + money(r.gross, cur) + '</b></div>';
    r.lines.forEach(function (l) {
      if (l.omit) return;
      html += '<div class="th-row th-minus"><span>' + l.k + (l.note ? '<em>' + l.note + '</em>' : '') + '</span><b>&minus;' + money(l.v, cur) + '</b></div>';
    });
    html += '<div class="th-row th-net"><span>Take-home pay</span><b>' + money(r.net, cur) + '</b></div>';
    html += '</div>';

    if (r.aside) {
      html += '<div class="th-aside"><span>' + r.aside.k + '</span><b>' + money(r.aside.v, cur) + ' a year</b>' +
        '<em>' + r.aside.note + '</em></div>';
    }

    html += '<p class="th-src">' + r.rateNote + ' Verified ' + T.meta.reviewedOn + ' against ' +
      (nzOn
        ? '<a href="' + T.sources.nzIncomeTax + '" target="_blank" rel="noopener">IRD</a>'
        : '<a href="' + T.sources.auIncomeTax + '" target="_blank" rel="noopener">the ATO</a>') + '.</p>';

    out.innerHTML = html;

    if (window.track) window.track('takehome_estimate', { country: state.country });
  }

  /* exposed so the figures can be tested without a browser */
  window.EthicareTakeHome = { progressive: progressive, nzCalc: nzCalc, auCalc: auCalc, lito: lito };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
