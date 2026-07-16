// @ts-check
import { defineConfig } from 'astro/config';
import { remarkTwitterCard } from './src/plugins/remark-twitter-card.mjs';

import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import remarkCardLink from './src/plugins/remark-card-link.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://king3326.dev/',
  base: '/blog/',
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: cloudflare(),

  markdown: {
    remarkPlugins: [remarkCardLink],
  }
});
