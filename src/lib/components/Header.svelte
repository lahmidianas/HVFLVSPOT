<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  import { initSession, sessionStore } from '$lib/stores/session';
  import type { Session } from '@supabase/supabase-js';

  type HeaderData = { session: Session | null };
  export let data: HeaderData;

  let mobileMenuOpen = false;
  let displayName = '';
  let avatarInitial = 'U';
  let currentSession: Session | null = data?.session ?? null;
  let unsubscribeSession: (() => void) | undefined;
  let isAdmin = false;
  let isOrganizer = false;

  onMount(() => {
    initSession(data?.session ?? null);
    unsubscribeSession = sessionStore.subscribe(async (value) => {
      currentSession = value;
      await refreshRole();
    });
  });

  onDestroy(() => {
    if (unsubscribeSession) unsubscribeSession();
  });

  $: {
    const user = currentSession?.user;
    displayName = user
      ? (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.email ? user.email.split('@')[0] : '')
      : '';
    avatarInitial = displayName ? displayName.trim()[0]?.toUpperCase() : 'U';
  }

  async function refreshRole() {
    if (!currentSession?.user?.id) {
      isAdmin = false;
      isOrganizer = false;
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentSession.user.id)
      .single();
    const role = data?.role ?? null;
    isAdmin = role === 'admin';
    isOrganizer = role === 'organizer';
  }

  async function signOut() {
    await supabase.auth.signOut();
    currentSession = null;
    window.location.href = '/';
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function isActiveRoute(path: string): boolean {
    return $page.url?.pathname === path || false;
  }
</script>

<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
  <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
    <div class="flex h-16 items-center justify-between">
      <div class="flex items-center lg:hidden">
        <button
          type="button"
          on:click={toggleMobileMenu}
          class="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-controls="mobile-menu"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span class="sr-only">Open main menu</span>
          {#if !mobileMenuOpen}
            <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          {:else}
            <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {/if}
        </button>
      </div>

      <div class="flex-1 flex justify-center lg:justify-center">
        <a
          href="/"
          class="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
          aria-label="HVFLVSPOT homepage"
        >
          HVFLVSPOT
        </a>
      </div>

      <div class="hidden lg:flex lg:items-center lg:space-x-8">
        <a
          href="/"
          class="nav-link {isActiveRoute('/') ? 'nav-link-active' : ''}"
          aria-current={isActiveRoute('/') ? 'page' : undefined}
        >
          Home
        </a>
        <a
          href="/events"
          class="nav-link {isActiveRoute('/events') ? 'nav-link-active' : ''}"
          aria-current={isActiveRoute('/events') ? 'page' : undefined}
        >
          All Events
        </a>
        <a
          href="/search"
          class="nav-link {isActiveRoute('/search') ? 'nav-link-active' : ''}"
          aria-current={isActiveRoute('/search') ? 'page' : undefined}
        >
          Search
        </a>
        <a
          href="/wallet"
          class="nav-link {isActiveRoute('/wallet') ? 'nav-link-active' : ''}"
          aria-current={isActiveRoute('/wallet') ? 'page' : undefined}
        >
          Tickets
        </a>
        {#if isOrganizer}
          <a
            href="/organizer"
            class="nav-link {isActiveRoute('/organizer') ? 'nav-link-active' : ''}"
            aria-current={isActiveRoute('/organizer') ? 'page' : undefined}
          >
            My Events
          </a>
        {/if}
        {#if isAdmin}
          <a
            href="/dashboard"
            class="nav-link {isActiveRoute('/dashboard') ? 'nav-link-active' : ''}"
            aria-current={isActiveRoute('/dashboard') ? 'page' : undefined}
          >
            Dashboard
          </a>
          <a
            href="/dashboard/users"
            class="nav-link {isActiveRoute('/dashboard/users') ? 'nav-link-active' : ''}"
            aria-current={isActiveRoute('/dashboard/users') ? 'page' : undefined}
          >
            Users
          </a>
        {/if}
      </div>

      <div class="flex items-center space-x-4">
        {#if currentSession?.user}
          <a
            href="/profile"
            class="hidden lg:inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
              {avatarInitial}
            </span>
            <span class="max-w-[140px] truncate">{displayName || 'Profile'}</span>
          </a>
        {:else}
          <a
            href="/login"
            class="hidden lg:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Sign Up
          </a>
        {/if}
      </div>
    </div>

    {#if mobileMenuOpen}
      <div class="lg:hidden" id="mobile-menu">
        <div class="space-y-1 pb-3 pt-2 border-t border-gray-200 bg-white">
          <a
            href="/"
            on:click={closeMobileMenu}
            class="mobile-nav-link {isActiveRoute('/') ? 'mobile-nav-link-active' : ''}"
            aria-current={isActiveRoute('/') ? 'page' : undefined}
          >
            Home
          </a>
          <a
            href="/events"
            on:click={closeMobileMenu}
            class="mobile-nav-link {isActiveRoute('/events') ? 'mobile-nav-link-active' : ''}"
            aria-current={isActiveRoute('/events') ? 'page' : undefined}
          >
            All Events
          </a>
          <a
            href="/search"
            on:click={closeMobileMenu}
            class="mobile-nav-link {isActiveRoute('/search') ? 'mobile-nav-link-active' : ''}"
            aria-current={isActiveRoute('/search') ? 'page' : undefined}
          >
            Search
          </a>
          <a
            href="/wallet"
            on:click={closeMobileMenu}
            class="mobile-nav-link {isActiveRoute('/wallet') ? 'mobile-nav-link-active' : ''}"
            aria-current={isActiveRoute('/wallet') ? 'page' : undefined}
          >
            Tickets
          </a>

          {#if isOrganizer}
            <a
              href="/organizer"
              on:click={closeMobileMenu}
              class="mobile-nav-link {isActiveRoute('/organizer') ? 'mobile-nav-link-active' : ''}"
              aria-current={isActiveRoute('/organizer') ? 'page' : undefined}
            >
              My Events
            </a>
          {/if}

          {#if isAdmin}
            <a
              href="/dashboard"
              on:click={closeMobileMenu}
              class="mobile-nav-link {isActiveRoute('/dashboard') ? 'mobile-nav-link-active' : ''}"
              aria-current={isActiveRoute('/dashboard') ? 'page' : undefined}
            >
              Dashboard
            </a>
            <a
              href="/dashboard/users"
              on:click={closeMobileMenu}
              class="mobile-nav-link {isActiveRoute('/dashboard/users') ? 'mobile-nav-link-active' : ''}"
              aria-current={isActiveRoute('/dashboard/users') ? 'page' : undefined}
            >
              Users
            </a>
          {/if}

          {#if currentSession?.user}
            <div class="border-t border-gray-200 pt-4 pb-3">
              <div class="px-2">
                <a
                  href="/profile"
                  on:click={closeMobileMenu}
                  class="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                    {avatarInitial}
                  </span>
                  <span class="truncate">{displayName || 'Profile'}</span>
                </a>
              </div>
              <div class="mt-3 px-2">
                <button
                  on:click={signOut}
                  class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          {:else}
            <div class="border-t border-gray-200 pt-4 pb-3">
              <div class="px-2">
                <a
                  href="/login"
                  on:click={closeMobileMenu}
                  class="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                >
                  Sign Up
                </a>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </nav>
</header>

<style>
  .nav-link {
    @apply relative text-base font-medium text-gray-600 transition-all duration-300 ease-out;
    @apply hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-3 py-2;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #4f46e5, #7c3aed);
    transition: all 0.3s ease-out;
    transform: translateX(-50%);
  }

  .nav-link:hover::after {
    width: 100%;
  }

  .nav-link-active {
    @apply text-indigo-600;
  }

  .nav-link-active::after {
    width: 100%;
  }

  .mobile-nav-link {
    @apply block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50;
    @apply transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2;
  }

  .mobile-nav-link-active {
    @apply text-indigo-600 bg-indigo-50;
  }

  @supports not (backdrop-filter: blur(12px)) {
    header {
      background-color: white;
    }
  }
</style>
