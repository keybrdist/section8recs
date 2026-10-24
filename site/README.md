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
`site/intro/`, with the release data from `site/data/catalog.json` inlined, and writes it as cacheable files:

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
- `site/data/catalog.json`: both labels on the section8recs LabelGrid account (Section 8 Recordings and Section 8 Bass),
  written by the sync; `tombstones.json` lists releases that left the catalogue, `overrides.json` (optional) holds
  editorial fixes
- `static/og/`: one 1200×630 social card per release, made by `scripts/og-cards.mjs`
- `src/pages/`: the pages. Every page is the experience (`src/layouts/Experience.astro`) with its own metadata
  (`src/components/Seo.astro`) and gate content (`src/components/Gate.astro`):
  - `/`: home, with the latest releases
  - `/releases`: every release by year, filterable by label
  - `/cat/<CAT>`: one page per release, at the catalogue number section8recs.com has always used
  - `/artist/<slug>`: one page per artist
  - `404.html`: unknown addresses answer 404
- `src/lib/catalog.mjs`: the catalogue as the pages use it (artists and slugs, covers, descriptions)
- `src/lib/schema.mjs`: schema.org structured data (MusicAlbum, MusicGroup, the label); `src/pages/sitemap.xml.js`
  lists every page with each release's cover; `static/robots.txt` points at it

Each page names what it shows in `<script id="s8-route">`; entering plays it (`site/src/v4-route.js`), and the address
follows the release on air. `scripts/redirects.mjs` writes `_redirects` at build time: lgsites' `/r/<slug>/<id>`
addresses, the archived ones in `site/data/legacy-urls.json`, lowercase catalogue numbers and lgsites' player and
checkout paths all 301 to the release page. `static/_headers` keeps previews and about.section8recs.com out of search
results.

## Catalogue sync

`.github/workflows/sync.yml` runs daily at 06:17 UTC (and on demand, or on a `labelgrid-release` repository dispatch):
`scripts/sync.mjs` fetches both labels from the LabelGrid API with the `LABELGRID_API_TOKEN` secret, keeps only public
fields, checks the result, and the workflow commits `site/data/` and `static/og/` to `main` when they changed; Pages
then deploys. A failed run commits nothing and opens a "Catalogue sync failing" issue. A label losing more than 3
releases opens a pull request instead. Locally:

    LABELGRID_API_TOKEN=... npm run sync   # sync, then make any missing social cards

The token (`section8recs-static-site-sync-v2`) expires on 2027-10-24; the workflow opens a reminder issue a month before.

## Checks

    npm run check                          # catalogue and built site: fields, pages, metadata, redirects
    node scripts/smoke.mjs <url>...        # headless Chromium: the page boots, WebGL renders, the gate enters
    node scripts/check-urls.mjs --base <url>   # a deployment: every page 200, old addresses 301, unknown ones 404

## Phones

On a phone the now-playing block shows four lines; the 8 sigil at its left (or the Section 8 mark at the top left)
shows the rest. Swiping up skips to the next track and down to the previous one (a deliberate flick only). The heart
opens the track's outlets and a Favorite toggle; favourites are kept in this browser (`s8.favorites.v1`, apart from
the queue). In the looking-up scenes, craft stay above the bottom third of a phone screen (`site/src/v4-mobile.js`).
The lock screen gets the Section 8 mark and stays in sync with playback (`site/src/v4-media.js`).

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
