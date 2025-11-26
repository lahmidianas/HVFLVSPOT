<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirect to events page with search parameters preserved
    const searchParams = $page.url.searchParams.toString();
    const redirectUrl = searchParams ? `/events?${searchParams}` : '/events';
    goto(redirectUrl, { replaceState: true });
  });
</script>

<svelte:head>
  <title>Search Events - HVFLVSPOT</title>
  <meta name="description" content="Search for amazing events near you" />
</svelte:head>

<main class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div class="text-center">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
    <p class="text-gray-600">Redirecting to search...</p>
  </div>
</main>