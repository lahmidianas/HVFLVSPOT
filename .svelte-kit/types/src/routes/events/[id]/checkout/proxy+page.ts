// @ts-nocheck
import type { PageLoad } from './$types';

export const load = async ({ params, url }: Parameters<PageLoad>[0]) => {
  // Parse cart data from URL parameters
  const cartData = {};
  const ticketParams = url.searchParams.getAll('ticket');
  
  ticketParams.forEach(param => {
    const [ticketId, quantity] = param.split(':');
    if (ticketId && quantity) {
      cartData[ticketId] = parseInt(quantity);
    }
  });

  return {
    eventId: params.id,
    initialCart: cartData
  };
};