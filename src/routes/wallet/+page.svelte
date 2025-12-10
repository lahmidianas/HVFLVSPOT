<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  import { ticketApi } from '$lib/api';
  import { format, isPast } from 'date-fns';
  import type { PageData } from './$types';

  export let data: PageData;

  let tickets = data.tickets || [];
  let loading = false;
  let error = data.error;
  let refreshing = false;
  let selectedTicket = null;
  let showQRModal = false;

  // Separate tickets into upcoming and past
  $: upcomingTickets = tickets.filter(ticket => 
    ticket.events?.start_date && !isPast(new Date(ticket.events.start_date))
  );
  $: pastTickets = tickets.filter(ticket => 
    ticket.events?.start_date && isPast(new Date(ticket.events.start_date))
  );

  onMount(() => {
    // Check authentication state on mount
    checkAuthAndRedirect();
    
    // Handle redirect after login
    const redirectParam = $page.url.searchParams.get('redirect');
    if (redirectParam) {
      // Clear the redirect parameter from URL
      const newUrl = new URL($page.url);
      newUrl.searchParams.delete('redirect');
      goto(newUrl.pathname + newUrl.search, { replaceState: true });
    }
  });

  async function checkAuthAndRedirect() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
    }
  }

  async function refreshTickets() {
    try {
      refreshing = true;
      error = null;
      
      tickets = await ticketApi.getUserTickets();
    } catch (err) {
      // Check for authorization errors from backend
      if (err.status === 401 || err.status === 403) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
        return;
      }
      error = 'Unable to refresh tickets. Please try again.';
    } finally {
      refreshing = false;
    }
  }

  function showQRCode(ticket) {
    selectedTicket = ticket;
    showQRModal = true;
  }

  function closeQRModal() {
    showQRModal = false;
    selectedTicket = null;
  }

  async function validateTicket(qrCode) {
    try {
      const result = await ticketApi.validate(qrCode);
      if (result.isValid) {
        alert('✅ Ticket is valid!');
      } else {
        alert(`❌ Ticket validation failed: ${result.reason}`);
      }
    } catch (err) {
      // Check for authorization errors from backend
      if (err.status === 401 || err.status === 403) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
        return;
      }
      alert(`Validation error: ${err.message}`);
    }
  }

  function getTicketStatusColor(ticket) {
    if (ticket.events?.start_date && isPast(new Date(ticket.events.start_date))) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (ticket.status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getTicketStatusText(ticket) {
    if (ticket.events?.start_date && isPast(new Date(ticket.events.start_date))) {
      return 'Past Event';
    }
    
    return ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1);
  }
</script>

<svelte:head>
  <title>My Wallet - HVFLVSPOT</title>
  <meta name="description" content="View and manage your event tickets" />
</svelte:head>

<main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Header -->
  <header class="mb-8 flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
      <p class="text-gray-600">View and manage your event tickets</p>
    </div>
    
    <button
      on:click={refreshTickets}
      disabled={refreshing}
      class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
      class:focus:outline-none={true}
      class:focus:ring-2={true}
      class:focus:ring-indigo-500={true}
      class:focus:ring-offset-2={true}
      aria-label="Refresh ticket list"
    >
      <svg class="w-4 h-4 {refreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Refresh</title>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  </header>

  {#if error}
    <!-- Error State -->
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
        on:click={refreshTickets}
        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        class:focus:outline-none={true}
        class:focus:ring-2={true}
        class:focus:ring-indigo-500={true}
        class:focus:ring-offset-2={true}
        aria-label="Retry loading tickets"
      >
        Try Again
      </button>
    </div>
  {:else if tickets.length === 0}
    <!-- Empty State -->
    <div class="text-center py-16">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>No tickets</title>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
      <h3 class="text-xl font-medium text-gray-900 mb-2">No tickets yet</h3>
      <p class="text-gray-600 mb-6">You haven't purchased any tickets yet. Start exploring events!</p>
      <a
        href="/events"
        class="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
        class:focus:outline-none={true}
        class:focus:ring-2={true}
        class:focus:ring-indigo-500={true}
        class:focus:ring-offset-2={true}
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>Search</title>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Browse Events
      </a>
    </div>
  {:else}
    <!-- Tickets Display -->
    <div class="space-y-8" role="main">
      <!-- Upcoming Tickets -->
      {#if upcomingTickets.length > 0}
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" class="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg class="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Upcoming events</title>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upcoming Events ({upcomingTickets.length})
          </h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" role="list" aria-label="Upcoming event tickets">
            {#each upcomingTickets as ticket (ticket.id)}
              <article class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow" role="listitem">
                <!-- Event Image -->
                <div class="relative h-48">
                  <img
                    src={ticket.events?.image_url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'}
                    alt={ticket.events?.title}
                    role="img"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute top-3 right-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTicketStatusColor(ticket)}" role="status">
                      {getTicketStatusText(ticket)}
                    </span>
                  </div>
                </div>
                
                <!-- Ticket Details -->
                <div class="p-6">
                  <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1" id="ticket-{ticket.id}-title">
                      {ticket.events?.title}
                    </h3>
                    <p class="text-sm text-gray-600 line-clamp-2">
                      {ticket.events?.description}
                    </p>
                  </div>
                  
                  <div class="space-y-3 text-sm text-gray-600 mb-4" role="list" aria-label="Event details">
                    <div class="flex items-center" role="listitem">
                      <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Date</title>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(new Date(ticket.events?.start_date), 'PPP p')}
                    </div>
                    
                    <div class="flex items-center" role="listitem">
                      <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Location</title>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ticket.events?.location}
                    </div>
                    
                    <div class="flex items-center" role="listitem">
                      <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Ticket details</title>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      {ticket.tickets?.type} • Qty: {ticket.quantity}
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div class="text-lg font-semibold text-gray-900">
                      €{ticket.total_price}
                    </div>
                    
                    <div class="flex space-x-2">
                      {#if ticket.qr_code}
                        <button
                          on:click={() => showQRCode(ticket)}
                          class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-200 font-medium"
                          class:focus:outline-none={true}
                          class:focus:ring-2={true}
                          class:focus:ring-indigo-500={true}
                          class:focus:ring-offset-2={true}
                          aria-label="Show QR code for {ticket.events?.title}"
                        >
                          Show QR
                        </button>
                        
                        <button
                          on:click={() => validateTicket(ticket.qr_code)}
                          class="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 font-medium"
                          class:focus:outline-none={true}
                          class:focus:ring-2={true}
                          class:focus:ring-green-500={true}
                          class:focus:ring-offset-2={true}
                          aria-label="Validate ticket for {ticket.events?.title}"
                        >
                          Validate
                        </button>
                      {:else}
                        <span class="text-xs text-gray-500 px-3 py-1">
                          QR Code Pending
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Past Tickets -->
      {#if pastTickets.length > 0}
        <section aria-labelledby="past-heading">
          <h2 id="past-heading" class="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg class="w-6 h-6 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Past events</title>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Past Events ({pastTickets.length})
          </h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" role="list" aria-label="Past event tickets">
            {#each pastTickets as ticket (ticket.id)}
              <article class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden opacity-75" role="listitem">
                <!-- Event Image -->
                <div class="relative h-48">
                  <img
                    src={ticket.events?.image_url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'}
                    alt={ticket.events?.title}
                    role="img"
                    class="w-full h-full object-cover grayscale"
                  />
                  <div class="absolute top-3 right-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800" role="status">
                      Past Event
                    </span>
                  </div>
                </div>
                
                <!-- Ticket Details -->
                <div class="p-6">
                  <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1" id="past-ticket-{ticket.id}-title">
                      {ticket.events?.title}
                    </h3>
                    <p class="text-sm text-gray-600 line-clamp-2">
                      {ticket.events?.description}
                    </p>
                  </div>
                  
                  <div class="space-y-3 text-sm text-gray-600 mb-4" role="list" aria-label="Event details">
                    <div class="flex items-center" role="listitem">
                      <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Date</title>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(new Date(ticket.events?.start_date), 'PPP p')}
                    </div>
                    
                    <div class="flex items-center" role="listitem">
                      <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Location</title>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ticket.events?.location}
                    </div>
                    
                    <div class="flex items-center" role="listitem">
                      <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Ticket details</title>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      {ticket.tickets?.type} • Qty: {ticket.quantity}
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div class="text-lg font-semibold text-gray-900">
                      €{ticket.total_price}
                    </div>
                    
                    <div class="text-sm text-gray-500">
                      Attended
                    </div>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Browse More Events CTA -->
      <section class="text-center py-8 border-t border-gray-200" aria-labelledby="cta-heading">
        <h2 id="cta-heading" class="sr-only">Discover more events</h2>
        <p class="text-gray-600 mb-4">Ready for your next event?</p>
        <a
          href="/events"
          class="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
          class:focus:outline-none={true}
          class:focus:ring-2={true}
          class:focus:ring-indigo-500={true}
          class:focus:ring-offset-2={true}
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Search</title>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Discover Events
        </a>
      </section>
    </div>
  {/if}
</main>

<!-- QR Code Modal -->
{#if showQRModal && selectedTicket}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
    on:click={closeQRModal}
    role="dialog"
    aria-modal="true"
    aria-labelledby="qr-modal-title"
    on:keydown={(e) => e.key === 'Escape' && closeQRModal()}
  >
    <div class="bg-white rounded-lg p-6 max-w-sm w-full" on:click|stopPropagation role="document">
      <div class="text-center">
        <h3 id="qr-modal-title" class="text-lg font-semibold text-gray-900 mb-4">
          {selectedTicket.events?.title}
        </h3>
        
        <!-- QR Code Placeholder -->
        <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4" role="img" aria-label="QR code for ticket validation">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>QR Code</title>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-gray-600 font-medium">QR Code</p>
            <p class="text-xs text-gray-500 mt-1">
              {selectedTicket.tickets?.type} • Qty: {selectedTicket.quantity}
            </p>
          </div>
        </div>
        
        <div class="space-y-3">
          <button
            on:click={() => validateTicket(selectedTicket.qr_code)}
            class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
            class:focus:outline-none={true}
            class:focus:ring-2={true}
            class:focus:ring-green-500={true}
            class:focus:ring-offset-2={true}
            aria-label="Validate this ticket"
          >
            Validate Ticket
          </button>
          
          <button
            on:click={closeQRModal}
            class="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
            class:focus:outline-none={true}
            class:focus:ring-2={true}
            class:focus:ring-gray-500={true}
            class:focus:ring-offset-2={true}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}