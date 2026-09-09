import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import { contentLastmod } from './scripts/lib/lastmod.mjs';

const lastmod = await contentLastmod(fileURLToPath(new URL('./src/content', import.meta.url)));

export default defineConfig({
  site: 'https://continuo-data.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const date = lastmod.get(new URL(item.url).pathname);
        return date ? { ...item, lastmod: date } : item;
      },
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
