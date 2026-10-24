---
subject: Move section8recs.com onto the immersive design, statically hosted, with LabelGrid data synced every 24 h
status: awaiting-decisions
updated: 2026-10-24T00:15:00Z
source: free-text (operator request, relayed from the source thread)
plan: null
---

# Discovery: section8recs.com on the immersive design, statically hosted

## Recommendation in one paragraph

Generate the site statically with the existing Python build, extended with Jinja2 templates and Pillow, and keep serving it from
the Cloudflare Pages project that already serves about.section8recs.com. Every release keeps its current URL, `/cat/<CATALOG>`.
Each one becomes a real HTML file (about 15 KB) with its own title, description, canonical, Open Graph/Twitter card, JSON-LD and
visible release text, and it loads one shared, cached copy of the immersive app. The app opens with that release selected and
uses `history.pushState` while browsing, so audio never stops between "pages". A GitHub Actions job runs every 24 h. It fetches the
LabelGrid API with a dedicated token, keeps only an allowlist of public fields, validates the result and commits the data only when
it changed. Pages then deploys that commit. A failed or suspicious sync commits nothing, so the live site always shows the last good data.
A generated `_redirects` holds the 449 legacy and variant URLs. `404.html` turns on real 404s, and the build also writes `sitemap.xml`,
`robots.txt` and the podcast feed. The cutover happens after a pre-flight crawl of the preview. It changes one DNS record and adds three
redirect rules, and rollback is restoring that one record. Estimated effort is 4 to 5 working days, plus 2 to 4 weeks of monitoring.

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
changes at most daily. With about 140 pages, a full rebuild takes seconds. SSR or edge functions would only add value for
per-request personalisation or data fresher than 24 h, and nothing here needs either. A Pages Function stays available later for
a single dynamic route if one appears; Functions requests count against a free quota of 100k per day.

### Stack options
| | O1 Python build + Jinja2 + Pillow (**recommended**) | O2 Astro 7 SSG | O3 Eleventy 3 | O4 Next 16 export / Nuxt 4 generate |
|---|---|---|---|---|
| Crawlable HTML and per-page meta | Yes, templates | Yes | Yes | Yes |
| OG/Twitter, JSON-LD, sitemap, RSS | Written by hand: about 150 lines in total for sitemap, RSS and JSON-LD | Integrations: `@astrojs/sitemap`, `@astrojs/rss` | Plugins or hand-written | Partly built in; `_redirects`/headers not supported in export |
| Fit with the existing bundle | Native: `build.py` already assembles it, and the page templates just wrap it | `is:inline` ships it untouched, but GLSL patching stays in Python or gets ported to Node | Passthrough copy, same as Astro | Poor: a React/Vue runtime on every page, fighting a vanilla app |
| Toolchain | One (Python 3 stdlib + 2 pinned libraries) | Python (bundle) + Node (pages), or a port of `build.py` | Python + Node | Node plus a framework runtime |
| Build time (~150 pages) | Seconds | Seconds to tens of seconds | Seconds | Tens of seconds |
| Maintenance | Lowest; nothing to upgrade but 2 libraries | Medium: majors yearly (6→7 in 2026) | Medium; project governance uncertain after the rename | Highest |
| Cloudflare Pages fit | Static folder | Static folder (and Astro is now a Cloudflare project) | Static folder | Static folder |

**Why O1.** The site's hard part is the immersive app, and it already has a working, assertion-checked Python build that does
GLSL surgery a generator can't replace. The pages around it are simple: about 140 releases, one index, a home page, perhaps 80
artists, a sitemap, a feed and a 404. Adding a second toolchain and a framework release cadence to render that is cost without
benefit. O1 also keeps the "single command builds `public/`" property that Pages, the previews and the responsive test rely on.

**Rejected:**
- **O2 Astro** is the strongest alternative. Move to it if the site grows into editorial content (news, interviews, artist bios
  with rich text) or needs component-level templating. Porting later is cheap, because the data contract and URL scheme don't change.
- **O3 Eleventy** offers no advantage over O1, and its governance changed in 2026.
- **O4** puts the wrong runtime on every page and can't express `_redirects` in export mode.
- **Workers static assets instead of Pages** would make clean-URL redirects 307 (temporary) by default and needs Workers Builds set
  up again. Pages already works here, so stay on Pages. Moving later is a migration Cloudflare documents.

### Page architecture (O1)
- `build.py` emits:
  - `assets/app.<hash>.js` (the current module, unchanged apart from a router shim), `assets/app.<hash>.css` and
    `assets/catalog.<hash>.json` (the client catalogue, about 70 KB, gzip about 15 KB);
  - per-route HTML from Jinja2 templates.
  All pages share the cached app, so per-page HTML is about 10–20 KB instead of 340 KB.
