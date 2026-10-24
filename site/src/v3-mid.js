/* ---------------- glitch director ---------------- */
function glitch(mode,str=1){
  if(calm)return;G.mode=mode;G.amt=Math.max(G.amt,str);G.gs=Math.random()*100;
  if(mode===3)G.roll=rand(.15,.6)*(Math.random()<.5?-1:1);
  if(Math.random()<.14)G.appT=Math.max(G.appT,.16);
  document.body.style.setProperty('--jx',(Math.random()<.5?-1:1)*rand(1.5,4).toFixed(1));
  document.body.classList.add('jit');clearTimeout(glitch.t);glitch.t=setTimeout(()=>document.body.classList.remove('jit'),90+Math.random()*80);
}
function acquire(){S.acq=1;if(!calm)glitch(G.set[0],.8)}
function strike(){if(R){R.U.uBoltX.value=rand(-.6,.6);R.U.uBoltSeed.value=rand(0,100)}S.flash=calm?.5:1;G.flashCd=1.3}
function onKick(t){
  G.kicks++;
  if(G.kicks%24===0){const r=P.rng||Math.random;G.set.push(G.set.shift());if(Math.random()<.5){const m=GLITCH_POOL[Math.floor(Math.random()*GLITCH_POOL.length)];if(!G.set.includes(m))G.set[2]=m}}
  if(Math.random()<P.glitchiness*(.03+A.level*.07))glitch(G.set[Math.floor(Math.random()*G.set.length)],.45+Math.random()*.35);
  if((S.phA===4&&S.amtA>.2||S.phB===4&&S.amtB>.2)&&G.flashCd<=0&&Math.random()<.3)strike();
  if(!calm&&A.level-G.lvlSlow>.28&&G.invCd<=0&&A.level>.6){S.inv=2;G.invCd=12;glitch(4,1)}
}
// snares carry the backbeat, so the bigger glitch hits land on them
function onSnare(t){
  G.snares++;
  if(Math.random()<P.glitchiness*(.16+A.level*.22))glitch(G.set[Math.floor(Math.random()*G.set.length)],.55+Math.random()*.45);
  if(t>G.irNext&&!calm)evidence(t);
}
function evidence(t){G.irT=.42;G.appT=.42;G.irNext=t+rand(32,70);S.app=1;
  const s=33*60+Math.floor(t)%60;$('#irClock').textContent=`CAM 08 · 03:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`;}

/* ---------------- sigil (generative 8 per release) + barcode ---------------- */
const sg=$('#sigil').getContext('2d');const SW=60,SH=96;const sImg=sg.createImageData(SW,SH);
const sOff=document.createElement('canvas');sOff.width=SW;sOff.height=SH;const so=sOff.getContext('2d');
function drawSigil(t){
  const m=R?R.U.uModes.value:{x:2,y:5,z:3,w:4};const k=A.kick;const d=sImg.data;const c=accNow;
  const mix=.5+.5*Math.sin(t*.2);
  for(let y=0;y<SH;y++)for(let x=0;x<SW;x++){
    const i=(y*SW+x)*4;const top=y<SH/2;const cy=top?SH*.27:SH*.73;const R0=SW*.46;
    const dx=x+.5-SW/2,dy=y+.5-cy;const r=Math.hypot(dx,dy);
    let a=0;
    if(r<R0){const u=dx/R0*.5+.5,v=dy/R0*.5+.5;const PI=Math.PI;
      let f=Math.sin(m.x*PI*u)*Math.sin(m.y*PI*v)-Math.sin(m.y*PI*u)*Math.sin(m.x*PI*v);
      const f2=Math.sin(m.z*PI*u)*Math.sin(m.w*PI*v)+Math.sin(m.w*PI*u)*Math.sin(m.z*PI*v);f=f*(1-mix)+f2*mix;
      a=Math.max(0,1-Math.abs(f*(1+k))/.13)*.9;}
    const rim=Math.max(0,1-Math.abs(r-R0)/1.1);a=Math.max(a,rim);
    d[i]=c.r*255;d[i+1]=c.g*255;d[i+2]=c.b*255;d[i+3]=a*255;
  }
  so.putImageData(sImg,0,0);sg.clearRect(0,0,120,192);sg.imageSmoothingEnabled=false;sg.drawImage(sOff,0,0,120,192);
}
function drawBarcode(code){
  const cv=$('#barcode'),g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);g.fillStyle='#ecebe6';
  let x=0;const h=fnv(code);let bits='';for(const ch of code)bits+=ch.charCodeAt(0).toString(2).padStart(7,'0');
  for(let i=0;i<bits.length&&x<cv.width;i++){const w=bits[i]==='1'?((h>>(i%24))&1?4:2):((h>>(i%16))&1?3:2);if(i%2===0)g.fillRect(x,0,w,cv.height);x+=w}
}

