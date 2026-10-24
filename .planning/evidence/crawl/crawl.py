#!/usr/bin/env python3
"""Read-only migration audit crawler for section8recs.com.

Polite: single-threaded, >= 0.6s between requests, identifying User-Agent,
hard cap of 600 requests total (persisted in .reqcount across runs).

Outputs (in this directory):
  probes.jsonl      step 1 well-known URLs, redirect chains, about.* headers
  pages.jsonl       step 2/3 per-page SEO record
  urls.csv          flat URL inventory
  notfound.jsonl    step 4 404 behaviour
  podcast-rss.xml   step 5 raw feed; podcast.json parsed facts
  routes.json       route patterns found in the Nuxt JS bundles
  nuxt/<slug>.json  window.__NUXT__ state for a few sample pages
  samples/*.html    raw HTML for a few sample pages
  images.json       artwork image dimensions (sampled)
"""
import csv
import json
import os
import re
import struct
import subprocess
import sys
import time
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "section8recs-migration-audit/1.0 (+team@section8recs.com)"
DELAY = 0.6
CAP = 600
HOST = "section8recs.com"
ROOT = "https://section8recs.com/"
MAX_DEPTH = 3
COUNT_FILE = os.path.join(HERE, ".reqcount")

S = requests.Session()
S.headers.update({"User-Agent": UA, "Accept-Encoding": "gzip, deflate"})
_last = [0.0]


def _count():
    try:
        return int(open(COUNT_FILE).read().strip() or 0)
    except FileNotFoundError:
        return 0


class CapReached(Exception):
    pass


def raw_get(url, method="GET", stream=False, timeout=30):
    n = _count()
    if n >= CAP:
        raise CapReached(url)
    wait = DELAY - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    open(COUNT_FILE, "w").write(str(n + 1))
    try:
        r = S.request(method, url, allow_redirects=False, timeout=timeout, stream=stream)
    finally:
        _last[0] = time.time()
    return r


def fetch(url, method="GET", max_hops=8, stream=False, timeout=30):
    """Follow redirects manually so the chain is recorded."""
    chain = []
    cur = url
    for _ in range(max_hops):
        r = raw_get(cur, method=method, stream=stream, timeout=timeout)
        if r.is_redirect or r.status_code in (301, 302, 303, 307, 308):
            loc = r.headers.get("Location", "")
            chain.append({"url": cur, "status": r.status_code, "location": loc})
            r.close()
            cur = urljoin(cur, loc)
            continue
        return r, chain, cur
    return r, chain, cur


def wj(fh, obj):
    fh.write(json.dumps(obj, ensure_ascii=False) + "\n")
    fh.flush()


# --------------------------------------------------------------------------- parsing
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self._in_title = False
        self.meta = {}
        self.links = []  # (rel, href, hreflang)
        self.hrefs = []
        self.h1 = []
        self._in_h1 = 0
        self._h1buf = []
        self.jsonld = []
        self._in_ld = False
        self._ldbuf = []
        self.imgs = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
            self.title = ""
        elif tag == "meta":
            key = a.get("property") or a.get("name")
            if key and key.lower() not in self.meta:
                self.meta[key.lower()] = a.get("content")
        elif tag == "link":
            self.links.append((a.get("rel"), a.get("href"), a.get("hreflang")))
        elif tag == "a" and a.get("href"):
            self.hrefs.append(a["href"])
        elif tag == "h1":
            self._in_h1 += 1
            self._h1buf = []
        elif tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self._in_ld = True
            self._ldbuf = []
        elif tag == "img":
            self.imgs.append(a.get("src") or a.get("data-src"))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "h1" and self._in_h1:
            self._in_h1 -= 1
            self.h1.append(" ".join("".join(self._h1buf).split()))
        elif tag == "script" and self._in_ld:
            self._in_ld = False
            self.jsonld.append("".join(self._ldbuf))

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_h1:
            self._h1buf.append(data)
        if self._in_ld:
            self._ldbuf.append(data)


def ld_types(blobs):
    types = []

    def walk(o):
        if isinstance(o, dict):
            t = o.get("@type")
            if t:
                types.extend(t if isinstance(t, list) else [t])
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    for b in blobs:
        try:
            walk(json.loads(b))
        except Exception:
            types.append("<unparseable>")
    return types


