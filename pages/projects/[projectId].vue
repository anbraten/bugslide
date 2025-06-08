<template>
  <div class="flex flex-col">
    <div class="flex mb-4 border-b-2 border-gray-200 dark:border-gray-800 items-center">
      <router-link :to="`/projects/${projectId}`" class="text-xl font-bold flex-shrink-0">
        <h2>Project: {{ project?.name ?? '---' }}</h2>
      </router-link>

      <UHorizontalNavigation :links="links" class="ml-auto w-auto" />

      <!-- <router-link :to="`/projects/${projectId}/setup`" class="ml-auto">Setup</router-link> -->
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
    state: 'open', // Default to open errors
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
