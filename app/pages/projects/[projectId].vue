<template>
  <!-- project switcher and tabs live in the sticky app header, see layouts/default.vue -->
  <NuxtPage />
</template>

<script lang="ts" setup>
const route = useRoute();

// load the header data as part of the page, so header and page switch in the same frame
const { project, openErrors, releases } = useProjectHeader(() => String(route.params.projectId));
await Promise.all([project, openErrors, releases]);
</script>
