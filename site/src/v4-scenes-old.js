const SCENE_GLSL=[
/* 0 the treeline */`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p+uMouse*.005,fogC,-.05);
  PHEN(p,0.,col)
  vec2 q4=lay(p,.9);
  col=mix(col,fogC*.85,fillD(q4.y-(-.02+.06*fbm3(vec2(q4.x*1.6+uSeed,0.))),aa*2.)*.8);
  col=mix(col,fogC*.78,row(q4,uSeed+1.,.05/uDensity,.10,.24,-.06,aa,uClear,.2));
  col=mix(col,fogC,.35*uFog*sst(.1,-.15,p.y)*fogN(p,.012,1.6));
  vec2 q3=lay(p,.6);
  col=mix(col,fogC*.5,row(q3,uSeed+2.,.08/uDensity,.2,.42,-.14,aa,uClear,.5));
  col=mix(col,fogC*1.05,.45*uFog*sst(0.,-.25,p.y)*fogN(p+3.,.02,2.2));
  PHEN(p,1.,col)
  vec2 q2=lay(p,.35);
  col=mix(col,fogC*.22,row(q2,uSeed+3.,.13/uDensity,.38,.75,-.24,aa,uClear,.75));
  col=eyes(q2,col,-.2);
  col=figure(p,vec2(uAppX,-.25),1.,aa,uApp,col);
  col=mix(col,fogC*.9,.5*uFog*sst(-.12,-.36,p.y)*fogN(p+7.,.03,2.8));
  PHEN(p,2.,col)
  vec2 q1=lay(p,0.);
  col=mix(col,vec3(.004,.004,.006),row(q1,uSeed+4.,.24/uDensity,.85,1.4,-.42,aa,uClear,.9));
  col=grassFg(p,q1,-.45,aa,col);
  col=mix(col,fogC*1.2,.4*uFog*sst(-.3,-.5,p.y)*fogN(p+11.,.04,3.));
  return col;
}`,
/* 1 the path: slow walk between the trees */`
float pathX(float zw){ return .7*sin(zw*.13)+.35*sin(zw*.31+1.7); }
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  p+=vec2(sin(uTime*.37)*.012+uMouse.x*.03,sin(uTime*1.7)*.004*uCamT/(uCamT+1.)+uMouse.y*.01);
  p=rot2(sin(uTime*.29)*.012)*p;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,0.);
  col+=fogC*.6*exp(-length((p-vec2(0.,.01))*vec2(1.,2.5))*5.);
  PHEN(p,0.,col)
  float camH=.55;
  if(p.y<0.){
    float z=camH/max(-p.y,1e-4);
    float zw=z+uCamT, wx=p.x*z;
    float on=sst(.55,.3,abs(wx-pathX(zw))+.12*(vn(vec2(zw*2.,wx))-.5));
    float tex=fbm3(vec2(wx*3.,zw*3.));
    vec3 g=mix(vec3(.014,.014,.016)*(.6+.8*tex),vec3(.065,.06,.062)*(.7+.6*tex),on);
    col=mix(g,fogC,1.-exp(-z*.07*uFog));
  }
  float dz=1.6, base=floor(uCamT/dz), off=fract(uCamT/dz)*dz;
  for(int i=0;i<13;i++){
    float fi=float(i);
    float id=base+13.-fi;
    float z=(13.-fi)*dz-off;
    if(z<.25) continue;
    float wx=p.x*z, wy=p.y*z+camH;
    float px=pathX(id*dz);
    float cw=1.35, ci=floor(wx/cw), cov=0.;
    for(int k=-1;k<=1;k++){
      float c=ci+float(k);
      float r1=h21(vec2(c,id)), r2=h21(vec2(c+7.,id)), r3=h21(vec2(c+13.,id));
      float tx=(c+.15+.7*r1)*cw;
      if(abs(tx-px)<.95||r3<.2) continue;
      cov=max(cov,treeAt(vec2(wx-tx,wy),3.+4.*r2,r3*53.+c*1.7+id*.37,aa*z));
    }
    float fk=1.-exp(-z*.075*uFog);
    col=mix(col,mix(vec3(.004,.004,.005),fogC,fk),cov*sst(.25,1.1,z));
  }
  float zf=11.;
  col=figure(p,vec2(pathX(zf+uCamT)/zf,-camH/zf),2.4/zf*4.,aa,uApp,col);
  col=eyes(p*1.3,col,-.06);
  col=mix(col,fogC*1.1,.3*uFog*sst(.0,-.15,p.y)*fogN(p,.03,2.));
  return col;
}`,
/* 2 looking up: the canopy */`
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float pf=mix(1.,1.65,sst(1.,.5,ASP())); p*=pf; aa*=pf;
  p=rot2(uTime*(.018+uLevel*.012)+uMouse.x*.08)*p;
  p*=1.+.04*sin(uTime*.1)+uKick*.015;
  float r=length(p);
  vec3 fogC=fogCol(p);
  vec3 col=mix(vec3(.12,.112,.136)*uFog,vec3(.04,.037,.048),sst(.05,.8,r));
  col+=fogC*.3*sst(.5,.85,fbm(p*2.2+vec2(uTime*.01,0.)+uSeed))*sst(.6,.1,r);
  float st=h21(floor(p*170.)+floor(uSeed));
  col+=vec3(.1)*step(.9975,st)*(.5+.5*sin(uTime*1.7+st*97.)+uHigh*.5)*sst(.55,.2,r);
  col+=uAccent*.03*(uAmtA+uAmtB)*exp(-length(p-uLight)*4.);
  PHEN(p,0.,col)
  float t0=upTrees(p,15.,0.,.22,.04,.14,0.,4.,aa);
  float t1=upTrees(p,10.,1.,.34,.06,.2,0.,4.,aa);
  float t2=upTrees(p,6.,2.,.52,.1,.28,0.,4.,aa);
  col=mix(col,fogC*.35,t0); col=mix(col,fogC*.12,t1); col=mix(col,vec3(.004),t2);
  col*=1.-.3*sst(.5,1.,r);
  return col;
}`,
/* 3 found footage: camcorder, flashlight, effigies */`
vec3 effigy(vec2 p,float dep,float fi,vec3 Lc,float aa,vec3 col){
  vec2 hp=vec2((h11(fi*5.+floor(uSeed))-.5)*1.5,.38);
  vec2 q=p*dep;
  float sw=.12*sin(uTime*(.6+fi*.17)+fi*2.);
  vec2 r=rot2(sw)*(q-hp);
  float d=sdSeg(r,vec2(0.),vec2(0.,-.12));
  d=min(d,sdSeg(r,vec2(0.,-.12),vec2(.004,-.37)));
  d=min(d,sdSeg(r,vec2(-.1,-.16),vec2(.1,-.2)));
  d=min(d,sdSeg(r,vec2(-.07,-.19),vec2(-.03,-.05)));
  d=min(d,sdSeg(r,vec2(.004,-.33),vec2(-.07,-.45)));
  d=min(d,sdSeg(r,vec2(.004,-.33),vec2(.075,-.44)));
  d=min(d,sdSeg(r,vec2(-.04,-.26),vec2(.05,-.24)));
  float m=fillD(d-.0055,aa*dep);
  return mix(col,vec3(.36,.27,.17)*Lc*(1.7/(dep*dep*.5+.5))+vec3(.002),m);
}
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  p=rot2(uShake.z)*(p+uShake.xy);
  float bd=length((p-uBeam)*vec2(1.,1.12));
  float flick=(1.-.5*step(.985,h11(floor(uTime*14.)))*step(.6,h11(floor(uTime*.7))))*(1.-uSnare*.3);
  vec3 Lc=vec3(1.,.92,.78)*(sst(.62,.05,bd)*.65+exp(-bd*bd*10.)*.75)*flick;
  vec3 col=vec3(.005,.006,.006);
  col+=Lc*.05*(.5+fbm3(p*3.+vec2(uTime*.05,0.)));
  float gy=-.14;
  if(p.y<gy){
    float z=.35/max(gy-p.y,1e-4);
    vec2 w=vec2(p.x*z,z);
    float lv=fbm(w*6.)*.7+.3*vn(w*40.);
    col=vec3(.32,.24,.16)*lv*Lc*1.2/(1.+z*.25)+vec3(.003);
  }
  for(int l=3;l>=0;l--){
    float fl=float(l);
    float dep=1.+fl*1.1;
    vec2 q=p*dep+vec2(fl*3.17+floor(uSeed)*.7,0.);
    float cw=.55, ci=floor(q.x/cw);
    for(int k=-1;k<=1;k++){
      float c=ci+float(k);
      float r1=h11(c*2.3+fl*17.+floor(uSeed)), r2=h11(c*7.1+fl*3.+floor(uSeed)), r3=h11(c*4.4+fl*9.);
      if(r3<.18) continue;
      float rad=.035+.05*r2;
      float x=q.x-(c+.2+.6*r1)*cw-(r3-.6)*.12*(q.y+.5);
      float bc=treeTex(vec2(x,q.y+.62),2.3,c*3.1+fl*17.,aa*dep,6.+step(.5,r1));
      col=mix(col,vec3(.3,.25,.19)*Lc*(1.5/(dep*dep*.55+.45))+vec3(.002),bc*.92*step(.42,r2));
      float ax=abs(x);
      if(ax<rad+aa*dep*2.){
        float n=clamp(ax/rad,0.,1.);
        float bark=.55+.45*vn(vec2(x*50.,q.y*7.+c*13.))*(.7+.3*vn(vec2(x*200.,q.y*40.)));
        vec3 lit=vec3(.42,.37,.31)*bark*sqrt(1.-n*n)*Lc*(1.8/(dep*dep*.55+.45))+vec3(.002);
        col=mix(col,lit,fillD(ax-rad,aa*dep)*step(gy*dep-.1,q.y));
      }
    }
    if(l==2){ col=effigy(p,2.4,2.,Lc,aa,col); }
    if(l==1){ col=effigy(p,1.7,1.,Lc,aa,col); col=effigy(p,1.35,0.,Lc,aa,col); }
  }
  col=eyes(p,col*1.,.02);
  col=figure(p,vec2(uBeam.x+.38,-.2),.9,aa,uApp,col);
  float twig=0.;
  for(int i=0;i<4;i++){ float fi=float(i); vec2 o=vec2((h11(fi*3.+floor(uSeed))-.5)*1.6,.5); twig=max(twig,fillD(sdSeg(p,o,o+vec2((h11(fi)-.5)*.5,-.25-.15*h11(fi*2.)))-.004,aa)); }
  col=mix(col,vec3(.002),twig);
  return col;
}`,
/* 4 the valley (after Hessdalen) */`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,.02);
  col+=vec3(.13,.12,.145)*exp(-length((p-vec2(.38,.1))*vec2(1.,2.2))*3.)*.55;
  PHEN(p,0.,col)
  float pan=uTime*.004;
  for(int i=0;i<6;i++){
    float fi=float(i), d=1.-fi/5.;
    float x=(p.x+pan*(1.+fi*.45)+uMouse.x*.01*fi)*(1.+fi*.12)+fi*17.3+floor(uSeed);
    float base=.06-fi*.085, amp=.03+fi*.022;
    float hg=base+amp*(fbm3(vec2(x*(1.4-fi*.15),fi*3.1))*2.-1.)+.015*sin(x*.7+fi);
    float m=fillD(p.y-hg,aa);
    if(i>=1){
      float sc=.035+fi*.045;
      m=max(m,row(vec2(x,p.y-hg),fi*7.+floor(uSeed),sc*.5,sc*.45,sc,0.,aa,0.,0.)*sst(.3,.45,vn(vec2(x*.8,fi))));
    }
    vec3 lc=mix(vec3(.012,.012,.015),fogC*1.3,pow(d,1.1)*.92);
    float crest=fillD(abs(p.y-hg)-.0016,aa)*m;
    col=mix(col,lc,m);
    col+=fogC*(.35+.35*d)*crest;
    float mist=sst(.07,0.,p.y-(base-.035))*sst(-.12,0.,p.y-(base-.1))*fogN(vec2(x,p.y),.012,2.);
    col=mix(col,fogC*1.2,mist*.38*uFog*(1.-fi*.12));
    if(i==2){
      for(int j=0;j<3;j++){
        float fj=float(j);
        vec2 o=vec2(-.25+fj*.22+.05*sin(uTime*.11+fj*2.),base-.02+.03*sin(uTime*.23+fj*1.7));
        float dd=length(p-o);
        float pulse=.55+.3*sin(uTime*(.9+fj*.3)+fj)+uMid*.6+uKick*.3;
        col+=(uAccent*.0009/(dd*dd*40.+.0009)*.3+vec3(1.,.96,.88)*sst(.006,0.,dd))*pulse;
      }
      for(int j=0;j<6;j++){
        float fj=float(j);
        vec2 o=vec2((h11(fj*5.7+floor(uSeed))-.5)*1.6,base+.005+.01*h11(fj));
        col+=vec3(1.,.8,.5)*sst(.0024,0.,length(p-o))*.7;
      }
    }
  }
  return col;
}`,
/* 5 the range (after the Phoenix lights) */`
float crest(float x,float s){ float v=0.,a=.6,f=1.; for(int i=0;i<5;i++){ float n=1.-abs(vn(vec2(x*f,s+float(i)*3.1))*2.-1.); v+=a*pow(n,1.7); f*=2.15; a*=.46;} return v; }
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,.05);
  PHEN(p,0.,col)
  float pan=uTime*.003;
  for(int i=0;i<3;i++){
    float fi=float(i);
    float x=(p.x+pan*(1.+fi))*(1.+fi*.3)+fi*9.7+uSeed+uMouse.x*.01*(fi+1.);
    float A=.55-fi*.15, B=-.06-fi*.08;
    float hh=B+A*(crest(x*.7,fi*7.)-.3);
    float m=fillD(p.y-hh,aa);
    float db=hh-p.y;
    vec2 rp=vec2(x*3.2,db*5.5+fi*3.);
    float F=ridged(rp), Fx=ridged(rp+vec2(.045,0.));
    float lit=clamp(.5+(Fx-F)*7.,0.,1.);
    float dk=1.-fi*.28;
    vec3 rock=mix(fogC*.15,fogC*1.0+uAccent*.015,lit*dk)*(1.-sst(0.,.3,db)*.5);
    rock+=fogC*.55*sst(.007,0.,db)*dk;
    rock+=vec3(.05,.055,.066)*sst(.55,.75,F)*sst(.14,0.,db)*lit*dk;
    col=mix(col,mix(rock,fogC*1.1,fi*.28),m);
    col=mix(col,fogC*1.15,.45*uFog*sst(.05,-.05,p.y-(B-.06))*fogN(vec2(x,p.y),.01,2.));
  }
  vec2 q=lay(p,0.);
  col=mix(col,vec3(.004),row(q,uSeed+4.,.1,.16,.36,-.4,aa,0.,0.));
  col=grassFg(p,q,-.47,aa,col);
  return col;
}`,
/* 6 the plain (after Marfa and Skinwalker) */`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  float H=-.06;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,H);
  vec2 su=SP();
  float bb=(su.y-.22-su.x*.35)*5.; float band=exp(-bb*bb);
  col+=vec3(.05,.05,.065)*band*fbm(su*vec2(6.,14.)+floor(uSeed))*(.6+.4*vn(su*60.));
  PHEN(p,0.,col)
  float x=p.x+uTime*.003+uMouse.x*.01;
  float mh=H;
  for(int i=0;i<4;i++){
    float fi=float(i);
    float c=(h11(fi*3.1+floor(uSeed))-.5)*2.4;
    float w=.12+.2*h11(fi*7.3+floor(uSeed));
    float top=H+.03+.07*h11(fi*5.9+floor(uSeed));
    float edge=w+.04*(vn(vec2(p.y*40.,fi))-.5);
    mh=max(mh,mix(H,top,sst(edge+.06,edge,abs(x-c)))+.004*(vn(vec2(x*60.,fi))-.5));
  }
  col=mix(col,vec3(.012,.011,.014)+fogC*.1+uAccent*.01,fillD(p.y-mh,aa));
  col+=fogC*.35*fillD(abs(p.y-mh)-.0015,aa)*step(H+.004,mh);
  if(p.y<H){
    float z=.12/max(H-p.y,1e-4);
    float tex=fbm3(vec2(x*z*2.,z*1.5));
    col=mix(vec3(.012,.011,.012),fogC*.5,exp(-z*.15))*(.7+.6*tex);
    float road=sst(.3,.18,abs(x*z-.6));
    col=mix(col,fogC*.35*(.8+.4*tex),road*.6);
  }
  col=mix(col,fogC*1.15,.6*uFog*exp(-abs(p.y-H)*30.));
  for(int j=0;j<4;j++){
    float fj=float(j);
    float bx=-.45+fj*.28+.06*sin(uTime*.07+fj*1.3);
    float split=step(.6,sin(uTime*.13+fj*2.1))*.012*sin(uTime*.5+fj);
    for(int s=0;s<2;s++){
      vec2 o=vec2(bx+(float(s)-.5)*split*2.,H+.012+.006*sin(uTime*.31+fj));
      float dd=length(p-o);
      float pulse=.5+.5*sin(uTime*(.4+fj*.17)+fj*3.)+uMid*.3;
      col+=(mix(uAccent,vec3(1.,.85,.6),.4)*.0005/(dd*dd*60.+.0005)*.3+vec3(1.,.95,.85)*sst(.0035,0.,dd))*pulse;
    }
  }
  float vpx=.25;
  for(int k=0;k<9;k++){
    float fk=float(k);
    float z=1.+fk*1.7, z2=z+1.7;
    float sx=vpx-1.3/z, sx2=vpx-1.3/z2;
    float top=H+.32/z, top2=H+.32/z2;
    float bs=H-.18/z;
    float pw=.01/z;
    float pole=fillD(abs(p.x-sx)-pw,aa)*step(bs,p.y)*step(p.y,top);
    float arm=fillD(abs(p.y-(top-.03/z))-pw*.6,aa)*step(abs(p.x-sx),.07/z);
    col=mix(col,vec3(.004),max(pole,arm));
    if(p.x>sx&&p.x<sx2){
      float u=(p.x-sx)/(sx2-sx);
      for(int w=-1;w<=1;w++){
        float fw=float(w);
        float wy=mix(top-.03/z,top2-.03/z2,u)-.025/z*4.*u*(1.-u)+fw*0.;
        float ox=fw*.055;
        float wyy=mix(top-.03/z+0.,top2-.03/z2,u)-.03/z*4.*u*(1.-u);
        col=mix(col,vec3(.004),fillD(abs(p.y-wyy)-.0012,aa)*step(abs(fw),.5));
      }
    }
  }
  for(int f=0;f<6;f++){
    float ff=float(f);
    float fx=-1.+ff*.42+.05*h11(ff);
    float post=fillD(abs(p.x-fx)-.006,aa)*step(-.5,p.y)*step(p.y,-.3+.01*h11(ff*3.));
    col=mix(col,vec3(.003),post);
  }
  for(int w=0;w<3;w++){
    float fw=float(w);
    float wy=-.34-fw*.035+.004*sin(p.x*9.+fw);
    col=mix(col,vec3(.004),fillD(abs(p.y-wy)-.0011,aa)*(1.-step(.75,vn(vec2(p.x*80.,fw))))*1.);
  }
  return col;
}`,
/* 7 the lake */`
vec3 above(vec2 p,float aa,vec3 fogC){
  vec3 col=sky(p,fogC,-.08);
  PHEN(p,0.,col)
  vec2 q2=lay(p,.6);
  col=mix(col,fogC*.55,row(q2,uSeed+2.,.07,.12,.3,-.08,aa,0.,0.));
  vec2 q1=lay(p,.3);
  col=mix(col,fogC*.18,row(q1,uSeed+5.,.12,.18,.46,-.085,aa,0.,0.));
  PHEN(p,1.,col)
  return col;
}
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  vec3 fogC=fogCol(p);
  float H=-.085;
  vec3 col;
  if(p.y>=H){ col=above(p,aa,fogC); }
  else{
    float dp=H-p.y;
    float rip=.004*sin(p.y*220./(dp+.05)+uTime*1.5)+.006*(vn(vec2(p.x*8.,p.y*90./(dp+.1)+uTime*.3))-.5);
    col=above(vec2(p.x+rip*(1.+uLow),2.*H-p.y+rip*.5),aa*2.,fogC)*.72;
    col=mix(col,vec3(.01,.012,.016),sst(0.,.45,dp)*.45);
    col+=fogC*.1*exp(-dp*20.);
    float glint=exp(-abs(p.x-uLight.x+.02*sin(p.y*90.+uTime))*30.)*step(.55,vn(vec2(p.x*40.,p.y*260./(dp+.15)+uTime*.8)));
    col+=mix(uAccent,vec3(1.),.4)*glint*.35*(uAmtA+uAmtB+.3)*sst(.0,.04,dp)*exp(-dp*2.5);
  }
  col=mix(col,fogC*1.2,.5*uFog*exp(-abs(p.y-H)*18.)*fogN(p,.02,2.));
  float rx=p.x*70.;
  float reed=-.5+(.1+.12*vn(vec2(rx*.2,1.)))*sst(.25,.6,abs(p.x)/ASP()*2.)+.04*abs(sin(rx))*vn(vec2(rx*.5,2.));
  col=mix(col,vec3(.003),fillD(p.y-reed,aa));
  return col;
}`,
/* 8 the field (after Signs) */`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  p.x+=sin(uTime*.05)*.02+uMouse.x*.02;
  float H=.14;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,H);
  PHEN(p,0.,col)
  col=mix(col,fogC*.42,row(vec2(p.x+3.,p.y),uSeed+1.,.045,.035,.09,H-.004,aa,0.,0.));
  vec2 fh=p-vec2(.32,H);
  float house=fillD(max(abs(fh.x)-.06,abs(fh.y-.025)-.025),aa);
  float roof=fillD(max(abs(fh.x)*.62+(fh.y-.05),-(fh.y-.05)),aa);
  float silo=max(fillD(max(abs(fh.x+.12)-.016,abs(fh.y-.04)-.04),aa),fillD(length(fh-vec2(-.12,.08))-.016,aa));
  col=mix(col,vec3(.006),clamp(house+roof+silo,0.,1.));
  col+=vec3(1.,.72,.38)*fillD(max(abs(fh.x-.025)-.006,abs(fh.y-.03)-.007),aa)*.75;
  col=figure(p,vec2(.3,H+.062),.32,aa,uApp,col);
  if(p.y<H){
    float z=.6/max(H-p.y,1e-4);
    vec2 w=vec2(p.x*z,z);
    vec2 cc=vec2(-.3,7.);
    float rr=length(w-cc);
    float flt=clamp(sst(.12,0.,abs(rr-2.2))+sst(.1,0.,abs(rr-1.3))+step(rr,.6)+sst(.08,0.,abs(abs(w.x-cc.x)-.0)-.05)*step(rr,2.2)*step(w.y,cc.y),0.,1.);
    float rows=.5+.5*sin(w.x*14.);
    float stalks=fbm3(w*vec2(18.,3.));
    vec3 corn=vec3(.045,.046,.036)*(.5+.8*stalks)*(.7+.3*rows);
    vec3 laid=vec3(.13,.125,.105)*(.7+.3*sin(atan(w.y-cc.y,w.x-cc.x)*30.+rr*6.));
    vec3 g=mix(corn,laid,flt)+uAccent*.035*flt*(uAmtA+uAmtB);
    col=mix(g,fogC,1.-exp(-z*.06*uFog));
  }
  float fx=p.x*40.;
  float top=-.3+.08*vn(vec2(fx*.3,1.))+.05*abs(sin(fx*1.3+vn(vec2(fx,2.))*4.));
  col=mix(col,vec3(.004),fillD(p.y-top,aa));
  for(int i=0;i<5;i++){
    float fi=float(i);
    vec2 o=vec2((h11(fi*2.7)-.5)*1.8,-.32+.04*h11(fi));
    vec2 d=p-o;
    float leaf=fillD(abs(d.y-(.18*d.x*d.x*sign(h11(fi*5.)-.5)*8.)-.0)-.006*(1.-abs(d.x)*6.),aa)*step(abs(d.x),.16);
    col=mix(col,vec3(.004),leaf);
  }
  return col;
}`,
/* 9 the tower (after Close Encounters) */`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  float H=-.2;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,H);
  vec2 mc=vec2(0.,.25+.02*sin(uTime*.05));
  vec2 md=(p-mc)/vec2(.42,.13);
  float mr=length(md);
  vec3 wht=mix(uAccent,vec3(1.,.95,.85),.55);
  col+=wht*exp(-mr*1.8)*.15*(1.+uLow*.5);
  col+=vec3(1.,.92,.82)*exp(-length((p-mc-vec2(0.,-.06))/vec2(.55,.07))*2.6)*.2*(1.+uKick*.3);
  col=mix(col,vec3(.012,.012,.016),fillD(mr-1.,aa*6.)*.85);
  for(int j=0;j<5;j++){
    float fj=float(j);
    float ry=-.62+fj*.28;
    float rx=sqrt(max(0.,1.-ry*ry));
    float th=acos(clamp(md.x/max(rx,1e-3),-1.,1.));
    float n=10.+fj*5.;
    float sp=PI/n;
    float ph=uTime*(.15+fj*.05)*(mod(fj,2.)<.5?1.:-1.);
    float kk=floor((th-ph)/sp);
    float tc=(kk+.5)*sp+ph;
    vec2 dd=(md-vec2(rx*cos(tc),ry))*vec2(.42,.13);
    float d=length(dd);
    vec3 lc=mix(vec3(1.,.95,.85),uAccent,step(.62,h11(kk+fj*31.)));
    float bl=.45+.35*sin(uTime*3.+kk*1.7+fj)+uMid*.6;
    col+=lc*(sst(.0038,0.,d)*.9+.0003/(d*d*50.+.0003)*.12)*bl*step(abs(md.y-ry),.2)*step(mr,1.05);
  }
  float topY=.13, yb=H+.03;
  float tw=mix(.17,.085,sst(yb,topY,p.y));
  float flare=.06*sst(yb+.06,yb-.05,p.y);
  float tx=abs(p.x+.006*(vn(vec2(p.y*60.,1.))-.5));
  float tower=fillD(tx-tw-flare,aa)*step(p.y,topY+.004*vn(vec2(p.x*50.,3.)));
  float talus=fillD(p.y-(H+.085-abs(p.x)*.35+.02*vn(vec2(p.x*10.,5.))),aa);
  float colm=.5+.5*sin(p.x*150.+vn(vec2(p.x*30.,p.y*4.))*3.);
  float rim=sst(tw+flare-.014,tw+flare,tx)*.6+sst(topY-.012,topY,p.y)*.9;
  vec3 tc=vec3(.012,.011,.013)*(.6+.6*colm)+wht*rim*.09*(1.+uLow);
  col=mix(col,fogC*.3,talus);
  col=mix(col,tc,tower);
  vec2 q=lay(p,.2);
  col=mix(col,vec3(.004),row(q,uSeed+3.,.06,.06,.16,H,aa,0.,0.));
  col=mix(col,fogC*1.2,.4*uFog*sst(H+.1,H-.05,p.y)*fogN(p,.02,2.));
  col=mix(col,vec3(.003),fillD(p.y-(H-.12+.02*vn(vec2(p.x*6.,9.))),aa));
  vec2 q1=lay(p,0.);
  col=mix(col,vec3(.004),row(q1,uSeed+6.,.3,.5,.9,-.5,aa,.45,1.));
  return col;
}`,
/* 10 logging road (after Fire in the Sky) */`
vec3 scene(){
  vec2 p=SP()/uZoom; float aa=PXL()/uZoom;
  p.x+=sin(uTime*.04)*.015+uMouse.x*.02;
  float H=.02;
  vec3 fogC=fogCol(p);
  vec3 col=sky(p,fogC,H);
  if(p.y<H){
    float z=.3/max(H-p.y,1e-4);
    float wx=p.x*z;
    float road=sst(.75,.6,abs(wx));
    float gr=fbm3(vec2(wx*8.,z*6.));
    vec3 g=mix(vec3(.008),vec3(.03,.028,.026)*(.6+.8*gr),road);
    float rut=sst(.06,0.,abs(abs(wx)-.32))*road*.5;
    g*=1.-rut*.5;
    col=mix(g,fogC,1.-exp(-z*.08*uFog));
  }
  PHEN(p,0.,col)
  col=mix(col,fogC*.5,row(lay(p,.7),uSeed+2.,.06,.14,.3,H-.01,aa,.12,1.));
  col=mix(col,fogC*.22,row(lay(p,.4),uSeed+3.,.11,.3,.6,H-.04,aa,.22,1.));
  vec2 tk=p-vec2(-.03,-.1);
  float bed=fillD(max(abs(tk.x)-.055,abs(tk.y-.02)-.018),aa);
  float cab=fillD(max(abs(tk.x)-.045,abs(tk.y-.052)-.016),aa);
  float wh=fillD(length(vec2(abs(tk.x)-.04,tk.y+.002))-.012,aa);
  float rack=fillD(max(abs(tk.x)-.05,abs(tk.y-.072)-.002),aa)+fillD(max(abs(abs(tk.x)-.045)-.002,abs(tk.y-.06)-.012),aa);
  col=mix(col,vec3(.004),clamp(bed+cab+wh+rack,0.,1.));
  vec2 tl=vec2(abs(tk.x)-.047,tk.y-.028);
  col+=vec3(1.,.08,.04)*(sst(.005,0.,length(tl))*1.5+.00015/(dot(tl,tl)+.00015)*.15);
  col+=vec3(1.,.9,.7)*.06*exp(-length((p-vec2(-.03,-.05))/vec2(.25,.05))*3.);
  col=mix(col,fogC*1.1,.35*uFog*sst(H,H-.1,p.y)*fogN(p,.02,2.));
  col=mix(col,vec3(.004),row(lay(p,0.),uSeed+4.,.25,.9,1.4,-.45,aa,.5,1.));
  return col;
}`,
/* 11 looking up: the clearing */`
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float pf=mix(1.,1.65,sst(1.,.5,ASP())); p*=pf; aa*=pf;
  p=rot2(uTime*.012+uMouse.x*.06)*p;
  float r=length(p);
  vec3 fogC=fogCol(p);
  vec3 col=mix(vec3(.022,.021,.03),vec3(.09,.084,.105)*uFog,sst(.25,1.,r));
  vec2 mw=rot2(.6)*p;
  float band=exp(-mw.y*mw.y*22.);
  col+=vec3(.06,.058,.075)*band*(.5+.8*fbm(mw*vec2(3.,9.)+floor(uSeed)))*(.7+.3*vn(mw*80.));
  col-=vec3(.03)*band*sst(.55,.75,fbm(mw*vec2(5.,14.)+3.));
  for(int l=0;l<2;l++){
    float fl=float(l), sc=160.+fl*90.;
    vec2 g=floor(p*sc), o=fract(p*sc)-.5;
    float st=h21(g+fl*7.+floor(uSeed));
    float d=length(o-(vec2(h21(g+3.),h21(g+5.))-.5)*.6);
    col+=vec3(.9,.9,1.)*step(.985-fl*.01,st)*sst(.25,0.,d)*(.35+.25*sin(uTime*2.+st*90.)+uHigh*.5)*(.5+fl*.3);
  }
  float T=uTime*.08, sg=floor(T), f=fract(T);
  vec2 a0=vec2(h11(sg*3.1+floor(uSeed))-.5,h11(sg*7.7)-.5)*.7, a1=vec2(h11((sg+1.)*3.1+floor(uSeed))-.5,h11((sg+1.)*7.7)-.5)*.7;
  vec2 sp=mix(a0,a1,sst(.55,.7,f));
  float dd=length(p-sp);
  col+=(vec3(1.,.95,.85)*sst(.004,0.,dd)+uAccent*.0006/(dd*dd*60.+.0006)*.25)*(.8+.4*sin(uTime*7.)+uSnare*.6);
  PHEN(p,0.,col)
  float t0=upTrees(p,22.,0.,.3,.3,.48,0.,4.,aa);
  float t1=upTrees(p,13.,1.,.46,.26,.42,0.,4.,aa);
  col=mix(col,fogC*.42,t0); col=mix(col,vec3(.004),t1);
  col*=1.-.2*sst(.7,1.2,r);
  return col;
}`,
/* 12 looking up: underneath it */`
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float pf=mix(1.,1.65,sst(1.,.5,ASP())); p*=pf; aa*=pf;
  p=rot2(uTime*.01)*p;
  p*=1.+uKick*.02;
  float r=length(p), a=atan(p.y,p.x);
  vec3 fogC=fogCol(p);
  vec3 wht=mix(uAccent,vec3(1.,.95,.88),.55);
  vec3 col=mix(vec3(.02,.019,.026),vec3(.07,.065,.08)*uFog+wht*.025,sst(.45,1.05,r));
  float R=.46;
  float hull=fillD(r-R,aa*3.);
  vec3 hc=vec3(.032,.031,.038)*(.7+.3*fbm(vec2(a*6.,r*14.)));
  float seam=max(fillD(abs(fract(r*18.)-.5)/18.-.0012,aa),fillD(abs(fract(a/(2.*PI)*24.)-.5)*r*2.*PI/24.-.0012,aa)*sst(.12,.16,r));
  hc*=1.-seam*.5;
  col=mix(col,hc,hull);
  for(int j=0;j<4;j++){
    float fj=float(j), rr=.14+fj*.085, n=12.+fj*8.;
    float ang=a/(2.*PI)*n+uTime*(.12+fj*.05)*(mod(fj,2.)<.5?1.:-1.);
    vec2 q=vec2((fract(ang)-.5)*2.*PI*rr/n,r-rr);
    float d=length(q);
    float bl=.45+.35*sin(uTime*3.+floor(ang)*1.7+fj)+uMid*.7;
    vec3 lc=mix(wht,uAccent,step(.65,h11(floor(ang)+fj*31.)));
    col+=lc*(sst(.006,0.,d)*1.2+.0004/(d*d*60.+.0004)*.15)*bl*hull;
  }
  col+=wht*(sst(.08,0.,r)*(.22+uLow*.5)+exp(-r*14.)*(.16+uKick*.45));
  col+=wht*.05*exp(-abs(r-R)*30.);
  for(int i=0;i<2;i++){
    float fi=float(i), n=40.+fi*30.;
    float sec=floor((a/(2.*PI)+.5)*n);
    float sa=(sec+.5)/n*2.*PI-PI+(h11(sec+fi*9.)-.5)*.1;
    float rr=.95-fract(h11(sec*3.3+fi)+uTime*(.03+.02*h11(sec+fi*5.)))*.9;
    float d=length(p-vec2(cos(sa),sin(sa))*rr);
    col+=wht*sst(.003,0.,d)*.5*sst(.05,.2,rr)*(.5+uHigh*.6);
  }
  float t0=upTrees(p,18.,0.,.34,.47,.6,0.,4.,aa);
  col=mix(col,vec3(.004)+wht*.012,t0);
  col*=1.-.15*sst(.8,1.2,r);
  return col;
}`,
/* 13 looking up: dead canopy */`
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
  for(int i=0;i<3;i++){
    float fi=float(i);
    float T=fract(uTime*.03+fi*.37);
    vec2 c=mix(vec2(-.9,(h11(fi)-.5)*.6),vec2(.9,(h11(fi+3.)-.5)*.6),T);
    vec2 q=rot2(.2)*(p-c);
    float wing=sdSeg(vec2(abs(q.x),q.y),vec2(0.),vec2(.016,.006*sin(uTime*9.+fi*2.)+.004));
    col=mix(col,vec3(.004),fillD(min(wing,length(q)-.004)-.0012,aa));
  }
  float t0=upTrees(p,12.,0.,.34,.1,.3,6.,2.,aa);
  float t1=upTrees(p,8.,1.,.5,.06,.2,6.,1.,aa);
  col=mix(col,fogC*.3,t0); col=mix(col,vec3(.004),t1);
  col*=1.-.45*sst(.5,1.,r);
  return col;
}`
];
