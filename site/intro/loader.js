
/* loading bar: the gate is up at once, but the forest needs the app and three.js downloaded, the tree atlas grown and the
   first scene's shader compiled before the enter buttons work. The bar eases toward each stage's mark with a transform
   transition, which runs on the compositor and keeps moving while the main thread is busy compiling. */
window.S8L=(()=>{
  const bar=document.getElementById('gLoad'),fill=bar&&bar.firstElementChild,st=document.getElementById('gSt');
  let at=0,over=false,slow;
  const say=t=>{if(st)st.innerHTML=t+'<span class="cursor"></span>'};
  // ease toward a mark over ms; the next stage takes over from wherever the bar has got to
  const to=(p,ms,label)=>{if(over||!fill)return;at=Math.max(at,p);fill.style.transition=`transform ${ms}ms cubic-bezier(.2,.6,.2,1)`;
    fill.style.transform=`scaleX(${at})`;bar.setAttribute('aria-valuenow',Math.round(at*100));if(label)say(label)};
  const stage=(name)=>{const s={app:[.62,9000,'Growing the tree line'],trees:[.8,7000,'Lighting the forest'],light:[.93,9000,'Lighting the forest']}[name];if(s)to(...s)};
  const done=()=>{if(over)return;to(1,350,'Signal acquired');over=true;clearTimeout(slow);
    setTimeout(()=>{document.body.classList.remove('loading');bar&&bar.setAttribute('aria-hidden','true')},380)};
  const lost=()=>{if(over)return;over=true;document.body.classList.add('load-lost');say('Signal lost · reload to try again')};
  // downloading: drift toward a third while the app and three.js arrive
  requestAnimationFrame(()=>to(.36,7000,'Tuning in'));
  slow=setTimeout(()=>{if(!over)say('Weak signal · still tuning in')},25000);
  document.querySelector('script[type="module"][src]')?.addEventListener('error',lost);
  return {stage,done,lost};
})();
