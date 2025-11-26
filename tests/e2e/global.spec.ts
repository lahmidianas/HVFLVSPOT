import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { seedAuthenticatedSession } from './utils/session';

const SUPABASE_EVENTS_ENDPOINT = '**/rest/v1/events**';
const SUPABASE_CATEGORIES_ENDPOINT = '**/rest/v1/categories**';
const RECOMMENDED_ENDPOINT = '**/events/recommended**';
const SEARCH_ENDPOINT = '**/events/search**';
const TICKETS_ENDPOINT = '**/tickets/view**';

const defaultEvents = [
  {
    id: 'global-event-1',
    title: 'Global Music Fest',
    description: 'Sample description',
    image_url: 'https://example.com/music.jpg',
    start_date: '2031-03-01T18:00:00.000Z',
    location: 'Nashville, TN',
    price: 80,
    categories: { name: 'Music', slug: 'music' }
  }
];

const defaultTickets = [
  {
    ...defaultEvents[0],
    id: 'wallet-ticket',
    status: 'confirmed',
    quantity: 1,
    total_price: 80,
    tickets: { type: 'GA', price: 80 },
    events: defaultEvents[0]
  }
];

async function mockGlobalApis(page) {
  await page.route(SUPABASE_CATEGORIES_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
      body: JSON.stringify([{ id: 'music', name: 'Music', slug: 'music' }])
    })
  );

  await page.route(SUPABASE_EVENTS_ENDPOINT, (route) => {
    const url = new URL(route.request().url());
    const idFilter = url.searchParams.get('id');

    if (idFilter?.startsWith('eq.')) {
      const match = defaultEvents.find((event) => event.id === idFilter.replace('eq.', ''));
      if (match) {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
          body: JSON.stringify([match])
        });
        return;
      }
    }

    route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-range': `0-${Math.max(defaultEvents.length - 1, 0)}/${defaultEvents.length}`
      },
      body: JSON.stringify(defaultEvents)
    });
  });

  await page.route(RECOMMENDED_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        events: defaultEvents,
        metadata: { total: defaultEvents.length, hasMore: false }
      })
    })
  );

  await page.route(SEARCH_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        events: defaultEvents,
        pagination: { page: 1, limit: 10, total: defaultEvents.length, totalPages: 1 }
      })
    })
  );

  await page.route(TICKETS_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(defaultTickets)
    })
  );
}

test.describe('Global flows', () => {
  test('navigation smoke test via header links', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockGlobalApis(page);

    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();

    await page.getByRole('link', { name: /All Events/i }).click();
    await expect(page).toHaveURL(/\/events/);

    await page.locator('nav').getByRole('link', { name: /^Events$/i }).last().click();
    await expect(page).toHaveURL(/\/search/);

    await page.getByRole('link', { name: /Tickets/i }).click();
    await expect(page).toHaveURL(/\/wallet/);

    await page.getByRole('link', { name: /Home/i }).click();
    await expect(page).toHaveURL('/');

    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole('link', { name: /Sign Up/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows graceful network failure messages across pages', async ({ page }) => {
    await page.route('**localhost:3000/**', (route) => route.abort('failed'));
    await page.route('**supabase.co/rest/v1/**', (route) => route.abort('failed'));

    await page.goto('/');
    await expect(page.getByText(/Unable to load events/i)).toBeVisible();

    await page.goto('/events');
    await expect(page.getByText(/Search Temporarily Unavailable/i)).toBeVisible();
  });

  test('meets baseline accessibility expectations on key routes', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockGlobalApis(page);

    const routes = ['/', '/events', '/events/global-event-1', '/login', '/wallet'];
    for (const path of routes) {
      await page.goto(path);
      const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
      const results = await axe.analyze();
      expect(results.violations).toStrictEqual([]);
    }
  });
});
