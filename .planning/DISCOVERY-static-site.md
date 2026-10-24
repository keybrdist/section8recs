---
subject: Move section8recs.com onto the immersive design, statically hosted, with LabelGrid data synced every 24 h
status: planned (implementation: phases 1–4 merged 2026-10-24, see plan Progress)
updated: 2026-10-24T08:40:00Z
source: free-text (operator request, relayed from the source thread)
plan: .planning/static-site-astro-migration.md
---

# Discovery: section8recs.com on the immersive design, statically hosted

## Recommendation in one paragraph (updated 2026-10-24 with the operator's decisions)

Generate the site statically with **Astro 7** (D1) and serve it from the Cloudflare Pages project that already serves
about.section8recs.com. Pages builds from source, and its output is `dist/`. The catalogue covers **both labels on the
section8recs LabelGrid account** (D2):

- Section 8 Recordings (label 1): 140 releases;
- Section 8 Bass (label 4, slug `section8dub`): 105 releases;
- 843 tracks in total.

Every release lives at `/cat/<CATALOG>`, which is the URL it has always had, including the old SECTION8DUB/BASS/FREE catalogues
that crawlers still request. Each release page is a real HTML file with its own meta, social card, JSON-LD and visible release
text. Every page loads one shared, cached copy of the immersive app, which opens with that release selected and uses `pushState`
while browsing, so audio keeps playing. There's also a page for each of the 257 artists (D3), and the podcast feed is retired
(D4).

A GitHub Actions job runs every 24 h. It fetches the API with the dedicated token created on 2026-10-24 (D5), keeps only an
allowlist of public fields, builds social cards for new or changed covers and validates the result. It commits only when
something changed. A failed run commits nothing, so the live site keeps its last good data. A generated `_redirects` keeps 705
legacy and variant URLs working, `404.html` turns on real 404s, and the cutover changes one DNS record.

## Starting Point

The operator wants the new design on the apex. Inner pages must keep working, the site must stay crawlable, there must be a
`/releases` page, LabelGrid's lgsites must go and the site must be static with a 24 h API sync. Individual pages are needed for SEO
and social previews. The operator asked which stack to use and was unsure whether this needs SSR or static generation.

Fixed: Cloudflare (zone `section8recs.com`, Free plan; Pages project `section8recs`), the immersive vanilla JS/three.js/GLSL
experience in `site/`, audio and artwork on the LabelGrid CDN, and the LabelGrid API as the source of truth.

## Evidence

Raw evidence is under `.planning/evidence/`. Large raw HTML captures were kept out of git.

### The current repo and design
- `site/build.py:93-129`: the build produces one self-contained 340 KB HTML file. `site/data/data.json` (67 KB) is inlined at
  `/*__DATA__*/[]` (`site/src/v4-page.html:499`), so there's no routing and no per-release URL. Release selection is `load(c,i)`
  (`site/src/v3-mid.js:130`), and the experience starts in `enter(withSound)` (`site/src/v4-loop.js:33`).
- `site/src/v4-queue.js:6-8`: the curated default queue, per-track scenes, markers and deletions are keyed by **MP3 filename**,
  for example `SECTION8034D-6-Bad_Logik-The_Mad_Lands.mp3`.
- `data.json` has 139 releases and 467 tracks, the newest dated 2020-06-19. The crawl confirms the live catalogue is the same
  139/139 releases and 467/467 MP3 names. Five titles differ only in "A / B" vs "A/B" spacing.
- The repo is **public** (`gh repo view`), which matters for the GitHub cron's 60-day inactivity rule and for what may be committed.

### section8recs.com today (lgsites)
- **Routes**, from lgsites `nuxt.config.js:96-161` (read-only clone of `labelgrid/lgsites` main @4555e68):
  - `/:slug?` is a catch-all, so any unknown single-segment path returns the home page with 200.
  - `/releases`; `/cat/:cat` (the canonical URL lgapi emits, `lgapi app/Helpers/Helper.php:1318-1331`).
  - `/r/:albumSlug/:id`, which ignores the slug.
  - `/latest`, which always 404s.
  - `/cat/:cat/thanks|cancelled`, `/player/cat/:cat`, `/dropbox` (demo upload), `/checkout`.
  - There are no artist, podcast, sitemap or RSS routes and never were (305 commits checked).
- **Crawl** (216 requests, `evidence/crawl/urls.csv`, `pages.jsonl`):
  - 139 `/cat/<CAT>` pages return 200. The catalogue number is case-sensitive: `/cat/section8116` returns 404.
  - Release titles are unique, and every release has its own 800×800 cover as `og:image`.
  - 45 of 139 have an empty description.
  - The canonical is **relative and wrong** on every release (`/r/section8recs/<id>`).
  - `twitter:card` holds the description text, and `twitter:image` is missing.
  - No page has JSON-LD, `og:url` or a sitemap, and each page is 564–760 KB because the whole catalogue is embedded.
  - The home page has a generic title, no description and no h1.
