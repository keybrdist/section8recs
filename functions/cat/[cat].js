// A release page reached by a share address (/cat/<CAT>?track=3&t=90&scene=15, see src/lib/share.mjs): link previews
// (X, Facebook, Discord, Slack, iMessage) never run the page's scripts, so its title and preview tags are rewritten here
// to name the track, where it starts and the scene. The canonical address stays the release page. Any other request,
// or any failure, gets the page exactly as built.
import { shareMeta } from '../../src/lib/share.mjs';
import { shareData } from '../../src/lib/share-data.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const attr = (name, value) => ({ element: el => { el.setAttribute(name, value); } });

export async function onRequestGet(ctx) {
  const res = await ctx.next();
  const u = new URL(ctx.request.url);
  if (!u.search || res.status !== 200 || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  try {
    const m = shareMeta(await shareData(ctx.env), ctx.params.cat, u.searchParams, u.origin);
    if (!m) return res;
    const oembed = `${u.origin}/oembed?url=${encodeURIComponent(m.url)}&format=json`;
    let rw = new HTMLRewriter()
      .on('meta[property="og:url"]', attr('content', m.url))
      .on('link[type="application/json+oembed"]', { element: el => { el.setAttribute('href', oembed); if (m.isTrack) el.setAttribute('title', m.title); } });
    if (m.isTrack) {
      rw = rw.on('title', { element: el => { el.setInnerContent(m.title); } })
        .on('meta[property="og:title"]', attr('content', m.title))
        .on('meta[name="description"]', attr('content', m.description))
        .on('meta[property="og:description"]', attr('content', m.description))
        .on('meta[property="og:type"]', { element: el => { el.setAttribute('content', 'music.song');
          el.after(`\n<meta property="music:album" content="${esc(`${u.origin}/cat/${ctx.params.cat}`)}">\n<meta property="music:album:track" content="${m.trackNo}">`, { html: true }); } });
    } else {
      // a release in a scene: the scene ahead of the release's own description
      const lead = { element: el => { el.setAttribute('content', `${m.description} ${el.getAttribute('content') || ''}`.trim()); } };
      rw = rw.on('meta[name="description"]', lead).on('meta[property="og:description"]', lead);
    }
    return rw.transform(res);
  } catch (e) {
    return res;
  }
}
