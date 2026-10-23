applyProfile(LABEL,true);S.amtA=0;

/* ---------------- toggles, keys, scene picker, gate ---------------- */
function setCalm(v){calm=v;document.body.classList.toggle('calm',v);$('#fxBtn').setAttribute('aria-pressed',!v);$('#fxLbl').textContent=v?'Calm':'Full';
  document.documentElement.style.setProperty('--scanO',v?P.scanO*.6:P.scanO);if(v){G.amt=0;S.inv=0;G.irT=0}}
setCalm(calm);
$('#fxBtn').onclick=()=>setCalm(!calm);
$('#driftBtn').onclick=()=>{drift=!drift;$('#driftBtn').setAttribute('aria-pressed',drift)};
// auto-cut: loud passages cut between scenes on the beat; off by default, remembered per browser
let autoCut=(()=>{try{return localStorage.getItem('s8.autocut')==='1'}catch(e){return false}})();
function setAutoCut(v){autoCut=v;$('#cutBtn').setAttribute('aria-pressed',v);try{localStorage.setItem('s8.autocut',v?'1':'0')}catch(e){}if(!v)CY.next=0}
setAutoCut(autoCut);$('#cutBtn').onclick=()=>setAutoCut(!autoCut);
(()=>{
  const m=$('#sceneMenu');
  m.innerHTML='<button role="menuitemradio" data-sc="auto" aria-checked="true"><span class="n">∞</span><span class="t">Auto<em>Albums and the queue pick a scene; with Auto-cut on, loud passages also cut between scenes</em></span></button>'
    +SCENE_GROUPS.map(gn=>`<div class="grp mono">${esc(gn)}</div>`+SCENES.map((s,i)=>s.g!==gn?'':`<button role="menuitemradio" data-sc="${i}" aria-checked="false"><span class="n">${pad(i+1)}</span><span class="t">${esc(s.name)}<em>${esc(s.note)}</em></span></button>`).join('')).join('');
  const open=o=>{m.classList.toggle('open',o);$('#sceneBtn').setAttribute('aria-expanded',o)};
  $('#sceneBtn').onclick=e=>{e.stopPropagation();open(!m.classList.contains('open'))};
  m.addEventListener('click',e=>{const b=e.target.closest('[data-sc]');if(!b)return;
    if(b.dataset.sc==='auto'){pinned=null;setScene(P.scene)}else setScene(+b.dataset.sc,true);open(false)});
  document.addEventListener('click',e=>{if(!e.target.closest('#sceneMenu'))open(false)});
  sceneUI();
})();
addEventListener('keydown',e=>{
  if(e.target.closest('input'))return;if(document.body.classList.contains('gated'))return;
  if(e.code==='Space'&&!e.target.closest('button')){e.preventDefault();toggle()}
  else if(e.key==='ArrowRight'&&!e.target.closest('.seek'))next();else if(e.key==='ArrowLeft'&&!e.target.closest('.seek'))prev();
  else if(e.key===']')setScene((deck.cur.si+1)%SCENES.length,true);else if(e.key==='[')setScene((deck.cur.si+SCENES.length-1)%SCENES.length,true);
  else if(e.key==='i'||e.key==='I')openIndex();else if(e.key==='d'||e.key==='D')$('#driftBtn').click();else if(e.key==='f'||e.key==='F')setCalm(!calm);else if(e.key==='c'||e.key==='C')setAutoCut(!autoCut);
  else if(e.key==='Escape'){openIndex(false);$('#sceneMenu').classList.remove('open')}
});
addEventListener('pointermove',e=>{const x=e.clientX/innerWidth*2-1,y=-(e.clientY/innerHeight*2-1);mouse.mv=(mouse.mv||0)+Math.hypot(x-mouse.x,y-mouse.y);mouse.x=x;mouse.y=y});
function enter(withSound){
  $('#gate').classList.add('gone');document.body.classList.remove('gated');acquire();lastSceneT=performance.now()/1000;
  if(withSound){load(...firstTrack())}else{note([{t:'ARCHIVE OPENED · SECTION 8 RECORDINGS',c:'acc'},'139 RECORDINGS · 467 SEGMENTS · 2007—2020',{t:'NO AUDIO SIGNAL. PRESS PLAY.',c:'dim'}])}
}
$('#enterSound').onclick=()=>enter(true);$('#enterQuiet').onclick=()=>enter(false);
(()=>{const st=['Signal acquired','Listening','Tree line: movement','Stay on the path'];let i=0;setInterval(()=>{if(document.body.classList.contains('gated')){i=(i+1)%st.length;
  const el=$('#gSt');scramble(el,st[i].toUpperCase(),500);setTimeout(()=>{if(!el.querySelector('.cursor'))el.insertAdjacentHTML('beforeend','<span class="cursor"></span>')},520)}},3200)})();

