#!/usr/bin/env python3
"""Build the Section 8 site into site/dist/.

  dist/section8-about-mockup.html   the experience with the original full-frame intro
  dist/section8-intro-j.html        the same experience behind the chosen home page (centred wireframe logo)
  dist/index.html                   redirects to the J page

Both pages are single self-contained HTML files (release data inlined); each reads its images from a sibling folder of
the same name. With S8_CANONICAL=1, site/canonical.json (kept out of git) maps an output name to a <link rel="canonical"> URL.
"""
import json, os, re, runpy, shutil, html as _h
from pathlib import Path

S = Path(__file__).resolve().parent
SRC, DIST = S / 'src', S / 'dist'
rd = lambda name: (SRC / name).read_text()

# --- scenes: the older scene bodies are kept verbatim in v4-scenes-old.js and patched here ---
old = rd('v4-scenes-old.js')
bodies = {int(m.group(1)): m.group(2) for m in re.finditer(r'/\* (\d+) [^*]*\*/`(.*?)`(?=,\n/\*|\n\];)', old, re.S)}
assert sorted(bodies) == list(range(14)), sorted(bodies)

def edit(i, reps):
    s = bodies[i]
    for a, b in reps:
        assert s.count(a) == 1, (i, a[:70], s.count(a)); s = s.replace(a, b)
    bodies[i] = s

edit(3, [("float bc=treeTex(vec2(x,q.y+.62),2.3,c*3.1+fl*17.,aa*dep,6.+step(.5,r1));", "float bc=treeTex(vec2(x,q.y+.62),2.3,c*3.1+fl*17.,aa*dep,12.+floor(r1*4.99));"),
         ("col=mix(col,vec3(.3,.25,.19)*Lc*(1.5/(dep*dep*.55+.45))+vec3(.002),bc*.92*step(.42,r2));", "col=mix(col,vec3(.16,.13,.1)*Lc*(1.5/(dep*dep*.55+.45))+vec3(.002),bc*.92*step(.42,r2));")])
edit(4, [("  float pan=uTime*.004;\n", ""),
         ("    float x=(p.x+pan*(1.+fi*.45)+uMouse.x*.01*fi)*(1.+fi*.12)+fi*17.3+floor(uSeed);", "    float x=(p.x+uScroll*(.06+fi*.07)+uMouse.x*.01*fi)*(1.+fi*.12)+fi*17.3+floor(uSeed);")])
s = bodies[4]; a0 = s.index('      for(int j=0;j<3;j++){'); a1 = s.index('      for(int j=0;j<6;j++){')
bodies[4] = s[:a0] + '      col=craft(p,1.,col);\n' + s[a1:]
edit(5, [("  float pan=uTime*.003;\n", ""), ("    float x=(p.x+pan*(1.+fi))*(1.+fi*.3)+fi*9.7+uSeed+uMouse.x*.01*(fi+1.);", "    float x=(p.x+uScroll*(.05+fi*.08))*(1.+fi*.3)+fi*9.7+uSeed+uMouse.x*.01*(fi+1.);")])
s = bodies[6]; a0 = s.index('  for(int j=0;j<4;j++){'); a1 = s.index('  float vpx=.25;')
bodies[6] = s[:a0] + '  col=craft(p,1.,col);\n' + s[a1:]
edit(7, [("  float rx=p.x*70.;", "  float rx=(p.x+uScroll)*70.;")])
edit(8, [("  p.x+=sin(uTime*.05)*.02+uMouse.x*.02;", "  p.x+=uMouse.x*.02;"),
         ("row(vec2(p.x+3.,p.y),uSeed+1.", "row(vec2(p.x+3.+uScroll*.25,p.y),uSeed+1."),
         ("  vec2 fh=p-vec2(.32,H);", "  vec2 fh=vec2(wrapX(p.x+uScroll*.3-.32,3.4),p.y-H);"),
         ("  col=figure(p,vec2(.3,H+.062),.32,aa,uApp,col);", "  col=figure(vec2(fh.x+.32,p.y),vec2(.3,H+.062),.32,aa,uApp,col);"),
         ("    vec2 w=vec2(p.x*z,z);\n    vec2 cc=vec2(-.3,7.);\n    float rr=length(w-cc);",
          "    vec2 w=vec2(p.x*z+uScroll*.9,z);\n    vec2 cc=vec2(-.3,7.);\n    vec2 wc=vec2(wrapX(w.x-cc.x,14.)+cc.x,w.y);\n    float rr=length(wc-cc);"),
         ("abs(abs(w.x-cc.x)-.0)-.05)*step(rr,2.2)*step(w.y,cc.y)", "abs(abs(wc.x-cc.x)-.0)-.05)*step(rr,2.2)*step(w.y,cc.y)"),
         ("sin(atan(w.y-cc.y,w.x-cc.x)*30.+rr*6.)", "sin(atan(wc.y-cc.y,wc.x-cc.x)*30.+rr*6.)"),
         ("  float fx=p.x*40.;", "  float fx=(p.x+uScroll*1.2)*40.;"),
         ("    vec2 o=vec2((h11(fi*2.7)-.5)*1.8,-.32+.04*h11(fi));", "    vec2 o=vec2(wrapX((h11(fi*2.7)-.5)*1.8-uScroll*1.2,2.4),-.32+.04*h11(fi));")])
