const MAIN='\nvoid main(){ gl_FragColor=vec4(scene(),1.); }';
const MIX_SH={uniforms:{tA:{value:null},tB:{value:null},uP:{value:1},uMode:{value:0},uTime:{value:0}},vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',fragmentShader:`
precision highp float; varying vec2 vUv; uniform sampler2D tA,tB; uniform float uP,uMode,uTime;
float hs(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float ns(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),u.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),u.x),u.y); }
float fb(vec2 p){ float v=0.,a=.5; for(int i=0;i<4;i++){ v+=a*ns(p); p*=2.1; a*=.5; } return v; }
mat2 r2(float a){ float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }
void main(){
  vec2 uv=vUv; float p=clamp(uP,0.,1.); vec3 col;
  if(p>=1.){ gl_FragColor=vec4(texture2D(tA,uv).rgb,1.); return; }
  if(uMode<.5){ col=mix(texture2D(tB,uv).rgb,texture2D(tA,uv).rgb,smoothstep(0.,1.,p)); }
  else if(uMode<1.5){ float d=fb(uv*3.+uTime*.05); float m=smoothstep(.1,.9,p);
    col=mix(texture2D(tB,uv+r2(-2.2)*vec2(d)*.35*m).rgb,texture2D(tA,uv+r2(.6)*vec2(d)*.35*(1.-m)).rgb,m); }
  else if(uMode<2.5){ float band=floor(uv.y*36.); float r=hs(vec2(band,floor(uTime*20.)));
    vec2 o=vec2((hs(vec2(band,floor(uTime*14.)))-.5)*.12*(1.-abs(p*2.-1.)),0.);
    col=r<p*1.15-.05?texture2D(tA,uv+o).rgb:texture2D(tB,uv-o).rgb;
    if(hs(vec2(band,floor(uTime*40.)))>1.-.1*(1.-abs(p*2.-1.))) col=mix(col,vec3(hs(uv*900.+uTime)),.5); }
  else { float k=exp(-abs(p-.5)*9.)*.3; vec2 z=(uv-.5)*(1.-k)+.5; col=p<.5?texture2D(tB,z).rgb:texture2D(tA,z).rgb; }
  gl_FragColor=vec4(col,1.);
}`};
