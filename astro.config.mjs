// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
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

  // Self-hosted from /_astro/fonts/, so no Google Fonts origins in the CSP and no
  // third-party request on the critical path. Weights are only the ones actually
  // used: every Cinzel rule is 400, Space Grotesk uses 400 and 500 (<strong>).
  // The old Google request also pulled Cinzel 600/900 and Grotesk 300/700, which
  // nothing references.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Cinzel',
      cssVariable: '--font-cinzel',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Space Grotesk',
      cssVariable: '--font-grotesk',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Uncial Antiqua',
      cssVariable: '--font-uncial',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['serif'],
    },
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});
