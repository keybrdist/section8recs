
/* loading bar: the gate is up at once, but the forest needs the app and three.js downloaded, the tree atlas grown and the
   first scene's shader compiled before the enter buttons work. The bar eases toward each stage's mark with a transform
   transition, which runs on the compositor and keeps moving while the main thread is busy compiling. */
/* ?timing: a load report on the page itself, for phones where there are no developer tools at hand. It times each
   stage, the WebGL calls that block (shader compile and link, texture upload) and the slowest frames, and lists them in a
   panel that can be copied. */
const T=(()=>{const on=/[?&]timing\b/.test(location.search),ev=[];const now=()=>performance.now();
  if(!on)return {mark(){}};
  const gl={n:0,ms:0,max:0,maxAt:0,before:0};let ready=0,lastF=0,gaps=[];
  for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(C)for(const m of ['compileShader','linkProgram','getProgramParameter','getShaderParameter','getProgramInfoLog','useProgram','drawArrays','drawElements','texImage2D','texSubImage2D','generateMipmap']){
    const o=C.prototype[m];C.prototype[m]=function(...a){const t=now(),r=o.apply(this,a),d=now()-t;if(d>2){gl.n++;gl.ms+=d;if(!ready)gl.before+=d;if(d>gl.max){gl.max=d;gl.maxAt=t}}return r}}
  const raf=t=>{if(lastF&&t-lastF>100)gaps.push([Math.round(lastF),Math.round(t-lastF)]);lastF=t;requestAnimationFrame(raf)};requestAnimationFrame(raf);
  const mark=(n,d)=>{const t=now();ev.push([Math.round(t),n,d==null?null:Math.round(d)]);if(n==='ready')ready=t};
  const box=document.createElement('pre');box.style.cssText='position:fixed;z-index:99;right:6px;top:6px;max-width:min(94vw,420px);max-height:70vh;overflow:auto;margin:0;padding:8px 10px;background:rgba(0,0,0,.86);color:#cfe;font:10.5px/1.45 ui-monospace,Menlo,monospace;border:1px solid #345;white-space:pre-wrap;pointer-events:auto;user-select:text;-webkit-user-select:text';
  const res=re=>{const e=performance.getEntriesByType('resource').find(x=>re.test(x.name));return e?`${Math.round(e.responseEnd)} ms (${Math.round((e.transferSize||e.encodedBodySize||0)/1024)} KB)`:'–'};
  const report=()=>{const nav=performance.getEntriesByType('navigation')[0]||{};const g=document.querySelector('canvas#world');
    const ext=(()=>{try{const c=document.createElement('canvas').getContext('webgl2');return c&&c.getExtension('KHR_parallel_shader_compile')?'yes':'no'}catch(e){return '?'}})();
    return [`S8 load timing · ${new Date().toISOString().slice(0,19)}`,navigator.userAgent.replace(/^Mozilla\/5\.0 /,''),
      `screen ${innerWidth}×${innerHeight} @${devicePixelRatio}x · parallel shader compile ${ext}`,
      `html ${Math.round(nav.responseEnd||0)} ms · dom ready ${Math.round(nav.domContentLoadedEventEnd||0)} ms`,
      `app.js ${res(/\/app\/app\.[0-9a-f]+\.js/)} · intro ${res(/\/app\/intro\./)}`,
      '— stages (ms since start, duration)',...ev.map(e=>`${String(e[0]).padStart(6)}  ${e[1]}${e[2]!=null?`  ${e[2]} ms`:''}`),
      `— WebGL blocking calls >2 ms: ${gl.n}, ${Math.round(gl.ms)} ms total, ${Math.round(gl.before)} ms before ready, longest ${Math.round(gl.max)} ms at ${Math.round(gl.maxAt)}`,
      `— frames slower than 100 ms: ${gaps.length}`,...gaps.slice(-12).map(x=>`${String(x[0]).padStart(6)}  ${x[1]} ms`)].join('\n')};
  addEventListener('DOMContentLoaded',()=>{document.body.appendChild(box);const b=document.createElement('button');b.textContent='Copy';
    b.style.cssText='position:fixed;z-index:100;right:12px;top:10px;font:inherit;color:#000;background:#cfe;border:0;padding:2px 8px';box.before(b);b.onclick=()=>navigator.clipboard?.writeText(report()).then(()=>{b.textContent='Copied'});
    const up=()=>{box.textContent=report()};up();setInterval(up,1000)});
  return {mark};
})();
window.S8T=T;
window.S8L=(()=>{
  const bar=document.getElementById('gLoad'),fill=bar&&bar.firstElementChild,st=document.getElementById('gSt');
  let at=0,over=false,slow;
  const say=t=>{if(st)st.innerHTML=t+'<span class="cursor"></span>'};
  // ease toward a mark over ms; the next stage takes over from wherever the bar has got to
  const to=(p,ms,label)=>{if(over||!fill)return;at=Math.max(at,p);fill.style.transition=`transform ${ms}ms cubic-bezier(.2,.6,.2,1)`;
    fill.style.transform=`scaleX(${at})`;bar.setAttribute('aria-valuenow',Math.round(at*100));if(label)say(label)};
  const stage=(name)=>{const s={app:[.62,9000,'Growing the tree line'],trees:[.8,7000,'Lighting the forest'],light:[.93,9000,'Lighting the forest']}[name];if(s)to(...s)};
  const done=()=>{if(over)return;to(1,350,'Signal acquired');over=true;clearTimeout(slow);
    setTimeout(()=>{document.body.classList.remove('loading');bar&&bar.setAttribute('aria-hidden','true')},380)};
  const lost=()=>{if(over)return;over=true;document.body.classList.add('load-lost');say('Signal lost · reload to try again')};
  // downloading: drift toward a third while the app and three.js arrive
  requestAnimationFrame(()=>to(.36,7000,'Tuning in'));
  slow=setTimeout(()=>{if(!over)say('Weak signal · still tuning in')},25000);
  document.querySelector('script[type="module"][src]')?.addEventListener('error',lost);
  // a release page enters by itself once the forest is ready (site/src/v4-route.js). A tap meanwhile says it will, and once
  // the app has its audio engine it opens the sound right then, inside the gesture, which iOS insists on.
  if((()=>{try{return JSON.parse(document.getElementById('s8-route').textContent).view==='release'}catch(e){return false}})()){
    document.body.classList.add('autoplay');
    const tap=e=>{if(over||e.target.closest('a,button,input,select'))return;window.S8L.unlock?.();say('Playing once the forest is ready')};
    // a touch that scrolls the page down to the release is not a tap
    let t0=null;addEventListener('touchstart',e=>{t0={x:e.touches[0].clientX,y:e.touches[0].clientY}},{capture:true,passive:true});
    addEventListener('touchend',e=>{const c=e.changedTouches[0];if(t0&&Math.hypot(c.clientX-t0.x,c.clientY-t0.y)<10)tap(e)},{capture:true,passive:true});
    addEventListener('mousedown',tap,{capture:true,passive:true})}
  return {stage:n=>{T.mark(n);stage(n)},done:()=>{T.mark('ready');done()},lost,mark:T.mark};
})();
