/* ---------------- tree atlas: 17 silhouettes drawn once on a canvas, uploaded as one alpha channel ----------------
   0-7 evergreens of varying fullness, 8-9 pines, 10-11 snags, 12-15 dead mesquite-style spreaders, 16 bare deciduous */
const ATLAS_W=3840,ATLAS_H=2048,ROW_H=1024,TREE_H=ROW_H-20;
// cells are laid out in these units; phones and tablets draw the atlas at half size (a quarter of the pixels to fill, read
// back and upload), which their render scale cannot tell apart
const ATLAS_K=matchMedia('(max-width: 760px), (pointer: coarse)').matches?.5:1,ATLAS_TW=ATLAS_W*ATLAS_K,ATLAS_TH=ATLAS_H*ATLAS_K;
const ATLAS_CELLS=(()=>{const c=[];let x=0;
  for(let i=0;i<8;i++){c.push([x,0,320,ROW_H]);x+=320}
  for(let i=0;i<2;i++){c.push([x,0,384,ROW_H]);x+=384}
  for(let i=0;i<2;i++){c.push([x,0,256,ROW_H]);x+=256}
  x=0;for(let i=0;i<4;i++){c.push([x,ROW_H,768,ROW_H]);x+=768}
  c.push([x,ROW_H,768,ROW_H]);return c})();
