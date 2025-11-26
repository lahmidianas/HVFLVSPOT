<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { notificationApi } from '$lib/api';

  let preferences = {
    booking_enabled: true,
    payment_enabled: true,
    marketing_enabled: false,
    reminder_enabled: true,
    preferred_channel: 'email'
  };
  
  let loading = true;
  let saving = false;
  let error = null;
  let successMessage = '';

  onMount(async () => {
    await loadPreferences();
  });

  async function loadPreferences() {
    try {
      loading = true;
      error = null;
      
      preferences = await notificationApi.getPreferences();
    } catch (err) {
      // Check for authorization errors from backend
      if (err.status === 401 || err.status === 403) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
        return;
      }
      error = 'Unable to load preferences. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function savePreferences() {
    try {
      saving = true;
      error = null;
      successMessage = '';
      
      await notificationApi.updatePreferences(preferences);
      successMessage = 'Preferences saved successfully!';
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (err) {
      // Check for authorization errors from backend
      if (err.status === 401 || err.status === 403) {
        goto(`/login?redirect=${encodeURIComponent($page.url.pathname)}`);
        return;
      }
      error = 'Unable to save preferences. Please try again.';
    } finally {
      saving = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
    <p class="text-gray-600">Manage how you receive notifications about your bookings and events</p>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-gray-600">Loading preferences...</p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-md p-6">
      {#if error}
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-red-800">{error}</p>
          </div>
        </div>
      {/if}

      {#if successMessage}
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <p class="text-green-800">{successMessage}</p>
          </div>
        </div>
      {/if}

      <form on:submit|preventDefault={savePreferences} class="space-y-6">
        <!-- Notification Types -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label for="booking" class="text-sm font-medium text-gray-700">Booking Confirmations</label>
                <p class="text-sm text-gray-500">Get notified when your bookings are confirmed</p>
              </div>
              <input
                id="booking"
                type="checkbox"
                bind:checked={preferences.booking_enabled}
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label for="payment" class="text-sm font-medium text-gray-700">Payment Updates</label>
                <p class="text-sm text-gray-500">Get notified about payment confirmations and refunds</p>
              </div>
              <input
                id="payment"
                type="checkbox"
                bind:checked={preferences.payment_enabled}
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label for="marketing" class="text-sm font-medium text-gray-700">Marketing & Promotions</label>
                <p class="text-sm text-gray-500">Receive updates about new events and special offers</p>
              </div>
              <input
                id="marketing"
                type="checkbox"
                bind:checked={preferences.marketing_enabled}
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label for="reminder" class="text-sm font-medium text-gray-700">Event Reminders</label>
                <p class="text-sm text-gray-500">Get reminded about upcoming events you're attending</p>
              </div>
              <input
                id="reminder"
                type="checkbox"
                bind:checked={preferences.reminder_enabled}
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <!-- Preferred Channel -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-4">Preferred Channel</h3>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="radio"
                bind:group={preferences.preferred_channel}
                value="email"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">Email</span>
            </label>
            
            <label class="flex items-center">
              <input
                type="radio"
                bind:group={preferences.preferred_channel}
                value="push"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">Push Notifications</span>
            </label>
            
            <label class="flex items-center">
              <input
                type="radio"
                bind:group={preferences.preferred_channel}
                value="sms"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">SMS</span>
            </label>
          </div>
        </div>

        <!-- Save Button -->
        <div class="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>