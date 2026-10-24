/* ---------------- scenes + release profiles: the label's visual grammar per recording ---------------- */
// sp = tree mix [evergreen, pine, snag, dead mesquite] (remainder bare deciduous); craft regions are in fractions of the half-width
const SC=o=>Object.assign({phen:[],mirror:0,sp:[.5,.12,.12,.2],scroll:false},o);
const SCENES=[
  SC({id:'treeline',g:'Forest',name:'The treeline',note:'The label home ground, drifting sideways along the stand',phen:[0,1,2,3,4,5,6,7],sp:[.5,.12,.12,.2],scroll:true}),
  SC({id:'path',g:'Walks',name:'The path',note:'A slow walk in. Something stands far down the trail',phen:[3,5,6],sp:[.55,.15,.12,.12],cam:'walk',spec:'path'}),
  SC({id:'well',g:'Looking up',name:'Looking up · The well',note:'From the bottom of a dry well: a black triangle hangs over the opening',cam:'spin',spec:'event',rays:'none',
    craft:{mode:'meander',n:1,x:[-.06,.06],y:[-.05,.05],abs:true,size:.055,style:2,speed:.008}}),
  SC({id:'effigies',g:'Found footage',name:'Found footage · Effigies',note:'Camcorder, flashlight, stick effigies',cam:'hand',grade:1,hud:'tape',sp:[0,0,0,.6]}),
  SC({id:'valley',g:'Sightings',name:'The valley',note:'Dark hills, valley lights that follow each other, after Hessdalen',phen:[2,4,5],sp:[1,0,0,0],scroll:true,
    craft:{mode:'follow',n:3,x:[-.75,.75],y:[-.13,.02],size:.0065,stage:1,speed:.035,gap:.07}}),
  SC({id:'range',g:'Sightings',name:'The range',note:'Rock peaks under a V of lights, after Phoenix',phen:[8,5,4],sp:[.85,.1,.05,0],scroll:true}),
  SC({id:'plain',g:'Sightings',name:'The plain',note:'Mesas, power lines, a horizon light that splits and rejoins, after Marfa',phen:[1,5],sp:[.6,.2,.2,0],
    craft:{mode:'split',n:3,x:[-.5,.5],y:[-.052,-.04],size:.0038,stage:1,speed:.02,gap:.09}}),
  SC({id:'lake',g:'Forest',name:'The lake',note:'Still water and whatever hangs above it',phen:[0,1,3,5,7],sp:[.62,.12,.1,.12],scroll:true}),
  SC({id:'field',g:'Films',name:'The field',note:'Crop circle and farmhouse, after Signs',phen:[0,1,7],sp:[.55,.2,.1,.1],scroll:true,roam:{hz:.14}}),
  SC({id:'tower',g:'Films',name:'The tower',note:'Butte and mothership, after Close Encounters',phen:[],mirror:0,sp:[.8,.2,0,0],scroll:true,rays:'none',
    craft:{mode:'follow',n:3,x:[-.6,.6],y:[-.08,.18],size:.005,stage:0,speed:.06,gap:.06}}),
  SC({id:'road',g:'Films',name:'Logging road',note:'Stopped crew truck, light past the pines, one man walking out to it, after Fire in the Sky',phen:[1],sp:[.72,.26,.02,0],rays:'none'}),
  SC({id:'clearing',g:'Looking up',name:'Looking up · Clearing',note:'Open sky, the Milky Way, a black triangle and its escorts',phen:[7],sp:[1,0,0,0],cam:'spin',roam:{sortie:1}}),
  SC({id:'underneath',g:'Looking up',name:'Looking up · Underneath',note:'Directly below it, looking straight up',sp:[1,0,0,0],cam:'spin',rays:'up'}),
  SC({id:'deadcanopy',g:'Looking up',name:'Looking up · Dead canopy',note:'Bare branches against a moonlit overcast, crows',phen:[5,0],sp:[0,0,0,1],cam:'spin'}),
  SC({id:'deadfall',g:'Walks',name:'Walk · Deadfall',note:'Dead mesquite and fallen logs; figures between the trunks',phen:[5,3],sp:[.18,.04,.2,.5],cam:'walk',spec:'trees'}),
  SC({id:'hollow',g:'Walks',name:'Walk · The hollow',note:'Dense dark spruce, ground fog to the knees',phen:[6,3],sp:[.8,.05,.1,.05],cam:'walk',spec:'trees'}),
  SC({id:'burn',g:'Walks',name:'Walk · Burn scar',note:'Charred snags, ash underfoot, embers that will not go out',phen:[5,4],sp:[.06,.02,.42,.45],cam:'walk',spec:'trees'}),
  SC({id:'oldroad',g:'Walks',name:'Walk · Old road',note:'An abandoned road, fence posts leaning in',phen:[1,0,5],sp:[.45,.12,.18,.2],cam:'walk',spec:'trees'}),
  SC({id:'creek',g:'Walks',name:'Walk · Creek bed',note:'Pale stones down a dry creek, bare trees either side',phen:[6,5],sp:[.4,.05,.1,.15],cam:'walk',spec:'trees'}),
  SC({id:'nightvision',g:'Found footage',name:'Found footage · Night vision',note:'Running through the trees on infrared',sp:[.4,.1,.2,.3],cam:'run',grade:2,hud:'nv',spec:'trees'}),
  SC({id:'ball',g:'Sightings',name:'Ball lightning',note:'Plasma over a storm field, arcing to the ground',sp:[.5,.1,.2,.2],scroll:true,
    craft:{mode:'orbit',n:2,x:[-.45,.45],y:[-.09,.02],size:.028,style:3,stage:1,speed:.025,r:.11,w:.18}}),
  SC({id:'orbs',g:'Sightings',name:'Ground orbs',note:'Lights floating at knee height through the meadow',sp:[.6,.1,.1,.2],scroll:true,
    craft:{mode:'swarm',n:6,x:[-.9,.9],y:[-.27,-.1],size:.011,stage:2,speed:.03,gap:.12}}),
  SC({id:'gimbal',g:'FLIR',name:'FLIR · Gimbal',note:'Targeting pod footage: it rotates, and there is a fleet',grade:3,hud:'flir',
    craft:{mode:'fleet',n:4,x:[-.95,-.2],y:[.05,.22],size:.009,speed:.012,gap:.1}}),
  SC({id:'tictac',g:'FLIR',name:'FLIR · Tic Tac',note:'Locked on, until it leaves',grade:3,hud:'flir'}),
  SC({id:'tictactrack',g:'FLIR',name:'FLIR · Tic Tac tracked',note:'The pod holds it in the gate while the sea streams past; zoom and polarity switch',grade:3,hud:'flir'}),
  SC({id:'farm',g:'Sightings',name:'The farm, 1950',note:'A disc over the yard, after the McMinnville photographs',grade:4,
    craft:{mode:'meander',n:1,x:[.05,.45],y:[.12,.24],size:.06,style:1,speed:.006}}),
  SC({id:'rendlesham',g:'Sightings',name:'Rendlesham',note:'Lights in the pines, the lighthouse sweeping through',sp:[.25,.6,.1,.05],scroll:true,
    craft:{mode:'mother',n:4,x:[-.5,.5],y:[-.12,-.02],size:.006,stage:1,speed:.04}}),
  SC({id:'shell',g:'Films',name:'The shell',note:'It hangs over the meadow, after Arrival',sp:[.7,.1,.1,.1],scroll:true,
    craft:{mode:'orbit',n:2,x:[-.2,.4],y:[.0,.22],size:.0035,stage:1,speed:.03,r:.28,w:.09}}),
];
const SI=Object.fromEntries(SCENES.map((s,i)=>[s.id,i]));
const SCENE_GROUPS=['Forest','Walks','Looking up','Found footage','Sightings','FLIR','Films'];
const PHEN=['Aerial lights','Overhead craft','The curtain','The 8','Dry lightning','Black moon','Ground lights','Black triangle','V formation'];
const RAYS=[0.7,0.55,0.5,0.34,0.45,0.6,0.45,0.5,0.6];
const ACC={'Darkstep':'#ff2424','Hardstep':'#ff7b1c','Technoid':'#38d6ff','Neuro':'#9a66ff','Techstep':'#b4ff38','Jungle':'#2cff9b','Halftime':'#4a72ff',
  'Minimal':'#e6dfcc','Dubstep':'#ff3ccf','Leftfield Bass':'#2cf0cf','Future Bass':'#7aeeff','Crossbreed':'#ff4718','Experimental':'#cfd0ff','Breakbeat':'#ffad38',
  'Drumstep':'#ff5a3a','Hip-Hop':'#ffd04a','Indie Dance':'#ff7ad6','Industrial':'#c9c9c9','Drum & Bass':'#fe0101'};
