import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    build: {
        outDir: "../public/dist/vite",
        copyPublicDir: false,
        rolldownOptions: {
            output: {
                entryFileNames: "[name].js",
                assetFileNames: "[name][extname]",
            },
        },
    },
    plugins: [react()],
});
