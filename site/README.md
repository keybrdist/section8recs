# Section 8 site

An immersive, audio-reactive site for Section 8 Recordings: a dark forest rendered in WebGL (three.js), one scene per
release mood, with the full catalogue playable, searchable and queueable.

## Build

Needs Node 24 (`.node-version`; Astro 7 needs at least 22.23.4).

    npm ci
    npm run build      # bundle the app, then build the Astro pages into dist/
    npm run preview    # serve dist/ locally

Cloudflare Pages runs the same build for every push: `main` deploys about.section8recs.com, and every branch gets a
preview at `https://<branch>.section8recs.pages.dev`.

`npm run bundle` (`scripts/bundle-app.mjs`) assembles the experience from `site/src/` and the home page variant in
`site/intro/`, with the release data from `site/data/data.json` inlined, and writes it as cacheable files:

- `static/app/app.<hash>.js` and `app.<hash>.css`: the module and styles every page shares
- `static/app/intro.<hash>.js`: the home page's wireframe logo and link scrolling
- `src/generated/shell.json`: the page head and body markup the Astro pages render around them

Audio streams from the label CDN and three.js loads from jsDelivr. Static files (hero images, `classic.html`, the
previous about page) live in `static/`.

## Layout

- `site/src/`: the page shell (`v4-page.html`) and the module parts the bundle concatenates, in order: head, scene
  registry, audio engine, post-processing, shared GLSL, scene shaders (`v4-scenes-old.js` is patched by
  `scripts/lib/assemble.mjs`; `v4-walk.js`, `v4-scenes-a.js` and `v4-scenes-b.js` override by scene id), mixer, tree
  atlas, renderer, player, queue, start/end markers, search, main loop
- `site/intro/`: the home page variant (J) applied on top of the base page
- `site/data/data.json`: 139 releases, 467 tracks
- `src/pages/`: the Astro pages

## Checks

    node scripts/check-golden.mjs     # the Node assembly matches the page the old Python build published
    node scripts/smoke.mjs <url>...   # headless Chromium: the page boots, WebGL renders, the gate enters

## Queue settings

The Queue panel exports JSON (`section8-queue/1`): track order, per-track scenes, start/end markers and tracks marked for
deletion. The default queue lives in `DEFAULT_CONFIG` at the top of `site/src/v4-queue.js`.

## Responsive check

`site/tests/responsive.cjs` loads the built page at 20 sizes (phones from 320 px, landscape phones, Galaxy Fold cover
and unfolded, Z Flip, Pixel Fold, Surface Duo, tablets in both orientations), opens each state (home, playing, scene
menu, search, queue, archive) and reports horizontal overflow, controls off-screen or clipped, overlapping interface
groups, cut-off text and touch targets under 30 px. It writes screenshots, `report.json` and one contact sheet per state
to `site/tests/out/`.

    npx astro preview --port 8765 &
    CHROME=<chromium binary> node site/tests/responsive.cjs
