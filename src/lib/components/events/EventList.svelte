<script lang="ts">
  import { onMount } from 'svelte';
  import { staggerAnimation } from '$lib/utils/animations';
  import EventCard from './EventCard.svelte';

  export let events: any[] = [];

  let listContainer: HTMLElement;

  onMount(() => {
    // Stagger animation for event cards
    if (listContainer && events.length > 0) {
      const cards = listContainer.querySelectorAll('article');
      staggerAnimation(cards, 'animate-fade-in-up', 150);
    }
  });

  // Re-run animations when events change
  $: if (listContainer && events.length > 0) {
    setTimeout(() => {
      const cards = listContainer.querySelectorAll('article');
      staggerAnimation(cards, 'animate-fade-in-up', 150);
    }, 100);
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
  <h2 class="text-2xl font-bold mb-6 animate-slide-in-left">Upcoming Events</h2>
  
  {#if !events || events.length === 0}
    <div class="text-center py-12 animate-fade-in">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="text-xl font-medium text-gray-900 mb-2">No events found</h3>
      <p class="text-gray-600">Check back soon for exciting new events!</p>
    </div>
  {:else}
    <div bind:this={listContainer} class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each events as event (event.id)}
        <EventCard {event} />
      {/each}
    </div>
  {/if}
</div>