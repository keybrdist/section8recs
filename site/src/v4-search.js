/* ---------------- track search: every one of the 467 tracks, ranked, playable from the keyboard ---------------- */
const TRACKS=[];D.forEach(r=>r.tr.forEach((t,i)=>{const [a,n]=splitT(t[0]);const ta=a||r.a;
  TRACKS.push({c:r.c,i,f:t[1],n,a:ta,r,nl:n.toLowerCase(),al:ta.toLowerCase(),
    hay:[n,ta,r.a,r.t,r.c,r.d.slice(0,4),r.s.join(' '),t[1]].join(' ').toLowerCase()})}));
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function hl(text,words){let h=esc(text);if(!words.length)return h;
  const re=new RegExp('('+words.map(w=>reEsc(esc(w))).join('|')+')','gi');return h.replace(re,'<mark>$1</mark>')}
function searchTracks(q){
  const w=q.toLowerCase().split(/\s+/).filter(Boolean);
  if(!w.length)return {w,list:QS.queue.map(f=>TRACKS.find(t=>t.f===f)).filter(Boolean),empty:true};
  const out=[];
  for(const t of TRACKS){if(!w.every(x=>t.hay.includes(x)))continue;
    let s=0;for(const x of w){if(t.nl.startsWith(x))s+=6;else if(t.nl.includes(x))s+=4;if(t.al.startsWith(x))s+=3;else if(t.al.includes(x))s+=2}
    out.push([s,t])}
  out.sort((a,b)=>b[0]-a[0]||b[1].r.d.localeCompare(a[1].r.d)||a[1].i-b[1].i);
  return {w,list:out.slice(0,80).map(x=>x[1]),total:out.length};
}
const SR={sel:0,list:[]};
function sRender(){
  const q=$('#sQ').value,res=searchTracks(q);SR.list=res.list;SR.sel=Math.min(SR.sel,Math.max(0,SR.list.length-1));
  const cf=curFile();
  $('#sMeta').textContent=res.empty?(SR.list.length?`Type to search all ${TRACKS.length} tracks · showing your queue`:`Type to search all ${TRACKS.length} tracks by title, artist, release, catalog number, year or style`)
    :res.total?`${res.total} match${res.total===1?'':'es'}${res.total>80?' · showing the best 80':''}`:'Nothing matches that';
  $('#sList').innerHTML=SR.list.map((t,k)=>`<li class="sres${k===SR.sel?' sel':''}${t.f===cf?' now':''}${isDel(t.f)?' del':''}" data-f="${esc(t.f)}" data-k="${k}" role="option" aria-selected="${k===SR.sel}">
    <button class="sp-play" data-splay="${k}"><span class="sn">${hl(t.n,res.w)}</span><span class="sa">${hl(t.a,res.w)} <i>· ${hl(t.r.t,res.w)} · ${t.r.c} · ${t.r.d.slice(0,4)}</i></span></button>
    <span class="mk">${marksFor(t.f)}</span><button class="tq${qPos(t.f)>=0?' on':''}" data-sq="${k}" aria-label="${qPos(t.f)>=0?'Remove from queue':'Add to queue'}">${qPos(t.f)>=0?'✓':'+'}</button></li>`).join('');
  $('#sList .sel')?.scrollIntoView({block:'nearest'});
}
function sOpen(o){const s=$('#srch');o=o??s.hidden;s.hidden=!o;if(o){openIndex(false);qOpen(false);SR.sel=0;sRender();$('#sQ').focus();$('#sQ').select()}}
function sPlay(k){const t=SR.list[k];if(!t)return;load(t.c,t.i);sOpen(false)}
(()=>{
  $('#sBtn').onclick=()=>sOpen(true);
  $('#sQ').addEventListener('input',()=>{SR.sel=0;sRender()});
  $('#sQ').addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();SR.sel=(SR.sel+(e.key==='ArrowDown'?1:-1)+SR.list.length)%Math.max(1,SR.list.length);sRender()}
    else if(e.key==='Enter'){e.preventDefault();const t=SR.list[SR.sel];if(!t)return;if(e.shiftKey){qToggle(t.f);sRender()}else sPlay(SR.sel)}
    else if(e.key==='Escape'){e.preventDefault();sOpen(false)}});
  $('#sList').addEventListener('click',e=>{const q=e.target.closest('[data-sq]');if(q){qToggle(SR.list[+q.dataset.sq].f);sRender();$('#sQ').focus();return}
    const p=e.target.closest('[data-splay]');if(p)sPlay(+p.dataset.splay)});
  $('#sList').addEventListener('pointermove',e=>{const r=e.target.closest(".sres");if(r&&+r.dataset.k!==SR.sel){SR.sel=+r.dataset.k;$$('#sList .sres').forEach(x=>x.classList.toggle('sel',+x.dataset.k===SR.sel))}});
  $('#srch').addEventListener('pointerdown',e=>{if(e.target.id==='srch')sOpen(false)});
  addEventListener('keydown',e=>{
    if(document.body.classList.contains('gated'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();sOpen(true);return}
    if(e.key==='Escape'&&!$('#srch').hidden){sOpen(false);return}
    if(e.target.closest('input,textarea,select'))return;
    if(e.key==='s'||e.key==='S'){e.preventDefault();sOpen(true)}});
})();
// archive search also opens releases whose tracks match and marks those tracks
(()=>{
  $('#q').addEventListener('input',e=>{
    const w=e.target.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    $$('#ixList .trk.hit').forEach(x=>x.classList.remove('hit'));
    if(!w.length||w.join('').length<3)return;
    const hitRel=new Set(TRACKS.filter(t=>w.every(x=>(t.nl+' '+t.al).includes(x))).map(t=>t.c));
    let n=0;for(const c of hitRel){if(n++>=12)break;const rw=$(`#ixList .rw[data-c="${c}"]`);if(!rw||rw.hidden)continue;expand(c,true);
      rw.querySelectorAll('.trw').forEach((tw,i)=>{const t=TRACKS.find(x=>x.f===tw.dataset.f);if(t&&w.every(x=>(t.nl+' '+t.al).includes(x)))tw.querySelector('.trk').classList.add('hit')})}
  });
})();
