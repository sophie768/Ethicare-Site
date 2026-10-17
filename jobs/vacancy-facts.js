/* ============================================================================================
   Ethicare Resourcing — the facts panel on a vacancy page (30 Sep 2026)

   A clinician reading an advert scans for three things before they read a word of the prose:
   what it pays, what the hours are, and whether the employer helps with the move. Until now a
   vacancy page answered the first somewhere in the body, the second only if the chips happened
   to carry it, and the third nowhere at all. A reviewer looking at the Wellington MRI role on
   30 September could not find any of the three summarised.

   So this reads the role out of jobs-data.js by slug and puts the five answers together, at the
   top of the reading column, in one panel.

   The standing answers (Sophie, 15 Oct 2026) live in jobs-data.js and are filled in there:
   full-time unless the role says otherwise, visa sponsorship on every role, relocation support
   in the private sector and for doctors and case by case elsewhere. So this panel simply states
   each answer. Nothing here says "to confirm" or "in writing" — that read as hedging and it
   confused candidates.

   No markup to maintain on 35 pages: the panel is built here and inserted at the top of
   .v-main. A page with no matching slug in the data gets nothing, silently.
   ============================================================================================ */
(function () {
  'use strict';

  var main = document.querySelector('.v-main');
  /* The detail page must still render a role that has closed — a candidate arriving from an
     old link is better served by the page saying so than by an empty panel. So this one
     reads the unfiltered list (2 Oct 2026). */
  var JOBS = window.ETHICARE_JOBS_ALL || window.ETHICARE_JOBS;
  if (!main || !JOBS || !JOBS.length || document.querySelector('.v-facts')) return;

  var slug = location.pathname.replace(/\/+$/, '').split('/').pop().replace(/\.html$/, '');
  var job = null;
  for (var i = 0; i < JOBS.length; i++) if (JOBS[i].slug === slug) { job = JOBS[i]; break; }
  if (!job) return;

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var HIDE = job.hide || [];
  /* Contract is the type of employment; the hours line already carries full- or part-time. */
  var contract = (job.types || []).filter(function (t) { return !/full-time|part-time|session/i.test(t); }).join(' \u00b7 ') || 'Permanent';
  var rows = [
    { k: 'Pay', v: job.pay || 'Competitive \u2014 discussed with you' },
    { k: 'Hours', v: job.hours || 'Full-time' },
    { k: 'Contract', v: contract },
    { k: 'Visa sponsorship', v: job.sponsorship === 'no' ? 'Not available for this role' : 'The employer sponsors your visa', state: job.sponsorship === 'no' ? 'no' : 'yes' },
    { k: 'Relocation support', v: job.relocation === 'no' ? 'No relocation contribution for this role'
        : job.relocation === 'yes' ? 'The employer contributes to your move'
        : 'Agreed case by case with the employer', state: job.relocation === 'no' ? 'no' : job.relocation === 'yes' ? 'yes' : '' }
  ];
  /* A role can leave a line out on purpose (job.hide). */
  rows = rows.filter(function (r) { return !((r.k === 'Pay' && HIDE.indexOf('pay') > -1) || (r.k === 'Visa sponsorship' && HIDE.indexOf('sponsorship') > -1) || (r.k === 'Relocation support' && HIDE.indexOf('relocation') > -1)); });

  var CSS = ''
    + '.v-facts{background:#fff;border:1px solid #C9DED3;border-left:4px solid #A6C84A;border-radius:16px;padding:clamp(18px,2.2vw,24px);margin:0 0 clamp(26px,3vw,36px)}'
    + '.v-facts h2{font-family:"Work Sans",sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:#2F5E49;margin:0 0 14px}'
    + '.v-facts dl{display:grid;grid-template-columns:minmax(0,150px) minmax(0,1fr);gap:10px 20px;margin:0}'
    + '.v-facts dt{font-family:"Work Sans",sans-serif;font-weight:600;font-size:14.5px;color:#02615D;margin:0}'
    + '.v-facts dd{margin:0;font-size:15px;line-height:1.55;color:#333}'
    + '.v-facts .fl{display:inline-block;font-family:"Work Sans",sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;padding:3px 9px;margin-right:8px;vertical-align:1px}'
    + '.v-facts .fl-yes{background:#E6F1ED;color:#2F5E49}'
    + '.v-facts .fl-no{background:#F6EAE7;color:#A34438}'
    + '@media(max-width:560px){.v-facts dl{grid-template-columns:minmax(0,1fr);gap:4px}'
    + '.v-facts dd{margin-bottom:12px}}';

  var st = document.createElement('style');
  st.appendChild(document.createTextNode(CSS));
  document.head.appendChild(st);

  var h = '<section class="v-facts" aria-labelledby="v-facts-h">'
    + '<h2 id="v-facts-h">The short answers</h2><dl>';
  rows.forEach(function (r) {
    var badge = r.state === 'yes' ? '<span class="fl fl-yes">Yes</span>'
      : r.state === 'no' ? '<span class="fl fl-no">No</span>' : '';
    h += '<dt>' + esc(r.k) + '</dt><dd>' + badge + '<span>' + esc(r.v) + '</span></dd>';
  });
  h += '</dl></section>';

  var wrap = document.createElement('div');
  wrap.innerHTML = h;
  main.insertBefore(wrap.firstChild, main.firstChild);
})();
