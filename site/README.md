# Section 8 site

An immersive, audio-reactive site for Section 8 Recordings: a dark forest rendered in WebGL (three.js), one scene per
release mood, with the full catalogue playable, searchable and queueable.

## Hosting

section8recs.com is served by the Cloudflare Pages project `section8recs` (zone `section8recs.com`, account KEYBRDIST
INC): the apex is a proxied CNAME to `section8recs.pages.dev`, and zone redirect rules send www., dl. and about.
section8recs.com to it with a 301. Until 2026-10-30 the apex pointed at LabelGrid's lgsites (A 157.90.158.72); the DNS
and Pages settings from before the move are in `.scratch/cutover-2026-10-30/` of the maintainer's checkout. To roll
back, point the apex at that address again.

## Build

Needs Node 24 (`.node-version`; Astro 7 needs at least 22.23.4).

    npm ci
    npm run build      # bundle the app, then build the Astro pages into dist/
    npm run preview    # serve dist/ locally

Cloudflare Pages runs the same build for every push: `main` deploys section8recs.com, and every branch gets a
preview at `https://<branch>.section8recs.pages.dev`.

`npm run bundle` (`scripts/bundle-app.mjs`) assembles the experience from `site/src/` and the home page variant in
`site/intro/`, with the release data from `site/data/catalog.json` inlined, and writes it as cacheable files:

- `static/app/app.<hash>.js` and `app.<hash>.css`: the module and styles every page shares
- `static/app/intro.<hash>.js`: the home page's wireframe logo and link scrolling
- `src/generated/shell.json`: the page head and body markup the Astro pages render around them

Audio streams from the label CDN. three.js (0.162, from npm) is bundled into the app module with rolldown, so only
the parts the experience uses ship, from this site. Static files (hero images, `classic.html`, the
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
follows the release on air. A release page (`/cat/<CAT>`, see Share addresses for its parameters) skips the gate: once the forest has
loaded it enters by itself and plays. Where the browser refuses sound without a gesture (always Safari on iPhone) it
shows a "Tap to play" cue, and the first tap or click that is not on a control starts the track; a tap while the page
is still loading opens the sound then and plays once ready. A visitor who scrolled down to the release while it loaded
keeps the gate. The release's details stay in the page below the gate for search engines and link previews, and
Release info in the now-playing block reopens the gate on them (on a phone, in the full details the 8 shows). `scripts/redirects.mjs` writes `_redirects` at build time: lgsites' `/r/<slug>/<id>`
addresses, the archived ones in `site/data/legacy-urls.json`, lowercase catalogue numbers and lgsites' player and
checkout paths all 301 to the release page. `static/_headers` keeps previews out of search
results.

## Share addresses

A release page takes parameters that open it on a moment, in any combination:

| Parameter | Example | |
|---|---|---|
| `track` | `?track=3` | the track, counted from 1 |
| `t` | `?t=90`, `?t=1:30`, `?t=1m30s` | where it starts |
| `scene` | `?scene=15`, `?scene=clearing` | the scene, by its number in the scene menu or its id, pinned as if picked there |

For example `/cat/SECTION8019D?track=2&t=90&scene=2`. `scene` works on every page. Until 2026-10-30 `?t=<n>` named the
track; without `track`, a bare `t` no greater than the release's track count still does. While playing, the address
keeps the track and a pinned scene, and, as on YouTube, the start time until another track comes on (so a reload or a
copied address starts there again). The heart's dialog has Share: Copy link (or the phone's share sheet), with
Start at to add the moment.