const PHEN_BY={'Darkstep':[5,3,1],'Hardstep':[4,0,5,8],'Technoid':[0,4,2,7],'Neuro':[2,3,0,7],'Techstep':[4,1,0],'Jungle':[6,2],'Halftime':[1,6,2],'Minimal':[2,6,5],
  'Dubstep':[1,4,7],'Leftfield Bass':[2,6],'Future Bass':[2,6],'Crossbreed':[4,5],'Experimental':[3,2,7],'Breakbeat':[0,6,8]};
const SCENE_BY=Object.fromEntries(Object.entries({
  'Darkstep':['treeline','effigies','tower','deadfall','burn','deadcanopy'],'Hardstep':['range','road','field','ball'],
  'Technoid':['plain','range','valley','underneath','gimbal','tictac','tictactrack'],'Neuro':['well','tower','valley','underneath','shell','nightvision'],
  'Techstep':['road','plain','gimbal','tictactrack'],'Jungle':['path','treeline','deadcanopy','hollow','creek'],
  'Halftime':['lake','path','well','clearing','hollow','orbs'],'Minimal':['valley','lake','clearing','farm'],'Dubstep':['field','effigies','underneath','ball'],
  'Leftfield Bass':['lake','well','clearing','shell','orbs'],'Future Bass':['lake','clearing','underneath','shell'],
  'Crossbreed':['effigies','road','deadcanopy','nightvision','burn'],'Experimental':['well','tower','underneath','clearing','rendlesham','tictac'],
  'Breakbeat':['plain','field','rendlesham','orbs']}).map(([k,v])=>[k,v.map(id=>SI[id])]));
