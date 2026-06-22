# Threat Model

## Project Overview

NoorJyoti is a public multi-domain spiritual-content product deployed on Replit. The live deployment serves an Astro SSR marketing site for multiple locales, a production-reachable inner web app mounted at `/ekdharma`, and a shared Express API used by the web and mobile clients. The API uses Clerk for authenticated user data, PostgreSQL via Drizzle ORM for content and personalization state, and OpenAI-backed text-to-speech generation with cached audio storage. Because the live `/ekdharma` experience is a long-lived SPA, client-side caches are part of the effective trust boundary for authenticated user data.

The highest-value production assets are user account identity, personalized listening/bookmark/history data, administrative audio-replacement capability, and the OpenAI-backed synthesis budget exposed through public API routes.

## Assets

- **User identity and session state** — Clerk sessions and any bearer tokens used by mobile clients. Compromise would let an attacker read or modify a listener's personalized data.
- **Personalized listener data** — bookmarks, favorites, listening history, dashboard state, and preferences stored in Postgres. This is user-scoped data that must not cross account boundaries.
- **Administrative media controls** — the admin-only track replacement route can publish or replace audio content under the product's origin. Abuse would let an attacker alter media served to all users.
- **Audio generation budget and upstream API credentials** — synthesis requests trigger paid OpenAI calls. Abuse can create direct financial impact even without data theft.
- **Brand and origin integrity** — the SSR site renders canonical URLs, locale metadata, and share-preview tags per request. Trusting attacker-controlled origin data can enable phishing, cache poisoning, or auth-flow confusion.

## Trust Boundaries

- **Browser/mobile client to API** — all request bodies, query params, cookies, headers, bearer tokens, and client-side cached API data are untrusted until validated or revalidated server-side.
- **Anonymous user to authenticated user** — `/api/tracks/synthesize` intentionally serves guests, while `/api/me/*` and admin tooling require stronger identity checks. This boundary must hold on the server, not just in clients.
- **Authenticated user to admin** — `/api/tracks/admin/replace` is privileged and must remain restricted to configured admin identities.
- **API to PostgreSQL** — the API can read and mutate all user data and quota data. Query scoping and input validation must prevent cross-user access and corruption.
- **API to external services** — the backend calls Clerk, OpenAI, and object storage with server-held secrets. Callers must not be able to steer those integrations to attacker-controlled origins or consume them without business-rule enforcement.
- **Deployment edge to SSR/API code** — Host and forwarding headers arrive from outside the app and must not be trusted for security-sensitive decisions unless normalized by the platform.
- **Production to dev-only tooling** — `scripts/**`, attached assets, import helpers, `artifacts/mockup-sandbox/**`, and local mobile build helpers are out of production scope unless a live production route reaches them.

## Scan Anchors

- **Production entry points:** `artifacts/ekdharma-site/src/**` for public SSR pages, `artifacts/ekdharma/src/**` for the live inner web app under `/ekdharma`, and `artifacts/api-server/src/index.ts` + `src/app.ts` + `src/routes/**` for the shared API.
- **Highest-risk code areas:** `artifacts/api-server/src/routes/tracks.ts`, `artifacts/api-server/src/middlewares/requireAuth.ts`, `artifacts/api-server/src/middlewares/resolveUserOrAnon.ts`, `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`, `artifacts/api-server/src/routes/me.ts`, and `/ekdharma` auth-adjacent client state in `artifacts/ekdharma/src/App.tsx` plus `src/pages/{home,library,profile}.tsx`.
- **Public vs authenticated vs admin surfaces:** public catalog/unity/marketing routes, public `/ekdharma/**` client routes that consume authenticated `/api/me/*` data when a Clerk session exists, anonymous `/api/tracks/synthesize`, authenticated `/api/me/*`, and admin-only `/api/tracks/admin/replace`.
- **Usually ignore unless production reachability is proven:** `attached_assets/**`, Python TTS/import scripts, `scripts/**`, `artifacts/mockup-sandbox/**`, `artifacts/web/**`, and `artifacts/mobile/server/serve.js` plus other mobile local build/preview tooling.

## Threat Categories

### Spoofing

