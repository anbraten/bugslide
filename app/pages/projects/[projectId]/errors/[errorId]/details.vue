<template>
  <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
    <div
      class="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60"
    >
      <Icon name="i-lucide-braces" class="w-4 h-4 text-slate-400 dark:text-zinc-500" />
      <span class="text-xs font-medium text-slate-500 dark:text-zinc-400">Raw event data</span>
    </div>
    <pre class="bg-zinc-950 dark:bg-black text-zinc-100 text-xs font-mono p-4 overflow-x-auto whitespace-pre-wrap">{{
      JSON.stringify(errorEvent.event, null, 2)
    }}</pre>
  </div>
</template>

<script lang="ts" setup>
import type { Event, Exception } from '@sentry/core';

defineProps<{
  error: Exception;
  errorEvent: { event: Event };
}>();
</script>
