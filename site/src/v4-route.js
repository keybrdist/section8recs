
/* ---------------- routes: each page names what it shows (#s8-route); entering plays it, and the address follows the
   release on air so it can be shared ---------------- */
const ROUTE=(()=>{try{return JSON.parse($('#s8-route')?.textContent||'{}')}catch(e){return {}}})();
// where a page starts: a release page on its track (?t=<n>, counted from 1) or its first, an artist page on their latest release
function routeStart(){
  const r=BY[ROUTE.c];if(!r)return null;
  const t=+new URLSearchParams(location.search).get('t');return [r.c,t>=1&&t<=r.tr.length?t-1:0];
}
// the address follows the release on air (set on play); the module keeps its own play history, so the browser's is window.history
function syncUrl(c){const p=`/cat/${c}`;if(location.pathname!==p)window.history.replaceState(null,'',p)}
// track buttons on the page itself (release tracklists) enter the experience on that track
$('#gate').addEventListener('click',e=>{const b=e.target.closest('[data-play]');if(!b)return;e.preventDefault();const [c,i]=b.dataset.play.split(':');enter(true,[c,+i])});

/* release pages skip the gate: once the forest is ready they enter by themselves on the page's track and try to play.
   A browser that refuses sound without a gesture (always on iPhone) gets a "tap to play" cue, and the first tap or click
   anywhere but a control starts it, opening the audio context inside that gesture, or iOS stays silent. The release's
   details stay on the page below the gate, and Release info in the now-playing block reopens the gate on them. */
const AUTO=ROUTE.view==='release'&&!!BY[ROUTE.c];
function awaitTap(on){document.body.classList.toggle('await-tap',on);const c=$('#tapCue');c.hidden=!on;
  if(on)c.lastChild.textContent=matchMedia('(hover:hover) and (pointer:fine)').matches?'Click to play':'Tap to play'}
function tapPlay(){eng.ensure();eng.resume();au.play().catch(()=>{})}
// someone who has scrolled down to read the release while it loaded keeps the gate, with its enter buttons
function routeReady(){if(AUTO)setTimeout(()=>{if(!entered&&!$('#gate').classList.contains('scrolled'))autoPlay()},400)}
function autoPlay(){enter(false);
  au.play().then(()=>setTimeout(()=>{if(eng.ctx&&eng.ctx.state!=='running'){au.pause();awaitTap(true)}},300),()=>awaitTap(true))}
au.addEventListener('play',()=>awaitTap(false));
$('#tapCue').onclick=tapPlay;
{const CTL='button,a,input,select,[role="button"],[role="slider"],#index,#qpanel,#srch,#sceneMenu,#ctx,#favDlg,#gate';let t0=null;
  // a tap is a touch that barely moves; it stops there, so it neither swipes nor hides the controls (site/src/v4-mobile.js)
  addEventListener('touchstart',e=>{t0=document.body.classList.contains('await-tap')&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{capture:true,passive:true});
  addEventListener('touchend',e=>{const s=t0,c=e.changedTouches[0];t0=null;if(!s||!document.body.classList.contains('await-tap')||e.target.closest(CTL))return;
    if(Math.hypot(c.clientX-s.x,c.clientY-s.y)>=10)return;e.stopPropagation();if(e.cancelable)e.preventDefault();tapPlay()},{capture:true});
  addEventListener('click',e=>{if(document.body.classList.contains('await-tap')&&!e.target.closest(CTL))tapPlay()});
}
$('#npInfo').addEventListener('click',e=>{if(!cur.r||cur.r.c!==ROUTE.c||!$('#release')||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();openGate('#release')});
addEventListener('keydown',e=>{if(e.key==='Escape'&&entered&&document.body.classList.contains('gated'))closeGate(false)});
