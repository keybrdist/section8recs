/* ---------------- renderer: one material per scene, two decks, transition mixer, house post chain ---------------- */
const canvas=$('#world');
let R=null;
try{
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
  const mobile=matchMedia('(max-width: 760px)').matches;
  let q=Math.min(devicePixelRatio,1.25)*(mobile?.5:.68);
  renderer.setPixelRatio(q);renderer.setSize(innerWidth,innerHeight);
  const cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const atlas=buildTreeAtlas();
  S8L.stage('trees');await yieldFrame();
  const trees=new THREE.DataTexture(atlas.data,ATLAS_W,ATLAS_H,THREE.RedFormat,THREE.UnsignedByteType);
  trees.minFilter=THREE.LinearMipmapLinearFilter;trees.magFilter=THREE.LinearFilter;trees.generateMipmaps=true;trees.unpackAlignment=1;trees.needsUpdate=true;
  const cells=ATLAS_CELLS.map(([x,y,w,h])=>new THREE.Vector4(x/ATLAS_W,(ATLAS_H-(y+h))/ATLAS_H,w/ATLAS_W,h/ATLAS_H));
  const U={uRes:{value:new THREE.Vector2()},uTime:{value:0},uLow:{value:0},uMid:{value:0},uHigh:{value:0},uKick:{value:0},uLevel:{value:0},uSnare:{value:0},
    uAccent:{value:P.accent.clone()},uMouse:{value:new THREE.Vector2()},uFog:{value:1},uDensity:{value:1},uMirror:{value:0},uClear:{value:.3},uSeed:{value:P.seed},uZoom:{value:1.25},
    uPhenA:{value:3},uAmtA:{value:0},uPhenB:{value:0},uAmtB:{value:0},uLight:{value:new THREE.Vector2(0,-.07)},uX:{value:new THREE.Vector4(1,0,0,0)},
    uApp:{value:0},uAppX:{value:.02},uEyes:{value:0},uFlash:{value:0},uBoltX:{value:0},uBoltSeed:{value:0},uModes:{value:new THREE.Vector4(...P.modes)},
    uCamT:{value:0},uShake:{value:new THREE.Vector3()},uSpecies:{value:new THREE.Vector4(.5,.12,.12,.2)},uBeam:{value:new THREE.Vector2(0,-.02)},
    uTrees:{value:trees},uCells:{value:cells},uAtlas:{value:new THREE.Vector2(ATLAS_W,ATLAS_H)},
    uC:{value:Array.from({length:8},()=>new THREE.Vector4(0,0,0,0))},uCN:{value:0},uCStyle:{value:0},uCStage:{value:0},
    uScroll:{value:0},uSpec:{value:0},uSpecSeed:{value:0}};
  const geo=new THREE.PlaneGeometry(2,2);
  const stages=SCENE_GLSL.map((body,i)=>{const sc=new THREE.Scene();const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({name:SCENES[i].name,vertexShader:VERT,fragmentShader:COMMON+body+MAIN,uniforms:U}));m.frustumCulled=false;sc.add(m);return sc});
  const rtO={type:THREE.HalfFloatType,depthBuffer:false};
  const rtA=new THREE.WebGLRenderTarget(4,4,rtO),rtB=new THREE.WebGLRenderTarget(4,4,rtO);
  const mixSc=new THREE.Scene();const mix=new THREE.ShaderMaterial(MIX_SH);mix.uniforms.tA.value=rtA.texture;mix.uniforms.tB.value=rtB.texture;
  const mq=new THREE.Mesh(geo,mix);mq.frustumCulled=false;mixSc.add(mq);
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(mixSc,cam));
  const rays=new ShaderPass(RAYS_SH);composer.addPass(rays);
  const after=new AfterimagePass(.84);composer.addPass(after);
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.9,.62,.16);composer.addPass(bloom);
  const fin=new ShaderPass(FINAL_SH);composer.addPass(fin);
  const resize=()=>{renderer.setPixelRatio(q);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(q);composer.setSize(innerWidth,innerHeight);
    const b=new THREE.Vector2();renderer.getDrawingBufferSize(b);U.uRes.value.copy(b);fin.uniforms.uRes.value.copy(b);rtA.setSize(b.x,b.y);rtB.setSize(b.x,b.y)};
  resize();addEventListener('resize',resize);
  // a scene whose shader will not link on this GPU is skipped rather than left black
  const broken=new Set(),ready=new Set();
  const draw=(si,rt)=>{renderer.setRenderTarget(rt);renderer.render(stages[si],cam);renderer.setRenderTarget(null);ready.add(si);
    const pr=renderer.properties.get(stages[si].children[0].material).currentProgram;
    if(pr&&pr.diagnostics&&pr.diagnostics.runnable===false&&!broken.has(si)){broken.add(si);console.warn('Scene shader failed on this GPU, skipping:',SCENES[si].name);setTimeout(()=>{if(deck.cur.si===si)applyScene(nextScene(),true)},0)}};
  // compile every scene in the background so cutting between them never stalls
  const order=ALL_SCENES.filter(i=>i!==0);let oi=0;
  const pre=()=>{if(oi>=order.length)return;const si=order[oi++];
    (renderer.compileAsync?renderer.compileAsync(stages[si],cam):Promise.resolve()).then(()=>ready.add(si)).catch(()=>{}).finally(()=>setTimeout(pre,40))};
  setTimeout(pre,900);
  R={renderer,composer,U,rays,after,bloom,fin,mix,rtA,rtB,draw,resize,broken,ready,setQ(n){q=n;resize()},get q(){return q}};
}catch(e){document.body.classList.add('nogl');console.warn('WebGL unavailable',e)}

