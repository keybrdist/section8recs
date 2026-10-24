// Fetch both Section 8 labels from the LabelGrid API and write the site's catalogue (site/data/catalog.json).
//
//   LABELGRID_API_TOKEN=<token> node scripts/sync.mjs [--allow-drop]
//
// Only an allowlist of public fields is written: the API's label objects also carry private settings (emails, revenue
// share) and this repository is public. Nothing is written unless every check passes, so the site keeps the last good
// catalogue. Exit codes: 0 written (or unchanged), 1 failed (nothing written), 3 written but a label lost more than
// MAX_DROP releases, which the sync workflow sends to a pull request for review instead of main.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { UA } from './lib/labelgrid.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = ROOT + 'site/data/catalog.json', TOMBS = ROOT + 'site/data/tombstones.json', OVERRIDES = ROOT + 'site/data/overrides.json';
const API = process.env.LABELGRID_API_URL || 'https://api.labelgrid.com';
const TOKEN = process.env.LABELGRID_API_TOKEN;
const LABELS = [1, 4];            // section8recs (Section 8 Recordings), section8dub (Section 8 Bass)
const MAX_DROP = 3;

// store links worth showing, and the hosts each may point to (LabelGrid data has "0" and mislabelled links)
const STORES = {
  spotify: /(^|\.)spotify\.com$/, applemusic: /(^|\.)apple\.com$/, bandcamp: /(^|\.)bandcamp\.com$/, beatport: /(^|\.)beatport\.com$/,
  deezer: /(^|\.)deezer\.com$/, tidal: /(^|\.)tidal\.com$/, amazon: /(^|\.)amazon\.[a-z.]+$/, juno: /(^|\.)junodownload\.com$/,
  soundcloud: /(^|\.)soundcloud\.com$/, youtubemusic: /^music\.youtube\.com$/, youtube: /(^|\.)(youtube\.com|youtu\.be)$/,
  pandora: /(^|\.)pandora\.com$/,
};
const SOCIAL = {
  bandcamp: STORES.bandcamp, beatport: STORES.beatport, juno: STORES.juno, soundcloud: STORES.soundcloud, spotify: STORES.spotify,
  youtube: STORES.youtube, instagram: /(^|\.)instagram\.com$/, facebook: /(^|\.)facebook\.com$/, twitter: /(^|\.)(twitter\.com|x\.com)$/,
};

const fail = msg => { console.error(`sync: ${msg}`); process.exit(1); };
const link = (url, host) => {
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return null;
  try { const u = new URL(url); return host.test(u.hostname.replace(/^www\./, '')) ? u.href : null; } catch { return null; }
};
const links = (obj, hosts) => Object.fromEntries(Object.entries(hosts).map(([k, h]) => [k, link(obj[`${k}_url`], h)]).filter(([, v]) => v));
const text = s => (s || '').replace(/\r\n?/g, '\n').trim();

async function get(path) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API + path, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json', 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (attempt < 3 && (res.status === 429 || res.status >= 500)) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
    fail(`GET ${path.split('?')[0]} → HTTP ${res.status}`);
  }
}

function release(r) {
  const cover = r.front_cover?.url || '';
  const genres = [...new Set([r.primary_genre, r.secondary_genre].map(g => g?.name).filter(Boolean))];
  return {
    id: r.id, public_id: r.public_id, cat: r.cat, label: r.label?.slug, title: text(r.title), mix_version: text(r.mix_version),
    artist: text(r.default_display_artist),
    artists: (r.artists || []).sort((a, b) => a.position - b.position)
      .map(a => ({ id: a.artist?.id, name: text(a.artist?.artist_name), role: a.artistic_role })),
    date: (r.release_date || '').slice(0, 10), genres, description: text(r.description_long),
    cover: cover.split('?')[0], cover_ts: new URL(cover || 'https://x/').searchParams.get('ts') || '',
    short_url: link(r.short_url, /^lbl\.gr$/), links: links(r, STORES),
    tracks: (r.tracks || []).sort((a, b) => a.track_num - b.track_num).map(t => ({
      id: t.id, n: t.track_num, title: text(t.default_display_title || t.title), artist: text(t.default_display_artist),
      file: decodeURIComponent((t.preview_file?.url || '').split('?')[0].split('/').pop()), url: t.preview_file?.url || '',
    })),
  };
}

