// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://archaic.ie',
  output: 'static',
  integrations: [sitemap()],

  // Astro 7 changed the default to 'jsx' (React-style whitespace stripping).
  // Keep the HTML-aware v6 behaviour so inline spacing stays byte-identical.
  compressHTML: true,

  vite: {
    plugins: [tailwindcss()]
  }
});
