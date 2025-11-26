import { expect, test } from '@playwright/test';
import { seedAuthenticatedSession } from './utils/session';

const SEARCH_ENDPOINT = '**/events/search**';
const SUPABASE_CATEGORIES_ENDPOINT = '**/rest/v1/categories**';
const SUPABASE_EVENTS_ENDPOINT = '**/rest/v1/events**';

const searchResult = {
  id: 'search-1',
  title: 'City Lights Festival',
  description: 'Multi-stage electronic festival',
  image_url: 'https://example.com/city-lights.jpg',
  start_date: '2030-09-01T19:00:00.000Z',
  location: 'Denver, CO',
  price: 95,
  categories: { name: 'Festival', slug: 'festival' }
};

async function mockCategories(page) {
  await page.route(SUPABASE_CATEGORIES_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
      body: JSON.stringify([{ id: 'festival', name: 'Festival', slug: 'festival' }])
    })
  );
}

async function mockSearch(page, { events, error = false }: { events: any[]; error?: boolean }) {
  await page.route(SEARCH_ENDPOINT, (route) => {
    if (error) {
      route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'server error' })
      });
      return;
    }

    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        events,
        pagination: {
          page: 1,
          limit: 12,
          total: events.length,
          totalPages: 1
        }
      })
    });
  });
}

async function mockEventDetailRequests(page, events: any[]) {
  await page.route(SUPABASE_EVENTS_ENDPOINT, (route) => {
    const url = new URL(route.request().url());
    const idFilter = url.searchParams.get('id');

    if (idFilter?.startsWith('eq.')) {
      const match = events.find((event) => event.id === idFilter.replace('eq.', ''));
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
        'content-range': `0-${Math.max(events.length - 1, 0)}/${events.length}`
      },
      body: JSON.stringify(events)
    });
  });
}

test.describe('Search / events listing page', () => {
  test('displays search results and navigates to detail pages', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockCategories(page);
    await mockSearch(page, { events: [searchResult] });
    await mockEventDetailRequests(page, [searchResult]);

    await page.goto('/events?q=festival');

    await expect(page.getByText(searchResult.title)).toBeVisible();
    await expect(page.locator('text=Filters & Sort')).toBeVisible();

    const cta = page.getByRole('button', { name: /get tickets/i }).first();
    await Promise.all([page.waitForURL(new RegExp(`/events/${searchResult.id}`)), cta.click()]);
  });

  test('shows the empty state when no events match the query', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockCategories(page);
    await mockSearch(page, { events: [] });
    await mockEventDetailRequests(page, []);

    await page.goto('/events?q=unknown');

    await expect(page.getByText(/No events found/i)).toBeVisible();
  });

  test('shows an error state when the search API fails', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockCategories(page);
    await mockSearch(page, { events: [], error: true });
    await mockEventDetailRequests(page, []);

    await page.goto('/events?q=error');

    await expect(page.getByText(/Search Temporarily Unavailable/i)).toBeVisible();
  });
});
