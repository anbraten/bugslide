<template>
  <ErrorSection title="Stack trace" icon="i-lucide-code-xml" flush>
    <template #actions>
      <UTooltip v-if="mechanism" :text="`Captured by ${mechanism.type}`">
        <UBadge :color="mechanism.handled === false ? 'red' : 'gray'" variant="subtle" size="xs">
          {{ mechanism.handled === false ? 'Unhandled' : 'Handled' }}
        </UBadge>
      </UTooltip>
      <div v-if="hiddenFrames > 0 || !onlyInApp" class="flex items-center gap-2">
        <span class="text-xs text-slate-500 dark:text-zinc-400">In-app only</span>
        <UToggle v-model="onlyInApp" />
      </div>
    </template>

    <div v-if="frames.length === 0" class="flex gap-3 px-4 sm:px-5 py-4">
      <span
        class="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
      >
        <Icon name="i-lucide-unlink" class="w-4 h-4" />
      </span>
      <div class="min-w-0 text-sm">
        <p class="font-medium text-slate-900 dark:text-zinc-100">No stack trace captured</p>
        <p class="mt-0.5 text-slate-500 dark:text-zinc-400">{{ missingReason.reason }}</p>
        <p v-if="missingReason.hint" class="mt-1.5 text-slate-500 dark:text-zinc-400">
          <Icon name="i-lucide-lightbulb" class="w-3.5 h-3.5 align-[-2px] text-amber-500" />
          {{ missingReason.hint }}
        </p>
      </div>
    </div>

    <ol v-else class="divide-y divide-slate-100 dark:divide-zinc-800">
      <li v-for="frame in visibleFrames" :key="frame.index">
        <button
          type="button"
          class="w-full flex items-start gap-2 px-4 sm:px-5 py-2.5 text-left text-xs font-mono transition-colors"
          :class="[
            frame.inApp ? 'hover:bg-slate-50 dark:hover:bg-zinc-800/50' : 'opacity-60 hover:opacity-100',
            frame.code.length > 0 ? 'cursor-pointer' : 'cursor-default',
          ]"
          :disabled="frame.code.length === 0"
          @click="toggle(frame.index)"
        >
          <Icon
            :name="openFrames.has(frame.index) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400 dark:text-zinc-500"
            :class="frame.code.length === 0 ? 'invisible' : ''"
          />
          <div class="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span class="font-semibold text-slate-800 dark:text-zinc-200 break-all" :title="frame.filename">
              {{ sanitizeStacktracePath(frame.filename ?? '<unknown>') }}
            </span>
            <span class="text-slate-400 dark:text-zinc-500">in</span>
            <span class="font-semibold text-slate-800 dark:text-zinc-200 break-all">
              {{ frame.function || '<anonymous>' }}
            </span>
            <span v-if="frame.lineno" class="text-slate-500 dark:text-zinc-400 whitespace-nowrap">
              at {{ frame.lineno }}<template v-if="frame.colno">:{{ frame.colno }}</template>
            </span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <UTooltip v-if="!frame.resolved && frame.inApp && status !== 'pending'" text="No source map found">
              <Icon name="i-lucide-map-pin-off" class="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600" />
            </UTooltip>
            <UBadge v-if="frame.inApp" color="blue" variant="subtle" size="xs">In app</UBadge>
          </div>
        </button>

        <a
          v-if="openFrames.has(frame.index) && isUrl(frame.filename)"
          :href="frame.filename"
          target="_blank"
          rel="noopener noreferrer"
          class="block px-4 sm:px-5 pb-1.5 text-xs text-orange-600 dark:text-orange-400 hover:underline truncate"
        >
          {{ frame.filename }}
        </a>

        <code
          v-if="openFrames.has(frame.index) && frame.code.length > 0"
          class="block bg-zinc-950 dark:bg-black text-zinc-100 text-xs font-mono overflow-x-auto"
        >
          <div v-for="line in frame.code" :key="line.line" class="flex min-w-max">
            <span
              class="w-14 px-3 py-0.5 select-none text-right shrink-0 border-r"
              :class="line.highlight ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'border-zinc-800 text-zinc-600'"
            >
              {{ line.line }}
            </span>
            <span class="whitespace-pre flex-1 pl-4 pr-4 py-0.5" :class="line.highlight ? 'bg-orange-500/10' : ''">{{
              line.code
            }}</span>
          </div>
        </code>
      </li>
    </ol>

    <button
      v-if="onlyInApp && hiddenFrames > 0"
      type="button"
      class="w-full px-5 py-2 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 transition-colors"
      @click="onlyInApp = false"
    >
      Show {{ hiddenFrames }} library frame{{ hiddenFrames !== 1 ? 's' : '' }}
    </button>
  </ErrorSection>
</template>

<script lang="ts" setup>
import type { Event, Exception, StackFrame, Stacktrace } from '@sentry/core';

const props = defineProps<{
  projectId: string;
  stacktrace: Stacktrace | null | undefined;
  exception: Exception | null | undefined;
  event: Event | null | undefined;
  release: string | null | undefined;
}>();

const mechanism = computed(() => props.exception?.mechanism);

