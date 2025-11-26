import { expect, test } from '@playwright/test';

const SUPABASE_EVENTS_ENDPOINT = '**/rest/v1/events**';
const SUPABASE_TICKETS_ENDPOINT = '**/rest/v1/tickets**';

async function mockEventDetail(
  page,
  {
    event,
    tickets,
    notFound = false
  }: {
    event?: any;
    tickets?: any[];
    notFound?: boolean;
  }
) {
  await page.route(SUPABASE_EVENTS_ENDPOINT, (route) => {
    if (notFound) {
      route.fulfill({
        status: 406,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: 'PGRST116', message: 'No rows' })
      });
      return;
    }

    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
      body: JSON.stringify([event])
    });
  });

  await page.route(SUPABASE_TICKETS_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-range': `0-${Math.max((tickets?.length ?? 1) - 1, 0)}/${tickets?.length ?? 0}`
      },
      body: JSON.stringify(tickets ?? [])
    })
  );
}

const baseEvent = {
  id: 'detail-1',
  title: 'Lakeside Concert Series',
  description: 'An outdoor evening with indie favorites.',
  image_url: 'https://example.com/lake.jpg',
  start_date: '2030-08-12T19:00:00.000Z',
  location: 'Seattle, WA',
  capacity: 2000,
  categories: { name: 'Music', slug: 'music' }
};

test.describe('Event detail page', () => {
  test('shows information and allows navigating to checkout for upcoming events', async ({ page }) => {
    await mockEventDetail(page, {
      event: baseEvent,
      tickets: [
        { id: 'ticket-1', type: 'General Admission', price: 75, quantity: 100 },
        { id: 'ticket-2', type: 'VIP', price: 150, quantity: 10 }
      ]
    });

    await page.goto(`/events/${baseEvent.id}`);

    await expect(page.getByRole('heading', { name: baseEvent.title })).toBeVisible();
    await expect(page.getByText(/Select Tickets/i)).toBeVisible();
    await expect(page.getByText('$150')).toBeVisible();
  });

  test('displays a sold out indicator when no tickets remain', async ({ page }) => {
    await mockEventDetail(page, {
      event: baseEvent,
      tickets: [{ id: 'ticket-1', type: 'General Admission', price: 75, quantity: 0 }]
    });

    await page.goto(`/events/${baseEvent.id}`);

    await expect(page.getByText(/Sold Out/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Get Tickets/i })).toHaveCount(0);
  });

  test('shows a coming soon state for events without purchasable tickets (e.g. past event)', async ({ page }) => {
    await mockEventDetail(page, {
      event: { ...baseEvent, id: 'detail-past', start_date: '2020-08-12T19:00:00.000Z' },
      tickets: []
    });

    await page.goto('/events/detail-past');

    await expect(page.getByText(/Tickets Coming Soon/i)).toBeVisible();
  });

  test('renders the not found state for unknown event IDs', async ({ page }) => {
    await mockEventDetail(page, { notFound: true });

    await page.goto('/events/missing-event');

    await expect(page.getByText(/Event Not Found/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Browse All Events/i })).toHaveAttribute('href', '/events');
  });
});
