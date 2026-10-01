/* ============================================================================================
   Ethicare Resourcing — the facts panel on a vacancy page (30 Sep 2026)

   A clinician reading an advert scans for three things before they read a word of the prose:
   what it pays, what the hours are, and whether the employer helps with the move. Until now a
   vacancy page answered the first somewhere in the body, the second only if the chips happened
   to carry it, and the third nowhere at all. A reviewer looking at the Wellington MRI role on
   30 September could not find any of the three summarised.

   So this reads the role out of jobs-data.js by slug and puts the five answers together, at the
   top of the reading column, in one panel.

   WHAT IT WILL NOT DO is fill a gap. Pay, hours, sponsorship and relocation are the EMPLOYER'S
   commitments, not ours, and jobs-data.js already states the rule for the tri-state facets:
   "yes" and "no" are confirmed in writing, and absent means not yet confirmed. An absent value
   renders as "We will confirm this in writing before you decide", because that is what actually
   happens. A guessed "yes" here costs someone a move, so nothing is inferred, ever — not from
   the sector, not from the employer, not from what is usual.

   No markup to maintain on 35 pages: the panel is built here and inserted at the top of
   .v-main. A page with no matching slug in the data gets nothing, silently.
   ============================================================================================ */
(function () {
  'use strict';

  var main = document.querySelector('.v-main');
  var JOBS = window.ETHICARE_JOBS;
  if (!main || !JOBS || !JOBS.length || document.querySelector('.v-facts')) return;

  var slug = location.pathname.replace(/\/+$/, '').split('/').pop().replace(/\.html$/, '');
  var job = null;
  for (var i = 0; i < JOBS.length; i++) if (JOBS[i].slug === slug) { job = JOBS[i]; break; }
  if (!job) return;

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* A tri-state facet. Absent is an answer, and it is the honest one. */
  var UNKNOWN = 'We will confirm this in writing before you decide.';
  function facet(v, yes, no) {
    if (v === 'yes') return { v: yes, state: 'yes' };
    if (v === 'no') return { v: no, state: 'no' };
    return { v: 'Not yet confirmed', note: UNKNOWN, state: 'tbc' };
  }

  var rows = [
    { k: 'Pay', v: job.pay || 'Not yet confirmed', note: job.pay ? '' : UNKNOWN, state: job.pay ? '' : 'tbc' },
    job.hours
      ? { k: 'Hours', v: job.hours, state: '' }
      : { k: 'Hours', v: 'Not yet confirmed', note: UNKNOWN, state: 'tbc' },
    { k: 'Contract', v: (job.types || []).join(' · ') || 'Not yet confirmed', state: (job.types || []).length ? '' : 'tbc' }
  ];
  var sp = facet(job.sponsorship, 'The employer sponsors the visa', 'No visa sponsorship for this role');
  sp.k = 'Visa sponsorship'; rows.push(sp);
  var rl = facet(job.relocation, 'The employer contributes to relocation', 'No relocation contribution for this role');
  rl.k = 'Relocation support'; rows.push(rl);

  var CSS = ''
    + '.v-facts{background:#fff;border:1px solid #C9DED3;border-left:4px solid #A6C84A;border-radius:16px;padding:clamp(18px,2.2vw,24px);margin:0 0 clamp(26px,3vw,36px)}'
    + '.v-facts h2{font-family:"Work Sans",sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:#2F5E49;margin:0 0 14px}'
    + '.v-facts dl{display:grid;grid-template-columns:minmax(0,150px) minmax(0,1fr);gap:10px 20px;margin:0}'
    + '.v-facts dt{font-family:"Work Sans",sans-serif;font-weight:600;font-size:14.5px;color:#02615D;margin:0}'
    + '.v-facts dd{margin:0;font-size:15px;line-height:1.55;color:#333}'
    + '.v-facts dd .tbc{color:#555}'
    + '.v-facts dd .note{display:block;font-size:13.5px;color:#555;margin-top:2px}'
    + '.v-facts .fl{display:inline-block;font-family:"Work Sans",sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;padding:3px 9px;margin-right:8px;vertical-align:1px}'
    + '.v-facts .fl-yes{background:#E6F1ED;color:#2F5E49}'
    + '.v-facts .fl-no{background:#F6EAE7;color:#A34438}'
    + '.v-facts .fl-tbc{background:#F3F1EC;color:#555}'
    + '.v-facts .v-ask{margin:16px 0 0;font-size:14px;color:#555}'
    + '.v-facts .v-ask a{color:#02615D;font-weight:600;text-decoration:underline;text-underline-offset:3px}'
    + '@media(max-width:560px){.v-facts dl{grid-template-columns:minmax(0,1fr);gap:4px}'
    + '.v-facts dd{margin-bottom:12px}}';

  var st = document.createElement('style');
  st.appendChild(document.createTextNode(CSS));
  document.head.appendChild(st);

  var h = '<section class="v-facts" aria-labelledby="v-facts-h">'
    + '<h2 id="v-facts-h">The short answers</h2><dl>';
  rows.forEach(function (r) {
    var badge = r.state === 'yes' ? '<span class="fl fl-yes">Confirmed</span>'
      : r.state === 'no' ? '<span class="fl fl-no">Not available</span>'
      : r.state === 'tbc' ? '<span class="fl fl-tbc">To confirm</span>' : '';
    h += '<dt>' + esc(r.k) + '</dt><dd>' + badge
      + '<span class="' + (r.state === 'tbc' ? 'tbc' : '') + '">' + esc(r.v) + '</span>'
      + (r.note ? '<span class="note">' + esc(r.note) + '</span>' : '')
      + '</dd>';
  });
  h += '</dl><p class="v-ask">Anything here you need pinned down before you apply? '
    + '<a href="/contact">Ask us and we will get it in writing.</a></p></section>';

  var wrap = document.createElement('div');
  wrap.innerHTML = h;
  main.insertBefore(wrap.firstChild, main.firstChild);
})();