/* ---------------- main loop ---------------- */
let last=performance.now(),t0=last,frames=0,acc=0,sigT=0,gateFrames=0;
const lerp=(a,b,k)=>a+(b-a)*k;
const nz=(t,f,ph)=>Math.sin(t*f+ph)*.6+Math.sin(t*f*2.3+ph*1.7)*.3+Math.sin(t*f*5.1+ph*.3)*.1;
const EL={mL:$('#mL'),mM:$('#mM'),mH:$('#mH'),sf:$('#seekFill'),sh:$('#seekHead'),sk:$('#seek'),tm:$('#time'),ir:$('#ir'),tc:$('#tapeTC'),
  fl0:$('#flirTL'),fl1:$('#flirA'),fl2:$('#flirB'),fl3:$('#flirTrk'),en:$('#energy')};
// The field: every 2-3 minutes on screen the craft comes in up to 30% closer; moving the cursor makes it lean toward it and edge in
const FX={ft:0,next:rand(120,180),t0:-1e9,amp:0,hold:0,act:0,hov:0,tilt:0,s:1};
// FLIR gimbal: now and then the object drops back to a longer range, then returns
const GX={gt:0,next:rand(20,40),t0:-1e9,d:0,hold:0,s:1};
const ssJ=(a,b,x)=>{const q=Math.min(1,Math.max(0,(x-a)/(b-a)));return q*q*(3-2*q)};
function tickApproach(dt){
  const id=SCENES[deck.cur.si].id;
  FX.act=Math.min(1,FX.act*Math.exp(-dt*.8)+(mouse.mv||0)*.8);mouse.mv=0;
  FX.hov=lerp(FX.hov,FX.act,1-Math.exp(-dt*1.5));
  if(id==='field'){FX.ft+=dt;if(FX.ft>=FX.next){FX.t0=FX.ft;FX.amp=rand(.2,.28);FX.hold=rand(8,14);FX.next=FX.ft+rand(120,180)}}
  const u=FX.ft-FX.t0;FX.s=Math.min(1.3,1+FX.amp*ssJ(0,8,u)*(1-ssJ(8+FX.hold,18+FX.hold,u))+.1*FX.hov);
  const asp=innerWidth/innerHeight;FX.tilt=lerp(FX.tilt,Math.max(-.16,Math.min(.16,(S.mx*asp*.5-S.lx)*.3))*FX.hov,1-Math.exp(-dt*2));
  if(id==='gimbal'){GX.gt+=dt;if(GX.gt>=GX.next){GX.t0=GX.gt;GX.d=rand(.3,.5);GX.hold=rand(6,12);GX.next=GX.gt+rand(40,80)}}
  const g=GX.gt-GX.t0;GX.s=1-GX.d*ssJ(0,6,g)*(1-ssJ(6+GX.hold,13+GX.hold,g));
}
// per-scene craft shaping: x = scale (closeness), y = black triangle tilt, z = disc tilt
// The clearing: now and then the triangle flickers out, and flickers back in somewhere else in the sky
const BX={next:rand(14,24),t0:-1,hide:0,moved:false};
function tickBlink(t){
  if(SCENES[deck.cur.si].id!=='clearing'||curPhen!==7){BX.hide=0;return}
  if(t>BX.next&&BX.t0<0){BX.t0=t;BX.dur=rand(1.5,4);BX.moved=false}
  if(BX.t0<0){BX.hide=0;return}
  const u=t-BX.t0,OUT=.5,IN=.4,fl=Math.random();
  if(u<OUT)BX.hide=fl<u/OUT?1:0;
  else if(u<OUT+BX.dur){BX.hide=1;
    if(!BX.moved){BX.moved=true;let x,y,k=0;do{x=rand(-.24,.24);y=rand(-.14,.16);k++}while(k<12&&Math.hypot(x-T.light[0],y-T.light[1])<.18);
      T.light=[x,y];S.lx=x+.16*nz(t,.03,1.7);S.ly=y+.025*nz(t,.04,3.1)}}
  else if(u<OUT+BX.dur+IN)BX.hide=fl<(u-OUT-BX.dur)/IN?0:1;
  else{BX.hide=0;BX.t0=-1;BX.next=t+rand(20,45)}
}
function sceneX(si,t){const id=SCENES[si].id;
  if(id==='clearing')return [1,.3*Math.sin(t*.04),0,BX.hide];
  if(id==='field')return [FX.s,.3*Math.sin(t*.05)+FX.tilt,.1*Math.sin(t*.07)+FX.tilt*.8,0];
  if(id==='gimbal')return [GX.s,0,0,0];
  return [1,.3*Math.sin(t*.04),0,0]}
