// Load a built page in headless Chromium and check the experience boots: no script errors, the forest renders,
// and entering from the gate works. Each page is loaded twice, since a reload starts from cached files. Usage: node scripts/smoke.mjs <url> [<url>...]
// A URL may end in =<status> when it should answer something else, e.g. https://…/nope=404.
// CHROME=<chromium binary> overrides the browser path.
import { chromium } from 'playwright-core';

const urls = process.argv.slice(2);
if (!urls.length) { console.error('usage: smoke.mjs <url>...'); process.exit(2); }
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
let failed = 0;
for (const arg of urls) {
  const [, url, want = '200'] = arg.match(/^(.*?)(?:=(\d{3}))?$/);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !(want !== '200' && m.text().includes(`status of ${want}`))) errors.push(`console: ${m.text()}`); });
  page.on('requestfailed', r => { if (!/fonts\.g|\.mp3|\/cdn-cgi\//.test(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('enterSound')?.onclick, null, { timeout: 30000 }).catch(() => errors.push('first load: the app never started'));
  const res = await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('enterSound')?.onclick, null, { timeout: 30000 }).catch(() => errors.push('reload: the app never started'));
  await page.waitForTimeout(1000);
  const before = await page.evaluate(() => ({ gated: document.body.classList.contains('gated'), nogl: document.body.classList.contains('nogl'),
    world: !!document.querySelector('#world'), enter: !!document.querySelector('#enterQuiet'), title: document.title }));
  if (before.enter) { await page.click('#enterQuiet', { timeout: 15000 }).catch(() => errors.push('the enter button never woke')); await page.waitForTimeout(2500); }
  // a page that names a release starts on it: entering silently cues it without playing
  const after = await page.evaluate(() => { const r = JSON.parse(document.querySelector('#s8-route')?.textContent || '{}');
    return { gated: document.body.classList.contains('gated'), route: r, cued: !r.c || document.querySelector('#npT').textContent.trim() !== 'Section 8' }; });
  const ok = res.status() === +want && before.world && before.gated && !before.nogl && before.enter && !after.gated && after.cued && !errors.length;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${url} status=${res.status()} title=${JSON.stringify(before.title)} webgl=${!before.nogl} entered=${!after.gated} route=${JSON.stringify(after.route)} cued=${after.cued}`);
  for (const e of errors) console.log('  ' + e);
  failed += !ok;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
