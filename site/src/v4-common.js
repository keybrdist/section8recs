/* ---------------- GLSL: shared library ---------------- */
const COMMON_HEAD=/* glsl */`
precision highp float;
varying vec2 vUv;
uniform vec2 uRes; uniform float uTime,uLow,uMid,uHigh,uKick,uLevel,uSnare;
uniform vec3 uAccent; uniform vec2 uMouse;
uniform float uFog,uDensity,uMirror,uClear,uSeed,uZoom;
uniform float uPhenA,uAmtA,uPhenB,uAmtB; uniform vec2 uLight; uniform vec4 uX;
uniform float uApp,uAppX,uEyes,uFlash,uBoltX,uBoltSeed; uniform vec4 uModes;
uniform float uCamT; uniform vec3 uShake; uniform vec4 uSpecies; uniform vec2 uBeam;
uniform sampler2D uTrees; uniform vec4 uCells[17]; uniform vec2 uAtlas;
uniform vec4 uC[8]; uniform float uCN,uCStyle,uCStage;
uniform float uScroll,uSpec,uSpecSeed;
#define PI 3.14159265
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*vn(p); p=p*2.03+vec2(1.7,9.2); a*=.5;} return v; }
float fbm3(vec2 p){ float v=0.,a=.5; for(int i=0;i<3;i++){ v+=a*vn(p); p=p*2.03+vec2(1.7,9.2); a*=.5;} return v; }
float ridged(vec2 p){ float v=0.,a=.55; for(int i=0;i<5;i++){ float n=1.-abs(vn(p)*2.-1.); v+=a*n*n; p=p*2.07+vec2(3.1,7.7); a*=.48;} return v; }
float sdSeg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
// GLSL leaves smoothstep undefined when edge0 >= edge1; this one is defined both ways
float sst(float a,float b,float x){ float t=clamp((x-a)/(b-a),0.,1.); return t*t*(3.-2.*t); }
float fillD(float d,float aa){ return 1.-sst(-aa,aa,d); }
mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float ASP(){ return uRes.x/uRes.y; }
vec2 SP(){ return (vUv-.5)*vec2(ASP(),1.); }
float PXL(){ return 1.6/uRes.y; }

/* --- trees: 17 atlas silhouettes; the bass leans on the wind --- */
float atlasA(float kind,float u,float v,float lod){
  if(u<.004||u>.996||v<0.||v>.996) return 0.;
  vec4 c=uCells[int(kind)];
  return textureLod(uTrees,c.xy+vec2(u,v)*c.zw,lod).r;
}
float treeTex(vec2 q,float h,float s,float aa,float kind){
  vec4 c=uCells[int(kind)];
  float aspK=c.z*uAtlas.x/(c.w*uAtlas.y);
  float fl=h11(s*7.7)<.5?-1.:1.;
  float yy=q.y/h;
  q.x-=sin(uTime*.55+s*3.)*.008*h*yy*yy*(1.+uLow*.9);
  float lod=clamp(log2(max(1.,1004.*aa/(1.6*h))),0.,5.);
  return atlasA(kind,q.x*fl/(h*aspK)+.5,yy*.98+.006,lod);
}
// species mix per scene: x evergreen, y pine, z snag, w dead mesquite, remainder bare deciduous
float treeAt(vec2 q,float h,float s,float aa,float maxHW){
  float r=h11(s*41.3+.7), kind, sc=1.;
  float e=uSpecies.x, e2=e+uSpecies.y, e3=e2+uSpecies.z, e4=e3+uSpecies.w;
  if(r<e) kind=floor(h11(s*3.1)*7.99);
  else if(r<e2) kind=8.+floor(h11(s*5.3)*1.99);
  else if(r<e3) kind=10.+floor(h11(s*9.7)*1.99);
  else if(r<e4){ kind=12.+floor(h11(s*2.9)*3.99); sc=1.3; }
  else { kind=16.; sc=1.1; }
  if(kind>=12.&&h*sc*.42>maxHW){ kind=floor(h11(s*3.1)*7.99); sc=1.; }
  return treeTex(q,h*sc,s,aa,kind);
}
// trees seen from the ground looking straight up: the atlas silhouette wrapped radially, base at the edge, crown at the centre
float upTrees(vec2 p,float n,float layer,float al0,float topMin,float topMax,float k0,float kN,float aa){
  float r=length(p), a=atan(p.y,p.x);
  float A=a/(2.*PI)+.5+layer*.123;
  float cell=floor(A*n), cov=0.;
  for(int k=-1;k<=1;k++){
    float c=cell+float(k), cw=mod(c,n);   // hash by the wrapped cell so the ring has no seam where the angle wraps
    float r1=h11(cw*3.7+layer*11.+floor(uSeed)), r2=h11(cw*9.1+layer*5.+floor(uSeed));
    if(r2<.1) continue;
    float topR=mix(topMin,topMax,h11(cw*1.3+layer+floor(uSeed)));
    if(r<topR) continue;
    float ca=(c+.5+.6*(r1-.5))/n;
    float da=(fract(A-ca+.5)-.5)*2.*PI+.03*sin(r*6.+cw)*(1.-layer*.3)+sin(uTime*.5+cw)*.004*(1.+uLow);
    float al=al0*(.75+.5*r2);
    float v=pow(clamp((1.15-r)/(1.15-topR),0.,1.),.8);
    float kind=k0+floor(h11(cw*5.1+layer)*kN*.999);
    float lod=clamp(log2(max(1.,384.*(aa/1.6)/(max(r,.02)*2.*al))),0.,5.);
    cov=max(cov,atlasA(kind,da/(2.*al)+.5,v,lod));
  }
  return cov;
}
float row(vec2 p,float seed,float cw,float hMin,float hMax,float gy,float aa,float clearW,float clearAmt){
  float ci=floor(p.x/cw); float cov=0.;
  for(int k=-2;k<=2;k++){
    float c=ci+float(k);
    float r1=h11(c*1.37+seed*17.1), r2=h11(c*2.71+seed*3.3), r3=h11(c*5.13+seed*7.7);
    if(r3<.1) continue;
    float cx=(c+.1+.8*r1)*cw;
    float h=mix(hMin,hMax,r2);
    if(clearW>0.) h*=mix(1.-clearAmt,1.,sst(clearW*.3,clearW,abs(cx)));
    float g=gy+.05*(vn(vec2(cx*1.1,seed))-.5)*hMax;
    cov=max(cov,treeAt(vec2(p.x-cx,p.y-g),h,r3*97.+c*.731+seed,aa,cw*1.9));
  }
  return cov;
}
// side scroll: every layer drifts the same way, near layers faster (parallax)
vec2 lay(vec2 p,float depth){
  vec2 q=p;
  float asp=ASP(); q.x*=asp<1.?1.+(1./asp-1.)*.6:1.;
  q.x+=uScroll*(1.-depth*.9)+uMouse.x*(.06*(1.-depth)+.006);
  q.y+=uMouse.y*.018*(1.-depth);
  if(uMirror>.5) q.x=abs(q.x);
  return q;
}
// landmarks recur with a long period so a continuous scroll never runs out of world
float wrapX(float x,float per){ return mod(x+per*.5,per)-per*.5; }
float fogN(vec2 p,float sp,float sc){ return fbm3(vec2(p.x*sc+uTime*sp,p.y*sc*2.2)); }
vec3 fogCol(vec2 p){
  float ph=uAmtA+uAmtB; float ld=length(p-uLight);
  vec3 f=vec3(.105,.098,.122)*uFog;
  f+=uAccent*(.03*ph*exp(-ld*2.4)+.01*ph);
  f+=vec3(.5,.52,.6)*uFlash*.1+uAccent*uFlash*.05;
  return f*(1.+uKick*.16+uLow*.14);
}
vec3 sky(vec2 p,vec3 fogC,float hz){
  vec2 su=SP()+uMouse*.003;
  vec3 col=mix(vec3(.085,.079,.1)*uFog,vec3(.012,.011,.018),sst(hz-.1,hz+.55,p.y));
  float cl=fbm(vec2(p.x*1.2+uTime*.008+uScroll*.08+uSeed,p.y*2.6));
  col+=fogC*.6*sst(.42,.9,cl)*sst(hz-.05,hz+.4,p.y);
  float st=h21(floor(su*170.)+floor(uSeed));
  col+=vec3(.08,.08,.095)*step(.9978,st)*sst(hz,hz+.3,su.y)*(.5+.5*sin(uTime*1.7+st*97.)+uHigh*.6);
  col+=uAccent*.045*(uAmtA+uAmtB)*exp(-length(p-uLight)*3.);
  return col;
}
vec3 grassFg(vec2 p,vec2 q,float base,float aa,vec3 col){
  float gx=q.x*90.;
  float blade=base+.05*vn(vec2(gx*.15,1.))+.035*abs(sin(gx+vn(vec2(gx,2.))*3.))*vn(vec2(gx*.5,3.));
  return mix(col,vec3(.003),fillD(p.y-blade,aa));
}
vec3 eyes(vec2 q,vec3 col,float y0){
  if(uEyes<.01) return col;
  for(int i=0;i<3;i++){
    float fi=float(i);
    vec2 e=vec2(.3+.32*h11(fi*3.7+floor(uSeed)),y0+.09*h11(fi*9.1+floor(uSeed)));
    vec2 qe=q-e;
    float d=min(length(qe-vec2(-.0065,0.)),length(qe-vec2(.0065,0.)));
    float bl=step(.08,fract(uTime*.37+fi*.31));
    col+=mix(vec3(.95,.9,.7),uAccent,.4)*sst(.0028,0.,d)*uEyes*bl*1.4;
  }
  return col;
}
vec3 figure(vec2 p,vec2 foot,float sc,float aa,float vis,vec3 col){
  if(vis<.01) return col;
  vec2 a=(p-foot)/sc; aa/=sc;
  float legs=fillD(abs(abs(a.x)-.0055)-.0032,aa)*step(0.,a.y)*step(a.y,.115);
  float tw=mix(.008,.016,sst(.11,.205,a.y));
  float torso=fillD(abs(a.x)-tw,aa)*step(.105,a.y)*step(a.y,.212);
  float neck=fillD(abs(a.x)-.004,aa)*step(.2,a.y)*step(a.y,.222);
  float head=fillD(length((a-vec2(0.,.232))*vec2(1.,.82))-.0105,aa);
  float arx=.019+(.205-a.y)*.035;
  float arms=fillD(abs(abs(a.x)-arx)-.0027,aa)*step(.075,a.y)*step(a.y,.208);
  float fig=max(max(max(legs,torso),max(neck,head)),arms);
  return mix(col,vec3(0.),fig*vis*.92);
}
/* --- the spectre: a tall, too-thin figure that never resolves; it pixelates, tears and blurs in bursts --- */
float spectreBody(vec2 a,float bl){
  float legs=fillD(abs(abs(a.x)-.032+.012*a.y)-.013,bl)*step(0.,a.y)*step(a.y,.47);
  float tw=mix(.042,.072,sst(.45,.74,a.y));
  float torso=fillD(abs(a.x+.012*sin(a.y*7.))-tw,bl)*step(.43,a.y)*step(a.y,.8);
  float neck=fillD(abs(a.x-.008)-.016,bl)*step(.78,a.y)*step(a.y,.86);
  float head=fillD(length((a-vec2(.018,.9))*vec2(1.,.72))-.046,bl);
  float arx=.07+(.76-a.y)*.055;
  float arms=fillD(abs(abs(a.x)-arx)-.011,bl)*step(.18,a.y)*step(a.y,.77);
  return max(max(max(legs,torso),max(neck,head)),arms);
}
float spectreA(vec2 p,vec2 foot,float hgt,float seed,float aa,float soft){
  vec2 a=(p-foot)/hgt;
  if(a.y<-.05||a.y>1.05||abs(a.x)>.6) return 0.;
  float t=uTime, burst=step(.55,h11(floor(t*2.3)+seed*7.));
  float sl=floor(a.y*26.);
  a.x+=step(.8,h21(vec2(sl,floor(t*14.)+seed)))*(h21(vec2(sl,floor(t*19.)+seed))-.5)*.3*(.4+burst);
  float px=mix(.018,.075,burst*h11(floor(t*6.)+seed*3.));
  a=mix(a,(floor(a/px)+.5)*px,step(.5,burst+step(.7,h11(floor(t*1.3)+seed))));
  a.x-=.03*sin(t*.6+seed)*a.y;
  float bl=max(aa/hgt*1.5,.005+.03*h11(floor(t*1.7)+seed*5.))+soft;
  float m=spectreBody(a,bl);
  m=max(m,spectreBody(a+vec2(.09*(h11(floor(t*9.)+seed)-.5),0.),bl*2.)*.4*burst);
  return m*(.75+.25*h11(floor(t*24.)+seed));
}
`;