function frame(now){
  const rdt=Math.min(1,(now-last)/1000),dt=Math.min(.1,rdt);last=now;const t=(now-t0)/1000;const gated=document.body.classList.contains('gated');
  // audio (or idle heartbeat)
  const af=eng.frame();
  if(af){Object.assign(A,af)}
  else{const hb=t%1.7;const env=Math.exp(-hb*9)+Math.exp(-Math.max(0,hb-.28)*11)*(hb>.28?.7:0);
    A.hit=(hb<dt);A.hitS=false;A.snare=0;A.state=0;A.kick=env*.55;A.low=.18+env*.25;A.mid=.14+.05*Math.sin(t*.7);A.high=.08+.05*Math.sin(t*1.3);A.level=.2+env*.15}
  G.lvlSlow=lerp(G.lvlSlow,A.level,1-Math.exp(-dt*.4));
  if(A.hit)onKick(t);
  if(A.hitS)onSnare(t);
  if(!playing&&t>G.idleNext&&!gated){glitch(G.set[Math.floor(Math.random()*3)],.5);G.idleNext=t+rand(3.5,8)}
  if(gated&&t>G.idleNext){glitch(G.set[Math.floor(Math.random()*3)],.45);G.idleNext=t+rand(2.5,6)}
  const ts=performance.now()/1000;
  // loud passages cut between scenes every 3.5-8.5 s, landing on a kick or snare; intros and breakdowns hold the shot
  const csc0=SCENES[deck.cur.si];
  // timer runs 3.5-7.9 s, then waits up to 0.6 s for a kick or snare, so cuts land 3.5-8.5 s apart
  // scheduled on the audio clock, so the window holds against the music itself; a seek restarts the timer
  const at=au.currentTime;
  if(autoCut&&playing&&pinned==null&&A.state===1&&!gated){
    if(!CY.next||Math.abs(at-CY.last)>1.5)CY.next=at+rand(3.5,7.9)*(calm?1.6:1);
    if(at>=CY.next&&deck.p>=1&&(A.hit||A.hitS||at>CY.next+.6)){applyScene(nextScene(),false,true);CY.next=at+rand(3.5,7.9)*(calm?1.6:1)}
  } else CY.next=0;
  CY.last=at;
  if(EL.en)EL.en.classList.toggle('on',autoCut&&playing&&A.state===1);
  // idle tour: with nothing playing, wander through the scenes
  if(!playing&&!gated&&pinned==null&&deck.p>=1&&ts-lastSceneT>24){setScene(nextScene())}
  // events
  G.amt*=Math.exp(-dt*9);if(G.amt<.03)G.mode=0;
  G.invCd-=rdt;G.flashCd-=rdt;S.flash*=Math.exp(-dt*7);S.acq*=Math.exp(-dt*3.2);if(S.acq<.02)S.acq=0;
  const boltScene=deck.cur.si===SI.ball;
  if((!playing||boltScene)&&(S.phA===4&&S.amtA>.2||S.phB===4&&S.amtB>.2||boltScene)&&G.flashCd<=0&&Math.random()<dt*(boltScene?.6:.35))strike();
  if(G.irT>0){G.irT-=rdt}if(G.appT>0)G.appT-=rdt;
  if(!calm&&!playing&&t>G.irNext&&!gated)evidence(t);
  EL.ir.classList.toggle('on',G.irT>0);
  if(t>G.eyesNext){G.eyesT=2.6;G.eyesNext=t+rand(16,34)}if(G.eyesT>0)G.eyesT-=rdt;
  // spectres: appear for a few seconds, then gone; a new seed moves them to different trees each time
  // the well's rim figures are rarer and slower to appear, and they vanish fast
  const ev=csc0.spec==='event';
  if(csc0.spec){if(t>SPEC.next){SPEC.until=t+(ev?rand(4.5,8):rand(2.5,6));SPEC.seed++;SPEC.next=SPEC.until+(ev?rand(14,32):rand(4,11))}}
  SPEC.v=lerp(SPEC.v,csc0.spec&&t<SPEC.until?1:0,1-Math.exp(-dt*(t<SPEC.until?(ev?.9:1.8):(ev?4:1.1))));
  // smoothing toward profile + scene
  const k=1-Math.exp(-dt*1.1),kf=1-Math.exp(-dt*.7);
  S.fog=lerp(S.fog,P.fog,k);S.density=lerp(S.density,P.density,kf);S.clear=lerp(S.clear,P.clear,k);
  S.amtA=lerp(S.amtA,S.tA,k);S.amtB=lerp(S.amtB,S.tB,k);
  let lxT=T.light[0],lyT=T.light[1];
  if(curPhen===1||curPhen===7){lxT+=.16*nz(t,.03,1.7);lyT+=.025*nz(t,.04,3.1)}
  S.lx=lerp(S.lx,lxT,kf);S.ly=lerp(S.ly,lyT,kf);S.rays=lerp(S.rays,T.rays,k);S.bloom=lerp(S.bloom,P.bloom,k);S.bleed=lerp(S.bleed,P.bleed,k);
  const tz=1.0+.035*Math.sin(t*.045)+A.kick*.012;S.zoom=lerp(S.zoom,tz,1-Math.exp(-dt*(t<8?.45:2.5)));
  S.app=lerp(S.app,G.appT>0?1:0,1-Math.exp(-dt*(G.appT>0?30:8)));S.eyes=lerp(S.eyes,G.eyesT>0?1:0,1-Math.exp(-dt*3));
  S.ir=G.irT>0?1:0;
  S.mx=lerp(S.mx,mouse.x,1-Math.exp(-dt*2));S.my=lerp(S.my,mouse.y,1-Math.exp(-dt*2));
  const hv=hoverC&&(!cur.r||hoverC!==cur.r.c)?profile(BY[hoverC]).accent:null;
  const tgt=hv?accTgt.clone().lerp(hv,.5):accTgt;accNow.lerp(tgt,1-Math.exp(-dt*(hv?4:1.2)));
  // cameras: slow walk with hesitations, a run on night vision, handheld camcorder with whip pans, and the continuous side scroll
  const csc=SCENES[deck.cur.si],running=csc.cam==='run';
  if(t>CAM.nextStop){CAM.stopUntil=t+rand(2,4.5);CAM.nextStop=t+rand(16,30)}
  const wv=running?(1.1+A.level*.5):(.3+A.level*.28);
  CAM.walkV=lerp(CAM.walkV,t<CAM.stopUntil&&!running?0:wv*(calm?.7:1),1-Math.exp(-dt*1.4));CAM.walkT+=dt*CAM.walkV;
  CAM.scroll+=dt*(.022+A.level*.008)*(calm?.7:1);
  if(t>CAM.nextWhip&&!calm){CAM.whipV=(Math.random()<.5?-1:1)*rand(.22,.4);CAM.nextWhip=t+rand(7,15)}
  CAM.whip=lerp(CAM.whip,CAM.whipV,1-Math.exp(-dt*9));CAM.whipV*=Math.exp(-dt*1.3);
  const sk=calm?.4:1;CAM.tape+=rdt;
  // grades (camcorder, night vision, FLIR, archival photo) fade out before they switch type
  const gm=csc.grade||0;
  if(gm!==S.gmode){S.grade=lerp(S.grade,0,1-Math.exp(-dt*10));if(S.grade<.04||S.gmode===0){S.gmode=gm;S.grade=0}}
  else S.grade=lerp(S.grade,gm?1:0,1-Math.exp(-dt*6));
  if(deck.p<1)deck.p=Math.min(1,deck.p+rdt*deck.speed);
  tickCraft(dt,t);tickApproach(dt);tickBlink(t);
  if(gated)gateFrames++;
  if(R&&(!gated||gateFrames<4)){
    const U=R.U;U.uTime.value=t;U.uLow.value=A.low;U.uMid.value=A.mid;U.uHigh.value=A.high;U.uKick.value=A.kick;U.uLevel.value=A.level;
    U.uAccent.value.copy(accNow);U.uMouse.value.set(S.mx,S.my);U.uFog.value=S.fog;U.uDensity.value=S.density;U.uClear.value=S.clear;U.uZoom.value=S.zoom+A.kick*.026*(calm?.3:1);U.uSnare.value=A.snare;
    U.uPhenA.value=S.phA;U.uAmtA.value=S.amtA;U.uPhenB.value=S.phB;U.uAmtB.value=S.amtB;U.uLight.value.set(S.lx,S.ly);
    U.uApp.value=S.app;U.uAppX.value=S.lx*.4+.03;U.uEyes.value=S.eyes;U.uFlash.value=S.flash;
    U.uCamT.value=CAM.walkT;U.uSpec.value=SPEC.v;U.uSpecSeed.value=SPEC.seed;
    const shk=running?1.6:1;
    U.uShake.value.set((nz(t,.7,0)*.02+CAM.whip*(running?.15:1))*sk*shk,(nz(t,.9,2)*.014+A.kick*.005)*sk*shk,nz(t,.5,4)*.02*sk*shk);
    U.uBeam.value.set(.2*Math.sin(t*.27)+.07*Math.sin(t*.61)-CAM.whip*.5,-.02+.07*Math.sin(t*.33));
    if(G.kicks&&G.kicks%16===0&&A.hit){const r=P.rng||Math.random;U.uModes.value.set(...modePair(r))}
    // render the decks, then mix
    const put=d=>{U.uSeed.value=d.seed;U.uMirror.value=d.mirror;U.uSpecies.value.set(...d.sp);U.uScroll.value=SCENES[d.si].scroll?CAM.scroll-(d.scroll0||0):0;U.uX.value.set(...sceneX(d.si,t))};
    if(deck.prev&&deck.p<1){put(deck.prev);R.draw(deck.prev.si,R.rtB)}
    put(deck.cur);R.draw(deck.cur.si,R.rtA);
    R.mix.uniforms.uP.value=deck.prev&&deck.p<1?deck.p:1;R.mix.uniforms.uMode.value=deck.mode;R.mix.uniforms.uTime.value=t;
    // light shafts follow whatever is emitting light in this scene
    let lx=S.lx,ly=S.ly,ra=S.rays*(.6+A.low*.6);
    if(CR.cfg&&!(curPhen===1||curPhen===7)&&CR.n){lx=CR.P[0][0];ly=CR.P[0][1];ra=Math.max(ra,.35)}
    if(csc.rays==='ship'){lx=0;ly=.24;ra=.32}
    else if(csc.rays==='up'){lx=0;ly=0;ra=.5}
    else if(csc.cam==='spin'){lx=0;ly=0;ra=.22}
    else if(csc.cam==='hand'){lx=U.uBeam.value.x-U.uShake.value.x;ly=U.uBeam.value.y-U.uShake.value.y;ra=.5}
    else if(csc.cam==='walk'||running){lx=0;ly=.02;ra=Math.max(ra*.6,.3)}
    if(csc.grade>=3)ra=0;
    if(csc.rays==='none')ra=0;else if(csc.rays==='low')ra=Math.min(ra,.15);
    const asp=innerWidth/innerHeight;R.rays.uniforms.uLightUV.value.set(lx*S.zoom/asp+.5,ly*S.zoom+.5);R.rays.uniforms.uAmt.value=Math.min(ra,.8);
    R.after.uniforms.damp.value=calm?.7:Math.min(.93,S.bleed+(G.mode?G.amt*.08:0)+(csc.cam==='hand'?.04:0));
    R.bloom.strength=Math.min(1.3,S.bloom*(.5+A.low*.35+A.kick*.35+A.snare*.15))*(S.gmode===3||S.gmode===4?.35:1);
    const F=R.fin.uniforms;F.uTime.value=t;F.uKick.value=calm?0:A.kick;F.uMode.value=calm?0:G.mode;F.uG.value=G.amt;F.uGS.value=G.gs;F.uRollY.value=G.roll;
    F.uAcq.value=calm?S.acq*.35:S.acq;F.uIR.value=S.ir;F.uInvert.value=S.inv>0&&!calm?1:0;if(S.inv>0)S.inv--;
    F.uChroma.value=calm?.2:.5;F.uGrain.value=calm?.04:.07;F.uGrade.value=S.grade;F.uGMode.value=S.gmode;F.uPump.value=calm?0:Math.min(1,A.kick*.6+A.snare*.45);
    R.composer.render(dt);
    frames++;acc+=dt;if(frames>=90){const avg=acc/frames;
      if(avg>.026&&R.q>.4)R.setQ(Math.max(.4,R.q-.1));else if(avg<.0135&&R.q<Math.min(devicePixelRatio,1.25)*.85)R.setQ(R.q+.05);frames=0;acc=0}
  }
  // chrome
  const rs=document.documentElement.style;rs.setProperty('--kick',calm?0:A.kick.toFixed(3));
  if((frames%6)===0)rs.setProperty('--acc','#'+accNow.getHexString());
  EL.mL.style.height=(10+A.low*90)+'%';EL.mM.style.height=(10+A.mid*90)+'%';EL.mH.style.height=(10+A.high*90)+'%';
  const p=au.duration?au.currentTime/au.duration:0;EL.sf.style.width=p*100+'%';EL.sh.style.left=p*100+'%';EL.sk.setAttribute('aria-valuenow',Math.round(p*100));
  EL.tm.textContent=cur.r?`${fmt(au.currentTime)} / ${fmt(au.duration)}`:'--:-- / --:--';
  if(csc.hud==='tape'||csc.hud==='nv'){const s=CAM.tape;EL.tc.textContent=`${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60)%60)}:${pad(Math.floor(s)%60)}:${pad(Math.floor(s*30)%30)}`}
  if(csc.hud==='flir'&&(frames%4)===0){const bank=(.28*Math.sin(t*.035)+.08*Math.sin(t*.11))*57.3;
    EL.fl1.textContent=`${Math.abs(bank).toFixed(0).padStart(2,'0')}° ${bank<0?'R':'L'}  ·  -${(54+3*Math.sin(t*.07)).toFixed(0)}° EL`;
    EL.fl2.textContent=`RNG ${((31.4+2*Math.sin(t*.05))/(deck.cur.si===SI.gimbal?GX.s:1)).toFixed(1)}  M ${(.62+.04*Math.sin(t*.09)).toFixed(2)}  ${(25000+800*Math.sin(t*.02)).toFixed(0)}`;
    const trk=deck.cur.si===SI.tictactrack,cyc=(t/30)%1,Z=trk&&cyc>.4&&cyc<.9?2:1,bht=trk&&cyc>.55;
    EL.fl0.textContent=`NAR · ${bht?'BHT':'WHT'} · ${Z.toFixed(1)} Z · ATFLIR`;
    EL.fl3.textContent=deck.cur.si===SI.tictac&&(t%26)>15.5&&(t%26)<23?'TRACK LOST':trk?'TRACK · CORR':'TRACK · LOCK'}
  tickReadout(rdt);
  sigT+=dt;if(sigT>.05){sigT=0;drawSigil(t)}
  tickNote(rdt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__s8={get A(){return A},note,scene:(i,pin=true)=>setScene(i,pin),eng,load,profile,get cur(){return cur},get G(){return G},get S(){return S},get deck(){return deck},get CR(){return CR},get SPEC(){return SPEC},glitch,evidence,strike,get R(){return R},FX,GX,BX,get T(){return T},get TL(){return TL}};
