# Crawl of section8recs.com (2026-10-24 UTC)

216 polite requests (UA `section8recs-migration-audit/1.0`), BFS depth ≤3 from `/`, plus probes and Wayback CDX lookups.
Raw HTML and `window.__NUXT__` captures are git-ignored (size, and the lgsites state embeds private label fields).

- `crawl.py`, `nuxt_extract.js`: the crawler and the `__NUXT__` state extractor
- `urls.csv`, `pages.jsonl`: every URL with status, redirects and head metadata (title, description, canonical, og/twitter, JSON-LD)
- `probes.jsonl`, `notfound.jsonl`, `extra.jsonl`: feed/sitemap/robots probes, 404 behaviour, unlinked lgsites routes
- `historical-r-slugs.json`: archived `/r/<slug>/<id>` pairs mapped to current catalogue numbers
- `links.json`, `images.json`, `routes.json`, `robots.txt`, `wayback-podcast*.json`

Findings are summarised in `../../DISCOVERY-static-site.md` (Evidence).
