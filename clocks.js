/* ============================================================================================
   Ethicare Resourcing — discreet international clocks (15 Oct 2026)

   One of the four personality touches Sophie kept on 14 Oct 2026: a quiet sense of what time
   it is on the other side of the world. Destination covers only (she took it off the homepage
   the same evening): one clock for that place in the cover's meta row, beside "15 chapters ·
   Updated · Free", with how far ahead of the visitor it is, worked out from the visitor's own
   local time. Small, in the row's own meta type, no animation beyond the minute ticking over.
   Chapter pages carry nothing.

   Times come from Intl with a named IANA zone, so daylight saving in either hemisphere takes
   care of itself. The place's zone is read from the destination slug in the URL; a page this
   script does not recognise gets nothing, silently. Numbers only, no slogans, no exclamation
   marks (site personality, 14 Oct 2026).
   ============================================================================================ */
(function () {
  'use strict';
  if (!window.Intl || !Intl.DateTimeFormat) return;

  var NZ = 'Pacific/Auckland';
  var ZONES = {
    'adelaide': 'Australia/Adelaide', 'south-australia': 'Australia/Adelaide',
    'perth': 'Australia/Perth', 'bunbury': 'Australia/Perth', 'mandurah': 'Australia/Perth', 'western-australia': 'Australia/Perth',
    'darwin': 'Australia/Darwin',
    'brisbane': 'Australia/Brisbane', 'bundaberg': 'Australia/Brisbane', 'gold-coast': 'Australia/Brisbane', 'queensland': 'Australia/Brisbane',
    'hobart': 'Australia/Hobart', 'tasmania': 'Australia/Hobart'
  };
  var NAMES = {
    'adelaide': 'Adelaide', 'south-australia': 'Adelaide', 'perth': 'Perth', 'bunbury': 'Bunbury', 'mandurah': 'Mandurah',
    'western-australia': 'Perth', 'darwin': 'Darwin', 'brisbane': 'Brisbane', 'bundaberg': 'Bundaberg', 'gold-coast': 'the Gold Coast',
    'queensland': 'Brisbane', 'hobart': 'Hobart', 'tasmania': 'Hobart', 'sydney': 'Sydney', 'melbourne': 'Melbourne', 'canberra': 'Canberra',
    'geelong': 'Geelong', 'newcastle': 'Newcastle', 'new-south-wales': 'Sydney', 'victoria': 'Melbourne',
    'auckland': 'Auckland', 'wellington': 'Wellington', 'christchurch': 'Christchurch', 'dunedin': 'Dunedin', 'gisborne': 'Gisborne',
    'hawkes-bay': "Hawke's Bay", 'bay-of-plenty': 'Tauranga', 'central-otago': 'Queenstown', 'nelson-tasman': 'Nelson',
    'northland': 'Whangārei', 'palmerston-north': 'Palmerston North', 'southland': 'Invercargill', 'waikato': 'Hamilton'
  };

  function fmt(zone, withDay) {
    try {
      var o = { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true };
      if (withDay) o.weekday = 'long';
      return new Intl.DateTimeFormat('en-GB', o).format(new Date()).replace(/\s*(am|pm)$/i, ' $1');
    } catch (e) { return ''; }
  }
  /* Whole hours (or half-hours, for Adelaide and Darwin) the place is ahead of the visitor. */
  function ahead(zone) {
    try {
      var now = new Date();
      var there = new Date(now.toLocaleString('en-US', { timeZone: zone }));
      var here = new Date(now.toLocaleString('en-US'));
      var h = Math.round((there - here) / 1800000) / 2;
      if (h === 0) return 'the same time as you';
      var n = Math.abs(h), s = (n === 1 ? '1 hour' : n + ' hours');
      return s + (h > 0 ? ' ahead of you' : ' behind you');
    } catch (e) { return ''; }
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ---- destination covers ---------------------------------------------------------------- */
  var m = location.pathname.match(/\/destinations\/([a-z-]+)-(new-zealand|australia)\/?(index\.html)?$/);
  if (m) {
    var slug = m[1], zone = m[2] === 'new-zealand' ? NZ : (ZONES[slug] || 'Australia/Sydney'), name = NAMES[slug];
    var chapters = null, spans = document.querySelectorAll('#top span');
    for (var i = 0; i < spans.length; i++) if (/\bchapters\b/.test(spans[i].textContent)) { chapters = spans[i]; break; }
    if (chapters && name) {
      var row = chapters.parentNode;
      var c = document.createElement('span');
      c.setAttribute('style', chapters.getAttribute('style') || '');
      c.style.whiteSpace = 'normal';
      c.setAttribute('aria-label', 'The time in ' + name + ' right now');
      var tickDest = function () {
        var t = fmt(zone, true); if (!t) return;
        var parts = t.split(' ');
        c.textContent = parts.slice(1).join(' ') + ' on ' + parts[0] + ' in ' + name + ' · ' + ahead(zone);
      };
      tickDest();
      row.appendChild(c);
      setInterval(tickDest, 30000);
    }
  }
})();
