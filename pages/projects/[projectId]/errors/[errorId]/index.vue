<template>
  <div class="flex flex-col">
    <div class="ml-auto mb-2 flex items-center gap-2">
      <span class="text-sm text-gray-600 dark:text-gray-400">{{
        showOnlyRelevantFrames ? 'Most relevant frames' : 'All frames'
      }}</span>
      <UToggle v-model="showOnlyRelevantFrames" />
    </div>

    <div class="border dark:border-gray-800 rounded-md">
      <div v-for="(frame, i) in frames.toReversed()" :key="i">
        <div class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 border-t first:border-0 text-sm items-center">
          <UTooltip v-if="frame.filename" :text="frame.filename">
            <a
              v-if="frame.filename.startsWith('http://') || frame.filename.startsWith('https://')"
              :href="frame.filename"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="font-bold">{{ sanitizeStacktracePath(frame.filename ?? '') }}</span>
            </a>
            <span v-else class="font-bold">{{ sanitizeStacktracePath(frame.filename ?? '') }}</span>
          </UTooltip>
          <span>in</span>
          <span class="font-bold">{{ frame.function }}</span>
          <span>at line</span>
          <span class="font-bold">{{ frame.lineno }}:{{ frame.colno }}</span>

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
import type { Event, Exception, Stacktrace } from '@sentry/core';

const props = defineProps<{
  error: Exception;
  errorEvent: { event: Event; stacktrace: Stacktrace };
}>();

function trimLeading(str: string, length: number) {
  return str.length > length ? `...${str.slice(str.length - length)}` : str;
}

function sanitizeStacktracePath(path: string) {
  return trimLeading(
    path
      .replace(/^webpack:\/\/\//, '')
      .replace(/^http:\/\/localhost:\d+/, '')
      .replace(/^file:\/\/\//, '')
      .replace(/\?.*?$/, ''),
    60,
  );
}

const showOnlyRelevantFrames = ref(true);
const frames = computed(() => {
  const _frames = props.errorEvent.stacktrace?.frames ?? [];

  if (!showOnlyRelevantFrames.value) {
    return _frames;
  }

  return _frames.filter(isRelevantFrame);
});

function isRelevantFrame(frame: any) {
  return !frame.filename?.includes('node_modules/');
}
</script>