function segs(g,arr,w){if(!arr.length)return;g.lineWidth=w;g.beginPath();for(let i=0;i<arr.length;i+=2){g.moveTo(arr[i][0],arr[i][1]);g.lineTo(arr[i+1][0],arr[i+1][1])}g.stroke()}
function stem(g,cl,H,top,w0,w1){
  const L=[],R=[];for(let i=0;i<=48;i++){const t=i/48,y=t*H*top,x=cl(t*top),w=w0+(w1-w0)*t;L.push([x-w,y]);R.push([x+w,y])}
  g.beginPath();g.moveTo(L[0][0],L[0][1]);for(const p of L)g.lineTo(p[0],p[1]);for(let i=R.length-1;i>=0;i--)g.lineTo(R[i][0],R[i][1]);g.closePath();g.fill();
}
const EVERGREENS=[
  {wid:.22,whorls:30,droop:.42,tipUp:.5,shape:.95,skip:.04,base:.07,needle:1,trunk:1,full:1},
  {wid:.19,whorls:26,droop:.55,tipUp:.35,shape:1.05,skip:.12,base:.12,needle:.9,trunk:.9,full:.72},
  {wid:.2,whorls:34,droop:.16,tipUp:.25,shape:1,skip:.02,base:.05,needle:1.15,trunk:1,full:1},
  {wid:.085,whorls:44,droop:.7,tipUp:.15,shape:.45,skip:.25,base:.02,needle:.85,trunk:.8,club:true,full:.6},
  {wid:.21,whorls:22,droop:.5,tipUp:.3,shape:1,skip:.2,base:.18,needle:.8,trunk:.95,full:.42},
  {wid:.2,whorls:28,droop:.45,tipUp:.35,shape:1,skip:.08,base:.1,needle:.95,trunk:1,full:.78,deadTop:.3},
  {wid:.2,whorls:20,droop:.6,tipUp:.2,shape:1.1,skip:.3,base:.22,needle:.7,trunk:.9,full:.25,deadTop:.15},
  {wid:.14,whorls:36,droop:.3,tipUp:.4,shape:.9,skip:.03,base:.06,needle:1.05,trunk:.85,full:.92},
];
function conifer(g,r,o,CW){
  const H=TREE_H,lean=(r()-.5)*.03,ph=r()*6,cl=t=>lean*t*t*H+.004*H*Math.sin(t*7+ph),full=o.full;
  stem(g,cl,H,1,H*.011*o.trunk,.6);
  const W=Math.min(CW*.47,H*o.wid),c0=H*o.base*(.7+.6*r()),deadY=H*(1-(o.deadTop||0));
  const br=[[],[],[]],nd=[],step=Math.max(1.3,H*.0026)/(o.needle*(.45+.55*full));
  for(let i=0;i<o.whorls;i++){
    const sp=(H*.97-c0)/o.whorls,t0=i/(o.whorls-1),y=Math.min(H*.965,c0+(H*.97-c0)*Math.pow(t0,.9)+(r()-.5)*sp*.85),tt=y/H;
    if(r()<o.skip+(1-full)*.35*(1-tt*.5))continue;
    if(y>deadY){const s=r()<.5?-1:1,l=H*(.008+.02*r());br[2].push([cl(tt),y],[cl(tt)+s*l,y+l*(.1+r()*.5)]);continue}
    let Lmax=W*Math.pow(Math.max(0,1-tt),o.shape)*(.75+.4*r())*(.65+.35*full)+H*.006;
    if(o.club&&tt>.8)Lmax=Math.max(Lmax,W*.55*(1-(tt-.8)/.2)+H*.012);
    const nb=4+Math.floor(r()*3);
    for(let b=0;b<nb;b++){
      // whorl branches point all around the stem; the projected length is what makes a believable silhouette
      const az=(b/nb+r()*.2)*Math.PI*2,pr=Math.cos(az),side=pr>=0?1:-1;
      const L=Lmax*(.6+.4*r())*Math.max(.08,Math.abs(pr)),x0=cl(tt);
      const dead=r()<(1-full)*.55;
      const dr=o.droop*(.5+r())*(.55+tt*.6)*(r()<.12?1.8:1)*(dead?.4:1),up=o.tipUp*r()*(.6+tt),S=9,pts=[];
      for(let s=0;s<=S;s++){const u=s/S;pts.push([x0+side*L*u,y-dr*L*Math.pow(u,1.5)+up*L*Math.max(0,u-.7)**2*3+.04*L*u])}
      for(let s=0;s<S;s++)br[s<3?0:s<6?1:2].push(pts[s],pts[s+1]);
      const at=u=>{const k=Math.min(S-1,Math.floor(u*S)),f=u*S-k;return [pts[k][0]+(pts[k+1][0]-pts[k][0])*f,pts[k][1]+(pts[k+1][1]-pts[k][1])*f]};
      if(dead){for(let d=L*.25;d<L;d+=H*.02){const p=at(d/L),a=(side>0?0:Math.PI)+side*-(.4+r()*.7),bl=H*(.006+.012*r());br[2].push(p,[p[0]+Math.cos(a)*bl,p[1]+Math.sin(a)*bl])}continue}
      for(let d=0;d<L;d+=step){
        if(r()>.35+.65*full)continue;
        const u=d/L,p=at(u),nl=H*(.007+.009*r())*(1.1-u*.5);
        for(let q=0;q<2;q++){const a=-Math.PI/2+side*(.25+r()*1.1)*(q?1:-.35);nd.push(p,[p[0]+Math.cos(a)*nl,p[1]+Math.sin(a)*nl])}
        if(r()<.35){const a=Math.PI/2+side*(.3+r()*.8);nd.push(p,[p[0]+Math.cos(a)*nl*.6,p[1]+Math.sin(a)*nl*.6])}
      }
      for(let d=L*.2;d<L*.92;d+=H*(.012+.012*r())/(.5+.5*full)){
        const p=at(d/L),bl=L*(.12+.18*r())*(1-d/L*.5),a=(side>0?0:Math.PI)+side*-(.5+r()*.6),e=[p[0]+Math.cos(a)*bl,p[1]+Math.sin(a)*bl];
        br[2].push(p,e);
        for(let dd=0;dd<bl;dd+=step*1.25){if(r()>.4+.6*full)continue;const pp=[p[0]+Math.cos(a)*dd,p[1]+Math.sin(a)*dd],nl=H*(.006+.006*r()),na=-Math.PI/2+(r()-.5)*1.6;nd.push(pp,[pp[0]+Math.cos(na)*nl,pp[1]+Math.sin(na)*nl])}
      }
    }
  }
  br[2].push([cl(.92),H*.92],[cl(1),H*.995]);
  for(let i=0;i<22+Math.floor((1-full)*30);i++){const t=.04+(c0/H+.12)*r(),y=t*H,s=r()<.5?-1:1,l=H*(.008+.03*r());br[1].push([cl(t),y],[cl(t)+s*l,y-l*(.2+r()*.7)])}
  segs(g,br[0],H*.0045);segs(g,br[1],H*.003);segs(g,br[2],H*.0018);segs(g,nd,Math.max(1.05,H*.0013));
}
function pine(g,r,CW){
  const H=TREE_H,lean=(r()-.5)*.1,ph=r()*6,cl=t=>lean*t*t*H+.012*H*Math.sin(t*5+ph);
  stem(g,cl,H,.97,H*.014,.8);
  const lim=[],stub=[],nd=[],tufts=[];
  for(let i=0;i<14;i++){const t=.12+.5*r(),y=t*H,s=r()<.5?-1:1,l=H*(.01+.028*r());stub.push([cl(t),y],[cl(t)+s*l,y-l*(.15+r()*.6)])}
  const c0=.56+.12*r(),n=7+Math.floor(r()*5);
  for(let i=0;i<n;i++){
    const t=c0+(1-c0)*(i/n)+r()*.04;let x=cl(t),y=t*H,a=Math.PI/2+(r()<.5?-1:1)*(.55+r()*.85);
    const len=H*(.04+.07*r())*(1.1-t*.6),sg=3+Math.floor(r()*2);
    for(let s=0;s<sg;s++){const nx=x+Math.cos(a)*len/sg,ny=Math.min(H*.955,y+Math.sin(a)*len/sg);lim.push([x,y],[nx,ny]);x=nx;y=ny;a+=(r()-.5)*.9;if(s>=1&&r()<.6)tufts.push([x,y,.7])}
    tufts.push([x,y,1]);
  }
  tufts.push([cl(.95),H*.95,1.05]);
  for(const [tx,ty,k] of tufts){
    const R=H*(.018+.016*r())*k,m=Math.floor((110+r()*80)*k);
    for(let j=0;j<m;j++){const a=r()*Math.PI*2,rr=R*Math.sqrt(r()),cx=tx+Math.cos(a)*rr*1.7,cy=ty+Math.sin(a)*rr*.55-R*.15,na=r()*Math.PI*2,nl=H*(.006+.006*r());nd.push([cx,cy],[cx+Math.cos(na)*nl,cy+Math.sin(na)*nl])}
  }
  segs(g,stub,H*.003);segs(g,lim,H*.0042);segs(g,nd,Math.max(1.05,H*.0013));
}
function bare(g,r,CW){
  const H=TREE_H,ph=r()*6,cl=t=>.02*H*Math.sin(t*6+ph),S=[[],[],[],[],[],[],[],[],[]];
  stem(g,cl,H,.5,H*.022,H*.011);
  const grow=(x,y,a,len,d)=>{
    if(d>8||len<H*.006||y>H*.97)return;let px=x,py=y;
    for(let i=0;i<3;i++){a+=(r()-.5)*.55;a=Math.min(Math.PI/2+1.3,Math.max(Math.PI/2-1.3,a));const nx=px+Math.cos(a)*len/3,ny=py+Math.sin(a)*len/3;if(Math.abs(nx)>CW*.47||ny>H*.975)return;
      S[Math.min(8,d)].push([px,py],[nx,ny]);px=nx;py=ny}
    const k=d<2?3:2+(r()<.35?1:0);
    for(let i=0;i<k;i++){const na=a+(i-(k-1)/2)*(.5+r()*.4)+(r()-.5)*.35;grow(px,py,na+(Math.PI/2-na)*.05,len*(.66+r()*.16),d+1)}
  };
  grow(cl(.5),H*.5,Math.PI/2+(r()-.5)*.3,H*.15,1);
  for(let i=0;i<4;i++)grow(cl(.36+i*.05),H*(.36+i*.05),Math.PI/2+(i%2?-1:1)*(.75+r()*.35),H*.11,2);
  [H*.018,H*.018,H*.011,H*.007,H*.0045,H*.003,H*.002,H*.0014,H*.0011].forEach((w,i)=>segs(g,S[i],Math.max(1,w)));
}
function snag(g,r,CW){
  const H=TREE_H,ph=r()*6,cl=t=>.008*H*Math.sin(t*6+ph),top=.62+.25*r();
  stem(g,cl,H,top,H*.013,H*.004);
  const st=[],nd=[];
  g.beginPath();g.moveTo(cl(top)-H*.006,top*H);g.lineTo(cl(top)+H*.002,top*H+H*.03);g.lineTo(cl(top)+H*.005,top*H);g.fill();
  for(let i=0;i<36;i++){const t=.1+(top-.12)*r(),y=t*H,s=r()<.5?-1:1,l=H*(.015+.06*r())*(1.1-t);
    const e=[cl(t)+s*l,y-l*(.25+r()*.5)];st.push([cl(t),y],e);
    if(r()<.25)for(let j=0;j<14;j++){const na=-Math.PI/2+(r()-.5)*2,nl=H*(.005+.006*r()),p=[e[0]+(r()-.5)*H*.01,e[1]+(r()-.5)*H*.006];nd.push(p,[p[0]+Math.cos(na)*nl,p[1]+Math.sin(na)*nl])}}
  segs(g,st,H*.0028);segs(g,nd,Math.max(1.05,H*.0013));
}
// dead mesquite: a gnarled stump splitting into crooked leaders that creep outward and upward, thorn spurs on the fine wood
function mesquite(g,r,CW){
  const H=TREE_H,th=H*(.5+.16*r()),S=[[],[],[],[],[],[],[],[],[],[]];
  const grow=(x,y,a,len,d)=>{
    if(d>8||len<H*.006)return;let px=x,py=y;const n=4+Math.floor(r()*3);
    for(let i=0;i<n;i++){
      const side=Math.cos(a)>=0?1:-1,tgt=Math.PI/2-side*(.5+d*.07);
      a+=(r()-.5)*.75+(tgt-a)*.14;a=Math.max(.14,Math.min(Math.PI-.14,a));
      const nx=px+Math.cos(a)*len/n,ny=py+Math.sin(a)*len/n;
      if(Math.abs(nx)>CW*.48||ny>H*.97)return;
      S[d].push([px,py],[nx,ny]);px=nx;py=ny;
      if(d>=4&&r()<.55){const sa=a+(r()<.5?-1:1)*(.7+r()*.7),sl=H*(.005+.008*r());S[Math.min(9,d+2)].push([px,py],[px+Math.cos(sa)*sl,py+Math.sin(sa)*sl])}
    }
    const k=d<2?2+(r()<.6?1:0):2+(r()<.3?1:0);
    for(let i=0;i<k;i++)grow(px,py,a+(i-(k-1)/2)*(.45+r()*.5)+(r()-.5)*.4,len*(.6+r()*.2),d+1);
  };
  const stump=th*(.06+.08*r());
  S[0].push([0,0],[(r()-.5)*H*.01,stump]);
  const nT=2+Math.floor(r()*3);
  for(let i=0;i<nT;i++)grow((r()-.5)*H*.012,stump*(.6+.4*r()),Math.PI/2+(i-(nT-1)/2)*(.38+r()*.28)+(r()-.5)*.2,th*(.3+.12*r()),0);
  [H*.022,H*.015,H*.01,H*.0068,H*.0046,H*.0032,H*.0023,H*.0016,H*.0012,H*.001].forEach((w,i)=>segs(g,S[i],Math.max(1,w)));
}
function buildTreeAtlas(){
  const cv=document.createElement('canvas');cv.width=ATLAS_TW;cv.height=ATLAS_TH;
  const g=cv.getContext('2d',{willReadFrequently:true});g.scale(ATLAS_K,ATLAS_K);g.lineCap='round';g.lineJoin='round';g.strokeStyle='#fff';g.fillStyle='#fff';
  const draw=[];
  EVERGREENS.forEach(o=>draw.push((r,cw)=>conifer(g,r,o,cw)));
  draw.push((r,cw)=>pine(g,r,cw),(r,cw)=>pine(g,r,cw),(r,cw)=>snag(g,r,cw),(r,cw)=>snag(g,r,cw));
  for(let i=0;i<4;i++)draw.push((r,cw)=>mesquite(g,r,cw));
  draw.push((r,cw)=>bare(g,r,cw));
  ATLAS_CELLS.forEach(([x,y,w,h],i)=>{g.save();g.beginPath();g.rect(x+2,y+2,w-4,h-4);g.clip();
    g.translate(x+w/2,y+h-6);g.scale(1,-1);draw[i](mulberry(4242+i*977),w);g.restore()});
  // keep only alpha, flipped so texture v=0 is the bottom row
  const W=ATLAS_TW,H=ATLAS_TH,id=g.getImageData(0,0,W,H).data,a=new Uint8Array(W*H);
  for(let y=0;y<H;y++){const src=(H-1-y)*W*4,dst=y*W;for(let x=0;x<W;x++)a[dst+x]=id[src+x*4+3]}
  return {data:a,canvas:cv};
}
