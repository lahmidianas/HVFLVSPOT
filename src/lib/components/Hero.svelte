<script lang="ts">
  import { onMount } from 'svelte';
  import { addPageTransition, addCTAPulse } from '$lib/utils/animations';

  let heroElement: HTMLElement;
  let primaryCTA: HTMLElement;
  let secondaryCTA: HTMLElement;

  onMount(() => {
    // Add page transition effect
    if (heroElement) {
      addPageTransition(heroElement);
    }
    
    // Add CTA pulse effects
    if (primaryCTA) {
      addCTAPulse(primaryCTA);
    }
    if (secondaryCTA) {
      addCTAPulse(secondaryCTA);
    }
  });
</script>

<div 
  bind:this={heroElement}
  class="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 page-transition"
>
  <!-- Animated Background Elements -->
  <div class="absolute inset-0">
    <!-- Floating Orbs -->
    <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
    
    <!-- Grid Pattern -->
    <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
  </div>

  <!-- Main Content -->
  <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div class="max-w-4xl mx-auto">
      <!-- Badge -->
      <div class="mb-8 inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
        <svg class="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span class="text-white font-medium text-sm tracking-wide">Discover Amazing Events</span>
      </div>

      <!-- Main Headline -->
      <h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-8 leading-tight tracking-tight animate-slide-in-left">
        Find Your Next
        <span class="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent animate-gentle-pulse">
          Adventure
        </span>
      </h1>

      <!-- Subtext -->
      <p class="text-xl sm:text-2xl lg:text-3xl text-white/90 mb-12 leading-relaxed font-light max-w-3xl mx-auto animate-slide-in-right">
        Discover and book tickets for the best concerts, festivals, and parties near you. 
        <span class="font-medium text-white">Your perfect event is just a click away.</span>
      </p>

      <!-- Call-to-Action Button -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up">
        <a
          bind:this={primaryCTA}
          href="/events"
          class="group relative inline-flex items-center px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 ease-out transform hover:scale-110 hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-4 focus:ring-offset-transparent overflow-hidden cta-pulse will-change-transform"
        >
          <!-- Animated Background -->
          <div class="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <!-- Pulse Ring -->
          <div class="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
          
          <!-- Shimmer Effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <!-- Button Content -->
          <span class="relative z-10 flex items-center">
            <svg class="w-7 h-7 mr-3 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Events
          </span>
        </a>

        <!-- Secondary CTA -->
        <a
          bind:this={secondaryCTA}
          href="/about"
          class="group inline-flex items-center px-8 py-4 text-lg font-semibold text-white/90 hover:text-white border-2 border-white/30 hover:border-white/60 rounded-xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent cta-pulse will-change-transform"
        >
          Learn More
          <svg class="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>

      <!-- Feature Highlights -->
      <div class="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in-up">
        <div class="text-center group">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110 will-change-transform">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Verified Events</h3>
          <p class="text-white/80 text-sm">All events are verified and secure</p>
        </div>

        <div class="text-center group">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110 will-change-transform">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Instant Booking</h3>
          <p class="text-white/80 text-sm">Book tickets instantly with secure payment</p>
        </div>

        <div class="text-center group">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110 will-change-transform">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Personalized</h3>
          <p class="text-white/80 text-sm">Get recommendations based on your interests</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Scroll Indicator -->
  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
    <div class="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
      <div class="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
    </div>
  </div>
</div>

<style>
  /* Custom animations */
  @keyframes gentle-pulse {
    0%, 100% {
      opacity: 0.8;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }

  .group:hover .group-hover\:animate-gentle-pulse {
    animation: gentle-pulse 2s ease-in-out infinite;
  }

  /* Gradient text animation */
  @keyframes gradient-shift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 3s ease-in-out infinite;
  }
</style>