def nuxt_state(html):
    """Evaluate window.__NUXT__ in an isolated node vm context."""
    if "window.__NUXT__" not in html:
        return None
    p = subprocess.run(["node", os.path.join(HERE, "nuxt_extract.js"), "-"], input=html,
                       capture_output=True, text=True, timeout=60)
    if p.returncode != 0:
        return {"_error": p.stderr[-500:]}
    return json.loads(p.stdout)


def normalize(href, base):
    if not href:
        return None, None
    href = href.strip()
    if href.startswith(("mailto:", "tel:", "javascript:", "#", "data:")):
        return None, None
    u = urlsplit(urljoin(base, href))
    if u.scheme not in ("http", "https"):
        return None, None
    path = u.path or "/"
    norm = urlunsplit(("https" if u.netloc.lower() == HOST else u.scheme, u.netloc.lower(), path, "", ""))
    return norm, (u.query or None)


ASSET_RE = re.compile(r"\.(js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|mp3|xml|json|txt)$", re.I)


def same_host_page(url):
    u = urlsplit(url)
    return u.netloc == HOST and not u.path.startswith("/_nuxt/") and not ASSET_RE.search(u.path) \
        and not u.path.startswith("/icomoon/")


# --------------------------------------------------------------------------- steps
def head_bytes(r, n=300):
    try:
        b = r.content
    except Exception as e:  # noqa
        return None, f"<read error {e}>"
    return len(b), b[:n].decode("utf-8", "replace")


def step1():
    out = open(os.path.join(HERE, "probes.jsonl"), "w")
    paths = ["/robots.txt", "/sitemap.xml", "/sitemap_index.xml", "/podcast-rss", "/podcast",
             "/feed", "/rss", "/humans.txt", "/favicon.ico", "/manifest.json"]
    for p in paths:
        url = "https://section8recs.com" + p
        r, chain, final = fetch(url)
        size, first = head_bytes(r)
        rec = {"kind": "wellknown", "url": url, "final_url": final, "status": r.status_code,
               "redirects": chain, "content_type": r.headers.get("Content-Type"),
               "cache_control": r.headers.get("Cache-Control"), "size": size, "first300": first}
        if p == "/podcast-rss" and r.status_code == 200:
            open(os.path.join(HERE, "podcast-rss.xml"), "wb").write(r.content)
        if p == "/robots.txt" and r.status_code == 200:
            open(os.path.join(HERE, "robots.txt"), "wb").write(r.content)
        if p in ("/sitemap.xml", "/sitemap_index.xml") and r.status_code == 200:
            open(os.path.join(HERE, p.strip("/")), "wb").write(r.content)
        wj(out, rec)
        print("probe", p, r.status_code, size, r.headers.get("Content-Type"))
    for url in ["https://www.section8recs.com/", "http://section8recs.com/", "http://www.section8recs.com/",
                "https://section8recs.com/releases/"]:
        r, chain, final = fetch(url, method="HEAD")
        wj(out, {"kind": "redirect_chain", "url": url, "chain": chain, "final_url": final,
                 "final_status": r.status_code})
        print("chain", url, [c["status"] for c in chain], final, r.status_code)
    for url in ["https://about.section8recs.com/"]:
        try:
            r, chain, final = fetch(url, method="HEAD")
            wj(out, {"kind": "headers", "url": url, "chain": chain, "final_url": final,
                     "status": r.status_code, "headers": dict(r.headers)})
            print("about", r.status_code, final)
        except requests.RequestException as e:
            wj(out, {"kind": "headers", "url": url, "error": repr(e)})
            print("about error", e)
    out.close()


def record_page(url, depth, r, chain, final, html):
    p = PageParser()
    p.feed(html)
    m = p.meta
    canon = [h for rel, h, _ in p.links if rel and "canonical" in rel]
    hreflang = [{"hreflang": hl, "href": h} for rel, h, hl in p.links if hl]
    return p, {
        "url": url, "depth": depth, "final_url": final, "status": r.status_code,
        "redirects": chain, "content_type": r.headers.get("Content-Type"),
        "title": (p.title or "").strip() if p.title is not None else None,
        "meta_description": m.get("description"), "canonical": canon[0] if canon else None,
        "robots": m.get("robots"), "og:title": m.get("og:title"), "og:description": m.get("og:description"),
        "og:image": m.get("og:image"), "og:url": m.get("og:url"), "og:type": m.get("og:type"),
        "twitter:card": m.get("twitter:card"), "twitter:image": m.get("twitter:image"),
        "jsonld_types": ld_types(p.jsonld), "hreflang": hreflang, "h1": p.h1,
        "cache_control": r.headers.get("Cache-Control"), "x_lgsites_cache": r.headers.get("X-Lgsites-Cache"),
        "cf_cache_status": r.headers.get("Cf-Cache-Status"), "bytes": len(r.content),
        "a_href_count": len(p.hrefs), "img_count": len(p.imgs),
    }