- **Soft 404s today**: `/sitemap.xml`, `/podcast-rss`, `/podcast`, `/feed`, `/rss` and any unknown path return 200 with the home
  page HTML (`evidence/crawl/probes.jsonl`). robots.txt has only Cloudflare content-signal comments.
- **Legacy URLs**, from the Wayback CDX (`evidence/crawl/historical-r-slugs.json`):
  - `/r/<slug>/<id>` was the public pattern from 2013 to 2024. 134 archived slug/id pairs point at releases that are still current
    (106 of 139 releases) and still resolve today.
  - 98 pairs belong to releases no longer in the catalogue.
  - About 135 archived `/cat/` values (SECTION8BASS001-032, SECTION8DUB001-067D, FREE004-006) no longer exist and already 404.
- **Podcast**:
  - In 2016, `/podcast-rss` went to `feeds.feedburner.com/section8-podcast`. FeedBurner now redirects back to
    `www.section8recs.com/?pc=PodcastFeed`, which serves HTML.
  - **The feed has been broken end to end** for subscribers and for Google, which fetches it about 70 times a day (486 times in 7 days).
  - The only podcast in the LabelGrid catalogue is SECTION8POD13 (2018).
- **Redirects**: `www.` and `dl.` 301 to **http**://section8recs.com/… and then to https. The origin (157.90.158.72) does this,
  not Cloudflare: the zone has no page rules and no Workers routes.

### Traffic, from Cloudflare analytics (`evidence/cloudflare/cat-paths-30d.json`)
- In 30 days, 354 distinct `/cat/*` paths were requested:
  - all 139 real catalogue numbers;
  - 99 lowercase variants, which 404 today;
  - 116 non-existent catalogues (the old DUB/BASS/FREE catalogues and junk).
- `/r/section8recs/<id>` URLs are requested too (`/r/section8recs/10557`, `/484`). Those are the wrong canonicals being followed.
- Per day, about 270 requests hit `/` and about 70 hit `/podcast-rss`, and robots.txt is fetched constantly. Most other paths are
  scanner probes (`/.env`, `/wp-login.php`, `*.php`).

### LabelGrid API (lgapi primary checkout `~/work/lg/lgapi` main @7394c904d; samples in `evidence/api/`)
- **No endpoint is anonymous.** `routes/api-public.php:59` requires `auth:api,sanctum` plus `public-api-access`
  (`user.api_access`), and unauthenticated calls return 401 (probed). lgsites sends `Authorization: Bearer <LABELGRID_API_TOKEN>`
  server-side (`plugins/axios-auth.js`).
- **Endpoints lgsites uses** (section8recs is labelId 1):
  - `GET /api/public/resolve/label/{slug}`, `/api/public/labels/{id}`, `/api/public/site-settings/{id}` and
    `/api/public/site-settings/links/{id}`.
  - `GET /api/public/releases?filter[label_id]=1&per_page=100&page=N` (100 is the maximum per page; the response is a Spatie
    paginated collection with `meta.last_page`).
  - There is no release-detail, artist or podcast endpoint in use. `filter[public_site]` is ignored server-side, and non-admin
    tokens see only their own labels (`ReleaseController.php:83-137`).
- **Release fields** (`app/DTO/ReleaseData.php`):
  - identity and text: `id`, `public_id`, `cat`, `title`, `mix_version`, `description_long`, `default_display_artist`;
  - dates and lines: `release_date`, `release_pre_order_date`, `cline`/`pline`;
  - catalogue data: `barcode_number`, `primary_genre`/`secondary_genre`, `label`, `artists[]`;
  - media and links: `tracks[]`, about 26 `*_url` store links, `short_url` (`lbl.gr`), and `front_cover.url` =
    `cdn-prod-1.labelgrid.com/cdn-cgi/image/width=800/labels/section8recs/img/<CAT>.jpg?ts=…`. The original is 3000×3000 and 5.9 MB.
- **Track fields**: `id`, `track_num`, `title`, `mix_version`, `default_display_artist`, `default_display_title`, `preview_file.url`.
  The preview filename is whatever is stored. Legacy files are named `<CAT>-<n>-<Artist>-<Title>.mp3`, but **new files are
  `<uuid>.mp3`** (`Track.php:3187-3199`, `TrackFile.php:141-157`).
- **Label object**: links, logo and `podcast_url`. It also carries **private fields** (`default_email`, `support_email`,
  `default_label_share`, `isrc_base`, `fb_pixel_id`), and lgsites currently embeds all of them in every public page.
