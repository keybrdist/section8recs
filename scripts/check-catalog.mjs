// The committed catalogue holds only public fields, one entry per catalogue number, a social card for every release,
// and the two labels the site covers.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cardName } from './lib/cards.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const text = readFileSync(ROOT + 'site/data/catalog.json', 'utf8');
const { labels, releases } = JSON.parse(text);
const problems = [];
// private LabelGrid fields that must never reach this public repository
for (const k of ['default_email', 'support_email', 'default_label_share', 'isrc_base', 'fb_pixel_id', 'barcode_number', 'delivery_status', 'review_status'])
  if (text.includes(`"${k}"`)) problems.push(`catalog.json contains "${k}"`);
if (labels.map(l => l.slug).join() !== 'section8recs,section8dub') problems.push(`labels: ${labels.map(l => l.slug)}`);
const cats = new Set();
for (const r of releases) {
  if (cats.has(r.cat)) problems.push(`${r.cat} twice`); cats.add(r.cat);
  if (!existsSync(ROOT + 'static/og/' + cardName(r))) problems.push(`${r.cat}: no social card`);
}
if (problems.length) { console.error('check-catalog:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`check-catalog: ${releases.length} releases, ${labels.length} labels, cards present, no private fields`);
