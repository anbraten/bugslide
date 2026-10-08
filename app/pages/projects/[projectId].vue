<template>
  <div>
    <!-- Project header (hidden on detail pages which have their own breadcrumb) -->
    <div v-if="showHeader" class="mb-6">
      <div class="flex items-center gap-2 text-base text-slate-500 dark:text-zinc-400 mb-2">
        <router-link to="/" class="hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >Projects</router-link
        >
        <Icon name="i-lucide-chevron-right" class="w-3.5 h-3.5" />
        <span class="text-slate-900 dark:text-zinc-100 font-medium">{{ project?.name ?? '...' }}</span>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-100 wrap-break-word">
          {{ project?.name ?? '...' }}
        </h1>
        <UHorizontalNavigation :links="links" class="overflow-x-auto" />
      </div>
    </div>

    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const projectId = computed(() => route.params.projectId);

// The route changes before the child page has finished loading, so toggling the header
// directly on route params would make the old child page jump. Wait until the new page renders.
const isDetailPage = () => !!(route.params.errorId || route.params.releaseId);
const showHeader = ref(!isDetailPage());
onScopeDispose(
  useNuxtApp().hook('page:finish', () => {
    showHeader.value = !isDetailPage();
  }),
);
const { data: project } = await useFetch(() => `/api/projects/${projectId.value}`);

const { data: errors } = await useFetch(() => `/api/projects/${projectId.value}/errors`, {
  query: {
    state: 'open',
    limit: 1,
  },
  default: () => ({ total: 0 }),
});

const { data: releases } = await useFetch(() => `/api/projects/${projectId.value}/releases`, {
  default: () => [],
});

const links = computed(() => [
  {
    label: 'Errors',
    icon: 'i-lucide-flame',
    to: `/projects/${projectId.value}`,
    exact: true,
    badge: errors.value?.total ?? 0,
  },
  {
    label: 'Releases',
    icon: 'i-lucide-rocket',
    to: `/projects/${projectId.value}/releases`,
    badge: releases.value?.length ?? 0,
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: `/projects/${projectId.value}/settings`,
  },
]);
</script>
