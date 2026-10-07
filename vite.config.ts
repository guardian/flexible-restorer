/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import path from 'path'

// Set by the containerised dev stack (entrypoint.dev.sh): the Vite dev server is
// reached at the same origin under /vite-dev/ over TLS via nginx. When unset (a
// standalone `npm run dev`) the browser hits the dev server directly on :5173.
const proxied = process.env.VITE_PROXIED === 'true'

export default defineConfig(({ command }) => ({
  plugins: [
    react({
      jsxImportSource: "@emotion/react"
    }),
    // Emit pre-compressed copies next to each built asset. Play's Assets
    // controller serves the `.gz` sibling to clients that accept gzip, replacing
    // the old sbt-gzip pipeline; `.br` is emitted too for brotli-aware fronting.
    compression({ include: /\.(js|css|svg|json)$/, algorithms: ['gzip', 'brotliCompress'] })
  ],
  // Built assets live in public/dist, served by Play under /assets/dist. Behind
  // the nginx dev proxy every module/HMR URL is prefixed with /vite-dev/;
  // standalone dev serves modules from the server root.
  base: command === 'build' ? '/assets/dist/' : proxied ? '/vite-dev/' : '/',
  // Our source lives under public/src; disable Vite's static publicDir so it
  // doesn't try to copy the source tree (and public/dist) into the bundle.
  publicDir: false,
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  },
  server: {
    // Bind on all interfaces so the nginx container can proxy to it.
    host: true,
    port: 5173,
    strictPort: true,
    // nginx forwards the TLS dev domain as the Host header; allow it (and its
    // subdomains) so Vite's host check doesn't reject the proxied requests (403).
    allowedHosts: [".dev-gutools.co.uk"],
    // Behind the nginx dev proxy the HMR websocket is served over wss on 443 on
    // the TLS dev domain (the socket path comes from `base`, /vite-dev/, so don't
    // set `path` too or it gets doubled). Standalone dev uses Vite's defaults
    // (ws on localhost:5173).
    ...(proxied ? { hmr: { protocol: "wss", clientPort: 443 } } : {})
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './public/src'),
      '@components': path.resolve(__dirname, './public/src/app/components'),
    },
  },
  build: {
    // Output into Play's asset tree so `Assets.versioned` serves the bundle.
    outDir: 'public/dist',
    assetsDir: '.',
    sourcemap: false,
    // Emit the manifest at the output root (not .vite/) so Play reliably
    // packages it; the Scala backend reads it to resolve hashed asset names.
    manifest: 'manifest.json',
    rollupOptions: {
      // The Play view renders the HTML; this is the client-side mount entry.
      // The favicon is an additional input so Vite fingerprints it and records
      // it in manifest.json for the Play template to resolve.
      input: {
        main: path.resolve(__dirname, 'public/src/app/main.tsx'),
        favicon: path.resolve(__dirname, 'public/images/fav-versions-32.png'),
      },
      output: {
        // Split node_modules into stable, long-term-cacheable chunks so app-code
        // changes only invalidate the small entry chunk. Match on the package
        // path (with trailing slash) so e.g. `redux` doesn't capture unrelated
        // packages. react/react-dom/react-aria are tightly coupled to
        // @guardian/stand, so rolldown keeps them together in the guardian chunk.
        manualChunks(id) {
          if (!id.includes('node_modules/')) return undefined
          if (
            /node_modules\/(@reduxjs|react-redux|redux|redux-thunk|immer|reselect)\//.test(
              id,
            )
          )
            return 'redux'
          if (id.includes('node_modules/@emotion/')) return 'emotion'
          if (id.includes('node_modules/@guardian/')) return 'guardian'
          if (id.includes('node_modules/moment/')) return 'moment'
          return 'vendor'
        },
      },
    },
  },

  // Only variables prefixed with VITE_ are exposed to client code.
  envPrefix: 'VITE_',

  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['public/src/**/*.test.{js,ts,tsx}'],
  },
}))
