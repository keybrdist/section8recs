/* The phone look for capture.mjs --phone: the site plays on a desktop monitor in a dark room, and the shot is a phone
   held up to it, pushing in on the scene and pulling back, as the operator filmed it (2026-10-30). The room is a page of
   its own with the site in an iframe at a desktop size (so it keeps its desktop layout and interface), under a line
   texture at the screen's pixel pitch that shows as rows close up and as moiré further out. The camera is a CSS
   transform of the whole room per output frame, so it is sub-pixel and frame-exact on the virtual clock.

   Camera moves are beats, space-separated `t@cx,cy,z[,roll]`: from t seconds the camera heads for the point (cx, cy)
   of the screen (0-1 across and down) at zoom z (1 = the screen's width fills the frame's), rolled `roll` degrees. It
   eases there like a hand (a critically damped spring, about 2 s to settle), and on top of it shakes the way the
   reference does after the phone's stabiliser: measured from the operator's footage, almost all of it under 2 Hz, about
   twice as much up and down as sideways (RMS 9 and 19 px on a 1080 px wide frame after a 0.4 s high-pass), 0.08° of
   roll and 1.6% of zoom;
   the shake here is noise fitted to those numbers, not the footage's own path. The screen also turns slowly off axis
   (a few degrees of yaw and pitch), as a hand never holds a phone square to it. */

export const BAR = 74; // the browser's tab strip and address bar, in screen pixels

