/* ---------------- queue + scene associations (config tool, stored in localStorage) ----------------
   The queue sets the play order; each track can carry a scene it opens on. Both export as JSON
   (clipboard or file) so the order and scenes can be handed back and baked in as defaults. */
const QKEY='s8.config.v1';
// default play order and scenes, from the operator's export of 2026-10-22; local edits override it until reset
const DEFAULT_CONFIG={"queue":["SECTION8034D-6-Bad_Logik-The_Mad_Lands.mp3","SECTION8115-1-DESIGN-Radio_RahRa.mp3","SECTION8107-2-Sinecore-Bassline_Computer.mp3","SECTION8077D-2-Emmeeji__Element-Context.mp3","SECTION8TTC01-14-KR4Y-Red_Alert.mp3","SECTION8088D-2-Coresplittaz-Specter.mp3","SECTION8077D-1-Emmeeji-Contraflow.mp3","SECTION8107-1-SineCore-Lazy_Bloody_Eyes.mp3","SECTION8056D-1-762-The_Spice.mp3","SECTION8021D-1-Block_Dodger-Tomb.mp3","SECTION8107-4-Sinecore-Oxymoron.mp3","SECTION8117-1-Sick_Cycle__Sick_Cycle-You_Know.mp3","SECTION8FILTH002D-3-SCOOB-Shine.mp3","SECTION8044D-3-Accelerated_Culture-The_Slayer.mp3","SECTION8041D-1-Insatek-Three.mp3","SECTION8107-3-Sinecore-Morrocan_Hash.mp3","SECTION8087D-1-Coresplittaz-Android_Dreams.mp3","SECTION8044D-1-Coresplittaz-Gravity.mp3","SECTION8116S3-1-Biobird-R.E.A.V.E..mp3","SECTION8TTC01-20-Hostage-Goose_Neck_Stew.mp3","SECTION8TTC01-7-Malicious-The_Infinite.mp3","SECTION8044D-4-FLAT-T-Gut_Wrench.mp3","SECTION8115S1-1-DESIGN-Big_Brother.mp3","SECTION8116S1-1-Biobird-A_Thousand_Days.mp3"],"scenes":{"SECTION8115-1-DESIGN-Radio_RahRa.mp3":"gimbal","SECTION8116S3-1-Biobird-R.E.A.V.E..mp3":"road","SECTION8TTC01-7-Malicious-The_Infinite.mp3":"underneath","SECTION8TTC01-14-KR4Y-Red_Alert.mp3":"plain","SECTION8TTC01-20-Hostage-Goose_Neck_Stew.mp3":"path","SECTION8TTC01-24-Valkyr-Calvaire.mp3":"oldroad","SECTION8034D-3-Bad_Logik-The_Mad_Lands__Temper_O_Fair_Remix.mp3":"clearing","SECTION8087D-1-Coresplittaz-Android_Dreams.mp3":"deadcanopy","SECTION8077D-1-Emmeeji-Contraflow.mp3":"oldroad","SECTION8077D-2-Emmeeji__Element-Context.mp3":"farm","SECTION8088D-2-Coresplittaz-Specter.mp3":"rendlesham","SECTION8056D-1-762-The_Spice.mp3":"tictac","SECTION8034D-6-Bad_Logik-The_Mad_Lands.mp3":"clearing","SECTION8107-2-Sinecore-Bassline_Computer.mp3":"underneath","SECTION8107-4-Sinecore-Oxymoron.mp3":"nightvision","SECTION8117-1-Sick_Cycle__Sick_Cycle-You_Know.mp3":"field","SECTION8FILTH002D-3-SCOOB-Shine.mp3":"effigies","SECTION8044D-3-Accelerated_Culture-The_Slayer.mp3":"deadfall"},"marks":{"SECTION8034D-6-Bad_Logik-The_Mad_Lands.mp3":{"out":172.3}}};
const FILE2={};D.forEach(r=>r.tr.forEach((t,i)=>{FILE2[t[1]]=[r.c,i]}));
const QS=(()=>{try{const raw=localStorage.getItem(QKEY);const o=raw?JSON.parse(raw):DEFAULT_CONFIG;
  return {queue:(o.queue||[]).filter(f=>FILE2[f]),scenes:Object.fromEntries(Object.entries(o.scenes||{}).filter(([f,s])=>FILE2[f]&&SI[s]!=null)),
    marks:Object.fromEntries(Object.entries(o.marks||{}).filter(([f,m])=>FILE2[f]&&m&&(m.in!=null||m.out!=null))),
    del:[...new Set((o.del||[]).filter(f=>FILE2[f]))]}}
  catch(e){return {queue:[],scenes:{},marks:{},del:[]}}})();
