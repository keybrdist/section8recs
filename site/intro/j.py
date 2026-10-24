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
@media (max-height:500px) and (orientation:landscape){.f-k{display:none}.f-top{top:12px}.i-wire{height:min(40vh,300px);margin-top:0}.f-mid{padding-top:26px}.f-l{margin-top:8px}.f-c{margin-top:12px}.f-st{margin-top:8px}}
/* home page links: the gate scrolls; below the full-frame hero, the label's links sit on the forest floor */
#gate{overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}
#gate::-webkit-scrollbar{display:none}
.g-hero{position:relative;height:100vh;height:100svh;min-height:520px;overflow:hidden;isolation:isolate}
.g-cue{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;
  color:rgba(236,235,230,.5);font:500 9.5px var(--mono);letter-spacing:.32em;text-transform:uppercase;text-decoration:none;padding:6px 10px;transition:color .2s}
.g-cue:hover,.g-cue:focus-visible{color:#f1efe9;outline:0}
.g-cue i{display:block;width:1px;height:26px;background:linear-gradient(rgba(236,235,230,.6),transparent);animation:cueDrop 2.4s cubic-bezier(.6,0,.4,1) infinite;transform-origin:top}
@keyframes cueDrop{0%{transform:scaleY(0);opacity:1}55%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
#gate.scrolled .g-cue{opacity:0;pointer-events:none;transition:opacity .4s}
.g-links{position:relative;padding:clamp(26px,4vh,48px) max(var(--pad),24px) 34px;color:#f1efe9;
  background:linear-gradient(#050506,#070708 40%,#050506);border-top:1px solid rgba(236,235,230,.08)}
.g-links::before{content:"";position:absolute;left:0;right:0;top:-120px;height:120px;pointer-events:none;background:linear-gradient(transparent,#050506)}
.g-lw{max-width:1100px;margin:0 auto}
.g-lk{margin:0 0 14px;color:var(--acc);font:500 10px var(--mono);letter-spacing:.34em;text-transform:uppercase}
.g-lh{margin:0;max-width:30ch;font:300 clamp(26px,3.2vw,40px)/1.15 var(--sans);letter-spacing:.005em;color:rgba(236,235,230,.92);text-wrap:balance}
.g-lh b{font-weight:400;color:#fff}
.g-grid{list-style:none;margin:clamp(34px,5vh,54px) 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid rgba(236,235,230,.12)}
.g-grid li{border-bottom:1px solid rgba(236,235,230,.12)}
.g-grid li:not(:nth-child(3n)){border-right:1px solid rgba(236,235,230,.12)}
.g-grid a{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;padding:22px 22px 22px 4px;color:inherit;text-decoration:none;transition:background .25s,color .25s}
.g-grid li:not(:nth-child(3n+1)) a{padding-left:22px}
.g-grid a:hover,.g-grid a:focus-visible{background:rgba(236,235,230,.04);outline:0}
.g-grid .n{color:rgba(236,235,230,.35);font:500 10px var(--mono);letter-spacing:.14em}
.g-grid .t{display:block;font:600 clamp(20px,1.9vw,26px)/1 var(--cond);letter-spacing:.06em;text-transform:uppercase}
.g-grid .h{display:block;margin-top:7px;color:rgba(236,235,230,.45);font:400 10.5px var(--mono);letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g-grid .ar{width:30px;height:30px;border:1px solid rgba(236,235,230,.22);border-radius:50%;display:grid;place-items:center;color:rgba(236,235,230,.6);transition:border-color .25s,color .25s,transform .25s}
.g-grid a:hover .ar,.g-grid a:focus-visible .ar{border-color:var(--acc);color:var(--acc);transform:rotate(-45deg)}
.g-grid a:hover .t,.g-grid a:focus-visible .t{color:#fff}
.g-grid a::after{content:"";position:absolute;left:0;bottom:-1px;height:1px;width:0;background:var(--acc);transition:width .35s cubic-bezier(.2,.7,.2,1)}
.g-grid a:hover::after,.g-grid a:focus-visible::after{width:100%}
.g-ct{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:30px;align-items:end;margin-top:clamp(40px,6vh,64px)}
.g-ct p{margin:0}
.g-ct .k{color:rgba(236,235,230,.45);font:500 10px var(--mono);letter-spacing:.3em;text-transform:uppercase}
.g-mail{display:inline-block;margin-top:12px;font:300 clamp(22px,2.6vw,34px)/1.1 var(--sans);color:#f1efe9;text-decoration:none;border-bottom:1px solid rgba(236,235,230,.25);padding-bottom:4px;transition:border-color .25s,color .25s}
.g-mail:hover,.g-mail:focus-visible{border-color:var(--acc);outline:0}
.g-ad{margin-top:14px!important;color:rgba(236,235,230,.55);font:400 11px/1.7 var(--mono);letter-spacing:.06em}
.g-ad a{color:rgba(236,235,230,.8);text-decoration:none;border-bottom:1px dotted rgba(236,235,230,.35)}
.g-ad a:hover{color:#fff}
.g-top{height:46px;padding:0 24px;border-radius:999px;border:1px solid rgba(236,235,230,.4);color:#f1efe9;background:transparent;font:500 11px var(--mono);letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:background .2s,border-color .2s}
.g-top:hover,.g-top:focus-visible{border-color:#f1efe9;background:rgba(236,235,230,.08);outline:0}
.g-fb{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:clamp(44px,7vh,80px);padding-top:18px;border-top:1px solid rgba(236,235,230,.08);
  color:rgba(236,235,230,.38);font:500 9.5px var(--mono);letter-spacing:.24em;text-transform:uppercase}
.g-fb b{color:var(--acc);font-weight:500}
@media (max-width:900px){.g-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .g-grid li:not(:nth-child(3n)){border-right:0}.g-grid li:nth-child(odd){border-right:1px solid rgba(236,235,230,.12)}
  .g-grid li:not(:nth-child(3n+1)) a{padding-left:4px}.g-grid li:nth-child(even) a{padding-left:18px}}
@media (max-width:560px){.g-grid{grid-template-columns:1fr}.g-grid li:nth-child(odd){border-right:0}.g-grid li:nth-child(even) a{padding-left:4px}
  .g-grid a{padding:18px 4px}.g-ct{grid-template-columns:1fr}.g-top{justify-self:start}.g-fb{flex-direction:column;gap:8px}}
@media (max-height:640px){.g-cue{bottom:6px}.g-cue i{height:14px}}
@media (prefers-reduced-motion:reduce){.g-cue i{animation:none}}
'''
HTML='''<div id="gate" role="dialog" aria-modal="true" aria-labelledby="gT">
<div class="g-hero">
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
  <a class="g-cue" href="#links"><span>Links</span><i aria-hidden="true"></i></a>
</div>
<section class="g-links" id="links" aria-labelledby="gLinksH">
  <div class="g-lw">
    <p class="g-lk">Elsewhere · Off the path</p>
    <h2 class="g-lh" id="gLinksH">Find <b>Section 8</b> where the music lives. Releases, mixes and news.</h2>
    <ul class="g-grid">
      <li><a href="https://soundcloud.com/section8recordings" target="_blank" rel="noopener"><span class="n">01</span><span><span class="t">SoundCloud</span><span class="h">soundcloud.com/section8recordings</span></span><span class="ar" aria-hidden="true">→</span></a></li>
      <li><a href="https://section8recordings.bandcamp.com/" target="_blank" rel="noopener"><span class="n">02</span><span><span class="t">Bandcamp</span><span class="h">section8recordings.bandcamp.com</span></span><span class="ar" aria-hidden="true">→</span></a></li>
      <li><a href="https://www.youtube.com/user/Section8DNB" target="_blank" rel="noopener"><span class="n">03</span><span><span class="t">YouTube</span><span class="h">youtube.com/user/Section8DNB</span></span><span class="ar" aria-hidden="true">→</span></a></li>
      <li><a href="https://www.instagram.com/section8recs/" target="_blank" rel="noopener"><span class="n">04</span><span><span class="t">Instagram</span><span class="h">@section8recs</span></span><span class="ar" aria-hidden="true">→</span></a></li>
      <li><a href="https://twitter.com/section8recs" target="_blank" rel="noopener"><span class="n">05</span><span><span class="t">Twitter</span><span class="h">@section8recs</span></span><span class="ar" aria-hidden="true">→</span></a></li>
      <li><a href="https://www.facebook.com/section8recs" target="_blank" rel="noopener"><span class="n">06</span><span><span class="t">Facebook</span><span class="h">facebook.com/section8recs</span></span><span class="ar" aria-hidden="true">→</span></a></li>
    </ul>
    <div class="g-ct">
      <div>
        <p class="k">Inquiries, collaborations, demos</p>
        <a class="g-mail" href="mailto:team@section8recs.com">team@section8recs.com</a>
        <p class="g-ad">Section 8 Recordings · c/o Mike Shoebox · <a href="https://section8recs.com" target="_blank" rel="noopener">section8recs.com</a></p>
      </div>
      <button class="g-top" type="button" id="gTop">Back to the forest ↑</button>
    </div>
    <div class="g-fb"><span>© 2007 — 2026 Section <b>8</b> Recordings</span><span>Darkstep · Hardstep · Technoid · Jungle</span><span>Stay on the path</span></div>
  </div>
</section>
</div>
'''
SCRIPT=('<script>\n'+Path(__file__).with_name('wire-lib.js').read_text()
  +'\nmountWire(document.getElementById("wire"),{gate:document.getElementById("gate"),records:"none"});\n'
  +Path(__file__).with_name('links.js').read_text()+'</script>')