- Each page embeds `<script type="application/json" id="s8-route">{"view":"release","c":"SECTION8116"}</script>`. On boot, the app
  reads it, preselects the release, and the gate offers "Play *Riders LP*" (browsers still need one gesture before audio).
- Inside the app, opening a release calls `history.pushState('/cat/<CAT>')` and updates `document.title`. `popstate` reopens the
  previous view without stopping audio. A track deep link is `/cat/<CAT>?t=<n>`, with the canonical staying `/cat/<CAT>`.
- Crawlable content is a **visible** release dossier in the gate's scroll area, the same place the home page links live today. It
  holds:
  - cover `<img>` (400 px CDN variant, with alt text);
  - title (h1), artist, catalogue number, date and genres;
  - description and the tracklist (each item a play button);
  - store links;
  - links to `/releases` and the artist pages.
  Without JS or WebGL it reads as a normal page, and `body.nogl` already exists.

## Target URL scheme
| URL | Content | Source |
|---|---|---|
| `/` | Home: the immersive experience (intro J), plus crawlable label text, latest releases and links below | existing |
| `/releases` | Crawlable index of all releases by year (cover, title, artist, cat). Opens the archive view in the app | new (lgsites had one) |
| `/cat/<CAT>` | Release page; the canonical stays exactly as today, uppercase as stored in LabelGrid | kept |
| `/artist/<slug>` | Artist page: their releases, MusicGroup JSON-LD (**D3**) | new, optional |
| `/podcast-rss` | RSS 2.0 + iTunes feed, rewritten from `/podcast.xml` (**D4**) | revived |
| `/sitemap.xml`, `/robots.txt`, `/404.html` | Generated | new |
| `/classic` | The old about page | existing (`public/classic.html`) |

### Redirect map (Pages `_redirects`, generated each build; draft in `evidence/redirects-draft.txt`)
- **Static** (449 now, limit 2,000):
  - `/r/section8recs/<id>` → `/cat/<CAT>` (139);
  - `/r/<lgsites-slug>/<id>` → `/cat/<CAT>` (139, slug = artist + title, lowercased and hyphenated);
  - the 134 archived `/r/<slug>/<id>` pairs → `/cat/<CAT>`;
  - `/cat/<lowercase>` → `/cat/<CAT>` for every release.
  Analytics ids are merged into the map at each build.
- **Dynamic** (11, limit 100):
  - `/section8recs/cat/:cat`, `/player/cat/:cat`, `/player/:cat`, `/cat/:cat/thanks`, `/cat/:cat/cancelled` → `/cat/:cat` (301);
  - `/section8recs[/releases]` → `/` or `/releases` (301);
  - `/checkout` → `/releases` (301);
  - `/latest` → `/releases` (302, since it was never a real page);
  - `/podcast-rss` → `/podcast.xml` (200 rewrite).
- **Deliberately 404**: retired catalogues (DUB/BASS/FREE, 98 dead `/r/` pairs), `/dropbox` (**D7**) and scanner paths.
  Redirecting removed pages to `/releases` would itself be reported as a soft 404.
