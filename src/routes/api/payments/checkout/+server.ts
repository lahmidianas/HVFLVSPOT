import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY in environment');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Authenticate user via server-side Supabase client in hooks
    const { data: userData, error: userError } = await locals.supabase.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, items } = body || {};

    if (!eventId || !Array.isArray(items) || items.length === 0) {
      return json({ message: 'Invalid payload' }, { status: 400 });
    }

    // Validate items and fetch ticket data from Supabase (server/admin client)
    const ticketIds = items.map(i => i.ticketId);
    const { data: ticketsData, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .in('id', ticketIds);

    if (ticketsError) {
      console.error('Failed to load tickets', ticketsError.message);
      return json({ message: 'Failed to load ticket data' }, { status: 500 });
    }

    const ticketsById = Object.fromEntries((ticketsData || []).map(t => [t.id, t]));

    // validate each item: belongs to event, quantity > 0, quantity <= stock
    for (const item of items) {
      const { ticketId, quantity } = item;
      if (!ticketId || typeof quantity !== 'number' || quantity <= 0) {
        return json({ message: 'Invalid item in cart' }, { status: 400 });
      }
      const ticket = ticketsById[ticketId];
      if (!ticket) {
        return json({ message: `Ticket not found: ${ticketId}` }, { status: 400 });
      }
      if (ticket.event_id !== eventId) {
        return json({ message: 'Ticket does not belong to event' }, { status: 400 });
      }
      if (ticket.quantity < quantity) {
        return json({ message: 'Insufficient ticket stock' }, { status: 400 });
      }
    }

    // Build Stripe line_items from authoritative ticket data (price from DB)
    const line_items = items.map(item => {
      const ticket = ticketsById[item.ticketId];
      const unit_amount = Math.round(Number(ticket.price) * 100);
      return {
        price_data: {
          currency: 'eur',
          product_data: { name: `${ticket.type} - ${ticket.id}` },
          unit_amount
        },
        quantity: item.quantity
      };
    });

    // Metadata: don't trust frontend prices; store authoritative references
    const metadata = {
      user_id: user.id,
      event_id: eventId,
      items: JSON.stringify(items)
    };

    // Determine origin for redirect (best-effort)
    const origin = request.headers.get('origin') || `http://localhost:5173`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      metadata,
      currency: 'eur',
      success_url: `${origin}/wallet?success=1`,
      cancel_url: `${origin}/events/${eventId}`
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('Checkout error', err);
    return json({ message: 'Internal server error' }, { status: 500 });
  }
};