/* ---------------- readouts ---------------- */
const RO={line:'',shown:0,hold:0,last:0};
function nextLine(){
  const r=cur.r,lv=A.level,ph=(curPhen>=0?PHEN[curPhen]:SCENES[deck.cur.si].name).toUpperCase(),loc=SCENES[deck.cur.si].name.toUpperCase();
  const pool=playing&&r?[
    `FIELD REC // SECTOR 8 // <b>${ph}</b>`,
    `EMF ${(1.4+lv*7).toFixed(1)} mG ${lv>.5?'▲':'▽'} // LOW ${(A.low*100|0)}%`,
    `AMBIENT ${(-2.4-A.low*5).toFixed(1)}°C // FALLING`,
    `CASE <b>${r.c}</b> // RECOVERED ${fdate(r.d)}`,
    `TRANSMISSION ${pad(RANK[r.c],3)} OF ${D.length} // ${pad(cur.i+1)}/${pad(r.tr.length)}`,
    `EVP CLASS ${'ABC'[Math.floor(Math.random()*3)]} // SIGNAL ${(91+lv*8.9).toFixed(1)}%`,
    `TREE LINE MOVEMENT // ${1+Math.floor(Math.random()*7)} CONTACTS`,
    `WITNESSES 0 // DO NOT LEAVE THE PATH`,
    `LOCATION // <b>${loc}</b>`,`LOCATION // ${loc} // ${ph}`,
  ]:[`LISTENING`,`NO SIGNAL // PRESS PLAY`,`THE FOREST IS QUIET`,`FIELD REC // SECTOR 8 // <b>${ph}</b>`,`${D.length} RECORDINGS ON FILE`,`STAY ON THE PATH`,`LOCATION // <b>${loc}</b>`];
  RO.line=pool[Math.floor(Math.random()*pool.length)];RO.shown=0;RO.hold=0;
}
function tickReadout(dt){
  const el=$('#readout');if(!RO.line)nextLine();
  const plain=RO.line.replace(/<[^>]+>/g,'');
  if(RO.shown<plain.length){RO.last+=dt;while(RO.last>.022&&RO.shown<plain.length){RO.shown++;RO.last-=.022}
    let n=RO.shown,out='',inTag=false;for(const ch of RO.line){if(ch==='<')inTag=true;if(inTag){out+=ch;if(ch==='>')inTag=false;continue}if(n<=0)break;out+=ch;n--}
    if(out.includes('<b>')&&!out.includes('</b>'))out+='</b>';el.innerHTML=out+'<span class="cursor"></span>'}
  else{RO.hold+=dt;if(RO.hold>2.8)nextLine()}
}

