from pathlib import Path
NAME='Centre with wireframe, mark only'
FONTS='family=Barlow:wght@300'
PRELOAD='<link rel="preload" as="image" href="{slug}/forest.jpg" imagesrcset="{slug}/forest-1280.jpg 1280w, {slug}/forest.jpg 2560w" imagesizes="100vw">'
CSS=Path(__file__).with_name('ff.css').read_text()+'''
/* I · centre with wireframe: F's centred layout with the isometric wireframe logo in place of the big title; no ticker */
.f-shade{background:radial-gradient(44% 46% at 50% 44%,rgba(5,5,6,.78),rgba(5,5,6,.35) 62%,transparent),linear-gradient(rgba(5,5,6,.55),rgba(5,5,6,.15) 22%,rgba(5,5,6,.15) 72%,rgba(5,5,6,.75))}
.f-top{position:absolute;top:26px;left:0;right:0;text-align:center;margin:0;color:rgba(236,235,230,.62);font-size:10px;letter-spacing:.3em}
.f-top b{color:#f1efe9;font-weight:500}
.f-mid{position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;height:max-content;width:min(92vw,760px);text-align:center;padding-top:20px}
.i-wire{position:relative;width:100%;height:min(48vh,460px);margin:6px auto 0;-webkit-mask:radial-gradient(closest-side,#000 72%,transparent);mask:radial-gradient(closest-side,#000 72%,transparent)}
.i-wire canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.i-name{margin:2px 0 0;font:400 clamp(11px,.95vw,13px)/1 var(--mono);letter-spacing:.7em;padding-left:.7em;text-transform:uppercase;color:rgba(236,235,230,.8)}
.i-name .r{color:var(--acc)}
.f-k{margin:0;color:rgba(236,235,230,.7);font-size:10.5px;letter-spacing:.34em}
.f-l{margin:26px auto 0;max-width:35rem;text-wrap:balance;font:400 clamp(15px,1.15vw,17px)/1.65 var(--sans);color:rgba(236,235,230,.8)}
.f-c{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:30px}
.f-b{height:46px;padding:0 26px;border-radius:999px;font:500 11px var(--mono);letter-spacing:.2em;text-transform:uppercase;border:1px solid rgba(236,235,230,.4);color:#f1efe9;background:rgba(5,5,6,.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:background .2s,border-color .2s,color .2s}
.f-b:hover,.f-b:focus-visible{border-color:#f1efe9;background:rgba(236,235,230,.1);outline:0}
#enterSound{background:#f1efe9;color:#050506;border-color:#f1efe9}#enterSound:hover{background:#fff}
.f-st{margin:16px 0 0;color:rgba(236,235,230,.4);font-size:9.5px}
@media (max-width:760px){.f-top{font-size:8.5px;letter-spacing:.2em;top:18px}.i-wire{height:min(42vh,380px)}.i-name{letter-spacing:.45em;padding-left:.45em}.f-l{margin-top:18px}.f-c{margin-top:22px}}
'''
HTML='''<div id="gate" role="dialog" aria-modal="true" aria-labelledby="gT">
  <div class="ff-imgw"><img class="ff-img" src="{slug}/forest.jpg" srcset="{slug}/forest-1280.jpg 1280w, {slug}/forest.jpg 2560w" sizes="100vw" alt="Spruce forest standing in backlit fog at night" fetchpriority="high" decoding="async"></div>
  <div class="ff-shade f-shade"></div><div class="ff-grain"></div>
  <p class="f-top mono ff-fade"><b>S8</b> &nbsp;·&nbsp; Est. 2007 &nbsp;·&nbsp; The Dark Project</p>
  <div class="f-mid">
    <p class="f-k mono ff-in">Field recordings · 2007 — 2020</p>
    <div class="i-wire ff-fade"><canvas id="wire" role="img" aria-label="Section 8 logo drawn as a rotating isometric wireframe"></canvas></div>
    <h1 class="i-name ff-in ff-d1" id="gT">Section <span class="r">8</span> Recordings</h1>
    <p class="f-l ff-in ff-d2">The darkest drum &amp; bass, jungle, and breakbeat-oriented music. 139 recordings recovered. Headphones on. Stay on the path.</p>
    <div class="f-c ff-in ff-d3"><button class="f-b" id="enterSound">Enter with sound</button><button class="f-b" id="enterQuiet">Enter silently</button></div>
    <p class="f-st mono ff-in ff-d4" id="gSt">Signal acquired<span class="cursor"></span></p>
  </div>
</div>
'''
SCRIPT='<script>\n'+Path(__file__).with_name('wire-lib.js').read_text()+'\nmountWire(document.getElementById("wire"),{gate:document.getElementById("gate"),records:"none"});\n</script>'
