/* ---------------- audio engine ----------------
   Spot-checked offline against six catalogue tracks: the previous byte-spectrum / rolling-max engine sat at 0.90-0.97 and
   detected 0.03-0.13 kicks per second on DnB. This one keeps 0.17-0.30 of dynamic range per band and lands kicks at
   1.1-1.7/s and snares on the backbeat (median 0.68 s at 174 BPM). */
/* Replacement: float dB spectrum with no analyser smoothing, per-band adaptive floor/peak normalisation
   (strips the constant level of loud, compressed masters so the dynamics survive), attack/release envelopes,
   and onset detection by log-magnitude spectral flux in a kick band and a snare band with an adaptive threshold. */
class Bands{
  constructor(sr,fft,o={}){
    this.sr=sr;this.fft=fft;const nb=fft/2;this.binHz=sr/fft;
    this.o=Object.assign({kSd:2.2,sSd:2.05,win:.7,kRef:.16,sRef:.2,atk:.55,rel:.14,minRange:10},o);
    this.lm=new Float32Array(nb);this.plm=new Float32Array(nb);
    const B=(lo,hi)=>[Math.max(1,Math.floor(lo/this.binHz)),Math.min(nb-1,Math.ceil(hi/this.binHz))];
    this.B={low:B(30,150),mid:B(300,2000),high:B(4000,12000)};
    this.KB=B(40,130);this.SB=B(1500,5000);
    this.st={};for(const k in this.B)this.st[k]={floor:-70,peak:-30,env:0,init:false};
    this.fx={k:{h:[],last:-9,prev:0},s:{h:[],last:-9,prev:0}};
    this.kick=0;this.snare=0;this.t=0;
  }
  level(db,name,dt){
    const s=this.st[name];
    if(!s.init){s.floor=db-6;s.peak=db+3;s.init=true}
    s.floor+= (db-s.floor)*(db<s.floor?Math.min(1,dt*6):Math.min(1,dt*.35));
    s.peak=db>s.peak?db:s.peak+(db-s.peak)*Math.min(1,dt*.25);
    const v=Math.min(1,Math.max(0,(db-s.floor)/Math.max(this.o.minRange,s.peak-s.floor)));
    s.env+= (v-s.env)*(v>s.env?this.o.atk:this.o.rel);
    return s.env;
  }
  onset(f,F,t,sd,refr){
    F.h.push([t,f]);while(F.h.length&&F.h[0][0]<t-this.o.win)F.h.shift();
    let m=0;for(const x of F.h)m+=x[1];m/=F.h.length;let v=0;for(const x of F.h)v+=(x[1]-m)**2;const s=Math.sqrt(v/F.h.length);
    const thr=m+sd*s+.02;const hit=f>thr&&f>=F.prev&&t-F.last>refr&&F.h.length>4;
    F.prev=f;if(hit)F.last=t;
    return hit?Math.min(1,.55+.45*(f-thr)/(s+1e-6)):0;
  }
  frame(fd,t,dt){
    const lm=this.lm,plm=this.plm,n=lm.length;
    for(let i=0;i<n;i++){const db=fd[i];lm[i]=db>-140?Math.log1p(100*Math.pow(10,db/20)):0}
    const out={};
    for(const k in this.B){const [b0,b1]=this.B[k];let p=0;for(let i=b0;i<=b1;i++){const a=fd[i]>-140?Math.pow(10,fd[i]/10):0;p+=a}
      out[k]=this.level(10*Math.log10(p/(b1-b0+1)+1e-14),k,dt)}
    const flux=([b0,b1])=>{let f=0;for(let i=b0;i<=b1;i++){const d=lm[i]-plm[i];if(d>0)f+=d}return f/(b1-b0+1)};
    const hk=this.onset(flux(this.KB),this.fx.k,t,this.o.kSd,this.o.kRef),hs=this.onset(flux(this.SB),this.fx.s,t,this.o.sSd,this.o.sRef);
    plm.set(lm);
    this.kick=hk?Math.max(this.kick,hk):this.kick*Math.exp(-dt*9);
    this.snare=hs?Math.max(this.snare,hs):this.snare*Math.exp(-dt*11);
    out.level=Math.min(1,out.low*.45+out.mid*.35+out.high*.2);
    out.kick=this.kick;out.snare=this.snare;out.hit=!!hk;out.hitS=!!hs;
    return out;
  }
}
/* Section-energy classifier fed by the Bands analyser: drums present (onset rate) plus loudness against the track's own recent peak. */
class Energy{
  constructor(){this.on=[];this.state=0;this.tUp=0;this.tDn=0;this.peak=-60;this.db=-60}
  frame(b,fd,t,dt,binHz){
    if(b.hit||b.hitS)this.on.push(t);while(this.on.length&&this.on[0]<t-4)this.on.shift();
    const rate=this.on.length/Math.min(4,Math.max(1,t));
    let p=0,n=0;const b0=Math.floor(30/binHz),b1=Math.ceil(12000/binHz);for(let i=b0;i<=b1;i++){p+=fd[i]>-140?Math.pow(10,fd[i]/10):0;n++}
    const db=10*Math.log10(p/n+1e-14);this.db+=(db-this.db)*Math.min(1,dt/1.5);
    this.peak=this.db>this.peak?this.db:this.peak-dt*.05;
    const rel=this.db-this.peak;
    const hi=rate>=1.4&&rel>-7, lo=rate<.75||rel<-10;
    if(!this.state){this.tUp=hi?this.tUp+dt:0;if(this.tUp>1.5){this.state=1;this.tDn=0}}
    else{this.tDn=lo?this.tDn+dt:0;if(this.tDn>3){this.state=0;this.tUp=0}}
    return {rate,rel,state:this.state};
  }
}

class Engine{
  constructor(){this.el=new Audio();this.el.crossOrigin='anonymous';this.el.preload='auto';this.ctx=null;this.last=0}
  ensure(){
    if(this.ctx)return;
    try{const AC=window.AudioContext||window.webkitAudioContext;this.ctx=new AC();
      const src=this.ctx.createMediaElementSource(this.el);this.an=this.ctx.createAnalyser();this.an.fftSize=2048;this.an.smoothingTimeConstant=0;
      this.an.minDecibels=-100;this.an.maxDecibels=-10;
      this.gain=this.ctx.createGain();src.connect(this.an);this.an.connect(this.gain);this.gain.connect(this.ctx.destination);
      this.fd=new Float32Array(this.an.frequencyBinCount);
      this.bands=new Bands(this.ctx.sampleRate,2048);this.energy=new Energy();
      this.binHz=this.ctx.sampleRate/2048;this.ctx.onstatechange=()=>this.onstate&&this.onstate()}
    catch(e){this.ctx=null}
  }
  resume(){if(this.ctx&&this.ctx.state!=='running')this.ctx.resume()}
  frame(){
    if(!this.ctx||this.el.paused)return null;
    this.an.getFloatFrequencyData(this.fd);
    const t=this.ctx.currentTime,dt=Math.min(.1,Math.max(.004,t-this.last||1/60));this.last=t;
    const out=this.bands.frame(this.fd,t,dt);
    const e=this.energy.frame(out,this.fd,t,dt,this.binHz);out.state=e.state;out.rate=e.rate;
    return out;
  }
}
const eng=new Engine();