const qSave=()=>{try{localStorage.setItem(QKEY,JSON.stringify(QS))}catch(e){}qRefresh()};
const fileOf=(c,i)=>BY[c].tr[i][1];
const curFile=()=>cur.r?fileOf(cur.r.c,cur.i):null;
const qPos=f=>QS.queue.indexOf(f);
const sceneOf=f=>QS.scenes[f]!=null?SI[QS.scenes[f]]:null;
// tracks marked for deletion from the library: exported with the queue settings, skipped when playback advances on its own
const isDel=f=>QS.del.includes(f);
function qToggleDel(f){if(!f){qToast('Play a track first');return}const k=QS.del.indexOf(f);if(k>=0)QS.del.splice(k,1);else QS.del.push(f);qSave();
  qToast(k>=0?`Unmarked · ${trackName(f)}`:`Marked for deletion · ${trackName(f)} · ${QS.del.length} marked`)}
function qToggle(f){const k=qPos(f);if(k>=0)QS.queue.splice(k,1);else QS.queue.push(f);qSave();qToast(k>=0?'Removed from queue':`Added to queue · #${QS.queue.length}`)}
function qSetScene(f,si){if(si==null)delete QS.scenes[f];else QS.scenes[f]=SCENES[si].id;qSave();
  qToast(si==null?'Scene association removed':`Scene ${pad(si+1)} · ${SCENES[si].name} → ${trackName(f)}`)}
function trackName(f){const [c,i]=FILE2[f];const [a,n]=splitT(BY[c].tr[i][0]);return `${a||BY[c].a} — ${n}`}
// the queue drives next / prev while the playing track is part of it; after the last entry, normal browsing resumes
function qNext(){const k=qPos(curFile());return k>=0&&k<QS.queue.length-1?FILE2[QS.queue[k+1]]:null}
function qPrev(){const k=qPos(curFile());return k>0?FILE2[QS.queue[k-1]]:null}
const DEFAULT_FIRST=['SECTION8034D',5]; // Bad Logik - The Mad Lands
function firstTrack(){return QS.queue.length?FILE2[QS.queue[0]]:DEFAULT_FIRST}

/* ---- indicators ---- */
function marksFor(f){const k=qPos(f),s=sceneOf(f);
  return (k>=0?`<span class="bq" title="In queue, position ${k+1}">Q${k+1}</span>`:'')+(s!=null?`<span class="bs" title="Opens on scene ${pad(s+1)} · ${esc(SCENES[s].name)}">S${pad(s+1)}</span>`:'')+(QS.marks[f]?`<span class="bm" title="Trimmed ${tc(markOf(f).in??0)} – ${markOf(f).out!=null?tc(markOf(f).out):'end'}">TRIM</span>`:'')+(isDel(f)?'<span class="bd" title="Marked for deletion from the library">DEL</span>':'')}
