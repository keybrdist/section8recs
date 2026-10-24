/* ---------------- GLSL: forest-walk template (The path and the five walks) ----------------
   a camera walking down a winding path through depth slices of trees; spectres stand between the trunks */
function walkGLSL(o){
  const n=o.n||13, gap=o.gap||'.95', fogK=o.fogK||'.075', pw=o.pathW||'.55';
  return `
float pathX(float zw){ return ${o.path||'.7*sin(zw*.13)+.35*sin(zw*.31+1.7)'}; }
vec3 scene(){
  vec2 p=SP(); float aa=PXL();
  float run=${o.run||'0.'};
  p+=vec2(sin(uTime*(.37+run*1.6))*(.012+run*.018)+uMouse.x*.03+uShake.x*run,sin(uTime*(1.7+run*3.4))*(.004+run*.012)+uMouse.y*.01+uShake.y*run);
  p=rot2(sin(uTime*.29)*.012+uShake.z*run)*p;
  vec3 fogC=fogCol(p)*${o.fogTint||'vec3(1.)'};
  vec3 col=sky(p,fogC,0.);
  col+=fogC*${o.glow||'.6'}*exp(-length((p-vec2(0.,.01))*vec2(1.,2.5))*5.);
  ${o.sky||''}
  PHEN(p,0.,col)
  float camH=${o.camH||'.55'};
  if(p.y<0.){
    float z=camH/max(-p.y,1e-4);
    float zw=z+uCamT, wx=p.x*z;
    float pd=abs(wx-pathX(zw))+.12*(vn(vec2(zw*2.,wx))-.5);
    float on=sst(${pw},${pw}*.55,pd);
    float tex=fbm3(vec2(wx*3.,zw*3.));
    vec3 g=mix(${o.gOff||'vec3(.014,.014,.016)*(.6+.8*tex)'},${o.gOn||'vec3(.065,.06,.062)*(.7+.6*tex)'},on);
    ${o.ground||''}
    col=mix(g,fogC,1.-exp(-z*${fogK}*uFog));
  }
  float dz=${o.dz||'1.6'}, base=floor(uCamT/dz), off=fract(uCamT/dz)*dz;
  // the far figure stands on the path; drawn before the trees so nearer trunks cover it
  float zf=${o.figZ||'19.'};
  float fm=spectreA(vec2(p.x*zf,p.y*zf+camH),vec2(pathX(zf+uCamT),0.),1.95,77.,aa*zf,0.);
  float fh=spectreA(vec2(p.x*zf,p.y*zf+camH),vec2(pathX(zf+uCamT),0.),1.95,77.,aa*zf,.09);
  float fv=max(uSpec*${o.figOp||'.85'},uApp*.9);
  col=mix(col,mix(vec3(0.),fogC,.3),fm*fv);
  col+=vec3(.5,.55,.65)*max(fh-fm*.7,0.)*fv*.22;
  for(int i=0;i<${n};i++){
    float fi=float(i), id=base+${n}.-fi, z=(${n}.-fi)*dz-off;
    if(z<.25) continue;
    float wx=p.x*z, wy=p.y*z+camH;
    float px=pathX(id*dz);
    float cw=${o.cw||'1.35'}, ci=floor(wx/cw), cov=0.;
    float fk=1.-exp(-z*${fogK}*uFog);
    for(int k=-2;k<=2;k++){
      float c=ci+float(k);
      float r1=h21(vec2(c,id)), r2=h21(vec2(c+7.,id)), r3=h21(vec2(c+13.,id));
      float tx=(c+.15+.7*r1)*cw;
      if(abs(tx-px)<${gap}||r3<${o.sparse||'.2'}) continue;
      cov=max(cov,treeAt(vec2(wx-tx,wy),${o.hMin||'3.'}+${o.hRange||'4.'}*r2,r3*53.+c*1.7+id*.37,aa*z,cw*2.));
    }
    vec3 tc=${o.treeCol||'vec3(.004,.004,.005)'};
    col=mix(col,mix(tc,fogC,fk),cov*sst(.25,1.1,z));
    ${o.props||''}
    ${o.specN?`if(uSpec>.01&&z>5.5&&z<15.){
      float hs=h21(vec2(id,floor(uSpecSeed)));
      if(hs<${o.specN}){
        float side=h11(id*3.1+floor(uSpecSeed))<.5?-1.:1.;
        float sx=px+side*(${gap}+.35+1.3*h11(id*5.3+floor(uSpecSeed)));
        float sh=1.85+.3*h11(id);
        float m=spectreA(vec2(wx,wy),vec2(sx,0.),sh,id,aa*z,0.);
        float hal=spectreA(vec2(wx,wy),vec2(sx,0.),sh,id,aa*z,.09);
        float op=uSpec*(.62+.3*h11(id*9.));
        col=mix(col,mix(vec3(0.),fogC,fk*.55),m*op);
        col+=mix(vec3(.5,.55,.66),uAccent,.15)*max(hal-m*.7,0.)*op*.32*(1.-fk*.5);
      }
    }`:''}
  }
  col=eyes(p*1.3,col,-.06);
  col=mix(col,fogC*1.1,${o.lowFog||'.3'}*uFog*sst(.0,-.15,p.y)*fogN(p,.03,2.));
  ${o.post||''}
  return col;
}`;
}
const WALKS={
  path:walkGLSL({}),
  deadfall:walkGLSL({ /* deadfall */
    fogK:'.08',specN:'.5',hMin:'2.6',hRange:'3.2',glow:'1.',
    gOff:'vec3(.022,.017,.013)*(.6+.8*tex)',gOn:'vec3(.06,.05,.04)*(.7+.6*tex)',
    props:`if(h21(vec2(id,3.))<.35){
      float side=h21(vec2(id,4.))<.5?-1.:1., lx=px+side*(1.3+1.6*h21(vec2(id,5.)));
      float d=sdSeg(vec2(wx,wy),vec2(lx-1.4,.1),vec2(lx+1.3,.22+.35*h21(vec2(id,6.))));
      col=mix(col,mix(tc,fogC,fk),fillD(d-.085,aa*z)*sst(.25,1.1,z));
    }`}),
  hollow:walkGLSL({ /* the hollow */
    camH:'.45',cw:'1.1',gap:'.7',hMin:'4.',hRange:'5.',sparse:'.1',fogK:'.085',lowFog:'.65',pathW:'.42',specN:'.5',glow:'1.1',
    path:'.5*sin(zw*.17)+.3*sin(zw*.41+2.)',
    gOff:'vec3(.016,.02,.017)*(.6+.8*tex)',gOn:'vec3(.06,.07,.06)*(.7+.6*tex)'}),
  burn:walkGLSL({ /* burn scar */
    specN:'.45',fogTint:'vec3(1.18,.94,.84)',treeCol:'vec3(.002,.0018,.0016)',hMin:'2.5',hRange:'4.5',sparse:'.3',
    gOff:'vec3(.034,.031,.03)*(.6+.8*tex)',gOn:'vec3(.07,.066,.064)*(.7+.6*tex)',
    ground:`vec2 ec=floor(vec2(wx*14.,zw*14.)); float ev=h21(ec);
      g+=vec3(1.,.32,.06)*step(.985,ev)*sst(.45,.15,length(fract(vec2(wx*14.,zw*14.))-.5))*(.45+.55*sin(uTime*(2.+ev*3.)+ev*40.))*(.6+uHigh*.8)*exp(-z*.22)*1.2;`,
    sky:`col+=vec3(.06,.02,.005)*sst(.25,-.02,p.y)*(.8+.4*fbm3(vec2(p.x*3.+uTime*.05,p.y*6.)));`}),
  oldroad:walkGLSL({ /* old road */
    path:'.22*sin(zw*.05)',pathW:'1.25',gap:'1.95',specN:'.45',
    gOff:'vec3(.016,.015,.017)*(.6+.8*tex)',gOn:'vec3(.05,.05,.053)*(.7+.6*tex)',
    ground:`g*=1.-.55*on*step(.93,vn(vec2(wx*6.,zw*.8)));
      g+=vec3(.09,.085,.05)*on*fillD(abs(wx-pathX(zw))-.05,.02)*step(.5,fract(zw*.35))*.45;`,
    props:`for(int s=0;s<2;s++){
      float sd=float(s)*2.-1., fx=px+sd*1.6;
      float post=fillD(abs(wx-fx)-.045,aa*z)*step(0.,wy)*step(wy,1.05-.15*h21(vec2(id,float(s))));
      col=mix(col,mix(tc,fogC,fk),post*sst(.25,1.1,z)*step(.25,h21(vec2(id,float(s)+9.))));
    }`}),
  creek:walkGLSL({ /* creek bed */
    path:'1.1*sin(zw*.11)+.4*sin(zw*.27+1.)',pathW:'.75',gap:'1.1',specN:'.45',
    gOff:'vec3(.016,.015,.016)*(.6+.8*tex)',
    gOn:'(vec3(.03)+vec3(.075,.074,.078)*sst(.42,.62,vn(vec2(wx*7.,zw*7.))))*(.7+.5*tex)',
    ground:`g+=fogC*.3*on*sst(.62,.78,vn(vec2(wx*2.,zw*.5)))*(.7+.3*sin(uTime*.8+zw));`}),
  nightvision:walkGLSL({ /* found footage: night vision */
    run:'1.',specN:'.5',fogK:'.06',lowFog:'.08',glow:'.05',fogTint:'vec3(.28)',
    treeCol:'vec3(.32,.34,.32)*exp(-z*.13)*exp(-dot(p,p)*2.2)+vec3(.002)',
    gOff:'vec3(.022)*(.6+.8*tex)*exp(-dot(p,p)*2.5)',gOn:'vec3(.04)*(.7+.6*tex)*exp(-dot(p,p)*2.5)',
    post:`col+=vec3(.025)*exp(-dot(p,p)*3.);`}),
};
