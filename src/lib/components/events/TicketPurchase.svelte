<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ticketApi, paymentApi } from '$lib/api';
  import { format } from 'date-fns';

  export let eventId: string;
  export let event: any;

  let tickets = [];
  let selectedTickets = {};
  let loading = true;
  let purchasing = false;
  let error = null;
  let step = 'select'; // 'select', 'payment', 'confirmation'

  onMount(async () => {
    await loadEventTickets();
  });

  async function loadEventTickets() {
    try {
      loading = true;
      error = null;
      
      // Try to load tickets through backend first
      try {
        // This would need a backend endpoint for event tickets
        // For now, fall back to direct Supabase read for ticket display
        const { data, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('event_id', eventId);
        
        if (ticketError) throw ticketError;
        tickets = data || [];
      } catch (backendError) {
        // If backend fails, show user-friendly message
        tickets = [];
      }
      
      if (tickets.length === 0) {
        error = 'Ticketing is not yet enabled for this event. Please try later or choose another event.';
      }
    } catch (err) {
      error = 'Ticketing is not yet enabled for this event. Please try later or choose another event.';
    } finally {
      loading = false;
    }
  }

  function updateTicketQuantity(ticketId: string, quantity: number) {
    if (quantity <= 0) {
      delete selectedTickets[ticketId];
    } else {
      selectedTickets[ticketId] = quantity;
    }
    selectedTickets = { ...selectedTickets };
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

  async function proceedToPayment() {
    if (getTotalQuantity() === 0) {
      error = 'Please select at least one ticket';
      return;
    }
    step = 'payment';
  }

  async function processCheckout() {
    try {
      purchasing = true;
      error = null;

      // Process each ticket type purchase through backend
      for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) continue;

        // Step 1: Process payment through backend
        await paymentApi.process({
          eventId,
          ticketId,
          amount: ticket.price * quantity
        });

        // Step 2: Purchase tickets through backend
        await ticketApi.purchase({
          eventId,
          ticketId,
          quantity
        });
      }

      step = 'confirmation';
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        goto('/login');
        return;
      }
      
      // Handle RLS policy issues gracefully
      if (err.message.includes('RLS') || 
          err.message.includes('policy') ||
          err.message.includes('permission denied') ||
          err.message.includes('Failed to create') ||
          err.message.includes('tickets table') ||
          err.message.includes('INSERT')) {
        error = 'Ticketing is not yet enabled for this event. Please try later or choose another event.';
      } else if (err.message.includes('insufficient') ||
                 err.message.includes('not available') ||
                 err.message.includes('sold out')) {
        error = 'Sorry, there are not enough tickets available. Please try selecting fewer tickets or choose a different ticket type.';
      } else {
        error = 'Ticketing is not yet enabled for this event. Please try later or choose another event.';
      }
    } finally {
      purchasing = false;
    }
  }

  function goBackToEvents() {
    goto('/events');
  }

  function viewMyTickets() {
    goto('/dashboard');
  }
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if step === 'select'}
    <!-- Ticket Selection -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Select Tickets</h1>
      <h2 class="text-xl text-gray-600 mb-4">{event?.title}</h2>
      <div class="text-sm text-gray-500 space-y-1">
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {event?.start_date ? format(new Date(event.start_date), 'PPP p') : 'Date TBD'}
        </div>
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event?.location}
        </div>
      </div>
    </div>

    {#if error}
      <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}

    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-600">Loading ticket options...</p>
      </div>
    {:else if tickets.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-600">No tickets available for this event.</p>
        <button
          on:click={goBackToEvents}
          class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Events
        </button>
      </div>
    {:else}
      <div class="space-y-4 mb-8">
        {#each tickets as ticket (ticket.id)}
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{ticket.type}</h3>
                <p class="text-2xl font-bold text-indigo-600">${ticket.price}</p>
                <p class="text-sm text-gray-500">{ticket.quantity} available</p>
              </div>
              
              <div class="flex items-center space-x-3">
                <button
                  on:click={() => updateTicketQuantity(ticket.id, Math.max(0, (selectedTickets[ticket.id] || 0) - 1))}
                  disabled={!selectedTickets[ticket.id] || selectedTickets[ticket.id] <= 0}
                  class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                
                <span class="w-8 text-center font-medium">
                  {selectedTickets[ticket.id] || 0}
                </span>
                
                <button
                  on:click={() => updateTicketQuantity(ticket.id, Math.min(ticket.quantity, (selectedTickets[ticket.id] || 0) + 1))}
                  disabled={selectedTickets[ticket.id] >= ticket.quantity}
                  class="w-8 h-8 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Order Summary -->
      {#if getTotalQuantity() > 0}
        <div class="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 class="text-lg font-semibold mb-4">Order Summary</h3>
          <div class="space-y-2">
            {#each Object.entries(selectedTickets) as [ticketId, quantity]}
              {@const ticket = tickets.find(t => t.id === ticketId)}
              {#if ticket && quantity > 0}
                <div class="flex justify-between">
                  <span>{ticket.type} × {quantity}</span>
                  <span>${(ticket.price * quantity).toFixed(2)}</span>
                </div>
              {/if}
            {/each}
            <div class="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex space-x-4">
        <button
          on:click={goBackToEvents}
          class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Back to Events
        </button>
        
        {#if getTotalQuantity() > 0}
          <button
            on:click={proceedToPayment}
            class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Proceed to Payment
          </button>
        {/if}
      </div>
    {/if}

  {:else if step === 'payment'}
    <!-- Payment Step -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
      <p class="text-gray-600">Complete your ticket purchase</p>
    </div>

    {#if error}
      <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}

    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">Order Summary</h3>
      <div class="space-y-2 mb-6">
        {#each Object.entries(selectedTickets) as [ticketId, quantity]}
          {@const ticket = tickets.find(t => t.id === ticketId)}
          {#if ticket && quantity > 0}
            <div class="flex justify-between">
              <span>{ticket.type} × {quantity}</span>
              <span>${(ticket.price * quantity).toFixed(2)}</span>
            </div>
          {/if}
        {/each}
        <div class="border-t pt-2 flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>${getTotalPrice().toFixed(2)}</span>
        </div>
      </div>

      <div class="border-t pt-6">
        <h4 class="text-md font-medium mb-4">Payment Information</h4>
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <p class="text-blue-800 text-sm">
            <strong>Demo Mode:</strong> This is a simulated payment. No real charges will be made.
          </p>
        </div>
        
        <div class="flex space-x-4">
          <button
            on:click={() => step = 'select'}
            class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Back to Selection
          </button>
          
          <button
            on:click={processCheckout}
            disabled={purchasing}
            class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {purchasing ? 'Processing...' : `Pay $${getTotalPrice().toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>

  {:else if step === 'confirmation'}
    <!-- Confirmation Step -->
    <div class="text-center py-12">
      <div class="mb-4">
        <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Purchase Successful!</h1>
      <p class="text-gray-600 mb-8">Your tickets have been purchased and are now available in your wallet.</p>
      
      <div class="space-y-4">
        <button
          on:click={viewMyTickets}
          class="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700"
        >
          View My Tickets
        </button>
        
        <button
          on:click={goBackToEvents}
          class="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-300"
        >
          Browse More Events
        </button>
      </div>
    </div>
  {/if}
</div>