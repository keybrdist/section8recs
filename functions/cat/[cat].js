// A release page reached by a share address (/cat/<CAT>?track=3&t=90&scene=15, see src/lib/share.mjs): link previews
// (X, Facebook, Discord, Slack, iMessage) never run the page's scripts, so its title and preview tags are rewritten here
// to name the track, where it starts and the scene, and X's player card plays that address. The canonical address stays
// the release page. Any other request, or any failure, gets the page exactly as built.
// On a preview (*.pages.dev), ?xcard=landscape (480×270) or ?xcard=wide (480×252, the release card's shape) declares
// another player shape with the release card as its image, so shapes can be compared on X before deploying.
import { shareMeta } from '../../src/lib/share.mjs';
import { shareData } from '../../src/lib/share-data.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const attr = (name, value) => ({ element: el => { el.setAttribute(name, value); } });
const XCARD = { landscape: [480, 270], wide: [480, 252] };

export async function onRequestGet(ctx) {
  const res = await ctx.next();
  const u = new URL(ctx.request.url);
  if (!u.search || res.status !== 200 || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  try {
    const data = await shareData(ctx.env), m = shareMeta(data, ctx.params.cat, u.searchParams, u.origin);
    const xc = u.hostname.endsWith('.pages.dev') && data.releases[ctx.params.cat] && XCARD[u.searchParams.get('xcard')];
    let rw = new HTMLRewriter();
    if (xc) rw = rw.on('meta[name="twitter:player:width"]', attr('content', String(xc[0]))).on('meta[name="twitter:player:height"]', attr('content', String(xc[1])))
      .on('meta[name="twitter:image"]', attr('content', data.releases[ctx.params.cat].card));
    if (!m) return xc ? rw.transform(res) : res;
    const oembed = `${u.origin}/oembed?url=${encodeURIComponent(m.url)}&format=json`;
    rw = rw.on('meta[property="og:url"]', attr('content', m.url)).on('meta[name="twitter:player"]', attr('content', m.url))
      .on('link[type="application/json+oembed"]', { element: el => { el.setAttribute('href', oembed); if (m.isTrack) el.setAttribute('title', m.title); } });
    if (m.isTrack) {
      rw = rw.on('title', { element: el => { el.setInnerContent(m.title); } })
        .on('meta[property="og:title"]', attr('content', m.title)).on('meta[name="twitter:title"]', attr('content', m.title))
        .on('meta[name="description"]', attr('content', m.description))
        .on('meta[property="og:description"]', attr('content', m.description)).on('meta[name="twitter:description"]', attr('content', m.description))
        .on('meta[property="og:type"]', { element: el => { el.setAttribute('content', 'music.song');
          el.after(`\n<meta property="music:album" content="${esc(`${u.origin}/cat/${ctx.params.cat}`)}">\n<meta property="music:album:track" content="${m.trackNo}">`, { html: true }); } });
    } else {
      // a release in a scene: the scene ahead of the release's own description
      const lead = { element: el => { el.setAttribute('content', `${m.description} ${el.getAttribute('content') || ''}`.trim()); } };
      rw = rw.on('meta[name="description"]', lead).on('meta[property="og:description"]', lead).on('meta[name="twitter:description"]', lead);
    }
    return rw.transform(res);
  } catch (e) {
    return res;
  }
}
