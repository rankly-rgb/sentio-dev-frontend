import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// Upload des source maps vers Sentry — câblé à la main plutôt que par
// `@sentry/wizard`, qui exige une session interactive.
//
// Sans source maps, Sentry n'affiche que des frames minifiées : on sait
// qu'une erreur a eu lieu, pas où. Avec, on lit le fichier et la ligne.
//
// Conditionné à SENTRY_AUTH_TOKEN : sur une machine de dev ou une preview
// sans le token, le plugin n'est simplement pas chargé et le build reste
// identique à avant. Le token vit dans les variables d'environnement Vercel,
// jamais dans le repo.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            authToken: sentryAuthToken,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT ?? "sentio-frontend",
            telemetry: false,
            sourcemaps: {
              // Les .map sont uploadés puis supprimés du build : Sentry les a,
              // le public ne les télécharge pas depuis app.sentioapp.io.
              filesToDeleteAfterUpload: ["./dist/**/*.map"],
            },
            // Un échec d'upload (token expiré, org mal renseignée, Sentry
            // indisponible) ne doit JAMAIS casser un déploiement produit :
            // on perd la lisibilité des traces, pas la mise en production.
            errorHandler: (err) => {
              console.warn(
                "[sentry-vite-plugin] source map upload skipped:",
                err.message,
              );
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Requis pour que le plugin ait quelque chose à uploader. Les fichiers
    // sont retirés du build après upload (voir filesToDeleteAfterUpload).
    sourcemap: Boolean(sentryAuthToken),
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'vendor-charts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