export function room(sw, sh, src) {
  const vh = sh - BAR, host = new URL(src).host.replace(/^localhost(:\d+)?$/, 'section8recs.com'), path = new URL(src).pathname;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#050506}
#rig{position:absolute;left:0;top:0;transform-origin:0 0}
#wall{position:absolute;left:${-2 * sw}px;top:${-3 * sh}px;width:${5 * sw}px;height:${7 * sh}px;
  background:radial-gradient(${1.1 * sw}px ${1.6 * sh}px at 50% ${(3.5 * sh) / (7 * sh) * 100}%,#2e2b33,#17151b 45%,#09090b 75%)}
#desk{position:absolute;left:${-2 * sw}px;top:${sh + 120}px;width:${5 * sw}px;height:${3 * sh}px;
  background:linear-gradient(#1b1a1f,#0d0c0f 30%,#060607);border-top:2px solid #2a2930}
#glow{position:absolute;left:${sw * .1}px;top:${sh + 122}px;width:${sw * .8}px;height:${sh * .7}px;
  background:radial-gradient(50% 40% at 50% 0,rgba(120,125,190,.22),transparent);filter:blur(30px)}
#stand{position:absolute;left:${sw / 2 - 90}px;top:${sh + 10}px;width:180px;height:112px;background:linear-gradient(#141317,#0b0a0d)}
#mon{position:absolute;left:-26px;top:-26px;width:${sw}px;height:${sh}px;border:26px solid #0a0a0c;border-radius:14px;
  box-shadow:0 0 0 2px #1d1c21,0 0 240px 60px rgba(110,115,180,.16);background:#000;overflow:hidden}
#bar{height:${BAR}px;background:#202124;color:#c8c9cc;font:500 22px/1 -apple-system,'Segoe UI',sans-serif;position:relative}
#tab{position:absolute;left:96px;top:8px;width:380px;height:30px;padding:0 16px;line-height:30px;background:#35363a;border-radius:10px 10px 0 0}
#url{position:absolute;left:150px;right:150px;top:42px;height:26px;line-height:26px;padding:0 20px;background:#2b2c2f;border-radius:13px;font-size:18px;color:#9aa0a6}
#dots{position:absolute;left:22px;top:16px;font-size:16px;letter-spacing:6px;color:#5f6368}
iframe{display:block;border:0;width:${sw}px;height:${vh}px}
#lines{position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(to bottom,rgba(0,0,0,.2) 0 1px,transparent 1px 2px),
             repeating-linear-gradient(to right,rgba(255,40,40,.03) 0 1px,rgba(40,255,40,.03) 1px 2px,rgba(40,40,255,.03) 2px 3px)}
</style></head><body><div id="rig">
<div id="wall"></div><div id="desk"></div><div id="glow"></div><div id="stand"></div>
<div id="mon"><div id="bar"><span id="dots">●●●</span><div id="tab">Section 8 Recordings</div><div id="url">${host}${path}</div></div>
<iframe src="${src}" allow="autoplay"></iframe><div id="lines"></div></div>
</div><script>
const rig=document.getElementById('rig');
window.__pose=p=>{rig.style.transform=p.css;rig.style.filter='brightness('+p.exp.toFixed(3)+')'};
window.__size=(w,h)=>{const f=document.querySelector('iframe');f.style.width=w+'px';f.style.height=h+'px'};
// the room is rasterised once at full size, so zooming in shows the screen's pixels as a phone does
window.__pose({css:'none',exp:1});setTimeout(()=>{rig.style.willChange='transform'},200);
</script></body></html>`;
}

// a seeded random source, so a shot renders the same camera each time
function rng(seed) {let s = seed >>> 0 || 1; return () => {s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296}}

// shake: sines spread over the bands where the reference's residual motion has its power, scaled to its RMS
const BANDS = [[.2, .5, .41], [.5, 1, .43], [1, 2, .12], [2, 4, .02], [4, 8, .01], [8, 14, .01]];
function shake(r, rms) {
  const parts = BANDS.flatMap(([lo, hi, p]) => [0, 1].map(() => ({f: lo + (hi - lo) * r(), ph: 2 * Math.PI * r(), a: Math.sqrt(p / 2)})));
  const norm = rms / Math.sqrt(parts.reduce((s, q) => s + q.a * q.a / 2, 0));
  return t => norm * parts.reduce((s, q) => s + q.a * Math.sin(2 * Math.PI * q.f * t + q.ph), 0);
}

export function parseBeats(s) {
  return s.trim().split(/\s+/).map(b => {const [t, v] = b.split('@'); const [cx, cy, z, roll = 0] = v.split(',').map(Number); return {t: +t, cx, cy, z, roll}});
}

// the phone exposes for the screen, which lifts the site's dark scenes well above how they look on a monitor (the
// reference's mean luma is about 75 of 255; The plain straight from the page is about 44)
const EXP = 1.45;

/* One pose per output frame: the CSS transform of the room for a W×H frame of an sw×sh screen, and the exposure
   (the phone brightens a little more when the dark room fills more of the frame). */
export function camera(beats, {frames, fps = 30, w, h, sw, sh, seed = 8}) {
  const B = typeof beats === 'string' ? parseBeats(beats) : beats, r = rng(seed);
  // the reference's figures are after a 0.4 s high-pass, which takes about 1/1.45 of this noise's RMS away
  const hp = 1.45, sx = shake(r, hp * 9 * w / 1080), sy = shake(r, hp * 19 * w / 1080), sr = shake(r, hp * .08), sz = shake(r, hp * .016);
  const yaw = shake(r, 2.2), pitch = shake(r, 1.6);
  const keys = ['cx', 'cy', 'lz', 'roll'], at = t => B.filter(b => b.t <= t).pop() || B[0];
  const x = {cx: B[0].cx, cy: B[0].cy, lz: Math.log(B[0].z), roll: B[0].roll}, v = {cx: 0, cy: 0, lz: 0, roll: 0};
  const wn = 2.4, dt = 1 / 120, out = [];
  let exp = EXP;
  for (let f = 0, t = 0; f < frames; f++) {
    for (const tf = f / fps; t < tf; t += dt) {
      const g = at(t), tgt = {cx: g.cx, cy: g.cy, lz: Math.log(g.z), roll: g.roll};
      for (const k of keys) {v[k] += (wn * wn * (tgt[k] - x[k]) - 2 * wn * v[k]) * dt; x[k] += v[k] * dt}
    }
    const tt = f / fps, z = Math.exp(x.lz) * (1 + sz(tt)), k = z * w / sw;
    exp += ((EXP + .15 * Math.max(0, Math.min(1, (1.6 - z) / 1.2))) - exp) * (1 - Math.exp(-1.5 / fps));
    // slow off-axis turn: low bands only
    const css = `translate(${(w / 2 + sx(tt)).toFixed(2)}px,${(h / 2 + sy(tt)).toFixed(2)}px) rotate(${(x.roll + sr(tt)).toFixed(3)}deg) ` +
      `scale(${k.toFixed(5)}) perspective(${(sw * 1.4).toFixed(0)}px) rotateY(${(yaw(tt * .25)).toFixed(3)}deg) rotateX(${(pitch(tt * .25)).toFixed(3)}deg) ` +
      `translate(${(-x.cx * sw).toFixed(2)}px,${(-x.cy * sh).toFixed(2)}px)`;
    out.push({css, exp});
  }
  return out;
}
