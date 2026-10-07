import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import path from 'path'
import packageJson from "./package.json";

export default defineConfig(({ command }) => ({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"]
      }
    }),
    // Emit pre-compressed copies next to each built asset. Play's Assets
    // controller serves the `.gz` sibling to clients that accept gzip, replacing
    // the old sbt-gzip pipeline; `.br` is emitted too for brotli-aware fronting.
    compression({ include: /\.(js|css|svg|json)$/, algorithms: ['gzip', 'brotliCompress'] })
  ],
  // Built assets live in public/dist, served by Play under /assets/dist. In dev
  // the server is reached through nginx under /vite-dev/ (same origin as Play),
  // so every module/HMR URL is prefixed with that base.
  base: command === 'build' ? '/assets/dist/' : '/vite-dev/',
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
    hmr: {
      // The HMR websocket is proxied through nginx on the TLS dev domain, so the
      // browser connects over wss on 443. The socket path comes from `base`
      // (/vite-dev/); don't set `path` too or it gets doubled.
      protocol: "wss",
      clientPort: 443
    }
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
    sourcemap: true,
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
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor'
          }
        },
      },
    },
  },

  // Environment variable prefix (CRA uses REACT_APP_)
  envPrefix: 'VITE_',
}))