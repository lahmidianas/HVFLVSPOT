<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { format } from 'date-fns';
  import { supabase } from '$lib/supabase';

  // route param
  $: eventId = $page.params.id;

  // state
  let event: any = null;
  let tickets: any[] = [];
  let loading = true;
  let loadError: string | null = null;

  // cart state
  let selectedTickets: Record<string, number> = {};
  let purchaseError: string | null = null;
  let purchasing = false;

  // derived totals (no helper functions, just pure reactive declarations)
  let cartQuantity = 0;
  let cartTotal = 0;
  $: cartQuantity = Object.values(selectedTickets).reduce(
    (sum, qty) => sum + Number(qty || 0),
    0
  );
  $: cartTotal = tickets.reduce((sum, ticket) => {
    const qty = selectedTickets[ticket.id] || 0;
    return sum + Number(ticket.price || 0) * Number(qty || 0);
  }, 0);
  $: hasItemsInCart = cartQuantity > 0;

  onMount(async () => {
    await loadEventDetails();
  });

  async function loadEventDetails() {
    try {
      loading = true;
      loadError = null;
      purchaseError = null;
      selectedTickets = {};

      console.log('🔍 Loading event details for ID:', eventId);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          categories (name, slug)
        `)
        .eq('id', eventId)
        .single();

      console.log('EVENT RESPONSE:', { eventData, eventError });

      if (eventError) {
        console.error('❌ Event loading error:', eventError);
        throw eventError;
      }

      event = eventData;

      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });

      console.log('TICKETS RESPONSE:', { ticketData, ticketError });

      if (ticketError) {
        console.error('❌ Failed to load tickets:', ticketError);
        tickets = [];
      } else {
        tickets = ticketData ?? [];
      }
    } catch (err) {
      console.error('❌ Failed to load event:', err);
      loadError = 'Unable to load event details. Please try again.';
    } finally {
      loading = false;
    }
  }

  function updateTicketQuantity(ticketId: string, quantity: number) {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const validQuantity = Math.max(0, Math.min(quantity, ticket.quantity));

    if (validQuantity === 0) {
      delete selectedTickets[ticketId];
    } else {
      selectedTickets[ticketId] = validQuantity;
    }

    // force reactivity
    selectedTickets = { ...selectedTickets };
    console.log('[updateTicketQuantity] selectedTickets =', selectedTickets);
  }

  // --- proceed to Stripe checkout via backend ---

  async function proceedToCheckout() {
    if (!hasItemsInCart || !event) return;

    purchaseError = null;
    purchasing = true;

    try {
      // ensure user is logged in
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[checkout] auth error', authError.message);
      }

      const user = authData?.user ?? null;
      if (!user) {
        // redirect to login and come back here
        const redirectUrl = encodeURIComponent(
          `${$page.url.pathname}${$page.url.search}`
        );
        goto(`/login?redirect=${redirectUrl}`);
        return;
      }

      // Check event date (no buying past events)
      const now = new Date();
      const start = event.start_date ? new Date(event.start_date) : null;
      if (start && start < now) {
        purchaseError = 'This event has already started.';
        return;
      }

      // Build items payload from selectedTickets
      const items = Object.entries(selectedTickets)
        .map(([ticketId, quantity]) => ({
          ticketId,
          quantity: Number(quantity)
        }))
        .filter((i) => i.quantity > 0);

      if (items.length === 0) {
        purchaseError = 'Please select at least one ticket.';
        return;
      }

      // Call backend checkout endpoint (Stripe Checkout Session)
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, items })
      });

      if (res.status === 401 || res.status === 403) {
        const redirectUrl = encodeURIComponent(
          `${$page.url.pathname}${$page.url.search}`
        );
        goto(`/login?redirect=${redirectUrl}`);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[checkout] backend error', body);
        purchaseError =
          body?.message || 'Failed to initiate payment. Please try again.';
        return;
      }

      const data = await res.json();
      if (!data?.url) {
        purchaseError = 'Payment gateway did not return a redirect URL.';
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('[checkout] unexpected error', err);
      purchaseError =
        'Payment processing failed. Please try again or contact support if the problem persists.';
    } finally {
      purchasing = false;
    }
  }
</script>

<svelte:head>
  <title>{event?.title || 'Event'} - HVFLVSPOT</title>
  <meta name="description" content={event?.description || 'Event details'} />
</svelte:head>

<main>
  {#if loading}
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p class="text-gray-600">Loading event details...</p>
      </div>
    </div>
  {:else if loadError}
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <div class="mb-8">
          <svg class="w-24 h-24 mx-auto text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
        <p class="text-lg text-gray-600 mb-8">{loadError}</p>
        <button
          on:click={loadEventDetails}
          class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    </div>
  {:else if !event}
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <div class="mb-8">
          <svg class="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Event Not Found</h1>
        <p class="text-lg text-gray-600 mb-8">
          Sorry, we couldn't find the event you're looking for.
        </p>
        <div class="space-y-4">
          <a
            href="/events"
            class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
          >
            Browse All Events
          </a>
          <div>
            <a href="/" class="text-indigo-600 hover:text-indigo-800 font-medium">
              ← Back to Homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Hero -->
    <div class="relative h-96 overflow-hidden">
      <img
        src={event.image_url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'}
        alt={event.title}
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      <div class="absolute bottom-0 left-0 right-0 p-8">
        <div class="max-w-6xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
            {event.title}
          </h1>
          <div class="flex flex-wrap items-center gap-6 text-white/90 text-lg">
            <div class="flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
              </svg>
              <span>
                {event.start_date
                  ? format(new Date(event.start_date), 'EEEE, MMMM d, yyyy • HH:mm')
                  : 'Date to be announced'}
              </span>
            </div>
            <div class="flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <!-- Left: details -->
        <div class="lg:col-span-2 space-y-8">
          <section>
            <h2 class="text-3xl font-bold text-gray-900 mb-6">About This Event</h2>
            <div class="prose prose-lg max-w-none">
              <p class="text-gray-700 leading-relaxed text-lg">
                {event.description || 'More information will be available soon.'}
              </p>
            </div>
          </section>

          <section>
            <h2 class="text-3xl font-bold text-gray-900 mb-6">Event Details</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div class="flex items-center mb-3">
                  <svg class="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <h3 class="font-semibold text-gray-900">Category</h3>
                </div>
                <p class="text-gray-600 text-lg">
                  {event.categories?.name || 'General Event'}
                </p>
              </div>

              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div class="flex items-center mb-3">
                  <svg class="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
                  </svg>
                  <h3 class="font-semibold text-gray-900">Capacity</h3>
                </div>
                <p class="text-gray-600 text-lg">
                  {event.capacity?.toLocaleString() || 'TBD'} attendees
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- Right: tickets -->
        <div class="lg:col-span-1">
          <div class="sticky top-24">
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 class="text-2xl font-bold text-white">Select Tickets</h2>
                <p class="text-indigo-100 mt-1">Choose your ticket type and quantity</p>
              </div>

              <div class="p-6">
                {#if purchaseError}
                  <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {purchaseError}
                  </div>
                {/if}

                {#if tickets.length === 0}
                  <div class="text-center py-8">
                    <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Tickets Coming Soon</h3>
                    <p class="text-gray-600">Ticket sales haven't started yet. Check back soon!</p>
                  </div>
                {:else}
                  <div class="space-y-4">
                    {#each tickets as ticket (ticket.id)}
                      <div
                        class="border border-gray-200 rounded-lg p-4 transition-all duration-200 {selectedTickets[ticket.id] ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}">
                        <div class="flex justify-between items-start mb-3">
                          <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 text-lg">
                              {ticket.type}
                              {#if selectedTickets[ticket.id]}
                                <span
                                  class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {selectedTickets[ticket.id]} selected
                                </span>
                              {/if}
                            </h3>
                            <p class="text-2xl font-bold text-indigo-600 mt-1">€{ticket.price}</p>
                          </div>
                          <div class="text-sm text-gray-600 text-right">
                            {#if ticket.quantity === 0}
                              <span class="text-red-600 font-medium">Sold Out</span>
                            {:else if ticket.quantity < 10}
                              <span class="text-orange-600 font-medium">Only {ticket.quantity} left!</span>
                            {:else}
                              <span>{ticket.quantity} available</span>
                            {/if}
                          </div>
                        </div>

                        {#if ticket.quantity > 0}
                          <div class="flex justify-between items-center">
                            <div class="flex items-center space-x-3">
                              <button
                                on:click={() =>
                                  updateTicketQuantity(
                                    ticket.id,
                                    Math.max(0, (selectedTickets[ticket.id] || 0) - 1)
                                  )}
                                disabled={!selectedTickets[ticket.id]}
                                class="w-10 h-10 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                                </svg>
                              </button>

                              <span class="w-8 text-center font-bold text-lg text-gray-900">
                                {selectedTickets[ticket.id] || 0}
                              </span>

                              <button
                                on:click={() =>
                                  updateTicketQuantity(
                                    ticket.id,
                                    Math.min(ticket.quantity, (selectedTickets[ticket.id] || 0) + 1)
                                  )}
                                disabled={selectedTickets[ticket.id] >= ticket.quantity}
                                class="w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>

                  <!-- ORDER SUMMARY -->
                  <div class="mt-6 pt-6 border-t border-gray-200">
                    <div class="bg-indigo-50 rounded-lg p-4 mb-4">
                      <div class="flex justify-between items-center mb-2 text-sm text-gray-700">
                        <span>Tickets selected</span>
                        <span class="font-semibold">{cartQuantity}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-900">Total</span>
                        <span class="font-bold text-2xl text-indigo-600">
                          €{cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {#if hasItemsInCart}
                      <button
                        on:click={proceedToCheckout}
                        disabled={purchasing}
                        class="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200">
                        {#if purchasing}
                          Processing...
                        {:else}
                          Go to payment
                        {/if}
                      </button>
                    {:else}
                      <button
                        disabled
                        class="w-full bg-gray-200 text-gray-600 py-3 px-4 rounded-lg font-semibold cursor-not-allowed"
                      >
                        Select tickets to continue
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>
