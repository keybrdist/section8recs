// Responsive layout audit: loads the built page at phone, foldable and tablet sizes, opens each UI state, records layout
// problems and screenshots, and writes one contact sheet per state.
//
//   npm run build && npx astro preview --port 8765 &
//   node site/tests/responsive.cjs [url] [filter]
//
// CHROME=<path to a chromium binary> overrides the browser playwright-core would pick.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');

const URL = process.argv[2] || 'http://127.0.0.1:8765/';
const FILTER = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  ['phone-320 (iPhone SE 1st)', 320, 568], ['phone-360 (Galaxy S24)', 360, 780], ['phone-375 (iPhone SE 3)', 375, 667],
  ['phone-393 (iPhone 15)', 393, 659], ['phone-412 (Pixel 7)', 412, 839], ['phone-430 (iPhone Pro Max)', 430, 739],
  ['phone-land-667', 667, 375], ['phone-land-844', 844, 390],
  ['fold-cover-344 (Z Fold)', 344, 882], ['fold-open-690 (Z Fold)', 690, 829], ['flip-412 (Z Flip)', 412, 1006],
  ['fold-open-841 (Pixel Fold)', 841, 701], ['duo-540 (Surface Duo)', 540, 720],
  ['tablet-768 (iPad mini)', 768, 1024], ['tablet-800 (Android)', 800, 1280], ['tablet-820 (iPad Air)', 820, 1180],
  ['tablet-1024 (iPad Pro 12.9)', 1024, 1366], ['tablet-land-1024', 1024, 768], ['tablet-land-1180', 1180, 820],
  ['tablet-land-1366', 1366, 1024],
].filter(v => !FILTER || FILTER.test(v[0]));

const sleep = ms => new Promise(r => setTimeout(r, ms));

