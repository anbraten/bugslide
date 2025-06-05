<template>
  <div class="flex flex-col">
    <div class="ml-auto mb-2 flex items-center gap-2">
      <span class="text-sm text-gray-600 dark:text-gray-400">{{
        showOnlyRelevantFrames ? 'Most relevant frames' : 'All frames'
      }}</span>
      <UToggle v-model="showOnlyRelevantFrames" />
    </div>

    <div class="border dark:border-gray-800 rounded-md">
      <div v-for="(frame, i) in resolvedFrames.toReversed()" :key="i">
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
          <div class="w-full">
            <div v-for="(l, i) in frame.code" :key="l.line" class="flex">
              <div
                class="w-10 text-right border-r-2 px-2"
                :class="{
                  'border-red-400 bg-red-400': i === (frame.pre_context?.length ?? -1),
                  'border-gray-300': i !== (frame.pre_context?.length ?? -1),
                }"
              >
                {{ l.line }}
              </div>
              <pre class="ml-2">{{ l.code }}</pre>
            </div>
          </div>
          <UBadge
            v-if="!frame.vars?.resolved"
            variant="subtle"
            :ui="{ rounded: 'rounded-full' }"
            class="ml-auto"
            color="red"
            size="sm"
            >No source map available</UBadge
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Event, Exception, StackFrame, Stacktrace } from '@sentry/core';

const route = useRoute();

const props = defineProps<{
  error: Exception;
  errorEvent: { event: Event; stacktrace: Stacktrace };
}>();

const projectId = computed(() => route.params.projectId as string);
const release = computed(() => 'latest'); // TODO: use release from error

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

const { data: _resolvedFrames } = await useFetch<StackFrame[]>(
  () => `/api/${projectId.value}/releases/${release.value}/resolve-stack-frame`,
  {
    watch: [frames],
    method: 'POST',
    body: computed(() => ({
      frames: frames.value,
    })),
    default: () => [],
  },
);

const resolvedFrames = computed(() =>
  _resolvedFrames.value.map((rf) => {
    const startLineNo = (rf.lineno ?? 0) - (rf.pre_context?.length ?? 0);

    const code = [...(rf.pre_context ?? []), rf.context_line, ...(rf.post_context ?? [])].map((c, i) => ({
      line: startLineNo + i,
      highlight: rf.lineno === startLineNo + i,
      code: c,
    }));

    return {
      ...rf,
      code,
    };
  }),
);
</script>