SAMPLE_PATHS = {"/", "/releases", "/latest", "/dropbox", "/cat/SECTION8116", "/cat/SECTION8001D",
                "/podcast"}


def step2(seeds_extra):
    pages = open(os.path.join(HERE, "pages.jsonl"), "w")
    os.makedirs(os.path.join(HERE, "nuxt"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "samples"), exist_ok=True)
    seen = set()
    queries = {}
    external = {}
    q = deque()
    for s in [ROOT] + seeds_extra:
        n, _ = normalize(s, ROOT)
        if n and n not in seen:
            seen.add(n)
            q.append((n, 0, "seed"))
    rows = []
    state_paths = {}
    while q:
        url, depth, src = q.popleft()
        try:
            r, chain, final = fetch(url)
        except CapReached:
            print("CAP reached; stopping crawl")
            break
        ct = r.headers.get("Content-Type", "")
        html = r.text if "html" in ct else ""
        p, rec = record_page(url, depth, r, chain, final, html)
        rec["found_via"] = src
        path = urlsplit(final).path
        st = nuxt_state(html) if html else None
        if st and "_error" not in st:
            rec["nuxt_routePath"] = st.get("routePath")
            sel = (st.get("state", {}).get("releases") or {}).get("selected")
            rec["nuxt_release_selected_cat"] = sel.get("cat") if isinstance(sel, dict) else None
            rec["nuxt_release_list_len"] = len((st.get("state", {}).get("releases") or {}).get("list") or [])
            # route-like strings in state
            for sp in set(re.findall(r'"(/[A-Za-z0-9_\-./]{1,80})"', json.dumps(st))):
                state_paths.setdefault(sp, url)
            for uri in re.findall(r'"uri":\s*"(/[^"]+)"', json.dumps(st)):
                n, _ = normalize(uri, final)
                if n and n not in seen and depth + 1 <= MAX_DEPTH and same_host_page(n):
                    seen.add(n)
                    q.append((n, depth + 1, "nuxt-state:" + url))
        if path in SAMPLE_PATHS or (path.rstrip("/") in SAMPLE_PATHS):
            slug = (path.strip("/").replace("/", "_") or "home")
            open(os.path.join(HERE, "samples", slug + ".html"), "w").write(html)
            if st:
                json.dump(st, open(os.path.join(HERE, "nuxt", slug + ".json"), "w"))
        wj(pages, rec)
        rows.append(rec)
        print(f"[{_count()}] d{depth} {r.status_code} {url} -> {final if final != url else ''} "
              f"{rec['bytes']}B title={rec['title']!r}")
        for h in p.hrefs:
            n, qs = normalize(h, final)
            if not n:
                continue
            if qs:
                queries.setdefault(n, set()).add(qs)
            if urlsplit(n).netloc != HOST:
                external.setdefault(n, set()).add(path)
                continue
            if same_host_page(n) and n not in seen and depth + 1 <= MAX_DEPTH:
                seen.add(n)
                q.append((n, depth + 1, url))
    pages.close()
    with open(os.path.join(HERE, "urls.csv"), "w", newline="") as fh:
        cols = ["url", "final_url", "status", "redirect_count", "depth", "title", "canonical", "og:image",
                "og:type", "og:url", "meta_description", "h1", "jsonld_types", "cache_control", "bytes",
                "nuxt_release_selected_cat", "found_via"]
        w = csv.writer(fh)
        w.writerow(cols)
        for r in rows:
            w.writerow([len(r["redirects"]) if c == "redirect_count" else
                        ("|".join(r[c]) if isinstance(r.get(c), list) else r.get(c)) for c in cols])
    json.dump({"query_strings": {k: sorted(v) for k, v in queries.items()},
               "external_links": {k: sorted(v)[:5] + ([f"...+{len(v)-5}"] if len(v) > 5 else [])
                                  for k, v in sorted(external.items())},
               "state_paths": state_paths},
              open(os.path.join(HERE, "links.json"), "w"), indent=1)
    return rows


