// Build the immersive app into cacheable files for the Astro pages:
//   static/app/app.<hash>.js     the page module, bundled with the parts of three.js it uses (release data from
//                                site/data/catalog.json inlined)
//   static/app/app.<hash>.css    the page styles
//   static/app/intro.<hash>.js   the home page's wireframe logo and link scrolling
//   src/generated/shell.json     the page head and body markup around them
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';
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

// outlet links per release, fetched by the heart dialog the first time it opens
const linksText = JSON.stringify(Object.fromEntries(catalog.releases.filter(r => Object.keys(r.links).length).map(r => [r.cat, r.links])));
const linksName = `links.${createHash('sha256').update(linksText).digest('hex').slice(0, 10)}.json`;

let page = assemble({ releases });
if (!page.includes("'/*__LINKS__*/'")) throw new Error('no links placeholder in the module');
page = page.replace("'/*__LINKS__*/'", JSON.stringify('/app/' + linksName));

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

// bundle three.js (0.162, from node_modules) into the module instead of loading it from jsDelivr: no third-party
// connection to open before the forest can start, and only the parts of three.js the experience uses (the full library
// is 1.2 MB to download and parse)
const ENTRY = ROOT + 'node_modules/.cache/s8/app-entry.js';
mkdirSync(ROOT + 'node_modules/.cache/s8', { recursive: true }); writeFileSync(ENTRY, mod);
const bundle = await rolldown({ input: ENTRY, cwd: ROOT, logLevel: 'warn' });
const { output } = await bundle.generate({ format: 'esm', minify: true, codeSplitting: false,
  banner: '/*! three.js r162 | MIT License | https://github.com/mrdoob/three.js */' });
await bundle.close();
if (output.length !== 1 || /\bfrom ?["']three/.test(output[0].code)) throw new Error('three.js was not bundled into one file');
mod = output[0].code;
s = s.replace(/<script type="importmap">.*?<\/script>\n?/, '');
if (/jsdelivr/.test(s.replace(/<link rel="preconnect" href="https:\/\/cdn\.jsdelivr\.net" crossorigin>\n?/, ''))) throw new Error('jsDelivr still referenced');
s = s.replace(/<link rel="preconnect" href="https:\/\/cdn\.jsdelivr\.net" crossorigin>\n?/, '');

const hash = t => createHash('sha256').update(t).digest('hex').slice(0, 10);
const out = { [`app.${hash(mod)}.js`]: mod, [`app.${hash(css)}.css`]: css, [`intro.${hash(intro)}.js`]: intro };
rmSync(APP, { recursive: true, force: true }); mkdirSync(APP, { recursive: true }); mkdirSync(GEN, { recursive: true });
for (const [name, text] of Object.entries(out)) writeFileSync(APP + name, text);
writeFileSync(APP + linksName, linksText);
const [js, cssName, introName] = Object.keys(out).map(n => '/app/' + n);

// the module is one self-contained file now, so it can be preloaded as a module
s = s.replace('<!--APP_CSS-->', `<link rel="stylesheet" href="${cssName}">\n<link rel="modulepreload" href="${js}">`)
  .replace('<!--APP_JS-->', `<script type="module" src="${js}"></script>`)
  .replace('<!--INTRO_JS-->', `<script src="${introName}"></script>`);
// pages live at any depth (/cat/<CAT>), so the hero images are referenced from the root
s = s.replace(/(["\s])assets\//g, '$1/assets/');
// the page head minus its metadata (each page writes its own, src/components/Seo.astro), split after the viewport tag so
// charset and viewport stay first; the body split where each page renders its gate (src/components/Gate.astro)
let head = s.slice(s.indexOf('<head>') + 6, s.indexOf('</head>'));
head = head.replace(/^<(title>.*<\/title|meta name="description"[^>]*|meta property="og:[^>]*|meta name="twitter:[^>]*|link rel="canonical"[^>]*)>\n/gm, '');
if (/<title>|og:|twitter:|rel="canonical"/.test(head)) throw new Error('page metadata left in the shared head');
const vp = head.indexOf('\n', head.indexOf('<meta name="viewport"')) + 1;
const body = s.slice(s.indexOf('<body class="gated">') + 20, s.indexOf('</body>'));
const g = body.indexOf('<!--GATE-->\n');
if (g < 0) throw new Error('no gate marker in the page body');
const shell = { headTop: head.slice(0, vp), head: head.slice(vp), bodyStart: body.slice(0, g), bodyEnd: body.slice(g + 12) };
writeFileSync(GEN + 'shell.json', JSON.stringify(shell));
console.log(Object.entries(out).map(([n, t]) => `${n} ${t.length}`).join('\n'), `\nshell ${Object.values(shell).join('').length}`);
