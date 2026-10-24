// Check a deployed site answers every address the way the plan says: each release, artist and index page 200, every
// old address 301 to its page, unknown and retired addresses 404, trailing slashes 308 to the clean URL.
//   node scripts/check-urls.mjs --base https://<branch>.section8recs.pages.dev
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { artists, releases } from '../src/lib/catalog.mjs';

const base = process.argv[process.argv.indexOf('--base') + 1]?.replace(/\/$/, '');
if (!base || !/^https?:\/\//.test(base)) { console.error('usage: check-urls.mjs --base <url>'); process.exit(2); }
const ROOT = fileURLToPath(new URL('../', import.meta.url));

const expect = [];   // [path, status, location?]
for (const p of ['/', '/releases', '/classic', ...releases.map(r => `/cat/${r.cat}`), ...artists.map(a => `/artist/${a.slug}`)]) expect.push([p, 200]);
for (const l of readFileSync(ROOT + 'dist/_redirects', 'utf8').split('\n')) {
  const [from, to, code] = l.split(/\s+/);
  if (from && !from.startsWith('#') && !/[:*]/.test(from) && code !== '200') expect.push([from, +code, to]);
}
const r0 = releases.find(r => r.cat === 'SECTION8116') || releases[0];
expect.push(
  [`/player/cat/${r0.cat}`, 301, `/cat/${r0.cat}`], [`/cat/${r0.cat}/thanks`, 301, `/cat/${r0.cat}`], [`/section8recs/cat/${r0.cat}`, 301, `/cat/${r0.cat}`],
  ['/r/some-release/123/thanks', 301, '/releases'],
  [`/cat/${r0.cat}/`, 308, `/cat/${r0.cat}`], [`/cat/${r0.cat}.html`, 308, `/cat/${r0.cat}`],
  ['/this-does-not-exist', 404], ['/cat/NOT-A-RELEASE', 404], ['/cat/SECTION8FREE01', 404], ['/podcast-rss', 404], ['/podcast', 404], ['/dropbox', 404],
);

const fails = [];
let i = 0;
async function worker() {
  while (i < expect.length) {
    const [path, status, to] = expect[i++];
    let res;
    for (let k = 0; k < 3; k++) {
      try { res = await fetch(base + path, { redirect: 'manual', headers: { 'User-Agent': 'section8recs-url-check/1.0' } }); break; }
      catch (e) { if (k === 2) { fails.push(`${path}: ${e.message}`); } await new Promise(r => setTimeout(r, 500)); }
    }
    if (!res) continue;
    const loc = res.headers.get('location'), got = loc ? new URL(loc, base + path).pathname : null;
    if (res.status !== status || (to && got !== to)) fails.push(`${path}: ${res.status}${got ? ' → ' + got : ''}, expected ${status}${to ? ' → ' + to : ''}`);
    await res.arrayBuffer();
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
if (fails.length) { console.error(`check-urls: ${fails.length} of ${expect.length} wrong at ${base}\n  ` + fails.slice(0, 40).join('\n  ')); process.exit(1); }
console.log(`check-urls: ${expect.length} addresses as expected at ${base}`);