const ALL_SCENES=SCENES.map((_,i)=>i);
const GLITCH_POOL=[1,1,2,2,3,4,4,5,6,7];
function rand2(r,a,b){return a+r()*(b-a)}
function baseLight(ph,r){
  switch(ph){
    case 0:return [rand2(r,-.35,.35),rand2(r,.22,.3)];
    case 1:return [rand2(r,-.22,.22),rand2(r,.29,.34)];
    case 2:return [rand2(r,-.25,.25),.24];
    case 3:return [rand2(r,-.03,.03),-.07];
    case 4:return [rand2(r,-.3,.3),.3];
    case 5:return [rand2(r,-.42,.42),rand2(r,.25,.29)];
    case 7:return [rand2(r,-.25,.25),rand2(r,.24,.32)];
    case 8:return [rand2(r,-.2,.2),rand2(r,.27,.33)];
    default:return [0,-.24];
  }
}
const MIN_LY={path:.12,valley:.1,range:.3,plain:.12,lake:.04,field:.28,road:.22,oldroad:.14,deadfall:.12};
function lightFor(ph,r,si){
  let [x,y]=baseLight(ph,r);const id=SCENES[si].id;
  if(['well','clearing','deadcanopy'].includes(id)){x=rand2(r,-.22,.22);y=rand2(r,-.12,.16)}
  if(id==='well'){x=rand2(r,-.05,.05);y=rand2(r,-.05,.05)}
  if(id==='road'&&ph===1){x=rand2(r,.12,.22);y=rand2(r,.2,.26)}
  if(ph===3&&id==='lake')y=.05;
  if(ph===3&&SCENES[si].cam==='walk')y=-.02;
  if(MIN_LY[id]!=null&&ph!==6&&ph!==3)y=Math.max(y,MIN_LY[id]);
  return [x,y];
}
function modePair(r){return [1+Math.floor(r()*6),2+Math.floor(r()*7),1+Math.floor(r()*8),1+Math.floor(r()*8)]}
const PCACHE={};
function profile(rel){
  if(PCACHE[rel.c])return PCACHE[rel.c];
  return PCACHE[rel.c]=makeProfile(rel);
}
function makeProfile(rel){
  const r=mulberry(fnv(rel.c));
  const style=rel.s.find(x=>x!=='Drum & Bass')||'Drum & Bass';
  const base=new THREE.Color(ACC[style]||'#fe0101');
  const hsl={};base.getHSL(hsl);base.setHSL((hsl.h+(r()-.5)*.03+1)%1,Math.min(1,hsl.s*(.9+r()*.15)),hsl.l);
  const sp=SCENE_BY[style]||ALL_SCENES;
  const scene=sp[Math.floor(r()*sp.length)];
  const set=[];const gp=[...GLITCH_POOL];while(set.length<3){const m=gp.splice(Math.floor(r()*gp.length),1)[0];if(!set.includes(m))set.push(m)}
  return {c:rel.c,style,accent:base,scene,amt:.7+r()*.3,fog:.82+r()*.45,density:.85+r()*.4,mirror:r()<.8?1:0,clear:.24+r()*.2,
    glitch:set,glitchiness:.55+r()*.6,bleed:.78+r()*.14,bloom:.75+r()*.5,raysK:.8+r()*.4,
    seed:Math.floor(r()*90)+r(),modes:modePair(r),scanP:r()<.5?3:4,scanO:.38+r()*.3,rng:r};
}
function phenFor(prof,si){
  if(prof.c==='LABEL'&&SCENES[si].id==='treeline')return 3;
  const pool=SCENES[si].phen;if(!pool.length)return -1;
  const st=PHEN_BY[prof.style];const both=st?pool.filter(x=>st.includes(x)):[];
  const L=both.length?both:pool;return L[fnv(prof.c+':'+si)%L.length];
}
const LABEL={c:'LABEL',style:'Drum & Bass',accent:new THREE.Color('#fe0101'),scene:SI.clearing,amt:.85,fog:1,density:1,mirror:1,clear:.3,
  glitch:[1,4,6],glitchiness:.7,bleed:.84,bloom:.8,raysK:1,seed:8.08,modes:[2,5,3,4],scanP:3,scanO:.5,rng:mulberry(8)};
