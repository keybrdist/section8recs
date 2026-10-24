vec3 wisps(vec2 p,float near,float amt){
  vec3 c=vec3(0.);
  for(int i=0;i<7;i++){
    float fi=float(i)+near*10.;
    float sp=.012+.02*h11(fi*3.1);
    float x=(h11(fi*1.7+floor(uSeed))-.5)*1.7+sin(uTime*sp*6.+fi)*.14;
    float y=mix(-.15,-.27,near)+.045*sin(uTime*(.3+h11(fi)*.4)+fi*2.);
    float r=length((p-vec2(x,y))*vec2(1.,.9));
    float fl=.55+.45*sin(uTime*(1.3+h11(fi*5.)*2.)+fi*7.);
    float sz=mix(.005,.008,near);
    c+=(uAccent*.0003/(r*r+.0003)*.3+vec3(1.,.97,.9)*sst(sz,0.,r)*.9)*fl;
  }
  return c*amt*(.6+uHigh*.6);
}
vec3 phen(float id,vec2 p,float amt,float stage,vec3 col){
  if(amt<.005) return col;
  vec2 L=uLight; float k=1.+uKick*.8+uSnare*.3;
  if(stage<.5){
    if(abs(id-0.)<.5){
    } else if(abs(id-1.)<.5){
      vec2 pq=L+rot2(uX.z)*(p-L)/uX.x;
      vec2 d=(pq-L)*vec2(1.,4.2);
      float r=length(d);
      col=mix(col,vec3(.004),sst(.075,.07,r)*amt);
      col+=uAccent*sst(.012,0.,abs(r-.072))*step(pq.y,L.y)*amt*.9*k;
      for(int i=0;i<3;i++){ float fi=float(i)-1.; float dd=length(pq-L-vec2(fi*.04,-.012)); col+=uAccent*sst(.006,0.,dd)*amt*(.6+.4*sin(uTime*6.+fi*2.)); }
      float dy=L.y-p.y;
      if(dy>0.){
        float wd=(.02+dy*.28)*uX.x;
        float cone=sst(wd,wd*.5,abs(p.x-L.x));
        float dust=.55+.45*fbm3(vec2(p.x*12.,p.y*6.+uTime*.4));
        col+=uAccent*cone*dust*.085*amt*(.5+uLow*.45)*sst(0.,.08,dy)*sst(.75,.15,dy);
      }
    } else if(abs(id-2.)<.5){
      float yy=p.y-.02;
      if(yy>0.){
        float n=fbm3(vec2(p.x*2.2+uTime*.03,uTime*.05));
        float x=p.x+(n-.5)*.6;
        float rays=pow(vn(vec2(x*22.,uTime*.2)),3.);
        float env=sst(0.,.12,yy)*sst(.5,.18,yy)*sst(.8,.2,abs(p.x-L.x));
        col+=mix(uAccent,vec3(.8,.9,1.),sst(.1,.4,yy)*.3)*rays*env*.5*amt*(.6+uMid*.8);
      }
    } else if(abs(id-4.)<.5){
      float bx=uBoltX+(fbm3(vec2(p.y*7.,uBoltSeed))-.5)*.3+(vn(vec2(p.y*40.,uBoltSeed))-.5)*.03;
      float d=abs(p.x-bx);
      col+=(vec3(.9,.92,1.)*exp(-d*900.)+uAccent*exp(-d*60.)*.25)*uFlash*step(-.05,p.y)*amt;
      col+=uAccent*.06*uFlash*amt*sst(-.1,.5,p.y);
      col+=uAccent*.02*amt*sst(.0,.5,p.y)*(.5+.5*sin(uTime*.7));
    } else if(abs(id-5.)<.5){
      vec2 d=p-L; float r=length(d); float R=.11;
      float corona=exp(-abs(r-R)*55.)*(.7+.3*vn(vec2(atan(d.y,d.x)*6.+uTime*.3,uTime*.2)));
      col=mix(col,vec3(.002),sst(R+.002,R-.002,r)*amt);
      col+=uAccent*corona*.75*amt*k*step(R-.004,r);
      col+=uAccent*.06*exp(-(r-R)*8.)*step(R,r)*amt;
    } else if(abs(id-7.)<.5){
      vec2 c=L;
      amt*=1.-uX.w;
      vec2 tp=rot2(uX.y)*(p-c)/uX.x;
      float S=.07;
      col=mix(col,vec3(.003),fillD(max(-tp.y-S*.5,abs(tp.x)*1.732+tp.y-S),.002)*amt);
      float d=min(length(tp-vec2(0.,S)),min(length(tp-vec2(-S*.866,-S*.5)),length(tp-vec2(S*.866,-S*.5))));
      float dc=length(tp);
      col+=(vec3(1.)*sst(.005,0.,d)+vec3(1.)*.0008/(d*d*60.+.0008)*.2)*amt*k;
      col+=uAccent*(sst(.006,0.,dc)*1.2+.001/(dc*dc*60.+.001)*.25)*amt*(.6+.4*sin(uTime*3.));
    }
  } else if(stage<1.5){
    if(abs(id-3.)<.5){
      float R=.068*(1.+uKick*.05);
      vec2 c1=L+vec2(0.,R*.98), c2=L-vec2(0.,R*.98);
      float a1=atan(p.y-c1.y,p.x-c1.x), a2=atan(p.y-c2.y,p.x-c2.x);
      float w1=sin(a1*7.+uTime*2.)*.004+sin(a1*17.-uTime*3.1)*.002;
      float w2=sin(a2*7.-uTime*2.2)*.004+sin(a2*13.+uTime*2.7)*.002;
      float r1=length(p-c1), r2=length(p-c2);
      float rim=sst(.006,0.,abs(r1-R-w1))+sst(.006,0.,abs(r2-R-w2));
      float glow=exp(-abs(r1-R)*38.)+exp(-abs(r2-R)*38.);
      vec2 uu=r1<R?((p-c1)/R*.5+.5):((p-c2)/R*.5+.5);
      float inside=step(r1,R)+step(r2,R);
      float f=sin(uModes.x*PI*uu.x)*sin(uModes.y*PI*uu.y)-sin(uModes.y*PI*uu.x)*sin(uModes.x*PI*uu.y);
      f=mix(f,sin(uModes.z*PI*uu.x)*sin(uModes.w*PI*uu.y)+sin(uModes.w*PI*uu.x)*sin(uModes.z*PI*uu.y),.5+.5*sin(uTime*.2));
      float lines=sst(.09,0.,abs(f*(1.+uKick)));
      float fl=.85+.15*h21(vec2(floor(uTime*24.),floor(a1*3.)));
      col+=uAccent*(rim*.9*k+glow*.06+lines*inside*.15*(.5+uMid))*amt*fl;
    } else if(abs(id-6.)<.5){ col+=wisps(p,0.,amt); }
  } else {
    if(abs(id-6.)<.5) col+=wisps(p,1.,amt);
  }
  return col;
}
