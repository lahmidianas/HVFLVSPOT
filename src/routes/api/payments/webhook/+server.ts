import type { RequestHandler } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
if (!STRIPE_WEBHOOK_SECRET) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

// Use account default API version to avoid mismatches with the dashboard/CLI
const stripe = new Stripe(STRIPE_SECRET_KEY);

export const POST: RequestHandler = async ({ request }) => {
  console.log('🔥 Webhook hit!');

  const sig = request.headers.get('stripe-signature') ?? '';
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message ?? err);
    return new Response('Invalid signature', { status: 400 });
  }

  console.log('✅ Stripe event received:', event.type);

  // Only process checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    return new Response(`Ignored event type ${event.type}`, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    const metadata = session.metadata || {};
    const user_id = metadata.user_id;
    const event_id = metadata.event_id;
    const items = metadata.items ? JSON.parse(metadata.items) : [];

    console.log('Session metadata:', metadata);

    if (!user_id || !event_id || !Array.isArray(items)) {
      console.error('Webhook missing metadata', metadata);
      return new Response('Missing metadata', { status: 400 });
    }

    for (const item of items) {
      const { ticketId, quantity } = item || {};
      if (!ticketId || !quantity) {
        console.warn('Skipping item with missing ticketId/quantity', item);
        continue;
      }

      // Load ticket
      const { data: ticket, error: ticketErr } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketErr || !ticket) {
        console.error('Ticket missing in webhook processing', ticketId, ticketErr?.message);
        await supabaseAdmin.from('transactions').insert({
          user_id,
          event_id,
          ticket_id: ticketId,
          amount: 0,
          status: 'failed',
          type: 'payment'
        });
        continue;
      }

      // Decrement inventory
      const newQty = Number(ticket.quantity) - Number(quantity);
      if (newQty < 0) {
        console.error('Insufficient tickets during webhook for', ticketId);
        await supabaseAdmin.from('transactions').insert({
          user_id,
          event_id,
          ticket_id: ticketId,
          amount: 0,
          status: 'failed',
          type: 'payment'
        });
        continue;
      }

      const { error: updateErr } = await supabaseAdmin
        .from('tickets')
        .update({ quantity: newQty })
        .eq('id', ticketId);

      if (updateErr) {
        console.error('Failed to decrement ticket inventory', updateErr.message);
        await supabaseAdmin.from('transactions').insert({
          user_id,
          event_id,
          ticket_id: ticketId,
          amount: 0,
          status: 'failed',
          type: 'payment'
        });
        continue;
      }

      // Create booking
      const total_price = Number(ticket.price) * Number(quantity);

      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id,
          event_id,
          ticket_id: ticketId,
          quantity,
          total_price,
          status: 'completed'
        })
        .select()
        .single();

      if (bookingErr || !booking) {
        console.error('Failed to create booking in webhook', bookingErr?.message);

        // Roll back inventory
        await supabaseAdmin
          .from('tickets')
          .update({ quantity: ticket.quantity })
          .eq('id', ticketId);

        await supabaseAdmin.from('transactions').insert({
          user_id,
          event_id,
          ticket_id: ticketId,
          amount: total_price,
          status: 'failed',
          type: 'payment'
        });
        continue;
      }

      console.log('✅ Booking created:', booking.id);

      // Create transaction
      const { error: txErr } = await supabaseAdmin.from('transactions').insert({
        user_id,
        event_id,
        ticket_id: ticketId,
        amount: total_price,
        status: 'completed',
        type: 'payment'
      });

      if (txErr) {
        console.error('Failed to create transaction in webhook', txErr.message);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error('Error processing checkout.session.completed', err);
    return new Response('Processed with errors', { status: 200 });
  }
};
