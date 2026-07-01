# Early-Access Signup — Notes

Fail-safe public early-access lead capture for the Noorjyoti web landing
(`artifacts/web`, Vite + React).

## Where it lives

- **Route:** `/early-access` (public — accessible signed-in or signed-out).
  Registered in `artifacts/web/src/App.tsx`.
- **Page/form:** `artifacts/web/src/pages/early-access.tsx`
- **Queue + delivery logic:** `artifacts/web/src/lib/signup-queue.ts`
- **SEO:** entry added in `artifacts/web/src/lib/route-seo.tsx`
- **Homepage CTAs:** hero button + dedicated "Be the first to listen" section
  in `artifacts/web/src/pages/home.tsx` (both link to `/early-access`).

## Fields

| Field             | Required | Notes |
|-------------------|----------|-------|
| Full name         | Yes      | |
| Email             | Yes      | Validated (`[^\s@]+@[^\s@]+\.[^\s@]+`) |
| Phone             | Yes      | Validated (7–15 digits, intl chars allowed) |
| Role              | Yes      | Toggle: **Individual** vs **Organization / Partner** |
| Organization name | No       | Shown only when role = Organization; optional |
| Consent           | Yes      | Checkbox — see exact text below |

**Consent text (exact):**

> I consent to Noorjyoti contacting me about this service and storing the
> information I provide. I understand this is an early-access sign-up. I can
> withdraw at any time.

The submit button is **disabled until consent is checked**.

## Fail-safe submit flow

Implemented in `early-access.tsx` `handleSubmit` + `signup-queue.ts`:

1. **Persist first.** On submit the lead is written to `localStorage` under the
   key **`tm_signup_queue`** *before* any network call (`enqueueSignup`). This
   is the durability guarantee — nothing can drop the lead after this point.
2. **Best-effort delivery.** There is no existing signup/lead backend API in
   this repo (auth is handled separately by Clerk), so delivery targets
   `import.meta.env.VITE_SIGNUP_ENDPOINT` when set — a JSON `POST`
   (`deliverSignup`). If a real lead API is added later, wire it into
   `deliverSignup`.
3. **Never a dead end.** On delivery failure *or* when no endpoint is
   configured, the entry stays queued (already persisted) and the user is
   **still shown a success screen**. A prefilled `mailto:hello@noorjyoti.com`
   fallback is offered so they can reach us directly.
4. **Retry-flush on next load.** `flushSignupQueue()` runs once on app mount
   (`App.tsx`) and re-attempts delivery for every unsynced entry. Delivered
   entries are marked `synced: true` so they are not resent.

## Configuration

- `VITE_SIGNUP_ENDPOINT` — optional. Absolute URL that accepts a JSON `POST`:

  ```json
  {
    "fullName": "…",
    "email": "…",
    "phone": "…",
    "role": "individual" | "organization",
    "organizationName": "…",   // optional
    "consent": true,
    "submittedAt": "ISO-8601",
    "source": "web/early-access"
  }
  ```

  A `2xx` response marks the entry delivered. If unset, leads are kept locally
  and the mailto fallback covers delivery.

## Accessibility

- Native `<form>` with `<label>`/`htmlFor`, `fieldset`/`legend` for the role
  toggle, `aria-required`, `aria-invalid`, and `aria-describedby` error links.
- Invalid submit moves focus to the first invalid field.
- `aria-live="polite"` regions announce submitting state and the success result.
- Fully keyboard operable (Radix checkbox/radio primitives + native inputs).

## Inspecting the local queue

In the browser console:

```js
JSON.parse(localStorage.getItem("tm_signup_queue"))
```