/* ---------------- text effects ---------------- */
const GLY='█▓▒░<>/\\|=+*#%&01ΔΣ';
function scramble(el,text,ms=650){
  const id=(el._sid=(el._sid||0)+1),t0=performance.now();
  const step=now=>{if(el._sid!==id)return;const k=Math.min(1,(now-t0)/ms),n=Math.floor(text.length*k);let s=text.slice(0,n);
    for(let i=n;i<text.length;i++)s+=text[i]===' '?' ':GLY[(Math.random()*GLY.length)|0];el.textContent=s;if(k<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);
}
function sliceVars(el,on){
  if(!on){['--c1','--c3'].forEach(v=>el.style.setProperty(v,'100%'));return}
  const a=rand(0,90),b=rand(0,92);el.style.setProperty('--c1',a+'%');el.style.setProperty('--c2',(100-a-rand(3,12))+'%');el.style.setProperty('--x1',rand(-14,14)+'px');
  el.style.setProperty('--c3',b+'%');el.style.setProperty('--c4',(100-b-rand(2,8))+'%');el.style.setProperty('--x2',rand(-10,10)+'px');
}
/* footage notes: small typed archive captions, the way documentaries label recovered tape; they type out, hold, then go */
const NOTE={lines:[],li:0,ci:0,acc:0,state:'idle',hold:0};
const NOTE_FLAVOR=['NOTE: AUDIO RESTORED FROM MASTER. IMAGE UNVERIFIED.','NOTE: CHAIN OF CUSTODY INCOMPLETE.','NOTE: TIMECODE BREAKS AT 03:33. CAUSE UNKNOWN.',
  'NOTE: SOURCE TAPE DAMAGED. PARTIAL RECOVERY.','NOTE: WITNESS STATEMENTS SEALED.','NOTE: DO NOT DUPLICATE.','NOTE: CAMERA OPERATOR NOT LOCATED.'];
function note(lines,hold=3.8){NOTE.lines=lines.map(l=>typeof l==='string'?{t:l,c:''}:l);NOTE.li=0;NOTE.ci=0;NOTE.acc=-.25;NOTE.hold=hold;NOTE.state='type';renderNote()}
function renderNote(){
  const L=NOTE.lines,typing=NOTE.state==='type';let h='';
  for(let i=0;i<L.length;i++){if(typing&&i>NOTE.li)break;
    const txt=typing&&i===NOTE.li?L[i].t.slice(0,NOTE.ci):L[i].t,cur=typing?i===NOTE.li:i===L.length-1;
    h+=`<p class="${L[i].c}">${esc(txt)}${cur?'<span class="cur"></span>':''}</p>`}
  $('#note').innerHTML=h;
}
function tickNote(dt){
  if(NOTE.state==='idle')return;
  if(NOTE.state==='type'){NOTE.acc+=dt;let ch=false;
    while(NOTE.acc>.024){NOTE.acc-=.024;ch=true;NOTE.ci++;if(NOTE.ci>NOTE.lines[NOTE.li].t.length){NOTE.li++;NOTE.ci=0;NOTE.acc-=.14;if(NOTE.li>=NOTE.lines.length){NOTE.state='hold';break}}}
    if(ch)renderNote()}
  else if(NOTE.state==='hold'){NOTE.hold-=dt;if(NOTE.hold<=0){NOTE.state='out';NOTE.acc=0}}
  else{NOTE.acc+=dt;if(NOTE.acc>.07){NOTE.acc=0;NOTE.lines.pop();if(!NOTE.lines.length){NOTE.state='idle';$('#note').innerHTML='';return}renderNote()}}
}
function noteAlbum(r){
  note([{t:`ARCHIVE FOOTAGE — TAPE ${pad(RANK[r.c],3)}/${D.length}`,c:'acc'},`${r.c} · ${r.t.toUpperCase()}`,r.ar.join(', ').toUpperCase(),
    {t:`RECORDED ${fdate(r.d)} · LOC: ${SCENES[deck.cur.si].name.toUpperCase()}`,c:'dim'},{t:NOTE_FLAVOR[fnv(r.c)%NOTE_FLAVOR.length],c:'dim'}]);
}
function noteTrack(r,i){const [a,n]=splitT(r.tr[i][0]);note([{t:`TAPE ${pad(RANK[r.c],3)}/${D.length} · SEGMENT ${pad(i+1)}/${pad(r.tr.length)}`,c:'acc'},`${n.toUpperCase()} — ${(a||r.a).toUpperCase()}`],2.8)}
function noteScene(si){note([{t:`LOCATION CHANGE · ${SCENES[si].name.toUpperCase()}`,c:'acc'},{t:SCENES[si].note.toUpperCase(),c:'dim'}],2.8)}

/* ---------------- player ---------------- */
const au=eng.el;
function setNow(){
  const r=cur.r;if(!r)return;const [ta,tn]=splitT(r.tr[cur.i][0]);
  $('#npK').innerHTML=`Transmission <b>${pad(RANK[r.c],3)}</b> / ${D.length} · ${r.c} · ${fdate(r.d)}`;
  scramble($('#npT'),tn.toUpperCase(),700);
  $('#npS').innerHTML=`${esc(ta||r.a)} <em>— ${esc(r.t)} · ${pad(cur.i+1)} / ${pad(r.tr.length)}</em>`;
  $('#npTags').textContent=r.s.join(' / ');
  document.title=`${tn} · ${ta||r.a} · Section 8`;
  mediaMeta();
  markIndex();favMark();
}
function load(c,i,auto=true){
  const r=BY[c];if(!r)return;const first=!cur.r,changed=first||cur.r.c!==c;cur={r,i};
  history.push(c);if(history.length>40)history.shift();
  eng.ensure();eng.resume();
  au.src=r.tr[i][2]||MP3+r.l+'/320/'+r.tr[i][1];qOnLoad(r.tr[i][1]);if(auto)au.play().catch(()=>{});
  // every track change moves to a new scene (unless one is pinned); the first track always opens on the clearing
  // a scene associated with this track (queue config) wins; otherwise the first track opens on the clearing
  const own=sceneOf(r.tr[i][1]);
  if(changed){const p=profile(r);let si=own??(first?SI.clearing:p.scene);if(own==null&&!first&&si===deck.cur.si)si=nextScene();applyProfile(p,false,si);acquire();noteAlbum(r)}
  else{if(pinned==null)applyScene(own??nextScene(),false,true);glitch(G.set[1]||1,.6);noteTrack(r,i)}
  CY.next=0;
  setNow();qRefresh();
}
function toggle(){
  eng.ensure();eng.resume();
  if(!cur.r){load(...firstTrack());return}
  au.paused?au.play():au.pause();
}
function pickDrift(){
  const recent=new Set(history.slice(-30));const pool=D.filter(r=>!recent.has(r.c));const L=pool.length?pool:D;return L[Math.floor(Math.random()*L.length)];
}
// the track after (c,i): next in the queue while inside it, then the rest of the album, then the next album (or a drift pick)
function nextAfter(c,i){
  const k=qPos(fileOf(c,i));if(k>=0&&k<QS.queue.length-1)return FILE2[QS.queue[k+1]];
  const r=BY[c];if(i<r.tr.length-1)return [c,i+1];
  const n=drift?pickDrift():D[(D.indexOf(r)+1)%D.length];return [n.c,0];
}
function next(){
  if(!cur.r)return load(...firstTrack());
  let t=nextAfter(cur.r.c,cur.i);
  for(let n=0;n<60&&isDel(fileOf(...t));n++)t=nextAfter(...t);
  load(...t);
}
// force: go to the previous track even when well into this one (a swipe), rather than back to its start
function prev(force){
  if(!cur.r)return;const st=markOf(curFile()).in??0;if(force!==true&&au.currentTime>st+4){au.currentTime=st;MK.last=st;return}
  const qp=qPrev();if(qp)return load(...qp);
  if(cur.i>0)return load(cur.r.c,cur.i-1);
  const r=D[(D.indexOf(cur.r)-1+D.length)%D.length];load(r.c,r.tr.length-1);
}
au.addEventListener('play',()=>{playing=true;document.body.classList.add('playing');markIndex();if(cur.r)syncUrl(cur.r.c)});
au.addEventListener('pause',()=>{playing=false;document.body.classList.remove('playing');markIndex()});
au.addEventListener('ended',next);
au.addEventListener('error',()=>{if(!au.src)return;setTimeout(next,800)});
$('#playBtn').onclick=toggle;$('#nextBtn').onclick=next;$('#prevBtn').onclick=prev;
if('mediaSession' in navigator){navigator.mediaSession.setActionHandler('nexttrack',next);navigator.mediaSession.setActionHandler('previoustrack',prev)}
// a finger on the seek bar may be starting a swipe between tracks: it seeks on a tap, scrubs once it moves sideways, and
// leaves a vertical movement to the swipe. A mouse or pen seeks at once, as before
(()=>{const s=$('#seek');let drag=false,pend=null;const go=e=>{const b=s.getBoundingClientRect();const k=Math.min(1,Math.max(0,(e.clientX-b.left)/b.width));if(au.duration)au.currentTime=k*au.duration};
  s.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){pend={x:e.clientX,y:e.clientY,id:e.pointerId};return}drag=true;s.setPointerCapture(e.pointerId);go(e)});
  s.addEventListener('pointermove',e=>{if(drag)return go(e);if(!pend||e.pointerId!==pend.id)return;const dx=Math.abs(e.clientX-pend.x),dy=Math.abs(e.clientY-pend.y);
    if(dx>8&&dx>dy){pend=null;drag=true;try{s.setPointerCapture(e.pointerId)}catch(_){}go(e)}else if(dy>8&&dy>=dx)pend=null});
  s.addEventListener('pointerup',e=>{if(pend&&e.pointerId===pend.id)go(e);pend=null;drag=false});s.addEventListener('pointercancel',()=>{pend=null;drag=false});
  s.addEventListener('keydown',e=>{if(!au.duration)return;if(e.key==='ArrowRight'){au.currentTime=Math.min(au.duration,au.currentTime+10);e.preventDefault();e.stopPropagation()}if(e.key==='ArrowLeft'){au.currentTime=Math.max(0,au.currentTime-10);e.preventDefault();e.stopPropagation()}});})();

