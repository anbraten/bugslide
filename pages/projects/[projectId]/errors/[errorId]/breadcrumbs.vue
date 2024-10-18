<template>
  <div>
    <div
      v-for="breadcrumb in errorEvent.event.breadcrumbs"
      :key="breadcrumb.timestamp"
      class="flex flex-col border-l dark:border-gray-800 p-4 gap-4"
    >
      <div class="flex w-full gap-2 items-center">
        <div
          class="-ml-8 bg-white dark:bg-gray-900 w-8 h-8 rounded-full flex items-center justify-center"
          :class="{
            'text-red-700': getColor(breadcrumb) === 'red',
            'text-green-700': getColor(breadcrumb) === 'green',
            'text-blue-700': getColor(breadcrumb) === 'blue',
            'text-gray-500': getColor(breadcrumb) === 'gray',
          }"
        >
          <UIcon v-if="breadcrumb.category === 'sentry.event'" name="i-lucide-flame" />
          <UIcon v-else-if="breadcrumb.category === 'navigation'" name="i-heroicons-map-pin-16-solid" />
          <UIcon v-else-if="breadcrumb.category === 'ui.click'" name="i-lucide-mouse-pointer" />
          <UIcon v-else-if="breadcrumb.category === 'fetch'" name="i-lucide-arrow-right-left" />
          <UIcon v-else-if="breadcrumb.category === 'console'" name="i-lucide-pencil" />
          <UIcon v-else name="i-lucide-pentagon" />
        </div>
        <span
          class="font-bold"
          :class="{
            'text-red-700': getColor(breadcrumb) === 'red',
            'text-green-700': getColor(breadcrumb) === 'green',
            'text-blue-700': getColor(breadcrumb) === 'blue',
            'text-gray-500': getColor(breadcrumb) === 'gray',
          }"
          >{{ getCategory(breadcrumb) }}</span
        >
        <span
          class="ml-auto"
          :class="{
            'text-red-700': breadcrumb.level === 'error' || breadcrumb.level === 'fatal',
            'text-orange-700': breadcrumb.level === 'warning',
            'text-gray-500': breadcrumb.level === 'info' || breadcrumb.level === 'debug',
          }"
          >{{ breadcrumb.level || 'info' }}</span
        >
        <span v-if="breadcrumb.timestamp">{{ new Date(breadcrumb.timestamp).toLocaleString() }}</span>
      </div>
      <span>{{ breadcrumb.message }}</span>
      <pre v-if="breadcrumb.data" class="p-2 bg-gray-200 dark:bg-gray-800 rounded-md whitespace-pre-wrap">{{
        breadcrumb.data
      }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Breadcrumb, Event, Exception } from '@sentry/types';

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
    case 'sentry.event':
      return 'Sentry';
    case 'console':
      return 'Console';
    case 'navigation':
      return 'Navigation';
    default:
      return breadcrumb.category;
  }
}
</script>
