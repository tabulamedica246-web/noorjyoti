import type { APIRoute } from "astro";
import { SUPPORTED_LOCALES } from "../i18n";

export const prerender = false;

export const GET: APIRoute = ({ request, site }) => {
  const url = new URL(request.url);
  const origin = site?.origin ?? `${url.protocol}//${url.host}`;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = SUPPORTED_LOCALES.map((l) => {
    const loc = `${origin}${base}${l.path === "/" ? "/" : l.path}`;
    const alternates = SUPPORTED_LOCALES.map(
      (alt) =>
        `    <xhtml:link rel="alternate" hreflang="${alt.code}" href="${origin}${base}${alt.path === "/" ? "/" : alt.path}" />`,
    ).join("\n");
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${l.code === "en" ? "1.0" : "0.9"}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${base}/" />
  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
