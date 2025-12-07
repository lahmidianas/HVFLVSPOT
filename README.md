# HVFLVSPOT (SvelteKit + Supabase)

Production app runs on **SvelteKit** (Vite, TypeScript, Tailwind) with **Supabase** for auth/data. Any old Next.js scaffolding is deprecated—only the SvelteKit code under `src/` is used.

## Project Structure
- `src/routes/` – SvelteKit routes (pages and server endpoints)
- `src/lib/components/` – UI components (Svelte)
- `src/lib/stores/session.ts` – shared client session store
- `src/lib/supabase.ts` – browser Supabase client (public URL + anon key)
- `src/hooks.server.ts` – per-request Supabase server client (auth cookies)
- `src/routes/dashboard/` – admin dashboard (events CRUD)
- `tests/e2e/` – Playwright end-to-end tests
- `src/lib/components/**/__tests__/` – Vitest component tests

## Environment
Copy `.env.example` to `.env` and set:
```
PUBLIC_SUPABASE_URL=...              # required
PUBLIC_SUPABASE_ANON_KEY=...         # required (same as VITE_SUPABASE_ANON_KEY if used)
SUPABASE_SERVICE_ROLE_KEY=...        # server-only tasks (never exposed to client)
PUBLIC_API_BASE=http://localhost:3000
```
Do **not** import `$env/static/private` from client code; client uses `$env/static/public` only.

## Auth Flow
- Server: `hooks.server.ts` builds a Supabase server client from auth cookies and exposes `locals.supabase` and `locals.getSession`.
- Client: `src/lib/supabase.ts` exports the browser client for UI and the session store.
- Shared session: `src/lib/stores/session.ts` holds the current session for header/profile.

## Admin Access (/dashboard)
- Admin is identified by email: **`anaslahmidi123@gmail.com`**.
- Server load and actions resolve the email via `locals.supabase.auth.getSession()` (fallback to `locals.getSession()` / `auth.getUser()`), normalize it, and gate admin features.
- If email matches admin ? full CRUD for events; otherwise the page renders an “Access denied” section.

## Run the App
```bash
npm install
npm run dev    # start SvelteKit dev server (default http://localhost:5173)
```

## Tests
- Unit/component (Vitest + Testing Library):
  ```bash
  npm run test:unit
  ```
  Vitest is configured with jsdom and ignores Playwright specs.
- E2E (Playwright):
  ```bash
  npx playwright test
  ```
  Ensure the dev server is running (set baseURL in `playwright.config.ts`).

## Admin Dashboard Usage
1) Log in with the admin email above.
2) Visit `/dashboard` to create, edit, or delete events (tickets nested in event query).
3) Non-admin or logged-out users will see an “Access denied” message but no redirect.

## Notes
- Header/profile use the shared session store and Supabase client; no manual cookie writes.
- Keep Supabase keys consistent across client/server; use the anon key client-side only.
