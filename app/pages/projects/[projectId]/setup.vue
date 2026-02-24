<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <Icon name="i-lucide-book-open" class="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <h2 class="text-base font-semibold text-slate-900 dark:text-zinc-100">SDK Setup Guide</h2>
        </div>
      </template>

      <div>
        <p class="text-sm text-slate-500 dark:text-zinc-400 mb-4">
          Add the following to your application to start capturing errors:
        </p>
        <pre
          class="block text-xs bg-zinc-950 dark:bg-black text-zinc-100 rounded-xl p-4 overflow-x-auto font-mono leading-relaxed"
          >{{ setupCode }}</pre
        >
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const publicSecret = computed(() => 'can-be-ignored');

const setupCode = computed(() =>
  `
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: '${window?.location?.protocol}//${publicSecret.value}@${window?.location?.host}/${route.params.projectId}',
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
