<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { paymentApi, ticketApi } from '$lib/api';
  import { supabase } from '$lib/supabase';
  import { format } from 'date-fns';
  import type { PageData } from './$types';

  export let data: PageData;

  let event = null;
  let tickets = [];
  let selectedTickets = data.initialCart || {};
  let loading = true;
  let processing = false;
  let error = null;
  let step = 'payment'; // 'payment', 'success', 'ticketing-unavailable'

  $: eventId = data.eventId;
  $: cartTotal = getTotalPrice();
  $: cartQuantity = getTotalQuantity();
  $: hasItemsInCart = cartQuantity > 0;

  onMount(async () => {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto(`/login?redirect=${encodeURIComponent($page.url.pathname + $page.url.search)}`);
      return;
    }

    await loadEventAndTickets();
    
    // Redirect if no items in cart
    if (!hasItemsInCart) {
      goto(`/events/${eventId}`);
    }
  });

  async function loadEventAndTickets() {
    try {
      loading = true;
      error = null;
      
      // Load event details (reference data)
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          categories (name),
          organizers (company_name)
        `)
        .eq('id', eventId)
        .single();
      
      if (eventError) throw eventError;
      event = eventData;
      
      // Load tickets (reference data for display)
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId);
      
      if (ticketError) throw ticketError;
      tickets = ticketData || [];
      
    } catch (err) {
      error = 'Unable to load checkout information. Please try again.';
    } finally {
      loading = false;
    }
  }

  function getTotalPrice() {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = tickets.find(t => t.id === ticketId);
      return total + (ticket ? ticket.price * quantity : 0);
    }, 0);
  }

  function getTotalQuantity() {
    return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0);
  }

  async function processPayment() {
    try {
      processing = true;
      error = null;

      // Process payment for each ticket type through backend
      for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) continue;

        await paymentApi.process({
          eventId,
          ticketId,
          amount: ticket.price * quantity
        });
      }

      // After successful payment, attempt to purchase tickets
      try {
        for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
          await ticketApi.purchase({
            eventId,
            ticketId,
            quantity
          });
        }
        
        // If ticket purchase succeeds, show success
        step = 'success';
      } catch (ticketError) {
        // Check for authorization errors first
        if (ticketError.status === 401 || ticketError.status === 403) {
          goto(`/login?redirect=${encodeURIComponent($page.url.pathname + $page.url.search)}`);
          return;
        }
        
        // Handle RLS/permission errors gracefully
        if (ticketError.message.includes('RLS') || 
            ticketError.message.includes('policy') ||
            ticketError.message.includes('permission denied') ||
            ticketError.message.includes('Failed to create') ||
            ticketError.message.includes('tickets table') ||
            ticketError.message.includes('INSERT') ||
            ticketError.message.includes('not yet enabled') ||
            ticketError.message.includes('Ticketing')) {
          step = 'ticketing-unavailable';
        } else {
          // Other ticket purchase errors
          throw ticketError;
        }
      }
    } catch (err) {
      // Check for authorization errors
      if (err.status === 401 || err.status === 403) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname + $page.url.search)}`);
        return;
      }
      
      error = 'Payment processing failed. Please try again or contact support if the problem persists.';
    } finally {
      processing = false;
    }
  }

  function goBackToEvent() {
    goto(`/events/${eventId}`);
  }

  function viewMyTickets() {
    goto('/wallet');
  }

  function retryPayment() {
    error = null;
    processPayment();
  }
</script>

<svelte:head>
  <title>Checkout - {event?.title || 'Event'} - HVFLVSPOT</title>
</svelte:head>

