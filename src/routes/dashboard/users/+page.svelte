<script lang="ts">
  export let data;
  export let form;

  const { users = [] } = data ?? {};

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };
</script>

<svelte:head>
  <title>Users & Roles</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-10 space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-gray-900">Users & Roles</h1>
    <p class="text-gray-600">View all accounts and manage their roles.</p>
  </div>

  {#if form?.message}
    <div class={`rounded-lg border px-4 py-3 text-sm ${form?.success ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
      {form.message}
    </div>
  {/if}

  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">User</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Role</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Organizer</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Created</th>
          <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#if users.length === 0}
          <tr>
            <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-600">No users found.</td>
          </tr>
        {:else}
          {#each users as user}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div class="leading-tight">
                    <p class="text-sm font-semibold text-gray-900">{user.full_name || '—'}</p>
                    <p class="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-sm font-medium text-gray-900 capitalize">{user.role}</td>
              <td class="px-4 py-4 text-sm text-gray-800">
                {#if user.organizer_company}
                  <div class="flex flex-col gap-1">
                    <span class="inline-flex w-fit items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Organizer</span>
                    <span class="text-sm text-gray-800">{user.organizer_company}</span>
                    {#if user.organizer_verified}
                      <span class="text-xs text-green-600 font-semibold">Verified</span>
                    {/if}
                  </div>
                {:else if user.role === 'organizer'}
                  <span class="text-sm text-orange-600">Organizer (profile missing)</span>
                {:else}
                  <span class="text-sm text-gray-500">—</span>
                {/if}
              </td>
              <td class="px-4 py-4 text-sm text-gray-700">{formatDateTime(user.created_at)}</td>
              <td class="px-4 py-4 text-right">
                <form method="POST" action="?/updateRole" class="inline-flex items-center gap-2">
                  <input type="hidden" name="user_id" value={user.id} />
                  <select
                    name="role"
                    class="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={user.role}
                  >
                    <option value="user">user</option>
                    <option value="organizer">organizer</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    type="submit"
                    class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  >
                    Save
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
