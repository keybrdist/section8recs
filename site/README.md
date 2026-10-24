# Section 8 site redesign

An immersive, audio-reactive take on about.section8recs.com: a dark forest rendered in WebGL (three.js), one scene per
release mood, with the full catalogue playable, searchable and queueable.

## Build

    python3 site/build.py

Writes `public/index.html` and `public/assets/`, which is the live site: Cloudflare Pages serves `public/` for
about.section8recs.com, and the previous about page stays at `public/classic.html`. It also writes previews to `site/dist/`:

- `section8-intro-j.html` — the experience behind the chosen home page (centred wireframe logo); `index.html` redirects here
- `section8-about-mockup.html` — the same experience with the original full-frame intro
- a folder of images next to each page

Each page is a single self-contained HTML file. Release data comes from `site/data/data.json` and is inlined at build
time; audio streams from the label CDN; three.js loads from jsDelivr.

## Layout

- `site/src/` — the page shell (`v4-page.html`) and the module parts the build concatenates, in order:
  head, scene registry, audio engine, post-processing, shared GLSL, scene shaders (`v4-scenes-old.js` is patched by the
  build, `v4-walk.js`, `v4-scenes-a.js` and `v4-scenes-b.js` override by scene id), mixer, tree atlas, renderer, player,
  queue, start/end markers, search, main loop
- `site/intro/` — the home page variant (J) applied on top of the base page
- `site/assets/` — hero images
- `site/data/data.json` — 139 releases, 467 tracks

## Queue settings

The Queue panel exports JSON (`section8-queue/1`): track order, per-track scenes, start/end markers and tracks marked for
deletion. The default queue lives in `DEFAULT_CONFIG` at the top of `site/src/v4-queue.js`.

## Responsive check

`site/tests/responsive.cjs` loads the built page at 20 sizes (phones from 320 px, landscape phones, Galaxy Fold cover
and unfolded, Z Flip, Pixel Fold, Surface Duo, tablets in both orientations), opens each state (home, playing, scene
menu, search, queue, archive) and reports horizontal overflow, controls off-screen or clipped, overlapping interface
groups, cut-off text and touch targets under 30 px. It writes screenshots, `report.json` and one contact sheet per state
to `site/tests/out/`.

    python3 -m http.server 8765 --directory site/dist &
    NODE_PATH=<dir containing playwright-core> CHROME=<chromium binary> node site/tests/responsive.cjs