- **Host redirects** (zone wildcard Single Redirect rules such as `https://www.section8recs.com/*` → `https://section8recs.com/${1}`, since Pages can't redirect across hosts; the Free plan allows 10, https://developers.cloudflare.com/rules/url-forwarding/):
  - `www.section8recs.com/*` → `https://section8recs.com/${path}` 301;
  - `dl.section8recs.com/*` → the same;
  - `about.section8recs.com/*` → the same, **after** cutover (**D6**).
- **Takedowns**: when a release disappears from the API, the sync keeps a tombstone list. Its `/cat/` URL returns 404 and its
  redirects are dropped, so nothing redirects to a 404.

## Data sync design
- **`site/sync.py`** (stdlib `urllib`):
  - resolves label 1 and pages `GET /api/public/releases?filter[label_id]=1&per_page=100&page=N` until `meta.last_page`;
  - reads `labels/{id}` and `site-settings/links/{id}` for label links and the podcast URL;
  - projects to an **allowlist**: release `id, cat, title, mix_version, artist, artists[], release_date, genres, description,
    cover url + ts, short_url, store links (non-empty, valid http(s), dropping "0")`; track
    `id, track_num, title, display artist, preview url, filename`; label `name, logo, social links`;
  - writes `site/data/catalog.json` with sorted keys and stable order, so diffs are readable;
  - `site/data/overrides.json` holds editorial fixes: title spacing, the mislabelled "Deezer" link that points to trackitdown,
    hidden releases.
- **Client data**:
  - The build derives the compact client array the app already reads (`c,a,t,d,s,ar,x,tr`), so the app code doesn't change.
  - `tr` entries become `[title, file, trackId]`, and `MP3 + file` is replaced by the API's `preview_file.url`, which supports UUID names.
  - `site/data/data.json` is retired after the first reviewed sync.
- **Validation before writing** (any failure exits non-zero and writes nothing):
  - HTTP 200 on every page, and the item count equals `meta.total`;
  - every release has `cat`, `title`, a date and at least one track with a preview URL; catalogue numbers are unique;
  - the count hasn't dropped by more than 3 versus the last good catalogue. Larger drops open a PR for review instead of
    committing to `main`;
  - every key in the app's `DEFAULT_CONFIG` still resolves (U3).
- **Runner**: `.github/workflows/sync.yml` runs on `schedule: '17 6 * * *'` (UTC, away from :00), `workflow_dispatch`, and
  `repository_dispatch: labelgrid-release`. It:
  1. runs sync, build and checks (meta checker, redirect self-check, link check of every `/cat/` page);
  2. commits `site/data/catalog.json` and `public/` to `main` only if the diff is non-empty;
  3. lets the Pages Git integration deploy, as it does today.

  The token is `LABELGRID_API_TOKEN`, stored as an Actions secret and never echoed. Logs print only counts and catalogue numbers.
- **Keep the last good data**: the live site is whatever `main` holds. A failed run commits nothing, and GitHub emails on failure.
- **Liveness** (U5): if the last data commit is older than 30 days, the run commits `site/data/.heartbeat` (a timestamp). That
  keeps the cron alive in a public repo and costs about one extra Pages build a month (500 are free). A run that hasn't succeeded
  in 72 h opens an issue.
- **Later (optional, P6)**: a LabelGrid webhook `release.distributed` goes to a tiny Worker that verifies the HMAC and calls
  `repository_dispatch`, so new releases appear within minutes instead of within 24 h.
- **Why not Cloudflare cron + deploy hook**: it would fetch the API inside the Pages build, so data history, diff review and
  data-level rollback would all be lost. It would also put the API token in Pages build env. GitHub Actions keeps the data in git,
  where every change is reviewable and revertible.

## SEO and social checklist
- **Release title**: `<Title> by <Artist> [<CAT>] · Section 8 Recordings` (drop "LabelGrid").
- **Release description**: `description_long` cut at a sentence boundary, 160 characters maximum. When it's empty (45 of 139),
  generate "<Title> by <Artist>, <n> tracks of <genres>, released <Mon YYYY> on Section 8 Recordings."
- **Canonical and `og:url`**: absolute `https://section8recs.com/cat/<CAT>` on every page. Home, `/releases` and artist pages
  have their own.
- **OG image**:
  - A generated 1200×630 JPEG per release: the cover on a blurred, darkened copy of itself, with a small "S8" mark and no other
    text. Apple advises against text in previews.
  - Pillow builds it at build time from the 800 px cover and caches it by cover `ts`.
  - It's referenced as `og:image` with width and height, `og:image:alt`, `twitter:card=summary_large_image` and `twitter:image`.
  - The filename includes the hash, so a cover change gets a new URL and busts the X (7 d) and Facebook caches.
  - Home keeps `og.jpg`. `/releases` gets a cover-grid card.
- **Other social meta**: `og:type` is `music.album` on releases and `website` elsewhere. Also `og:site_name`,
  `music:release_date`, `theme-color`, and `twitter:site` if the operator confirms the X handle.
- **JSON-LD**:
  - release: `MusicAlbum` (`byArtist` MusicGroup, `datePublished`, `numTracks`, `track` ItemList of `MusicRecording`, `image`,
    `albumRelease` MusicRelease with `catalogNumber`, `recordLabel` Organization, and `sameAs` = store links);
  - home: `Organization` plus `WebSite`;
  - artist: `MusicGroup`;
  - podcast: `PodcastSeries` if revived.
  There's no rich result to win, but it helps entity understanding and costs nothing.
- **Real 404s**: `public/404.html`, styled, with links to `/` and `/releases`. A test asserts unknown paths return 404.
- **`robots.txt`**: `Allow: /` and `Sitemap: https://section8recs.com/sitemap.xml`. Cloudflare's managed content signals stay
  if the operator wants them.
- **`sitemap.xml`**: `/`, `/releases`, every `/cat/<CAT>` and every artist page, with `lastmod` = the release's last data change
  (only when it's accurate), plus an `image:loc` cover per release.
- **`/podcast-rss`**: RSS 2.0 with iTunes and `atom:link self`. `guid` = the release `public_id` (stable), the enclosure is the
  preview URL, and the episodes are releases whose `cat` contains `POD` (**D4**).
- **Indexing control**: `_headers` sets `X-Robots-Tag: noindex` on `https://:project.pages.dev/*` and `https://:version.:project.pages.dev/*` (the documented pattern for pages.dev and branch previews) and, until cutover,
  on `https://about.section8recs.com/*`, so staging never competes with the apex.
- **Search Console**:
  - The domain property is DNS-verified (TXT records stay), so nothing to re-verify.
  - At cutover, submit `sitemap.xml` and spot-check a few URLs with URL Inspection.
  - Watch Page indexing and 404s for 4 weeks.
  - Change of Address isn't used, since the domain stays the same.
- **Pre-cutover validation**:
  - Rich Results Test / Schema validator on 3 pages;
  - X, Facebook, LinkedIn and Discord preview checks on 3 releases;
  - Lighthouse SEO and a11y on `/`, `/releases` and one release;
  - the responsive test extended to a release page.

## Phased rollout (estimates are focused agent-days)
| Phase | Work | Effort | Exit check |
|---|---|---|---|
| P1 Pages and routing | Split the build into app bundle and templates; route shim and pushState; release dossier; `/releases`; `404.html`; robots; sitemap; generated `_redirects`; `_headers` noindex for previews and about. Built from the current `data.json` | 1.5 d | Preview: all 139 pages return 200 with correct meta; all 449 legacy URLs return 301 to the right page; unknown paths 404; the responsive test passes on home and one release |
| P2 Data sync | `sync.py`, allowlist, overrides, validation, workflow, secret, heartbeat. The first sync goes to a PR diffed against the scraped `data.json` | 1 d | The operator approves the first data PR; a forced-failure run commits nothing |
| P3 SEO and social | OG card generation, JSON-LD, description fallback, podcast feed (D4), artist pages (D3), external validators | 1 d | Validators are clean; previews render on X, FB, Discord and iMessage |
| P4 Staging on about. | P1–P3 deploy to about.section8recs.com (noindex) for the operator to review on real devices | 0.25 d + review | Operator sign-off |
| P5 Cutover | (1) Add `section8recs.com` as a Pages custom domain. (2) Create the www/dl Single Redirect rules. (3) Replace apex `A 157.90.158.72` with `CNAME section8recs.pages.dev` (proxied); wait for Pages to validate. (4) Re-crawl the apex with the evidence URL list. (5) Add the about→apex redirect and drop the about noindex. (6) Submit the sitemap. Go at a low-traffic hour; the edge serves the change within seconds because the records are proxied | 0.5 d | Same URL-list crawl on the apex passes; analytics show no rise in 404s on real paths |
| P6 Monitor and decommission | 2–4 weeks on Search Console and analytics. Then remove section8recs.com from the lgsites proxy/domain config, update podcast directories if D4 changes the feed, retire the old `www` A record target | 0.25 d spread out | Indexed `/cat/` count steady; no lgsites traffic for the domain |
| P7 Optional | Webhook relay for near-real-time releases; bot rules (side note) | 0.5 d | |

**Total**: about 4.5–5 agent-days, plus operator review and 2–4 weeks of monitoring.

**Rollback**:
- Before P5 step (3), nothing user-visible has changed.
- After it, restore the apex `A 157.90.158.72` record (one API call, effective within seconds while proxied). lgsites stays running
  untouched until P6, so rollback stays available for the whole monitoring window.
- Data rollback is `git revert` of a sync commit.

**What changes for lgsites**: nothing until P6. Then the section8recs.com mapping (the upstream proxy that sets the `slug` header;
its location is INCONCLUSIVE, outside the lgsites repo) is removed. lgsites stays live for other labels. The label-object leak (U9)
should be fixed in lgsites regardless.

## Bot and scanner noise (side note; no decision taken)
Static assets on Pages are free and unlimited, and probes will get a cheap real 404 instead of a 760 KB SSR render, so the cost
problem mostly disappears at cutover. Options, in increasing strength:
1. Do nothing.
2. A free WAF custom rule (5 on Free) that blocks `*.php`, `/.env*`, `/.git*`, `/wp-*` and similar paths.
3. Bot Fight Mode. Verified bots such as Googlebot and Twitterbot are allowed, but it can challenge unverified preview fetchers
   (some chat apps).
4. Rate-limiting rules.

Recommendation: option 2 at P6, if analytics noise still matters.

## Locked Decisions
None yet. The operator's answers to D1–D7 lock them.

## Operator decisions needed
- **D1 Stack**: Python + Jinja2 (O1, recommended), or Astro 7 (O2) if you expect editorial content soon.
- **D2 Catalogue scope**: only the 139 releases the API returns for label 1 (recommended). The old SECTION8DUB/BASS/FREE
  catalogues still draw crawler requests but aren't in LabelGrid's list for this label. Should any of them come back, for example
  as another LabelGrid label?
- **D3 Artist pages**: add `/artist/<slug>` (recommended in P3; 89 display-artist strings, individual artists from `artists[]`),
  or keep releases only.
- **D4 Podcast**:
  - revive `/podcast-rss` as a valid feed of the POD releases (1 episode today; recommended only if you'll publish more), or
  - retire it: serve 404 and remove the show from Apple/Spotify.
  The current feed has been broken for years either way.
- **D5 API credential**: who mints a dedicated LabelGrid API token on an account with `api_access` that owns label 1, stored as the
  repo's `LABELGRID_API_TOKEN` Actions secret (recommended over reusing lgsites' service token). This blocks P2 only.
- **D6 about.section8recs.com after cutover**: 301 to the apex (recommended), or keep it as a separate site.
- **D7 `/dropbox` demo upload**: drop it with a 404 (recommended, since `enable_demos_inbox` is false), or point demos to an email
  address on a `/demos` page.
- **Timing**: when to cut over. Any weekday at a low-traffic hour works, and nothing else is needed from you.

## Assumptions
- About 140 releases changing rarely means daily sync is ample. Webhooks are optional.
- LabelGrid keeps serving covers and previews from `cdn-prod-1.labelgrid.com` with CORS open. That's verified for previews on
  pages.dev and about; covers are plain `<img>`, so CORS doesn't apply to them.
- The operator's X handle is `@section8recs`. Unconfirmed; it's only used for `twitter:site`.

## Residual Unknowns
| Unknown | Risk | Revisit |
|---|---|---|
| Where the lgsites proxy maps section8recs.com (sets `slug`) | Low: only matters for decommission | P6 |
| Whether lgapi tokens support read-only abilities | Low: affects token blast radius only | D5 / P2 |
| Release `content_type` and whether singles/EPs/LPs need distinct schema | Low | P3 |
| How Google has indexed `/r/` versus `/cat/` (no GSC access in this session) | Medium: affects how long to watch redirects | P5: check GSC Page indexing before and after |
| Whether a heartbeat commit pushed by `GITHUB_TOKEN` counts as repository activity for GitHub's 60-day rule (the docs don't say) | Medium: the cron could still lapse | P2: if not confirmed, trigger `workflow_dispatch` from a Cloudflare Worker cron instead (5 free crons) |
| Whether Pages auto-replaces the apex A record in the custom-domain flow, or needs it removed first (community reports only) | Low: either way it's one record | P5 dry-run in the dashboard |

## Risks
- **R1 Token availability** (D5) blocks P2. P1 and P3 run on committed data meanwhile.
- **R2 Filename-keyed curation** (U3). If LabelGrid re-transcodes, the curated defaults vanish. The build check catches it; long
  term, key by track id.
- **R3 Mass takedown or API anomaly** could empty the site. The count guard routes large drops to a PR.
- **R4 Visible-content design**: the dossier must be part of the immersive design, not hidden text. It's user-visible design work,
  so the operator reviews it at P4.
- **R5 Cutover misses www/dl**: the host redirect rules are created before the DNS swap and are part of the P5 exit crawl.
- **R6 Silent cron death** (U5): heartbeat plus a staleness issue.
- **R7 Publishing private label fields** (U4): allowlist projection, and a test asserts the forbidden keys are absent from
  `catalog.json`.
- **R8 Heavier first load for crawlers**: the WebGL app is about 270 KB of JS, but the HTML already carries all content and meta,
  so rendering isn't needed for indexing.

## Scope
**IN**: page generation, URL preservation and redirects, the 404, sitemap, robots and feed, the 24 h sync, OG and JSON-LD,
staging on about., the apex cutover, and lgsites decommission for this domain.

**OUT**: changes to scenes, audio or the visual design beyond the release dossier and route shim; store/checkout (sales stay on
Bandcamp and the DSPs); new editorial content; fixing lgsites for other labels (except the reported leak); bot protection beyond
the side note.

## Plan Handoff
After D1–D7 are answered: lock them above, set `status: ready-to-plan`, and write the implementation plan with planf3 from this
file.

```text
Implement <plan-path>; honor .planning/DISCOVERY-static-site.md; track material deviations and stop on architecture, user-visible, high-stakes, or irreversible changes.
```
