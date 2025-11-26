<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ticketApi } from '$lib/api';
  import { format } from 'date-fns';

  let tickets = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    await loadUserTickets();
  });

  async function loadUserTickets() {
    try {
      loading = true;
      error = null;
      
      tickets = await ticketApi.getUserTickets();
    } catch (err) {
      // Check for authorization errors from backend
      if (err.status === 401 || err.status === 403) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
        return;
      }
      error = 'Unable to load tickets. Please try again.';
      tickets = [];
    } finally {
      loading = false;
    }
  }

  async function validateTicket(qrCode: string) {
    try {
      const result = await ticketApi.validate(qrCode);
      if (result.isValid) {
        alert('Ticket is valid!');
      } else {
        alert(`Ticket validation failed: ${result.reason}`);
      }
    } catch (err) {
      // Check for authorization errors from backend
      if (err.status === 401 || err.status === 403) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
        return;
      }
      alert('Unable to validate ticket. Please try again.');
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
    <p class="text-gray-600">View and manage your purchased event tickets</p>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-gray-600">Loading your tickets...</p>
    </div>
  {:else if error}
    <div class="text-center py-12">
      <div class="text-red-600 mb-4">
        <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-medium">Something went wrong</p>
        <p class="text-sm">{error}</p>
      </div>
      <button
        on:click={loadUserTickets}
        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
      >
        Try Again
      </button>
    </div>
  {:else if tickets.length === 0}
    <div class="text-center py-12">
      <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
      <p class="text-gray-600 mb-4">You haven't purchased any tickets yet.</p>
      <a
        href="/events"
        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
      >
        Browse Events
      </a>
    </div>
  {:else}
    <div class="space-y-6">
      {#each tickets as ticket (ticket.id)}
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="md:flex">
            <!-- Event Image -->
            <div class="md:w-48 md:flex-shrink-0">
              <img
                src={ticket.events?.image_url || '/placeholder.jpg'}
                alt={ticket.events?.title}
                class="h-48 w-full object-cover md:h-full"
              />
            </div>
            
            <!-- Ticket Details -->
            <div class="p-6 flex-1">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">
                    {ticket.events?.title}
                  </h3>
                  
                  <div class="space-y-2 text-sm text-gray-600">
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(new Date(ticket.events?.start_date), 'PPP p')}
                    </div>
                    
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ticket.events?.location}
                    </div>
                    
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      {ticket.tickets?.type} - Quantity: {ticket.quantity}
                    </div>
                  </div>
                </div>
                
                <!-- Ticket Status and Actions -->
                <div class="ml-4 text-right">
                  <div class="mb-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {ticket.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                      {ticket.status}
                    </span>
                  </div>
                  
                  <p class="text-lg font-semibold text-gray-900 mb-3">
                    ${ticket.total_price}
                  </p>
                  
                  {#if ticket.qr_code}
                    <button
                      on:click={() => validateTicket(ticket.qr_code)}
                      class="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      Validate Ticket
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>