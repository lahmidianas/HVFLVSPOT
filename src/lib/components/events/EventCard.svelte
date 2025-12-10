<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { addFadeInAnimation, addCTAPulse } from '$lib/utils/animations';
  import { format } from 'date-fns';
  
  export let event: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    start_date: string;
    location: string;
    price: number;
  };

  let cardElement: HTMLElement;
  let ctaButton: HTMLElement;

  onMount(() => {
    if (cardElement) {
      addFadeInAnimation([cardElement]);
    }
    if (ctaButton) {
      addCTAPulse(ctaButton);
    }
  });

  function openDetails() {
    if (!browser || typeof goto !== 'function') return;
    try {
      goto(`/events/${event.id}`);
    } catch (error) {
      // Fallback navigation in case goto is unavailable
      window.location.href = `/events/${event.id}`;
    }
  }

  function handleKeydown(eventKey: KeyboardEvent) {
    if (eventKey.key === 'Enter' || eventKey.key === ' ') {
      eventKey.preventDefault();
      openDetails();
    }
  }

  // Truncate description to a reasonable length
  function truncateDescription(text: string, maxLength: number = 100): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
</script>

<div 
  bind:this={cardElement}
  class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 overflow-hidden border border-gray-100 hover:border-indigo-200 fade-in-observer will-change-transform cursor-pointer"
  role="button"
  tabindex="0"
  on:click={openDetails}
  on:keydown={handleKeydown}
>
  <!-- Event Image with Hover Zoom -->
  <div class="relative overflow-hidden h-56 bg-gradient-to-br from-gray-100 to-gray-200">
    <img 
      src={event.image_url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'} 
      alt={event.title} 
      class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
    />
    
    <!-- Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    <!-- Price Badge -->
    <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
      <span class="text-indigo-600 font-bold text-lg">
        €{typeof event.price === 'number' ? event.price.toFixed(2) : event.price}
      </span>
    </div>
  </div>
  
  <!-- Card Content -->
  <div class="p-6 space-y-4">
    <!-- Title -->
    <h3 class="text-xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
      {event.title}
    </h3>
    
    <!-- Description -->
    <p class="text-gray-600 text-sm leading-relaxed line-clamp-3">
      {truncateDescription(event.description, 120)}
    </p>
    
    <!-- Event Details -->
    <div class="space-y-3">
      <!-- Date -->
      <div class="flex items-center text-sm text-gray-700">
        <div class="flex-shrink-0 w-5 h-5 mr-3 text-indigo-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="font-medium">{format(new Date(event.start_date), 'MMM d, yyyy at h:mm a')}</span>
      </div>
      
      <!-- Location -->
      <div class="flex items-center text-sm text-gray-700">
        <div class="flex-shrink-0 w-5 h-5 mr-3 text-indigo-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span class="font-medium truncate">{event.location}</span>
      </div>
    </div>
    
    <!-- Get Tickets Button -->
    <button
      bind:this={ctaButton}
      on:click|stopPropagation={openDetails}
      class="w-full mt-6 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2 group/button cta-pulse will-change-transform"
    >
      <!-- Button Background Animation -->
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
      
      <!-- Pulse Animation -->
      <div class="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover/button:opacity-100 group-hover/button:animate-pulse"></div>
      
      <!-- Button Content -->
      <span class="relative z-10 flex items-center justify-center">
        <svg class="w-5 h-5 mr-2 transition-transform duration-300 group-hover/button:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        Get Tickets
      </span>
      
      <!-- Shimmer Effect -->
      <div class="absolute inset-0 -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
    </button>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Custom pulse animation for button */
  @keyframes gentle-pulse {
    0%, 100% {
      opacity: 0.8;
    }
    50% {
      opacity: 1;
    }
  }
  
  .group\/button:hover .group-hover\/button\:animate-pulse {
    animation: gentle-pulse 2s ease-in-out infinite;
  }
</style>

