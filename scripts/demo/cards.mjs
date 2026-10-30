#!/usr/bin/env node
/* Render the title and end cards of a demo video as PNGs at the table's @size, in the site's type (Barlow Condensed
   and JetBrains Mono from Google Fonts, red accent #fe0101): intro.png with the table's @kicker, @title and @line,
   end.png, and end-nocur.png with the cursor off, which assemble.mjs alternates to make it blink.
   node scripts/demo/cards.mjs <shots.tsv> <out-dir>   CHROME=<chromium binary> overrides the browser. */
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {readTable} from './table.mjs';
const [table, out] = process.argv.slice(2);
if (!out) {console.error('usage: cards.mjs <shots.tsv> <out-dir>'); process.exit(2)}
const {set, w, h} = readTable(table);
mkdirSync(out, {recursive: true});
const dir = fileURLToPath(new URL('cards/', import.meta.url));
const browser = await chromium.launch({executablePath: process.env.CHROME || undefined});
const page = await browser.newPage({viewport: {width: w, height: h}});
for (const [name, src, nocur] of [['intro', 'intro.html'], ['end', 'end.html'], ['end-nocur', 'end.html', true]]) {
  await page.goto('file://' + dir + src);
  await page.evaluate(async ([set, nocur]) => {
    for (const el of document.querySelectorAll('[data-text]')) {const t = set[el.dataset.text]; if (t != null) el.textContent = t; if (!el.textContent) el.remove()}
    if (nocur) document.querySelector('.cur').style.visibility = 'hidden';
    await document.fonts.ready;
  }, [set, !!nocur]);
  if (!(await page.evaluate(() => [...document.fonts].some(f => f.status === 'loaded')))) console.error(`warning: ${name}: no web font loaded, the card falls back to system fonts`);
  await page.screenshot({path: `${out}/${name}.png`});
}
await browser.close();
console.log(`wrote ${out}/intro.png, end.png, end-nocur.png (${w}x${h})`);
