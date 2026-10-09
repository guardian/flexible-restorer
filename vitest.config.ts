import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react({ jsxImportSource: '@emotion/react' })],
    test: {
        environment: 'jsdom',
        include: ['public/javascripts/**/*.test.{ts,tsx}'],
        restoreMocks: true,
    },
});