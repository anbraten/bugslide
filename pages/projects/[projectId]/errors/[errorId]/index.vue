<template>
  <div>
    <div class="border dark:border-gray-800 rounded-md">
      <div v-for="frame in errorEvent?.stacktrace?.frames ?? []">
        <div class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 border-t first:border-0 text-sm items-center">
          <UTooltip :text="frame.filename">
            <span class="font-bold">{{ trimLeading(frame.filename ?? '', 60) }}</span>
          </UTooltip>
          <span>in</span>
          <span class="font-bold">{{ frame.function }}</span>
          <span>at line</span>
          <span class="font-bold">{{ frame.lineno }}</span>

          <UBadge
            v-if="frame.in_app"
            variant="subtle"
            :ui="{ rounded: 'rounded-full' }"
            class="ml-auto"
            color="blue"
            size="sm"
            >In App</UBadge
          >
          <UButton icon="i-mdi-chevron-down" color="gray" variant="ghost" size="sm" />
        </div>

        <div class="flex items-center p-2">
          <pre>{{ frame.lineno }} {{ frame.function }}</pre>
          <UBadge variant="subtle" :ui="{ rounded: 'rounded-full' }" class="ml-auto" color="red" size="sm"
            >No source map available</UBadge
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Event, Exception, Stacktrace } from '@sentry/types';

defineProps<{
  error: Exception;
  errorEvent: { event: Event; stacktrace: Stacktrace };
}>();

function trimLeading(str: string, length: number) {
  return str.length > length ? `...${str.slice(str.length - length)}` : str;
}
</script>
