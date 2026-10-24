// Assemble the immersive page the way site/build.py did: shell + concatenated module parts + patched scene shaders,
// then the chosen home page (intro J) over the base gate. Returns the single-file page as it was served from public/.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as introJ from './intro-j.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC = ROOT + 'site/src/';
const rd = name => readFileSync(SRC + name, 'utf8');

const count = (s, a) => s.split(a).length - 1;
const swap = (s, a, b) => { if (count(s, a) !== 1) throw new Error(`swap: ${count(s, a)}× ${a.slice(0, 70)}`); return s.split(a).join(b); };
const at = (s, a, from = 0) => { const i = s.indexOf(a, from); if (i < 0) throw new Error(`missing: ${a.slice(0, 70)}`); return i; };
// Python's html.escape(quote=True)
export const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

// --- scenes: the older scene bodies are kept verbatim in v4-scenes-old.js and patched here ---
function sceneSource() {
  const old = rd('v4-scenes-old.js');
  const bodies = {};
  for (const m of old.matchAll(/\/\* (\d+) [^*]*\*\/`([\s\S]*?)`(?=,\n\/\*|\n\];)/g)) bodies[+m[1]] = m[2];
  const keys = Object.keys(bodies).map(Number).sort((a, b) => a - b);
  if (keys.join() !== [...Array(14).keys()].join()) throw new Error(`scene bodies: ${keys}`);

  const edit = (i, reps) => { for (const [a, b] of reps) { if (count(bodies[i], a) !== 1) throw new Error(`edit ${i}: ${a.slice(0, 70)}`); bodies[i] = bodies[i].split(a).join(b); } };
  const splice = (i, from, to, text) => { const s = bodies[i]; bodies[i] = s.slice(0, at(s, from)) + text + s.slice(at(s, to)); };

  edit(3, [
    ["float bc=treeTex(vec2(x,q.y+.62),2.3,c*3.1+fl*17.,aa*dep,6.+step(.5,r1));", "float bc=treeTex(vec2(x,q.y+.62),2.3,c*3.1+fl*17.,aa*dep,12.+floor(r1*4.99));"],
    ["col=mix(col,vec3(.3,.25,.19)*Lc*(1.5/(dep*dep*.55+.45))+vec3(.002),bc*.92*step(.42,r2));", "col=mix(col,vec3(.16,.13,.1)*Lc*(1.5/(dep*dep*.55+.45))+vec3(.002),bc*.92*step(.42,r2));"]]);
  edit(4, [
    ["  float pan=uTime*.004;\n", ""],
    ["    float x=(p.x+pan*(1.+fi*.45)+uMouse.x*.01*fi)*(1.+fi*.12)+fi*17.3+floor(uSeed);", "    float x=(p.x+uScroll*(.06+fi*.07)+uMouse.x*.01*fi)*(1.+fi*.12)+fi*17.3+floor(uSeed);"]]);
  splice(4, '      for(int j=0;j<3;j++){', '      for(int j=0;j<6;j++){', '      col=craft(p,1.,col);\n');
  edit(5, [
    ["  float pan=uTime*.003;\n", ""],
    ["    float x=(p.x+pan*(1.+fi))*(1.+fi*.3)+fi*9.7+uSeed+uMouse.x*.01*(fi+1.);", "    float x=(p.x+uScroll*(.05+fi*.08))*(1.+fi*.3)+fi*9.7+uSeed+uMouse.x*.01*(fi+1.);"]]);
  splice(6, '  for(int j=0;j<4;j++){', '  float vpx=.25;', '  col=craft(p,1.,col);\n');
  edit(7, [
    ["  float rx=p.x*70.;", "  float rx=(p.x+uScroll)*70.;"]]);
  edit(8, [
    ["  p.x+=sin(uTime*.05)*.02+uMouse.x*.02;", "  p.x+=uMouse.x*.02;"],
    ["row(vec2(p.x+3.,p.y),uSeed+1.", "row(vec2(p.x+3.+uScroll*.25,p.y),uSeed+1."],
    ["  vec2 fh=p-vec2(.32,H);", "  vec2 fh=vec2(wrapX(p.x+uScroll*.3-.32,3.4),p.y-H);"],
    ["  col=figure(p,vec2(.3,H+.062),.32,aa,uApp,col);", "  col=figure(vec2(fh.x+.32,p.y),vec2(.3,H+.062),.32,aa,uApp,col);"],
    ["    vec2 w=vec2(p.x*z,z);\n    vec2 cc=vec2(-.3,7.);\n    float rr=length(w-cc);", "    vec2 w=vec2(p.x*z+uScroll*.9,z);\n    vec2 cc=vec2(-.3,7.);\n    vec2 wc=vec2(wrapX(w.x-cc.x,14.)+cc.x,w.y);\n    float rr=length(wc-cc);"],
    ["abs(abs(w.x-cc.x)-.0)-.05)*step(rr,2.2)*step(w.y,cc.y)", "abs(abs(wc.x-cc.x)-.0)-.05)*step(rr,2.2)*step(w.y,cc.y)"],
    ["sin(atan(w.y-cc.y,w.x-cc.x)*30.+rr*6.)", "sin(atan(wc.y-cc.y,wc.x-cc.x)*30.+rr*6.)"],
    ["  float fx=p.x*40.;", "  float fx=(p.x+uScroll*1.2)*40.;"],
    ["    vec2 o=vec2((h11(fi*2.7)-.5)*1.8,-.32+.04*h11(fi));", "    vec2 o=vec2(wrapX((h11(fi*2.7)-.5)*1.8-uScroll*1.2,2.4),-.32+.04*h11(fi));"]]);
  edit(9, [
    ["  vec3 col=sky(p,fogC,H);\n  vec2 mc=", "  vec3 col=sky(p,fogC,H);\n  vec2 pl=vec2(wrapX(p.x+uScroll*.18,3.4),p.y);\n  vec2 mc="],
    ["  vec2 md=(p-mc)/vec2(.42,.13);", "  vec2 md=(pl-mc)/vec2(.42,.13);"],
    ["exp(-length((p-mc-vec2(0.,-.06))/vec2(.55,.07))", "exp(-length((pl-mc-vec2(0.,-.06))/vec2(.55,.07))"],
    ["  float tx=abs(p.x+.006*(vn(vec2(p.y*60.,1.))-.5));", "  float tx=abs(pl.x+.006*(vn(vec2(p.y*60.,1.))-.5));"],
    ["  float talus=fillD(p.y-(H+.085-abs(p.x)*.35+.02*vn(vec2(p.x*10.,5.))),aa);", "  float talus=fillD(p.y-(H+.085-abs(pl.x)*.35+.02*vn(vec2(pl.x*10.,5.))),aa);"],
    ["  float colm=.5+.5*sin(p.x*150.+vn(vec2(p.x*30.,p.y*4.))*3.);", "  float colm=.5+.5*sin(pl.x*150.+vn(vec2(pl.x*30.,p.y*4.))*3.);"]]);
  edit(11, [
    ["  float t0=upTrees(p,22.,0.,.3,.3,.48,0.,4.,aa);\n  float t1=upTrees(p,13.,1.,.46,.26,.42,0.,4.,aa);", "  float t0=upTrees(p,22.,0.,.3,.3,.48,0.,8.,aa);\n  float t1=upTrees(p,13.,1.,.46,.26,.42,0.,8.,aa);"]]);
  edit(12, [
    ["  float t0=upTrees(p,18.,0.,.34,.47,.6,0.,4.,aa);", "  float t0=upTrees(p,18.,0.,.34,.47,.6,0.,8.,aa);"]]);
  edit(13, [
    ["  float t0=upTrees(p,12.,0.,.34,.1,.3,6.,2.,aa);\n  float t1=upTrees(p,8.,1.,.5,.06,.2,6.,1.,aa);", "  float t0=upTrees(p,12.,0.,.34,.1,.3,12.,5.,aa);\n  float t1=upTrees(p,8.,1.,.5,.06,.2,12.,5.,aa);"]]);

  // old scenes are inlined as literals; newer ones (walks, scenes a/b) override them by id
  const ids = { 0: 'treeline', 3: 'effigies', 4: 'valley', 5: 'range', 6: 'plain', 7: 'lake', 8: 'field', 9: 'tower', 10: 'road', 11: 'clearing', 12: 'underneath', 13: 'deadcanopy' };
  return 'const SCENE_SRC=Object.assign({\n' + Object.entries(ids).map(([k, v]) => `${v}:\`` + bodies[k] + '`').join(',\n')
    + '\n},WALKS,SCENES_A,SCENES_B);\nconst SCENE_GLSL=SCENES.map(s=>SCENE_SRC[s.id]);\n';
}

