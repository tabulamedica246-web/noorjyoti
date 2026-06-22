import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const rawPort = process.env.PORT;
if (!rawPort) throw new Error("PORT env var is required");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: ${rawPort}`);

const basePath = process.env.BASE_PATH ?? "/";

// The canonical public origin for this site, used for absolute URLs in
// metadata, Open Graph tags, structured data, and sitemaps. Must be a
// fixed server-side value — never derived from request headers — to
// prevent host-header poisoning. Override with SITE_ORIGIN at deployment.
const siteOrigin = process.env.SITE_ORIGIN ?? "https://noorjyoti.com";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  site: siteOrigin,
  base: basePath,
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  server: { host: "0.0.0.0", port },
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: "0.0.0.0",
      port,
      strictPort: true,
      allowedHosts: true,
    },
    preview: { host: "0.0.0.0", port, allowedHosts: true },
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
      dedupe: ["react", "react-dom"],
    },
  },
});
