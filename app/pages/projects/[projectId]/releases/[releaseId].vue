<template>
  <div>
    <div
      v-if="!release"
      class="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl"
    >
      <Icon name="i-lucide-search-x" class="w-6 h-6 text-slate-400 mb-3" />
      <h3 class="text-base font-medium text-slate-900 dark:text-zinc-100">
        {{ !fetchError || fetchError.statusCode === 404 ? 'Release not found' : 'Failed to load release' }}
      </h3>
      <p v-if="fetchError && fetchError.statusCode !== 404" class="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {{ fetchError.statusMessage || fetchError.message }}
      </p>
      <UButton label="Back to releases" variant="soft" size="sm" class="mt-4" :to="`/projects/${projectId}/releases`" />
    </div>

    <div v-else class="flex flex-col gap-5">
      <header class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div class="p-4 sm:p-5 flex items-start gap-4">
          <div
            class="w-11 h-11 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0"
          >
            <Icon name="i-lucide-rocket" class="w-5 h-5 text-orange-500" />
          </div>
          <div class="min-w-0">
            <h1
              class="mt-0.5 text-xl sm:text-2xl font-bold leading-snug font-mono text-slate-900 dark:text-zinc-100 break-all"
            >
              {{ release.version }}
            </h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              <UTooltip :text="formatAbsolute(release.createdAt)">
                <span class="cursor-default">Created {{ timeAgo(release.createdAt) }} ago</span>
              </UTooltip>
              <template v-if="release.stats.firstEvent">
                <span class="text-slate-300 dark:text-zinc-600 mx-1.5">·</span>
                <UTooltip :text="formatAbsolute(release.stats.firstEvent)">
                  <span class="cursor-default">first event {{ timeAgo(release.stats.firstEvent) }} ago</span>
                </UTooltip>
              </template>
            </p>
          </div>
        </div>
      </header>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
        <div class="flex flex-col gap-5 min-w-0">
          <ErrorSection title="Errors" icon="i-lucide-flame" :count="release.stats.errors" flush>
            <p v-if="!release.errors.length" class="p-4 sm:p-5 text-sm text-slate-500 dark:text-zinc-400">
              No errors reported for this release.
            </p>
            <div v-else class="divide-y divide-slate-100 dark:divide-zinc-800">
              <!-- jump straight to the newest event of this release -->
              <NuxtLink
                v-for="error in release.errors"
                :key="error.id"
                :to="`/projects/${projectId}/errors/${error.id}?event=${error.latestEventId}`"
                class="group flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="font-semibold text-sm text-slate-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate"
                    >
                      {{ error.value || error.title }}
                    </span>
                    <UTooltip v-if="error.isNew" text="First seen in this release">
                      <UBadge color="orange" variant="subtle" size="xs" class="shrink-0">New</UBadge>
                    </UTooltip>
                  </div>
                  <div
                    class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-zinc-400"
                  >
                    <ErrorState :error />
                    <span class="font-mono font-semibold text-slate-600 dark:text-zinc-300 truncate max-w-64">
                      {{ error.title }}
                    </span>
                    <UTooltip :text="formatAbsolute(error.lastSeen)">
                      <span class="cursor-default">last seen {{ timeAgo(error.lastSeen) }} ago</span>
                    </UTooltip>
                  </div>
                </div>

                <div class="shrink-0 text-right w-16">
                  <div class="text-lg font-bold text-slate-800 dark:text-zinc-200 tabular-nums leading-none">
                    {{ error.events.toLocaleString() }}
                  </div>
                  <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    event{{ error.events !== 1 ? 's' : '' }}
                  </div>
                </div>

                <Icon
                  name="i-lucide-chevron-right"
                  class="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-orange-400 transition-colors shrink-0"
                />
              </NuxtLink>
            </div>
          </ErrorSection>

          <ErrorSection title="Artifacts" icon="i-lucide-file-code" :count="release.files.length" flush>
            <p v-if="!release.files.length" class="p-4 sm:p-5 text-sm text-slate-500 dark:text-zinc-400">
              No source maps or bundles uploaded for this release.
            </p>
            <ul v-else class="divide-y divide-slate-100 dark:divide-zinc-800 max-h-96 overflow-y-auto">
              <li v-for="file in release.files" :key="file.id" class="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                <Icon
                  :name="file.type === 'source_map' ? 'i-lucide-map' : 'i-lucide-file-code'"
                  class="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0"
                />
                <span
                  class="flex-1 min-w-0 truncate font-mono text-sm text-slate-700 dark:text-zinc-300"
                  :title="file.filePath"
                >
                  {{ file.filePath }}
                </span>
                <span class="text-xs text-slate-400 dark:text-zinc-500 shrink-0">{{ file.type }}</span>
              </li>
            </ul>
          </ErrorSection>
        </div>

        <aside class="flex flex-col gap-5 min-w-0">
          <SidebarStats>
            <SidebarStat label="Events" icon="i-lucide-activity">
              {{ release.stats.events.toLocaleString() }}
            </SidebarStat>
            <SidebarStat label="Errors" icon="i-lucide-flame">
              {{ release.stats.errors.toLocaleString() }}
              <template v-if="release.stats.newErrors > 0" #sub>
                <span class="font-medium text-orange-600 dark:text-orange-400">
                  {{ release.stats.newErrors.toLocaleString() }} new
                </span>
              </template>
            </SidebarStat>
            <SidebarStat label="Artifacts" icon="i-lucide-file-code">
              {{ release.files.length.toLocaleString() }}
            </SidebarStat>
            <SidebarStat label="Last event" icon="i-lucide-refresh-cw">
              <UTooltip v-if="release.stats.lastEvent" :text="formatAbsolute(release.stats.lastEvent)">
                <span class="cursor-default">{{ timeAgo(release.stats.lastEvent) }} ago</span>
              </UTooltip>
              <span v-else class="text-slate-400 dark:text-zinc-500">—</span>
            </SidebarStat>
          </SidebarStats>

          <ErrorSection title="Last 30 days" icon="i-lucide-chart-column">
            <template #actions>
              <span class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                {{ events30d.toLocaleString() }} event{{ events30d !== 1 ? 's' : '' }}
              </span>
            </template>
            <ActivityChart :data="release.activity" />
          </ErrorSection>
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const projectId = computed(() => route.params.projectId as string);
const version = computed(() => route.params.releaseId as string);
const { data: release, error: fetchError } = await useFetch(
  () => `/api/projects/${projectId.value}/releases/${encodeURIComponent(version.value)}`,
);

const events30d = computed(() => release.value?.activity.reduce((sum, d) => sum + d.count, 0) ?? 0);

useSeoMeta({
  title: () => `Release ${version.value}`,
});
</script>
