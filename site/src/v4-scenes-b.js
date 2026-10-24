/* ---------------- GLSL: custom scenes, part B (sightings, FLIR, films) ---------------- */
const SCENES_B={
/* ball lightning */
ball:`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  float H0=-.1;
  vec3 fogC=fogCol(p)*vec3(.92,.96,1.1);
  vec3 col=sky(p,fogC,H0);
  float cl=fbm(vec2(p.x*1.4+uTime*.015+uScroll*.12,p.y*3.)+3.);
  col=mix(col,vec3(.02,.02,.026)+fogC*.45*cl,sst(-.02,.22,p.y)*.92);
  col+=vec3(.55,.55,.75)*uFlash*.3*sst(.35,.75,cl)*sst(-.05,.3,p.y);
  col=mix(col,fogC*.45,row(lay(p,.75),uSeed+2.,.055,.05,.13,H0+.005,aa,0.,0.));
  vec2 b=uC[0].xy; float bi=uCN>.5?uC[0].w:0.;
  if(p.y<H0){
    float z=.14/max(H0-p.y,1e-4);
    vec2 w=vec2((p.x+uScroll*.6)*z,z);
    col=mix(vec3(.014,.016,.013)*(.6+.6*fbm3(w*2.)),fogC*.55,exp(-z*.14));
    col+=mix(uAccent,vec3(.8,.8,1.),.5)*exp(-length((p-vec2(b.x,H0-.06))*vec2(1.,3.))*6.)*.18*bi;
  }
  for(int f=0;f<7;f++){
    float ff=float(f), fx=wrapX(-1.2+ff*.38-uScroll*.7,2.66);
    float post=fillD(abs(p.x-fx)-.005,aa)*step(-.26,p.y)*step(p.y,-.14+.01*h11(ff));
    col=mix(col,vec3(.004),post);
  }
  for(int w=0;w<2;w++){ float wy=-.16-float(w)*.05+.003*sin(p.x*7.); col=mix(col,vec3(.005),fillD(abs(p.y-wy)-.001,aa)); }
  PHEN(p,1.,col)
  // arcs leap from the ball to the ground on the backbeat
  if(bi>.1&&uFlash>.02){
    float t=clamp((b.y-p.y)/(b.y-H0+.08),0.,1.);
    float bx=b.x+(fbm3(vec2(p.y*18.,uBoltSeed))-.5)*.12*t+(vn(vec2(p.y*70.,uBoltSeed))-.5)*.02;
    float d=abs(p.x-bx);
    col+=(vec3(.9,.9,1.)*exp(-d*700.)+uAccent*exp(-d*70.)*.3)*uFlash*step(H0-.08,p.y)*step(p.y,b.y);
  }
  float rn=step(.986,h21(floor(vec2(p.x*140.+p.y*36.,p.y*9.+uTime*34.))));
  col+=vec3(.16,.18,.22)*rn*(.4+uHigh*.5);
  col=grassFg(p,lay(p,0.),-.46,aa,col);
  return col;
}`,
/* ground orbs */
orbs:`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  float H0=.02;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,H0);
  PHEN(p,0.,col)
  col=mix(col,fogC*.5,row(lay(p,.85),uSeed+1.,.045,.04,.11,H0,aa,0.,0.));
  col=mix(col,fogC*.3,row(lay(p,.6),uSeed+3.,.09,.08,.2,H0-.02,aa,0.,0.));
  if(p.y<H0){
    float z=.25/max(H0-p.y,1e-4);
    vec2 w=vec2((p.x+uScroll*.4)*z,z);
    col=mix(vec3(.016,.018,.014)*(.5+.7*fbm3(w*1.5)),fogC*.6,exp(-z*.08));
    for(int i=0;i<8;i++){
      if(float(i)>=uCN) break;
      vec2 o=uC[i].xy; float gy=min(o.y-.06,H0-.01);
      col+=mix(uAccent,vec3(1.,.9,.7),.4)*exp(-length((p-vec2(o.x,gy))*vec2(1.,3.5))*9.)*.22*uC[i].w*step(p.y,gy+.03);
    }
  }
  col=mix(col,fogC*1.15,.5*uFog*sst(-.05,-.25,p.y)*fogN(p+vec2(uScroll*.2,0.),.03,2.2));
  PHEN(p,2.,col)
  vec2 q=lay(p,0.);
  float gx=q.x*55.;
  float tall=-.32+.12*vn(vec2(gx*.2,1.))+.1*abs(sin(gx*.9+vn(vec2(gx,2.))*4.))*vn(vec2(gx*.6,3.));
  col=mix(col,vec3(.003),fillD(p.y-tall,aa));
  for(int i=0;i<6;i++){
    float fi=float(i), sx=wrapX((h11(fi*3.3)-.5)*2.4-uScroll*1.1,2.4);
    float stalk=fillD(abs(p.x-sx-.04*(p.y+.5)*sin(uTime*.6+fi))-.0018,aa)*step(p.y,-.08-.08*h11(fi*7.));
    float head=fillD(length((p-vec2(sx+.04*(.42-.08*h11(fi*7.))*sin(uTime*.6+fi),-.08-.08*h11(fi*7.)))*vec2(2.2,1.))-.012,aa);
    col=mix(col,vec3(.003),max(stalk,head));
  }
  return col;
}`,
/* FLIR: gimbal */
gimbal:`
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float bank=.28*sin(uTime*.035)+.08*sin(uTime*.11);
  vec2 q=rot2(bank)*p;
  float hz=-.08+.03*sin(uTime*.05);
  vec3 col=vec3(.09)*(1.-sst(-.4,.6,q.y)*.55);
  float clouds=fbm(vec2(q.x*2.4+uTime*.22,(q.y-hz)*7.));
  col=mix(col,vec3(.17+.13*clouds),sst(hz+.01,hz-.03,q.y));
  col+=vec3(.03)*sst(.6,.8,fbm(vec2(q.x*5.+uTime*.25,q.y*14.)))*step(q.y,hz);
  for(int i=0;i<8;i++){ if(float(i)>=uCN) break; float d=length((p-uC[i].xy)*vec2(1.,1.5)); col=mix(col,vec3(.05),sst(uC[i].z,uC[i].z*.3,d)*uC[i].w); col+=vec3(.25)*uC[i].z*uC[i].z/(d*d+uC[i].z*uC[i].z)*.15*uC[i].w; }
  // the object: a dark core inside a bright aura, slowly rotating about its axis
  vec2 o=p-vec2(.006*sin(uTime*1.3),.004*sin(uTime*1.7));
  float rotA=.9*sin(uTime*.045)+.35*sin(uTime*.013);
  // uX.x: range. It drops back and returns now and then, and the outline slowly reshapes, a little
  vec2 lo=rot2(rotA)*o/uX.x;
  float mo=(.4+.6*(.5+.5*sin(uTime*.05)))*.12;
  float fo=.034*(1.+mo*sin(uTime*.16+1.3)), fr=.027*(1.+mo*sin(uTime*.19+2.));
  float core=length(lo*vec2(1.,2.6*(1.+mo*.9*sin(uTime*.21))))-.05;
  float fins=min(length((lo-vec2(-fo,.0))*vec2(2.4,1.))-fr*(1.+mo*.6*sin(uTime*.13)),length((lo-vec2(fo,.0))*vec2(2.4,1.))-fr*(1.-mo*.6*sin(uTime*.13)));
  float sd=smin(core,fins,.004+.012*mo)+.0025*mo*8.*sin(atan(lo.y,lo.x)*3.+uTime*.4);
  sd*=uX.x;
  col=mix(col,vec3(.45),exp(-max(sd,0.)*40.)*.85*mix(.75,1.,uX.x));
  col=mix(col,vec3(.03),fillD(sd,aa*2.));
  return col;
}`,
/* FLIR: tic tac */
tictac:`
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float T=mod(uTime,26.), slew=sst(16.,22.,T)*(1.-sst(23.,25.5,T));
  vec2 c=vec2(-.55*slew+.01*sin(uTime*1.1),.01*sin(uTime*.9)+.03*slew);
  float wave=fbm(vec2(p.x*3.+uTime*.06,p.y*9.-uTime*.04));
  vec3 col=vec3(.1+.07*wave)*(1.-sst(-.5,.5,p.y)*.35);
  col+=vec3(.035)*sst(.62,.82,fbm(vec2(p.x*7.+uTime*.1,p.y*22.)));
  vec2 o=p-c;
  float cap=length(vec2(max(abs(o.x)-.032,0.),o.y))-.016;
  col=mix(col,vec3(.46),fillD(cap,aa*1.5));
  col+=vec3(.2)*exp(-max(cap,0.)*70.)*.4;
  return col;
}`,
/* FLIR: tic tac, tracked. The pod slews to hold it in the gate while the sea streams past; zoom and polarity switch the way the published pod footage does */
tictactrack:`
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float cyc=fract(uTime/30.);
  float Z=(cyc>.4&&cyc<.9)?2.:1.;
  float bht=cyc>.55?1.:0.;
  // the track gate lags the target a little, then catches up
  vec2 err=vec2(.012*sin(uTime*.9)+.006*sin(uTime*2.3),.007*sin(uTime*1.3))*(1.+uKick*.5);
  vec2 bg=p/Z+vec2(uTime*.16,.02*sin(uTime*.05));
  float sea=fbm(vec2(bg.x*2.6,bg.y*7.));
  float cloud=sst(.48,.7,fbm(vec2(bg.x*1.4+3.,bg.y*3.2)));
  float v=.2+.12*sea-.1*sst(-.1,.45,p.y);
  v=mix(v,.3+.1*sea,cloud*.6);
  vec2 q=p-err;
  float L=.034*Z, Rr=.016*Z;
  float cap=length(vec2(max(abs(q.x)-L,0.),q.y))-Rr;
  float hot=fillD(cap,aa*1.5);
  v=mix(v,.96,hot);
  v+=.3*exp(-max(cap,0.)*60./Z)*(1.-hot);
  v=mix(v,.62-v*.6,bht)*.48;
  vec3 col=vec3(v);
  // gate corners ride the target; the centre boresight stays put in the HUD
  vec2 g=abs(p-err*.6);
  float gs=.062*Z+.003*sin(uTime*7.), ln=.022*Z, th=.0013;
  float lh=fillD(abs(g.y-gs)-th,aa)*step(gs-ln,g.x)*step(g.x,gs+th);
  float lv=fillD(abs(g.x-gs)-th,aa)*step(gs-ln,g.y)*step(g.y,gs+th);
  col=mix(col,vec3(mix(.95,.02,bht)),max(lh,lv));
  return col;
}`,
/* the farm, 1950 */
farm:`
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float H0=-.16;
  vec3 col=mix(vec3(.62,.6,.56),vec3(.42,.42,.44),sst(-.2,.5,p.y));
  col+=vec3(.05)*(fbm(p*vec2(1.5,4.)+3.)-.5);
  PHEN(p,0.,col)
  col=mix(col,vec3(.34,.34,.33),row(vec2(p.x+2.,p.y),11.,.05,.05,.12,H0,aa*1.5,0.,0.));
  if(p.y<H0){ float z=.2/max(H0-p.y,1e-4); col=vec3(.36,.34,.3)*(.75+.35*fbm3(vec2(p.x*z*3.,z*2.)))*(1.-exp(-z*.1)*.2); }
  vec2 gq=p-vec2(-.62,H0);
  float shed=fillD(max(abs(gq.x)-.17,abs(gq.y-.07)-.07),aa);
  float roof=fillD(max(abs(gq.x)*.42+(gq.y-.2),-(gq.y-.14)),aa);
  float doorw=fillD(max(abs(gq.x+.05)-.05,abs(gq.y-.05)-.05),aa);
  col=mix(col,vec3(.2,.19,.18),max(shed,roof));
  col=mix(col,vec3(.1),doorw*shed);
  vec2 pq=p-vec2(.7,H0);
  float pole=fillD(abs(pq.x+.01*pq.y)-.007,aa)*step(0.,pq.y)*step(pq.y,.66);
  float xarm=fillD(max(abs(pq.x)-.07,abs(pq.y-.6)-.006),aa);
  col=mix(col,vec3(.12),max(pole,xarm));
  for(int w=0;w<2;w++){
    float fw=float(w), x0=.7+(fw-.5)*.12, y0=H0+.6;
    float u=(x0-p.x)/1.6;
    float wy=y0-u*.2-.08*4.*u*(1.-u)+fw*.01;
    col=mix(col,vec3(.14),fillD(abs(p.y-wy)-.0014,aa)*step(0.,u)*step(u,1.));
  }
  col=mix(col,vec3(.15),fillD(abs(p.y-(H0+.05+.004*sin(p.x*40.)))-.002,aa)*step(-.4,p.x)*step(p.x,.55));
  return col;
}`,
/* Rendlesham */
rendlesham:`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  float H0=-.12;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,H0);
  // the lighthouse beam sweeps in from the coast every few seconds
  float ba=uTime*1.25;
  vec2 lh=vec2(.95,-.06);
  vec2 v=p-lh; float ang=atan(v.y,v.x);
  float beam=exp(-pow(abs(sin((ang-ba)*.5)),1.)*40.)*exp(-length(v)*.8);
  float face=pow(max(0.,cos(ba-PI)),40.);
  col+=vec3(1.,.95,.8)*(beam*.16+face*.3*exp(-length(v)*6.));
  PHEN(p,0.,col)
  col=mix(col,fogC*.45,row(lay(p,.8),uSeed+1.,.05,.12,.26,H0+.03,aa,0.,0.));
  col=mix(col,fogC*1.15,.5*uFog*sst(.0,-.18,p.y)*fogN(p+vec2(uScroll*.2,0.),.02,2.));
  PHEN(p,1.,col)
  col=mix(col,fogC*.18,row(lay(p,.45),uSeed+2.,.11,.3,.56,H0-.04,aa,0.,0.));
  if(p.y<H0-.04){ col=mix(col,vec3(.008)*(.7+.6*fbm3(vec2((p.x+uScroll*.6)*20.,p.y*30.))),.85); }
  col=eyes(lay(p,.45),col,-.15);
  col=mix(col,vec3(.004),row(lay(p,0.),uSeed+4.,.26,.9,1.5,-.47,aa,0.,0.));
  return col;
}`,
/* the tower (after Close Encounters): the mothership over Devils Tower. The camera orbits the butte, keeping it centred:
   ground nearer than the butte slides one way, the far ridges the other, and the ship, which hangs a little off the butte's
   axis and turns slowly on its own, shows new sides as the view comes round. Features on the ship and the rock columns are
   placed by azimuth, so they rotate past instead of sliding.
   Most of the time the ship is a black silhouette with a few running lights; now and then it powers up ring by ring. */
tower:`
vec2 shipP(float r,float a,float y,float yaw){ float b=a-yaw; return vec2(r*sin(b),y-.13*r*cos(b)); }
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  float th=uScroll*.6+uMouse.x*.05;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,-.24);
  float cu=fract(uTime/52.+.62);
  float Lq=sst(.36,.58,cu)*(1.-sst(.84,.97,cu));
  float L=sst(0.,1.,Lq), pulse=1.+uLow*.45+uKick*.25;
  vec3 AMB=mix(vec3(1.,.52,.2),uAccent,.12), WRM=vec3(1.,.82,.58), BLU=vec3(.6,.78,1.), PUR=vec3(.82,.72,1.);
  float W=.66*clamp(ASP()/1.6,.55,1.);
  float yaw=uTime*.02+th;
  vec2 c=vec2(.1*W*sin(th+.6),.25+.01*sin(uTime*.05));
  vec2 q=(p-c)/W; float qa=aa/W;
  float hr=length(q*vec2(.8,2.2));
  col+=mix(vec3(.05,.048,.07),AMB*.2,L)*exp(-hr*1.9)*(.6+.9*L)*pulse;
  col+=vec3(.3,.08,.03)*L*exp(-length(q*vec2(.55,1.2))*1.6)*.22;
  col=craft(p,0.,col);
  // --- ship silhouette ---
  float ell=length(vec2(q.x,(q.y+.05)/.13));
  float dish=fillD((ell-1.)*.13,qa);
  float bx=abs(q.x);
  float ub=asin(clamp(q.x/.8,-1.,1.))+yaw;
  float bandTop=.058+.016*step(.45,h11(floor(ub*9.)))+.01*sqrt(max(0.,1.-pow(fract(ub*7.)*2.-1.,2.)));
  float band=fillD(max(bx-.8+.05*sst(.0,.06,q.y),max(q.y-bandTop,-q.y-.045)),qa);
  float deck=fillD(max(bx-.56,abs(q.y-.085)-.022),qa)+fillD(max(bx-.37,abs(q.y-.114)-.01),qa);
  float uc=asin(clamp(q.x/.3,-1.,1.))+yaw, uc2=asin(clamp(q.x/.34,-1.,1.))+yaw*1.;
  float kc=floor(uc*16.), cx=fract(uc*16.);
  float hgt=(.05+.19*pow(max(0.,1.-bx/.3),1.4))*(.45+.65*h11(kc+4.));
  float city=step(bx,.3)*step(abs(cx-.5),.34)*step(.118,q.y)*step(q.y,.12+hgt);
  float kc2=floor(uc2*11.+.5);
  float hgt2=(.03+.12*pow(max(0.,1.-bx/.34),1.2))*(.5+.6*h11(kc2+11.));
  city=max(city,step(bx,.34)*step(abs(fract(uc2*11.+.5)-.5),.4)*step(.118,q.y)*step(q.y,.12+hgt2));
  float ant=0.;
  for(int i=0;i<6;i++){ float fi=float(i); vec2 ap=shipP(.04+.16*h11(fi*5.3),fi*1.05+h11(fi)*2.,.12,yaw);
    float ah=.2+.22*h11(fi*2.1)*(1.-abs(ap.x)*2.);
    ant=max(ant,fillD(abs(q.x-ap.x)-.0028,qa)*step(ap.y,q.y)*step(q.y,ap.y+ah)); }
  float spk=0.; vec2 tips[14]; float tvis[14];
  for(int i=0;i<14;i++){ float fi=float(i), a=fi*.4488+.25*h11(fi*9.);
    float y0=.005+.045*h11(fi*1.7), r1=.98+.24*h11(fi*3.1), y1=y0+(h11(fi*7.3)-.5)*.13;
    vec2 a0=shipP(.55,a,y0,yaw), a1=shipP(r1,a,y1,yaw);
    spk=max(spk,fillD(sdSeg(q,a0,a1)-.0035,qa));
    tips[i]=a1; tvis[i]=(cos(a-yaw)>-.1||abs(a1.x)>.8)?1.:0.; }
  float uh=asin(clamp(q.x/.2,-1.,1.))+yaw, kh=floor(uh*14.), hx=fract(uh*14.);
  float clen=(.04+.14*pow(max(0.,1.-bx/.2),1.1))*(.4+.7*h11(kh+21.));
  float chand=step(bx,.2)*step(abs(hx-.5),.3)*step(q.y,-.13)*step(-.13-clen,q.y);
  float hull=clamp(dish+band+deck+city+ant+spk+chand,0.,1.);
  float gtex=vn(vec2(ub*40.,q.y*90.))*.6+vn(vec2(ub*10.,q.y*22.))*.4;
  vec3 hc=vec3(.007,.007,.01)+AMB*.05*L*gtex*(1.-sst(-.05,.0,-q.y))+BLU*.04*L*gtex*sst(-.03,-.1,q.y);
  col=mix(col,hc,hull);
  // --- ship lights ---
  vec2 wq=vec2(ub/.62,q.y);
  vec2 wc=floor(wq/vec2(.011,.0085)), wf=fract(wq/vec2(.011,.0085));
  float r1=h21(wc), r2=h21(wc+vec2(3.1,7.7));
  float wshape=step(abs(wf.x-.5),.3)*step(abs(wf.y-.5),.28);
  float wzone=max(max(band,deck),city)*(1.-ant)*sst(.8,.62,bx);
  float won=step(.6,r1)*step(.5,fract(wc.y*.5))*step(r2*.9+.05,Lq)*(1.-city*.7);
  vec3 wcol=mix(AMB,WRM,step(.7,h21(wc+5.)))*(.75+.25*sin(uTime*(1.5+r1*4.)+r1*40.));
  col+=wcol*wshape*wzone*won*.9*pulse;
  float tl=h11(kc+31.), ton=step(h11(kc+57.)*.9+.05,Lq);
  col+=mix(AMB,WRM,step(.75,tl))*city*ton*(.08+.5*step(.6,tl)*(.55+.45*sin(q.y*900.*step(.8,tl)+uTime*2.)))*pulse;
  float under=step(q.y,-.05)*dish, ua=atan(q.x,-(q.y+.05)/.13);
  for(int k=0;k<4;k++){ float fk=float(k), rr=.96-fk*.17;
    float d=abs(ell-rr)*.13;
    float ch=.55+.45*sin((ua+yaw)*(14.+fk*4.)+uTime*(2.+fk)*(mod(fk,2.)<.5?1.:-1.));
    col+=mix(BLU,WRM,step(1.5,fk))*sst(.006,0.,d)*under*ch*step(.12+fk*.2,Lq)*.75*pulse; }
  col+=mix(BLU,vec3(1.),.35)*chand*L*(.3+.65*sst(-.13,-.13-clen,q.y))*pulse;
  col+=BLU*L*.12*exp(-length((q-vec2(0.,-.2))*vec2(2.2,3.))*2.5)*pulse;
  for(int i=0;i<14;i++){ float fi=float(i); float d=length(q-tips[i])*W;
    float run=step(.72,h11(fi*13.))*step(.5,fract(uTime*.4+h11(fi)));
    float lit=max(run*.5,L*step(h11(fi*4.1),Lq*1.1))*tvis[i];
    col+=mix(vec3(1.,.25,.1),AMB,L)*(sst(.004,0.,d)*1.2+.00012/(d*d+.00012)*.35)*lit*pulse; }
  for(int i=0;i<4;i++){ float fi=float(i), fa=fi*1.57+.4;
    vec2 fp=shipP(.3+.4*h11(fi*6.1),fa,.02+.08*h11(fi*2.3)-step(2.5,fi)*.22,yaw);
    vec2 d=(q-fp)*W; float tw=.6+.4*sin(uTime*(1.3+fi*.7)+fi*2.);
    float fl=.00008/(dot(d,d)+.00008)+exp(-abs(d.y)*900.)*exp(-abs(d.x)*14.)*.6+exp(-abs(d.x)*900.)*exp(-abs(d.y)*10.)*.4;
    col+=PUR*fl*sst(.55,.85,Lq)*tw*pulse*.5*step(-.2,cos(fa-yaw)); }
  float yt=.03, yb=-.2, yg=-.335;
  float below=sst(c.y-.1*W,yt,p.y)*(1.-sst(c.y-.05*W,c.y+.02,p.y));
  col+=mix(AMB,WRM,.35)*L*below*exp(-abs(p.x-c.x)*5.5)*.22*pulse*(.75+.25*fogN(p,.04,3.));
  // --- far ridges, beyond the butte: they slide the other way as the camera comes round ---
  float fx=p.x+th*.75;
  float ridge=-.215+.07*pow(fbm3(vec2(fx*1.7,3.)),1.6)+.025*sin(fx*1.1+1.)+.012*vn(vec2(fx*9.,1.));
  col=mix(col,mix(fogC*.75,vec3(.012),.2),fillD(p.y-ridge,aa));
  col=mix(col,mix(fogC*.45,vec3(.01),.5),row(vec2(fx*1.6,p.y),uSeed+2.,.012,.008,.018,ridge-.004,aa,0.,0.));
  // --- Devils Tower: a fluted column stack with a low domed top, splaying at the foot into a broad boulder apron.
  //     The edges and the columns are looked up by the orbit angle, so the outline shifts slightly as the camera circles. ---
  float wT=.09*(1.+.05*sin(2.*th+.5));
  float sh=clamp((p.y-yb)/(yt-yb),0.,1.);
  float wC=wT*(1.+.62*pow(1.-sh,1.9));
  float eL=.007*(vn(vec2((th+1.57)*4.,p.y*5.))-.5)+.0025*(step(.5,vn(vec2((th+1.57)*30.,p.y*2.)))-.5);
  float eR=.007*(vn(vec2((th-1.57)*4.+9.,p.y*5.))-.5)+.0025*(step(.5,vn(vec2((th-1.57)*30.+3.,p.y*2.)))-.5);
  float topE=yt+.009*(1.-min(1.,pow(p.x/wT,2.)))+.004*(vn(vec2(p.x*60.+th*4.,2.))-.5);
  float colsR=fillD(max(max(-wC+eL-p.x,p.x-wC-eR),p.y-topE),aa)*step(yb-.06,p.y);
  float ta=clamp((yb+.02-p.y)/(yb+.02-yg),0.,1.);
  float aw=mix(wC,.31,pow(ta,1.25));
  float aL=aw*(1.+.14*(vn(vec2((th+1.57)*2.,p.y*14.))-.5))+.02*(vn(vec2(p.y*40.,th*3.+1.))-.5);
  float aR=aw*(1.+.16*(vn(vec2((th-1.57)*2.+5.,p.y*14.))-.5))+.022*(vn(vec2(p.y*35.,th*3.+4.))-.5)+.035*sst(.15,.55,ta)*(1.-ta);
  float aTop=yb+.015+.05*clamp(p.x/.3,-.6,1.)+.018*(vn(vec2(p.x*14.+th*2.,7.))-.4);
  float apron=fillD(max(max(-p.x-aL,p.x-aR),p.y-aTop),aa)*step(yg-.06,p.y);
  float cw0=max(wC,.01), ang=asin(clamp(p.x/cw0,-1.,1.));
  float flute=.5+.5*sin((ang+th)*34.+vn(vec2((ang+th)*5.,p.y*8.))*2.5);
  float shade=.5+.5*cos(ang);
  vec3 rc=vec3(.013,.012,.014)*(.6+.5*flute)*shade;
  rc+=mix(vec3(.04,.04,.06),AMB,L)*(.02+.16*L)*pulse*(sst(topE-.018,topE,p.y)*1.1+.22*sst(yb,yt,p.y)*flute*shade);
  vec3 ac=vec3(.011,.0105,.012)*(.55+.6*vn(vec2((p.x+th*.02)*90.,p.y*60.)))+AMB*L*.012*pulse;
  col=mix(col,ac,apron);
  col=mix(col,rc,colsR);
  // --- pines at the foot of the apron (about the butte's own distance, so they barely move) ---
  col=mix(col,vec3(.006),row(vec2(p.x+th*.04,p.y),uSeed+3.,.016,.022,.05,yg+.012,aa,0.,0.));
  col=mix(col,vec3(.005),row(vec2(p.x+th*.08+.3,p.y),uSeed+4.,.02,.025,.06,yg-.012,aa,0.,0.));
  col=mix(col,fogC*1.15+AMB*L*.04,.32*uFog*sst(yg+.06,yg-.04,p.y)*fogN(vec2(p.x+th*.3,p.y),.02,2.));
  // --- the grassy foothill in front: lighter than the forest, sparse pines, sliding the opposite way ---
  float fhx=p.x-th*.667;
  float hill=-.37+.028*sin(fhx*2.1+1.)+.022*fbm3(vec2(fhx*1.5,5.));
  col=mix(col,vec3(.014,.011,.011)+fogC*.28,fillD(p.y-hill,aa));
  col=mix(col,vec3(.006),row(vec2(fhx,p.y),uSeed+5.,.06,.03,.08,-.4,aa,0.,0.));
  // --- foreground pines, fastest of all ---
  float gx=p.x-th*2.33;
  col=mix(col,vec3(.003),fillD(p.y-(-.44+.02*vn(vec2(gx*6.,9.))),aa));
  col=mix(col,vec3(.004),row(vec2(gx,p.y),uSeed+6.,.22,.22,.4,-.5,aa,0.,0.));
  return col;
}`,
/* logging road (after Fire in the Sky): crew truck stopped between walls of pine, a craft flooding the fog beyond the trees,
   and one man walking out toward it until the beam takes him */
road:`
float rdX(float z){ return .18*sin(z*.07+.6)-.1; }
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  p.x+=sin(uTime*.04)*.012+uMouse.x*.02; p.y+=uMouse.y*.006;
  float camH=.55, ph=uAmtA+uAmtB;
  vec3 fogC=fogCol(p);
  vec3 LC=mix(vec3(.72,.84,1.),uAccent,.22);
  float pulse=.85+.15*sin(uTime*.9)+uLow*.35;
  vec3 col=sky(p,fogC,0.);
  float gl=exp(-length((p-uLight)*vec2(1.,1.15))*5.5);
  col+=LC*gl*.22*pulse*ph;
  PHEN(p,0.,col)
  float zt=5.6, tx=rdX(zt);
  vec3 HC=vec3(1.,.9,.72);
  if(p.y<0.){
    float z=camH/max(-p.y,1e-4), wx=p.x*z, rx=wx-rdX(z);
    float on=sst(.78,.6,abs(rx)+.08*(vn(vec2(z*1.5,wx*2.))-.5));
    float tex=fbm3(vec2(wx*3.,z*2.5));
    vec3 g=mix(vec3(.02,.02,.022)*(.6+.8*tex),vec3(.085,.078,.07)*(.7+.6*tex),on);
    g*=1.-.45*on*sst(.08,0.,abs(abs(rx)-.27));
    float d=z-zt-.3;
    if(d>0.){ float hl=exp(-d*.2)*sst(.42+d*.2,.12+d*.1,abs(wx-mix(rdX(z),tx,exp(-d*.3))));
      g+=HC*hl*(.8*on+.15)*(.9+.1*tex); }
    float tb=zt-z; if(tb>0.) g+=vec3(1.,.06,.03)*.22*exp(-tb*1.6)*exp(-abs(wx-tx)*2.5);
    g+=LC*.14*exp(-length(vec2(wx-uLight.x*15.,z-15.))*.35)*ph*pulse;
    col=mix(g,fogC*1.25+LC*.05*ph,1.-exp(-z*.08*uFog));
  }
  // the walk out: 60 s from the shoulder toward the trees, then the beam
  float u=fract(uTime/60.+.15), zf=8.;
  float fxw=rdX(zf)+.55+u*.75;
  vec2 foot=vec2(fxw/zf,-camH/zf+.002);
  float fvis=1.-sst(.79,.81,u);
  float beam=sst(.72,.77,u)*(1.-sst(.81,.9,u));
  for(int i=0;i<15;i++){
    float fi=float(i), id=15.-fi, z=id*1.45+.5;
    float wx=p.x*z, wy=p.y*z+camH, px=rdX(z);
    float cw=.95, ci=floor(wx/cw), cov=0.;
    float fk=1.-exp(-z*.075*uFog);
    for(int k=-2;k<=2;k++){
      float c=ci+float(k);
      float r1=h21(vec2(c,id)), r2=h21(vec2(c+7.,id)), r3=h21(vec2(c+13.,id));
      float tx2=(c+.15+.7*r1)*cw;
      if(abs(tx2-px)<1.05+.45*r3||r3<.08) continue;
      cov=max(cov,treeAt(vec2(wx-tx2,wy),4.5+5.5*r2,r3*53.+c*1.7+id*.37,aa*z,cw*2.));
    }
    vec3 tcol=mix(vec3(.004,.004,.005),fogC,fk)+LC*gl*.06*fk*ph+HC*.05*exp(-abs(z-zt-3.)*.5)*sst(1.6,.3,abs(wy-.2))*step(zt,z);
    col=mix(col,tcol,cov*sst(.3,1.2,z));
    if(z>zf&&z-1.45<=zf){
      col+=LC*beam*.9*exp(-abs(p.x-foot.x)*140.)*step(foot.y,p.y)*sst(.9,.2,p.y)+LC*beam*.12*exp(-abs(p.x-foot.x)*30.)*step(foot.y,p.y);
      col=figure(p,foot,.36,aa,fvis,col);
      col+=LC*beam*.35*exp(-length((p-foot-vec2(0.,.035))*vec2(1.,.5))*40.);
    }
    if(z>zt&&z-1.45<=zt){
      vec2 q=vec2(p.x*zt-tx,p.y*zt+camH); float ta=aa*zt;
      float body=fillD(max(abs(q.x)-.33,abs(q.y-.21)-.12),ta);
      float cab=fillD(max(abs(q.x)-.28+(q.y-.33)*.25,abs(q.y-.47)-.14),ta)*step(.33,q.y);
      float whl=fillD(max(abs(abs(q.x)-.25)-.06,abs(q.y-.06)-.07),ta);
      float bump=fillD(max(abs(q.x)-.35,abs(q.y-.1)-.025),ta);
      float tr=clamp(body+cab+whl+bump,0.,1.);
      col+=HC*.0025/(dot(vec2(abs(q.x)-.3,q.y-.22)*vec2(1.,2.2),vec2(abs(q.x)-.3,q.y-.22)*vec2(1.,2.2))+.0025)*.22*(1.-tr);
      col=mix(col,vec3(.005,.005,.006),tr);
      float win=fillD(max(abs(q.x)-.19,abs(q.y-.5)-.055),ta);
      col+=(vec3(.04,.05,.06)+LC*.05*ph)*win;
      vec2 tl=vec2(abs(q.x)-.3,q.y-.25);
      col=mix(col,vec3(1.2,.1,.05),fillD(max(abs(tl.x)-.022,abs(tl.y)-.04),ta));
      col+=vec3(1.,.08,.04)*(.0006/(dot(tl,tl)+.0006))*.35;
    }
  }
  // headlight haze and dust down the road ahead of the truck
  vec2 hc=vec2(rdX(zt+4.)/(zt+4.),-camH/(zt+4.)+.03);
  float hz=exp(-length((p-hc)*vec2(1.3,3.2))*4.);
  col+=HC*hz*.2*(.8+.4*fogN(p,.05,3.));
  col+=HC*step(.998,h21(floor(p*vec2(300.,300.))+floor(uTime*4.)))*hz*.8;
  col+=LC*.07*pulse*ph*exp(-length((p-vec2(uLight.x,-.02))*vec2(.8,2.2))*3.5);
  col=mix(col,fogC*1.1,.3*uFog*sst(.0,-.15,p.y)*fogN(p,.03,2.));
  col=grassFg(p,lay(p,0.),-.48,aa,col);
  return col;
}`,
/* the valley (after Hessdalen): looking down a long valley from its side. Misty mountains at the head, a fog-filled floor with a
   river and a few farm lights, wooded walls closing in from both sides, and the lights that follow each other drifting over the floor */
valley:`
// a valley wall: low at the river, rising on rounded shoulders to an uneven ridgeline on either side
float vwall(float x,float vx,float base,float hgt,float w,float amp,float seed){
  float d=abs(x-vx), n=fbm3(vec2(x*1.4+seed,seed*3.1));
  return base+hgt*sst(.02,w,d)*(.75+.5*n)+amp*(fbm3(vec2(x*4.+seed,seed))*2.-1.)+.01*sin(x*2.3+seed);
}
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  vec3 fogC=fogCol(p);
  float hz=.05;
  vec3 col=sky(p,fogC,hz);
  col+=vec3(.13,.125,.15)*exp(-length((p-vec2(0.,hz+.02))*vec2(.6,2.6))*2.4)*.65;
  PHEN(p,0.,col)
  // mountains at the head of the valley
  float fx=p.x+uScroll*.03+uMouse.x*.004;
  float mtn=hz+.025+.1*pow(ridged(vec2(fx*1.2+floor(uSeed)*.37,1.7)),1.7)*(.55+.45*sst(.05,.5,abs(fx)));
  col=mix(col,mix(fogC*.75,fogC*1.3,sst(mtn-.06,mtn,p.y)*.0+.25),fillD(p.y-mtn,aa));
  col=mix(col,fogC*1.35,.55*uFog*sst(hz+.07,hz-.01,p.y)*(.7+.3*fogN(p,.01,2.)));
  // the valley floor: fields, a winding river that holds the sky, scattered farm lights, all sinking into fog with distance
  if(p.y<hz){
    float z=.22/max(hz-p.y,1e-4), wx=(p.x+uScroll*.02)*z;
    float rx=wx-.55*sin(z*.32+1.)-.18*sin(z*.9+2.);
    float fld=fbm3(vec2(wx*2.,z*1.2));
    vec3 g=vec3(.026,.03,.027)*(.6+.7*fld)*(.85+.3*step(.5,fract(wx*1.3+fld)));
    float riv=sst(.3,.16,abs(rx));
    g=mix(g,fogC*1.6+vec3(.025)+uAccent*.02*(uAmtA+uAmtB),riv*.9);
    vec2 fc=floor(vec2(wx*.9,z*.55)), ff=fract(vec2(wx*.9,z*.55))-.5;
    float lt=step(.93,h21(fc+floor(uSeed)))*step(.2,abs(rx));
    g+=vec3(1.,.78,.45)*lt*sst(.06,0.,length(ff*vec2(1.,.5)))*(1.2+.3*sin(uTime*.5+h21(fc)*30.));
    col=mix(g,fogC*1.3,1.-exp(-z*.1*uFog));
  }
  // the walls, back to front; the lights drift above the floor, behind the nearer slopes
  for(int i=0;i<5;i++){
    float fi=float(i), d=1.-fi/4.;
    float x=(p.x+uScroll*(.04+fi*.06)+uMouse.x*.01*fi)*(1.+fi*.1);
    float vx=.06*sin(fi*1.7+floor(uSeed));
    float base=hz-.012-pow(fi/4.,1.2)*.55;
    float hg=vwall(x,vx,base,.04+fi*.1,.78-fi*.04,.008+fi*.008,fi*7.3+floor(uSeed));
    float m=fillD(p.y-hg,aa);
    float sc=.02+fi*.04;
    m=max(m,row(vec2(x*1.,p.y-hg),fi*7.+floor(uSeed),sc*.5,sc*.45,sc,0.,aa,0.,0.)*sst(.25,.4,vn(vec2(x*.8,fi))));
    vec3 lc=mix(vec3(.01,.011,.013),fogC*1.15,pow(d,1.15)*.85);
    col=mix(col,lc,m);
    col+=fogC*(.25+.3*d)*fillD(abs(p.y-hg)-.0016,aa)*m*step(.5,d);
    float mist=sst(.06,0.,p.y-hg)*sst(-.02,.0,p.y-hg+.06)*fogN(vec2(x,p.y),.012,2.);
    col=mix(col,fogC*1.25,mist*.42*uFog*d);
    if(i==1) col=craft(p,1.,col);
  }
  return col;
}`,
/* looking up through a dead canopy: crows wheeling under a moonlit overcast */
deadcanopy:`
// a crow seen from below, in units of half its wingspan, x along its heading. open: 1 = wings spread, 0 = top of the upstroke
float crowSD(vec2 q,float open){
  float S=mix(.52,1.,open), sw=(1.-open)*.25;
  float body=(length(q/vec2(.25,.085))-1.)*.08;
  float head=length(q-vec2(.27,0.))-.07;
  float beak=sdSeg(q,vec2(.3,0.),vec2(.41,0.))-.02*(1.-clamp((q.x-.3)/.11,0.,1.));
  float tx=-.2-q.x;
  float tail=max(abs(q.y)-(.065+max(tx,0.)*.4),max(-tx,tx-.27+1.6*q.y*q.y))*.8;
  float d=min(min(body,head),min(beak,tail));
  // broad wings: the arm keeps its chord out to the wrist, rounded at the leading edge, the secondaries forming a straight trailing edge
  float ay=abs(q.y), u=clamp(ay/S,0.,1.);
  float lead=.15-.03*u-.07*u*u-sw*u, trail=-.19+.04*u+.1*sst(.45,.68,u)-sw*u*.75;
  float arm=max(max(q.x-lead,trail-q.x),max(ay-.68*S,.03-ay));
  d=min(d,arm);
  // the hand: five long primaries, separated and splaying apart toward the tips
  vec2 fq=vec2(q.x,ay);
  for(int k=0;k<5;k++){ float fk=float(k), f=fk/4.;
    vec2 b=vec2(mix(.07,-.05,f)-sw*.66,.6*S);
    vec2 e=vec2(mix(.13,-.2,f)-sw*.95,mix(1.,.86,f)*S);
    d=min(d,sdSeg(fq,b,e)-mix(.043,.035,f)*(1.-.4*clamp((fq.y-b.y)/(e.y-b.y),0.,1.))); }
  return d;
}
vec2 crowPos(float i,float t){
  float h=h11(i*7.31), h2=h11(i*3.77+1.);
  vec2 C=vec2(.08*sin(t*.031+i*.4),.06*cos(t*.024+i*.3))+(vec2(h,h2)-.5)*.12;
  float R=mix(.12,.26,h2), w=(h<.5?-1.:1.)*(.035+.035*h)/(R+.15);
  float a=t*w+h*6.283;
  vec2 pos=C+R*vec2(cos(a),sin(a)*(.65+.35*h));
  if(i>7.5){ float T=fract(t*.02+h); pos=mix(vec2(-1.,-.4),vec2(1.,.45),T)+vec2(0.,.05*sin(T*9.)); }
  return pos;
}
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float pf=mix(1.,1.65,sst(1.,.5,ASP())); p*=pf; aa*=pf;
  p=rot2(uTime*.01+uMouse.x*.06+.03*sin(uTime*.2))*p;
  float r=length(p);
  vec3 fogC=fogCol(p);
  vec2 mp=vec2(.12,.08);
  float md=length(p-mp);
  float cl=fbm(p*2.4+vec2(uTime*.02,0.)+floor(uSeed));
  vec3 col=mix(vec3(.045,.043,.054),vec3(.085,.081,.095),sst(.35,.75,cl))*uFog;
  col+=vec3(.11,.105,.12)*exp(-md*9.)*(.6+.4*sst(.3,.7,cl));
  col+=vec3(.42,.41,.44)*sst(.03,.018,md)*(1.-sst(.45,.7,cl)*.8);
  col+=uAccent*.03*(uAmtA+uAmtB);
  PHEN(p,0.,col)
  // crows soaring on slow loops round a drifting centre, wings held open, banking into the turn
  // just two, always far off: small and softened by the haze
  for(int i=0;i<2;i++){
    float fi=float(i), z=.15+fi*.1, h=h11(fi*5.1);
    float sz=(.022+.008*fi)*(.9+.2*h);
    vec2 pos=crowPos(fi,uTime), vel=crowPos(fi,uTime+.05)-pos;
    if(length(p-pos)>sz*1.7) continue;
    float hd=atan(vel.y,vel.x);
    vec2 v2=crowPos(fi,uTime+.1)-crowPos(fi,uTime+.05);
    float dh=atan(v2.y,v2.x)-hd; dh=atan(sin(dh),cos(dh));
    float bank=clamp(dh*14.,-.4,.4);
    vec2 q=rot2(hd)*(p-pos)/sz;   // rot2(a) turns by -a, so this brings the heading onto +x
    q.y*=1.+bank*sign(q.y)*.3;
    float open=.95+.03*sin(uTime*.6+fi*1.7);
    float m=fillD(crowSD(q,open),aa/sz*1.2);
    col=mix(col,mix(vec3(.004),col*.55,(1.-z)*.55),m);
  }
  float t0=upTrees(p,12.,0.,.34,.1,.3,12.,5.,aa);
  float t1=upTrees(p,8.,1.,.5,.06,.2,12.,5.,aa);
  col=mix(col,fogC*.3,t0); col=mix(col,vec3(.004),t1);
  col*=1.-.45*sst(.5,1.,r);
  return col;
}`,
/* the shell (after Arrival) */
shell:`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  vec3 fogC=fogCol(p)*vec3(.95,1.02,1.);
  vec3 col=mix(fogC*1.25,vec3(.03,.032,.04),sst(-.1,.5,p.y));
  float cl=fbm(vec2(p.x*1.1+uTime*.01+uScroll*.1,p.y*2.5));
  col=mix(col,fogC*1.4,sst(.5,.8,cl)*sst(.0,.3,p.y)*.6);
  // the shell hangs a few metres above the meadow
  vec2 sc=vec2((.12-.22*sin(uScroll*.07))*min(1.,ASP()*.9),.1+.008*sin(uTime*.15));
  vec2 sq=rot2(.32)*(p-sc);
  float sd=length(sq*vec2(1./.105,1./.34))-1.;
  float sh=fillD(sd*.1,aa);
  float rim=exp(-abs(sd)*22.)*sst(-.2,.3,sq.x+sq.y*.3);
  col=mix(col,vec3(.018,.019,.022)+fogC*.08*(1.-sst(-.3,.3,sq.y)),sh);
  col+=fogC*.6*rim*(1.-sh*.5);
  PHEN(p,1.,col)
  for(int i=0;i<4;i++){
    float fi=float(i), x=-.3+fi*.2, base=-.02-fi*.07, amp=.05+fi*.02;
    float xx=(p.x+uScroll*(.15+fi*.18))*(1.+fi*.2)+fi*7.;
    float hg=base+amp*(fbm3(vec2(xx*1.2,fi*3.))*2.-1.);
    col=mix(col,mix(vec3(.015,.018,.016),fogC*1.05,.85-fi*.24),fillD(p.y-hg,aa));
    col=mix(col,fogC*1.2,.35*uFog*sst(.06,-.04,p.y-base)*sst(-.12,0.,p.y-base+.06)*fogN(vec2(xx,p.y),.015,2.));
  }
  for(int j=0;j<9;j++){
    float fj=float(j);
    vec2 o=vec2(sc.x-.35+fj*.03+.02*h11(fj),-.155-.01*h11(fj*3.));
    col+=mix(vec3(1.,.85,.6),vec3(.8,.9,1.),step(.5,h11(fj*7.)))*sst(.0025,0.,length(p-o))*.9;
  }
  col=mix(col,fogC*1.2,.5*uFog*sst(-.1,-.3,p.y)*fogN(p+vec2(uScroll*.3,0.),.03,2.5));
  col=grassFg(p,lay(p,0.),-.47,aa,col);
  return col;
}`,
};
