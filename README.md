# HVFLVSPOT (SvelteKit + Supabase)

Production app runs on **SvelteKit** (Vite, TypeScript, Tailwind) with **Supabase** for auth/data. Only the SvelteKit code under `src/` is active.

## Project Structure
- `src/routes/` - SvelteKit routes (pages and server endpoints)
- `src/lib/components/` - UI components (Svelte)
- `src/lib/stores/session.ts` - shared client session store
- `src/lib/supabase.ts` - browser Supabase client (public URL + anon key)
- `src/hooks.server.ts` - per-request Supabase server client (auth cookies)
- `src/routes/dashboard/` - admin dashboard (events CRUD + organizer approvals)
- `src/routes/organizer/` - organizer dashboard + application flow
- `src/routes/events/[id]` - event detail with ticket purchase action
- `src/routes/wallet/` - bookings view for the logged-in user
- `tests/e2e/` - Playwright end-to-end tests
- `src/lib/components/**/__tests__/` - Vitest component tests

## Environment
Copy `.env.example` to `.env` and set:
```
PUBLIC_SUPABASE_URL=...              # required
PUBLIC_SUPABASE_ANON_KEY=...         # required (same as VITE_SUPABASE_ANON_KEY if used)
SUPABASE_SERVICE_ROLE_KEY=...        # server-only tasks (never exposed to client)
VITE_API_BASE=http://localhost:3000   # backend API base URL used by ApiClient in src/lib/api.ts
# Optionally also set PUBLIC_API_BASE if you still need a public alias, but the code reads VITE_API_BASE
```
Do **not** import `$env/static/private` from client code; client uses `$env/static/public` only.

## Auth Flow
- Server: `hooks.server.ts` builds a Supabase server client from auth cookies and exposes `locals.supabase` and `locals.getSession`.
- Client: `src/lib/supabase.ts` exports the browser client for UI and the session store.
- Shared session: `src/lib/stores/session.ts` holds the current session for header/profile.

## Roles & Access
- Admin is identified by email: **`anaslahmidi123@gmail.com`**.
- Admin dashboard: `/dashboard` (events CRUD, approve/remove organizer applications).
- Organizer dashboard: `/organizer` (requires role `organizer` or `admin`; manages own events/tickets).
- Organizer application: regular users can submit/modify an application; admin approval promotes via trigger.
- Event detail: `/events/[id]` loads by `id` and exposes a `purchaseTicket` action.
- Wallet: `/wallet` shows real bookings for the logged-in user.

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

## Key Flows
- **Admin**: log in with admin email -> go to `/dashboard` to manage all events and approve/decline organizer applications.
- **Organizer**: users with role `organizer` (or admin) -> `/organizer` to create/update/delete their own events and tickets.
- **Apply as Organizer**: regular user -> submit the `/organizer` application form -> admin approval triggers promotion via DB trigger.
- **Buy Tickets**: `/events/[id]` -> choose ticket type/quantity -> `purchaseTicket` action creates booking + transaction, decrements ticket stock, then redirects to `/wallet`.
- **Wallet**: `/wallet` shows upcoming and past bookings with event and ticket details.

## Payments & webhooks
- Stripe checkout is created in `src/routes/api/payments/checkout/+server.ts` and fulfilled in the webhook at `src/routes/api/payments/webhook/+server.ts`.
- Webhook processing today is best-effort but **not idempotent** and does not reserve stock; if Stripe retries the same event or two webhook deliveries overlap, inventory can be decremented multiple times and duplicate bookings/transactions can appear. Treat webhook processing as at-most-once and add idempotency keys + transactional stock updates before production.
- Ticket stock is only checked at checkout time; concurrent checkouts can oversell. Consider locking rows or introducing a reservation/hold table before redirecting to Stripe.

## Data access notes
- The wallet page (`src/routes/wallet/+page.svelte`) currently loads bookings directly from the browser Supabase client via `ticketApi.getUserTickets()`. Ensure RLS on `bookings`, `events`, and `tickets` prevents cross-user access; otherwise move this query server-side.

## Notes
- Header/profile use the shared session store and Supabase client; no manual cookie writes.
- Keep Supabase keys consistent across client/server; use the anon key client-side only.
