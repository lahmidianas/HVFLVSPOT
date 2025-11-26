<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { eventApi } from '$lib/api';
  import EventCard from '$lib/components/events/EventCard.svelte';
  import { supabase } from '$lib/supabase';

  // Search state
  let events = [];
  let pagination = null;
  let loading = false;
  let error = null;
  let categories = [];

  // Form state
  let searchQuery = '';
  let selectedCategory = '';
  let selectedLocation = '';
  let minPrice = '';
  let maxPrice = '';
  let startDate = '';
  let endDate = '';
  let currentPage = 1;

  // UI state
  let mobileFiltersOpen = false;
  let searchTimeout: NodeJS.Timeout;
  let retryCount = 0;
  let maxRetries = 3;

  // Reactive URL synchronization
  $: if (browser) {
    syncFromURL($page.url.searchParams);
  }

  onMount(async () => {
    await loadCategories();
    await performSearch();
  });

  function syncFromURL(params: URLSearchParams) {
    searchQuery = params.get('q') || '';
    selectedCategory = params.get('category') || '';
    selectedLocation = params.get('city') || '';
    minPrice = params.get('min_price') || '';
    maxPrice = params.get('max_price') || '';
    startDate = params.get('start_date') || '';
    endDate = params.get('end_date') || '';
    currentPage = parseInt(params.get('page') || '1');
  }

  function updateURL() {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedLocation) params.set('city', selectedLocation);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const url = `/events${params.toString() ? '?' + params.toString() : ''}`;
    goto(url, { replaceState: true, noScroll: true });
  }

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      categories = data || [];
    } catch (err) {
      console.error('Failed to load categories:', err);
      categories = [];
    }
  }

  async function performSearch() {
    let result = { events: [], pagination: null };
    
    try {
      loading = true;
      error = null;
      
      console.log('🔍 Starting event search with params:', {
        keywords: searchQuery || undefined,
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        page: currentPage
      });

      const searchParams = {
        keywords: searchQuery || undefined,
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 12
      };

      try {
        result = await eventApi.search(searchParams);
        console.log('✅ Search successful:', { eventsFound: result.events?.length || 0 });
      } catch (apiError) {
        console.error('❌ Backend API error:', apiError);
        
        // Fallback to direct Supabase query for events
        console.log('🔄 Falling back to direct database query...');
        const { data: fallbackEvents, error: fallbackError } = await supabase
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
          .limit(searchParams.limit);
        
        if (fallbackError) throw fallbackError;
        
        result = {
          events: fallbackEvents || [],
          pagination: {
            page: 1,
            limit: searchParams.limit,
            total: fallbackEvents?.length || 0,
            totalPages: 1
          }
        };
        
        console.log('✅ Fallback query successful:', { eventsFound: result.events.length });
      }
      
      events = result.events || [];
      pagination = result.pagination;
      retryCount = 0; // Reset retry count on success
    } catch (err) {
      console.error('Search error:', err);
      
      // Check if it's a backend connectivity issue
      if (err.message?.includes('fetch') || 
          err.message?.includes('network') || 
          err.message?.includes('Failed to fetch') ||
          err.status === 500 ||
          err.status === 503 ||
          err.status === 0) {
        error = 'backend-unavailable';
      } else if (err.status === 401 || err.status === 403) {
        error = 'unauthorized';
      } else {
        error = 'search-failed';
      }
      
      events = [];
      pagination = null;
    } finally {
      loading = false;
    }
  }

  async function retrySearch() {
    if (retryCount < maxRetries) {
      retryCount++;
      await performSearch();
    }
  }

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      updateURL();
      performSearch();
    }, 300);
  }

  function handleFilterChange() {
    currentPage = 1;
    updateURL();
    performSearch();
  }

  function clearFilters() {
    searchQuery = '';
    selectedCategory = '';
    selectedLocation = '';
    minPrice = '';
    maxPrice = '';
    startDate = '';
    endDate = '';
    currentPage = 1;
    updateURL();
    performSearch();
  }

  function goToPage(page: number) {
    currentPage = page;
    updateURL();
    performSearch();
  }

  function toggleMobileFilters() {
    mobileFiltersOpen = !mobileFiltersOpen;
  }

  function hasActiveFilters() {
    return searchQuery || selectedCategory || selectedLocation || minPrice || maxPrice || startDate || endDate;
  }

  function getFilterSummary() {
    const filters = [];
    if (searchQuery) filters.push(`"${searchQuery}"`);
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) filters.push(category.name);
    }
    if (selectedLocation) filters.push(selectedLocation);
    if (minPrice || maxPrice) {
      if (minPrice && maxPrice) {
        filters.push(`$${minPrice} - $${maxPrice}`);
      } else if (minPrice) {
        filters.push(`$${minPrice}+`);
      } else if (maxPrice) {
        filters.push(`Under $${maxPrice}`);
      }
    }
    if (startDate || endDate) {
      if (startDate && endDate) {
        filters.push(`${startDate} to ${endDate}`);
      } else if (startDate) {
        filters.push(`From ${startDate}`);
      } else if (endDate) {
        filters.push(`Until ${endDate}`);
      }
    }
    return filters;
  }
