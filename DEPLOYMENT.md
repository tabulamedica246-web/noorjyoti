# NoorJyoti — Multi-Domain Deployment Notes

The product is one app served from one deployment. Each owned domain acts as a culturally-tailored doorway that auto-selects the right locale based on `Host`. The marketing site is now **server-rendered with Astro + @astrojs/node** — every request returns HTML with correct `<title>`, `<meta>`, `<html lang/dir>`, and OpenGraph tags already substituted, *before* any JavaScript runs. This matters for WeChat/Baidu/LinkedIn link previews and any crawler that doesn't execute JS.

## Architecture

```
artifacts/ekdharma-site/   ← Astro SSR + React islands (marketing site, all 6 locales)
artifacts/ekdharma/        ← Inner web app (audio player, library)
artifacts/web/             ← Inner web app (legacy duplicate)
artifacts/mobile/          ← Expo mobile app
artifacts/api-server/      ← Shared Express backend
```

In production, the marketing site runs a Node server (`node ./dist/server/entry.mjs`) that handles every request. Astro middleware in `src/middleware.ts` resolves the active locale in this priority order:

1. **URL prefix** — `/es/`, `/fr/`, `/zh/`, `/yo/`, `/he/` (English is at root)
2. **`?lang=xx` query param** — overrides everything for shareable localized links
3. **`Host` header** — custom domain → default locale
4. **`Accept-Language` header** — first matching supported code
5. **English** fallback

## Domain → Locale Map

| Domain                | Default locale | Region / audience              |
|-----------------------|----------------|--------------------------------|
| noorjyoti.com         | English (en)   | Global / South Asian diaspora  |
| noorjyoti.app         | English (en)   | Mobile-first audience          |
| noorjyoti.world       | English (en)   | Brand / general                |
| lumina-sacred.com     | Spanish (es)   | Spanish-speaking world         |
| or-sacred.com         | French (fr)    | French-speaking world          |
| guangming-app.com     | Mandarin (zh)  | Chinese-speaking world         |
| imole-app.com         | Yorùbá (yo)    | West Africa / Yoruba diaspora  |

The hostname → locale table lives in `artifacts/ekdharma-site/src/i18n/index.ts` (`HOSTNAME_TO_LOCALE`).

Users can override via the in-page language switcher, which navigates to the per-locale URL (`/zh/`, `/he/`, etc.) so the server re-renders with the new locale's meta tags. Preference is also persisted in `localStorage` under `noorjyoti.locale`.

## Custom Domain Setup (Replit Deployments)

You must do these steps in the Replit Deployments panel after publishing:

1. Publish the deployment (`suggest_deploy`).
2. In the Deployments panel: **Domains** → **Add custom domain**.
3. For each of the seven domains, add it and create the `A` + `TXT` records Replit displays at your DNS provider.
4. Wait for verification (1–60 min). Once verified, every domain serves the same deployment and SSR auto-selects the locale from `Host`.

## Mainland-China Considerations (`guangming-app.com`)

Code changes already in place:

- **SSR-rendered Mandarin meta tags** — WeChat's crawler will see `<title>光明 NoorJyoti — 世界经典 · 同一心灵 · 众声合一</title>` and the matching `og:description` in the initial HTML response. No JS needed.
- **Fonts via `fonts.bunny.net`** — reachable inside mainland China (Google Fonts CDN is blocked).
- **Zero embedded Google / Facebook / X / LinkedIn pixels** — verified by repo search.

What you still need to do manually:

1. **ICP licensing** — mainland-China hosting requires a Beian filing for production-scale Chinese traffic. The Replit deployment itself is hosted outside mainland China. Options: host this domain behind a CDN with an ICP license (Alibaba, Tencent), or accept slower / unreliable access.
2. **ICP meta tag** — once licensed, add `<meta name="ICP" content="京ICP备 XXXXXXXX 号">` inside the `<head>` block of `src/layouts/Layout.astro`.
3. **Translations review** — the Mandarin dictionary in `src/i18n/zh.ts` is a careful first draft; have a native speaker review before the China launch.
4. **App Store** — the iOS App Store in China has additional review requirements for religious content.

## Adding More Locales

Each locale is one file in `artifacts/ekdharma-site/src/i18n/`. To add a new one (e.g., Portuguese `pt`):

1. Copy `en.ts` → `pt.ts` and translate the strings (keep the same `TranslationDict` shape).
2. In `src/i18n/index.ts`:
   - Add `"pt"` to the `Locale` union.
   - Add `{ code: "pt", label: "Português", path: "/pt/" }` to `SUPPORTED_LOCALES`.
   - Add `pt` to the `DICTIONARIES` map.
   - If the script is RTL, add to `RTL_LOCALES`.
   - Optionally add a doorway hostname mapping in `HOSTNAME_TO_LOCALE`.
   - Add to the `isLocale` type guard.
3. Add a `{ params: { lang: "pt" } }` entry in `src/pages/[lang]/index.astro`'s `getStaticPaths`.

That's it — no other code changes needed. The middleware, layout, and page templates pick it up automatically.

## Adding More Content Pages (Blog, Essays, Per-Region)

This is where the Astro SSR migration pays off. Each new content type follows the same pattern:

- **Blog index**: `src/pages/blog/index.astro` for English, `src/pages/[lang]/blog/index.astro` for other locales.
- **Blog post**: use Astro content collections (`src/content/blog/<slug>.md` with frontmatter), then `src/pages/blog/[slug].astro` to render. Add a sibling `[lang]/blog/[slug].astro` for translations.
- **Per-region landing pages**: `src/pages/regions/[region].astro` — read region from URL param, render localized content.

Every new page automatically inherits per-locale meta tags from `Layout.astro` and the active locale from middleware. Crawlers see fully translated, fully rendered HTML on first request.

## Regional Content That Still Needs Human Curation

The structure is in place; the following are placeholders that should be sourced before launch:

- **Regional photography** — hero / scripture imagery per doorway. Currently all locales share the same ornament.
- **Native-speaker testimonials** — current copy is translated brand voice; real localized testimonials should be sourced post-launch.
- **Per-region scripture ordering** — currently the same grid for everyone. Consider surfacing the most culturally-relevant scriptures first per locale.

## Local Development

```bash
pnpm install
pnpm --filter @workspace/ekdharma-site dev    # marketing site (Astro)
pnpm --filter @workspace/ekdharma dev          # inner web app
pnpm --filter @workspace/api-server dev        # backend
```

Marketing site serves at `http://localhost:21223/ekdharma-site/`. Test other locales via URL prefix: `/ekdharma-site/zh/`, `/ekdharma-site/he/`, etc. Hostname-based detection only works in production (Vite dev blocks non-localhost hosts for security).
