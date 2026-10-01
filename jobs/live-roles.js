/* ==========================================================================
   ETHICARE RESOURCING — "Current opportunities" on a profession page.
   ONE renderer for all 14 profession pages. Reads jobs-data.js and shows only
   the roles matching BOTH the container's data-profession AND its data-country.

   Why this file exists: the renderer used to be inlined on every page, and the
   nine New Zealand copies never got the country filter the five Australian ones
   had — so NZ pages advertised Australian vacancies while their own hero rail
   correctly said there were none. Same class of bug as the font:/margin:/URL
   sweeps: a hand-picked file set. One file cannot diverge from itself.

   Country match prefers the record's own country field and falls back to a
   location substring, which is exactly what hero-rail.js does — the two must
   always agree, or the rail and the cards contradict each other on screen.
   Load AFTER jobs-data.js.

   THREE STATES, AND WHY (Aug 2026)
   The weakness on a thin profession page was never the empty state — it was the
   state of ONE. A single card inside a grid built for several reads as "that is
   all they have"; the same role presented deliberately reads as curated. So one
   role now gets a feature treatment, not a list of one.

   The other half of the problem was the heading. Every page hard-codes a plural
   lead-in ("Roles we're recruiting for now", "Current opportunities") which is
   written before anyone knows the count, so a plural promise sat above one card
   or above an empty panel. This renderer therefore rewrites the section h2 and
   .lead for the none and one cases and leaves them alone for two or more, where
   the authored copy is already correct. NEVER print the count: a number invites
   comparison and is what made one role look weak. Name the profession and the
   place instead — "recruiting a sonographer in Canterbury" is the same fact with
   none of the thinness.

   DO NOT ADD CTAs TO THESE CARDS. Every profession page authors its own button
   row immediately after #live-roles — "View all vacancies" → /jobs/ and
   "Register your interest" → /apply — and that row is outside this file's
   control. The first cut of the three-state work duplicated both, so an empty
   state showed four buttons pointing at two destinations. A card here may only
   add a link the authored row does not already provide: the role's own detail
   page. Nothing else.
   ========================================================================== */
