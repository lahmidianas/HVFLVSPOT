import { expect, test } from '@playwright/test';
import { seedAuthenticatedSession } from './utils/session';

const SUPABASE_EVENTS_ENDPOINT = '**/rest/v1/events**';
const SUPABASE_CATEGORIES_ENDPOINT = '**/rest/v1/categories**';
const RECOMMENDED_ENDPOINT = '**/events/recommended**';

const featuredEvents = [
  {
    id: 'feature-1',
    title: 'Featured Jazz Night',
    description: 'Smooth jazz with local legends.',
    image_url: 'https://example.com/jazz.jpg',
    start_date: '2030-02-01T20:00:00.000Z',
    location: 'Chicago, IL',
    price: 60,
    categories: { name: 'Music', slug: 'music' }
  }
];

const recommendedEvents = [
  {
    id: 'rec-1',
    title: 'VIP Rooftop Party',
    description: 'City skyline views with exclusive DJ sets.',
    image_url: 'https://example.com/rooftop.jpg',
    start_date: '2030-05-20T23:00:00.000Z',
    location: 'New York, NY',
    price: 180,
    categories: { name: 'Nightlife', slug: 'nightlife' }
  }
];

async function mockCategories(page) {
  await page.route(SUPABASE_CATEGORIES_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
      body: JSON.stringify([{ id: 'music', name: 'Music', slug: 'music' }])
    })
  );
}

async function mockEventsFeed(page, { list = featuredEvents, error = false }: { list?: any[]; error?: boolean }) {
  await page.route(SUPABASE_EVENTS_ENDPOINT, (route) => {
    if (error) {
      route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'server error' })
      });
      return;
    }

    const url = new URL(route.request().url());
    const idFilter = url.searchParams.get('id');

    if (idFilter?.startsWith('eq.')) {
      const match = list.find((event) => event.id === idFilter.replace('eq.', ''));
      if (match) {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
          body: JSON.stringify([match])
        });
        return;
      }

      route.fulfill({
        status: 406,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: 'PGRST116', message: 'No rows' })
      });
      return;
    }

    route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-range': `0-${Math.max(list.length - 1, 0)}/${list.length}`
      },
      body: JSON.stringify(list)
    });
  });
}

async function mockRecommended(page, { events = recommendedEvents, error = false }: { events?: any[]; error?: boolean }) {
  await page.route(RECOMMENDED_ENDPOINT, (route) => {
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
        metadata: {
          total: events.length,
          hasMore: false
        }
      })
    });
  });
}

test.describe('Home page', () => {
  test('renders recommended and featured sections when data is returned', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockCategories(page);
    await mockEventsFeed(page, { list: featuredEvents });
    await mockRecommended(page, { events: recommendedEvents });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: /recommended for you/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /featured events/i })).toBeVisible();
    await expect(page.getByText(recommendedEvents[0].title)).toBeVisible();
    await expect(page.getByText(featuredEvents[0].title)).toBeVisible();
  });

  test('shows empty states when the API returns no events', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockCategories(page);
    await mockEventsFeed(page, { list: [] });
    await mockRecommended(page, { events: [] });

    await page.goto('/');

    await expect(page.getByText(/No featured events found/i)).toBeVisible();
    await expect(page.locator('text=Something went wrong')).toHaveCount(0);
  });

  test('surfaces error messaging when APIs fail', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockCategories(page);
    await mockEventsFeed(page, { list: [], error: true });
    await mockRecommended(page, { events: [], error: true });

    await page.goto('/');

    await expect(page.getByText(/Unable to load events/i)).toBeVisible();
    await expect(page.getByText(/Unable to load recommendations/i)).toBeVisible();
  });
});
