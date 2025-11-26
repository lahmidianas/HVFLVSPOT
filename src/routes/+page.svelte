<script lang="ts">
  import { onMount } from 'svelte';
  import { eventApi } from '$lib/api';
  import { supabase } from '$lib/supabase';
  import Hero from '$lib/components/Hero.svelte';
  import Categories from '$lib/components/Categories.svelte';
  import EventCard from '$lib/components/events/EventCard.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let recommendedEvents = [];
  let featuredEvents = [];
  let loadingRecommended = false;
  let loadingFeatured = false;
  let recommendedError = null;
  let featuredError = null;
  let isAuthenticated = false;

  $: isAuthenticated = !!data.session;

  onMount(async () => {
    if (isAuthenticated) {
      await loadRecommendedEvents();
    } else {
      await loadFeaturedEvents();
    }
  });

  async function loadRecommendedEvents() {
    try {
      loadingRecommended = true;
      recommendedError = null;
      
      console.log('🔍 Loading recommended events...');
      
      const result = await eventApi.getRecommended({ limit: 6 });
      console.log('✅ Recommendations loaded:', { count: result.events?.length || 0 });
      recommendedEvents = result.events || [];
    } catch (err) {
      console.error('❌ Recommendations API error:', err);
      console.log('🔄 Recommendations failed, falling back to featured events');
      recommendedError = 'Unable to load recommendations. Please try again.';
      // Fallback to featured events
      await loadFeaturedEvents();
    } finally {
      loadingRecommended = false;
    }
  }

  async function loadFeaturedEvents() {
    try {
      loadingFeatured = true;
      featuredError = null;
      
      // Featured events are reference data, safe to read directly from Supabase
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
        .limit(6);
      
      if (error) throw error;
      featuredEvents = data || [];
    } catch (err) {
      featuredError = 'Unable to load events. Please try again.';
    } finally {
      loadingFeatured = false;
    }
  }
</script>

<main>
  <Hero />
  <Categories />
  
  <!-- Recommended Events (Authenticated Users) -->
  {#if isAuthenticated}
    <section class="bg-white py-12 animate-fade-in" aria-labelledby="recommended-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="recommended-heading" class="text-2xl font-bold mb-6 animate-slide-in-left">Recommended for You</h2>
        
        {#if loadingRecommended}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {#each Array(6) as _}
              <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="h-48 bg-gray-200 animate-pulse"></div>
                <div class="p-4 space-y-3">
                  <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div class="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div class="space-y-2">
                    <div class="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div class="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                  <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            {/each}
          </div>
        {:else if recommendedError}
          <div class="text-center py-8 animate-fade-in">
            <div class="text-gray-600 mb-4">
              <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-lg font-medium text-gray-900">Something went wrong</p>
              <p class="text-sm">{recommendedError}</p>
            </div>
            <button
              on:click={loadRecommendedEvents}
              class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              aria-label="Retry loading recommended events"
            >
              Try Again
            </button>
          </div>
        {:else if recommendedEvents.length === 0}
          <div class="text-center py-8 animate-fade-in">
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p class="text-gray-600">We'll personalize recommendations as you explore events.</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {#each recommendedEvents as event (event.id)}
              <EventCard {event} />
            {/each}
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Featured Events (All Users) -->
  <section class="bg-gray-50 py-12 animate-fade-in" aria-labelledby="featured-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 id="featured-heading" class="text-2xl font-bold mb-6 animate-slide-in-left">
        {isAuthenticated ? 'Featured Events' : 'Upcoming Events'}
      </h2>
      
      {#if loadingFeatured}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {#each Array(6) as _}
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              <div class="h-48 bg-gray-200 animate-pulse"></div>
              <div class="p-4 space-y-3">
                <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div class="space-y-2">
                  <div class="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div class="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
                <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if featuredError}
        <div class="text-center py-8 animate-fade-in">
          <div class="text-gray-600 mb-4">
            <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium text-gray-900">Unable to load events</p>
            <p class="text-sm">{featuredError}</p>
          </div>
          <button
            on:click={loadFeaturedEvents}
            class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            aria-label="Retry loading featured events"
          >
            Try Again
          </button>
        </div>
      {:else if featuredEvents.length === 0}
        <div class="text-center py-8 animate-fade-in">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No events available</h3>
          <p class="text-gray-600">Check back soon for exciting new events!</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {#each featuredEvents as event (event.id)}
            <EventCard {event} />
          {/each}
        </div>
      {/if}
    </div>
  </section>
</main>