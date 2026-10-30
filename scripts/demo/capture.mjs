#!/usr/bin/env node
/* Render one shot of the live experience frame by frame, for demo videos.
   Headless Chromium renders WebGL in software here, far below real time, so the page runs on a virtual clock:
   performance.now() and requestAnimationFrame only advance when this script steps them (1/60 s per step, as on a
   60 Hz display), and the audio engine reads the spectrum of the track at the virtual time instead of the
   AnalyserNode (a Blackman-windowed 2048-point FFT in dB, as getFloatFrequencyData returns it). Every second step
   is screenshotted and piped to ffmpeg, giving a 30 fps clip in which the visuals follow the music exactly.

   node scripts/demo/capture.mjs --base http://localhost:8791 --cat SECTION8088D --t 2 --mp3 Specter.mp3 \
     --start 85 --dur 6 --out shot.mp4 [--scene Rendlesham] [--w 1920 --h 1080] [--warm 6] [--q 0.68]

   --scene pins a scene by its name in the Scene menu. The clip has no audio: assemble.sh adds it. FFMPEG=<bin> (with
   libx264) and CHROME=<chromium binary> override the tools found by default. Run one shot at a time: two
   software-GPU browsers in parallel render slower in total. See README.md in this folder. */
import {spawn, execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';

const arg = (k, d) => {const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d};
const BASE = arg('base', 'http://localhost:8791'), CAT = arg('cat'), TN = +arg('t', 1), MP3 = arg('mp3'), OUT = arg('out');
const START = +arg('start', 0), DUR = +arg('dur', 6), W = +arg('w', 1920), H = +arg('h', 1080), WARM = +arg('warm', 8);
const SCENE = arg('scene'), FPS = 30, STEP = 60, N = 2048;
let SR, pcm;
const FF = process.env.FFMPEG || 'ffmpeg', CHROME = process.env.CHROME || undefined;
if (!CAT || !MP3 || !OUT) {console.error('need --cat, --mp3 and --out'); process.exit(2)}

// mono at the context rate: the analyser down-mixes to mono as (L+R)/2, which is what -ac 1 does
function decode(sr) {
  const b = execFileSync(FF, ['-v', 'error', '-i', MP3, '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
  return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
}

// spectrum of the 2048 samples ending at time t, as AnalyserNode.getFloatFrequencyData computes it
const win = Float32Array.from({length: N}, (_, i) => .42 - .5 * Math.cos(2 * Math.PI * i / N) + .08 * Math.cos(4 * Math.PI * i / N));
const rev = new Uint32Array(N); for (let i = 0, b = Math.log2(N); i < N; i++) {let r = 0; for (let j = 0; j < b; j++) r |= ((i >> j) & 1) << (b - 1 - j); rev[i] = r}
const re = new Float64Array(N), im = new Float64Array(N);
function spectrum(t) {
  const end = Math.round(t * SR);
  for (let i = 0; i < N; i++) {const k = end - N + i; re[rev[i]] = (k >= 0 && k < pcm.length ? pcm[k] : 0) * win[i]; im[rev[i]] = 0}
  for (let s = 2; s <= N; s <<= 1) {const h = s >> 1, a = -2 * Math.PI / s;
    for (let i = 0; i < N; i += s) for (let j = 0; j < h; j++) {
      const c = Math.cos(a * j), d = Math.sin(a * j), p = i + j, q = p + h;
      const tr = re[q] * c - im[q] * d, ti = re[q] * d + im[q] * c;
      re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti}}
  const out = new Array(N / 2);
  for (let i = 0; i < N / 2; i++) out[i] = +(20 * Math.log10(Math.hypot(re[i], im[i]) / N + 1e-20)).toFixed(2);
  return out;
}

// virtual clock: rAF callbacks queue up and run only when the script steps; performance.now() follows the steps
const CLOCK = () => {
  let vt = 0, q = [];
  const pn = performance.now.bind(performance), base = pn();
  performance.now = () => vt === 0 ? pn() - base : vt;
  window.requestAnimationFrame = cb => {q.push(cb); return q.length};
  window.cancelAnimationFrame = () => {};
  window.__vstep = ms => {vt = (vt || pn() - base) + ms; const run = q; q = []; for (const cb of run) {try {cb(vt)} catch (e) {console.error(e)}}};
};

const browser = await chromium.launch({executablePath: CHROME, args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding']});
// the page boots at full size, so it picks the desktop render scale and tree atlas
const ctx = await browser.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'});
// the track plays from the local copy, so the CDN is never asked and the page never skips on a failed load
await ctx.route('**/labels/section8recs/320/*.mp3', r => r.fulfill({status: 200, body: readFileSync(MP3), headers: {'content-type': 'audio/mpeg', 'access-control-allow-origin': '*'}}));
await ctx.addInitScript(CLOCK);
const page = await ctx.newPage();
page.on('pageerror', e => console.error('pageerror', e.message));
await page.goto(`${BASE}/cat/${CAT}?t=${TN}`, {waitUntil: 'load'});
// the gate wakes once the first frame has drawn
for (let i = 0; i < 400 && !(await page.evaluate(() => !document.body.classList.contains('loading') && !!window.__s8?.R)); i++) {await page.evaluate(() => window.__vstep(16.667)); await page.waitForTimeout(20)}
// the other scenes would compile in the background while recording, which stalls a software GPU for minutes;
// the one scene in the shot compiles when it first draws
await page.evaluate(() => {window.__s8.R.precompile = () => {}});
await page.click('#enterSound');
await page.waitForFunction(() => window.__s8.eng.ctx && !window.__s8.eng.el.paused, null, {timeout: 30000});
const info = await page.evaluate(scene => {
  const s8 = window.__s8, eng = s8.eng, au = eng.el;
  // the track keeps playing (so the page stays in its playing state) but never ends or reaches an end marker
  au.loop = true; au.playbackRate = .0625;
  if (scene) {const b = [...document.querySelectorAll('#sceneMenu [data-sc]')].find(b => b.dataset.sc !== 'auto' && b.querySelector('.t').firstChild.textContent.trim().toLowerCase() === scene.toLowerCase()); if (b) s8.scene(+b.dataset.sc, true)}
  eng.frame = function () {
    this.fd.set(window.__spec); const t = window.__vtSec, dt = Math.min(.1, Math.max(.004, t - this.last || 1 / 60)); this.last = t;
    const out = this.bands.frame(this.fd, t, dt), e = this.energy.frame(out, this.fd, t, dt, this.binHz); out.state = e.state; out.rate = e.rate; return out;
  };
  // the interface goes, as on a phone after 10 s; the camcorder and FLIR read-outs belong to the scene and stay
  const st = document.createElement('style');
  st.textContent = '.top,.bot,.np>div,.note,#qtoast,#sceneMenu{opacity:0!important;visibility:hidden!important;transition:none!important}';
  document.head.append(st);
  return {sr: eng.ctx.sampleRate, scene: document.querySelector('#sceneBtn')?.textContent.trim()};
}, SCENE);
console.error(`${CAT} t=${TN} ctx ${info.sr} Hz, scene button "${info.scene}"`);
SR = info.sr; pcm = decode(SR);

const step = async (t, n = 1) => {
  for (let i = 0; i < n; i++) {
    const at = t + i / STEP;
    // reading one pixel waits for the GPU: unsynced steps pile up in a software GPU and stall the screenshots
    await page.evaluate(([s, at]) => {window.__spec = Float32Array.from(s); window.__vtSec = at; window.__vstep(1000 / 60);
      const g = window.__s8.R.renderer.getContext(); g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4))}, [spectrum(at), at]);
  }
};
// settle at a small size first (cheap), then at full size so the trails and envelopes are right when recording starts
const t0 = START - WARM;
await page.setViewportSize({width: 480, height: 270});
for (let k = 0; k < (WARM - 1.5) * STEP; k += 2) await step(t0 + k / STEP, 2);
await page.setViewportSize({width: W, height: H});
// render scale: the site's own desktop setting unless --q is given; the adaptive quality loop is held where it is
if (arg('q')) await page.evaluate(q => window.__s8.R.setQ(q), +arg('q'));
await page.evaluate(() => {window.__s8.R.setQ = () => {}});
for (let k = (WARM - 1.5) * STEP; k < WARM * STEP; k++) await step(t0 + k / STEP);

const cdp = await ctx.newCDPSession(page);
const enc = spawn(FF, ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', String(FPS), OUT], {stdio: ['pipe', 'inherit', 'inherit']});
const encoded = new Promise(r => enc.on('close', r));
enc.stdin.on('error', () => {});
encoded.then(code => {if (code) {console.error(`ffmpeg failed (exit ${code}), nothing written`); process.exit(1)}});
const frames = Math.round(DUR * FPS), T = Date.now();
for (let f = 0; f < frames; f++) {
  const a = Date.now(); await step(START + f / FPS, 2); const b = Date.now();
  const {data} = await cdp.send('Page.captureScreenshot', {format: 'jpeg', quality: 95});
  if (!enc.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => enc.stdin.once('drain', r));
  if (f % 30 === 0 || f < 3) console.error(`frame ${f}/${frames} ${((Date.now() - T) / (f + 1)).toFixed(0)} ms/frame (render ${b - a} ms, shot ${Date.now() - b} ms)`);
}
enc.stdin.end(); await encoded;
await browser.close();
console.error(`wrote ${OUT}`);
