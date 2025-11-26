<script lang="ts">
  import { onMount } from 'svelte';
  import { eventApi } from '$lib/api';
  import EventCard from './events/EventCard.svelte';
  
  let events = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      // Featured events are reference data, safe to read directly from Supabase
      // No backend endpoint exists for featured events specifically
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);
      
      if (error) throw error;
      events = data || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="bg-white py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-2xl font-bold mb-6">Featured Events</h2>
    
    {#if loading}
      <div class="text-center">Loading featured events...</div>
    {:else if error}
      <div class="text-red-600">{error}</div>
    {:else if events.length === 0}
      <div class="text-center text-gray-600">No featured events found</div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each events as event (event.id)}
          <EventCard {event} />
        {/each}
      </div>
    {/if}
  </div>
</div>