<template>
  <div>
    <div class="border rounded-md">
      <div v-for="frame in errorEvent?.stacktrace?.frames ?? []">
        <div class="flex gap-1 p-1 bg-gray-100 border-t first:border-0 text-sm items-center">
          <span class="font-bold" :title="frame.filename">{{ frame.filename?.split('/').pop() }}</span>
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
            >{{ 'In App' }}</UBadge
          >
          <UButton icon="i-mdi-chevron-down" color="gray" variant="ghost" size="sm" />
        </div>

        <div>
          <pre class="p-2">TODO: Source code</pre>
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
</script>
