import { defineConfig } from 'tsup'

export default defineConfig([
  // Core module - pure TypeScript, no banner needed
  {
    entry: { 'core/index': 'src/core/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
  },
  // React module - needs "use client" banner
  {
    entry: { 'react/index': 'src/react/index.tsx' },
    format: ['esm'],
    dts: true,
    external: ['react', 'react-dom'],
    banner: { js: '"use client";' },
  },
  // UN Fetcher module - server-only, mark node built-ins as external
  {
    entry: { 'un-fetcher/index': 'src/un-fetcher/index.ts' },
    format: ['esm'],
    dts: true,
    external: ['server-only'],
    // Node.js built-ins will be resolved at runtime
  },
])