/* ---------------- archive (metadata only) ---------------- */
(()=>{
  const years={};D.forEach(r=>(years[r.d.slice(0,4)]=years[r.d.slice(0,4)]||[]).push(r));
  $('#ixList').innerHTML=Object.keys(years).sort().reverse().map(y=>`<section data-y="${y}"><div class="yr"><b>${y}</b><span class="mono">${years[y].length} recording${years[y].length>1?'s':''}</span></div>${years[y].map(r=>
    `<div class="rw" data-c="${r.c}"><button class="rel" data-rel="${r.c}" aria-expanded="false"><span class="c">${r.c}</span><span class="t">${esc(r.t)}<em>${esc(r.a)}</em></span><span class="n mono">${pad(r.tr.length)} trk</span></button><div class="trks"></div></div>`).join('')}</section>`).join('')
    +'<p class="ix-empty mono" id="ixEmpty" hidden>Nothing on file matches that.</p>';
  const hay=Object.fromEntries(D.map(r=>[r.c,[r.c,r.a,r.t,r.s.join(' '),r.tr.map(t=>t[0]).join(' ')].join(' ').toLowerCase()]));
  $('#q').addEventListener('input',e=>{const w=e.target.value.trim().toLowerCase().split(/\s+/).filter(Boolean);let any=0;
    $$('#ixList .rw').forEach(el=>{const ok=w.every(x=>hay[el.dataset.c].includes(x));el.hidden=!ok;any+=ok});
    $$('#ixList section').forEach(s=>s.hidden=![...s.querySelectorAll('.rw')].some(el=>!el.hidden));$('#ixEmpty').hidden=!!any});
  $('#ixList').addEventListener('click',e=>{
    const tq=e.target.closest('[data-tq]');if(tq){qToggle(tq.dataset.tq);return}
    const tb=e.target.closest('[data-play]');if(tb){const [c,i]=tb.dataset.play.split(':');load(c,+i);return}
    const rb=e.target.closest('[data-rel]');if(rb){expand(rb.dataset.rel)}
  });
  $('#ixList').addEventListener('pointerover',e=>{const rw=e.target.closest('.rw');hoverC=rw?rw.dataset.c:null});
  $('#ixList').addEventListener('pointerleave',()=>hoverC=null);
})();
function expand(c,force){
  const rw=$(`#ixList .rw[data-c="${c}"]`);if(!rw)return;const box=rw.querySelector('.trks'),btn=rw.querySelector('.rel');
  const open=force??!box.classList.contains('open');
  if(open&&!box.innerHTML){const r=BY[c];box.innerHTML=(r.x?`<p>${esc(r.x.length>200?r.x.slice(0,197)+'…':r.x)}</p>`:'')+r.tr.map((t,i)=>{const [a,n]=splitT(t[0]);
    return `<div class="trw" data-f="${esc(t[1])}"><button class="trk" data-play="${c}:${i}"><span class="i">${pad(i+1)}</span><span>${esc(n)}${a&&a!==r.a?` <span class="x">· ${esc(a)}</span>`:''}</span><span class="mk"></span><span class="eq"><i></i><i></i><i></i></span></button><button class="tq" data-tq="${esc(t[1])}" aria-label="Add to queue">+</button></div>`}).join('')}
  box.classList.toggle('open',open);btn.setAttribute('aria-expanded',open);markIndex();if(open)qRefresh();
}
function markIndex(){
  $$('#ixList .rel.now,#ixList .trk.now').forEach(e=>e.classList.remove('now'));
  if(!cur.r)return;const rw=$(`#ixList .rw[data-c="${cur.r.c}"]`);if(!rw)return;rw.querySelector('.rel').classList.add('now');
  const tk=rw.querySelectorAll('.trk')[cur.i];if(tk&&playing)tk.classList.add('now');
}
function openIndex(o){
  const ix=$('#index');o=o??!ix.classList.contains('open');ix.classList.toggle('open',o);ix.setAttribute('aria-hidden',!o);$('#ixBtn').setAttribute('aria-expanded',o);
  if(o&&cur.r){expand(cur.r.c,true);setTimeout(()=>$(`#ixList .rw[data-c="${cur.r.c}"]`)?.scrollIntoView({block:'center'}),60)}
  if(o)setTimeout(()=>$('#q').focus({preventScroll:true}),350);
}
$('#ixBtn').onclick=()=>openIndex();$('#ixClose').onclick=()=>openIndex(false);

