<template>
  <div class="flex flex-col">
    <div class="flex mb-4">
      <router-link :to="`/projects/${projectId}`" class="text-xl">
        <h2>Project: {{ project?.name ?? '---' }}</h2>
      </router-link>

      <!-- <router-link :to="`/projects/${projectId}/setup`" class="ml-auto">Setup</router-link> -->
    </div>

    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const projectId = computed(() => route.params.projectId);
const { data: project } = await useFetch(() => `/api/${projectId.value}`);
</script>
