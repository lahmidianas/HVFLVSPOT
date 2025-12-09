<script lang="ts">
  export let data;
  const { mode, isOrganizer, events = [], categories = [], organizer = null, user } = data;

  type TicketRow = { type: string; custom: string; price: number; quantity: number };

  let createCity = '';
  let createCustomCity = '';
  let createVenue = '';
  let createTickets: TicketRow[] = [{ type: 'Standard', custom: '', price: 0, quantity: 0 }];

  let editTickets: Record<string, TicketRow[]> = {};

  const ensureEditTickets = () => {
    for (const event of events) {
      if (!editTickets[event.id]) {
        editTickets[event.id] = event.tickets && event.tickets.length
          ? event.tickets.map((t: any) => ({
              type: t?.type === 'Standard' || t?.type === 'VIP' ? t.type : 'Other',
              custom: t?.type === 'Standard' || t?.type === 'VIP' ? '' : (t?.type ?? ''),
              price: t?.price ?? 0,
              quantity: t?.quantity ?? 0
            }))
          : [{ type: 'Standard', custom: '', price: 0, quantity: 0 }];
      }
    }
  };

  $: ensureEditTickets();

  function addCreateTicket() {
    createTickets = [...createTickets, { type: 'Standard', custom: '', price: 0, quantity: 0 }];
  }
  function removeCreateTicket(index: number) {
    if (createTickets.length <= 1) return;
    createTickets = createTickets.filter((_, i) => i !== index);
  }

  function addEditTicket(eventId: string) {
    editTickets[eventId] = [...(editTickets[eventId] || []), { type: 'Standard', custom: '', price: 0, quantity: 0 }];
  }
  function removeEditTicket(eventId: string, index: number) {
    if (!editTickets[eventId] || editTickets[eventId].length <= 1) return;
    editTickets[eventId] = editTickets[eventId].filter((_, i) => i !== index);
  }

  const cityOptions = ['Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier', 'Agadir', 'Oujda', 'OTHER'];
</script>

<svelte:head>
  <title>My Events</title>
</svelte:head>