<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if loading}
    <!-- Loading State -->
    <div class="text-center py-12" role="status" aria-label="Loading checkout">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-gray-600">Loading checkout...</p>
    </div>
  {:else if error && !event}
    <!-- Critical Error State -->
    <div class="text-center py-12">
      <div class="text-red-600 mb-4">
        <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>Error</title>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-medium">Something went wrong</p>
        <p class="text-sm">{error}</p>
      </div>
      <button
        on:click={goBackToEvent}
        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        class:focus:outline-none={true}
        class:focus:ring-2={true}
        class:focus:ring-indigo-500={true}
        class:focus:ring-offset-2={true}
      >
        Back to Event
      </button>
    </div>
  {:else if step === 'payment'}
    <!-- Payment Step -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
      <h2 class="text-xl text-gray-600 mb-4">{event?.title}</h2>
      <div class="text-sm text-gray-500 space-y-1" role="list" aria-label="Event details">
        <div class="flex items-center" role="listitem">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Date and time</title>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {event?.start_date ? format(new Date(event.start_date), 'PPP p') : 'Date TBD'}
        </div>
        <div class="flex items-center" role="listitem">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Location</title>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event?.location}
        </div>
      </div>
    </header>

    <!-- Order Summary -->
    <section class="bg-white rounded-lg shadow-md p-6 mb-8" aria-labelledby="order-summary-heading">
      <h3 id="order-summary-heading" class="text-lg font-semibold mb-4">Order Summary</h3>
      <div class="space-y-3 mb-6" role="list" aria-label="Selected tickets">
        {#each Object.entries(selectedTickets) as [ticketId, quantity]}
          {@const ticket = tickets.find(t => t.id === ticketId)}
          {#if ticket && quantity > 0}
            <div class="flex justify-between items-center py-2" role="listitem">
              <div>
                <span class="font-medium text-gray-900">{ticket.type}</span>
                <span class="text-gray-600 ml-2">× {quantity}</span>
              </div>
              <span class="font-medium text-gray-900">€{(ticket.price * quantity).toFixed(2)}</span>
            </div>
          {/if}
        {/each}
        
        <div class="border-t pt-3 flex justify-between items-center">
          <span class="text-lg font-semibold text-gray-900">Total</span>
          <span class="text-2xl font-bold text-indigo-600" role="text" aria-label="Total amount €{cartTotal.toFixed(2)}">€{cartTotal.toFixed(2)}</span>
        </div>
      </div>

      <!-- Payment Information -->
      <div class="border-t pt-6" role="region" aria-labelledby="payment-info-heading">
        <h4 id="payment-info-heading" class="text-md font-medium mb-4">Payment Information</h4>
        
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6" role="note" aria-label="Demo payment notice">
          <div class="flex">
            <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Information</title>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-blue-800 text-sm font-medium">Demo Payment Mode</p>
              <p class="text-blue-700 text-sm">This is a simulated payment. No real charges will be made.</p>
            </div>
          </div>
        </div>

        {#if error}
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="assertive">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Error</title>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-red-800 text-sm font-medium">Payment unsuccessful</p>
                <p class="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button
            on:click={goBackToEvent}
            disabled={processing}
            class="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-300 disabled:opacity-50 font-medium"
            class:focus:outline-none={true}
            class:focus:ring-2={true}
            class:focus:ring-gray-500={true}
            class:focus:ring-offset-2={true}
          >
            Back to Event
          </button>
          
          {#if error}
            <button
              on:click={retryPayment}
              disabled={processing}
              class="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
              class:focus:outline-none={true}
              class:focus:ring-2={true}
              class:focus:ring-indigo-500={true}
              class:focus:ring-offset-2={true}
              aria-describedby="retry-help"
            >
              {processing ? 'Processing...' : 'Retry Payment'}
            </button>
            <div id="retry-help" class="sr-only">Retry the payment process</div>
          {:else}
            <button
              on:click={processPayment}
              disabled={processing}
              class="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
              class:focus:outline-none={true}
              class:focus:ring-2={true}
              class:focus:ring-indigo-500={true}
              class:focus:ring-offset-2={true}
              aria-describedby="payment-help"
            >
              {processing ? 'Processing Payment...' : `Pay €${cartTotal.toFixed(2)}`}
            </button>
            <div id="payment-help" class="sr-only">Process payment for {cartQuantity} ticket{cartQuantity !== 1 ? 's' : ''}</div>
          {/if}
        </div>
      </div>
    </section>

  {:else if step === 'success'}
    <!-- Payment and Ticket Purchase Success -->
    <div class="text-center py-12" role="status" aria-live="polite">
      <div class="mb-6">
        <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>Success</title>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Purchase Complete!</h1>
      <p class="text-gray-600 mb-2">Your payment of <span class="font-semibold">€{cartTotal.toFixed(2)}</span> has been processed.</p>
      <p class="text-gray-600 mb-8">Your tickets are ready and available in your wallet.</p>
      
      <div class="max-w-md mx-auto space-y-4">
        <button
          on:click={viewMyTickets}
          class="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
          class:focus:outline-none={true}
          class:focus:ring-2={true}
          class:focus:ring-indigo-500={true}
          class:focus:ring-offset-2={true}
          aria-label="View your tickets in wallet"
        >
          View Wallet
        </button>
        
        <button
          on:click={goBackToEvents}
          class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 font-medium"
          class:focus:outline-none={true}
          class:focus:ring-2={true}
          class:focus:ring-gray-500={true}
          class:focus:ring-offset-2={true}
        >
          Browse More Events
        </button>
      </div>
    </div>

  {:else if step === 'ticketing-unavailable'}
    <!-- Ticketing System Unavailable -->
    <div class="text-center py-12" role="status" aria-live="polite">
      <div class="mb-6">
        <svg class="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>Warning</title>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Payment Processed</h1>
      <p class="text-gray-600 mb-2">Your payment of <span class="font-semibold">€{cartTotal.toFixed(2)}</span> has been successfully processed.</p>
      <p class="text-gray-600 mb-8">Ticketing is not yet enabled for this event. Please try later or choose another event.</p>
      
      <div class="max-w-md mx-auto space-y-4">
        <button
          on:click={goBackToEvent}
          class="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
          class:focus:outline-none={true}
          class:focus:ring-2={true}
          class:focus:ring-indigo-500={true}
          class:focus:ring-offset-2={true}
        >
          Back to Event
        </button>
        
        <button
          on:click={goBackToEvents}
          class="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 font-medium"
          class:focus:outline-none={true}
          class:focus:ring-2={true}
          class:focus:ring-gray-500={true}
          class:focus:ring-offset-2={true}
        >
          Browse Other Events
        </button>
      </div>
    </div>
  {/if}
</main>