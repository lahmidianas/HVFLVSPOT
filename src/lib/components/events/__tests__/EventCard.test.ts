import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import EventCard from '../EventCard.svelte';

afterEach(() => {
  cleanup();
});

const baseEvent = {
  id: 'event-123',
  title: 'Summer Nights Festival',
  description: 'The biggest party of the summer with multiple stages and artists.',
  image_url: 'https://example.com/poster.jpg',
  start_date: '2030-07-15T21:00:00.000Z',
  location: 'Los Angeles, CA',
  price: 149.99
};

describe('EventCard', () => {
  it('renders the event summary with CTA for the supplied model', () => {
    render(EventCard, { event: baseEvent });

    const imgs = screen.getAllByRole('img', { name: baseEvent.title });
    // At least one image with the correct src
    expect(
      imgs.some((img) => (img as HTMLImageElement).src === baseEvent.image_url)
    ).toBe(true);

    expect(screen.getByText(baseEvent.title)).toBeVisible();
    expect(screen.getByText(/Los Angeles, CA/)).toBeVisible();
    expect(
      screen.getByText(/\$?\s*149\.99/)
    ).toBeVisible();

    const buttons = screen.getAllByRole('button', { name: /get tickets/i });
    expect(buttons[0]).toBeVisible();
  });

  it('allows clicking the CTA without throwing', async () => {
    render(EventCard, { event: baseEvent });

    const [cta] = screen.getAllByRole('button', { name: /get tickets/i });
    await fireEvent.click(cta);

    // NOTE: If EventCard uses navigation (e.g., goto()),
    // we can later mock and assert it. For now, we only assert clickability.
  });

  it('falls back to the placeholder image when no image is provided', () => {
    render(EventCard, {
      event: {
        ...baseEvent,
        image_url: ''
      }
    });

    const imgs = screen.getAllByRole('img', { name: baseEvent.title });
    const sources = imgs.map((img) => (img as HTMLImageElement).src);

    // Ensure at least one image uses the fallback placeholder
    expect(sources.some((src) => src.includes('images.pexels.com'))).toBe(true);
  });
});
