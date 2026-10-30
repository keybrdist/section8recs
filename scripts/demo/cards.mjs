#!/usr/bin/env node
/* Render the title and end cards of a demo video as 1920x1080 PNGs, in the site's type (Barlow Condensed and
   JetBrains Mono from Google Fonts, red accent #fe0101): intro.png, end.png, and end-nocur.png with the cursor
   off, which assemble.sh alternates to make it blink. Edit cards/intro.html and cards/end.html for the text.
   node scripts/demo/cards.mjs <out-dir>   CHROME=<chromium binary> overrides the browser. */
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const out = process.argv[2];
if (!out) {console.error('usage: cards.mjs <out-dir>'); process.exit(2)}
mkdirSync(out, {recursive: true});
const dir = fileURLToPath(new URL('cards/', import.meta.url));
const browser = await chromium.launch({executablePath: process.env.CHROME || undefined});
const page = await browser.newPage({viewport: {width: 1920, height: 1080}});
for (const [name, src, nocur] of [['intro', 'intro.html'], ['end', 'end.html'], ['end-nocur', 'end.html', true]]) {
  await page.goto('file://' + dir + src);
  await page.evaluate(async nocur => {await document.fonts.ready; if (nocur) document.querySelector('.cur').style.visibility = 'hidden'}, !!nocur);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').length);
  if (!fonts) console.error(`warning: ${name}: no web font loaded, the card falls back to system fonts`);
  await page.screenshot({path: `${out}/${name}.png`});
}
await browser.close();
console.log(`wrote ${out}/intro.png, end.png, end-nocur.png`);
