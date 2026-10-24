
/* ---------------- phones: compact now-playing, swipe between tracks, favourites, the sky kept clear of the text ---------------- */
const NARROW=matchMedia('(max-width: 760px)');

// now playing: on a phone only the key lines show (the scene needs the room); the 8 sigil, or the Section 8 mark at the
// top left, shows or hides the rest
(()=>{const NK='s8.npfull';let full=false;try{full=localStorage.getItem(NK)==='1'}catch(e){}
  const sig=$('#sigil'),brand=$('.brand');
  const set=v=>{full=v;document.body.classList.toggle('np-full',v);for(const el of [sig,brand]){el.setAttribute('aria-expanded',v)}
    try{localStorage.setItem(NK,v?'1':'0')}catch(e){}};
  for(const el of [sig,brand]){el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-controls','np');el.setAttribute('aria-label','Show or hide the full track details');
    el.addEventListener('click',()=>set(!full));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();set(!full)}})}
  set(full)})();

// swipe up for the next track, down for the previous one. Only a deliberate flick counts: one finger, mostly vertical,
// at least 80 px and an eighth of the screen, within 0.8 s, not started on a control or an open panel
(()=>{let s=null;
  const blocked=t=>document.body.classList.contains('gated')||t.closest('button,a,input,select,[role="button"],.seek,#index,#qpanel,#srch,#sceneMenu,#ctx,#favDlg')
    ||$('#index').classList.contains('open')||$('#qpanel').classList.contains('open')||!$('#srch').hidden||!$('#favDlg').hidden||$('#sceneMenu').classList.contains('open');
  // timed by the events' own timestamps: the render loop can hold up handling, and a quick flick must not read as slow
  addEventListener('touchstart',e=>{s=e.touches.length===1&&!blocked(e.target)?{x:e.touches[0].clientX,y:e.touches[0].clientY,t:e.timeStamp}:null},{passive:true});
  // a vertical drag would otherwise pull the page (refresh or rubber-band) instead of changing track
  addEventListener('touchmove',e=>{if(!s)return;if(e.touches.length>1){s=null;return}const dy=e.touches[0].clientY-s.y,dx=e.touches[0].clientX-s.x;
    if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)&&e.cancelable)e.preventDefault()},{passive:false});
  addEventListener('touchend',e=>{if(!s)return;const c=e.changedTouches[0],dx=c.clientX-s.x,dy=c.clientY-s.y,dt=e.timeStamp-s.t;s=null;
    if(dt>800||Math.abs(dy)<Math.max(80,innerHeight*.12)||Math.abs(dy)<Math.abs(dx)*2.5)return;
    if(dy<0){next();qToast('Next ▲')}else{prev(true);qToast('Previous ▼')}},{passive:true});
  addEventListener('touchcancel',()=>{s=null},{passive:true});
})();

// the heart: a track's outlets, and favourites kept on this device (apart from the queue). The outlet links load the first
// time the dialog opens, so they add nothing to the page load.
const FAVK='s8.favorites.v1';
const FAV=(()=>{try{const a=JSON.parse(localStorage.getItem(FAVK)||'[]');return Array.isArray(a)?a.filter(x=>x&&x.f):[]}catch(e){return []}})();
const favSave=()=>{try{localStorage.setItem(FAVK,JSON.stringify(FAV))}catch(e){}};
const isFav=f=>FAV.some(x=>x.f===f);
const OUTLETS={spotify:'Spotify',applemusic:'Apple Music',bandcamp:'Bandcamp',beatport:'Beatport',deezer:'Deezer',tidal:'Tidal',amazon:'Amazon',
  juno:'Juno',soundcloud:'SoundCloud',youtubemusic:'YouTube Music',youtube:'YouTube',pandora:'Pandora'};
let LINKS=null;const linksFor=()=>LINKS||(LINKS=fetch(LINKS_URL).then(r=>r.json()).catch(()=>{LINKS=null;return {}}));
function favMark(){const f=cur.r&&curFile(),on=!!f&&isFav(f);const b=$('#favBtn');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)}
function favToggle(f){if(!f)return;const k=FAV.findIndex(x=>x.f===f);
  if(k>=0)FAV.splice(k,1);else{const [c,i]=FILE2[f];const [a,n]=splitT(BY[c].tr[i][0]);FAV.unshift({f,c,i,t:n,a:a||BY[c].a,at:new Date().toISOString()})}
  favSave();favMark();if(!$('#favDlg').hidden)favRender();qToast(k>=0?'Removed from favorites':'Saved to favorites')}