</script>

<svelte:head>
  <title>Search Events - HVFLVSPOT</title>
  <meta name="description" content="Search and discover amazing events near you" />
</svelte:head>

<main class="min-h-screen bg-gray-50">
  <!-- Search Header -->
  <div class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Event</h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover amazing events happening near you. Use the filters below to find exactly what you're looking for.
        </p>
      </div>
      
      <!-- Main Search Bar -->
      <div class="max-w-2xl mx-auto mb-8">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            bind:value={searchQuery}
            on:input={handleSearchInput}
            placeholder="Search for events, artists, venues..."
            aria-label="Search events by keyword"
            class="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      <!-- Mobile Filter Toggle -->
      <div class="lg:hidden mb-6">
        <button
          on:click={toggleMobileFilters}
          class="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-expanded={mobileFiltersOpen}
          aria-controls="mobile-filters"
          aria-label="Toggle search filters"
        >
          <span class="flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            Filters & Sort
            {#if hasActiveFilters()}
              <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {getFilterSummary().length} active
              </span>
            {/if}
          </span>
          <svg class="w-5 h-5 transform transition-transform duration-200 {mobileFiltersOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- Mobile Filter Drawer -->
      {#if mobileFiltersOpen}
        <div 
          id="mobile-filters" 
          class="lg:hidden bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-6 shadow-sm"
          role="region"
          aria-label="Search filters"
        >
          <!-- Category -->
          <div>
            <label for="mobile-category" class="block text-sm font-semibold text-gray-900 mb-2">
              Category
            </label>
            <select
              id="mobile-category"
              bind:value={selectedCategory}
              on:change={handleFilterChange}
              aria-describedby="mobile-category-help"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
            >
              <option value="">All Categories</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
            <div id="mobile-category-help" class="sr-only">Filter events by category</div>
          </div>

          <!-- Location -->
          <div>
            <label for="mobile-location" class="block text-sm font-semibold text-gray-900 mb-2">
              City or Venue
            </label>
            <input
              id="mobile-location"
              type="text"
              bind:value={selectedLocation}
              on:input={handleFilterChange}
              placeholder="Enter city or venue name"
              aria-describedby="mobile-location-help"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
            />
            <div id="mobile-location-help" class="sr-only">Filter events by city or venue</div>
          </div>

          <!-- Price Range -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Price Range
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  bind:value={minPrice}
                  on:input={handleFilterChange}
                  placeholder="Min $"
                  aria-label="Minimum price"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                />
              </div>
              <div>
                <input
                  type="number"
                  bind:value={maxPrice}
                  on:input={handleFilterChange}
                  placeholder="Max $"
                  aria-label="Maximum price"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                />
              </div>
            </div>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Date Range
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="mobile-start-date" class="block text-xs text-gray-600 mb-1">From</label>
                <input
                  id="mobile-start-date"
                  type="date"
                  bind:value={startDate}
                  on:change={handleFilterChange}
                  aria-label="Start date"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                />
              </div>
              <div>
                <label for="mobile-end-date" class="block text-xs text-gray-600 mb-1">To</label>
                <input
                  id="mobile-end-date"
                  type="date"
                  bind:value={endDate}
                  on:change={handleFilterChange}
                  aria-label="End date"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                />
              </div>
            </div>
          </div>

          <!-- Clear Filters -->
          {#if hasActiveFilters()}
            <div class="pt-4 border-t border-gray-200">
              <button
                on:click={clearFilters}
                class="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Clear all search filters"
              >
                Clear All Filters
              </button>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Desktop Filters -->
      <div class="hidden lg:block bg-white p-6 rounded-xl shadow-sm border border-gray-200" role="search" aria-label="Event search filters">
        <div class="grid grid-cols-5 gap-6 items-end">
          <!-- Category -->
          <div>
            <label for="desktop-category" class="block text-sm font-semibold text-gray-900 mb-2">
              Category
            </label>
            <select
              id="desktop-category"
              bind:value={selectedCategory}
              on:change={handleFilterChange}
              aria-describedby="desktop-category-help"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
            <div id="desktop-category-help" class="sr-only">Filter events by category</div>
          </div>

          <!-- Location -->
          <div>
            <label for="desktop-location" class="block text-sm font-semibold text-gray-900 mb-2">
              City or Venue
            </label>
            <input
              id="desktop-location"
              type="text"
              bind:value={selectedLocation}
              on:input={handleFilterChange}
              placeholder="Enter city or venue"
              aria-describedby="desktop-location-help"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <div id="desktop-location-help" class="sr-only">Filter events by city or venue</div>
          </div>

          <!-- Price Range -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Price Range
            </label>
            <div class="flex space-x-2">
              <input
                type="number"
                bind:value={minPrice}
                on:input={handleFilterChange}
                placeholder="Min $"
                aria-label="Minimum price"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="number"
                bind:value={maxPrice}
                on:input={handleFilterChange}
                placeholder="Max $"
                aria-label="Maximum price"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Date Range
            </label>
            <div class="flex space-x-2">
              <input
                type="date"
                bind:value={startDate}
                on:change={handleFilterChange}
                aria-label="Start date"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="date"
                bind:value={endDate}
                on:change={handleFilterChange}
                aria-label="End date"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Clear Filters Button -->
          <div>
            {#if hasActiveFilters()}
              <button
                on:click={clearFilters}
                class="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Clear all search filters"
              >
                Clear Filters
              </button>
            {:else}
              <div class="h-10"></div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Results Section -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <section aria-labelledby="results-heading">
      <h2 id="results-heading" class="sr-only">Search Results</h2>
      
      {#if loading}
        <!-- Loading State -->
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p class="text-lg text-gray-600">Searching for events...</p>
          {#if hasActiveFilters()}
            <p class="text-sm text-gray-500 mt-2">
              Filtering by: {getFilterSummary().join(', ')}
            </p>
          {/if}
        </div>
        
        <!-- Loading Skeletons -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {#each Array(6) as _}
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
              <div class="h-56 bg-gray-200"></div>
              <div class="p-6 space-y-4">
                <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                <div class="space-y-2">
                  <div class="h-4 bg-gray-200 rounded"></div>
                  <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div class="space-y-3">
                  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div class="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          {/each}
        </div>

      {:else if error === 'backend-unavailable'}
        <!-- Backend Unavailable Error -->
        <div class="text-center py-16">
          <div class="max-w-md mx-auto">
            <div class="mb-8">
              <svg class="w-20 h-20 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Search Temporarily Unavailable</h3>
            <p class="text-lg text-gray-600 mb-8">
              We're having trouble connecting to our search service. This is usually temporary.
            </p>
            
            <div class="space-y-4">
              <button
                on:click={retrySearch}
                disabled={retryCount >= maxRetries}
                class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {retryCount >= maxRetries ? 'Max Retries Reached' : `Try Again ${retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}`}
              </button>
              
              <div>
                <a
                  href="/"
                  class="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                >
                  ← Back to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>

      {:else if error === 'unauthorized'}
        <!-- Unauthorized Error -->
        <div class="text-center py-16">
          <div class="max-w-md mx-auto">
            <div class="mb-8">
              <svg class="w-20 h-20 mx-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h3>
            <p class="text-lg text-gray-600 mb-8">
              Please sign in to search for events.
            </p>
            
            <a
              href="/login?redirect=/events"
              class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
            >
              Sign In
            </a>
          </div>
        </div>

      {:else if error === 'search-failed'}
        <!-- General Search Error -->
        <div class="text-center py-16">
          <div class="max-w-md mx-auto">
            <div class="mb-8">
              <svg class="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Search Error</h3>
            <p class="text-lg text-gray-600 mb-8">
              Something went wrong with your search. Please try again.
            </p>
            
            <div class="space-y-4">
              <button
                on:click={performSearch}
                class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              
              <div>
                <button
                  on:click={clearFilters}
                  class="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                >
                  Clear filters and try again
                </button>
              </div>
            </div>
          </div>
        </div>

      {:else if events.length === 0}
        <!-- Empty State -->
        <div class="text-center py-16">
          <div class="max-w-lg mx-auto">
            <!-- Illustration -->
            <div class="mb-8">
              <svg class="w-32 h-32 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <h3 class="text-3xl font-bold text-gray-900 mb-4">No Events Found</h3>
            
            {#if hasActiveFilters()}
              <p class="text-lg text-gray-600 mb-6">
                We couldn't find any events matching your search criteria:
              </p>
              
              <!-- Active Filters Display -->
              <div class="bg-gray-100 rounded-lg p-4 mb-8">
                <div class="flex flex-wrap justify-center gap-2">
                  {#each getFilterSummary() as filter}
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      {filter}
                    </span>
                  {/each}
                </div>
              </div>
              
              <div class="space-y-4">
                <button
                  on:click={clearFilters}
                  class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear Filters & Show All Events
                </button>
                
                <div>
                  <a
                    href="/events"
                    class="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                  >
                    Browse all events
                  </a>
                </div>
              </div>
            {:else}
              <p class="text-lg text-gray-600 mb-8">
                There are no events available right now. Check back soon for exciting new events!
              </p>
              
              <div class="space-y-4">
                <button
                  on:click={performSearch}
                  class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Events
                </button>
                
                <div>
                  <a
                    href="/"
                    class="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                  >
                    ← Back to Homepage
                  </a>
                </div>
              </div>
            {/if}
          </div>
        </div>

      {:else}
        <!-- Results Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <p class="text-lg text-gray-900 font-semibold" role="status" aria-live="polite">
              {#if pagination}
                {pagination.total === 0 ? 'No events found' : 
                 pagination.total === 1 ? '1 event found' : 
                 `${pagination.total} events found`}
              {/if}
            </p>
            
            {#if hasActiveFilters()}
              <div class="mt-2 flex flex-wrap gap-2">
                <span class="text-sm text-gray-600">Filtered by:</span>
                {#each getFilterSummary() as filter}
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                    {filter}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
          
          {#if hasActiveFilters()}
            <button
              on:click={clearFilters}
              class="text-sm text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Clear all filters"
            >
              Clear all filters
            </button>
          {/if}
        </div>

        <!-- Event Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 animate-fade-in">
          {#each events as event (event.id)}
            <EventCard {event} />
          {/each}
        </div>

        <!-- Pagination -->
        {#if pagination && pagination.totalPages > 1}
          <div class="flex justify-center" role="navigation" aria-label="Search results pagination">
            <nav class="flex items-center space-x-2">
              <!-- Previous Button -->
              <button
                on:click={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                class="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                aria-label="Previous page"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <!-- Page Numbers -->
              {#each Array(Math.min(5, pagination.totalPages)) as _, i}
                {@const pageNum = Math.max(1, pagination.page - 2) + i}
                {#if pageNum <= pagination.totalPages}
                  <button
                    on:click={() => goToPage(pageNum)}
                    disabled={loading}
                    class="px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {pageNum === pagination.page ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} disabled:opacity-50"
                    aria-label="Page {pageNum}"
                    aria-current={pageNum === pagination.page ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                {/if}
              {/each}
              
              <!-- Next Button -->
              <button
                on:click={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                class="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                aria-label="Next page"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        {/if}
      {/if}
    </section>
  </div>
</main>