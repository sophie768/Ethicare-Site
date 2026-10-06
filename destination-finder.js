/* ============================================================================
   Destination finder — shared module (6 Oct 2026)

   Seven questions about the life someone wants, and three regions that fit, with the trade-offs.
   Built for the eight-stage Move rebuild, lost when /move was replaced on 29 Sep 2026, restored
   on /destination-finder and — Sophie, 6 Oct: "when a candidate clicks on destination guides, it
   comes up with a checker" — mounted at the top of both destination indexes too.

   Usage:  <div data-destination-finder data-country="nz"></div>   (country optional: nz | au)
   With a country set, the country question is answered and hidden — six questions, not seven.
   Country and who-is-coming prefill from the answers strip (candidate-context.js) when present.
   Nothing is stored; answers live only in the page.
   ============================================================================ */
(function () {
  'use strict';
  var DESTS=[
    /* NZ */
    {id:'auckland-nz',name:'Auckland',sub:'Tāmaki Makaurau',country:'nz',scale:'metro',coast:true,alpine:false,climate:'warm',scope:'tertiary',cost:'high',
     guide:'/destinations/auckland-new-zealand',
     pros:['New Zealand&rsquo;s widest range of specialist services','The most diverse communities in the country','Most career options for a partner'],
     cons:'The most expensive housing in New Zealand, and a commute that behaves like a big city\'s.'},
    {id:'wellington-nz',name:'Wellington',sub:'Te Whanganui-a-Tara',country:'nz',scale:'metro',coast:true,alpine:false,climate:'temperate',scope:'tertiary',cost:'high',
     guide:'/destinations/wellington-new-zealand',
     pros:['Compact and walkable — the easiest big city to live in','Strong tertiary services and training environment','The capital: culture, food, community'],
     cons:'The wind is not a joke, and hillside housing is old, steep and tightly held.'},
    {id:'christchurch-nz',name:'Christchurch',sub:'Ōtautahi',country:'nz',scale:'city',coast:false,alpine:true,climate:'temperate',scope:'tertiary',cost:'mid',
     guide:'/destinations/christchurch-new-zealand',
     pros:['Flat, grid city — easy to navigate and commute','Tertiary centre with a revitalised feel','Alps on the doorstep'],
     cons:'Still carries some post-earthquake legacy; fewer deep community threads than the older cities.'},
    {id:'dunedin-nz',name:'Dunedin',sub:'Ōtepoti',country:'nz',scale:'city',coast:true,alpine:false,climate:'cool',scope:'tertiary',cost:'low',
     guide:'/destinations/dunedin-new-zealand',
     pros:['Most affordable major city in New Zealand','Strong tertiary hospital and university teaching environment','Wildlife and extraordinary scenery on the doorstep'],
     cons:'Cold, and a long way from Auckland or Wellington if family is there.'},
    {id:'hamilton-nz',name:'Hamilton',sub:'Waikato — green heartland',country:'nz',scale:'city',coast:false,alpine:false,climate:'temperate',scope:'base',cost:'mid',
     guide:'/destinations/waikato-new-zealand',
     pros:['Green and central — close to both coasts and the mountains','Growing health sector','Noticeably more affordable than Auckland'],
     cons:'Inland and flat. If you want to see the sea from the house, this is not it.'},
    {id:'bay-plenty-nz',name:'Bay of Plenty',sub:'Te Moana-a-Toi',country:'nz',scale:'city',coast:true,alpine:false,climate:'warm',scope:'base',cost:'mid',
     guide:'/destinations/bay-of-plenty-new-zealand',
     pros:['Beaches and year-round sunshine','Fast-growing region','A base hospital with a broad caseload'],
     cons:'Growth has pushed housing faster than wages; summer brings the whole country to your beach.'},
    {id:'nelson-nz',name:'Nelson Tasman',sub:'Whakatū',country:'nz',scale:'regional',coast:true,alpine:true,climate:'warm',scope:'base',cost:'mid',
     guide:'/destinations/nelson-tasman-new-zealand',
     pros:['Sunniest place in New Zealand','National parks on three sides','An easy, outdoor-focused life'],
     cons:'Everyone else wants it too — housing is tight for the size of the town.'},
    {id:'pn-nz',name:'Palmerston North',sub:'Te Papaioea',country:'nz',scale:'city',coast:false,alpine:false,climate:'temperate',scope:'base',cost:'low',
     guide:'/destinations/palmerston-north-new-zealand',
     pros:['The most affordable medium-sized city in New Zealand','Central North Island — easy to get anywhere from','Friendly, student-city energy'],
     cons:'Flat, inland and windy. Its appeal is convenience and cost, not scenery.'},
    {id:'central-otago-nz',name:'Central Otago',sub:'Southern Lakes & high country',country:'nz',scale:'regional',coast:false,alpine:true,climate:'cool',scope:'base',cost:'low',
     guide:'/destinations/central-otago-new-zealand',
     pros:['Lakes, mountains and four real seasons','A genuinely beautiful place to live','Affordable relative to NZ&rsquo;s main centres'],
     cons:'Small team, and specialist backup is further away. Queenstown tourism inflates some costs.'},
    {id:'southland-nz',name:'Southland',sub:'Murihiku & Fiordland',country:'nz',scale:'regional',coast:false,alpine:true,climate:'cool',scope:'base',cost:'low',
     guide:'/destinations/southland-new-zealand',
     pros:['Cheapest city housing in New Zealand','Fiordland two hours away','A relaxed, unpretentious community'],
     cons:'Cold. A long way from anywhere else. Make sure the person coming with you wants it too.'},
    /* AU */
    {id:'sydney-au',name:'Sydney',sub:'New South Wales',country:'au',scale:'metro',coast:true,alpine:false,climate:'warm',scope:'tertiary',cost:'high',
     guide:'/destinations/sydney-australia',
     pros:['Largest clinical job market in Australia','Extraordinary coastline and beaches','The most diverse communities in the country'],
     cons:'The most expensive housing in Australia, and traffic that earns its reputation.'},
    {id:'melbourne-au',name:'Melbourne',sub:'Victoria',country:'au',scale:'metro',coast:true,alpine:false,climate:'temperate',scope:'tertiary',cost:'high',
     guide:'/destinations/melbourne-australia',
     pros:['Serious food, culture and sport','Major tertiary centres and teaching hospitals','A well-connected international hub'],
     cons:'Expensive housing; a weather reputation for a reason (four seasons in a day).'},
    {id:'brisbane-au',name:'Brisbane',sub:'Queensland',country:'au',scale:'metro',coast:true,alpine:false,climate:'warm',scope:'tertiary',cost:'mid',
     guide:'/destinations/brisbane-australia',
     pros:['Sun year-round and growing fast','More affordable than Sydney or Melbourne','Gateway to the Gold Coast and the Whitsundays'],
     cons:'Hot and humid in summer. The sprawl can make it feel disconnected.'},
    {id:'perth-au',name:'Perth',sub:'Western Australia',country:'au',scale:'metro',coast:true,alpine:false,climate:'warm',scope:'tertiary',cost:'mid',
     guide:'/destinations/perth-australia',
     pros:['Beaches and outdoor life year-round','Strong WA Health pay and conditions','Grows on people fast — far fewer feel isolated than they expected'],
     cons:'8,000 km from the east coast. Direct flights to the UK make Europe easier than Sydney.'},
    {id:'adelaide-au',name:'Adelaide',sub:'South Australia',country:'au',scale:'city',coast:true,alpine:false,climate:'warm',scope:'tertiary',cost:'low',
     guide:'/destinations/adelaide-australia',
     pros:['Most affordable major city in Australia','Good wine regions, coast and the Flinders Ranges close by','SASMOA conditions are competitive'],
     cons:'Smaller job market. Some feel it is quieter than they expected.'},
    {id:'hobart-au',name:'Hobart',sub:'Tasmania',country:'au',scale:'city',coast:true,alpine:true,climate:'cool',scope:'base',cost:'low',
     guide:'/destinations/hobart-australia',
     pros:['Extraordinary scenery and outdoor life','Cheaper than any mainland capital except Melbourne','A real small-city feel with a big cultural scene (MONA)'],
     cons:'Cold winters. Smaller clinical market. Getting to the mainland takes a flight.'},
    {id:'bunbury-au',name:'Bunbury',sub:'Western Australia',country:'au',scale:'regional',coast:true,alpine:false,climate:'warm',scope:'base',cost:'low',
     guide:'/destinations/bunbury-australia',
     pros:['Affordable coast, 2 hours south of Perth','Warm year-round','Regional designation — migration pathway benefit'],
     cons:'Base hospital rather than tertiary. Social life is Perth-orientated for many.'},
    {id:'geelong-au',name:'Geelong',sub:'Victoria',country:'au',scale:'city',coast:true,alpine:false,climate:'temperate',scope:'base',cost:'mid',
     guide:'/destinations/geelong-australia',
     pros:['An hour from Melbourne on the bay','Growing fast — new hospital investment','A real city feeling without Melbourne prices'],
     cons:'In Melbourne&rsquo;s orbit. The regional health service is expanding but still a step below a major metro centre.'}
  ];
  
  
  var QUESTIONS = '<div class="df" id="dest-finder">\n  <p class="df-intro">Seven questions, about a minute. Change any answer and run it again. If you have already told us your country or who is coming, those are filled in.</p>\n  <div class="df-q"><span class="df-ql">Which country, or are you still deciding?</span>\n    <div class="df-opts" data-q="country">\n      <button class="df-opt" data-v="nz">New Zealand</button>\n      <button class="df-opt" data-v="au">Australia</button>\n      <button class="df-opt" data-v="either">Still deciding</button>\n    </div>\n  </div>\n  <div class="df-q"><span class="df-ql">What kind of place are you imagining?</span>\n    <div class="df-opts" data-q="scale">\n      <button class="df-opt" data-v="metro">A proper city — big services, city life</button>\n      <button class="df-opt" data-v="city">A mid-sized town — still connected, less pressure</button>\n      <button class="df-opt" data-v="regional">Somewhere smaller — community, clinical autonomy</button>\n    </div>\n  </div>\n  <div class="df-q"><span class="df-ql">What matters more for your weekends?</span>\n    <div class="df-opts" data-q="outdoor">\n      <button class="df-opt" data-v="coast">Coast and beaches</button>\n      <button class="df-opt" data-v="alpine">Mountains and outdoors</button>\n      <button class="df-opt" data-v="either">A bit of both</button>\n    </div>\n  </div>\n  <div class="df-q"><span class="df-ql">Climate?</span>\n    <div class="df-opts" data-q="climate">\n      <button class="df-opt" data-v="warm">Warm to hot most of the year</button>\n      <button class="df-opt" data-v="temperate">Mild, four proper seasons</button>\n      <button class="df-opt" data-v="cool">I don&rsquo;t mind cold at all</button>\n    </div>\n  </div>\n  <div class="df-q"><span class="df-ql">Clinical scope?</span>\n    <div class="df-opts" data-q="scope">\n      <button class="df-opt" data-v="tertiary">A big tertiary centre — subspecialty depth</button>\n      <button class="df-opt" data-v="base">A base hospital — broader scope, less hierarchy</button>\n      <button class="df-opt" data-v="either">Happy with either</button>\n    </div>\n  </div>\n  <div class="df-q"><span class="df-ql">How much does housing cost matter?</span>\n    <div class="df-opts" data-q="cost">\n      <button class="df-opt" data-v="low">We need it to be affordable</button>\n      <button class="df-opt" data-v="mid">Somewhere in the middle</button>\n      <button class="df-opt" data-v="fine">It&rsquo;s not our main concern</button>\n    </div>\n  </div>\n  <div class="df-q"><span class="df-ql">Who&rsquo;s coming with you?</span>\n    <div class="df-opts" data-q="hh">\n      <button class="df-opt" data-v="solo">Just me</button>\n      <button class="df-opt" data-v="partner">Me and a partner</button>\n      <button class="df-opt" data-v="children">Me and my children</button>\n      <button class="df-opt" data-v="partner-children">A partner and children</button>\n      <button class="df-opt" data-v="parent">A parent is coming with me</button>\n    </div>\n  </div>\n  <button class="df-run" id="df-run" disabled>Show my suggestions &rarr;</button>\n  <div class="df-out" id="df-out" hidden></div>\n</div>';

  function score(a, dest) {
    var s = 0;
    if (a.country === 'either') s += 1; else if (a.country === dest.country) s += 3;
    if (a.scale === dest.scale) s += 2;
    if (a.outdoor === 'coast' && dest.coast) s += 2; else if (a.outdoor === 'alpine' && dest.alpine) s += 2; else if (a.outdoor === 'either') s += 1;
    if (a.climate && a.climate === dest.climate) s += 2;
    if (a.scope === 'either') s += 0.5; else if (a.scope === dest.scope) s += 1;
    /* who is coming: two careers favour a broader job market; children or a parent lean away from the dearest housing. A nudge, not a verdict. */
    if ((a.hh === 'partner' || a.hh === 'partner-children') && dest.scale === 'metro') s += 1; else if ((a.hh === 'partner' || a.hh === 'partner-children') && dest.scale === 'city') s += 0.5;
    if ((a.hh === 'children' || a.hh === 'partner-children' || a.hh === 'parent') && dest.cost !== 'high') s += 0.5;
    if (a.cost === 'low' && dest.cost === 'low') s += 2; else if (a.cost === 'low' && dest.cost === 'mid') s += 1; else if (a.cost === 'mid' && dest.cost === 'mid') s += 2; else if (a.cost === 'mid' && dest.cost === 'low') s += 1; else if (a.cost === 'fine') s += 0.5;
    return s;
  }

  function mount(host) {
    var fixed = (host.getAttribute('data-country') || '').toLowerCase(); if (fixed !== 'nz' && fixed !== 'au') fixed = '';
    host.innerHTML = QUESTIONS;
    var a = {}, qs = ['country', 'scale', 'outdoor', 'climate', 'scope', 'cost', 'hh'];
    var run = host.querySelector('#df-run'), out = host.querySelector('#df-out');
    run.removeAttribute('id'); out.removeAttribute('id');
    function ready() { run.disabled = qs.some(function (q) { return !a[q]; }); }
    function pick(q, v) {
      var btn = host.querySelector('[data-q="' + q + '"] .df-opt[data-v="' + v + '"]'); if (!btn) return;
      a[q] = v; host.querySelectorAll('[data-q="' + q + '"] .df-opt').forEach(function (b) { b.classList.remove('sel'); }); btn.classList.add('sel'); ready();
    }
    host.querySelectorAll('.df-opt').forEach(function (btn) {
      btn.addEventListener('click', function () { pick(btn.closest('[data-q]').dataset.q, btn.dataset.v); });
    });
    if (fixed) {
      pick('country', fixed);
      var cq = host.querySelector('[data-q="country"]').closest('.df-q'); if (cq) cq.hidden = true;
      var intro = host.querySelector('.df-intro'); if (intro) intro.textContent = 'Six questions, about a minute. Change any answer and run it again.';
    }
    /* prefill from the answers strip, if it is on this device */
    try {
      var C = window.EthicareContext;
      if (C && typeof C.destMode === 'function') {
        var d = C.destMode(), hh = C.household && C.household();
        var dm = { nz: 'nz', au: 'au', both: 'either' }, hm = { alone: 'solo', partner: 'partner', children: 'children', both: 'partner-children', parent: 'parent' };
        if (!fixed && d && dm[d]) pick('country', dm[d]);
        if (hh && hm[hh]) pick('hh', hm[hh]);
      }
    } catch (e) {}
    run.addEventListener('click', function () {
      var ranked = DESTS.slice().sort(function (x, y) { return score(a, y) - score(a, x); });
      var chosen = a.country === 'either' ? ranked : ranked.filter(function (d) { return d.country === a.country; });
      if (chosen.length < 3) chosen = ranked;
      var top3 = chosen.slice(0, 3);
      out.removeAttribute('hidden');
      out.innerHTML = top3.map(function (d, i) {
        return '<div class="df-res' + (i === 0 ? ' first' : '') + '"><span class="df-rank">' + (i + 1) + '</span>'
          + '<div class="df-rbody"><p class="df-rplace">' + d.name + '</p><p class="df-rsub">' + d.sub + '</p>'
          + '<ul class="df-rpros">' + d.pros.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>'
          + '<p class="df-rcons"><strong>The honest bit:</strong> ' + d.cons + '</p>'
          + '<a class="df-rlink" href="' + d.guide + '">Read the ' + d.name + ' guide &rarr;</a></div></div>';
      }).join('') + '<p class="df-note">These are suggestions based on your answers, not a recommendation. Visit if you possibly can &mdash; a week in a place tells you something no page can. If you are torn between two, <a href="/contact">say so</a> &mdash; we have had this conversation many times.</p>';
      try { out.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      try { if (window.track) window.track('destination_finder_run', { country: a.country, top: top3.map(function (d) { return d.id; }).join(',') }); } catch (e) {}
    });
    ready();
  }

  function go() { document.querySelectorAll('[data-destination-finder]').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  window.EthicareFinder = { mount: mount };
})();