function qRefresh(){
  $('#qCount').textContent=QS.queue.length;
  const f=curFile(),k=f?qPos(f):-1,s=f?sceneOf(f):null;
  const m=$('#npMarks');
  m.innerHTML=!f?'':(k>=0?`<span class="bq">In queue · ${pad(k+1)} / ${pad(QS.queue.length)}</span>`:'')+(s!=null?`<span class="bs">Scene · ${pad(s+1)} ${esc(SCENES[s].name)}</span>`:'')+(f&&QS.marks[f]?`<span class="bm">${markOf(f).in!=null?'In '+tc(markOf(f).in):'From start'} · ${markOf(f).out!=null?'Out '+tc(markOf(f).out)+' · fade '+fadeLen(markOf(f)).toFixed(0)+'s':'to end'}</span>`:'')+(f&&isDel(f)?'<span class="bd">Marked for deletion</span>':'');
  m.hidden=!m.innerHTML;
  $('#delBtn').classList.toggle('on',!!f&&isDel(f));$('#delBtn').setAttribute('aria-pressed',!!f&&isDel(f));
  $('#delBtn').title=f&&isDel(f)?'Marked for deletion · click to unmark (X)':'Mark this track for deletion from the library (X)';
  const mk=f?markOf(f):{};$('#mIn').classList.toggle('on',mk.in!=null);$('#mOut').classList.toggle('on',mk.out!=null);
  $('#mIn').title=mk.in!=null?`Start ${tc(mk.in)} · click to move it to the playhead (,) · Shift+click clears`:'Set the start to the playhead (,)';
  $('#mOut').title=mk.out!=null?`End ${tc(mk.out)} · click to move it to the playhead (.) · Shift+click clears`:'Set the end to the playhead (.) · fades out into it';
  if(!f||!QS.marks[f]){$('#seek').classList.remove('has-in','has-out')}
  $('#qAdd').classList.toggle('on',k>=0);$('#qAdd').setAttribute('aria-pressed',k>=0);
  $('#qAdd').title=k>=0?`In queue at #${k+1} · click to remove (Q)`:'Add this track to the queue (Q)';
  $$('#ixList .trw').forEach(w=>{const f=w.dataset.f;w.classList.toggle('del',isDel(f));w.querySelector('.mk').innerHTML=marksFor(f);const q=w.querySelector('.tq');const on=qPos(f)>=0;q.classList.toggle('on',on);q.textContent=on?'✓':'+';q.title=on?'Remove from queue':'Add to queue'});
  if($('#qpanel').classList.contains('open'))qRender();
  if(!$('#srch').hidden)sRender();
}
let qtT;function qToast(m){const t=$('#qtoast');t.textContent=m;t.classList.add('on');clearTimeout(qtT);qtT=setTimeout(()=>t.classList.remove('on'),2200)}

