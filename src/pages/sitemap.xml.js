// The sitemap: every page, with each release's cover as an image entry. Google ignores changefreq and priority and
// trusts lastmod only when it is accurate, so neither is given.
import { artists, artistUrl, coverUrl, releases, releaseUrl, SITE } from '../lib/catalog.mjs';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const url = (path, images = []) => `<url><loc>${esc(SITE + path)}</loc>${images.map(i => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`;

export function GET() {
  const body = [url('/'), url('/releases'), ...releases.map(r => url(releaseUrl(r), [coverUrl(r, 800)])), ...artists.map(a => url(artistUrl(a)))];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
