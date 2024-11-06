<template>
  <UCard>
    <h2 class="text-xl">Settings</h2>

    <div class="mt-4">
      <span>DSN:</span>
      <pre class="border dark:border-gray-800 rounded-md p-2 bg-gray-200 dark:bg-gray-800">{{ dsn }}</pre>
      <router-link :to="`/projects/${route.params.projectId}/setup`" class="mt-4 text-blue-600 underline"
        >Setup</router-link
      >
    </div>
  </UCard>
</template>

<script lang="ts" setup>
const route = useRoute();

const publicSecret = computed(() => 'can-be-ignored');
const dsn = computed(
  () => `${window?.location?.protocol}//${publicSecret.value}@${window?.location?.host}/${route.params.projectId}`,
);
</script>
