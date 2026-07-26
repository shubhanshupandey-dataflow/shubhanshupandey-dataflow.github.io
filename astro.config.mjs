// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ledgerai.backoffice.digital',
  // Every route is prerendered to static HTML at build time — the whole point of
  // the move off the client-rendered Vite/React app.
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // /blogs/foo.html rather than /blogs/foo/index.html keeps URLs identical to
    // the old client-side router.
    format: 'file',
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