Link previews never run the page's scripts, so two Cloudflare Pages Functions (`functions/`) answer for them, from
`/share.json` (`src/pages/share.json.js`: every release's tracks and the scene names):

- `functions/cat/[cat].js`: a release page reached with these parameters gets a title, description, `og:url` (the
  address written back in one order, e.g. `?track=2&t=90&scene=2`) and `og:type` `music.song` for that track. The
  canonical address stays the release page. Without parameters, or on any failure, the page goes out as built.
- `functions/oembed.js`: [oEmbed](https://oembed.com) for release pages and their share addresses, found from the
  `<link rel="alternate" type="application/json+oembed">` in each release page's head. It embeds the experience itself
  in a 16:9 iframe (640×360, smaller with `maxwidth`/`maxheight`) for WordPress, Ghost, Notion, Medium and the like,
  and gives Discord and Slack the artist and label for their previews.

Every request to `/cat/*` and `/oembed` runs a Function (the free plan allows 100,000 a day), and `npx wrangler pages dev
dist` runs them locally.

Embedded (an X card, an oEmbed iframe, any frame), a tap or click on the scene pauses the music and holds the scene
still, with a Paused cue, and the next tap carries on from the same moment; controls work as usual. Outside a frame a
tap on the scene hides a phone's controls instead.

On X a release page is a player card: on desktop web the post plays the page itself (`twitter:player`, the share address
when there is one) in a 480×480 frame, square because only there does the scene show between the controls; X's apps
show the cover (`twitter:image`, 1200 px) and link through. A preview build points the player at the preview itself,
so a card can be tried on X before it reaches section8recs.com, and on a preview `?xcard=landscape` (480×270) or
`?xcard=wide` (480×252) declares another shape with the release card as its image. This follows the dnbradio-player's
X card. Other pages keep the large image card, and Facebook and Threads, which play no third-party players, show
`og:image`. Both parsers, `src/lib/share.mjs` and the one in `site/src/v4-route.js`, have to agree.

## Catalogue sync

`.github/workflows/sync.yml` runs daily at 06:17 UTC (and on demand, or on a `labelgrid-release` repository dispatch):
`scripts/sync.mjs` fetches both labels from the LabelGrid API with the `LABELGRID_API_TOKEN` secret, keeps only public
fields, checks the result, and the workflow commits `site/data/` and `static/og/` to `main` when they changed; Pages
then deploys. A failed run commits nothing and opens a "Catalogue sync failing" issue. A label losing more than 3
releases opens a pull request instead. Locally:

    LABELGRID_API_TOKEN=... npm run sync   # sync, then make any missing social cards

The token (`section8recs-static-site-sync-v2`) expires on 2027-10-24; the workflow opens a reminder issue a month before.

## Load timing

Add `?timing` to any page address (for example https://section8recs.com/?timing) to get a panel with the load
stages, the blocking WebGL calls (shader compile and link, texture upload) and the slowest frames, with a Copy button.
It is meant for phones, where there are no developer tools at hand. To keep the first frame quick, the tree atlas is
drawn at half size on phones and tablets, and the scenes other than the first compile only after the experience has
been entered, one at a time while the page is idle.

## Checks

    npm run check                          # catalogue and built site: fields, pages, metadata, redirects
    node scripts/smoke.mjs <url>...        # headless Chromium: the page boots, WebGL renders, the gate enters
                                           # (a release page enters and plays by itself); --blocked refuses sound
                                           # outside a gesture, as iPhones do, and taps to play; --phone: 393×852 touch
    node scripts/check-urls.mjs --base <url>   # a deployment: every page 200, old addresses 301, unknown ones 404
    node scripts/check-share.mjs --base <url>  # a deployment: share addresses' preview tags and oEmbed

## Phones

On a phone the now-playing block shows four lines, and after 10 s of playing untouched the controls and text fade,
leaving the 8 sigil in the corner: tapping it brings them back, again shows the full details, and again folds them;
tapping the scene hides everything. Resting the mouse on the 8 (or tabbing to it) names what it does next (Show player, Track
details, Fewer details) above it, and while the controls are hidden lets them show through faintly; on a touch screen
the first fade of a visit names the 8 once on its own (`s8.nudged` in sessionStorage). Swiping up skips to the next track and down to the previous one (a deliberate flick
only, also when it starts on the seek bar, which seeks on a tap and scrubs when dragged sideways). The heart
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

## Demo videos

`scripts/demo/` cuts short videos of the experience from real, frame-by-frame renders of the scenes, each shot on a
track's drop: see `scripts/demo/README.md`.