def step_routes():
    """Pull route definitions from the Nuxt JS bundles referenced by the homepage."""
    html = open(os.path.join(HERE, "samples", "home.html")).read()
    js = sorted(set(re.findall(r'(/_nuxt/[a-z0-9]+\.js)', html)))
    found = {}
    for j in js:
        r, _, _ = fetch("https://section8recs.com" + j)
        body = r.text
        for m in re.findall(r'path:\s*"([^"]*)"', body):
            found.setdefault(m, []).append(j)
        for m in re.findall(r'name:\s*"([a-zA-Z0-9_\-]+)"\s*,\s*path', body):
            found.setdefault("name:" + m, []).append(j)
    json.dump({"bundles": js, "routes": found}, open(os.path.join(HERE, "routes.json"), "w"), indent=1)
    print("routes", sorted(k for k in found if not k.startswith("name:")))
    return found


def step4(extra):
    out = open(os.path.join(HERE, "notfound.jsonl"), "w")
    for p in ["/this-does-not-exist-xyz", "/releases/does-not-exist-xyz", "/cat/DOES-NOT-EXIST-XYZ"] + extra:
        url = "https://section8recs.com" + p
        r, chain, final = fetch(url)
        pp = PageParser()
        pp.feed(r.text if "html" in r.headers.get("Content-Type", "") else "")
        rec = {"url": url, "status": r.status_code, "chain": chain, "final_url": final,
               "content_type": r.headers.get("Content-Type"), "title": (pp.title or "").strip(),
               "h1": pp.h1, "og:title": pp.meta.get("og:title"), "robots": pp.meta.get("robots"),
               "bytes": len(r.content), "cache_control": r.headers.get("Cache-Control")}
        st = nuxt_state(r.text) if "__NUXT__" in r.text else None
        if st and "_error" not in st:
            rec["nuxt_error"] = st.get("error")
            sel = (st.get("state", {}).get("releases") or {}).get("selected")
            rec["nuxt_release_selected"] = (sel or {}).get("cat") if isinstance(sel, dict) else sel
        wj(out, rec)
        print("404test", p, r.status_code, rec["title"])
    out.close()


def img_dims(b):
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", b[16:24])
    if b[:2] == b"\xff\xd8":
        i = 2
        while i < len(b) - 9:
            if b[i] != 0xFF:
                i += 1
                continue
            mk = b[i + 1]
            ln = struct.unpack(">H", b[i + 2:i + 4])[0]
            if mk in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", b[i + 5:i + 9])
                return w, h
            i += 2 + ln
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "webp", None
    return None


def step_images(urls):
    res = []
    for u in urls:
        r, chain, final = fetch(u)
        b = r.content
        res.append({"url": u, "final": final, "status": r.status_code, "content_type": r.headers.get("Content-Type"),
                    "bytes": len(b), "dims": img_dims(b), "cache_control": r.headers.get("Cache-Control"),
                    "server": r.headers.get("Server"), "cf_resized": r.headers.get("Cf-Resized")})
        print("img", u, res[-1]["dims"], res[-1]["content_type"])
    json.dump(res, open(os.path.join(HERE, "images.json"), "w"), indent=1)


