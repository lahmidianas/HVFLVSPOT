<script lang="ts">
  import { onMount } from 'svelte';
  import { addPageTransition } from '$lib/utils/animations';
  import { initSession } from '$lib/stores/session';
  import '../app.postcss';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let mainElement: HTMLElement;

  onMount(() => {
    // Add page transition effect to main content
    if (mainElement) {
      addPageTransition(mainElement);
    }

    // Seed the shared session store with layout data (keeps header/profile in sync)
    initSession(data.session ?? null);
  });
</script>

<div class="min-h-screen bg-gray-50 page-transition">
  <Header data={data} />
  <main bind:this={mainElement} class="will-change-opacity">
    <slot />
  </main>
  <Footer />
</div>
