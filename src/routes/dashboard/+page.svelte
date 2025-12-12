<script lang="ts">
  export let data;
  const {
    isAdmin,
    isOrganizer,
    displayName,
    events = [],
    tickets = [],
    pendingOrganizers = []
  } = data;
</script>

<svelte:head>
  <title>{isOrganizer ? 'Organizer Dashboard' : 'Admin - Events'}</title>
</svelte:head>

{#if isOrganizer}
  <div
    class="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 page-transition"
  >
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 2s;"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 4s;"
      ></div>
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"
      ></div>
    </div>

    <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="mb-8 inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
        <svg class="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span class="text-white font-medium text-sm tracking-wide">Organizer Tools</span>
      </div>

      <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight animate-slide-in-left">
        Organizer Dashboard
      </h1>
      <p class="text-xl sm:text-2xl text-white/90 mb-10 leading-relaxed font-light max-w-3xl mx-auto animate-slide-in-right">
        Scan tickets, manage your events, and track attendance.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up">
        <a
          href="/scan"
          class="group relative inline-flex items-center px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 ease-out transform hover:scale-110 hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-4 focus:ring-offset-transparent overflow-hidden cta-pulse will-change-transform"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span class="relative z-10 flex items-center">
            <svg class="w-7 h-7 mr-3 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Scan Tickets
          </span>
        </a>

        <a
          href="/organizer/events"
          class="group inline-flex items-center px-8 py-4 text-lg font-semibold text-white/90 hover:text-white border-2 border-white/30 hover:border-white/60 rounded-xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent cta-pulse will-change-transform"
        >
          My Events
          <svg class="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>

      {#if displayName}
        <p class="mt-8 text-white/80 text-sm">Welcome back, {displayName}</p>
      {/if}
    </div>
  </div>
{:else if isAdmin}
  <div class="max-w-6xl mx-auto px-4 py-10 space-y-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-600">Manage events, tickets and users.</p>
      </div>

      <div class="flex items-center gap-3">
        <a
          href="/dashboard"
          class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Events
        </a>
        <a
          href="/dashboard/users"
          class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        >
          Users &amp; Roles
        </a>
      </div>
    </div>

    <section class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Create Event</h2>
      <form method="POST" action="?/createEvent" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Title</span>
          <input name="title" class="input" required />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Location</span>
          <input name="location" class="input" required />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Start Date</span>
          <input type="datetime-local" name="start_date" class="input" required />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">End Date</span>
          <input type="datetime-local" name="end_date" class="input" required />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Price</span>
          <input type="number" step="0.01" name="price" class="input" />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Capacity</span>
          <input type="number" name="capacity" class="input" />
        </label>
        <label class="space-y-1 md:col-span-2">
          <span class="text-sm font-medium text-gray-700">Image URL</span>
          <input name="image_url" class="input" />
        </label>
        <label class="space-y-1 md:col-span-2">
          <span class="text-sm font-medium text-gray-700">Description</span>
          <textarea name="description" class="input h-24"></textarea>
        </label>
        <div class="md:col-span-2 flex justify-end">
          <button type="submit" class="btn-primary">Create Event</button>
        </div>
      </form>
    </section>

    <section class="space-y-4">
      <h2 class="text-xl font-semibold text-gray-900">Existing Events</h2>
      {#if events.length === 0}
        <p class="text-gray-600">No events found.</p>
      {:else}
        <div class="space-y-4">
          {#each events as event}
            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p class="text-sm text-gray-500">{new Date(event.start_date).toLocaleString()}</p>
                  <h3 class="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <p class="text-gray-600">{event.location}</p>
                </div>
                <div class="flex items-center gap-3">
                  <form method="POST" action="?/deleteEvent">
                    <input type="hidden" name="id" value={event.id} />
                    <button type="submit" class="btn-danger">Delete</button>
                  </form>
                </div>
              </div>

              <details class="border-t border-gray-100 pt-4">
                <summary class="text-sm font-medium text-indigo-600 cursor-pointer">Edit event</summary>
                <form method="POST" action="?/updateEvent" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <input type="hidden" name="id" value={event.id} />
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Title</span>
                    <input name="title" class="input" value={event.title} />
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Location</span>
                    <input name="location" class="input" value={event.location} />
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Start Date</span>
                    <input type="datetime-local" name="start_date" class="input" value={event.start_date?.slice(0, 16)} />
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">End Date</span>
                    <input type="datetime-local" name="end_date" class="input" value={event.end_date?.slice(0, 16)} />
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Price </span>
                    <input type="number" step="0.01" name="price" class="input" value={event.price} />
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Capacity</span>
                    <input type="number" name="capacity" class="input" value={event.capacity} />
                  </label>
                  <label class="space-y-1 md:col-span-2">
                    <span class="text-sm font-medium text-gray-700">Image URL</span>
                    <input name="image_url" class="input" value={event.image_url} />
                  </label>
                  <label class="space-y-1 md:col-span-2">
                    <span class="text-sm font-medium text-gray-700">Description</span>
                    <textarea name="description" class="input h-24">{event.description}</textarea>
                  </label>
                  <div class="md:col-span-2 flex justify-end">
                    <button type="submit" class="btn-secondary">Save changes</button>
                  </div>
                </form>
              </details>

              {#if event.tickets?.length}
                <div class="border-t border-gray-100 pt-4">
                  <p class="text-sm font-semibold text-gray-800 mb-2">Tickets</p>
                  <ul class="divide-y divide-gray-100">
                    {#each event.tickets as ticket}
                      <li class="py-2 flex items-center justify-between text-sm text-gray-700">
                        <span>{ticket.type}</span>
                        <span>€{ticket.price} x Qty {ticket.quantity}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="mt-10 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Organizer applications</h2>
      {#if pendingOrganizers.length === 0}
        <p class="text-gray-600 text-sm">No pending applications.</p>
      {:else}
        <div class="space-y-4">
          {#each pendingOrganizers as org}
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-100 rounded-lg p-4">
              <div>
                <p class="text-sm font-semibold text-gray-900">{org.company_name}</p>
                <p class="text-sm text-gray-600">{org.contact_email}{#if org.contact_phone} · {org.contact_phone}{/if}</p>
                {#if org.website_url}
                  <p class="text-xs text-indigo-600 truncate">{org.website_url}</p>
                {/if}
              </div>
              <div class="flex items-center gap-3">
                <form method="POST" action="?/approveOrganizer">
                  <input type="hidden" name="organizer_id" value={org.id} />
                  <button type="submit" class="btn-primary text-sm">Approve</button>
                </form>
                <form method="POST" action="?/removeOrganizer">
                  <input type="hidden" name="organizer_id" value={org.id} />
                  <button type="submit" class="btn-danger text-sm">Remove</button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
{:else}
  <section class="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-2xl shadow">
    <h1 class="text-2xl font-bold mb-2">Access denied</h1>
    <p class="text-gray-600">You must be an admin to manage events.</p>
  </section>
{/if}

<style>
  .input {
    @apply w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500;
  }
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 border border-gray-300 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2;
  }
  .btn-danger {
    @apply inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
  }
</style>
