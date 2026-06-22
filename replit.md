# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

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

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

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

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
