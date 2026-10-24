import { defineConfig } from 'astro/config';

// Pages serves /cat/X.html at /cat/X, so pages build as files and URLs never take a trailing slash.
// public/ was the hand-built Pages output; static assets live in static/.
export default defineConfig({
  site: 'https://section8recs.com',
  publicDir: './static',
  outDir: './dist',
  trailingSlash: 'never',
  build: { format: 'file' },
});