{#if mode === 'apply'}
  <div class="max-w-3xl mx-auto mt-12 space-y-6 bg-white rounded-2xl shadow p-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Apply to become an organizer</h1>
      <p class="text-gray-600 text-sm">Submit your details to request organizer access. Once approved, you can create and manage events.</p>
    </div>

    {#if organizer && organizer.verified === false}
      <div class="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
        Your application is pending review. You can update your details below.
      </div>
    {/if}

    <form method="POST" action="?/applyOrganizer" class="space-y-4">
      <label class="space-y-1 block">
        <span class="text-sm font-medium text-gray-700">Organization / brand name</span>
        <input name="company_name" class="input" required value={organizer?.company_name || ''} />
      </label>
      <label class="space-y-1 block">
        <span class="text-sm font-medium text-gray-700">Short description</span>
        <textarea name="description" class="input h-24">{organizer?.description}</textarea>
      </label>
      <label class="space-y-1 block">
        <span class="text-sm font-medium text-gray-700">Phone / WhatsApp</span>
        <input name="contact_phone" class="input" value={organizer?.contact_phone || ''} />
      </label>
      <label class="space-y-1 block">
        <span class="text-sm font-medium text-gray-700">Website or social link</span>
        <input name="website_url" class="input" value={organizer?.website_url || ''} />
      </label>
      <label class="space-y-1 block">
        <span class="text-sm font-medium text-gray-700">Contact email</span>
        <input class="input bg-gray-50" value={user?.email} readonly />
      </label>
      <div class="flex justify-end">
        <button type="submit" class="btn-primary">Submit application</button>
      </div>
    </form>
  </div>
{:else if isOrganizer}
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
          <span class="text-sm font-medium text-gray-700">Category</span>
          <select name="category_id" class="input">
            <option value="">Select a category</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">City</span>
          <select name="city" class="input" bind:value={createCity} required>
            <option value="">Select a city</option>
            {#each cityOptions as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        </label>
        {#if createCity === 'OTHER'}
          <label class="space-y-1">
            <span class="text-sm font-medium text-gray-700">Custom City</span>
            <input name="custom_city" class="input" bind:value={createCustomCity} placeholder="Enter your city" />
          </label>
        {:else}
          <div></div>
        {/if}
        <label class="space-y-1">
          <span class="text-sm font-medium text-gray-700">Venue (optional)</span>
          <input name="venue" class="input" bind:value={createVenue} placeholder="e.g., Heritage Square" />
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
            <button type="button" on:click={addCreateTicket} class="btn-secondary">Add ticket type</button>
          </div>
          <div class="space-y-3">
            {#each createTickets as ticket, index}
              <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <label class="space-y-1">
                  <span class="text-sm font-medium text-gray-700">Type</span>
                  <select name="ticket_type" class="input" bind:value={ticket.type}>
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                {#if ticket.type === 'Other'}
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Custom label</span>
                    <input name="ticket_type_custom" class="input" bind:value={ticket.custom} placeholder="e.g., Early Bird" required />
                  </label>
                {:else}
                  <input type="hidden" name="ticket_type_custom" value="" />
                  <div></div>
                {/if}
                <label class="space-y-1">
                  <span class="text-sm font-medium text-gray-700">Price</span>
                  <input name="ticket_price" type="number" step="0.01" class="input" bind:value={ticket.price} min="0" required />
                </label>
                <label class="space-y-1">
                  <span class="text-sm font-medium text-gray-700">Quantity</span>
                  <input name="ticket_quantity" type="number" class="input" bind:value={ticket.quantity} min="0" required />
                </label>
                <div class="md:col-span-1 flex justify-end">
                  <button type="button" class="btn-danger" on:click={() => removeCreateTicket(index)} disabled={createTickets.length <= 1}>
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
          {#each events as event (event.id)}
            {#if !editTickets[event.id]}
              {ensureEditTickets()}
            {/if}
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
                <form method="POST" action="?/updateEvent" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3" enctype="multipart/form-data">
                  <input type="hidden" name="id" value={event.id} />
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Title</span>
                    <input name="title" class="input" value={event.title} />
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Category</span>
                    <select name="category_id" class="input">
                      <option value="">Select a category</option>
                      {#each categories as category}
                        <option value={category.id} selected={event.category_id === category.id}>{category.name}</option>
                      {/each}
                    </select>
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">City (leave blank to keep current)</span>
                    <select name="city" class="input">
                      <option value="">Keep current</option>
                      {#each cityOptions as opt}
                        <option value={opt}>{opt}</option>
                      {/each}
                    </select>
                  </label>
                  <label class="space-y-1">
                    <span class="text-sm font-medium text-gray-700">Custom City (if OTHER)</span>
                    <input name="custom_city" class="input" placeholder="Enter custom city" />
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
                  <label class="space-y-1 md:col-span-2">
                    <span class="text-sm font-medium text-gray-700">Image URL</span>
                    <input name="image_url" class="input" value={event.image_url} />
                  </label>
                  <label class="space-y-1 md:col-span-2">
                    <span class="text-sm font-medium text-gray-700">Upload Image (optional)</span>
                    <input type="file" name="image_file" accept="image/*" class="input" />
                  </label>
                  <label class="space-y-1 md:col-span-2">
                    <span class="text-sm font-medium text-gray-700">Description</span>
                    <textarea name="description" class="input h-24">{event.description}</textarea>
                  </label>

                  <div class="md:col-span-2 border-t border-gray-200 pt-4 space-y-3">
                    <div class="flex items-center justify-between">
                      <h3 class="text-lg font-semibold text-gray-900">Ticket Types</h3>
                      <button type="button" on:click={() => addEditTicket(event.id)} class="btn-secondary">Add ticket type</button>
                    </div>
                    <div class="space-y-3">
                      {#each editTickets[event.id] as ticket, idx}
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                          <label class="space-y-1">
                            <span class="text-sm font-medium text-gray-700">Type</span>
                            <select name="ticket_type" class="input" bind:value={ticket.type}>
                              <option value="Standard">Standard</option>
                              <option value="VIP">VIP</option>
                              <option value="Other">Other</option>
                            </select>
                          </label>
                          {#if ticket.type === 'Other'}
                            <label class="space-y-1">
                              <span class="text-sm font-medium text-gray-700">Custom label</span>
                              <input name="ticket_type_custom" class="input" bind:value={ticket.custom} placeholder="e.g., Early Bird" required />
                            </label>
                          {:else}
                            <input type="hidden" name="ticket_type_custom" value="" />
                            <div></div>
                          {/if}
                          <label class="space-y-1">
                            <span class="text-sm font-medium text-gray-700">Price</span>
                            <input name="ticket_price" type="number" step="0.01" class="input" bind:value={ticket.price} min="0" required />
                          </label>
                          <label class="space-y-1">
                            <span class="text-sm font-medium text-gray-700">Quantity</span>
                            <input name="ticket_quantity" type="number" class="input" bind:value={ticket.quantity} min="0" required />
                          </label>
                          <div class="md:col-span-1 flex justify-end">
                            <button type="button" class="btn-danger" on:click={() => removeEditTicket(event.id, idx)} disabled={editTickets[event.id].length <= 1}>
                              Remove
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>

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
                        <span>${ticket.price} × Qty {ticket.quantity}</span>
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
