// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://brand.kiln.ai',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      // Three.js scenes are code-split; keep asset URLs stable for the registry.
      assetsInlineLimit: 0,
    },
  },
});