def step_extra():
    """Probe unlinked router patterns, canonical targets, URL variants, short URL, Wayback CDX."""
    out = open(os.path.join(HERE, "extra.jsonl"), "w")
    paths = ["/r/section8recs/10650", "/r/biobird-riders-lp/10650", "/r/wrong-slug/10650",
             "/r/biobird-riders-lp", "/section8recs", "/section8recs/cat/SECTION8116", "/player/SECTION8116",
             "/player/cat/SECTION8116", "/cat", "/checkout", "/cat/SECTION8116/thanks", "/cat/section8116",
             "/cat/SECTION8116/", "/cat/SECTION8116?utm_source=audit", "/cat/SECTION8POD13"]
    for p in paths:
        url = "https://section8recs.com" + p
        r, chain, final = fetch(url)
        html = r.text if "html" in r.headers.get("Content-Type", "") else ""
        _, rec = record_page(url, None, r, chain, final, html)
        st = nuxt_state(html) if html else None
        if st and "_error" not in st:
            rec["nuxt_routePath"] = st.get("routePath")
            sel = (st.get("state", {}).get("releases") or {}).get("selected")
            rec["nuxt_release_selected"] = {k: sel.get(k) for k in ("cat", "id", "slug")} if isinstance(sel, dict) else sel
            rec["nuxt_error"] = st.get("error")
        wj(out, rec)
        print("extra", p, r.status_code, rec["title"], rec["canonical"], rec.get("nuxt_release_selected"))
    r, chain, final = fetch("https://lbl.gr/7cDTwu", method="HEAD", max_hops=3)
    wj(out, {"url": "https://lbl.gr/7cDTwu", "chain": chain, "final": final, "status": r.status_code})
    print("shorturl", chain, final, r.status_code)
    cdx = {}
    for q in ["section8recs.com/*", "www.section8recs.com/*"]:
        u = ("https://web.archive.org/cdx/search/cdx?url=" + q +
             "&output=json&collapse=urlkey&fl=original,timestamp,statuscode,mimetype&limit=5000")
        try:
            r, _, _ = fetch(u)
            cdx[q] = r.json() if r.status_code == 200 and r.text.strip() else {"status": r.status_code}
        except Exception as e:  # noqa
            cdx[q] = {"error": repr(e)}
        print("cdx", q, len(cdx[q]) if isinstance(cdx[q], list) else cdx[q])
    json.dump(cdx, open(os.path.join(HERE, "wayback-cdx.json"), "w"))
    out.close()


def step_wayback():
    """Wayback Machine CDX history (non-www host) and the archived /podcast-rss response."""
    base = "https://web.archive.org/cdx/search/cdx?output=json&collapse=urlkey&fl=original,timestamp,statuscode,mimetype"
    qs = {
        "podcast_rss_all": "https://web.archive.org/cdx/search/cdx?output=json&url=section8recs.com/podcast-rss&matchType=exact",
        "apex_non_r": base + "&url=section8recs.com/*&limit=10000&filter=!original:.*/(_nuxt|r)/.*",
        "apex_r": base + "&url=section8recs.com/r/*&limit=10000",
    }
    path = os.path.join(HERE, "wayback-cdx.json")
    cdx = json.load(open(path)) if os.path.exists(path) else {}
    for k, u in qs.items():
        if isinstance(cdx.get(k), list):
            print("cdx", k, "cached", len(cdx[k]))
            continue
        for attempt in range(2):
            try:
                r, _, _ = fetch(u, timeout=120)
            except requests.RequestException as e:
                cdx[k] = {"error": repr(e)[:200]}
                time.sleep(5)
                continue
            if r.status_code == 200:
                cdx[k] = r.json() if r.text.strip() else []
                break
            cdx[k] = {"status": r.status_code}
            time.sleep(5)
        print("cdx", k, len(cdx[k]) if isinstance(cdx[k], list) else cdx[k])
    json.dump(cdx, open(path, "w"))
    rows = cdx.get("podcast_rss_all") or []
    if isinstance(rows, list) and len(rows) > 1:
        ts = rows[1][1]
        r, chain, final = fetch(f"https://web.archive.org/web/{ts}id_/http://section8recs.com/podcast-rss", max_hops=1, timeout=120)
        json.dump({"ts": ts, "status": r.status_code, "chain": chain, "headers": dict(r.headers),
                   "body_head": r.text[:1500]}, open(os.path.join(HERE, "wayback-podcast-rss.json"), "w"), indent=1)
        print("wayback podcast-rss", ts, r.status_code, chain)


if __name__ == "__main__":
    steps = sys.argv[1:] or ["1", "2", "routes", "4", "images"]
    if "1" in steps:
        step1()
    if "2" in steps:
        step2(["https://section8recs.com/releases", "https://section8recs.com/latest",
               "https://section8recs.com/dropbox"])
    if "routes" in steps:
        step_routes()
    if "4" in steps:
        step4([])
    if "images" in steps:
        st = json.load(open(os.path.join(HERE, "nuxt", "home.json")))
        rel = st["state"]["releases"]["list"]
        u = rel[0]["front_cover"]["url"]
        raw = re.sub(r"/cdn-cgi/image/[^/]+", "", u)
        step_images([u, raw, rel[-1]["front_cover"]["url"]])
    if "extra" in steps:
        step_extra()
    if "wayback" in steps:
        step_wayback()
    print("requests used:", _count())
