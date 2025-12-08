<script lang="ts">
  
  export let data;
  const { isOrganizer, events = [] } = data;

  type TicketRow = { type: string; price: number; quantity: number };
  let tickets: TicketRow[] = [{ type: '', price: 0, quantity: 0 }];

  function addTicket() {
    tickets = [...tickets, { type: '', price: 0, quantity: 0 }];
  }

  function removeTicket(index: number) {
    if (tickets.length <= 1) return;
    tickets = tickets.filter((_, i) => i !== index);
  }
</script>

<svelte:head>
  <title>My Events</title>
</svelte:head>

{#if !isOrganizer}
  <section class="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-2xl shadow">
    <h1 class="text-2xl font-bold mb-2">Access denied</h1>
    <p class="text-gray-600">You must be an organizer to manage events.</p>
  </section>
{:else}
  <div class="max-w-6xl mx-auto px-4 py-10 space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">My Events</h1>
      <p class="text-gray-600">Create, edit, and manage your events.</p>
    </div>

    <section class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      <h2 class="text-xl font-semibold text-gray-900">Create Event</h2>
      <p class="text-sm text-gray-500">Either upload an image or paste an image URL.</p>
      <form method="POST" action="?/createEvent" enctype="multipart/form-data" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Title</span>
          <input name="title" class="input" required />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">City</span>
          <select name="city" class="input" required>
            <option value="">Select a city</option>
            <option value="Fes">Fes</option>
            <option value="Rabat">Rabat</option>
            <option value="Casablanca">Casablanca</option>
            <option value="Marrakesh">Marrakesh</option>
            <option value="Tangier">Tangier</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Venue (optional)</span>
          <input name="venue" class="input" placeholder="e.g., Heritage Square" />
        </label>
        <div></div>
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
          <span class="text-sm font-medium text-gray-700">Image URL (optional)</span>
          <input name="image_url" class="input" />
        </label>
        <label class="space-y-1 md:col-span-2">
          <span class="text-sm font-medium text-gray-700">Upload Image (optional)</span>
          <input type="file" name="image_file" accept="image/*" class="input" />
        </label>
        <label class="space-y-1 md:col-span-2">
          <span class="text-sm font-medium text-gray-700">Description</span>
          <textarea name="description" class="input h-24"></textarea>
        </label>

        <div class="md:col-span-2 border-t border-gray-200 pt-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Ticket Types</h3>
            <button type="button" on:click={addTicket} class="btn-secondary">Add ticket type</button>
          </div>
          <div class="space-y-3">
            {#each tickets as ticket, index}
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <label class="space-y-1 md:col-span-2">
                  <span class="text-sm font-medium text-gray-700">Type</span>
                  <input
                    name="ticket_type[]"
                    class="input"
                    bind:value={ticket.type}
                    placeholder="General, VIP, Early Bird"
                    required
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-sm font-medium text-gray-700">Price</span>
                  <input name="ticket_price[]" type="number" step="0.01" class="input" bind:value={ticket.price} min="0" required />
                </label>
                <label class="space-y-1">
                  <span class="text-sm font-medium text-gray-700">Quantity</span>
                  <input name="ticket_quantity[]" type="number" class="input" bind:value={ticket.quantity} min="0" required />
                </label>
                <div class="md:col-span-4 flex justify-end">
                  <button type="button" class="btn-danger" on:click={() => removeTicket(index)} disabled={tickets.length <= 1}>
                    Remove
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="md:col-span-2 flex justify-end">
          <button type="submit" class="btn-primary">Create Event</button>
        </div>
      </form>
    </section>

    <section class="space-y-4">
      <h2 class="text-xl font-semibold text-gray-900">Your Events</h2>
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
                    <span class="text-sm font-medium text-gray-700">City</span>
                    <select name="city" class="input">
                      <option value={event.location || ''} selected>{event.location || 'Current location'}</option>
                      <option value="Fes">Fes</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Casablanca">Casablanca</option>
                      <option value="Marrakesh">Marrakesh</option>
                      <option value="Tangier">Tangier</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Venue (optional)</span>
                    <input name="venue" class="input" placeholder="e.g., Heritage Square" />
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
                    <span class="text-sm font-medium text-gray-700">Price</span>
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
                        <span>${ticket.price} · Qty {ticket.quantity}</span>
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
  </div>
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

