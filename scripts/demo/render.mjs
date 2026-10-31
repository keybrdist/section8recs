#!/usr/bin/env node
/* Render every shot in a shot table into <work-dir>/shots/<name>.mp4, one at a time, skipping shots already rendered
   (delete one to render it again). Fetches the tracks from the label CDN into <work-dir>/mp3 first.
   node scripts/demo/render.mjs <shots.tsv> <work-dir> [--gpu]
   Needs the site served locally (npm run build && npx astro preview --port 8791; BASE overrides the address).
   GPU=1 is --gpu. W and H override the table's @size, for quick looks; shots run 0.2 s past their length. */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, renameSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readTable} from './table.mjs';

const [table, work] = process.argv.slice(2);
if (!work) {console.error('usage: render.mjs <shots.tsv> <work-dir> [--gpu]'); process.exit(2)}
const T = readTable(table), gpu = process.argv.includes('--gpu') || !!process.env.GPU;
const capture = fileURLToPath(new URL('capture.mjs', import.meta.url));
mkdirSync(`${work}/mp3`, {recursive: true}); mkdirSync(`${work}/shots`, {recursive: true});
for (const r of T.rows) {
  const mp3 = `${work}/mp3/${r.file}`;
  if (!existsSync(mp3)) {
    // the CDN answers 403 to some default user agents
    const res = await fetch(`https://cdn-prod-1.labelgrid.com/labels/section8recs/320/${r.file}`, {headers: {'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'}});
    if (!res.ok) {console.error(`${r.file}: ${res.status} from the CDN`); process.exit(1)}
    writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  }
  const shot = `${work}/shots/${r.name}.mp4`;
  if (existsSync(shot)) {console.log(`${r.name}: already rendered`); continue}
  const res = spawnSync(process.execPath, [capture, '--base', process.env.BASE || 'http://localhost:8791', '--cat', r.cat, '--t', String(r.track), '--mp3', mp3,
    '--start', String(r.start), '--warm', String(r.warm), '--scene', r.scene, '--dur', process.env.DUR || (r.len + .2).toFixed(2),
    '--w', process.env.W || String(T.w), '--h', process.env.H || String(T.h), ...(gpu ? ['--gpu'] : []),
    ...(r.phone ? ['--phone', r.phone, '--screen', T.set.screen || '3440x1440'] : []), '--out', `${work}/shots/${r.name}.part.mp4`], {stdio: 'inherit'});
  if (res.status !== 0) {console.error(`${r.name}: capture failed`); process.exit(1)}
  renameSync(`${work}/shots/${r.name}.part.mp4`, shot);
  console.log(`${r.name}: rendered ${new Date().toTimeString().slice(0, 8)}`);
}
