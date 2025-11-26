<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { addPageTransition, addCTAPulse } from '$lib/utils/animations';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let fullName = '';
  let loading = false;
  let error = '';
  let isSignUp = false;

  $: redirectUrl = $page.url.searchParams.get('redirect') || '/';

  let authCard: HTMLElement;
  let submitButton: HTMLElement;

  onMount(() => {
    // Add page transition
    if (authCard) {
      addPageTransition(authCard);
    }
    
    // Add CTA pulse to submit button
    if (submitButton) {
      addCTAPulse(submitButton);
    }
  });

  async function handleSubmit() {
    try {
      loading = true;
      error = '';

      // Basic validation
      if (!email || !password) {
        throw new Error('Please fill in all required fields');
      }

      if (isSignUp) {
        // Sign up validation
        if (!fullName) {
          throw new Error('Please enter your full name');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Sign up with Supabase
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'User'
            }
          }
        });

        if (signUpError) throw signUpError;

        // Show success message for sign up
        error = '';
        alert('Account created successfully! Please check your email to verify your account.');
        
        // Switch to sign in mode
        isSignUp = false;
        password = '';
        confirmPassword = '';
      } else {
        // Sign in with Supabase
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        // Redirect on successful login
        goto(redirectUrl);
      }
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        error = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.message.includes('Email not confirmed')) {
        error = 'Please check your email and click the confirmation link before signing in.';
      } else if (err.message.includes('User already registered')) {
        error = 'An account with this email already exists. Please sign in instead.';
      } else {
        error = err.message || 'An unexpected error occurred. Please try again.';
      }
    } finally {
      loading = false;
    }
  }

  function toggleMode() {
    isSignUp = !isSignUp;
    error = '';
    password = '';
    confirmPassword = '';
    fullName = '';
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>{isSignUp ? 'Sign Up' : 'Sign In'} - HVFLVSPOT</title>
  <meta name="description" content={isSignUp ? 'Create your HVFLVSPOT account' : 'Sign in to your HVFLVSPOT account'} />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 page-transition">
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none animate-fade-in">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
  </div>

  <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
    <!-- Logo and Header -->
    <div class="text-center mb-8 animate-slide-in-left">
      <a href="/" class="inline-block group">
        <h1 class="text-4xl font-black text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text group-hover:scale-105 transition-transform duration-300">
          HVFLVSPOT
        </h1>
      </a>
      <h2 class="mt-6 text-3xl font-bold text-gray-900">
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        {isSignUp 
          ? 'Join thousands of event-goers discovering amazing experiences' 
          : 'Sign in to your account to continue'
        }
      </p>
    </div>

    <!-- Auth Card -->
    <div 
      bind:this={authCard}
      class="bg-white/80 backdrop-blur-sm py-10 px-8 shadow-2xl sm:rounded-3xl border border-white/20 relative overflow-hidden animate-fade-in-up"
    >
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

        <!-- Auth Form -->
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Full Name (Sign Up Only) -->
          {#if isSignUp}
            <div>
              <label for="fullName" class="block text-sm font-semibold text-gray-900 mb-2">
                Full Name *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autocomplete="name"
                  required={isSignUp}
                  bind:value={fullName}
                  placeholder="Enter your full name"
                  aria-describedby="fullName-help"
                  class="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
                />
                <div id="fullName-help" class="sr-only">Enter your full name for account creation</div>
              </div>
            </div>
          {/if}

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-900 mb-2">
              Email Address *
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                bind:value={email}
                placeholder="Enter your email address"
                aria-describedby="email-help"
                class="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
              />
              <div id="email-help" class="sr-only">Enter your email address to {isSignUp ? 'create an account' : 'sign in'}</div>
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-900 mb-2">
              Password *
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete={isSignUp ? 'new-password' : 'current-password'}
                required
                bind:value={password}
                placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
                aria-describedby="password-help"
                class="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
              />
              <div id="password-help" class="sr-only">
                {isSignUp ? 'Create a password with at least 6 characters' : 'Enter your account password'}
              </div>
            </div>
            {#if isSignUp}
              <p class="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
            {/if}
          </div>

          <!-- Confirm Password (Sign Up Only) -->
          {#if isSignUp}
            <div>
              <label for="confirmPassword" class="block text-sm font-semibold text-gray-900 mb-2">
                Confirm Password *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  required={isSignUp}
                  bind:value={confirmPassword}
                  placeholder="Confirm your password"
                  aria-describedby="confirmPassword-help"
                  class="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
                />
                <div id="confirmPassword-help" class="sr-only">Re-enter your password to confirm</div>
              </div>
            </div>
          {/if}

          <!-- Submit Button -->
          <div class="pt-2">
            <button
              bind:this={submitButton}
              type="submit"
              disabled={loading}
              class="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 overflow-hidden cta-pulse will-change-transform"
              aria-describedby="submit-help"
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
                  {#if isSignUp}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  {:else}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  {/if}
                </svg>
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </span>
              
              <!-- Shimmer Effect -->
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
            <div id="submit-help" class="sr-only">
              {loading ? 'Please wait while we process your request' : `Click to ${isSignUp ? 'create your account' : 'sign in to your account'}`}
            </div>
          </div>
        </form>

        <!-- Mode Toggle -->
        <div class="mt-8 text-center">
          <p class="text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              on:click={toggleMode}
              class="ml-1 font-semibold text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-1 transition-colors duration-200"
            >
              {isSignUp ? 'Sign in here' : 'Sign up here'}
            </button>
          </p>
        </div>

        <!-- Additional Links -->
        <div class="mt-6 text-center space-y-2">
          <a
            href="/"
            class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Homepage
          </a>
        </div>
      </div>
    </div>
  </div>
</main>

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