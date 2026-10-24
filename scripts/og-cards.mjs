// Social cards: one 1200×630 JPEG per release in static/og/<CAT>-<cover ts>.jpg, the cover centred on a blurred, darkened
// copy of itself (no text). Cards are committed with the catalogue, so the site build never fetches covers. Only new or
// changed covers are fetched; cards for covers that changed or releases that left the catalogue are deleted.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { UA } from './lib/labelgrid.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIR = ROOT + 'static/og/';
const W = 1200, H = 630, ART = 560;

export const cardName = r => `${r.cat}-${r.cover_ts || '0'}.jpg`;

export async function card(cover) {
  const bg = await sharp(cover).resize(W, H, { fit: 'cover' }).blur(28).modulate({ brightness: 0.42, saturation: 0.8 }).toBuffer();
  const art = await sharp(cover).resize(ART, ART, { fit: 'cover' }).toBuffer();
  return sharp(bg).composite([{ input: art, left: (W - ART) / 2, top: (H - ART) / 2 }]).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { releases } = JSON.parse(readFileSync(ROOT + 'site/data/catalog.json', 'utf8'));
  mkdirSync(DIR, { recursive: true });
  const want = new Set(releases.map(cardName));
  let made = 0, removed = 0;
  for (const f of readdirSync(DIR)) if (f.endsWith('.jpg') && !want.has(f)) { rmSync(DIR + f); removed++; }
  for (const r of releases) {
    const out = DIR + cardName(r);
    if (existsSync(out)) continue;
    const res = await fetch(r.cover, { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.error(`og-cards: ${r.cat} cover → HTTP ${res.status}`); process.exit(1); }
    writeFileSync(out, await card(Buffer.from(await res.arrayBuffer())));
    made++;
  }
  console.log(`og-cards: ${releases.length} releases, ${made} made, ${removed} removed`);
}
