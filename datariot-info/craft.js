/* Short, one-time section entrances; content remains visible without JS. */
(() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const keyboard = event => { if(event.key === 'Tab') document.documentElement.classList.add('craft-keyboard'); };
 document.addEventListener('keydown', keyboard);
 document.querySelectorAll('.hx-join,.dc-join,.dt-dev__copy,.navx-trigger').forEach(el => el.classList.add('craft-primary'));
 const candidates = [...document.querySelectorAll('.feed-stage__shell,.reply-network__head,.dt-dev__wrap,.orvelis-reading__wrap,.dc-inner,.faq__head')];
 if(!reduced.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
   entries.forEach(entry => {
    if(entry.isIntersecting) {entry.target.removeAttribute('data-craft-pending');observer.unobserve(entry.target);}
   });
  }, {threshold:0.08});
  candidates.forEach(el => {
   if(el.getBoundingClientRect().top > innerHeight) {
    el.classList.add('craft-enter');el.setAttribute('data-craft-pending','');observer.observe(el);
   }
  });
  reduced.addEventListener('change', () => {
   if(reduced.matches) {candidates.forEach(el=>el.removeAttribute('data-craft-pending'));observer.disconnect();}
  });
 }
 document.addEventListener('keydown',event => {
  if(event.key === 'Tab') candidates.forEach(el => el.removeAttribute('data-craft-pending'));
 });
})();
