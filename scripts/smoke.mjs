// Load a built page in headless Chromium and check the experience boots: no script errors, the forest renders,
// and entering works. Each page is loaded twice, since a reload starts from cached files. Usage: node scripts/smoke.mjs [--blocked] [--phone] <url> [<url>...]
// Most pages open on the gate and enter from it; a release page enters by itself and plays. With --blocked the page
// refuses sound outside a tap, click or key press, as Safari on iPhone does: a release page must then show its tap-to-play
// cue, and one tap on the scene must start the track with sound. --phone uses a 393×852 touch screen instead of a
// 1280×800 desktop.
// A release URL with share parameters (?track=, ?t=, ?scene=, see src/lib/share.mjs) must open on that track and scene
// and start at that time.
// A URL may end in =<status> when it should answer something else, e.g. https://…/nope=404.
// CHROME=<chromium binary> overrides the browser path.
import { chromium } from 'playwright-core';
import { shareParams } from '../src/lib/share.mjs';

const flags = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const urls = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!urls.length) { console.error('usage: smoke.mjs [--blocked] [--phone] <url>...'); process.exit(2); }
const blocked = flags.has('--blocked'), phone = flags.has('--phone');
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: blocked ? [] : ['--autoplay-policy=no-user-gesture-required'] });
const device = phone ? { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } };
// headless Chromium counts every page as already activated, so its autoplay policy cannot refuse anything; this does it
// in the page instead, the WebKit way: an element plays once it has been played inside a gesture, and an audio context
// made or resumed outside one stays suspended
const BLOCK = () => {
  let active = false;
  for (const t of ['touchend', 'click', 'mousedown', 'keydown']) addEventListener(t, e => { if (e.isTrusted) { active = true; setTimeout(() => { active = false }) } }, true);
  const ok = new WeakSet(), play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (active) ok.add(this); return ok.has(this) ? play.call(this) : Promise.reject(new DOMException('blocked', 'NotAllowedError')) };
  const AC = window.AudioContext, resume = AC.prototype.resume;
  AC.prototype.resume = function () { return active ? resume.call(this) : new Promise(() => {}) };
  window.AudioContext = class extends AC { constructor(...a) { super(...a); if (!active) this.suspend() } };
};
const started = () => document.getElementById('enterSound')?.onclick;
let failed = 0;
for (const arg of urls) {
  const [, url, want = '200'] = arg.match(/^(.*?)(?:=(\d{3}))?$/);
  const ctx = await browser.newContext(device);
  if (blocked) await ctx.addInitScript(BLOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !(want !== '200' && m.text().includes(`status of ${want}`))) errors.push(`console: ${m.text()}`); });
  page.on('requestfailed', r => { if (!/fonts\.g|\.mp3|\/cdn-cgi\//.test(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(started, null, { timeout: 30000 }).catch(() => errors.push('first load: the app never started'));
  const res = await page.reload({ waitUntil: 'load' });
  // read the gate straight away: a release page leaves it by itself once the forest is ready
  const before = await page.evaluate(() => ({ gated: document.body.classList.contains('gated'), world: !!document.querySelector('#world'),
    enter: !!document.querySelector('#enterQuiet'), title: document.title, route: JSON.parse(document.querySelector('#s8-route')?.textContent || '{}') }));
  await page.waitForFunction(started, null, { timeout: 30000 }).catch(() => errors.push('reload: the app never started'));
  const release = before.route.view === 'release' && want === '200';
  let tapped = false;
  if (release) {
    await page.waitForFunction(() => !document.body.classList.contains('gated'), null, { timeout: 15000 }).catch(() => errors.push('the release page never entered by itself'));
    if (blocked) {
      await page.waitForFunction(() => !document.getElementById('tapCue').hidden, null, { timeout: 5000 }).catch(() => errors.push('no tap-to-play cue'));
      // one tap on the scene, away from the cue and the controls
      const { width: w, height: h } = page.viewportSize(), x = w / 2, y = h * .3;
      if (phone) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
      tapped = true;
    }
    await page.waitForTimeout(2500);
  } else {
    await page.waitForTimeout(1000);
    if (before.enter) { await page.click('#enterQuiet', { timeout: 15000 }).catch(() => errors.push('the enter button never woke')); await page.waitForTimeout(2500); }
  }
  // a page that names a release starts on it: entering silently cues it without playing, a release page plays it
  const after = await page.evaluate(() => { const r = JSON.parse(document.querySelector('#s8-route')?.textContent || '{}'), b = document.body.classList;
    return { gated: b.contains('gated'), nogl: b.contains('nogl'), cued: !r.c || document.querySelector('#npT').textContent.trim() !== 'Section 8',
      playing: b.contains('playing'), sound: window.__s8.eng.ctx?.state === 'running', cue: !document.getElementById('tapCue').hidden, controlsUp: !b.contains('ui-idle'),
      info: !!document.querySelector('#release') && document.getElementById('npInfo').getAttribute('href') === `/cat/${r.c}`,
      at: { track: window.__s8.cur.i, scene: window.__s8.deck.cur.si, time: window.__s8.eng.el.currentTime, search: location.search } }; });
  // what the address asked for, read the way the link previews read it
  let share = null;
  if (release && new URL(url).search) {
    const d = await (await page.request.get(new URL('/share.json', url).href)).json(), q = new URL(url).searchParams;
    const p = shareParams(q, d.releases[before.route.c].tr.length, d.ids), a = after.at;
    share = { want: p, got: { track: a.track, scene: a.scene, time: +a.time.toFixed(1), address: a.search } };
    share.ok = a.track === (p.track ?? 0) && (p.scene == null || a.scene === p.scene) && (p.t == null || a.time >= p.t - 1) && !/[?&]t=/.test(a.search);
  }
  const ok = res.status() === +want && before.world && before.gated && !after.nogl && before.enter && !after.gated && after.cued && !errors.length
    && (!release || (after.playing && after.sound && !after.cue && after.info && (!tapped || after.controlsUp))) && (!share || share.ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${url} status=${res.status()} title=${JSON.stringify(before.title)} webgl=${!after.nogl} entered=${!after.gated} route=${JSON.stringify(before.route)} cued=${after.cued}`
    + (release ? ` playing=${after.playing} sound=${after.sound}${blocked ? ` tapped=${tapped} controls=${after.controlsUp ? 'up' : 'hidden'}` : ''} info=${after.info}` : '') + (share ? ` share=${JSON.stringify(share.got)}` : ''));
  for (const e of errors) console.log('  ' + e);
  failed += !ok;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
