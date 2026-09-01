/* Scrollspy for the legal & policy page sidebar (privacy policy, how we use your
   information, modern slavery, EDI). Lives here rather than inline so the four
   pages cannot drift apart — legal.css carries the matching .active styles. */
(function(){
  var links=[].slice.call(document.querySelectorAll('.legal-toc a'));
  if(!links.length||!('IntersectionObserver' in window))return;
  var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
  var secs=[].slice.call(document.querySelectorAll('.legal-content section[id]'));
  if(!secs.length)return;
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.classList.remove('active');});if(map[e.target.id])map[e.target.id].classList.add('active');}});
  },{rootMargin:'-38% 0px -55% 0px',threshold:0});
  secs.forEach(function(s){io.observe(s);});
})();