let P=LABEL;

/* ---------------- craft choreographer ----------------
   Behaviours modelled on published footage: follow-the-leader (Hessdalen), a rigid V that winks out light by light (Phoenix),
   one light splitting and rejoining (Marfa), a mothership sending satellites out and back (Rendlesham, Stephenville),
   a station-keeping fleet (Gimbal), slow orbiting pairs, and low flocking orbs.
   Everything is speed-capped so it reads as business as usual. */
const CRAFT_PHEN={0:{mode:'follow',n:4,x:[-.8,.8],y:[.14,.32],size:.0055,speed:.035,gap:.06},
  8:{mode:'formation',n:7,x:[-.6,.6],y:[.22,.32],size:.0045,speed:.02,gap:.05},
  1:{mode:'escort',n:3,size:.0045,speed:.05},7:{mode:'escort',n:2,size:.0042,speed:.05}};
const CR={cfg:null,n:0,P:[],V:[],I:[],S:[],ph:[],wp:[],cyc:[],roam:null,ex:[],exNext:[]};
const wob=(t,a,b)=>Math.sin(t*a+b)*.6+Math.sin(t*a*2.3+b*1.7)*.3+Math.sin(t*a*5.1+b*.3)*.1;
function craftRegion(c){const asp=innerWidth/innerHeight,hx=c.abs?1:Math.min(asp,2.2)*.5;return {x0:(c.x||[-.8,.8])[0]*hx,x1:(c.x||[-.8,.8])[1]*hx,y0:(c.y||[.1,.3])[0],y1:(c.y||[.1,.3])[1]}}
function setCraft(c,roam){
  CR.roam=c&&roam||null;CR.sortieNext=null;
  CR.cfg=c?{size:.005,speed:.03,style:0,stage:0,gap:.06,...c}:null;CR.n=c?Math.min(8,c.n):0;
  const g=c?craftRegion(CR.cfg):{x0:0,x1:0,y0:0,y1:0};
  for(let i=0;i<8;i++){CR.P[i]=[(g.x0+g.x1)/2+(Math.random()-.5)*(g.x1-g.x0)*.6,(g.y0+g.y1)/2+(Math.random()-.5)*(g.y1-g.y0)*.6];
    CR.V[i]=[0,0];CR.I[i]=0;CR.S[i]=c?CR.cfg.size:0;CR.ph[i]=Math.random()*40;CR.wp[i]=null;CR.cyc[i]=-1;CR.ex[i]=null;CR.exNext[i]=null}
}
function tickCraft(dt,t){
  const c=CR.cfg,U=R&&R.U;if(!U)return;
  if(!c){for(let i=0;i<8;i++)U.uC.value[i].w=0;U.uCN.value=0;return}
  const g=craftRegion(c),cx=(g.x0+g.x1)/2,cy=(g.y0+g.y1)/2,rx=(g.x1-g.x0)/2,ry=(g.y1-g.y0)/2,vm=c.speed,n=CR.n;
  // a craft on an excursion ignores its formation and heads for its waypoint instead
  const steer=(i,tx,ty,k,v=vm)=>{const e=CR.ex[i];if(e){tx=e.x;ty=e.y;k=e.k||.5;v=vm*(e.v||1.5)}const P=CR.P[i],V=CR.V[i],d=1.6*Math.sqrt(k);V[0]+=((tx-P[0])*k-V[0]*d)*dt;V[1]+=((ty-P[1])*k-V[1]*d)*dt;
    const s=Math.hypot(V[0],V[1]);if(s>v){V[0]*=v/s;V[1]*=v/s}P[0]+=V[0]*dt;P[1]+=V[1]*dt};
  const It=new Array(n).fill(1),Sz=new Array(n).fill(c.size);
  const ss=(a,b,x)=>{const q=Math.min(1,Math.max(0,(x-a)/(b-a)));return q*q*(3-2*q)};
  // roaming scenes: now and then a craft leaves, off the edge of the frame or down behind the horizon, waits, and comes back
  // sorties: every so often the whole escort flies out from the mother craft in different directions, waits, and returns
  if(CR.roam&&CR.roam.sortie){
    if(CR.sortieNext==null)CR.sortieNext=t+rand(10,20);
    const away=CR.ex.slice(0,n).some(Boolean);
    if(!away&&t>CR.sortieNext){const a0=Math.random()*Math.PI*2,hx=innerWidth/innerHeight*.5;
      for(let i=0;i<n;i++){const a=a0+i*Math.PI*2/n+rand(-.5,.5),d=rand(.4,.75);CR.ex[i]={x:S.lx+Math.cos(a)*d*Math.min(1.4,hx*1.6),y:S.ly+Math.sin(a)*d*.75,hold:0,v:3,k:1.2}}
      CR.sortieNext=t+rand(25,50)}
    for(let i=0;i<n;i++){const e=CR.ex[i];if(!e)continue;const P=CR.P[i];
      if(!e.hold&&Math.hypot(e.x-P[0],e.y-P[1])<.04)e.hold=t+rand(2.5,6);
      if(e.hold&&t>e.hold)CR.ex[i]=null}
  } else if(CR.roam){const hx=innerWidth/innerHeight*.5;let out=CR.ex.slice(0,n).filter(Boolean).length;
    for(let i=0;i<n;i++){const P=CR.P[i];if(CR.exNext[i]==null)CR.exNext[i]=t+rand(12,40)+i*6;
      let e=CR.ex[i];
      if(!e&&t>CR.exNext[i]&&out<Math.max(1,n>>1)){out++;
        e=CR.ex[i]=Math.random()<.55?{x:(Math.random()<.5?-1:1)*(hx+.12+Math.random()*.15),y:P[1]+(Math.random()-.4)*.12,hold:0}
          :{x:P[0]+(Math.random()-.5)*.5,y:CR.roam.hz-.05-Math.random()*.05,hold:0}}
      if(e){if(!e.hold&&Math.hypot(e.x-P[0],e.y-P[1])<.03)e.hold=t+rand(3,9);
        if(e.hold&&t>e.hold){CR.ex[i]=null;CR.exNext[i]=t+rand(25,70)}}}}
  switch(c.mode){
    case 'follow':{
      steer(0,cx+rx*.85*wob(t,.045,1.3),cy+ry*.8*wob(t,.06,4.1),.5);
      for(let i=1;i<n;i++){const L=CR.P[i-1],LV=CR.V[i-1],s=Math.hypot(LV[0],LV[1])||1e-6,dx=LV[0]/s,dy=LV[1]/s,w=Math.sin(t*.35+i*1.7)*c.gap*.35;
        steer(i,L[0]-dx*c.gap-dy*w,L[1]-dy*c.gap+dx*w,1.1,vm*1.2)}
      break}
    case 'formation':{
      const ox=cx+rx*.6*wob(t,.02,1),oy=cy+ry*.4*wob(t,.025,2),ang=.22*wob(t,.015,3),u=(t%32)/32;
      for(let i=0;i<n;i++){const k=i-(n-1)/2;let x=k*c.gap,y=-Math.abs(k)*c.gap*.55;const ca=Math.cos(ang),sa=Math.sin(ang);
        steer(i,ox+x*ca-y*sa+.003*Math.sin(t*.7+i),oy+x*sa+y*ca+.003*Math.cos(t*.6+i),3,vm*2);
        if(u>.72)It[i]=(u-.72)/.28*n>i?0:1}
      break}
    case 'orbit':{
      const ox=cx+rx*.7*wob(t,.03,2),oy=cy+ry*.6*wob(t,.04,5),R0=(c.r||.06)*(1+.2*Math.sin(t*.2));
      for(let i=0;i<n;i++){const a=t*(c.w||.25)+i*2*Math.PI/n,dep=Math.sin(a);steer(i,ox+Math.cos(a)*R0,oy+dep*R0*.38,6,vm*3);Sz[i]=c.size*(1+.25*dep);It[i]=.75+.25*dep}
      break}
    case 'split':{
      const ox=cx+rx*.8*wob(t,.02,7),oy=cy+ry*.5*wob(t,.03,1),u=(t%26)/26;
      const sep=c.gap*ss(.2,.35,u)*(1-ss(.65,.8,u)),s3=c.gap*.55*ss(.4,.5,u)*(1-ss(.58,.68,u));
      const off=[[-sep/2,0],[sep/2,0],[sep*.1,s3*.3]];
      for(let i=0;i<n;i++){steer(i,ox+off[i%3][0],oy+off[i%3][1],4,vm*2);It[i]=i===2?ss(.38,.45,u)*(1-ss(.62,.7,u)):1}
      break}
    case 'mother':case 'escort':{
      let mx,my,first=1;
      if(c.mode==='mother'){steer(0,cx+rx*.6*wob(t,.02,3),cy+ry*.5*wob(t,.03,6),.4,vm*.5);[mx,my]=CR.P[0];Sz[0]=c.size*3.2}
      else{mx=S.lx;my=S.ly;first=0}
      for(let i=first;i<n;i++){
        const Ti=17+i*5,cyc=Math.floor((t+CR.ph[i])/Ti),u=((t+CR.ph[i])%Ti)/Ti;
        if(cyc!==CR.cyc[i]){CR.cyc[i]=cyc;const a=Math.random()*Math.PI*2,d=(c.mode==='escort'?.1:.2)+Math.random()*(c.mode==='escort'?.12:.25);CR.wp[i]=[Math.cos(a)*d,Math.sin(a)*d*.55]}
        const w=CR.wp[i];let tx=mx,ty=my;
        if(u>=.12&&u<.75){tx=mx+w[0]+.015*Math.sin(t*.5+i);ty=my+w[1]+.012*Math.cos(t*.4+i)}
        steer(i,tx,ty,u<.12||u>=.75?2.5:.9,vm);
        It[i]=u<.08?ss(0,.08,u)*.4+.2:1;
      }
      break}
    case 'fleet':{
      const span=rx*2+c.gap*2;
      for(let i=0;i<n;i++){const s=((t*c.speed+i*c.gap+CR.ph[0])%span);CR.P[i][0]=g.x1+c.gap-s;CR.P[i][1]=cy+ry*.5*Math.sin(i*1.3)+.004*Math.sin(t*.5+i);
        It[i]=ss(g.x1+c.gap,g.x1-.02,CR.P[i][0])*ss(g.x0-c.gap,g.x0+.02,CR.P[i][0])}
      break}
    case 'swarm':{
      let mx=0,my=0,vx=0,vy=0;for(let i=0;i<n;i++){mx+=CR.P[i][0]/n;my+=CR.P[i][1]/n;vx+=CR.V[i][0]/n;vy+=CR.V[i][1]/n}
      for(let i=0;i<n;i++){const P=CR.P[i],V=CR.V[i];
        let ax=(cx+rx*.9*wob(t,.03+i*.007,i*3)-P[0])*.25+(mx-P[0])*.12+(vx-V[0])*.3,ay=(cy+ry*.8*wob(t,.04+i*.005,i*5)-P[1])*.25+(my-P[1])*.12+(vy-V[1])*.3;
        for(let j=0;j<n;j++){if(j===i)continue;const dx=P[0]-CR.P[j][0],dy=P[1]-CR.P[j][1],d=Math.hypot(dx,dy);if(d<c.gap&&d>1e-4){const f=(c.gap-d)/c.gap*.6;ax+=dx/d*f;ay+=dy/d*f}}
        V[0]+=ax*dt;V[1]+=ay*dt;const s=Math.hypot(V[0],V[1]);if(s>vm){V[0]*=vm/s;V[1]*=vm/s}
        P[0]+=V[0]*dt;P[1]+=V[1]*dt+.004*Math.cos(t*1.2+i)*dt}
      break}
    default:{for(let i=0;i<n;i++)steer(i,cx+rx*.8*wob(t,.02+i*.01,i*4),cy+ry*.7*wob(t,.025+i*.008,i*2+1),.3)}
  }
  for(let i=0;i<n;i++)upClamp(CR.P[i]);
  for(let i=0;i<8;i++){
    if(i<n){CR.I[i]+=((It[i]??1)-CR.I[i])*Math.min(1,dt*1.5);U.uC.value[i].set(CR.P[i][0],CR.P[i][1],Sz[i],CR.I[i])}else U.uC.value[i].w=0;
  }
  U.uCN.value=n;U.uCStyle.value=c.style;U.uCStage.value=c.stage;
}
