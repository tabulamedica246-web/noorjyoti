import { defineMiddleware } from "astro:middleware";
import {
  DICTIONARIES,
  dirFor,
  isLocale,
  localeForHost,
  type Locale,
} from "./i18n";

/**
 * Resolves the active locale for every request, in this priority order:
 *   1. Explicit URL prefix (/es/, /fr/, /zh/, /yo/, /he/)
 *   2. ?lang=xx query param (useful for sharing direct localized links)
 *   3. Host header (custom domain → locale map)
 *   4. Accept-Language header (first matching supported code)
 *   5. English
 *
 * The detected locale is exposed to every .astro page via Astro.locals so
 * the layout can render correct <html lang>, <html dir>, <title>, <meta>,
 * and OG tags into the HTML before the browser receives anything.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;

  // Strip the configured site base so we can read the user-facing path.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const pathWithoutBase = base && url.pathname.startsWith(base)
    ? url.pathname.slice(base.length) || "/"
    : url.pathname;

  // 1. URL prefix wins.
  const firstSegment = pathWithoutBase.split("/")[1];
  let locale: Locale | null = isLocale(firstSegment) ? firstSegment : null;

  // 2. Query param.
  if (!locale) {
    const q = url.searchParams.get("lang");
    if (isLocale(q)) locale = q;
  }

  // 3. Host header.
  if (!locale) {
    locale = localeForHost(context.request.headers.get("host"));
  }

  // 4. Accept-Language — iterate weighted ranges in quality order and pick the
  //    first one we actually support. e.g. "de,es;q=0.9,en;q=0.5" → "es".
  if (!locale) {
    const accept = context.request.headers.get("accept-language") ?? "";
    const ranges = accept
      .split(",")
      .map((part) => {
        const [tag, ...params] = part.trim().split(";");
        let q = 1;
        for (const p of params) {
          const m = p.trim().match(/^q=([0-9.]+)$/i);
          if (m) q = Number.parseFloat(m[1]) || 0;
        }
        return { tag: tag.trim().slice(0, 2).toLowerCase(), q };
      })
      .filter((r) => r.tag && r.tag !== "*")
      .sort((a, b) => b.q - a.q);
    for (const r of ranges) {
      if (isLocale(r.tag)) {
        locale = r.tag;
        break;
      }
    }
  }

  // 5. Default.
  if (!locale) locale = "en";

  context.locals.locale = locale;
  context.locals.dir = dirFor(locale);
  context.locals.t = DICTIONARIES[locale];

  return next();
});