// the module the page runs: head, scene registry, audio engine, post-processing, shared GLSL, scenes, mixer, trees,
// renderer, player, queue, markers, search, main loop
export function moduleSource() {
  const common = rd('v4-common.js') + '\nconst COMMON=COMMON_HEAD+`' + rd('v4-phen.glsl') + '`+COMMON_CRAFT;\n';
  return rd('v3-head.js') + rd('v4-scenes.js') + '\n' + rd('v4-engine.js') + '/* ---------------- shaders ---------------- */\n'
    + rd('v4-post.js') + common + rd('v4-walk.js') + rd('v4-scenes-a.js') + rd('v4-scenes-b.js') + sceneSource() + rd('v4-mix.js')
    + '\n' + rd('v4-trees.js') + '\n' + rd('v4-render.js') + '\n' + rd('v3-mid.js') + rd('v4-queue.js') + rd('v4-marks.js')
    + rd('v4-search.js') + rd('v4-loop.js') + rd('v4-route.js');
}

// releases: the client array the module reads as D; dataText: its JSON text, inlined with '</' escaped
export function assemble({ releases, dataText = JSON.stringify(releases), origin = 'https://about.section8recs.com' }) {
  const page = rd('v4-page.html');
  const i0 = at(page, '<script type="module">') + '<script type="module">'.length, i1 = at(page, '</script>', i0);
  const base = page.slice(0, i0) + '\n' + moduleSource() + '\n' + page.slice(i1);

  const slug = 'section8-intro-j';
  const rel = [...releases].sort((a, b) => (a.d < b.d) - (a.d > b.d));
  const ticker = '<span>' + rel.map(r => escapeHtml(`${r.c} · ${r.t} — ${r.a}`)).join('<i>◦</i>') + '<i>◦</i></span>';
  const v = Object.fromEntries(Object.entries(introJ).map(([k, x]) => [k, typeof x === 'string' ? x.split('{slug}').join(slug).split('{TICKER}').join(ticker) : x]));

  let s = base, a, b;
  a = at(s, '/* gate: the home page'); b = at(s, 'body.gated .chrome,body.gated .vside,body.gated .reg{');
  s = s.slice(0, a) + v.CSS + '\n' + s.slice(b);
  a = at(s, '<div id="gate" role="dialog"'); b = at(s, '</footer>\n</div>\n', a) + '</footer>\n</div>\n'.length;
  s = s.slice(0, a) + v.HTML + s.slice(b);
  a = at(s, '<link rel="preload" as="image" href="section8-about-mockup/forest.jpg"'); b = at(s, '>', a) + 1;
  s = s.slice(0, a) + v.PRELOAD + s.slice(b);
  s = swap(s, '<meta property="og:image" content="section8-about-mockup/og.jpg">', `<meta property="og:image" content="${slug}/og.jpg">`);
  s = swap(s, '<meta property="og:title" content="Section 8 Recordings · The Forest (mockup)">', `<meta property="og:title" content="Section 8 Recordings · Intro J: ${v.NAME} (mockup)">`);
  a = at(s, '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'); b = at(s, '>', a) + 1;
  s = s.slice(0, b) + `\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${v.FONTS}&display=swap">` + s.slice(b);
  s = swap(s, '</body>', v.SCRIPT + '\n</body>');
  if (s.includes('section8-about-mockup/')) throw new Error('leftover base asset path');

  // catalogue figures quoted in the page copy
  const chron = [...releases].sort((x, y) => x.d.localeCompare(y.d) || x.c.localeCompare(y.c));
  const figures = { RELEASES: releases.length, TRACKS: releases.reduce((n, r) => n + r.tr.length, 0), ARTISTS: new Set(releases.flatMap(r => r.ar)).size,
    YEARS: `${chron[0].d.slice(0, 4)} — ${chron.at(-1).d.slice(0, 4)}`, FIRST: chron[0].c, LAST: chron.at(-1).c };
  for (const [k, n] of Object.entries(figures)) s = s.split(`{${k}}`).join(String(n));

  const data = dataText.split('</').join('<\\/');
  if (count(s, '<!--CANONICAL-->') !== 1) throw new Error('canonical placeholder');
  s = s.split('<!--CANONICAL-->').join('').split('/*__DATA__*/[]').join(data);

  let live = s.split(`${slug}/`).join('assets/');
  live = swap(live, `<meta property="og:title" content="Section 8 Recordings · Intro J: ${v.NAME} (mockup)">`, '<meta property="og:title" content="Section 8 Recordings">');
  live = swap(live, '<meta property="og:image" content="assets/og.jpg">',
    `<meta property="og:image" content="${origin}/assets/og.jpg">\n<meta property="og:url" content="${origin}/">\n<link rel="canonical" href="${origin}/">`);
  if (live.split('</head>')[0].toLowerCase().includes('mockup')) throw new Error('preview wording left in the live page head');
  return live;
}
