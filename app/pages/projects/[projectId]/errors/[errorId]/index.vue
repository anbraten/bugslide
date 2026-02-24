<template>
  <div class="flex flex-col gap-3">
    <!-- Toggle -->
    <div class="flex items-center justify-end gap-2">
      <span class="text-xs text-slate-500 dark:text-zinc-400">
        {{ showOnlyRelevantFrames ? 'Showing relevant frames' : 'Showing all frames' }}
      </span>
      <UToggle v-model="showOnlyRelevantFrames" />
    </div>

    <!-- Frames list -->
    <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
      <div v-for="(frame, i) in resolvedFrames" :key="i">
        <!-- Frame header -->
        <div
          class="flex gap-2 px-3 py-2 text-xs items-center cursor-pointer select-none"
          :class="[
            i > 0 ? 'border-t border-slate-200 dark:border-zinc-800' : '',
            frame.in_app
              ? 'bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800'
              : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/40',
          ]"
          @click="toggleOpenFrame(i)"
        >
          <!-- Filename -->
          <UTooltip v-if="frame.filename" :text="frame.filename">
            <template v-if="frame.filename.startsWith('http://') || frame.filename.startsWith('https://')">
              <a
                :href="frame.filename"
                target="_blank"
                rel="noopener noreferrer"
                class="font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                @click.stop
              >
                {{ sanitizeStacktracePath(frame.filename) }}
              </a>
            </template>
            <span v-else class="font-semibold text-slate-800 dark:text-zinc-200">
              {{ sanitizeStacktracePath(frame.filename) }}
            </span>
          </UTooltip>
          <span class="text-slate-400 dark:text-zinc-500">in</span>
          <span class="font-semibold text-slate-800 dark:text-zinc-200">{{ frame.function }}</span>
          <span class="text-slate-400 dark:text-zinc-500">line</span>
          <span class="font-semibold text-slate-700 dark:text-zinc-300">{{ frame.lineno }}:{{ frame.colno }}</span>

          <div class="ml-auto flex items-center gap-1.5">
            <UBadge v-if="frame.in_app" color="blue" variant="subtle" size="xs">In App</UBadge>
            <UBadge v-if="!frame.vars?.resolved" color="red" variant="subtle" size="xs">No source map</UBadge>
            <Icon
              :name="openFrames.includes(i) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500"
            />
          </div>
        </div>

        <!-- Code block -->
        <div v-if="openFrames.includes(i) && frame.code.length > 0">
          <code class="block bg-zinc-950 dark:bg-black text-zinc-100 text-xs font-mono">
            <div v-for="(item, idx) in frame.code" :key="idx" class="flex">
              <div
                class="min-w-[3rem] px-3 py-0.5 select-none text-right shrink-0 border-r"
                :class="
                  item.highlight
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                    : 'border-zinc-800 text-zinc-600'
                "
              >
                {{ item.line }}
              </div>
              <span class="whitespace-pre-wrap w-full pl-4 py-0.5" :class="item.highlight ? 'bg-orange-500/10' : ''">
                {{ item.code }}
              </span>
            </div>
          </code>
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

const debugIdsForFiles = computed(() => {
  const debugIds = new Map<string, string>();

  props.errorEvent.event.debug_meta?.images?.forEach((image) => {
    if (image.type === 'sourcemap') {
      debugIds.set(image.code_file, image.debug_id);
    }
  });

  return debugIds;
});

const showOnlyRelevantFrames = ref(true);
const frames = computed(() =>
  (props.errorEvent.stacktrace?.frames ?? []).map((frame) => {
    const debugId = debugIdsForFiles.value.get(frame.filename ?? '');
    return {
      ...frame,
      debug_id: debugId,
    };
  }),
);

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
