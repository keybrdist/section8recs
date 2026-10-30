// oEmbed (https://oembed.com) for release pages and their share addresses: WordPress, Ghost, Notion, Medium (through
// Iframely or Embedly) and others find it from the <link rel="alternate" type="application/json+oembed"> in each release
// page's head, and embed the experience itself in an iframe, on the track, start time and scene the address names.
// Discord and Slack read its author and provider for their previews.
import { shareMeta } from '../src/lib/share.mjs';
import { shareData } from '../src/lib/share-data.mjs';

// 16:9 by default; maxwidth and maxheight shrink it, keeping the shape, down to a size the controls still fit
const W = 640, H = 360, MIN_W = 320;
const json = (body, status = 200) => new Response(status === 200 ? JSON.stringify(body) : body, { status,
  headers: { 'Content-Type': status === 200 ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
const escA = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export async function onRequestGet(ctx) {
  const q = new URL(ctx.request.url).searchParams;
  if ((q.get('format') || 'json') !== 'json') return json('Only format=json is offered', 501);
  let target;
  try { target = new URL(q.get('url') || ''); } catch (e) { return json('url must be a release page address', 404); }
  const self = new URL(ctx.request.url);
  const ours = target.host === self.host || /^(www\.)?section8recs\.com$/.test(target.host);
  const cat = ours && target.pathname.match(/^\/cat\/([^/]+)$/)?.[1];
  const data = await shareData(ctx.env);
  const r = cat && data.releases[cat];
  if (!r) return json('url must be a release page address', 404);
  const m = shareMeta(data, cat, target.searchParams, self.origin);
  const page = m?.url || `${self.origin}/cat/${cat}`;
  let w = W, h = H;
  const mw = parseInt(q.get('maxwidth'), 10), mh = parseInt(q.get('maxheight'), 10);
  if (mw > 0 && mw < w) { w = Math.max(MIN_W, mw); h = Math.round(w * 9 / 16); }
  if (mh > 0 && mh < h) { h = Math.max(Math.round(MIN_W * 9 / 16), mh); w = Math.round(h * 16 / 9); }
  const title = m?.isTrack ? `${m.trackTitle} by ${m.trackArtist}` : `${r.t} by ${r.a}`;
  return json({
    version: '1.0', type: 'rich', provider_name: 'Section 8 Recordings', provider_url: `${self.origin}/`,
    title, author_name: m?.isTrack ? m.trackArtist : r.a, author_url: `${self.origin}${r.au}`,
    thumbnail_url: r.card, thumbnail_width: 1200, thumbnail_height: 630, width: w, height: h, cache_age: 86400,
    html: `<iframe src="${escA(page)}" width="${w}" height="${h}" style="border:0;max-width:100%" allow="autoplay; fullscreen; clipboard-write" allowfullscreen loading="lazy" title="${escA(title)} · Section 8 Recordings"></iframe>`,
  });
}
