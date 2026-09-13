/* Ethicare — profession card numerals. Per the premium audit (item 4): no icon chips.
   Each card in a grid gets an editorial numeral set large in the display face, numbered
   within its own grid. Enhancement only; no-JS just shows the card without a numeral. */
(function(){
  var css=[
    '.gcard .cnum{font-family:"Work Sans",ui-sans-serif,system-ui,sans-serif;font-weight:600;',
    'font-size:26px;line-height:1;letter-spacing:-.02em;color:#02615D;opacity:.34;',
    'display:block;margin:0 0 14px;font-variant-numeric:tabular-nums}',
    '.why4 .gcard .cnum,.quiet .gcard .cnum{font-size:30px;opacity:.28;margin-bottom:16px}',
    '@media(max-width:560px){.gcard .cnum{font-size:23px;margin-bottom:11px}}'
  ].join('');
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  function run(){
    // clear any legacy icon chips, then number each grid independently
    document.querySelectorAll('.cic').forEach(function(c){ c.remove(); });
    document.querySelectorAll('.cards:not(.nonum),.why4,.quiet').forEach(function(grid){
      var n=0;
      grid.querySelectorAll(':scope > .gcard').forEach(function(card){
        if(card.querySelector('.cnum')) return;
        n++;
        var num=document.createElement('span');
        num.className='cnum';
        num.setAttribute('aria-hidden','true');
        num.textContent=(n<10?'0':'')+n;
        card.insertBefore(num, card.firstChild);
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