(function(){
  var el=document.getElementById('live-roles');
  if(!el)return;
  /* data-profession takes ONE profession label, or several separated by "|" — the discipline
     pages (allied health, medical imaging, theatre) cover a family rather than a single
     profession, and the alternative was a second renderer, which is how the country filter
     came to be missing from nine pages in the first place. Labels must match jobs-data.js
     exactly; an unknown label simply matches nothing and the none state renders. */
  var profs=(el.getAttribute('data-profession')||'').split('|').map(function(s){return s.replace(/^\s+|\s+$/g,'');}).filter(Boolean);
  var country=el.getAttribute('data-country')||'';
  var jobs=(window.ETHICARE_JOBS||[]).filter(function(j){
    if(profs.indexOf(j.profession)===-1)return false;
    if(!country)return true;
    return j.country?j.country===country:(j.location||'').indexOf(country)!==-1;
  });
  var isAU=country==='Australia';
  var accent=isAU?'#D9A084':'#72A471';
  var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fc(iso){var d=new Date(iso+'T00:00:00');return d.getDate()+' '+M[d.getMonth()]+' '+d.getFullYear();}
  function an(w){return /^[aeiou]/i.test(w)?'an ':'a ';}

  /* Rewrite the section's authored heading only where it would otherwise
     promise a plural the body cannot deliver. Guarded: if a page ever stops
     using .lead or h2 here, nothing breaks, the copy simply stays as authored. */
  var sec=el.closest?el.closest('section'):null;
  function reframe(head,sub){
    if(!sec)return;
    var h=sec.querySelector('h2'); if(h&&head)h.textContent=head;
    var l=sec.querySelector('p.lead'); if(l&&sub)l.innerHTML=sub;
  }

  /* NO RESULT IS NOT A DEAD END (candidate-journey review §10, 14 Sep 2026). The client copy
     above says we can still be useful; this row says HOW, with the three things a candidate can
     do today that the authored button row below does not already offer (that row is /jobs/ and
     /apply, and this file may not duplicate them). Check my pathway carries THIS page's
     profession and country — read from the element's own data attributes, so it is always
     right for the page — and the shared reader upgrades it further when a Move plan exists. */
  var PATHWAY_ID={'Radiographer':'radiographer','Sonographer':'sonographer','Radiation Therapist':'radiation-therapist','Nuclear Medicine Technologist':'nuclear-medicine','Mammographer':'radiographer','Psychologist':'psychologist','Physiotherapist':'physiotherapist','Occupational Therapist':'occupational-therapist','Anaesthetic Technician':'anaesthetic-technician'};
  function onward(){
    var pid=profs.length===1?PATHWAY_ID[profs[0]]:'';
    var pw='/pathway-checker'+(pid?'?profession='+pid:'')+(country?(pid?'&':'?')+'destination='+(isAU?'australia':'new-zealand'):'');
    var places=isAU?'/destinations/australia':'/destinations/';
    var lk='font-family:var(--display),sans-serif;font-weight:600;font-size:15px;color:var(--teal,#02615D);text-decoration:underline;text-decoration-color:'+accent+';text-underline-offset:3px;display:inline-flex;align-items:center;min-height:24px';
    return '<p style="font-family:var(--display),sans-serif;font-weight:600;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#555);margin:22px 0 8px">While you wait</p>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px 22px">'
      +'<a href="'+pw+'" data-ctx-link style="'+lk+'">Check my pathway</a>'
      +'<a href="'+places+'" style="'+lk+'">Explore where you could live</a>'
      +'<a href="/move" style="'+lk+'">Build my journey</a>'
      +'</div>';
  }

  if(!jobs.length){
    /* THE NONE STATE IS NOT AN APOLOGY — client copy, 28 Aug 2026, used verbatim.
       Full profession coverage means pages exist for professions we do not yet recruit into.
       It lives HERE rather than being typed onto the pages that currently have no roles,
       because vacancies change — hard-coding "no vacancies" onto a page is a drift bug waiting
       for the day a role lands. Rendered only when the filter genuinely returns nothing.
       The closing line is deliberately NOT a link: the page's own button row sits immediately
       below with "Register your interest" → /apply, and an earlier cut of this file shipped an
       empty state with four buttons pointing at two destinations. One copy for both countries —
       the client wording already spans Australia and New Zealand, so there is no country fork
       here to drift. */
    reframe('Nothing in this profession today.',
      'We don&rsquo;t currently have opportunities in this profession, but that doesn&rsquo;t mean we can&rsquo;t be useful.');
    /* The mug carries the "brewing" line so the heading does not need an emoji. Grid, not a
       float: at 520px the image drops above the copy on its own with no breakpoint. The PNG is
       alpha, so it sits on the white panel without a plate. src is RELATIVE, not root-relative:
       this file is only ever loaded by pages in site/jobs/ served at /jobs/<slug>, where file
       depth equals URL depth, so ../assets/ resolves both in preview and on the deploy —
       /assets/ only works on the deploy. */
    el.innerHTML='<div style="background:#fff;border:1px solid var(--mint,#C9DED3);border-top:3px solid '+accent+';border-radius:20px;padding:28px 30px;display:flex;flex-wrap:wrap;gap:12px clamp(20px,3vw,36px);align-items:flex-start">'
      +'<img src="../assets/brewing-tea-190.png" alt="" width="380" height="347" loading="lazy" decoding="async" style="flex:0 0 auto;width:clamp(120px,18vw,180px);height:auto">'
      +'<div style="flex:1 1 320px;min-width:0">'
      +'<p style="font-size:16.5px;line-height:1.65;color:var(--text,#333);margin:0 0 16px;max-width:58ch">We&rsquo;re constantly expanding our network across Australia and New Zealand and we&rsquo;re always happy to hear from healthcare professionals considering a move.</p>'
      +'<p style="font-size:16.5px;line-height:1.65;color:var(--text,#333);margin:0 0 16px;max-width:58ch">Sometimes we know a department that&rsquo;s about to recruit. Sometimes we know exactly the person you should speak to. And sometimes the most useful thing we can do is simply point you in the right direction.</p>'
      +'<p style="font-family:var(--display),sans-serif;font-weight:600;font-size:17px;line-height:1.5;color:var(--teal,#02615D);margin:0;max-width:52ch">So please don&rsquo;t wait for a vacancy to say hello.</p>'
      +onward()
      +'</div></div>';
    return;
  }

  if(jobs.length===1){
    var j=jobs[0];
    var one=j.types.map(function(t){
      return '<span style="font-family:var(--display),sans-serif;font-weight:600;font-size:12.5px;color:var(--green,#2F5E49);background:var(--soft,#E3ECE5);border-radius:999px;padding:6px 13px">'+t+'</span>';
    }).join(' ');
    reframe('Currently recruiting','We are recruiting '+an(j.title)+j.title.toLowerCase()+' in '+j.location+'. If it is not quite right, tell us what you are looking for &mdash; we hear about new roles constantly, and often before they are advertised.');
    el.innerHTML='<article style="background:#fff;border:1px solid var(--mint,#C9DED3);border-top:4px solid '+accent+';border-radius:20px;padding:34px 36px">'
      +'<h3 style="font-family:var(--display),sans-serif;font-weight:600;font-size:26px;line-height:1.24;letter-spacing:-.01em;color:var(--teal,#02615D);margin:0 0 8px"><a href="'+j.detail+'" style="color:var(--teal,#02615D)">'+j.title+'</a></h3>'
      +'<div style="font-family:var(--display),sans-serif;font-weight:600;font-size:15px;color:var(--muted,#555);margin-bottom:16px">'+j.location+' &middot; '+j.sector+'</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">'+one+'</div>'
      +'<p style="font-size:16.5px;line-height:1.65;color:var(--text,#333);margin:0 0 24px;max-width:60ch">'+j.summary+'</p>'
      +'<div style="border-top:1px solid var(--mint,#C9DED3);padding-top:22px">'
      +'<div style="font-family:var(--display),sans-serif;font-weight:600;font-size:12.5px;color:var(--muted,#555);margin-bottom:16px">'+(j.closes?('Closes '+fc(j.closes)):('Posted '+fc(j.posted)))+'</div>'
      +'<a href="'+j.detail+'" style="display:inline-flex;align-items:center;gap:8px;min-height:48px;font-family:var(--display),sans-serif;font-weight:600;font-size:16px;color:#fff;background:var(--teal,#02615D);padding:13px 24px;border-radius:12px">View this role <span aria-hidden="true">&rarr;</span></a>'
      +'</div></article>';
    return;
  }

  el.innerHTML=jobs.map(function(j){
    var chips=j.types.map(function(t){
      return '<span style="font-family:var(--display);font-weight:600;font-size:12px;color:var(--green);background:var(--soft);border-radius:999px;padding:5px 12px">'+t+'</span>';
    }).join(' ');
    return '<article style="background:#fff;border:1px solid var(--mint);border-left:5px solid '+accent+';border-radius:20px;padding:24px 26px">'
      +'<h3 style="font-size:20px;color:var(--teal);margin-bottom:5px"><a href="'+j.detail+'" style="color:var(--teal)">'+j.title+'</a></h3>'
      +'<div style="font-family:var(--display);font-weight:600;font-size:13.5px;color:var(--muted);margin-bottom:12px">'+j.location+' &middot; '+j.sector+'</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:13px">'+chips+'</div>'
      +'<p style="font-size:14.5px;line-height:1.6;color:var(--text);margin:0 0 16px">'+j.summary+'</p>'
      +'<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid var(--mint);padding-top:14px">'
      +'<span style="font-family:var(--display);font-weight:600;font-size:12.5px;color:var(--muted)">'+(j.closes?('Closes '+fc(j.closes)):('Posted '+fc(j.posted)))+'</span>'
      +'<a href="'+j.detail+'" style="font-family:var(--display);font-weight:600;font-size:14px;color:#fff;background:var(--teal);padding:9px 16px;border-radius:12px">View role &rarr;</a>'
      +'</div></article>';
  }).join('');
})();
