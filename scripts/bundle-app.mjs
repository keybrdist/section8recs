// Build the immersive app into cacheable files for the Astro pages:
//   static/app/app.<hash>.js     the page module (release data inlined)
//   static/app/app.<hash>.css    the page styles
//   static/app/intro.<hash>.js   the home page's wireframe logo and link scrolling
//   src/generated/shell.json     the page head and body markup around them
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assemble } from './lib/assemble.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const APP = ROOT + 'static/app/', GEN = ROOT + 'src/generated/';

const dataText = readFileSync(ROOT + 'site/data/data.json', 'utf8');
const page = assemble({ releases: JSON.parse(dataText), dataText });

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
const files = { [`app.${hash(mod)}.js`]: mod, [`app.${hash(css)}.css`]: css, [`intro.${hash(intro)}.js`]: intro };
rmSync(APP, { recursive: true, force: true }); mkdirSync(APP, { recursive: true }); mkdirSync(GEN, { recursive: true });
for (const [name, text] of Object.entries(files)) writeFileSync(APP + name, text);
const [js, cssName, introName] = Object.keys(files).map(n => '/app/' + n);

s = s.replace('<!--APP_CSS-->', `<link rel="stylesheet" href="${cssName}">`)
  .replace('<!--APP_JS-->', `<script type="module" src="${js}"></script>`)
  .replace('<!--INTRO_JS-->', `<script src="${introName}"></script>`);
// pages live at any depth (/cat/<CAT>), so the hero images are referenced from the root
s = s.replace(/(["\s])assets\//g, '$1/assets/');
const head = s.slice(s.indexOf('<head>') + 6, s.indexOf('</head>'));
const body = s.slice(s.indexOf('<body class="gated">') + 20, s.indexOf('</body>'));
writeFileSync(GEN + 'shell.json', JSON.stringify({ head, body }));
console.log(Object.entries(files).map(([n, t]) => `${n} ${t.length}`).join('\n'), `\nshell ${head.length + body.length}`);
