# NoorJyoti

NoorJyoti is a free sacred-audio library that reads the world's great scriptures aloud in soothing AI voices across nine languages.

> Deployment, multi-domain locale routing, and China-launch notes live in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run test` — run all package tests (fans out via `pnpm -r --if-present run test`); requires `DATABASE_URL`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ekdharma-site/` — marketing site (Astro SSR + React islands, all locales). Locale routing/meta live in `src/middleware.ts` and `src/i18n/index.ts`; translations in `src/i18n/*.ts`.
- `artifacts/ekdharma/` — inner web app (audio player, library).
- `artifacts/web/` — inner web app (legacy duplicate of `ekdharma`).
- `artifacts/mobile/` — Expo mobile app.
- `artifacts/api-server/` — shared Express backend.
- `lib/api-spec/openapi.yaml` — **source of truth for API contracts** (drives codegen in `lib/api-zod` and `lib/api-client-react`).
- `lib/db/` — Drizzle schema (source of truth for the database).
- Root `*.py` — standalone TTS content-generation scripts (Bhagavad Gita, Ram Charit Manas, ekdharma voice gen); not part of the web/mobile runtime.
- Dependency overrides live in `pnpm-workspace.yaml` (`overrides:`). pnpm v10+ no longer reads a `pnpm.overrides` field from `package.json`.

## Architecture decisions

- **OpenAPI is the source of truth for typed clients**, with two intentional
  exceptions that are documented inline in `lib/api-spec/openapi.yaml`:
  - `GET /api/tracks/:id/audio` — raw MP3 stream. Clients reach it via the
    stable `audioUrl` field on the `Track` schema, so codegen does not need
    to model the binary response.
  - `POST /api/tracks/admin/replace` — multipart, admin-only swap of cached
    TTS audio with a human recording (gated by `ADMIN_USER_IDS` env). It is
    internal tooling, not consumed by any generated client.
- TTS is generated on demand via OpenAI `textToSpeech`, cached server-side
  in `audio_tracks` (object storage when configured, DB bytea fallback)
  keyed by `(chapterId, language, voice)`. The `source` flag (`tts|human`)
  lets the catalog upgrade to human-recorded audio without breaking the
  client contract.
- Background playback on mobile relies on `expo-audio`'s
  `setAudioModeAsync({ shouldPlayInBackground: true })` plus the platform
  entitlements declared in `artifacts/mobile/app.json` (iOS
  `UIBackgroundModes=audio`, Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK`),
  which is what surfaces the OS lock-screen / Control Center transport
  controls automatically.

## Product

- A public-domain scripture-audio library spanning the major traditions (Bible, Quran, Torah, Bhagavad Gita, Dhammapada, Upanishads, Guru Granth Sahib, Jain Agamas and more).
- On-demand AI narration (OpenAI TTS) in nine languages, cached server-side and upgradeable to human recordings without breaking the client contract.
- One deployment serving many culturally-tailored domains; the active locale is auto-selected from the request `Host` / URL prefix and overridable via an in-page language switcher.
- Web (Vite/React) and mobile (Expo) clients, with background/lock-screen playback on mobile.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Use **pnpm** (an npm/yarn `install` is blocked by the `preinstall` guard). Dependency overrides go in `pnpm-workspace.yaml`, not `package.json`.
- The `web` / `ekdharma` Vite config **requires `PORT` and `BASE_PATH` env vars even for `build`** (not just `dev`/`preview`). CI builds must set them, e.g. `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/web build`.
- Hostname-based locale detection only works in production; in Vite dev, test locales via the URL prefix (`/zh/`, `/he/`, …).
- API clients are generated from `lib/api-spec/openapi.yaml` — change the spec and re-run codegen rather than editing generated files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
