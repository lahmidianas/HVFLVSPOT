<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { staggerAnimation } from '$lib/utils/animations';

  let categories = [];
  let loading = true;
  let error = null;
  let categoriesContainer: HTMLElement;

  // Predefined category data with icons and gradients
  const categoryConfig = {
    'music': {
      icon: 'music',
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600'
    },
    'sports': {
      icon: 'trophy',
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600'
    },
    'comedy': {
      icon: 'smile',
      gradient: 'from-yellow-500 to-orange-500',
      hoverGradient: 'from-yellow-600 to-orange-600'
    },
    'arts': {
      icon: 'palette',
      gradient: 'from-green-500 to-teal-500',
      hoverGradient: 'from-green-600 to-teal-600'
    },
    'festivals': {
      icon: 'star',
      gradient: 'from-red-500 to-rose-500',
      hoverGradient: 'from-red-600 to-rose-600'
    },
    'entertainment': {
      icon: 'film',
      gradient: 'from-indigo-500 to-purple-500',
      hoverGradient: 'from-indigo-600 to-purple-600'
    }
  };

  onMount(async () => {
    await loadCategories();
  });

  async function loadCategories() {
    try {
      loading = true;
      error = null;
      console.log('🔍 Loading categories...');
      
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      console.log('📊 Categories query result:', { error: err, data });
      
      if (err) {
        console.error('❌ Categories error:', err);
        error = err.message;
        return;
      }
      
      categories = data || [];
      console.log(`✅ Loaded ${categories.length} categories:`, categories);
      
      // Add staggered animation after categories load
      setTimeout(() => {
        if (categoriesContainer && categories.length > 0) {
          const categoryCards = categoriesContainer.querySelectorAll('a');
          staggerAnimation(categoryCards, 'animate-fade-in-up', 100);
        }
      }, 100);
      
    } catch (err) {
      console.error('❌ Categories catch error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function getCategoryConfig(slug: string) {
    return categoryConfig[slug.toLowerCase()] || {
      icon: 'calendar',
      gradient: 'from-gray-500 to-gray-600',
      hoverGradient: 'from-gray-600 to-gray-700'
    };
  }

  function getIconSVG(iconType: string) {
    const icons = {
      music: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />`,
      trophy: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />`,
      smile: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
      palette: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3V1a1 1 0 011-1h8a1 1 0 011 1v2M7 21h10a2 2 0 002-2v-4a2 2 0 00-2-2H7" />`,
      star: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />`,
      film: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v3m2-4v10a1 1 0 001 1h8a1 1 0 001-1V4M7 4h10M9 9h6m-6 4h6" />`,
      calendar: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`
    };
    
    return icons[iconType] || icons.calendar;
  }
</script>

<section class="bg-gray-50 py-16 animate-fade-in" aria-labelledby="categories-heading">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12 animate-slide-in-left">
      <h2 id="categories-heading" class="text-3xl font-bold text-gray-900 mb-4">
        Explore by Category
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Discover amazing events across different categories and find your perfect experience
      </p>
    </div>
    
    {#if loading}
      <div class="text-center animate-fade-in" role="status" aria-label="Loading categories">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p class="text-gray-600">Loading categories...</p>
      </div>
    {:else if error}
      <div class="text-center py-12 animate-fade-in">
        <div class="text-red-600 mb-4">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Error</title>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg font-medium text-gray-900">Unable to load categories</p>
          <p class="text-sm text-gray-600">{error}</p>
        </div>
        <button
          on:click={loadCategories}
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    {:else if categories.length === 0}
      <div class="text-center py-12 animate-fade-in">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>No categories</title>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p class="text-lg font-medium text-gray-900">No categories available</p>
        <p class="text-gray-600">Check back soon for event categories</p>
      </div>
    {:else}
      <div bind:this={categoriesContainer} class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" role="list" aria-label="Event categories">
        {#each categories as category}
          {@const config = getCategoryConfig(category.slug)}
          <a
            href={`/events?category=${category.id}`}
            class="group relative overflow-hidden rounded-2xl bg-gradient-to-br {config.gradient} p-6 text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-50 cta-pulse will-change-transform"
            role="listitem"
            aria-label="Browse {category.name} events"
          >
            <!-- Background Pattern -->
            <div class="absolute inset-0 bg-gradient-to-br {config.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <!-- Content -->
            <div class="relative z-10 flex flex-col items-center text-center">
              <!-- Icon -->
              <div class="mb-4 p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>{category.name} icon</title>
                  {@html getIconSVG(config.icon)}
                </svg>
              </div>
              
              <!-- Label -->
              <h3 class="text-lg font-bold mb-2 group-hover:scale-105 transition-transform duration-300">
                {category.name}
              </h3>
              
              <!-- Description -->
              {#if category.description}
                <p class="text-sm text-white/80 group-hover:text-white transition-colors duration-300 line-clamp-2">
                  {category.description}
                </p>
              {/if}
              
              <!-- Hover Arrow -->
              <div class="mt-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Explore category</title>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
            
            <!-- Shine Effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>