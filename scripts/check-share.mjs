// Check a deployment's share addresses: a release page reached with ?track=, ?t= or ?scene= gets link-preview tags for
// that track (functions/cat/[cat].js), the plain page keeps its own, and oEmbed answers for release pages only
// (functions/oembed.js). Usage: node scripts/check-share.mjs --base https://section8recs.com
import { shareMeta } from '../src/lib/share.mjs';

const base = (process.argv[process.argv.indexOf('--base') + 1] || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) { console.error('usage: check-share.mjs --base <url>'); process.exit(2); }
const data = await (await fetch(`${base}/share.json`)).json();
const tag = (html, re) => html.match(re)?.[1]?.replace(/&amp;/g, '&');
const ogUrl = h => tag(h, /<meta property="og:url" content="([^"]*)"/), ogTitle = h => tag(h, /<meta property="og:title" content="([^"]*)"/);
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`); failed += !ok; };

for (const path of ['/cat/SECTION8019D?scene=2&track=2&t=90', '/cat/SECTION8116?t=3', '/cat/SECTION8116?t=1m30s', '/cat/SECTION8019D?scene=15']) {
  const u = new URL(base + path), html = await (await fetch(u)).text(), m = shareMeta(data, u.pathname.split('/')[2], u.searchParams, u.origin);
  check(ogUrl(html) === m.url && (!m.isTrack || ogTitle(html) === m.title) && html.includes('rel="canonical" href="https://section8recs.com/cat/'),
    `${path} → og:url ${ogUrl(html)} · ${ogTitle(html)}`);
}
const plain = await (await fetch(`${base}/cat/SECTION8116`)).text();
check(ogUrl(plain) === 'https://section8recs.com/cat/SECTION8116' && plain.includes('application/json+oembed'), '/cat/SECTION8116 keeps its own tags and offers oEmbed');
const oe = async q => { const r = await fetch(`${base}/oembed?${q}`); return [r.status, r.status === 200 ? await r.json() : null]; };
let [s, j] = await oe(`url=${encodeURIComponent(`${base}/cat/SECTION8019D?track=2&t=90`)}&maxwidth=480`);
check(s === 200 && j.type === 'rich' && j.width === 480 && j.height === 270 && j.html.includes('track=2&amp;t=90') && j.author_name, `oembed track → ${s} ${j?.title} ${j?.width}×${j?.height}`);
[s] = await oe(`url=${encodeURIComponent(`${base}/cat/NOPE`)}`); check(s === 404, `oembed unknown release → ${s}`);
[s] = await oe(`url=${encodeURIComponent('https://example.com/cat/SECTION8116')}`); check(s === 404, `oembed other site → ${s}`);
[s] = await oe(`url=${encodeURIComponent(`${base}/cat/SECTION8116`)}&format=xml`); check(s === 501, `oembed xml → ${s}`);
process.exit(failed ? 1 : 0);