/* ---- queue panel ---- */
const sceneOpts=sel=>'<option value="">— no scene —</option>'+SCENES.map((s,i)=>`<option value="${i}"${sel===i?' selected':''}>${pad(i+1)} · ${esc(s.name)}</option>`).join('');
function qRender(){
  const L=$('#qList');const cf=curFile();
  $('#qHead').textContent=`${QS.queue.length} track${QS.queue.length===1?'':'s'} queued · ${Object.keys(QS.scenes).length} scene${Object.keys(QS.scenes).length===1?'':'s'} · ${Object.keys(QS.marks).length} trimmed${QS.del.length?` · ${QS.del.length} marked for deletion`:''}`;
  L.innerHTML=QS.queue.length?QS.queue.map((f,k)=>{const [c,i]=FILE2[f];const [a,n]=splitT(BY[c].tr[i][0]);const s=sceneOf(f);
    return `<li class="qr${f===cf?' now':''}${isDel(f)?' del':''}" draggable="true" data-k="${k}">
      <span class="qh" aria-hidden="true">⋮⋮</span><span class="qn mono">${pad(k+1)}</span>
      <button class="qt" data-qplay="${k}" title="Play"><b>${esc(n)}${isDel(f)?' <span class="bd">DEL</span>':''}</b><em>${esc(a||BY[c].a)} · ${c}</em><code>${esc(f)}</code></button>
      <select class="qs" data-qscene="${k}" aria-label="Scene for ${esc(n)}">${sceneOpts(s)}</select>
      <span class="qb"><button data-qup="${k}" aria-label="Move up"${k?'':' disabled'}>↑</button><button data-qdn="${k}" aria-label="Move down"${k<QS.queue.length-1?'':' disabled'}>↓</button><button data-qrm="${k}" aria-label="Remove">✕</button></span>
      <div class="qm mono"><label>Start <input data-qin="${k}" value="${tc(markOf(f).in)}" placeholder="0:00.0" inputmode="decimal" aria-label="Start time"></label><button data-qsetin="${k}"${f===cf?'':' disabled'} title="Set start to the playhead">◉ now</button>
        <label>End <input data-qout="${k}" value="${tc(markOf(f).out)}" placeholder="end" inputmode="decimal" aria-label="End time"></label><button data-qsetout="${k}"${f===cf?'':' disabled'} title="Set end to the playhead">◉ now</button>
        ${markOf(f).out!=null?`<span class="qf">fades ${fadeLen(markOf(f)).toFixed(0)}s</span>`:''}</div></li>`}).join('')
    :'<li class="qe mono">The queue is empty. Use + on any track in the archive, the Queue button in the player bar, Q, or right-click.</li>';
  const extra=Object.keys(QS.scenes).filter(f=>qPos(f)<0);
  $('#qExtra').innerHTML=(QS.del.length?`<p class="mono qdh">Marked for deletion · ${QS.del.length}</p>`+QS.del.map(f=>`<div class="qx qdx"><button class="qdp" data-qdplay="${esc(f)}" title="Play">${esc(trackName(f))}</button><span class="mono">${esc(FILE2[f][0])}</span><button data-qdrm="${esc(f)}" aria-label="Unmark" title="Unmark">✕</button></div>`).join(''):'')
    +(extra.length?`<p class="mono">Scene associations outside the queue</p>`+extra.map(f=>{const s=sceneOf(f);return `<div class="qx"><span>${esc(trackName(f))}</span><span class="mono">S${pad(s+1)} · ${esc(SCENES[s].name)}</span><button data-qxrm="${esc(f)}" aria-label="Remove association">✕</button></div>`}).join(''):'');
}
function qOpen(o){const p=$('#qpanel');o=o??!p.classList.contains('open');if(o){openIndex(false);qRender()}p.classList.toggle('open',o);p.setAttribute('aria-hidden',!o);$('#qBtn').setAttribute('aria-expanded',o)}
function qMove(a,b){if(b<0||b>=QS.queue.length||a===b)return;const [f]=QS.queue.splice(a,1);QS.queue.splice(b,0,f);qSave()}
(()=>{
  const L=$('#qList');
  L.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
    if(d.qplay!=null){const [c,i]=FILE2[QS.queue[+d.qplay]];load(c,i)}
    else if(d.qup!=null)qMove(+d.qup,+d.qup-1);else if(d.qdn!=null)qMove(+d.qdn,+d.qdn+1);
    else if(d.qrm!=null){QS.queue.splice(+d.qrm,1);qSave()}
    else if(d.qsetin!=null)setMark(QS.queue[+d.qsetin],'in',au.currentTime);else if(d.qsetout!=null)setMark(QS.queue[+d.qsetout],'out',au.currentTime)});
  L.addEventListener('change',e=>{const s=e.target.closest('[data-qscene]');if(s)qSetScene(QS.queue[+s.dataset.qscene],s.value===''?null:+s.value);
    const mi=e.target.closest('[data-qin],[data-qout]');if(mi){const w=mi.dataset.qin!=null?'in':'out',f=QS.queue[+(mi.dataset.qin??mi.dataset.qout)],v=parseTc(mi.value);
      if(v===undefined){qToast('Use m:ss.s or seconds, e.g. 1:32.5');qRender()}else setMark(f,w,v)}});
  L.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-qin],[data-qout]'))e.target.blur()});
  let drag=-1;
  L.addEventListener('dragstart',e=>{const r=e.target.closest('.qr');if(!r)return;drag=+r.dataset.k;r.classList.add('drag');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',r.dataset.k)});
  L.addEventListener('dragover',e=>{const r=e.target.closest('.qr');if(!r||drag<0)return;e.preventDefault();$$('#qList .qr').forEach(x=>x.classList.remove('over'));r.classList.add('over')});
  L.addEventListener('drop',e=>{const r=e.target.closest('.qr');if(!r||drag<0)return;e.preventDefault();qMove(drag,+r.dataset.k);drag=-1});
  L.addEventListener('dragend',()=>{drag=-1;$$('#qList .qr').forEach(x=>x.classList.remove('over','drag'))});
  $('#qExtra').addEventListener('click',e=>{const b=e.target.closest('[data-qxrm]');if(b){delete QS.scenes[b.dataset.qxrm];qSave();return}
    const d=e.target.closest('[data-qdrm]');if(d){qToggleDel(d.dataset.qdrm);return}
    const pl=e.target.closest('[data-qdplay]');if(pl)load(...FILE2[pl.dataset.qdplay])});
  $('#delBtn').onclick=()=>qToggleDel(curFile());
  $('#qBtn').onclick=()=>qOpen();$('#qClose').onclick=()=>qOpen(false);
  $('#qAdd').onclick=()=>{const f=curFile();if(f)qToggle(f);else qToast('Play a track first')};
  $('#qCopy').onclick=qCopy;$('#qSaveBtn').onclick=qDownload;$('#qLoadBtn').onclick=()=>$('#qFile').click();
  $('#qFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)qImport(await f.text())};
  $('#qClear').onclick=()=>{if(confirm('Clear the queue, scene associations and trims? (Deletion marks are kept.)')){QS.queue=[];QS.scenes={};QS.marks={};qSave();qToast('Queue cleared')}};
  $('#qReset').onclick=()=>{if(confirm('Replace your local queue with the default order and scenes?')){QS.queue=[...DEFAULT_CONFIG.queue];QS.scenes={...DEFAULT_CONFIG.scenes};QS.marks={...(DEFAULT_CONFIG.marks||{})};qSave();qToast(`Default restored · ${QS.queue.length} tracks`)}};
})();

/* ---- export / import ---- */
function qExport(){
  const row=f=>{const [c,i]=FILE2[f];const [a,n]=splitT(BY[c].tr[i][0]);const s=sceneOf(f);
    const m=markOf(f);
    return {file:f,catalog:c,track:i+1,artist:a||BY[c].a,title:n,scene:s!=null?SCENES[s].id:null,scene_name:s!=null?SCENES[s].name:null,
      start:m.in??null,end:m.out??null,start_tc:m.in!=null?tc(m.in):null,end_tc:m.out!=null?tc(m.out):null}};
  return JSON.stringify({format:'section8-queue/1',exported:new Date().toISOString(),
    queue:QS.queue.map((f,k)=>Object.assign({n:k+1},row(f))),
    scenes:Object.keys(QS.scenes).map(row),
    marks:Object.keys(QS.marks).map(row),
    delete:QS.del.map(row)},null,2);
}
async function qCopy(){
  const txt=qExport();let ok=false;
  try{await navigator.clipboard.writeText(txt);ok=true}catch(e){}
  if(!ok){const t=document.createElement('textarea');t.value=txt;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();try{ok=document.execCommand('copy')}catch(e){}t.remove()}
  qToast(ok?`Copied ${QS.queue.length} tracks, ${Object.keys(QS.scenes).length} scenes${QS.del.length?`, ${QS.del.length} marked for deletion`:''}`:'Copy blocked by the browser · use Save instead');
}
async function qDownload(){
  const txt=qExport(),name=`section8-queue-${new Date().toISOString().slice(0,10)}.json`;
  if(window.showSaveFilePicker){try{const h=await showSaveFilePicker({suggestedName:name,types:[{description:'JSON',accept:{'application/json':['.json']}}]});const w=await h.createWritable();await w.write(txt);await w.close();qToast('Saved '+h.name);return}catch(e){if(e.name==='AbortError')return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);qToast('Saved '+name);
}
function qImport(txt){
  try{const o=JSON.parse(txt);const q=(o.queue||[]).map(x=>typeof x==='string'?x:x.file).filter(f=>FILE2[f]);
    const sc={};for(const x of [...(o.queue||[]),...(o.scenes||[])])if(x&&x.file&&FILE2[x.file]&&x.scene&&SI[x.scene]!=null)sc[x.file]=x.scene;
    const mk={};for(const x of [...(o.queue||[]),...(o.scenes||[]),...(o.marks||[])])if(x&&x.file&&FILE2[x.file]&&(x.start!=null||x.end!=null)){const m={};if(x.start!=null)m.in=+x.start;if(x.end!=null)m.out=+x.end;mk[x.file]=m}
    const dl=[...new Set((o.delete||o.del||[]).map(x=>typeof x==='string'?x:x&&x.file).filter(f=>FILE2[f]))];
    QS.queue=q;QS.scenes=sc;QS.marks=mk;QS.del=dl;qSave();qToast(`Loaded ${q.length} tracks, ${Object.keys(sc).length} scenes, ${Object.keys(mk).length} trims, ${dl.length} marked for deletion`)}
  catch(e){qToast('That file is not a Section 8 queue export')}
}

/* ---- right-click menu ---- */
(()=>{
  const M=$('#ctx');let tgt=null;
  const close=()=>{if(!M.classList.contains('open'))return;M.classList.remove('open');M.setAttribute('aria-hidden','true');
    if(!$('#srch').hidden){sRender();$('#sQ').focus({preventScroll:true})}};
  document.addEventListener('contextmenu',e=>{
    if(document.body.classList.contains('gated')||e.shiftKey||e.target.closest('input,textarea,select'))return;
    e.preventDefault();
    const w=e.target.closest('.trw,.sres'),qr=e.target.closest('.qr');
    tgt=w?w.dataset.f:qr?QS.queue[+qr.dataset.k]:curFile();
    const si=deck.cur.si,sc=SCENES[si];
    const items=[];
    if(!tgt)items.push(['','Play a track first',true]);
    else{
      const k=qPos(tgt),s=sceneOf(tgt);
      items.push(['hd',trackName(tgt),true]);
      items.push(['assoc',`Associate scene ${pad(si+1)} · ${sc.name}`,s===si]);
      if(s!=null)items.push(['unassoc',`Remove scene ${pad(s+1)} · ${SCENES[s].name}`]);
      if(tgt===curFile()){const m=markOf(tgt);items.push(['sep'],['mIn',`Set start here · ${tc(au.currentTime)}`],['mOut',`Set end here · ${tc(au.currentTime)} (fades out)`]);if(m.in!=null||m.out!=null)items.push(['mClr',`Clear start/end (${m.in!=null?tc(m.in):'0:00'} – ${m.out!=null?tc(m.out):'end'})`])}
      else if(QS.marks[tgt])items.push(['mClr','Clear start/end']);
      items.push(['sep']);
      items.push(k>=0?['qrm',`Remove from queue (#${k+1})`]:['qadd','Add to end of queue']);
      if(k<0&&curFile()&&tgt!==curFile()&&qPos(curFile())>=0)items.push(['qnext','Add after the current track']);
    }
    if(tgt)items.push(['sep'],isDel(tgt)?['undel','Unmark for deletion']:['del','Mark for deletion from the library']);
    items.push(['sep'],['qopen',`Open queue (${QS.queue.length})`],['hint','Shift + right-click for the browser menu',true]);
    M.innerHTML=items.map(([a,l,dis])=>a==='sep'?'<div class="cs"></div>':a==='hd'?`<div class="ch">${esc(l)}</div>`:a==='hint'?`<div class="ci">${esc(l)}</div>`:`<button role="menuitem" data-a="${a}"${dis?' disabled':''}>${esc(l)}</button>`).join('');
    M.classList.add('open');M.setAttribute('aria-hidden','false');
    const r=M.getBoundingClientRect();M.style.left=Math.min(e.clientX,innerWidth-r.width-8)+'px';M.style.top=Math.min(e.clientY,innerHeight-r.height-8)+'px';
    M.querySelector('button:not([disabled])')?.focus({preventScroll:true});
  });
  M.addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a;close();
    if(a==='assoc')qSetScene(tgt,deck.cur.si);else if(a==='unassoc')qSetScene(tgt,null);
    else if(a==='qadd'||a==='qrm')qToggle(tgt);
    else if(a==='qnext'){QS.queue.splice(qPos(curFile())+1,0,tgt);qSave();qToast('Queued after the current track')}
    else if(a==='qopen')qOpen(true);else if(a==='del'||a==='undel')qToggleDel(tgt);
    else if(a==='mIn')setMark(tgt,'in',au.currentTime);else if(a==='mOut')setMark(tgt,'out',au.currentTime);else if(a==='mClr')clearMarks(tgt)});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#ctx'))close()});
  addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(M.classList.contains('open')){close();e.stopImmediatePropagation();return}qOpen(false)});
  addEventListener('blur',close);
})();
addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select')||document.body.classList.contains('gated'))return;
  if(e.key==='q'){const f=curFile();if(f)qToggle(f);else qToast('Play a track first')}
  else if(e.key==='Q')qOpen();
  else if(e.key==='x'||e.key==='X')qToggleDel(curFile());
  else if(e.key===',')markHere('in');else if(e.key==='.')markHere('out');else if(e.key==='/')clearMarks(curFile());
});

$('#mIn').onclick=e=>e.shiftKey?setMark(curFile(),'in',null):markHere('in');
$('#mOut').onclick=e=>e.shiftKey?setMark(curFile(),'out',null):markHere('out');
qRefresh();
