<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { organizerApi } from '$lib/api';
  import { format } from 'date-fns';

  let events = [];
  let loading = true;
  let error = null;
  let showCreateForm = false;
  let editingEvent = null;

  // Form data
  let formData = {
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    category_id: '',
    price: '',
    capacity: '',
    image_url: '',
    tickets: [
      { type: 'General Admission', price: '', quantity: '' }
    ]
  };

  let categories = [];
  let formLoading = false;
  let formError = null;

  onMount(async () => {
    await loadOrganizerEvents();
    await loadCategories();
  });

  async function loadOrganizerEvents() {
    try {
      loading = true;
      error = null;
      
      try {
        // This would need a new API endpoint for organizer's events
        // For now, we'll show the create form
        events = [];
      } catch (apiError) {
        // Check if this is an authorization error
        if (apiError.message.includes('401') || 
            apiError.message.includes('Unauthorized') || 
            apiError.message.includes('Invalid or expired token') ||
            apiError.status === 401 || apiError.status === 403) {
          console.log('Authorization failed, redirecting to login');
          goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
          return;
        }
        throw apiError;
      }
    } catch (err) {
      error = 'Unable to load events. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function loadCategories() {
    try {
      // Categories are reference data, safe to read directly from Supabase
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      categories = data || [];
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  function addTicketType() {
    formData.tickets = [...formData.tickets, { type: '', price: '', quantity: '' }];
  }

  function removeTicketType(index: number) {
    formData.tickets = formData.tickets.filter((_, i) => i !== index);
  }

  async function handleSubmit() {
    try {
      formLoading = true;
      formError = null;

      const eventData = {
        ...formData,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        tickets: formData.tickets.map(ticket => ({
          type: ticket.type,
          price: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity)
        }))
      };

      try {
        if (editingEvent) {
          // Use backend endpoint for event updates (backend endpoint exists)
          await organizerApi.updateEvent(editingEvent.id, eventData);
        } else {
          // Use backend endpoint for event creation (backend endpoint exists)
          await organizerApi.createEvent(eventData);
        }

        // Reset form and reload events
        resetForm();
        await loadOrganizerEvents();
      } catch (apiError) {
        // Check if this is an authorization error
        if (apiError.message.includes('401') || 
            apiError.message.includes('Unauthorized') || 
            apiError.message.includes('Invalid or expired token') ||
            apiError.status === 401 || apiError.status === 403 ||
            apiError.message.includes('403') ||
            apiError.message.includes('Forbidden')) {
          console.log('Authorization failed during event operation, redirecting to login');
          goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
          return;
        }
        throw apiError;
      }

    } catch (err) {
      formError = 'Unable to save event. Please check your information and try again.';
    } finally {
      formLoading = false;
    }
  }

  function resetForm() {
    formData = {
      title: '',
      description: '',
      location: '',
      start_date: '',
      end_date: '',
      category_id: '',
      price: '',
      capacity: '',
      image_url: '',
      tickets: [
        { type: 'General Admission', price: '', quantity: '' }
      ]
    };
    showCreateForm = false;
    editingEvent = null;
    formError = null;
  }

  function editEvent(event: any) {
    editingEvent = event;
    formData = {
      title: event.title,
      description: event.description,
      location: event.location,
      start_date: event.start_date?.split('T')[0] || '',
      end_date: event.end_date?.split('T')[0] || '',
      category_id: event.category_id || '',
      price: event.price?.toString() || '',
      capacity: event.capacity?.toString() || '',
      image_url: event.image_url || '',
      tickets: event.tickets || [{ type: 'General Admission', price: '', quantity: '' }]
    };
    showCreateForm = true;
  }
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8 flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
      <p class="text-gray-600">Create and manage your events</p>
    </div>
    
    <button
      on:click={() => showCreateForm = !showCreateForm}
      class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
    >
      {showCreateForm ? 'Cancel' : 'Create Event'}
    </button>
  </div>

  <!-- Create/Edit Event Form -->
  {#if showCreateForm}
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">
        {editingEvent ? 'Edit Event' : 'Create New Event'}
      </h2>

      {#if formError}
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p class="text-red-800">{formError}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              id="title"
              type="text"
              bind:value={formData.title}
              required
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              id="location"
              type="text"
              bind:value={formData.location}
              required
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label for="start_date" class="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              id="start_date"
              type="datetime-local"
              bind:value={formData.start_date}
              required
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label for="end_date" class="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              id="end_date"
              type="datetime-local"
              bind:value={formData.end_date}
              required
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              bind:value={formData.category_id}
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Category</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="capacity" class="block text-sm font-medium text-gray-700 mb-1">
              Capacity *
            </label>
            <input
              id="capacity"
              type="number"
              bind:value={formData.capacity}
              required
              min="1"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            required
            rows="4"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          ></textarea>
        </div>

        <!-- Image URL -->
        <div>
          <label for="image_url" class="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            id="image_url"
            type="url"
            bind:value={formData.image_url}
            placeholder="https://example.com/event-image.jpg"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <!-- Ticket Types -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Ticket Types</h3>
            <button
              type="button"
              on:click={addTicketType}
              class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
            >
              Add Ticket Type
            </button>
          </div>

          <div class="space-y-4">
            {#each formData.tickets as ticket, index}
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-md">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Type *
                  </label>
                  <input
                    type="text"
                    bind:value={ticket.type}
                    required
                    placeholder="General, VIP, Early Bird..."
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    bind:value={ticket.price}
                    required
                    min="0"
                    step="0.01"
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    bind:value={ticket.quantity}
                    required
                    min="1"
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div class="flex items-end">
                  {#if formData.tickets.length > 1}
                    <button
                      type="button"
                      on:click={() => removeTicketType(index)}
                      class="w-full bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200"
                    >
                      Remove
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex space-x-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={formLoading}
            class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {formLoading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
          </button>
          
          <button
            type="button"
            on:click={resetForm}
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Events List -->
  <div class="bg-white rounded-lg shadow-md">
    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-600">Loading your events...</p>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <div class="text-red-600 mb-4">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg font-medium">Failed to Load Events</p>
          <p class="text-sm">{error}</p>
        </div>
        <button
          on:click={loadOrganizerEvents}
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    {:else if events.length === 0}
      <div class="text-center py-12">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-lg font-medium">Something went wrong</p>
        <p class="text-gray-600 mb-4">Create your first event to get started.</p>
        <button
          on:click={() => showCreateForm = true}
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Create Event
        </button>
      </div>
    {:else}
      <div class="overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each events as event (event.id)}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{event.title}</div>
                    <div class="text-sm text-gray-500">{event.description?.substring(0, 50)}...</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(event.start_date), 'MMM d, yyyy')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.location}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${event.price}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    on:click={() => editEvent(event)}
                    class="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    class="text-gray-600 hover:text-gray-900"
                  >
                    Stats
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>