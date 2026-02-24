<template>
  <div class="flex flex-col gap-0">
    <div
      v-for="breadcrumb in errorEvent.event.breadcrumbs"
      :key="breadcrumb.timestamp"
      class="relative flex gap-4 pl-8 pb-4 last:pb-0"
    >
      <!-- Timeline line -->
      <div class="absolute left-3.5 top-8 bottom-0 w-px bg-slate-200 dark:bg-zinc-800 last:hidden" />

      <!-- Icon dot -->
      <div
        class="absolute left-0 top-1 flex-shrink-0 w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center"
        :class="{
          'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400': getColor(breadcrumb) === 'red',
          'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400':
            getColor(breadcrumb) === 'green',
          'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400': getColor(breadcrumb) === 'blue',
          'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400': getColor(breadcrumb) === 'gray',
        }"
      >
        <Icon v-if="breadcrumb.category === 'sentry.event'" name="i-lucide-flame" class="w-3.5 h-3.5" />
        <Icon v-else-if="breadcrumb.category === 'navigation'" name="i-lucide-map-pin" class="w-3.5 h-3.5" />
        <Icon v-else-if="breadcrumb.category === 'ui.click'" name="i-lucide-mouse-pointer" class="w-3.5 h-3.5" />
        <Icon v-else-if="breadcrumb.category === 'fetch'" name="i-lucide-arrow-right-left" class="w-3.5 h-3.5" />
        <Icon v-else-if="breadcrumb.category === 'console'" name="i-lucide-terminal" class="w-3.5 h-3.5" />
        <Icon v-else name="i-lucide-circle-dot" class="w-3.5 h-3.5" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 pt-0.5">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span
            class="text-sm font-semibold"
            :class="{
              'text-red-700 dark:text-red-400': getColor(breadcrumb) === 'red',
              'text-emerald-700 dark:text-emerald-400': getColor(breadcrumb) === 'green',
              'text-blue-700 dark:text-blue-400': getColor(breadcrumb) === 'blue',
              'text-slate-600 dark:text-zinc-400': getColor(breadcrumb) === 'gray',
            }"
          >
            {{ getCategory(breadcrumb) }}
          </span>

          <UBadge
            v-if="breadcrumb.level"
            :color="
              breadcrumb.level === 'error' || breadcrumb.level === 'fatal'
                ? 'red'
                : breadcrumb.level === 'warning'
                  ? 'orange'
                  : 'gray'
            "
            variant="subtle"
            size="xs"
          >
            {{ breadcrumb.level }}
          </UBadge>

          <span v-if="breadcrumb.timestamp" class="ml-auto text-xs text-slate-400 dark:text-zinc-500">
            {{ new Date(breadcrumb.timestamp * 1000).toLocaleTimeString() }}
          </span>
        </div>

        <p v-if="breadcrumb.message" class="text-sm text-slate-700 dark:text-zinc-300 mb-1">{{ breadcrumb.message }}</p>
        <pre
          v-if="breadcrumb.data"
          class="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto"
          >{{ breadcrumb.data }}</pre
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Breadcrumb, Event, Exception } from '@sentry/core';

defineProps<{
  error: Exception;
  errorEvent: { event: Event };
}>();

function getColor(breadcrumb: Breadcrumb): 'red' | 'blue' | 'green' | 'gray' {
  if (breadcrumb.category === 'console') {
    return 'gray';
  }

  if (breadcrumb.level === 'error' || breadcrumb.level === 'fatal') {
    return 'red';
  }

  if (breadcrumb.category === 'ui.click') {
    return 'blue';
  }

  return 'green';
}

function getCategory(breadcrumb: Breadcrumb) {
  switch (breadcrumb.category) {
    case 'sentry.event':
      return 'Sentry Event';
    case 'fetch':
      return 'Fetch';
    case 'ui.click':
      return 'UI Click';
    case 'console':
      return 'Console';
    case 'navigation':
      return 'Navigation';
    default:
      return breadcrumb.category;
  }
}
</script>
