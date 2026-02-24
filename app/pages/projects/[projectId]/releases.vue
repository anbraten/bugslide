<template>
  <div>
    <!-- Empty state -->
    <div
      v-if="releases.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl"
    >
      <div class="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon name="i-lucide-rocket" class="w-6 h-6 text-slate-400 dark:text-zinc-500" />
      </div>
      <h3 class="text-base font-medium text-slate-900 dark:text-zinc-100">No releases yet</h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Releases will appear here once you deploy with source maps.
      </p>
    </div>

    <!-- Releases table -->
    <div
      v-else
      class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-200 dark:border-zinc-800">
            <th class="w-10 p-3 text-left"><UCheckbox /></th>
            <th class="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Version
            </th>
            <th class="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Created
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-zinc-800">
          <tr
            v-for="release in releases"
            :key="release.id"
            class="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <td class="p-3"><UCheckbox /></td>
            <td class="p-3">
              <router-link
                :to="`/projects/${projectId}/releases/${release.id}`"
                class="font-medium text-slate-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors font-mono text-sm"
              >
                {{ release.version }}
              </router-link>
            </td>
            <td class="p-3 text-sm text-slate-500 dark:text-zinc-400">{{ timeAgo(release.createdAt) }} ago</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const projectId = computed(() => route.params.projectId);
const { data: releases } = await useFetch(() => `/api/projects/${projectId.value}/releases`, {
  default: () => [],
});
</script>
