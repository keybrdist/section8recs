/* ---------------- start / end markers per track, with auto fades ----------------
   A start marker jumps playback in with a short fade-in; an end marker fades out over FADE_OUT and moves on.
   The end only fires when playback reaches it on its own, so scrubbing past a marker while adjusting it is safe. */
const FADE_OUT=4, FADE_IN=.6;
const tc=s=>s==null?'':`${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`;
function parseTc(v){v=String(v).trim();if(!v)return null;
  const m=v.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/);const s=m?(+m[1])*60+(+m[2]):(/^\d+(\.\d+)?$/.test(v)?+v:NaN);
  return isFinite(s)&&s>=0?Math.round(s*10)/10:undefined}
const markOf=f=>QS.marks[f]||{};
function fadeLen(m){return Math.min(FADE_OUT,Math.max(.5,(m.out-(m.in??0))/2))}
function setMark(f,which,val){
  if(!f){qToast('Play a track first');return}
  const m={...markOf(f)};if(val==null)delete m[which];else m[which]=Math.round(val*10)/10;
  if(m.in!=null&&m.out!=null&&m.out<=m.in+1){qToast('End must be at least a second after the start');return}
  if(m.in==null&&m.out==null)delete QS.marks[f];else QS.marks[f]=m;
  // an end placed at (or before) the playhead stays inactive until playback is back before it
  if(which==='out'&&val!=null&&f===curFile()&&au.currentTime>=m.out-.5)MK.hold=true;
  qSave();qToast(val==null?`${which==='in'?'Start':'End'} marker cleared`:`${which==='in'?'Start':'End'} set · ${tc(m[which])} · ${trackName(f)}`);
}
const markHere=which=>{const f=curFile();if(f)setMark(f,which,au.currentTime);else qToast('Play a track first')};
function clearMarks(f){if(f&&QS.marks[f]){delete QS.marks[f];qSave();qToast('Start and end cleared')}}

let MK={file:null,last:0,g:1,hold:false,xin:false};
/* crossfade: with an end marker set, the next track comes in XF seconds before the marker while the outgoing one
   finishes its fade on a second player, preloaded a few seconds ahead at the hand-off point */
const XF=3, XF_IN=1.5;
const TL={el:new Audio(),g:null,file:null,at:-1,ready:false,on:false,out:0,fl:FADE_OUT};
TL.el.crossOrigin='anonymous';TL.el.preload='auto';
const curveOut=x=>1-Math.pow(1-Math.max(0,Math.min(1,x)),4);
function tailGain(v){
  if(eng.ctx&&!TL.g){try{const s=eng.ctx.createMediaElementSource(TL.el);TL.g=eng.ctx.createGain();s.connect(TL.g);TL.g.connect(eng.ctx.destination)}catch(e){}}
  if(TL.g)TL.g.gain.setTargetAtTime(v,eng.ctx.currentTime,.02);else TL.el.volume=Math.max(0,Math.min(1,v))}
function tailPrep(f,at){
  if(TL.on||(TL.file===f&&TL.at===at))return;TL.file=f;TL.at=at;TL.ready=false;tailGain(0);
  TL.el.addEventListener('loadedmetadata',()=>{if(TL.file===f){try{TL.el.currentTime=at}catch(e){}}},{once:true});
  TL.el.addEventListener('seeked',()=>{if(TL.file===f&&TL.at===at)TL.ready=true},{once:true});
  TL.el.src=au.currentSrc||au.src}
function tailStop(){TL.on=false;TL.el.pause();TL.file=null;TL.at=-1;TL.ready=false}
function setGain(v){if(Math.abs(v-MK.g)<.002)return;MK.g=v;
  if(eng.gain&&eng.ctx)eng.gain.gain.setTargetAtTime(v,eng.ctx.currentTime,.03);else au.volume=Math.max(0,Math.min(1,v))}
// called by load(): arm the new track, start silent if it has a start marker, then jump to it
function qOnLoad(f){
  MK.file=f;MK.last=0;MK.hold=false;const m=markOf(f);
  MK.g=-1;setGain(m.in!=null||MK.xin?0:1);
  if(m.in!=null){const go=()=>{if(MK.file!==f)return;try{au.currentTime=m.in}catch(e){}MK.last=m.in};
    if(au.readyState>=1)go();else au.addEventListener('loadedmetadata',go,{once:true})}
}
setInterval(()=>{
  // the outgoing half of a crossfade keeps its fade curve on the second player, then stops
  if(TL.on){const tt=TL.el.currentTime;tailGain(curveOut((TL.out-tt)/TL.fl));if(tt>=TL.out||TL.el.ended||(au.paused&&!MK.xin))tailStop()}
  const f=curFile();if(!f||f!==MK.file)return;const m=markOf(f),t=au.currentTime,d=au.duration;
  // seek bar: marker ticks and the trimmed-off regions
  if(isFinite(d)&&d>0){const a=m.in!=null?m.in/d*100:0,b=m.out!=null?m.out/d*100:100;
    const S=$('#seek').style;S.setProperty('--mi',a+'%');S.setProperty('--mo',b+'%');
    $('#seek').classList.toggle('has-in',m.in!=null);$('#seek').classList.toggle('has-out',m.out!=null)}
  if(au.paused){MK.last=t;return}
  let g=1;const natural=t>=MK.last&&t-MK.last<1.2;
  if(m.in!=null&&t>=m.in-.05&&t<m.in+FADE_IN)g=Math.min(g,Math.max(0,(t-m.in)/FADE_IN));
  if(MK.xin){const s0=m.in??0;g=Math.min(g,Math.max(0,(t-s0)/XF_IN));if(t-s0>=XF_IN)MK.xin=false}
  if(MK.hold&&(m.out==null||t<m.out-.5))MK.hold=false;
  if(m.out!=null&&!MK.hold){const fl=fadeLen(m);
    if(t<m.out&&t>=m.out-fl)g=Math.min(g,curveOut((m.out-t)/fl));
    const xs=m.out-Math.min(XF,fl);
    if(t>=xs-6&&t<xs)tailPrep(f,Math.max(0,xs));
    if(TL.ready&&TL.file===f&&!TL.on&&!document.hidden&&t>=xs&&t<m.out&&MK.last<xs&&natural){
      TL.on=true;TL.out=m.out;TL.fl=fl;tailGain(curveOut((m.out-TL.el.currentTime)/fl));TL.el.play().catch(()=>tailStop());
      MK.last=t;MK.xin=true;setGain(0);next();return}
    if(t>=m.out&&MK.last<m.out&&natural){MK.last=t;setGain(0);next();return}}
  MK.last=t;setGain(g);
},40);
