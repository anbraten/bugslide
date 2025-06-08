<template>
  <div class="flex flex-col">
    <div class="ml-auto mb-2 flex items-center gap-2">
      <span class="text-sm text-gray-600 dark:text-gray-400">{{
        showOnlyRelevantFrames ? 'Most relevant frames' : 'All frames'
      }}</span>
      <UToggle v-model="showOnlyRelevantFrames" />
    </div>

    <div class="border dark:border-gray-800 rounded-md">
      <div v-for="(frame, i) in resolvedFrames" :key="i">
        <div
          class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 text-sm items-center"
          :class="{
            'border-t dark:border-gray-800': i > 0,
          }"
        >
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

          <div class="ml-auto" />
          <UBadge v-if="frame.in_app" variant="subtle" :ui="{ rounded: 'rounded-full' }" color="blue" size="sm"
            >In App</UBadge
          >
          <UBadge v-if="!frame.vars?.resolved" variant="subtle" :ui="{ rounded: 'rounded-full' }" color="red" size="sm"
            >No source map available</UBadge
          >
          <UButton
            :icon="openFrames.includes(i) ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down'"
            color="gray"
            variant="ghost"
            size="sm"
            @click="toggleOpenFrame(i)"
          />
        </div>

        <div v-if="openFrames.includes(i)" class="flex items-center">
          <div class="w-full">
            <code>
              <div v-for="(item, index) in frame.code" :key="index" class="flex">
                <div
                  class="min-w-12 px-4 pt-1 select-none flex text-right content-center"
                  :class="{ 'bg-green-600 dark:bg-green-800': item.highlight }"
                >
                  {{ item.line }}
                </div>
                <span
                  class="whitespace-pre-wrap w-full content-center pl-4"
                  :class="{ 'bg-gray-100 dark:bg-gray-700': item.highlight }"
                >
                  {{ item.code }}
                </span>
              </div>
            </code>
          </div>
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

const openFrames = ref<number[]>([]);
function toggleOpenFrame(index: number) {
  if (openFrames.value.includes(index)) {
    openFrames.value = openFrames.value.filter((i) => i !== index);
  } else {
    openFrames.value.push(index);
  }
}

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
const frames = computed(() => props.errorEvent.stacktrace?.frames ?? []);

function isRelevantFrame(frame: any) {
  return !frame.filename?.includes('node_modules/');
}

const { data: _resolvedFrames } = await useFetch<StackFrame[]>(
  () => `/api/projects/${projectId.value}/releases/${release.value}/resolve-stack-frame`,
  {
    watch: [frames],
    method: 'POST',
    body: computed(() => ({
      frames: frames.value,
    })),
    default: () => [],
  },
);

const resolvedFrames = computed(() => {
  const _frames = _resolvedFrames.value
    .map((rf) => {
      const startLineNo = (rf.lineno ?? 0) - (rf.pre_context?.length ?? 0);

      const lines = [
        ...(rf.pre_context ?? []),
        ...(rf.context_line ? [rf.context_line] : []),
        ...(rf.post_context ?? []),
      ];

      if (lines.join('') === '') {
        return {
          ...rf,
          code: [],
        };
      }

      const code = lines.map((c, i) => ({
        line: startLineNo + i,
        highlight: rf.lineno === startLineNo + i,
        code: c,
      }));

      return {
        ...rf,
        code,
      };
    })
    .toReversed();

  if (!showOnlyRelevantFrames.value) {
    return _frames;
  }

  return _frames.filter(isRelevantFrame);
});

watch(
  [showOnlyRelevantFrames],
  () => {
    openFrames.value = resolvedFrames.value
      .map((r, i) => (isRelevantFrame(r) && r.code.length > 0 ? i : -1))
      .filter((i) => i !== -1);
  },
  { immediate: true },
);
</script>