if (!TOKEN) fail('LABELGRID_API_TOKEN is not set');
const owned = (await get('/api/public/labels?per_page=100')).data;
const ids = owned.map(l => l.id).sort((a, b) => a - b);
if (ids.join() !== LABELS.join()) fail(`the token sees labels ${ids}, expected ${LABELS} (a new label is a decision, not a sync)`);

const labels = [], releases = [];
for (const id of LABELS) {
  const l = owned.find(x => x.id === id);
  labels.push({ id, slug: l.slug, name: text(l.name), logo: l.image?.url || null, links: links(l, SOCIAL) });
  let page = 1, meta, got = [];
  do {
    const res = await get(`/api/public/releases?filter[label_id]=${id}&per_page=100&page=${page}`);
    meta = res.meta; got.push(...res.data); page++;
  } while (page <= meta.last_page);
  if (got.length !== meta.total) fail(`label ${l.slug}: got ${got.length} releases, API says ${meta.total}`);
  releases.push(...got.map(release));
}

// editorial fixes on top of LabelGrid's data: { "hide": [cat], "releases": { cat: { field: value } } }
const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
const shown = releases.filter(r => !(overrides.hide || []).includes(r.cat)).map(r => ({ ...r, ...(overrides.releases?.[r.cat] || {}) }));

// --- checks: any failure exits before anything is written ---
const problems = [];
const cats = new Map();
for (const r of shown) {
  if (cats.has(r.cat)) problems.push(`${r.cat}: catalogue number used twice`);
  cats.set(r.cat, r);
  if (!r.title || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !r.label) problems.push(`${r.cat}: missing title, date or label`);
  if (!r.tracks.length) problems.push(`${r.cat}: no tracks`);
  for (const t of r.tracks) if (!/^https:\/\/cdn-prod-1\.labelgrid\.com\//.test(t.url) || !t.file) problems.push(`${r.cat} #${t.n}: no preview`);
  if (!/^https:\/\/cdn-prod-1\.labelgrid\.com\//.test(r.cover)) problems.push(`${r.cat}: no cover`);
}
if (problems.length) fail(`${problems.length} problem(s):\n  ` + problems.slice(0, 30).join('\n  '));

// stable order (newest first) so a sync diff shows only what changed
shown.sort((a, b) => b.date.localeCompare(a.date) || a.cat.localeCompare(b.cat));
const catalog = { labels, releases: shown };

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { releases: [] };
const prevCats = new Set(prev.releases.map(r => r.cat));
const added = shown.filter(r => !prevCats.has(r.cat)).map(r => r.cat);
const removed = [...prevCats].filter(c => !cats.has(c));
const changed = shown.filter(r => prevCats.has(r.cat) && JSON.stringify(r) !== JSON.stringify(prev.releases.find(p => p.cat === r.cat))).map(r => r.cat);
const dropped = LABELS.map(id => labels.find(l => l.id === id).slug)
  .filter(slug => prev.releases.filter(r => r.label === slug && !cats.has(r.cat)).length > MAX_DROP);

// releases that disappear keep a tombstone, so their old URLs answer 404 rather than redirecting somewhere
const tombs = existsSync(TOMBS) ? JSON.parse(readFileSync(TOMBS, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
for (const c of removed) tombs[c] ??= today;
for (const c of cats.keys()) delete tombs[c];

writeFileSync(OUT, JSON.stringify(catalog, null, 1) + '\n');
writeFileSync(TOMBS, JSON.stringify(Object.fromEntries(Object.entries(tombs).sort()), null, 1) + '\n');
const tracks = shown.reduce((n, r) => n + r.tracks.length, 0);
const summary = `${shown.length} releases, ${tracks} tracks (${labels.map(l => `${l.slug} ${shown.filter(r => r.label === l.slug).length}`).join(', ')}); `
  + `+${added.length} −${removed.length} ~${changed.length}`;
writeFileSync(ROOT + '.sync-summary', `${summary}\n` + [['added', added], ['removed', removed], ['changed', changed]]
  .filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v.join(' ')}`).join('\n') + '\n');
console.log(`sync: ${summary}`);
if (dropped.length && !process.argv.includes('--allow-drop')) {
  console.error(`sync: ${dropped.join(', ')} lost more than ${MAX_DROP} releases; needs review`);
  process.exit(3);
}
