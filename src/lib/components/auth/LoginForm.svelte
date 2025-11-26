<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  export let redirectUrl = '/';

  async function handleLogin() {
    try {
      loading = true;
      error = '';

      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (err) throw err;
      goto(redirectUrl);
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        error = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.message.includes('Email not confirmed')) {
        error = 'Please check your email and click the confirmation link before signing in.';
      } else {
        error = err.message || 'An unexpected error occurred. Please try again.';
      }
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<div class="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-3xl border border-white/20 relative overflow-hidden">
  <!-- Card Background Gradient -->
  <div class="absolute inset-0 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 opacity-60"></div>
  
  <!-- Card Content -->
  <div class="relative z-10">
    <!-- Error Alert -->
    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative" role="alert" aria-live="assertive">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium">{error}</p>
          </div>
          <button
            on:click={clearError}
            class="ml-3 text-red-400 hover:text-red-600 transition-colors duration-200"
            aria-label="Dismiss error"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    {/if}

    <form on:submit|preventDefault={handleLogin} class="space-y-6">
      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-semibold text-gray-900 mb-2">
          Email Address
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            placeholder="Enter your email"
            class="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
          />
        </div>
      </div>

      <!-- Password -->
      <div>
        <label for="password" class="block text-sm font-semibold text-gray-900 mb-2">
          Password
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            placeholder="Enter your password"
            class="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <div class="pt-2">
        <button
          type="submit"
          disabled={loading}
          class="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 overflow-hidden"
        >
          <!-- Button Background Animation -->
          <div class="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <!-- Pulse Animation -->
          <div class="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
          
          <!-- Loading Spinner -->
          {#if loading}
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          {/if}
          
          <!-- Button Content -->
          <span class="relative z-10 flex items-center {loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200">
            <svg class="w-6 h-6 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {loading ? 'Signing in...' : 'Sign In'}
          </span>
          
          <!-- Shimmer Effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  /* Custom animations for enhanced UX */
  @keyframes gentle-pulse {
    0%, 100% {
      opacity: 0.8;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.02);
    }
  }

  .group:hover .group-hover\:animate-gentle-pulse {
    animation: gentle-pulse 2s ease-in-out infinite;
  }

  /* Backdrop blur fallback for older browsers */
  @supports not (backdrop-filter: blur(12px)) {
    .backdrop-blur-sm {
      background-color: rgba(255, 255, 255, 0.9);
    }
  }

  /* Focus ring improvements */
  input:focus {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  /* Loading state improvements */
  button:disabled {
    transform: none !important;
  }
</style>