import { expect, test } from '@playwright/test';
import { seedAuthenticatedSession } from './utils/session';

const WALLET_ENDPOINT = '**/tickets/view**';
const SUPABASE_EVENTS_ENDPOINT = '**/rest/v1/events**';

async function mockWallet(page, { tickets, status = 200 }: { tickets: any[]; status?: number }) {
  await page.route(WALLET_ENDPOINT, (route) =>
    route.fulfill({
      status,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(tickets)
    })
  );
}

// Wallet page does not refetch via Supabase, but the layout still loads categories/events for other components.
async function mockNoopEvents(page) {
  await page.route(SUPABASE_EVENTS_ENDPOINT, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': '0-0/0' },
      body: JSON.stringify([])
    })
  );
}

const baseTicket = {
  id: 'ticket-101',
  status: 'confirmed',
  quantity: 2,
  qr_code: 'QRDATA',
  total_price: 200,
  tickets: {
    type: 'VIP',
    price: 100
  },
  events: {
    id: 'event-500',
    title: 'Lantern Parade',
    description: 'Family-friendly lantern parade through downtown.',
    start_date: '2031-01-10T18:00:00.000Z',
    location: 'Austin, TX',
    image_url: 'https://example.com/lantern.jpg'
  }
};

const pastTicket = {
  ...baseTicket,
  id: 'ticket-102',
  status: 'confirmed',
  events: {
    ...baseTicket.events,
    id: 'event-600',
    title: 'Past Lantern Parade',
    start_date: '2020-01-10T18:00:00.000Z'
  }
};

test.describe('Wallet page', () => {
  test('redirects anonymous visitors to the login page', async ({ page }) => {
    await page.goto('/wallet');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fwallet/);
  });

  test('renders tickets for authenticated users', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockWallet(page, { tickets: [baseTicket, pastTicket] });
    await mockNoopEvents(page);

    await page.goto('/wallet');

    await expect(page.getByText(/Upcoming Events/i)).toBeVisible();
    await expect(page.getByText(baseTicket.events.title)).toBeVisible();
    await expect(page.getByText(/Past Event/)).toBeVisible();
  });

  test('shows the empty state when a wallet has no tickets', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockWallet(page, { tickets: [] });
    await mockNoopEvents(page);

    await page.goto('/wallet');

    await expect(page.getByText(/No tickets yet/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Browse Events/i })).toHaveAttribute('href', '/events');
  });

  test('surfaces an error when the wallet API fails', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockWallet(page, { tickets: [], status: 500 });
    await mockNoopEvents(page);

    await page.goto('/wallet');

    await expect(page.getByText(/Unable to load your tickets/i)).toBeVisible();
  });
});
