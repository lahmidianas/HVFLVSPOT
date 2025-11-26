import type { Page } from '@playwright/test';

const projectRef =
  process.env.PUBLIC_SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1] ??
  'vrdwrdstxlejwngvchga';

export async function seedAuthenticatedSession(page: Page, overrides: Record<string, unknown> = {}) {
  const baseTimestamp = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: baseTimestamp,
    refresh_token: 'test-refresh-token',
    user: {
      id: 'test-user-id',
      email: 'test-user@example.com',
      ...overrides
    }
  };

  await page.addInitScript(
    ({ key, payload }) => {
      window.localStorage.setItem(key, JSON.stringify(payload));
    },
    {
      key: `sb-${projectRef}-auth-token`,
      payload: {
        currentSession: session,
        expiresAt: session.expires_at
      }
    }
  );
}