async function favRender(){
  const D2=$('#favDlg');const f=cur.r?curFile():null;
  const head=cur.r?(()=>{const r=cur.r,[a,n]=splitT(r.tr[cur.i][0]);return `<p class="mono fk">${esc(r.c)} · ${pad(cur.i+1)} / ${pad(r.tr.length)}</p><h2 id="favT">${esc(n)}</h2><p class="fs">${esc(a||r.a)} <em>— ${esc(r.t)}</em></p>
    <button class="fb${isFav(f)?' on':''}" id="favTog" aria-pressed="${isFav(f)}"><span aria-hidden="true">${isFav(f)?'♥':'♡'}</span>${isFav(f)?'Saved to favorites':'Save to favorites'}</button>`})()
    :`<p class="mono fk">Favorites</p><h2 id="favT">Nothing playing</h2>`;
  const saved=FAV.map((x,k)=>`<li><button class="fp" data-fp="${k}"${FILE2[x.f]?'':' disabled'}><span>${esc(x.t)}</span><em>${esc(x.a)}</em></button><button class="fx" data-fx="${k}" aria-label="Remove ${esc(x.t)} from favorites">✕</button></li>`).join('');
  D2.querySelector('.fbody').innerHTML=head+(cur.r?`<p class="mono fh">Listen elsewhere</p><ul class="fo" id="favOut"><li class="mono fwait">Loading links…</li></ul>`:'')
    +`<p class="mono fh">Saved on this device <span>${FAV.length}</span></p>`+(FAV.length?`<ul class="fl">${saved}</ul>`:`<p class="fe">Tap the heart on a track to keep it here.</p>`);
  if(cur.r){const r=cur.r,L=(await linksFor())[r.c]||{};if($('#favDlg').hidden||cur.r!==r)return;
    $('#favOut').innerHTML=Object.entries(L).filter(([k])=>OUTLETS[k]).map(([k,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${OUTLETS[k]} <span aria-hidden="true">↗</span></a></li>`).join('')
      +`<li><a href="/cat/${encodeURIComponent(r.c)}">Release page <span aria-hidden="true">→</span></a></li>`}
}
function favOpen(o){const D2=$('#favDlg');o=o??D2.hidden;D2.hidden=!o;$('#favBtn').setAttribute('aria-expanded',o);if(o){favRender();setTimeout(()=>$('#favClose').focus({preventScroll:true}),30)}}
$('#favBtn').onclick=()=>favOpen(true);
$('#favDlg').addEventListener('click',e=>{
  if(e.target.id==='favDlg'||e.target.closest('#favClose'))return favOpen(false);
  if(e.target.closest('#favTog'))return favToggle(curFile());
  const p=e.target.closest('[data-fp]');if(p){const x=FAV[+p.dataset.fp],t=FILE2[x.f];if(t){load(...t);favOpen(false)}return}
  const x=e.target.closest('[data-fx]');if(x){favToggle(FAV[+x.dataset.fx].f)}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#favDlg').hidden)favOpen(false)});

// the looking-up scenes turn the sky about the centre (and zoom out on a portrait screen), so where a craft appears on
// screen keeps moving. On a phone, keep every craft, and the light they hold station on, above the bottom third, where the
// now-playing text sits. The angles mirror each scene's shader (site/src/v4-scenes-*.js).
const UP_TURN={clearing:(t,m)=>t*.012+m*.06,underneath:t=>t*.01,deadcanopy:(t,m)=>t*.01+m*.06+.03*Math.sin(t*.2),well:t=>.03*Math.sin(t*.07)};
const UP_FLOOR=-.5+1/3+.03;
function upClamp(P){
  const turn=UP_TURN[SCENES[deck.cur.si]?.id];if(!turn||!R||!(NARROW.matches||innerHeight>innerWidth))return;
  const asp=innerWidth/innerHeight,q=Math.min(1,Math.max(0,(asp-1)/(.5-1))),pf=1+.65*q*q*(3-2*q);
  const a=turn(R.U.uTime.value,R.U.uMouse.value.x),c=Math.cos(a),s=Math.sin(a);
  // scene = rot2(a)·(screen·pf) with rot2(a) = mat2(c,-s,s,c); screen = its transpose applied to scene, over pf
  const X=(c*P[0]-s*P[1])/pf,Y=(s*P[0]+c*P[1])/pf;if(Y>=UP_FLOOR)return;
  const Xs=X*pf,Ys=UP_FLOOR*pf;P[0]=c*Xs+s*Ys;P[1]=-s*Xs+c*Ys}
