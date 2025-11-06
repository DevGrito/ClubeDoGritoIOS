import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(async () => {
  const replPlugin =
    process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [(await import("@replit/vite-plugin-cartographer")).cartographer()]
      : [];

  return {
    root: path.resolve(import.meta.dirname, "client"),

    plugins: [
      react(),
      runtimeErrorOverlay(),

      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        manifest: {
          name: "Clube do Grito",
          short_name: "O Grito",
          id: "clube-do-grito-pwa",
          start_url: "/",
          scope: "/",
          display: "standalone",
          display_override: ["window-controls-overlay", "standalone"],
          orientation: "portrait-primary",
          background_color: "#FFCC00",
          theme_color: "#FFCC00",
          description: "Vozes que ecoam",
          lang: "pt-BR",
          dir: "ltr",
          categories: ["education", "social"],
          // ➜ GARANTA que estes arquivos existem em client/public/icons/
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
          screenshots: [
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              form_factor: "wide",
              label: "Clube do Grito - Tela Principal",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          navigateFallback: "/index.html",
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,json,woff2}"],
          cleanupOutdatedCaches: true,
        },
        devOptions: { enabled: false },
        // opcional: copie favicons/arquivos extras do public
        includeAssets: ["/favicon.ico"],
      }),

      ...replPlugin,
    ],

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },

    build: {
      sourcemap: false,                              // <— sourcemaps ON
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 4096,
      minify: "esbuild",
    },

    server: { fs: { strict: true, deny: ["**/.*"] } },
  };
});
