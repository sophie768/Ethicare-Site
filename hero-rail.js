/* ==========================================================================
   ETHICARE RESOURCING — hero credentials rail, "right now" slot.
   Reads the live vacancy list (jobs-data.js) and writes an honest count
   into the hero rail. No hand-typed numbers: add or remove a role in
   jobs-data.js and every profession hero updates itself.
   Load AFTER jobs-data.js (bottom of <body>).
   ========================================================================== */
(function(){
  var slots=document.querySelectorAll('[data-roles]');
  if(!slots.length)return;
  var jobs=window.ETHICARE_JOBS||[];
  for(var i=0;i<slots.length;i++){
    var el=slots[i];
    var prof=el.getAttribute('data-prof');
    var country=el.getAttribute('data-country')||'';
    var n=jobs.filter(function(j){
      if(j.profession!==prof)return false;
      if(!country)return true;
      /* prefer the record's own country; fall back to location text. Must stay identical
         to live-roles.js or the rail and the cards contradict each other on screen. */
      return j.country?j.country===country:(j.location||'').indexOf(country)>-1;
    }).length;
    var label,href;
    if(n>0){label=n+(n===1?' live role':' live roles');href='#vacancy';}
    else{label='Register your interest';href='/apply';}
    el.setAttribute('href',href);
    el.innerHTML='';
    el.appendChild(document.createTextNode(label));
    var ar=document.createElement('span');
    ar.className='ar';ar.setAttribute('aria-hidden','true');ar.textContent='\u2192';
    el.appendChild(ar);
  }
})();
