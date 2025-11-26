<script lang="ts">
  import { onMount } from 'svelte';
  import { addPageTransition } from '$lib/utils/animations';
  import '../app.postcss';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { supabase } from '$lib/supabase';
  import type { PageData } from './$types';

  export let data: PageData;

  let mainElement: HTMLElement;

  onMount(() => {
    // Add page transition effect to main content
    if (mainElement) {
      addPageTransition(mainElement);
    }
  });
</script>

<div class="min-h-screen bg-gray-50 page-transition">
  <Header session={data.session} />
  <main bind:this={mainElement} class="will-change-opacity">
    <slot />
  </main>
  <Footer />
</div>