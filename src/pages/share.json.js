// What the link previews and oEmbed (functions/) need to describe a share address: every release with its tracks, and the
// scenes in the order the scene menu numbers them (read from the scene registry, site/src/v4-scenes.js).
import scenesSrc from '../../site/src/v4-scenes.js?raw';
import { artistsOf, artistUrl, cardUrl, labelOf, releases } from '../lib/catalog.mjs';

const found = [...scenesSrc.matchAll(/^ {2}SC\(\{id:'([^']+)',g:'[^']*',name:'([^']*)'/gm)];
if (found.length !== (scenesSrc.match(/^ {2}SC\(\{/gm) || []).length) throw new Error('share.json: a scene in v4-scenes.js does not start {id,g,name}');

export function GET() {
  const data = {
    ids: found.map(m => m[1]), scenes: found.map(m => m[2].replace(/\\'/g, "'")),
    releases: Object.fromEntries(releases.map(r => [r.cat, {
      t: r.title, a: r.artist, l: labelOf(r).name, y: r.date.slice(0, 4), card: cardUrl(r),
      au: artistUrl(artistsOf(r).find(a => a.role !== 'FeaturedArtist') || artistsOf(r)[0]),
      tr: r.tracks.map(t => [t.title, t.artist || r.artist]),
    }])),
  };
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