/* ---------------- state ---------------- */
const A={low:0,mid:0,high:0,kick:0,level:0,hit:false,hitS:false,snare:0,state:0};
const S={fog:1,density:1,clear:.3,amtA:0,amtB:0,tA:0,tB:0,phA:3,phB:0,lx:0,ly:-.07,rays:.34,bloom:.8,bleed:.84,zoom:1.25,app:0,eyes:0,flash:0,ir:0,inv:0,acq:0,mx:0,my:0,grade:0,gmode:0};
const T={light:[0,-.07],rays:.34};
const accNow=P.accent.clone(), accTgt=P.accent.clone();
let hoverC=null, pinned=null, curPhen=3, lastSceneT=0;
const deck={cur:{si:0,seed:LABEL.seed,mirror:0,sp:SCENES[0].sp},prev:null,p:1,mode:1,speed:1/1.6};
const G={mode:0,amt:0,gs:0,roll:0,set:[...P.glitch],kicks:0,snares:0,invCd:0,irNext:rand(28,50),irT:0,eyesNext:rand(9,18),eyesT:0,flashCd:0,idleNext:0,appT:0,lvlSlow:0};
const CAM={walkT:0,walkV:.3,stopUntil:0,nextStop:rand(14,26),whip:0,whipV:0,nextWhip:rand(6,12),tape:rand(600,3000),scroll:0};
const SPEC={v:0,next:rand(3,7),until:0,seed:0};
const CY={next:0,recent:[]};
let calm=reduced, drift=true, playing=false, cur={r:null,i:0}, mouse={x:0,y:0};
const history=[];

function setPhen(ph,amt,instant){
  curPhen=ph;
  if(ph<0){S.tA=0;S.tB=0}
  else if(S.phA===ph){S.tA=amt;S.tB=0}
  else if(S.phB===ph){S.tB=amt;S.tA=0}
  else if(S.amtA>=S.amtB){S.phB=ph;S.amtB=0;S.tB=amt;S.tA=0}
  else{S.phA=ph;S.amtA=0;S.tA=amt;S.tB=0}
  if(instant){S.amtA=S.tA;S.amtB=S.tB}
}
function applyScene(si,instant,fast){
  if(R&&R.broken.has(si))si=ALL_SCENES.find(i=>!R.broken.has(i))??0;
  const sc=SCENES[si],ph=phenFor(P,si);
  setPhen(ph,P.amt,instant);
  const r=mulberry(fnv(P.c+'|'+si));
  T.light=ph<0?[0,.24]:lightFor(ph,r,si);T.rays=ph<0?.3:RAYS[ph]*P.raysK;
  setCraft(sc.craft||CRAFT_PHEN[ph]||null,sc.roam);
  const nd={si,seed:P.seed+si*.37,mirror:sc.mirror,sp:sc.sp,scroll0:CAM.scroll};
  if(instant||!R){deck.cur=nd;deck.prev=null;deck.p=1}
  else{deck.prev={...deck.cur};deck.cur=nd;deck.p=0;deck.speed=fast?1/.9:1/1.6;deck.mode=calm?0:fast?[2,3,1,2,3][Math.floor(Math.random()*5)]:[1,2,3,1][Math.floor(Math.random()*4)]}
  lastSceneT=performance.now()/1000;
  CY.recent.push(si);if(CY.recent.length>8)CY.recent.shift();
  sceneUI();
}
function nextScene(){
  const pool=ALL_SCENES.filter(i=>i!==deck.cur.si&&!CY.recent.includes(i)&&(!R||(R.ready.has(i)&&!R.broken.has(i))));
  const L=pool.length?pool:ALL_SCENES.filter(i=>i!==deck.cur.si);
  return L[Math.floor(Math.random()*L.length)];
}
function applyProfile(p,instant,si){
  P=p;accTgt.copy(p.accent);G.set=[...p.glitch];
  if(R){R.U.uModes.value.set(...p.modes);}
  document.documentElement.style.setProperty('--scanP',p.scanP+'px');
  document.documentElement.style.setProperty('--scanO',calm?p.scanO*.6:p.scanO);
  drawBarcode(p.c==='LABEL'?'SECTION8':p.c);$('#codeTxt').textContent=p.c==='LABEL'?'SECTION8':p.c;
  applyScene(pinned??si??p.scene,instant);
}
function setScene(si,pin){
  if(pin!==undefined)pinned=pin?si:null;
  applyScene(si,false);acquire();noteScene(deck.cur.si);
}
function sceneUI(){
  const si=deck.cur.si,sc=SCENES[si];
  $('#scNo').textContent=pad(si+1);$('#scName').textContent=sc.name;
  $('#vPhen').innerHTML=`Scene ${pad(si+1)} :: <b>${esc(sc.name)}</b>${curPhen>=0?` · ${esc(PHEN[curPhen])}`:''}`;
  $$('#sceneMenu [data-sc]').forEach(b=>b.setAttribute('aria-checked',pinned===+b.dataset.sc||(pinned==null&&b.dataset.sc==='auto')));
  $$('#sceneMenu [data-sc]').forEach(b=>b.classList.toggle('live',+b.dataset.sc===si));
  const tape=sc.hud==='tape'||sc.hud==='nv';
  $('#tape').classList.toggle('on',tape);$('#tape').classList.toggle('nv',sc.hud==='nv');document.body.classList.toggle('tape-on',tape);
  $('#tapeMode').textContent=sc.hud==='nv'?'NIGHTSHOT':'SP';
  $('#flir').classList.toggle('on',sc.hud==='flir');
}
