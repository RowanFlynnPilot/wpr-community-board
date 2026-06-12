import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build works at any path — GitHub Pages serves this
// from /wpr-community-board/, same pattern as wpr-gas-prices.
export default defineConfig({
  plugins: [react()],
  base: './',
  // Dev only: honor an externally assigned port (e.g. preview tooling).
  server: { port: Number(process.env.PORT) || 5173 },
});
