const VERT='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const RAYS_SH={uniforms:{tDiffuse:{value:null},uLightUV:{value:new THREE.Vector2(.5,.5)},uAmt:{value:.9}},vertexShader:VERT,fragmentShader:`
varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uLightUV; uniform float uAmt;
void main(){
  vec3 base=texture2D(tDiffuse,vUv).rgb;
  vec2 dl=(vUv-uLightUV)*(.85/40.); vec2 uv=vUv; float w=1.; vec3 acc=vec3(0.);
  for(int i=0;i<40;i++){ uv-=dl; vec3 s=texture2D(tDiffuse,uv).rgb; float l=max(0.,dot(s,vec3(.3,.59,.11))-.07); acc+=s*l*w; w*=.962; }
  gl_FragColor=vec4(base+acc*uAmt*.6,1.);
}`};
const FINAL_SH={uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uTime:{value:0},uKick:{value:0},uMode:{value:0},uG:{value:0},uGS:{value:0},
  uAcq:{value:0},uChroma:{value:.4},uGrain:{value:.06},uInvert:{value:0},uRollY:{value:0},uIR:{value:0},uGrade:{value:0},uGMode:{value:0},uPump:{value:0}},vertexShader:VERT,fragmentShader:`
varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uRes;
uniform float uTime,uKick,uMode,uG,uGS,uAcq,uChroma,uGrain,uInvert,uRollY,uIR,uGrade,uGMode,uPump;
float sst(float a,float b,float x){ float t=clamp((x-a)/(b-a),0.,1.); return t*t*(3.-2.*t); }
float rnd(vec2 c){ return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453); }
bool md(float m){ return abs(uMode-m)<.5; }
void main(){
  vec2 uv=vUv; float t=uTime; float g=uG;
  float gC=uGrade*(1.-step(.5,abs(uGMode-1.))), gN=uGrade*(1.-step(.5,abs(uGMode-2.))), gF=uGrade*(1.-step(.5,abs(uGMode-3.))), gA=uGrade*(1.-step(.5,abs(uGMode-4.)));
  uv.x+=(mod(floor(vUv.y*uRes.y*.5),2.)-.5)*.0016*(gC+gN)+(rnd(vec2(floor(vUv.y*uRes.y*.25),floor(t*30.)))-.5)*.002*(gC+gN*.6);
  uv+=gA*vec2(rnd(vec2(floor(t*18.),1.))-.5,rnd(vec2(floor(t*18.),2.))-.5)*.0025;
  float band=floor(uv.y*42.);
  float tear=max(md(1.)?g:0.,uAcq);
  if(tear>0.){ float r=rnd(vec2(band,floor(t*30.)+uGS)); if(r>1.-.38*tear) uv.x+=(rnd(vec2(band,floor(t*12.)+uGS))-.5)*.16*tear; }
  if(md(2.)){ vec2 b=floor(uv*vec2(18.,10.)); if(rnd(b+floor(t*15.)+uGS)>1.-.32*g) uv+=(vec2(rnd(b+1.3),rnd(b+2.7))-.5)*.09*g; }
  if(md(3.)) uv.y=fract(uv.y+uRollY*g);
  if(md(5.)){ float cx=floor(uv.x*140.); if(rnd(vec2(cx,floor(t*9.)+uGS))>1.-.55*g) uv.y=max(uv.y,rnd(vec2(cx,3.+uGS))*.8); }
  if(md(6.)){ float ln=mod(floor(vUv.y*uRes.y*.5),2.); uv.x+=(ln-.5)*.008*g; }
  float sp=uChroma*.0018+uKick*.0035+(md(4.)?g*.028:0.)+uAcq*.02;
  vec3 col;
  col.r=texture2D(tDiffuse,uv+vec2(sp,0.)).r;
  col.g=texture2D(tDiffuse,uv).g;
  col.b=texture2D(tDiffuse,uv-vec2(sp,md(4.)?g*.008:0.)).b;
  col=vec3(1.)-exp(-col*1.35);
  col*=1.+uPump*.16;
  float lg=dot(col,vec3(.3,.59,.11));
  if(gC>.01){ vec3 dv=mix(vec3(lg),col,.5)*vec3(.9,1.05,.93); dv=pow(max(dv,0.),vec3(1.12)); col=mix(col,dv,gC); }
  if(gN>.01){ vec2 d=vUv-.5; d.x*=uRes.x/uRes.y; float tube=sst(.62,.38,length(d)); vec3 nv=vec3(.16,1.,.3)*pow(lg*2.4+.03,.85)*tube; nv+=vec3(.05,.3,.08)*(rnd(vUv*uRes+fract(t))-.45)*.22*tube; col=mix(col,nv,gN); }
  if(gF>.01){ float th=clamp(lg*2.2,0.,1.); th=sst(.02,.95,th); vec3 fl=vec3(th)+(rnd(vec2(floor(vUv.y*uRes.y*.5),floor(t*30.)))-.5)*.035; col=mix(col,fl,gF); }
  if(gA>.01){ vec2 d=vUv-.5; float vg=sst(.85,.25,length(d*vec2(1.,1.2))); vec3 ph=vec3(lg*1.15+.04)*vec3(1.04,1.,.9)*vg;
    float sc=step(.997,rnd(vec2(floor(vUv.x*uRes.x*.5),floor(t*12.))))*step(.6,rnd(vec2(floor(t*12.),3.)));
    ph=mix(ph,vec3(.9),sc*.5); col=mix(col,ph,gA); }
  vec2 d=vUv-.5; col*=mix(1.,sst(.95,.22,length(d*vec2(1.,1.18))),.6);
  float rb=fract(t*.06); col*=1.-.07*sst(.05,0.,abs(vUv.y-rb));
  if(md(7.)&&rnd(vec2(band,floor(t*40.)+uGS))>1.-.35*g) col=mix(col,vec3(rnd(vUv*uRes+t))*.55,.85);
  if(uAcq>0.&&rnd(vec2(band,floor(t*40.)))>1.-.14*uAcq) col=mix(col,vec3(rnd(vUv*uRes+t)),.38);
  if(uIR>0.){ float l=dot(col,vec3(.3,.59,.11)); vec3 ir=vec3(l*.8,l*1.08,l*.78)*2.1+.035; col=mix(col,ir,uIR); }
  col+=(rnd(vUv*uRes+fract(t))-.5)*uGrain*(1.+gC*1.4+gN*2.+gA*1.6+gF*.6);
  col=mix(col,1.-col,uInvert);
  gl_FragColor=vec4(col,1.);
}`};

