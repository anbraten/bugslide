<template>
  <div class="flex flex-col items-start">
    <h1 class="text-xl mb-4">Projects</h1>
    <div class="flex gap-4">
      <router-link v-for="project in projects" :to="`/projects/${project.id}`" :key="project.id" class="min-w-64">
        <UCard class="h-full">
          <span>{{ project.name }}</span>
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