// best guess why the SDK sent no frames, so an empty stack trace doesn't look like a bug in BugSlide
const missingReason = computed((): { reason: string; hint?: string } => {
  const value = props.exception?.value ?? '';

  if (/^Script error\.?$/.test(value)) {
    return {
      reason: 'The browser hid the details because the error came from a script on another origin.',
      hint: 'Load the script with crossorigin="anonymous" and serve it with an Access-Control-Allow-Origin header.',
    };
  }
  if (mechanism.value?.synthetic || /^(Non-Error|Object captured as)/.test(value)) {
    return {
      reason: 'A value that is not an Error was thrown or rejected (e.g. a string or plain object), so there was no stack to record.',
      hint: 'Throw or reject with new Error(…) instead, optionally passing the original value as cause.',
    };
  }
  if (mechanism.value?.type?.includes('console')) {
    // CaptureConsole puts the logged arguments into extra, the error among them shows whether it had a stack at all
    const args = (props.event?.extra?.arguments ?? []) as unknown[];
    const loggedError = args.find(
      (arg): arg is { name?: string; stack?: string } =>
        !!arg && typeof arg === 'object' && 'stack' in arg && (arg as { name?: string }).name === props.exception?.type,
    );
    return {
      reason:
        loggedError && !loggedError.stack
          ? `Captured from a console.error() call. The logged ${props.exception?.type ?? 'error'} had an empty stack, so there were no frames to record.`
          : 'Captured from a console.error() call without an Error that carried a stack.',
      hint: 'Report it from the catch block with Sentry.captureException(new Error("…", { cause: error })) to get a stack of where it was handled.',
    };
  }
  if (mechanism.value?.type === 'onerror' || mechanism.value?.type === 'auto.browser.global_handlers.onerror') {
    return {
      reason:
        'The browser reported this through its global error handler without an Error object. This is typical for browser-internal errors (like ResizeObserver loop warnings) and extensions.',
      hint: 'If it is noise, ignore this error so it stops showing up.',
    };
  }
  return {
    reason: 'The SDK sent this exception without any frames, usually because it originated outside your code or all frames were filtered.',
  };
});

function trimLeading(str: string, length: number) {
  return str.length > length ? `…${str.slice(str.length - length)}` : str;
}

function sanitizeStacktracePath(path: string) {
  return trimLeading(
    path
      .replace(/^webpack:\/\/\//, '')
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/^file:\/\/\//, '')
      .replace(/\?.*?$/, ''),
    60,
  );
}

function isUrl(path: string | undefined) {
  return !!path && /^https?:\/\//.test(path);
}

function isInApp(frame: StackFrame) {
  return frame.in_app ?? !frame.filename?.includes('node_modules/');
}

const debugIdsForFiles = computed(() => {
  const debugIds = new Map<string, string>();
  props.event?.debug_meta?.images?.forEach((image) => {
    if (image.type === 'sourcemap') {
      debugIds.set(image.code_file, image.debug_id);
    }
  });
  return debugIds;
});

// some SDKs attach the stack to the event or the crashed thread instead of the exception
const stackFrames = computed(
  (): StackFrame[] =>
    [
      props.stacktrace,
      props.exception?.stacktrace,
      // not in @sentry/core's Event type, but sent with attachStacktrace
      (props.event as { stacktrace?: Stacktrace } | null | undefined)?.stacktrace,
      ...((props.event?.threads?.values ?? []) as { crashed?: boolean; stacktrace?: Stacktrace }[])
        .toSorted((a, b) => Number(!!b.crashed) - Number(!!a.crashed))
        .map((t) => t.stacktrace),
    ].find((s) => s?.frames?.length)?.frames ?? [],
);

const rawFrames = computed(() =>
  stackFrames.value.map((frame) => ({
    ...frame,
    debug_id: debugIdsForFiles.value.get(frame.filename ?? ''),
  })),
);

// fall back to the unresolved frames while resolving or if there is no source map for this release
const { data: resolvedFrames, status } = useFetch<StackFrame[]>(
  () => `/api/projects/${props.projectId}/releases/${encodeURIComponent(props.release || 'latest')}/resolve-stack-frame`,
  {
    method: 'POST',
    body: computed(() => ({ frames: rawFrames.value })),
    watch: [rawFrames],
    default: () => [],
  },
);

const frames = computed(() => {
  const source = resolvedFrames.value.length === rawFrames.value.length ? resolvedFrames.value : rawFrames.value;

  // Sentry orders frames oldest call first, show the throwing frame on top
  return source
    .map((frame, index) => {
      const lines = [...(frame.pre_context ?? []), frame.context_line ?? '', ...(frame.post_context ?? [])];
      const startLine = (frame.lineno ?? 0) - (frame.pre_context?.length ?? 0);
      const code =
        lines.join('').trim() === ''
          ? []
          : lines.map((c, i) => ({ line: startLine + i, highlight: frame.lineno === startLine + i, code: c }));

      return {
        ...frame,
        index,
        inApp: isInApp(frame),
        resolved: !!(frame.vars as { resolved?: boolean } | undefined)?.resolved,
        code,
      };
    })
    .toReversed();
});

const onlyInApp = ref(true);
const inAppCount = computed(() => frames.value.filter((f) => f.inApp).length);
// without any in-app frame the filter would hide everything
const visibleFrames = computed(() =>
  onlyInApp.value && inAppCount.value > 0 ? frames.value.filter((f) => f.inApp) : frames.value,
);
const hiddenFrames = computed(() => frames.value.length - visibleFrames.value.length);

const openFrames = ref(new Set<number>());
function toggle(index: number) {
  const next = new Set(openFrames.value);
  if (!next.delete(index)) {
    next.add(index);
  }
  openFrames.value = next;
}

// expand the throwing in-app frame by default
watch(
  frames,
  () => {
    const first = frames.value.find((f) => f.inApp && f.code.length > 0);
    openFrames.value = new Set(first ? [first.index] : []);
  },
  { immediate: true },
);
</script>
