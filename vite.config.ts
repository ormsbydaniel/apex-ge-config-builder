import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Project deployments serve the builder under a prefix such as /builder/.
// Set VITE_BASE_PATH=/builder/ at build time. The default stays at the site root.
function normalizeBase(value: string | undefined): string {
  if (!value || value === '/') return '/';
  const withLeading = value.startsWith('/') ? value : `/${value}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

// The Lovable/gpteng editor script runs with the builder's origin and can read
// the signed-in session. It is injected only by the dev server, never into
// production builds.
const devOnlyGptEngineer = {
  name: 'dev-only-gptengineer',
  apply: 'serve' as const,
  transformIndexHtml(html: string) {
    return html.replace(
      '</body>',
      '    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>\n  </body>',
    );
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: normalizeBase(process.env.VITE_BASE_PATH),
  server: {
    host: "::",
    // apex-explorer already allows localhost:8000 for the builder.
    port: 8000,
    strictPort: true,
  },
  plugins: [
    react(),
    devOnlyGptEngineer,
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