edit(9, [("  vec3 col=sky(p,fogC,H);\n  vec2 mc=", "  vec3 col=sky(p,fogC,H);\n  vec2 pl=vec2(wrapX(p.x+uScroll*.18,3.4),p.y);\n  vec2 mc="),
         ("  vec2 md=(p-mc)/vec2(.42,.13);", "  vec2 md=(pl-mc)/vec2(.42,.13);"),
         ("exp(-length((p-mc-vec2(0.,-.06))/vec2(.55,.07))", "exp(-length((pl-mc-vec2(0.,-.06))/vec2(.55,.07))"),
         ("  float tx=abs(p.x+.006*(vn(vec2(p.y*60.,1.))-.5));", "  float tx=abs(pl.x+.006*(vn(vec2(p.y*60.,1.))-.5));"),
         ("  float talus=fillD(p.y-(H+.085-abs(p.x)*.35+.02*vn(vec2(p.x*10.,5.))),aa);", "  float talus=fillD(p.y-(H+.085-abs(pl.x)*.35+.02*vn(vec2(pl.x*10.,5.))),aa);"),
         ("  float colm=.5+.5*sin(p.x*150.+vn(vec2(p.x*30.,p.y*4.))*3.);", "  float colm=.5+.5*sin(pl.x*150.+vn(vec2(pl.x*30.,p.y*4.))*3.);")])
edit(11, [("  float t0=upTrees(p,22.,0.,.3,.3,.48,0.,4.,aa);\n  float t1=upTrees(p,13.,1.,.46,.26,.42,0.,4.,aa);", "  float t0=upTrees(p,22.,0.,.3,.3,.48,0.,8.,aa);\n  float t1=upTrees(p,13.,1.,.46,.26,.42,0.,8.,aa);")])
edit(12, [("  float t0=upTrees(p,18.,0.,.34,.47,.6,0.,4.,aa);", "  float t0=upTrees(p,18.,0.,.34,.47,.6,0.,8.,aa);")])
edit(13, [("  float t0=upTrees(p,12.,0.,.34,.1,.3,6.,2.,aa);\n  float t1=upTrees(p,8.,1.,.5,.06,.2,6.,1.,aa);", "  float t0=upTrees(p,12.,0.,.34,.1,.3,12.,5.,aa);\n  float t1=upTrees(p,8.,1.,.5,.06,.2,12.,5.,aa);")])

# old scenes are inlined as literals; newer ones (walks, scenes a/b) override them by id
ids = {0: 'treeline', 3: 'effigies', 4: 'valley', 5: 'range', 6: 'plain', 7: 'lake', 8: 'field', 9: 'tower', 10: 'road', 11: 'clearing', 12: 'underneath', 13: 'deadcanopy'}
scenes_js = ('const SCENE_SRC=Object.assign({\n' + ',\n'.join(f'{v}:`' + bodies[k] + '`' for k, v in ids.items())
             + '\n},WALKS,SCENES_A,SCENES_B);\nconst SCENE_GLSL=SCENES.map(s=>SCENE_SRC[s.id]);\n')
common = rd('v4-common.js') + '\nconst COMMON=COMMON_HEAD+`' + rd('v4-phen.glsl') + '`+COMMON_CRAFT;\n'
module = (rd('v3-head.js') + rd('v4-scenes.js') + '\n' + rd('v4-engine.js') + '/* ---------------- shaders ---------------- */\n'
          + rd('v4-post.js') + common + rd('v4-walk.js') + rd('v4-scenes-a.js') + rd('v4-scenes-b.js') + scenes_js + rd('v4-mix.js')
          + '\n' + rd('v4-trees.js') + '\n' + rd('v4-render.js') + '\n' + rd('v3-mid.js') + rd('v4-queue.js') + rd('v4-marks.js')
          + rd('v4-search.js') + rd('v4-loop.js'))
