<template>
  <div>
    <!-- Project header (hidden on error detail pages which have their own breadcrumb) -->
    <div v-if="!route.params.errorId" class="mb-6">
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 mb-2">
        <router-link to="/" class="hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >Projects</router-link
        >
        <Icon name="i-lucide-chevron-right" class="w-3.5 h-3.5" />
        <span class="text-slate-900 dark:text-zinc-100 font-medium">{{ project?.name ?? '...' }}</span>
      </div>

      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-zinc-100">{{ project?.name ?? '...' }}</h1>
        <UHorizontalNavigation :links="links" />
      </div>
    </div>

    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const projectId = computed(() => route.params.projectId);
const { data: project } = await useFetch(() => `/api/projects/${projectId.value}`);

const { data: errors } = await useFetch(() => `/api/projects/${projectId.value}/errors`, {
  query: {
    state: 'open',
  },
  default: () => [],
});

const links = computed(() => [
  {
    label: 'Errors',
    icon: 'i-lucide-flame',
    to: `/projects/${projectId.value}`,
    exact: true,
    badge: errors.value.length ?? 0,
  },
  {
    label: 'Releases',
    icon: 'i-lucide-rocket',
    to: `/projects/${projectId.value}/releases`,
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: `/projects/${projectId.value}/settings`,
  },
]);
</script>
