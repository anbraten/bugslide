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
            <th class="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Version
            </th>
            <th class="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Created
            </th>
            <th
              class="hidden sm:table-cell p-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400"
            >
              Issues
            </th>
            <th
              class="hidden sm:table-cell p-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400"
            >
              Events
            </th>
            <th
              class="hidden md:table-cell p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400"
            >
              Last 14 days
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-zinc-800">
          <tr
            v-for="(release, i) in releases"
            :key="release.id"
            class="group relative hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <td class="p-3 min-w-0">
              <router-link
                :to="`/projects/${projectId}/releases/${encodeURIComponent(release.version)}`"
                class="font-medium text-slate-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors font-mono text-sm break-all after:absolute after:inset-0"
              >
                {{ release.version }}
              </router-link>
              <span
                v-if="i === 0"
                class="ml-2 align-middle text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
              >
                Latest
              </span>
              <p class="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">
                <Icon name="i-lucide-file-code" class="w-3 h-3 align-[-2px]" />
                {{ release.files }} {{ release.files === 1 ? 'file' : 'files' }}
              </p>
            </td>
            <td class="p-3 text-sm text-slate-500 dark:text-zinc-400 whitespace-nowrap">
              <UTooltip :text="formatAbsolute(release.createdAt)">
                <span class="cursor-default">{{ timeAgo(release.createdAt) }} ago</span>
              </UTooltip>
            </td>
            <td class="hidden sm:table-cell p-3 text-right text-sm whitespace-nowrap">
              <span class="tabular-nums text-slate-900 dark:text-zinc-100">{{ release.errors }}</span>
              <span
                v-if="release.newErrors > 0"
                class="ml-1.5 text-xs font-medium text-orange-600 dark:text-orange-400"
              >
                {{ release.newErrors }} new
              </span>
            </td>
            <td class="hidden sm:table-cell p-3 text-right text-sm tabular-nums whitespace-nowrap">
              <UTooltip v-if="release.lastEvent" :text="`Last event ${formatAbsolute(release.lastEvent)}`">
                <span class="cursor-default text-slate-900 dark:text-zinc-100">{{ release.events }}</span>
              </UTooltip>
              <span v-else class="text-slate-400 dark:text-zinc-500">–</span>
            </td>
            <td class="hidden md:table-cell p-3">
              <Sparkline :data="release.trend" class="w-28 h-7" />
            </td>
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