/* craft: lights and objects whose positions come from the JS choreographer, so they can follow and react to one another */
const COMMON_CRAFT=/* glsl */`
vec3 craft(vec2 p,float stage,vec3 col){
  if(abs(stage-uCStage)>.5||uCN<.5) return col;
  float k=1.+uKick*.45+uSnare*.25;
  for(int i=0;i<8;i++){
    if(float(i)>=uCN) break;
    vec4 c=uC[i]; vec2 d=p-c.xy; float sz=c.z, I=c.w;
    if(I<.01) continue;
    if(uCStyle<.5){
      float r=length(d);
      vec3 hc=mix(uAccent,vec3(1.,.88,.7),.4);
      col+=(hc*(sz*sz*1.6)/(r*r+sz*sz*1.6)*.32+vec3(1.,.97,.9)*sst(sz,sz*.25,r))*I*k*(.85+.3*sin(uTime*(1.1+float(i)*.37)+float(i)*2.)+uHigh*.25);
    } else if(uCStyle<1.5){
      vec2 q=rot2(.12*sin(uTime*.2+float(i)))*d/sz;
      float body=fillD(max(abs(q.x)-1.,abs(q.y)-(.28-.22*q.x*q.x)),.06);
      float dome=fillD(length((q-vec2(0.,.22))*vec2(1.,1.4))-.42,.06);
      float m=max(body,dome)*step(-.3,q.y);
      col=mix(col,vec3(.03,.03,.035)+uAccent*.02,m*I);
      col+=uAccent*sst(.12,0.,abs(q.y+.06))*sst(1.05,.8,abs(q.x))*.25*I*k*(.6+.4*sin(uTime*2.+q.x*6.));
    } else if(uCStyle<2.5){
      // the black triangle: slow yaw, a faint lit rim, white corner lights and a red centre
      vec2 q=rot2(uTime*.035+float(i)*1.7)*d/sz;
      float sd=max(-q.y-.5,abs(q.x)*1.732+q.y-1.);
      float m=fillD(sd,.04);
      col=mix(col,vec3(.004),m*I);
      col+=mix(uAccent,vec3(.7,.72,.8),.5)*exp(-abs(sd)*28.)*.1*I;
      float lc=min(length(q-vec2(0.,1.)),min(length(q-vec2(-.866,-.5)),length(q-vec2(.866,-.5))));
      col+=vec3(1.)*sst(.12,0.,lc)*I*k+uAccent*sst(.15,0.,length(q))*I*(.6+.4*sin(uTime*3.));
    } else {
      float r=length(d), a=atan(d.y,d.x);
      float sw=fbm3(vec2(a*2.+uTime*1.3,r/sz*3.-uTime*2.));
      float shell=sst(sz*1.15,sz*.6,r+sz*.25*(sw-.5));
      vec3 pc=mix(uAccent,vec3(.85,.85,1.),.55);
      col+=pc*(shell*.55+sst(sz*.45,0.,r)*1.4+.25*sz*sz/(r*r+sz*sz)*2.)*I*k;
    }
  }
  return col;
}
#define PHEN(P,S,C) C=phen(uPhenA,P,uAmtA,S,C); C=phen(uPhenB,P,uAmtB,S,C); C=craft(P,S,C);
`;
