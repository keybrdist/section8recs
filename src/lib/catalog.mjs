// The catalogue as the pages use it: releases (newest first), labels, artists with URL slugs, and the figures quoted
// in the copy. Read from site/data/catalog.json, which the daily sync writes.
import catalog from '../../site/data/catalog.json' with { type: 'json' };
import { cardName } from '../../scripts/lib/cards.mjs';

export const SITE = 'https://section8recs.com';
export const labels = catalog.labels;
export const labelOf = r => labels.find(l => l.slug === r.label);
export const releases = catalog.releases;
const chron = [...releases].sort((a, b) => a.date.localeCompare(b.date) || a.cat.localeCompare(b.cat));

export const slugify = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'artist';

// one page per artist; two LabelGrid artists with the same name keep apart by id (the later one gets -<id>)
const byId = new Map();
for (const r of releases) for (const a of r.artists) {
  if (!byId.has(a.id)) byId.set(a.id, { id: a.id, name: a.name, releases: [] });
  const e = byId.get(a.id); if (!e.releases.includes(r)) e.releases.push(r);
}
const taken = new Map();
export const artists = [...byId.values()].sort((a, b) => a.id - b.id).map(a => {
  let slug = slugify(a.name);
  if (taken.has(slug)) slug = `${slug}-${a.id}`;
  taken.set(slug, a.id);
  return { ...a, slug, releases: a.releases.sort((x, y) => y.date.localeCompare(x.date)) };
}).sort((a, b) => a.name.localeCompare(b.name));
const artistById = new Map(artists.map(a => [a.id, a]));
export const artistsOf = r => r.artists.map(a => ({ ...artistById.get(a.id), role: a.role }));

export const figures = {
  releases: releases.length, tracks: releases.reduce((n, r) => n + r.tracks.length, 0), artists: artists.length,
  years: `${chron[0].date.slice(0, 4)} — ${chron.at(-1).date.slice(0, 4)}`,
};

// neighbours in the archive's running order (oldest to newest), so every release page links onward
export const around = r => { const i = chron.indexOf(r); return { older: chron[i - 1] || null, newer: chron[i + 1] || null }; };

export const coverUrl = (r, w = 400) => `${r.cover.replace('/cdn-cgi/image/width=800/', `/cdn-cgi/image/width=${w}/`)}${r.cover_ts ? `?ts=${r.cover_ts}` : ''}`;
export const cardUrl = r => `${SITE}/og/${cardName(r)}`;
export const releaseUrl = r => `/cat/${r.cat}`;
export const artistUrl = a => `/artist/${a.slug}`;

const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const longDate = d => `${+d.slice(8, 10)} ${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;

// a description for search results and link previews: LabelGrid's text cut at a sentence, or one made from the facts
export function summary(r) {
  const flat = r.description.replace(/\s+/g, ' ').trim();
  if (flat.length >= 60) {
    if (flat.length <= 160) return flat;
    const cut = flat.slice(0, 157), end = cut.lastIndexOf('. ');
    return end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…';
  }
  const n = r.tracks.length, genres = r.genres.length ? ` of ${r.genres.join(' and ').toLowerCase()}` : '';
  return `${r.title} by ${r.artist}: ${n} track${n > 1 ? 's' : ''}${genres}, released ${longDate(r.date)} on ${labelOf(r).name} [${r.cat}].`;
}

export const STORE_NAMES = { spotify: 'Spotify', applemusic: 'Apple Music', bandcamp: 'Bandcamp', beatport: 'Beatport', deezer: 'Deezer',
  tidal: 'Tidal', amazon: 'Amazon', juno: 'Juno', soundcloud: 'SoundCloud', youtubemusic: 'YouTube Music', youtube: 'YouTube', pandora: 'Pandora' };
