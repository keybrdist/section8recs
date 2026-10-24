// Build the immersive app into cacheable files for the Astro pages:
//   static/app/app.<hash>.js     the page module (release data from site/data/catalog.json inlined)
//   static/app/app.<hash>.css    the page styles
//   static/app/intro.<hash>.js   the home page's wireframe logo and link scrolling
//   src/generated/shell.json     the page head and body markup around them
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assemble } from './lib/assemble.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const APP = ROOT + 'static/app/', GEN = ROOT + 'src/generated/';

// the compact release array the experience reads (D): c catalogue, a artist, t title, d date, s styles, ar artists,
// x description (the player shows 200 characters), l label, tr [["Artist - Title", preview file]]; a track whose preview
// is not at the label's usual CDN path carries its URL as a third element
const catalog = JSON.parse(readFileSync(ROOT + 'site/data/catalog.json', 'utf8'));
const preview = (r, t) => `https://cdn-prod-1.labelgrid.com/labels/${r.label}/320/${t.file}`;
const releases = catalog.releases.map(r => ({
  c: r.cat, a: r.artist, t: r.title, d: r.date, s: r.genres, ar: r.artists.map(a => a.name),
  x: r.description.length > 200 ? r.description.slice(0, 197) + '…' : r.description, l: r.label,
  tr: r.tracks.map(t => [t.artist ? `${t.artist} - ${t.title}` : t.title, t.file, ...(t.url === preview(r, t) ? [] : [t.url])]),
}));

// the curated default queue (scenes, markers, deletions) is keyed by preview file; every key must still exist
const files = new Set(releases.flatMap(r => r.tr.map(t => t[1])));
const config = JSON.parse(readFileSync(ROOT + 'site/src/v4-queue.js', 'utf8').match(/^const DEFAULT_CONFIG=(\{.*\});$/m)[1]);
const lost = [...(config.queue || []), ...Object.keys(config.scenes || {}), ...Object.keys(config.marks || {}), ...(config.del || [])].filter(f => !files.has(f));
if (lost.length) throw new Error(`DEFAULT_CONFIG names ${lost.length} track(s) the catalogue no longer has: ${lost.slice(0, 5).join(', ')}`);

const page = assemble({ releases });

// cut one block out of the page, leaving a marker in its place
const cut = (s, open, close, mark) => {
  const a = s.indexOf(open); if (a < 0 || s.indexOf(open, a + 1) >= 0) throw new Error(`expected one ${open}`);
  const b = s.indexOf(close, a + open.length); if (b < 0) throw new Error(`unclosed ${open}`);
  return [s.slice(0, a) + mark + s.slice(b + close.length), s.slice(a + open.length, b)];
};
let s = page, css, mod, intro;
[s, css] = cut(s, '<style>', '</style>', '<!--APP_CSS-->');
[s, mod] = cut(s, '<script type="module">', '</script>', '<!--APP_JS-->');
[s, intro] = cut(s, '<script>\n', '</script>', '<!--INTRO_JS-->');

const hash = t => createHash('sha256').update(t).digest('hex').slice(0, 10);
const out = { [`app.${hash(mod)}.js`]: mod, [`app.${hash(css)}.css`]: css, [`intro.${hash(intro)}.js`]: intro };
rmSync(APP, { recursive: true, force: true }); mkdirSync(APP, { recursive: true }); mkdirSync(GEN, { recursive: true });
for (const [name, text] of Object.entries(out)) writeFileSync(APP + name, text);
const [js, cssName, introName] = Object.keys(out).map(n => '/app/' + n);

s = s.replace('<!--APP_CSS-->', `<link rel="stylesheet" href="${cssName}">`)
  .replace('<!--APP_JS-->', `<script type="module" src="${js}"></script>`)
  .replace('<!--INTRO_JS-->', `<script src="${introName}"></script>`);
// pages live at any depth (/cat/<CAT>), so the hero images are referenced from the root
s = s.replace(/(["\s])assets\//g, '$1/assets/');
const head = s.slice(s.indexOf('<head>') + 6, s.indexOf('</head>'));
const body = s.slice(s.indexOf('<body class="gated">') + 20, s.indexOf('</body>'));
writeFileSync(GEN + 'shell.json', JSON.stringify({ head, body }));
console.log(Object.entries(out).map(([n, t]) => `${n} ${t.length}`).join('\n'), `\nshell ${head.length + body.length}`);