// runs in the page: every visible element of the interface, checked against the viewport and against each other
function audit(state) {
  const W = innerWidth, H = innerHeight, out = [];
  const vis = e => { if (!e) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    for (let p = e.parentElement; p; p = p.parentElement) { const ps = getComputedStyle(p); if (ps.display === 'none' || ps.visibility === 'hidden' || +ps.opacity < .05) return false; }
    return true };
  const name = e => e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].join('.') : '');
  const label = e => name(e) + (e.textContent.trim() ? ` "${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 28)}"` : '');
  const inScroller = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) return true; } return false };
  const clipped = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflow !== 'visible' || s.overflowX !== 'visible') { const a = e.getBoundingClientRect(), b = p.getBoundingClientRect(); if (a.right > b.right + 1 || a.left < b.left - 1 || a.bottom > b.bottom + 1 || a.top < b.top - 1) return name(p); } } return null };
  if (document.documentElement.scrollWidth > W + 1) out.push(['overflow-x', `page is ${document.documentElement.scrollWidth}px wide in a ${W}px viewport`]);
  if (document.documentElement.scrollHeight > H + 1 && getComputedStyle(document.body).overflow !== 'hidden') out.push(['overflow-y', `page scrolls: ${document.documentElement.scrollHeight}px`]);
  // closed panels slide off-screen and are marked aria-hidden; decorative overlays are aria-hidden too but still count for overlaps
  const live = e => vis(e) && !e.closest('[aria-hidden="true"],[hidden]');
  const ctl = [...document.querySelectorAll('button,a[href],input,select,[role="slider"]')].filter(live);
  for (const e of ctl) {
    const r = e.getBoundingClientRect();
    if (!inScroller(e) && (r.right > W + 2 || r.left < -2 || r.bottom > H + 2 || r.top < -2)) out.push(['offscreen', `${label(e)} at ${r.left | 0},${r.top | 0} ${r.width | 0}x${r.height | 0}`]);
    const c = clipped(e); if (c && !inScroller(e)) out.push(['clipped', `${label(e)} cut off by ${c}`]);
    // a target counts at the size it can actually be touched, including any invisible hit area (the seek bar has one)
    const hit = dy => { const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + dy); return t && (t === e || e.contains(t)) };
    if (!hit(0)) continue;   // covered by an open panel or overlay: not touchable in this state
    const tall = r.height >= 30 || (hit(-13) && hit(13));
    if (matchMedia('(pointer:coarse)').matches && (r.width < 30 || !tall) && !e.closest('.ix-l,#sList,#qList')) out.push(['small-target', `${label(e)} ${r.width | 0}x${r.height | 0}`]);
  }
  // text that is cut short without an ellipsis
  for (const e of document.querySelectorAll('h1,h2,p,button,span,b,em,label,.mono')) {
    if (!vis(e) || !e.textContent.trim() || e.children.length > 2 || e.id === 'readout') continue;   // the header readout is a ticker that clips by design
    const s = getComputedStyle(e);
    if (s.overflow !== 'visible' && s.textOverflow !== 'ellipsis' && e.scrollWidth > e.clientWidth + 2) out.push(['text-cut', `${label(e)} needs ${e.scrollWidth}px, has ${e.clientWidth}px`]);
  }
  // fixed interface groups that should never sit on top of each other
  const groups = [['header', 'header.top'], ['now-playing', '#np'], ['footer', 'footer.bot'], ['note', '#note'], ['tape', '#tape'], ['hud', '#flir .br'],
    ['side-l', '.vside.l'], ['side-r', '.vside.r'], ['gate-top', '#gate .f-top'], ['gate-content', '#gate .f-mid']]
    .map(([n, sel]) => [n, [...document.querySelectorAll(sel)].filter(vis)]).filter(g => g[1].length);
  const boxes = g => g[1].flatMap(e => { const kids = [...e.querySelectorAll('*')].filter(k => vis(k) && k.children.length === 0 && (g[0] !== 'header' || !k.closest('#readout')) && (k.textContent.trim() || k.tagName === 'CANVAS' || k.tagName === 'BUTTON'));
    return (kids.length ? kids : [e]).map(k => k.getBoundingClientRect()) });
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
    let worst = 0;
    for (const a of boxes(groups[i])) for (const b of boxes(groups[j])) { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (w > 2 && h > 2) worst = Math.max(worst, w * h) }
    if (worst > 40) out.push(['overlap', `${groups[i][0]} overlaps ${groups[j][0]} (${worst | 0}px²)`]);
  }
  // open panels must fit the screen
  for (const sel of ['#index', '#qpanel', '#srch > div', '#sceneMenu', '#ctx']) { const e = document.querySelector(sel); if (!live(e)) continue; const r = e.getBoundingClientRect();
    if (r.right > W + 1 || r.left < -1 || r.bottom > H + 1 || r.top < -1) out.push(['panel-offscreen', `${sel} at ${r.left | 0},${r.top | 0} ${r.width | 0}x${r.height | 0}`]); }
  return out.map(([k, m]) => ({ state, kind: k, msg: m }));
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const report = {}, shots = {};
  for (const [nameV, w, h] of VIEWPORTS) {
    const touch = w < 1100 || /tablet|fold|duo|flip/.test(nameV);
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: touch && w < 1100, hasTouch: touch });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const slug = nameV.split(' ')[0]; const res = report[nameV] = [];
    const snap = async (state, fn) => {
      try { if (fn) await fn(); await sleep(700);
        // panels slide in; wait until every open one has stopped moving (slow software rendering stretches transitions)
        await p.waitForFunction(() => { const r = [...document.querySelectorAll('#index.open,#qpanel.open')].map(e => e.getBoundingClientRect().left | 0).join();
          const ok = r === window.__lastPanels; window.__lastPanels = r; return ok }, null, { polling: 250, timeout: 8000 }).catch(() => {});
        res.push(...await p.evaluate(audit, state));
        const f = `${slug}--${state}.png`; await p.screenshot({ path: path.join(OUT, f) }); (shots[state] ||= []).push([nameV, f, w, h]);
      } catch (e) { res.push({ state, kind: 'error', msg: e.message.split('\n')[0] }) }
    };
    // a release page streams its track as soon as it has loaded, so the network may never go quiet there
    const settle = () => p.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await p.goto(URL, { waitUntil: 'load' }); await settle(); await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'load' }); await settle(); await sleep(1500);
    // the enter buttons wake once the forest has loaded (the gate's loading bar)
    await p.waitForFunction(() => !document.body.classList.contains('loading'), null, { polling: 250, timeout: 90000 }).catch(() => res.push({ state: 'home', kind: 'error', msg: 'still loading after 90 s' }));
    // layout, not animation: panels open instantly so they are measured where they settle
    await p.addStyleTag({ content: '#index,#qpanel{transition:none!important}' });
    // a release page has already entered by itself, and has been playing long enough that a phone may have hidden the
    // controls (the 10 s auto-hide): let the gate finish fading out, and bring the controls back with the 8, or restart
    // their 10 s with a key that does nothing else
    const entered = await p.evaluate(() => !document.body.classList.contains('gated'));
    const wake = async () => { if (await p.evaluate(() => document.body.classList.contains('ui-idle'))) { await p.tap('#sigil'); await sleep(600); } else await p.keyboard.press('Shift'); };
    if (entered) await sleep(1200);
    await snap('home');
    await snap('playing', async () => { if (!entered) await p.tap('#enterSound'); await sleep(3500); await wake(); });
    await snap('scene-menu', async () => { await wake(); await p.tap('#sceneBtn'); await sleep(300); });
    await snap('search', async () => { await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('#sBtn').click()); await sleep(200); await p.fill('#sQ', 'biobird'); });
    await snap('queue', async () => { await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('#qBtn').click()); });
    await snap('archive', async () => { await p.evaluate(() => { document.querySelector('#qClose').click(); }); await p.evaluate(() => document.querySelector('#ixBtn').click()); });
    if (errs.length) res.push(...errs.map(m => ({ state: '-', kind: 'pageerror', msg: m })));
    await ctx.close();
    console.log(`${nameV.padEnd(30)} ${res.length ? res.length + ' issue(s)' : 'clean'}`);
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  // contact sheets: every viewport side by side for each state, scaled to a common height
  const sp = await b.newPage({ viewport: { width: 2400, height: 1000 } });
  for (const [state, list] of Object.entries(shots)) {
    const cells = list.map(([n, f, w, h]) => { const H = 420, Wd = Math.round(w / h * H); return `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, f)).toString('base64')}" style="height:${H}px;width:${Wd}px"><figcaption>${n}<br>${w}×${h}</figcaption></figure>` }).join('');
    await sp.setContent(`<style>body{margin:8px;background:#222;color:#ccc;font:13px monospace;display:flex;flex-wrap:wrap;gap:10px;width:2380px}figure{margin:0}img{display:block;border:1px solid #555}</style>${cells}`);
    await sp.screenshot({ path: path.join(OUT, `sheet-${state}.png`), fullPage: true });
  }
  await b.close();
})();
