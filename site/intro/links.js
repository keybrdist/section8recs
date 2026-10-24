(()=>{const g=document.getElementById('gate');if(!g)return;
  g.addEventListener('scroll',()=>g.classList.toggle('scrolled',g.scrollTop>40),{passive:true});
  document.getElementById('gTop').addEventListener('click',()=>g.scrollTo({top:0,behavior:'smooth'}));
  document.querySelector('.g-cue').addEventListener('click',e=>{e.preventDefault();document.getElementById('links').scrollIntoView({behavior:'smooth'})});
})();
