
/* ---------------- lock screen and background playback ----------------
   Playback runs through Web Audio (it feeds the visuals). iOS suspends that context when the screen locks unless the page
   asks for a playback audio session, and after a lock, a call or Siri it can leave it "interrupted" or running but
   silent; the audio element meanwhile keeps counting, so the lock screen showed a moving playhead and no sound. The
   lock screen shows the label's mark, not release artwork. */
if(navigator.audioSession)try{navigator.audioSession.type='playback'}catch(e){}
const ART=[96,192,256,512].map(s=>({src:`/assets/s8-${s}.png`,sizes:`${s}x${s}`,type:'image/png'}));
const BG={broke:false,held:false};
// bring a suspended or interrupted context back; cycle it when it may be running but silent
function wake(cycle){const c=eng.ctx;if(!c||c.state==='closed')return Promise.resolve();
  if(c.state!=='running')return c.resume().catch(()=>{});
  return cycle?c.suspend().then(()=>c.resume()).catch(()=>{}):Promise.resolve()}
eng.onstate=()=>{const s=eng.ctx.state;if(s==='running')return;BG.broke=true;
  // try to carry on; if the context will not run (older iOS without the playback session), pause rather than play silence
  wake().then(()=>setTimeout(()=>{if(eng.ctx.state!=='running'&&!au.paused){BG.held=true;au.pause()}},600))};
function back(){if(document.hidden)return;const held=BG.held,cycle=BG.broke&&!au.paused;BG.broke=false;BG.held=false;
  wake(cycle).then(()=>{if(held)au.play().catch(()=>{})})}
document.addEventListener('visibilitychange',back);addEventListener('pageshow',back);addEventListener('focus',back);
if('mediaSession' in navigator){const ms=navigator.mediaSession;
  const act=(a,f)=>{try{ms.setActionHandler(a,f)}catch(e){}};
  act('play',()=>{eng.ensure();BG.held=false;wake().then(()=>au.play()).catch(()=>{})});
  act('pause',()=>au.pause());
  act('seekto',d=>{if(d.seekTime!=null&&isFinite(au.duration))au.currentTime=Math.min(au.duration,d.seekTime)});
  act('seekbackward',d=>{au.currentTime=Math.max(0,au.currentTime-(d.seekOffset||10))});
  act('seekforward',d=>{if(isFinite(au.duration))au.currentTime=Math.min(au.duration,au.currentTime+(d.seekOffset||10))});
  au.addEventListener('play',()=>{ms.playbackState='playing'});au.addEventListener('pause',()=>{ms.playbackState='paused'});
  let lastPos=0;au.addEventListener('timeupdate',()=>{const n=performance.now();if(n-lastPos<1000||!isFinite(au.duration)||!ms.setPositionState)return;lastPos=n;
    try{ms.setPositionState({duration:au.duration,position:Math.min(au.duration,au.currentTime),playbackRate:au.playbackRate||1})}catch(e){}})}
