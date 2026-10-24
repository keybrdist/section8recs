// Load a built page in headless Chromium and check the experience boots: no script errors, the forest renders,
// and entering from the gate works. Usage: node scripts/smoke.mjs <url> [<url>...]
// CHROME=<chromium binary> overrides the browser path.
import { chromium } from 'playwright-core';

const urls = process.argv.slice(2);
if (!urls.length) { console.error('usage: smoke.mjs <url>...'); process.exit(2); }
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
let failed = 0;
for (const url of urls) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('requestfailed', r => { if (!/fonts\.g|\.mp3/.test(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
  const res = await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const before = await page.evaluate(() => ({ gated: document.body.classList.contains('gated'), nogl: document.body.classList.contains('nogl'),
    world: !!document.querySelector('#world'), enter: !!document.querySelector('#enterQuiet'), title: document.title }));
  if (before.enter) { await page.click('#enterQuiet'); await page.waitForTimeout(2500); }
  const after = await page.evaluate(() => ({ gated: document.body.classList.contains('gated') }));
  const ok = res.status() === 200 && before.world && before.gated && !before.nogl && before.enter && !after.gated && !errors.length;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${url} status=${res.status()} title=${JSON.stringify(before.title)} webgl=${!before.nogl} entered=${!after.gated}`);
  for (const e of errors) console.log('  ' + e);
  failed += !ok;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
