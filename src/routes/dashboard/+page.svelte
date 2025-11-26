<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import UserTickets from '$lib/components/user/UserTickets.svelte';
  import NotificationSettings from '$lib/components/user/NotificationSettings.svelte';
  import EventManagement from '$lib/components/organizer/EventManagement.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let activeTab = 'tickets';
  let userRole = 'User';

  onMount(async () => {
    // Redirect if not authenticated
    if (!data.session) {
      goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
      return;
    }

    // Get user role from our users table (reference data, can read directly)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.session.user.id)
        .single();
      
      if (userData) {
        userRole = userData.role;
      }
    } catch (err) {
      console.error('Failed to get user role:', err);
      // If we can't get user role, it might be an auth issue
      if (err.message?.includes('JWT') || err.message?.includes('expired')) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
        return;
      }
    }
  });

  function setActiveTab(tab: string) {
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>Dashboard - HVFLVSPOT</title>
</svelte:head>

{#if data.session}
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Dashboard Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p class="text-gray-600">Welcome back, {data.session.user.email}</p>
    </div>

    <!-- Tab Navigation -->
    <div class="border-b border-gray-200 mb-8">
      <nav class="-mb-px flex space-x-8">
        <button
          on:click={() => setActiveTab('tickets')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'tickets' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          My Tickets
        </button>
        
        <button
          on:click={() => setActiveTab('settings')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Notification Settings
        </button>

        {#if userRole === 'Organizer'}
          <button
            on:click={() => setActiveTab('events')}
            class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'events' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            Manage Events
          </button>
        {/if}
      </nav>
    </div>

    <!-- Tab Content -->
    <div>
      {#if activeTab === 'tickets'}
        <UserTickets />
      {:else if activeTab === 'settings'}
        <NotificationSettings />
      {:else if activeTab === 'events' && userRole === 'Organizer'}
        <EventManagement />
      {/if}
    </div>
  </div>
{:else}
  <div class="text-center py-12">
    <p class="text-gray-600">Please log in to access your dashboard.</p>
    <a href="/login" class="text-indigo-600 hover:text-indigo-500">Go to Login</a>
  </div>
{/if}