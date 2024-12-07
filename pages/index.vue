<template>
  <div class="flex flex-col items-start">
    <div class="flex mb-4 justify-between w-full items-center">
      <div>
        <h1 class="text-xl font-semibold">Projects</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage and monitor issues from your projects</p>
      </div>

      <UButton
        icon="i-heroicons-plus"
        color="primary"
        size="sm"
        label="Create project"
        to="/projects/create"
      />
    </div>

    <div class="flex gap-4 flex-wrap">
      <router-link v-for="project in projects" :to="`/projects/${project.id}`" :key="project.id" class="min-w-64">
        <UCard class="h-full">
          <span class="text-lg font-medium">{{ project.name }}</span>
        </UCard>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { data: projects } = await useFetch(`/api/projects`, {
  default: () => [],
});
</script>
