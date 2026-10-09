import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
    plugins: [react({ jsxImportSource: '@emotion/react' })],
    publicDir: false,
    base: command === 'serve' ? '/' : '/assets/dist/',
    server: {
        host: '0.0.0.0',
        proxy: { '/api': 'http://localhost:9000', '/export': 'http://localhost:9000' },
    },
    build: {
        outDir: 'public/dist',
        sourcemap: true,
        cssCodeSplit: false,
        rollupOptions: {
            input: 'public/javascripts/main.tsx',
            output: {
                entryFileNames: 'main.js',
                assetFileNames: (asset) => asset.names.some((name) => name.endsWith('.css')) ? 'main.css' : 'assets/[name]-[hash].[ext]',
            },
        },
    },
}));