page = rd('v4-page.html')
i0 = page.index('<script type="module">') + len('<script type="module">'); i1 = page.index('</script>', i0)
base = page[:i0] + '\n' + module + '\n' + page[i1:]

data = (S / 'data' / 'data.json').read_text().replace('</', '<\\/')
canon_file = S / 'canonical.json'
# only for publishing previews (S8_CANONICAL=1); committed builds carry no canonical link
canon = json.loads(canon_file.read_text()) if canon_file.exists() and os.environ.get('S8_CANONICAL') else {}
link = lambda slug: f'<link rel="canonical" href="{canon[slug]}">' if slug in canon else ''

def write(slug, s):
    assert s.count('<!--CANONICAL-->') == 1
    s = s.replace('<!--CANONICAL-->', link(slug)).replace('/*__DATA__*/[]', data)
    (DIST / f'{slug}.html').write_text(s)
    d = DIST / slug; d.mkdir(exist_ok=True)
    for f in (S / 'assets').glob('*.jpg'): shutil.copy2(f, d / f.name)
    print(f'{slug}.html', len(s), 'canonical' if slug in canon else '')

def swap(s, a, b):
    assert s.count(a) == 1, (a[:70], s.count(a)); return s.replace(a, b)

DIST.mkdir(exist_ok=True)
write('section8-about-mockup', base)

# --- the chosen home page (intro J) replaces the gate of the base page ---
slug = 'section8-intro-j'
v = runpy.run_path(str(S / 'intro' / 'j.py'))
rel = sorted(json.loads((S / 'data' / 'data.json').read_text()), key=lambda r: r['d'], reverse=True)
ticker = '<span>' + '<i>◦</i>'.join(_h.escape(f"{r['c']} · {r['t']} — {r['a']}") for r in rel) + '<i>◦</i></span>'
v = {k: (x.replace('{slug}', slug).replace('{TICKER}', ticker) if isinstance(x, str) else x) for k, x in v.items()}
s = base
i0 = s.index('/* gate: the home page'); i1 = s.index('body.gated .chrome,body.gated .vside,body.gated .reg{')
s = s[:i0] + v['CSS'] + '\n' + s[i1:]
i0 = s.index('<div id="gate" role="dialog"'); i1 = s.index('</footer>\n</div>\n', i0) + len('</footer>\n</div>\n')
s = s[:i0] + v['HTML'] + s[i1:]
i0 = s.index('<link rel="preload" as="image" href="section8-about-mockup/forest.jpg"'); i1 = s.index('>', i0) + 1
s = s[:i0] + v['PRELOAD'] + s[i1:]
s = swap(s, '<meta property="og:image" content="section8-about-mockup/og.jpg">', f'<meta property="og:image" content="{slug}/og.jpg">')
s = swap(s, '<meta property="og:title" content="Section 8 Recordings · The Forest (mockup)">', f'<meta property="og:title" content="Section 8 Recordings · Intro J: {v["NAME"]} (mockup)">')
i0 = s.index('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'); i1 = s.index('>', i0) + 1
s = s[:i1] + f'\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{v["FONTS"]}&display=swap">' + s[i1:]
s = swap(s, '</body>', v['SCRIPT'] + '\n</body>')
assert 'section8-about-mockup/' not in s, 'leftover base asset path'
write(slug, s)

(DIST / 'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Section 8 Recordings</title>'
                                 f'<meta http-equiv="refresh" content="0; url={slug}.html"><a href="{slug}.html">Section 8 Recordings</a>\n')

# --- the live site: Cloudflare Pages serves public/. The chosen page becomes public/index.html with production metadata;
#     the previous about page stays at public/classic.html ---
LIVE, ORIGIN = S.parent / 'public', 'https://about.section8recs.com'
live = (DIST / f'{slug}.html').read_text().replace(f'{slug}/', 'assets/')
live = swap(live, f'<meta property="og:title" content="Section 8 Recordings · Intro J: {v["NAME"]} (mockup)">',
            '<meta property="og:title" content="Section 8 Recordings">')
live = swap(live, '<meta property="og:image" content="assets/og.jpg">',
            f'<meta property="og:image" content="{ORIGIN}/assets/og.jpg">\n<meta property="og:url" content="{ORIGIN}/">'
            f'\n<link rel="canonical" href="{ORIGIN}/">')
assert 'mockup' not in live.split('</head>')[0].lower(), 'preview wording left in the live page head'
(LIVE / 'assets').mkdir(parents=True, exist_ok=True)
(LIVE / 'index.html').write_text(live)
for f in (S / 'assets').glob('*.jpg'): shutil.copy2(f, LIVE / 'assets' / f.name)
print('public/index.html', len(live))