- **Webhooks exist** (HMAC-signed): `release.distributed`, `delivery.completed`, `takedown.completed` and others
  (`app/Enum/WebhookEventType.php`). There's no "site updated" event.
- **Rate limits** are 120–600 requests per minute per user. A full sync is about 6 requests.

### Cloudflare (read via a scoped read-only child token, minted for this task and revoked after)
- **Zone DNS**:
  - apex `A 157.90.158.72` proxied, and `www A` the same;
  - `dl CNAME section8recs.com` proxied;
  - `about CNAME section8recs.pages.dev` proxied;
  - Google Workspace MX/TXT, SES/SendGrid DKIM, and **two `google-site-verification` TXT records**. Search Console is therefore
    DNS-verified, and that verification survives a hosting change.
- **Zone settings**: SSL mode `flexible`, Always Use HTTPS on, security level medium, browser check on.
- **Pages project**: Git-connected to `keybrdist/section8recs`, production branch `main`, no build command, output dir `public`,
  domains `section8recs.pages.dev` and `about.section8recs.com`, previews for all branches.

### Platform facts (primary docs, fetched 2026-10-23)
- **Pages vs Workers**: Pages docs now say "Start new projects with Workers", but Pages isn't deprecated
  (https://developers.cloudflare.com/pages/). Pages keeps built-in Git deploys and previews, and it serves its clean-URL redirects as
  308. Workers static assets uses 307 for the same redirects, and Google treats 307 as temporary
  (https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/).
- **`_redirects`**: up to 2,000 static plus 100 dynamic rules, and **redirects win over static files**. They can't redirect across
  domains (https://developers.cloudflare.com/pages/configuration/redirects/).
- **404s**: if there's no top-level `404.html`, Pages acts as an SPA and serves `/` for every unknown path; with one it serves real
  404s (https://developers.cloudflare.com/pages/configuration/serving-pages/).
- **Free plan limits**: 500 builds a month, a 20-minute build limit, 20,000 files per deployment and 25 MiB per file
  (https://developers.cloudflare.com/pages/platform/limits/).
- **Apex custom domain**: the zone must be in the same account, and the existing A record on the name has to be replaced
  (https://developers.cloudflare.com/pages/configuration/custom-domains/; the replacement step comes from community reports).
- **GitHub `schedule`**: runs can be delayed or dropped, and **in public repos scheduled workflows are disabled after 60 days with no
  repository activity** (https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- **Social cards**:
  - Link-preview bots never run JS (Discord: https://docs.discord.com/developers/link-previews/overview; iMessage:
    https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages), so the meta tags have to be in
    the HTML the server sends.
  - X `summary_large_image` wants a 2:1 image under 5 MB, falls back to `og:` tags, still needs `twitter:card`, and caches for
    about 7 days (archived X docs).
  - Facebook wants 1200×630 (https://developers.facebook.com/docs/sharing/webmasters/images/).
- **Google**:
  - There's **no music, album or podcast rich result**
    (https://developers.google.com/search/docs/appearance/structured-data/search-gallery). JSON-LD is still used to understand
    the page.
  - 301 and 308 both count as permanent (https://developers.google.com/search/docs/crawling-indexing/301-redirects).
  - Change of Address is only for domain moves, so it doesn't apply to path changes.
  - A soft 404 is a 200 response with error-like content.
- **Podcast feed moves**: Apple needs a 301 plus `<itunes:new-feed-url>` for at least 4 weeks
  (https://podcasters.apple.com/support/837-change-the-rss-feed-url), and Spotify needs a manual feed update.
- **Generators**:
  - Astro 7.4 (Astro joined Cloudflare in January 2026) can ship the bundle untouched via `is:inline`
    (https://docs.astro.build/en/guides/client-side-scripts/).
  - Eleventy 3.1 was renamed "Build Awesome" under Font Awesome in March 2026 (https://www.11ty.dev/blog/).
  - Next 16 `output: 'export'` drops redirects and headers and ships React to every page
    (https://nextjs.org/docs/app/guides/static-exports).
  - Nuxt 4 `generate` hydrates Vue on every page.

### Spike: Pages routing (`evidence/pages-routing-spike.txt`)
A throwaway branch was deployed to a preview and then deleted. On Pages as it is today:
- `/cat/section8116 → /cat/SECTION8116 301` works, and **matching is case-sensitive**, so lowercase-to-uppercase rules can't loop.
  Mixed-case variants that aren't listed return 404.
- `/cat/:cat/thanks → /cat/:cat 301` works.
- `404.html` gives real 404s for `/nope` and `/cat/NOPE`.
- `/podcast-rss /podcast.xml 200` plus `_headers` serves `application/rss+xml`.
- `/cat/X.html` and `/cat/X/` 308 to `/cat/X`.

### Evidence added 2026-10-24 (after the operator's decisions)
- **Token (D5)**:
  - Created through the operator's computer-use session at `app.labelgrid.com/user/profile/api-tokens` as
    `section8recs-static-site-sync-v2`. It expires 2027-10-24.
  - `GET /api/public/labels` with it returns label 1 `section8recs` and label 4 `section8dub` ("Section 8 Bass").
  - It's stored as the repo Actions secret `LABELGRID_API_TOKEN` and locally as `SECTION8RECS_LABELGRID_API_TOKEN` in
    `~/.secrets/agent-env.d/section8recs.env`.
  - The first token created was exposed in the session log by a quoting mistake. It was deleted in the UI the same session, after
    its replacement was verified.
- **Token scope**:
  - Sanctum mints every token with abilities `*`, and nothing checks abilities (`CreateApiToken.php:18-23`).
  - `routes/api-public.php` has **59 write routes**, including label/artist update and `DELETE /labels/{label}`.
  - The per-token IP whitelist can't be used, because GitHub Actions IPs aren't fixed.
- **Catalogue** (`evidence/api/catalog-index.json`, `releases-both-labels-summary.json`):
  - Label 1 has 140 releases: the 139 in `data.json`, plus SECTION8100S "We Might Be Monsters - Sampler" (2018).
  - Label 4 has 105 releases (67 DUB, 29 BASS, 3 FREE and a few others).
  - All 245 are `approved` and `distributed`, every release has tracks, and every track has a preview.
  - `filter[label_id]` takes a single id (`ReleaseController.php:111-112`), so the sync makes one call per label.
- **Old URLs**:
  - Label 4 covers 98 of the 105 DUB/BASS/FREE catalogue paths requested in the last 30 days.
  - By release id it maps 95 of the 98 previously unmatched archived `/r/<slug>/<id>` pairs, so 229 of 232 now redirect.
  - Still unmapped: 3 test/removed pairs, plus `SECTION8116S2` and `SECTION8FREE01`.
- **Media**:
  - Label 4 previews are at `cdn-prod-1.labelgrid.com/labels/section8dub/320/<file>` and covers at `.../section8dub/img/<CAT>.jpg`.
  - The CDN answers `206` with `Access-Control-Allow-Origin: *` for a browser User-Agent and **403 for Python's default
    User-Agent**, so the sync must send an explicit UA.
- **Artists**:
  - `artists[]` entries are `{position, artistic_role, artist{id, artist_name, photo, spotify_artist_id, apple_artist_id, isni, public_id}}`.
  - There are 257 distinct artists across both labels, 115 of them with two or more releases. One slug collides (`a-tech`).
- **Hard-coded counts in the app**: "139" and "467" appear in `site/src/v3-mid.js:61,66,112,115,122`, `v4-loop.js:35`,
  `site/intro/j.py:85`, `v4-search.js:1` and the page meta. These must come from the data.
- **Toolchain**:
  - Astro 7.4.2 requires Node >=22.23.4 (`npm view astro engines`).
  - The Pages v3 build image defaults to Node 22.16.0 and honours `.node-version`
    (https://developers.cloudflare.com/pages/configuration/build-image/).
  - With `build.format: 'file'`, Astro writes `src/pages/cat/[cat].astro` as `/cat/<CAT>.html`, which Pages serves at
    `/cat/<CAT>` (spike). `directory` format would force trailing-slash URLs.

## Unknown Inventory (material entries only)

**Known unknowns (facts, now verified)**
- The URL inventory is `/cat/<CAT>` (139 releases) plus the legacy `/r/` pattern; see the redirect map below.
- The API requires a token, which became decision D5.
- There was no live podcast feed to preserve byte for byte, which became decision D4.

**Unknown unknowns surfaced**
| # | Blind spot | Evidence | Consequence | Plan element that absorbs it |
|---|---|---|---|---|
| U1 | Every release page canonicalises to a different, relative `/r/section8recs/<id>` URL | crawl `pages.jsonl` | Google may have indexed `/r/…` variants instead of `/cat/` | 301 all `/r/section8recs/<id>` to `/cat/<CAT>`, absolute canonicals, sitemap of `/cat/` only |
| U2 | The podcast feed has been HTML for years, yet Google fetches it about 70 times a day | analytics, FeedBurner chain | There's nothing to "keep working" and directories hold a dead feed | D4: revive a valid feed or retire it deliberately |
| U3 | New LabelGrid previews are `<uuid>.mp3`, but the curated queue/scene/marker config is keyed by filename | `TrackFile.php:141-157`, `v4-queue.js:6-8` | A re-transcode would silently drop the operator's curated defaults | Sync keeps track `id` next to the filename, and the build fails when a `DEFAULT_CONFIG` key stops resolving; later, key by track id |
| U4 | The API's label object carries private fields (emails, `default_label_share`), and the repo is public | `LabelData.php:100-160`, `gh repo view` | A naive sync would publish them in git | The sync writes only an allowlisted projection |
| U5 | The GitHub cron dies after 60 idle days in a public repo, and this catalogue changes rarely (newest release 2020) | GitHub docs | New releases would stop appearing without any error | The sync commits a monthly heartbeat, and a staleness check fails loudly |
| U6 | `www.` and `dl.` redirects are done by the lgsites origin and downgrade to http | probes, zone has no rules | Cutting the apex over without replacing them breaks www and dl | Add zone Single Redirect rules before the DNS swap |
| U7 | Crawlable text must not be hidden behind the WebGL gate | Google JS SEO docs | Content invisible to users risks being treated as cloaking or thin | A visible release "dossier" layer that is part of the design |
| U8 | 99 lowercase `/cat/` variants were requested in 30 days and 404 today | analytics | Lost visits from links in the wild | Static lowercase-to-uppercase 301s (case-sensitive matching, verified) |
| U9 | lgsites leaks the label's private fields on every page today | `evidence/api/labels-show.json` note | This is a privacy issue in lgsites now, separate from this move | Report to lgsites as its own fix (severity medium); it goes away for this label at cutover |

## Directions

### Rendering model: static generation is enough, and SSR isn't needed

Everything a crawler or link-preview bot needs (titles, descriptions, cards, JSON-LD, tracklists) is known at sync time and
changes at most daily. With about 510 pages (245 releases, 257 artists and a handful of others), a full rebuild takes seconds to
tens of seconds. SSR or edge functions would only add value for per-request personalisation or data fresher than 24 h, and nothing
here needs either.

### Stack options (decided: O2 Astro, D1)
| | O1 Python build + Jinja2 + Pillow | O2 Astro 7 SSG (**chosen, D1**) | O3 Eleventy 3 | O4 Next 16 export / Nuxt 4 generate |
|---|---|---|---|---|
| Crawlable HTML and per-page meta | Yes, templates | Yes | Yes | Yes |
| OG/Twitter, JSON-LD, sitemap | Written by hand | `@astrojs/sitemap` plus components | Plugins or hand-written | Partly built in; `_redirects`/headers not supported in export |
| Fit with the existing bundle | Native | `is:inline` / `public/` ships it untouched. The GLSL assembly gets ported to Node and checked against a golden file | Passthrough | Poor: a framework runtime on every page |
| Toolchain | Python | Node only, after the port | Python + Node | Node plus a framework |
| Maintenance | Lowest | Medium: majors yearly | Medium; governance uncertain | Highest |
| Cloudflare Pages fit | Static folder | Static folder; Astro is a Cloudflare project since 2026 | Static folder | Static folder |

**Operator decision (D1): Astro.** It gives component templating for the release, artist, index and 404 pages, the sitemap
integration and image tooling, and it leaves room for editorial content later. To keep a single toolchain, the plan ports the
130-line `build.py` assembly (and the intro J module `j.py`) to a Node script. A golden-output test proves the port: the
Node-assembled app must match today's Python output byte for byte before anything else changes.

**Rejected:**
- O1 Python, by the operator's choice.
- O3 Eleventy: no advantage over Astro here, and its governance changed in 2026.
- O4: puts the wrong runtime on every page.
- Workers static assets instead of Pages: clean-URL redirects become 307, and Pages already works here.

### Page architecture (Astro)
- **Layout**: an Astro project at the repo root, with `publicDir: 'static'` because the existing `public/` is what Pages serves until the build switch.
  - `src/pages/index.astro`, `releases.astro`, `cat/[cat].astro`, `artist/[slug].astro` and `404.astro`;
  - `src/content.config.ts` loads `site/data/catalog.json` through a file loader;
  - `astro.config.mjs` sets `site: 'https://section8recs.com'`, `build.format: 'file'`, `trailingSlash: 'never'`,
    `outDir: 'dist'`, and `@astrojs/sitemap`;
  - `.node-version` pins Node 24 LTS (Astro needs >=22.23.4).
- **App bundle**: `scripts/bundle-app.mjs`, the Node port of `site/build.py`, writes:
  - `static/app/app.<hash>.js` (the current module, plus a small router shim);
  - `static/app/app.<hash>.css`;
  - `static/app/catalog.<hash>.json` (the compact client catalogue for both labels, about 120 KB raw, about 25 KB gzip);
  - a manifest the Astro layout reads to emit the script and link tags.
  Every page shares those cached files, so per-page HTML is about 10–20 KB instead of 340 KB.
- **Route boot**: each page embeds
  `<script type="application/json" id="s8-route">{"view":"release","c":"SECTION8116"}</script>`. The app reads it on boot, preselects
  the release, and the gate offers "Play *Riders LP*" (browsers still need one gesture before audio).
  - In the app, opening a release calls `history.pushState('/cat/<CAT>')` and updates `document.title`.
  - `popstate` restores the view without stopping audio.
  - A track deep link is `/cat/<CAT>?t=<n>`, with the canonical staying `/cat/<CAT>`.
- **Labels in the experience**: one archive holds both labels. Releases show their label (Section 8 Recordings / Section 8
  Bass), and the archive can filter by label. Counts such as "139 recordings" come from the data.
- **Crawlable content**: a **visible** release dossier in the gate's scroll area, the same place the home page links live today.
  It holds:
  - cover `<img>` (400 px CDN variant, with alt text);
  - title (h1), artist links, label, catalogue number, date and genres;
  - description and the tracklist (each item a play button);
  - store links.
  Artist pages and `/releases` use the same pattern. Without JS or WebGL they read as normal pages.

## Target URL scheme
| URL | Content | Source |
|---|---|---|
| `/` | Home: the immersive experience (intro J), plus crawlable label text, latest releases and links below | existing |
| `/releases` | Crawlable index of all 245 releases by year, filterable by label. Opens the archive view in the app | new (lgsites had one) |
| `/cat/<CAT>` | Release page; the canonical is exactly as today, uppercase as stored in LabelGrid, for both labels | kept / restored |
| `/artist/<slug>` | Artist page with their releases on both labels and MusicGroup JSON-LD. The slug comes from `artist_name`; on a collision (`a-tech`), the later artist id gets a `-<id>` suffix | new (D3) |
| `/sitemap-index.xml` (+ `/sitemap.xml` 301), `/robots.txt`, `/404.html` | Generated | new |
| `/classic` | The old about page | existing |
| `/podcast-rss`, `/podcast` | **404** (retired, D4) | retired |

### Redirect map (Pages `_redirects`, generated at build; draft v2 in `evidence/redirects-draft.txt`)
- **Static** (696, limit 2,000):
  - `/r/section8recs/<id>` → `/cat/<CAT>` (label 1);
  - `/r/<lgsites-slug>/<id>` → `/cat/<CAT>` for all 245 releases;
  - 229 archived `/r/<slug>/<id>` pairs → `/cat/<CAT>`;
  - `/cat/<lowercase>` → `/cat/<CAT>` for every release, plus requested mixed-case variants;
  - `/cat/SECTION8DUB43D` → `/cat/SECTION8DUB043D`.
- **Dynamic** (9, limit 100):
  - `/section8recs/cat/:cat`, `/player/cat/:cat`, `/player/:cat` and `/cat/:cat/*` → `/cat/:cat` (301; the last covers
    `thanks`, `cancelled` and `SECTION8DUB054D/1911`);
  - `/section8recs[/releases]` → `/` or `/releases`;
  - `/r/:slug/:id/*` → `/releases`;
  - `/checkout` → `/releases` (301);
  - `/latest` → `/releases` (302).
- **Deliberately 404**:
  - unknown catalogues (`SECTION8116S2`, `SECTION8FREE01`, test values);
  - 3 dead `/r/` pairs;
  - `/podcast-rss`, `/podcast` and `/podcast-00N-*` (D4);
  - `/dropbox` (D7);
  - scanner paths.
- **Host redirects** (zone wildcard Single Redirect rules; the Free plan allows 10,
  https://developers.cloudflare.com/rules/url-forwarding/):
  - `https://www.section8recs.com/*` and `https://dl.section8recs.com/*` → `https://section8recs.com/${1}` 301;
  - `https://about.section8recs.com/*` → the same, after cutover (D6).
- **Takedowns**: a release that disappears from the API goes on a tombstone list. Its page returns 404 and its redirects are
  dropped.

## Data sync design
- **`scripts/sync.mjs`** (Node, built-in `fetch`, explicit User-Agent `section8recs-site-sync/1.0`):
  - `GET /api/public/labels`, the owner-scoped list, which today returns labels 1 and 4. The sync expects exactly that set and
    fails on any change, so a new label is an explicit decision.
  - For each label, pages `GET /api/public/releases?filter[label_id]=<id>&per_page=100&page=N` until `meta.last_page`.
  - Reads `site-settings/links/{id}` for label social links.
  - **Allowlist projection**:
    - release: `id, public_id, cat, label{id, slug, name}, title, mix_version, display artist, artists[{id, name, role}],
      release_date, genres, description, cover url + ts, short_url, store links` (non-empty http(s) only, `"0"` dropped);
    - track: `id, track_num, title, display artist, preview url, filename`;
    - label: `name, logo, social links`.
    Nothing else is written, which keeps emails, revenue share and similar fields out of git.
  - Writes `site/data/catalog.json` with stable sort order, so diffs are readable.
  - `site/data/overrides.json` holds editorial fixes: title spacing, the "Deezer" link that points to trackitdown, any hidden release.
- **Social cards**: for each release whose cover `ts` changed, the sync fetches the 800 px cover and writes a 1200×630 JPEG to
  `static/og/<CAT>-<ts>.jpg` with `sharp`. The card is the cover on a blurred, darkened copy of itself, with no text. Cards are
  committed with the data, so the Pages build stays offline and deterministic.
- **Validation before writing** (any failure exits non-zero and writes nothing):
  - every page returns HTTP 200, the count per label equals `meta.total`, and the label set is exactly {1, 4};
  - every release has `cat`, `title`, a date and at least one track with a preview URL;
  - catalogue numbers are unique across both labels;
  - no label lost more than 3 releases versus the last good catalogue. Larger drops go to a PR instead of `main`;
  - every key in the app's `DEFAULT_CONFIG` still resolves;
  - no forbidden key appears in the output.
- **Runner**: `.github/workflows/sync.yml`, on `schedule: '17 6 * * *'` (UTC), `workflow_dispatch` and
  `repository_dispatch: labelgrid-release`. It:
  1. runs sync;
  2. runs `npm run build` and the checks (meta checker, redirect self-check, link check of every page);
  3. commits `site/data/catalog.json`, `site/data/tombstones.json` and `static/og/*` to `main` only if they changed. The Pages Git
     build then deploys.

  The token is `LABELGRID_API_TOKEN`, an Actions secret that is never echoed. Logs show counts and catalogue numbers only. Forks and
  PR workflows never receive the secret.
- **Liveness**:
  - If the last data commit is older than 30 days, the run commits `site/data/.heartbeat`.
  - A run that hasn't succeeded in 72 h opens an issue.
  - From 2027-09-24 the run opens an issue saying the token expires on 2027-10-24.
- **Later (optional)**: a LabelGrid `release.distributed` webhook goes to a Worker that verifies the HMAC and calls
  `repository_dispatch`.

## SEO and social checklist
- **Release title**: `<Title> by <Artist> [<CAT>] · <Label name>` (Section 8 Recordings or Section 8 Bass).
- **Release description**: `description_long` cut at a sentence boundary, 160 characters maximum. When it's empty, a generated
  sentence from title, artist, track count, genres, date and label.
- **Artist page**: title `<Artist> · Section 8 Recordings`, and a description listing their release count and latest release.
- **Canonical and `og:url`**: absolute URLs on every page.
- **Card tags**: `og:image` = the generated card (with width, height and alt), `twitter:card=summary_large_image`,
  `twitter:image`.
  - Card filenames carry the cover `ts`, so a cover change busts the X and Facebook caches.
  - Home keeps `og.jpg`. `/releases` and artist pages use a cover grid or the artist photo, falling back to the label card.
- **JSON-LD**:
  - release: `MusicAlbum` (`byArtist` MusicGroup, `datePublished`, `numTracks`, `track` ItemList of `MusicRecording`,
    `albumRelease` MusicRelease with `catalogNumber` and `recordLabel`, `sameAs` = store links);
  - artist: `MusicGroup` (`sameAs` Spotify/Apple ids when present);
  - home: `Organization` with both labels as `subOrganization`, plus `WebSite`.
- **Indexing files**:
  - Real 404s, with a test asserting unknown paths return 404.
  - `robots.txt` with a `Sitemap:` line.
  - Sitemap with every page and an `image:loc` cover per release.
- **`_headers`**: `X-Robots-Tag: noindex` on `https://:project.pages.dev/*`, `https://:version.:project.pages.dev/*`, and
  `https://about.section8recs.com/*` until cutover.
- **Podcast retired (D4)**: `/podcast-rss` returns 404. SECTION8POD13 stays a normal release page. The operator removes the show
  from Apple Podcasts Connect / Spotify for Creators if it's listed; the plan includes a checklist item to check for listings.
- **Search Console**: the property is DNS-verified. Submit the sitemap at cutover and watch Page indexing for 4 weeks.

## Phased rollout
Detailed in `.planning/static-site-astro-migration.md`. In summary:
1. **Astro skeleton and app port**, golden-tested.
2. **Sync for both labels** and the first data PR.
3. **Pages, routing and redirects**.
4. **SEO and cards**.
5. **Pages build switch and staging on about.**
6. **Cutover**: Pages custom domain, www/dl redirect rules, apex DNS swap, URL-list crawl.
7. **Monitor and decommission lgsites** for this domain.

That's about 6 agent-days, plus 2–4 weeks of monitoring. Rollback is restoring the apex `A 157.90.158.72` record; lgsites stays
untouched until phase 7.

## Bot and scanner noise (side note; no decision taken)
Static assets are free on Pages, and probes get a cheap 404. If noise still matters after cutover, add a free WAF custom rule that
blocks `*.php`, `/.env*`, `/.git*` and `/wp-*`. Bot Fight Mode can challenge unverified link-preview fetchers, so it isn't recommended.

## Locked Decisions
- **D1** (operator, 2026-10-24): Astro 7 static generation on Cloudflare Pages. The Python assembly is ported to Node.
- **D2** (operator): include both labels on the section8recs LabelGrid account, label 1 `section8recs` and label 4 `section8dub`
  ("Section 8 Bass"), all at `/cat/<CAT>`.
- **D3** (operator): artist pages at `/artist/<slug>`.
- **D4** (operator): retire the podcast feed; `/podcast-rss` returns 404.
- **D5** (operator, executed 2026-10-24): dedicated token `section8recs-static-site-sync-v2`, created via computer use and
  expiring 2027-10-24, stored as Actions secret `LABELGRID_API_TOKEN`.
- **D6** (default, not yet confirmed by the operator): about.section8recs.com 301s to the apex after cutover.
- **D7** (default, not yet confirmed by the operator): `/dropbox` is dropped and returns 404.

## Assumptions
- Both labels change rarely, so a daily sync is enough.
- LabelGrid keeps serving covers and previews from `cdn-prod-1.labelgrid.com` with CORS open. Verified for both labels'
  previews on 2026-10-24.
- The X handle `@section8recs` is unconfirmed; it's used only for `twitter:site`.

## Residual Unknowns
| Unknown | Risk | Revisit |
|---|---|---|
| Where the lgsites proxy maps section8recs.com | Low | Phase 7 |
| How Google has indexed `/r/` versus `/cat/` (no GSC access) | Medium | Phase 6: check GSC before and after |
| Whether a `GITHUB_TOKEN` heartbeat commit counts as activity for the 60-day rule | Medium | Phase 2: if unconfirmed, add a Cloudflare Worker cron that calls `workflow_dispatch` |
| Whether Pages replaces the apex A record itself in the custom-domain flow | Low | Phase 6 dry run |
| Whether the podcast is listed in any directory | Low | Phase 7 checklist |

## Risks
- **R1 Token has full write scope.** Abilities are `*`, and the public API can delete labels. Mitigations:
  - the token exists only in the Actions secret and the local 0600 env file;
  - the sync only issues GETs;
  - recommend a lgapi change to support read-only abilities (separate ticket for LabelGrid).
- **R2 Filename-keyed curation.** The build check catches broken `DEFAULT_CONFIG` keys. Long term, key by track id.
- **R3 Mass takedown or API anomaly.** A per-label drop guard routes large drops to a PR.
- **R4 Visible-content design.** The dossier is user-visible design work, so the operator reviews it on about. before cutover.
- **R5 Cutover misses www/dl.** The host redirect rules are created before the DNS swap and are part of the exit crawl.
- **R6 Silent cron death.** Heartbeat, a staleness issue, and an expiry-warning issue.
- **R7 Private label fields in a public repo.** Allowlist projection plus a test for forbidden keys.
- **R8 CDN User-Agent block.** The sync and card generation send an explicit UA, and a fetch failure fails the run.
- **R9 Node version drift.** `.node-version` pins Node 24 in both CI and Pages.
- **R10 Doubling the archive (139 → 245 releases).** Search, queue and archive UI must stay usable. The responsive test runs on
  the full catalogue.

## Scope
**IN**:
- Astro migration, with the app assembly ported to Node;
- both labels in the catalogue, and artist pages;
- URL preservation and redirects; 404, sitemap and robots;
- the 24 h sync with social cards; OG and JSON-LD;
- retiring the podcast feed;
- staging on about., the apex cutover, and lgsites decommission for this domain.

**OUT**:
- scene, audio or visual redesign beyond the dossier, label filter and route shim;
- store or checkout;
- editorial content;
- lgsites fixes beyond the reported leak;
- bot protection beyond the side note;
- a read-only-token feature in lgapi (recommended separately).

## Plan Handoff
Plan: `.planning/static-site-astro-migration.md`.

```text
Implement .planning/static-site-astro-migration.md; honor .planning/DISCOVERY-static-site.md; track material deviations and stop on architecture, user-visible, high-stakes, or irreversible changes.
```
