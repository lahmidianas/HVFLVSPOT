<script lang="ts">
  import { goto } from '$app/navigation';
  import { session } from '$lib/stores/session';
  import { supabase } from '$lib/supabase';

  // session is a writable store; use $session for reactivity.
  $: currentSession = $session;
  $: user = currentSession?.user;

  $: displayName = user
    ? user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split('@')[0] : '')
    : '';

  const logOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.error('[profile] signOut error', error.message);
    }
    try {
      Object.keys(localStorage || {}).forEach((key) => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
    } catch (e) {
      // ignore storage errors
    }
    goto('/login');
  };
</script>

<svelte:head>
  <title>Profile | HVFLVSPOT</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-10">
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Your Profile</h1>
    <p class="text-gray-600 mb-6">View your account details.</p>

    {#if user}
      <div class="space-y-4">
        <div>
          <p class="text-sm uppercase tracking-wide text-gray-500">Name</p>
          <p class="text-lg font-semibold text-gray-900">{displayName || '-'}</p>
        </div>
        <div>
          <p class="text-sm uppercase tracking-wide text-gray-500">Email</p>
          <p class="text-lg font-semibold text-gray-900">{user.email}</p>
        </div>
        <div class="pt-2">
          <button
            class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            on:click|preventDefault={logOut}
          >
            Log out
          </button>
        </div>
      </div>
    {:else}
      <div class="text-gray-700">You are not signed in.</div>
    {/if}
  </div>
</div>
