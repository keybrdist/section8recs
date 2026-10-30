
/* ---------------- routes: each page names what it shows (#s8-route); entering plays it, and the address follows the
   release on air so it can be shared ---------------- */
const ROUTE=(()=>{try{return JSON.parse($('#s8-route')?.textContent||'{}')}catch(e){return {}}})();
/* share addresses: ?track=<n> (counted from 1), ?t= where it starts (90, 1:30 or 1m30s) and ?scene= the scene, by its
   number in the scene menu or its id, pinned as if picked there. Until 2026-10-30 ?t=<n> named the track; without
   ?track, a bare ?t no greater than the release's track count still does. Parsed the same way for link previews in
   src/lib/share.mjs, so keep the two in step. */
const Q=new URLSearchParams(location.search);
function secs(v){if(v==null||v==='')return null;if(/^\d+(\.\d+)?s?$/.test(v))return parseFloat(v);
  const m=v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);if(m)return (+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0);
  if(/^\d+(:\d{1,2}){1,2}$/.test(v))return v.split(':').reduce((a,x)=>a*60+ +x,0);return null}
const legacyT=r=>!Q.has('track')&&/^\d+$/.test(Q.get('t')||'')&&+Q.get('t')>=1&&+Q.get('t')<=r.tr.length;
// where a page starts: a release page on its track or its first, an artist page on their latest release
function routeStart(){
  const r=BY[ROUTE.c];if(!r)return null;
  const n=Q.has('track')?parseInt(Q.get('track'),10):legacyT(r)?+Q.get('t'):1;return [r.c,n>=1&&n<=r.tr.length?n-1:0];
}
const routeT=()=>{const r=BY[ROUTE.c],t=r&&!legacyT(r)?secs(Q.get('t')):null;return t>=1?t:null};
function routeScene(){const v=(Q.get('scene')||'').toLowerCase();if(/^\d+$/.test(v))return +v>=1&&+v<=SCENES.length?+v-1:null;
  const i=SCENES.findIndex(s=>s.id===v);return v&&i>=0?i:null}
// the address's start time, once the track it names has loaded (after any start marker of the queue's)
function routeSeek(){const t=routeT(),f=curFile();if(t==null)return;
  const go=()=>{if(curFile()!==f)return;try{au.currentTime=Math.min(t,(au.duration||t+2)-1)}catch(e){}MK.last=au.currentTime};
  if(au.readyState>=1)go();else au.addEventListener('loadedmetadata',go,{once:true})}
// the address follows what is on air (set on play): the release, its track and a pinned scene, so it can be shared as it
// is; the module keeps its own play history, so the browser's is window.history
function syncUrl(c){const p=`/cat/${c}`,q=new URLSearchParams(location.pathname===p?location.search:'');
  q.delete('t');q.delete('track');q.delete('scene');if(cur.i)q.set('track',cur.i+1);if(pinned!=null)q.set('scene',pinned+1);
  const s=q.toString(),u=p+(s?'?'+s:'');if(location.pathname+location.search!==u)window.history.replaceState(null,'',u)}
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
