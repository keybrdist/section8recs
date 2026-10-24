// Check the built site (dist/): every release and artist has its page with a title, description, canonical, h1 and
// route; redirects stay within Cloudflare's limits and every target exists; nothing links to a page that isn't built.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { artists, releases } from '../src/lib/catalog.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url)), DIST = ROOT + 'dist/';
const problems = [];
const page = p => p === '/' ? 'index.html' : p.slice(1) + '.html';
const exists = p => existsSync(DIST + page(p.split(/[?#]/)[0])) || existsSync(DIST + p.slice(1).split(/[?#]/)[0]);

const pages = ['/', '/releases', ...releases.map(r => `/cat/${r.cat}`), ...artists.map(a => `/artist/${a.slug}`)];
const titles = new Map();
for (const p of pages) {
  if (!existsSync(DIST + page(p))) { problems.push(`${p}: not built`); continue; }
  const h = readFileSync(DIST + page(p), 'utf8');
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1], desc = h.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!title) problems.push(`${p}: no title`); else if (titles.has(title)) problems.push(`${p}: same title as ${titles.get(title)}`); else titles.set(title, p);
  if (!desc || desc.length < 40) problems.push(`${p}: description missing or short`);
  if (!h.includes(`<link rel="canonical" href="https://section8recs.com${p}">`)) problems.push(`${p}: canonical`);
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`${p}: ${(h.match(/<h1[\s>]/g) || []).length} h1`);
  if (!/<script type="application\/json" id="s8-route">\{"view":"[a-z]+"/.test(h)) problems.push(`${p}: no route`);
  const og = h.match(/<meta property="og:image" content="https:\/\/section8recs\.com(\/[^"]+)"/)?.[1];
  if (!og || !exists(og)) problems.push(`${p}: og:image ${og} missing`);
  for (const [, href] of h.matchAll(/href="(\/(?!\/)[^"#]*)"/g)) if (!exists(href)) problems.push(`${p}: links to ${href}, not built`);
}
if (!existsSync(DIST + '404.html')) problems.push('no 404.html (Pages would answer every unknown address with the home page)');

const rd = readFileSync(DIST + '_redirects', 'utf8').split('\n').filter(l => l && !l.startsWith('#'));
const dyn = rd.filter(l => l.split(' ')[0].includes(':') || l.includes('*'));
if (rd.length - dyn.length > 2000 || dyn.length > 100) problems.push(`_redirects: ${rd.length - dyn.length} static, ${dyn.length} dynamic`);
for (const l of rd) { const [from, to] = l.split(/\s+/); if (!to.includes(':') && !exists(to)) problems.push(`_redirects: ${from} → ${to}, not built`); if (exists(from)) problems.push(`_redirects: ${from} shadows a page`); }

if (problems.length) { console.error(`check-site: ${problems.length} problem(s)\n  ` + [...new Set(problems)].slice(0, 40).join('\n  ')); process.exit(1); }
console.log(`check-site: ${pages.length} pages, ${rd.length} redirects (${dyn.length} dynamic), 404.html present`);