The application depends on Clerk identity for authenticated listener data and an environment-based admin allowlist for privileged audio replacement. Protected API routes must derive identity from validated Clerk state on every request, and any request-header-derived origin or proxy metadata must not let an attacker impersonate a trusted host or service.

Required guarantees:
- All `/api/me/*` routes MUST require a valid Clerk-authenticated user.
- Admin-only routes MUST enforce the configured admin identity allowlist server-side.
- Host or forwarding headers MUST NOT be trusted for authentication or origin decisions unless the platform has already canonicalized them.
- Clerk proxy URLs and similar auth-handshake origins MUST come from trusted server-side configuration or an allowlisted canonical host, not raw client-supplied `X-Forwarded-*` data.

### Tampering

Clients can submit chapter IDs, preferences, bookmark notes, and synthesis parameters, while admins can upload replacement media. The server must validate user-controlled inputs and ensure that users can only mutate their own rows and that uploaded media cannot change how the site executes code.

Required guarantees:
- User-controlled identifiers and mutation routes MUST be scoped to the authenticated user on the server.
- Media replacement flows MUST validate and constrain uploaded content before publishing it under the product's origin, and MUST only serve safe audio media types from public track URLs.
- Header-derived routing or locale logic MUST NOT let attackers rewrite trusted metadata or security-sensitive URLs.

### Information Disclosure

The API returns personalized listening data, and the SSR site emits canonical and OpenGraph metadata that represent the app's public identity. Responses, logs, error paths, and client-side caches must not expose another user's data, secrets, cookies, or internal service details.

Required guarantees:
- Personalized API responses MUST only include data for the acting user.
- Client-side caches of `/api/me/*` data MUST be keyed by user identity or cleared immediately when auth state changes, so one user's personalization cannot remain visible after logout or account switch on a shared browser/app instance.
- Logs MUST redact auth cookies, bearer tokens, and other sensitive headers.
- Public responses MUST NOT expose secrets, raw upstream errors, or attacker-controlled metadata as trusted origin information.

### Denial of Service

Anonymous and authenticated callers can trigger OpenAI-backed synthesis. Because this is a paid, resource-consuming action, any weak identity for guest rate limiting can be exploited for financial abuse or service degradation.

Required guarantees:
- Paid synthesis operations MUST have tamper-resistant abuse controls for anonymous callers, not just client-resettable identifiers.
- Anonymous quota identity MUST NOT rely solely on spoofable forwarded-IP headers.
- Anonymous abuse controls MUST distinguish independent guest users in production and MUST NOT collapse all public traffic into a single ingress- or proxy-shared bucket.
- Secondary anonymous IP guardrails MUST only charge the abuse-detection cases they are meant to police; normal cache-hit playback by established anonymous visitors MUST NOT consume shared IP budget.
- A single anonymous request MUST NOT consume multiple shared IP quota hits just because it followed both the early abuse-check path and the later cold-cache path.
- Public expensive endpoints MUST enforce server-side quotas or other anti-automation controls that survive cookie clearing and replay.
- Cold-cache synthesis for the same `(chapterId, language, voice)` tuple MUST be deduplicated before paid upstream translation or TTS work begins, so parallel requests cannot multiply external spend for one cache entry.
- External-service calls involved in public endpoints SHOULD fail safely without permanently consuming user quota on upstream errors.
- Privileged upload endpoints SHOULD reject unauthorized callers before buffering large request bodies into memory.
- The public Clerk proxy MUST NOT forward attacker-supplied `X-Forwarded-For` values to Clerk for auth endpoints, because Clerk's abuse controls depend on the forwarded client IP being trustworthy.

### Elevation of Privilege

The most likely privilege-escalation paths are broken user scoping on `/api/me/*`, bypass of the admin replacement route, or abuse of trusted request metadata to influence auth-related behavior. The server must not let ordinary users or anonymous callers access administrative capability or cross-account data.

Required guarantees:
- Every authenticated route MUST enforce server-side ownership checks on database reads and writes.
- Admin functionality MUST remain unreachable to non-admin users even if clients call the route directly.
- Request metadata used by auth or proxy code MUST NOT create a path from unauthenticated control to privileged behavior.
