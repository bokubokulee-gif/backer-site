/* Native-scroll presentation only. No tracking, fetching, or simulation computation. */
(function () {
  'use strict';
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var progress=document.createElement('div'); progress.className='sim-reading-progress';progress.setAttribute('aria-hidden','true');
  document.body.appendChild(progress);
  var pending=false;
  function update(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;var distance=document.documentElement.scrollHeight-window.innerHeight;progress.style.transform='scaleX('+(distance>0?Math.min(1,Math.max(0,window.scrollY/distance)):0)+')';var story=document.querySelector('.story-grid');if(story){var opening=reduced.matches?0:Math.min(1,Math.max(0,(story.getBoundingClientRect().top-70)/(window.innerHeight*.75)));story.style.setProperty('--story-opening',opening.toFixed(3));}});}
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
  if(!('IntersectionObserver' in window)||reduced.matches)return;
  var selectors='.section-intro,.definition-layout,.eval-layout,.world-links>a,.overview-closing,.uc-framing,.uc-study-heading,.uc-evidence,.uc-next';
  var elements=Array.from(document.querySelectorAll(selectors));
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}});},{threshold:0.09,rootMargin:'0px 0px -30px 0px'});
  elements.forEach(function(el){
    // Progressive enhancement: content is present and visible before this script loads.
    if(el.getBoundingClientRect().top<window.innerHeight){el.classList.add('is-revealed');return;}
    el.classList.add('sim-reveal');observer.observe(el);
  });
  document.addEventListener('focusin',function(e){var el=e.target.closest('.sim-reveal');if(el)el.classList.add('is-revealed');});
  function revealAll(){if(reduced.matches){elements.forEach(function(el){el.classList.add('is-revealed');});observer.disconnect();}}
  if(reduced.addEventListener)reduced.addEventListener('change',revealAll);
}());
