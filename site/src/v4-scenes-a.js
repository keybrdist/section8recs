/* ---------------- GLSL: custom scenes, part A ---------------- */
const SCENES_A={
well:`
// a figure at the rim, seen from the bottom of the shaft: hands grip the edge first, then a head and shoulders lean over and look down
float rimFigure(vec2 p,vec2 O,float R0,float th,float hands,float head){
  vec2 nd=-vec2(cos(th),sin(th)), tg=vec2(-nd.y,nd.x), b=O-nd*R0;
  float k=R0/.1;
  vec2 q=vec2(dot(p-b,tg),dot(p-b,nd))/k;
  float m=0.;
  float hd=length((q-vec2(0.,.03))/vec2(.024,.03))-1.;
  float sh=length((q-vec2(0.,-.006))/vec2(.052,.026))-1.;
  float nk=max(abs(q.x)-.011,abs(q.y-.012)-.016);
  m=max(m,head*fillD(min(min(hd*.024,sh*.03),nk),.006));
  for(int s=0;s<2;s++){ float sx=float(s)*2.-1.;
    vec2 hq=q-vec2(sx*.078,-.002);
    float palm=length(hq/vec2(.015,.009))-1.;
    float fing=1e3;
    for(int f=0;f<4;f++){ float fx=(float(f)-1.5)*.0052; fing=min(fing,sdSeg(hq,vec2(fx,0.),vec2(fx*1.2,.019+.003*sin(float(f)*2.1)))-.0021); }
    m=max(m,hands*fillD(min(palm*.01,fing),.0035)); }
  return m;
}
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float pf=mix(1.,1.65,sst(1.,.5,ASP())); p*=pf; aa*=pf;
  p=rot2(.03*sin(uTime*.07))*p+vec2(.006*sin(uTime*.23),.004*sin(uTime*.31));
  vec3 fogC=fogCol(p);
  float R0=.165;
  // the shaft is not quite plumb, so the opening sits off-centre
  vec2 O=vec2(.05,.07)+.01*vec2(sin(uTime*.05),cos(uTime*.04));
  float ro=length(p-O), ao=atan(p.y-O.y,p.x-O.x);
  float rimR=R0*(1.+.035*(vn(vec2(ao*7.,3.))-.5)+.015*(vn(vec2(ao*23.,5.))-.5));
  // --- the opening: overcast night sky, a little moonlight in the cloud, ferns and twigs hanging over the edge ---
  vec2 sp=(p-O)/R0;
  vec3 sk=mix(vec3(.21,.215,.24),vec3(.13,.132,.155),sst(0.,1.1,length(sp)))*uFog;
  sk+=fogC*.35*sst(.45,.85,fbm(sp*1.6+vec2(uTime*.025,0.)+uSeed));
  sk+=vec3(.3)*step(.997,h21(floor(p*300.)+floor(uSeed)))*(.3+.3*sin(uTime*2.+p.x*90.));
  PHEN(p,0.,sk)
  float br=upTrees((p-O)*2.6*(.15/R0),9.,0.,.42,.05,.16,12.,5.,aa*2.6);
  sk=mix(sk,vec3(.008),br*sst(R0*1.15,R0*.65,ro)*.9);
  for(int k=0;k<7;k++){ float fk=float(k), ak=h11(fk*3.7+floor(uSeed))*6.283;
    vec2 nd=-vec2(cos(ak),sin(ak)), tg=vec2(-nd.y,nd.x), bp=O-nd*R0*1.02;
    vec2 q=vec2(dot(p-bp,tg),dot(p-bp,nd));
    float L=.03+.04*h11(fk*9.1), sd=h11(fk*5.)<.5?-1.:1.;
    float y=clamp(q.y,0.,L), cx=sd*.35*y*y/L+.002*sin(uTime*.6+fk);
    float wdt=.0011+.0055*(1.-y/L)*abs(sin(y*170.+fk));
    sk=mix(sk,vec3(.01),fillD(abs(q.x-cx)-wdt,aa)*step(0.,q.y)*step(q.y,L)*.95); }
  // apparitions at the rim: faint, torn by glitches, gone before you are sure
  float hands=sst(.0,.45,uSpec), head=sst(.35,.95,uSpec);
  if(uSpec>.005){
    float sd=floor(uSpecSeed), tg=sst(.02,.25,uSpec)*(1.-sst(.55,.9,uSpec));
    float burst=max(tg,step(.82,h11(floor(uTime*7.)+sd*3.)));
    vec2 pp=p+vec2((h11(floor(p.y*95.)+floor(uTime*26.)+sd)-.5)*.035*burst,0.);
    float px=.004+.004*burst; pp=mix(pp,(floor(pp/px)+.5)*px,step(.5,burst));
    float th=1.1+h11(sd*1.7)*2.6;
    float fm=rimFigure(pp,O,R0,th,hands,head);
    if(h11(sd*5.3)>.68) fm=max(fm,rimFigure(pp,O,R0,th+1.25+h11(sd)*.5,hands*.8,head*.8));
    float A=uSpec*(.78+.12*h11(sd*2.9))*(.85+.15*sin(uTime*31.+sd)*sin(uTime*7.3));
    sk=mix(sk,vec3(.012,.012,.016),fm*A);
    vec2 nd=-vec2(cos(th),sin(th)), tgv=vec2(-nd.y,nd.x), eb=O-nd*R0;
    vec2 eq=vec2(dot(pp-eb,tgv),dot(pp-eb,nd));
    eq/=R0/.1;
    float eyes=sst(.0028,0.,min(length(eq-vec2(-.0075,.034)),length(eq-vec2(.0075,.034))));
    sk+=vec3(.55,.55,.5)*eyes*head*A*.9*step(.6,fract(uTime*.31+sd));
  }
  // craft over the opening throw light down the shaft
  float spill=0.;
  for(int i=0;i<8;i++){ if(float(i)>=uCN) break; spill+=uC[i].w*sst(R0*1.3,0.,length(uC[i].xy-O)); }
  // --- the shaft: a brick cylinder. Each course is a circle whose centre slides from the opening toward the middle of the frame as it nears the camera ---
  float d=log(max(ro,R0)/R0);
  for(int k=0;k<4;k++) d=log(max(length(p-O*exp(-d*.9)),R0)/R0);
  vec2 dv=p-O*exp(-d*.9); float rr=length(dv), a=atan(dv.y,dv.x);
  float course=d*24.+.4*vn(vec2(a*5.,d*3.))+.25*sin(a+d*2.), row=floor(course), fr=fract(course);
  float u=(a/(2.*PI)+.5)*92.+mod(row,2.)*.5+.2*sin(row*.37)+.35*vn(vec2(a*9.,row*.7));
  float bi=floor(u), fu=fract(u);
  float det=sst(.05,.6,d);
  float mortar=max(1.-sst(.015,.07,.5-abs(fu-.5)+.04*(vn(vec2(u*5.,course))-.5)),1.-sst(.04,.14,.5-abs(fr-.5)))*det*(.6+.4*vn(vec2(a*30.,d*8.)));
  float bh=h21(vec2(bi,row));
  float stone=.55+.35*bh+.45*(fbm3(vec2(a*40.,d*60.))-.5)+.25*(vn(vec2(u*2.,course*2.))-.5);
  stone*=.55+.45*sst(.25,.65,fbm3(vec2(a*3.,d*2.2)+uSeed));
  stone*=1.-.6*step(.94,bh)*det;
  stone*=.85+.3*sst(.15,.45,fr);
  float moss=sst(.5,.72,fbm3(vec2(a*5.,d*4.)+uSeed))*sst(1.6,.3,d);
  float wet=sst(.72,.9,vn(vec2(a*18.,d*1.2)));
  float facing=.55+.45*dot(normalize(dv+1e-5),-normalize(O));
  float lit=exp(-d*.8)*(.65+.35*facing)*(1.+spill*2.2+uKick*.2+uLow*.15);
  vec3 wall=vec3(.15,.142,.13)*stone*(1.-mortar*.7);
  wall=mix(wall,vec3(.035,.045,.03),moss*.6);
  wall+=vec3(.03,.035,.04)*wet;
  wall*=lit;
  wall+=mix(uAccent,vec3(1.),.5)*spill*.05*exp(-d*1.2);
  vec3 col=mix(wall,sk,sst(rimR*1.012,rimR*.988,ro));
  // the lip of the opening catches the most light
  col+=vec3(.06,.06,.065)*sst(rimR*1.25,rimR,ro)*sst(rimR*.97,rimR*1.01,ro)*uFog;
  col*=1.-.6*sst(.3,1.05,length(p));
  return col;
}`,
};
