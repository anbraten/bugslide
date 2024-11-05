<template>
  <UCard>
    <h2 class="text-xl">Setup</h2>

    <pre class="border dark:border-gray-800 rounded-md p-2 bg-gray-200 dark:bg-gray-800 mt-4">{{ setupCode }}</pre>
  </UCard>
</template>

<script lang="ts" setup>
const route = useRoute();

const secret = computed(() => 'can-be-ignored');

const setupCode = computed(() =>
  `
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: '${window?.location?.protocol}//${secret.value}@${window?.location?.host}/${route.params.projectId}',
  environment: 'development',
  release: 'commit:abcdefg12345',
  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration({
      levels: ['error'],
    }),
  ],

  logErrors: true,
});

Sentry.captureMessage('Hello, world!');
`.trim(),
);
</script>
