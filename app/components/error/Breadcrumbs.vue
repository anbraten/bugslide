<template>
  <ErrorSection title="Breadcrumbs" icon="i-lucide-list-tree" :count="breadcrumbs.length" flush>
    <p v-if="breadcrumbs.length === 0" class="px-5 py-4 text-sm text-slate-500 dark:text-zinc-400">
      No breadcrumbs were recorded before this event.
    </p>

    <ol v-else class="divide-y divide-slate-100 dark:divide-zinc-800">
      <li v-for="crumb in visibleBreadcrumbs" :key="crumb.index">
        <button
          type="button"
          class="w-full grid grid-cols-[1.75rem_1fr_auto] items-start gap-x-3 px-4 sm:px-5 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          :class="crumb.hasDetails ? 'cursor-pointer' : 'cursor-default'"
          :disabled="!crumb.hasDetails"
          @click="toggle(crumb.index)"
        >
          <span class="w-7 h-7 rounded-full flex items-center justify-center" :class="toneClasses[crumb.tone]">
            <Icon :name="crumb.icon" class="w-3.5 h-3.5" />
          </span>
          <span class="min-w-0 pt-1">
            <span class="flex flex-wrap items-baseline gap-x-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-zinc-400">{{ crumb.category }}</span>
              <span
                class="text-sm text-slate-800 dark:text-zinc-200 break-all"
                :class="crumb.mono ? 'font-mono text-xs' : ''"
              >
                {{ crumb.summary }}
              </span>
            </span>
          </span>
          <UTooltip :text="crumb.absoluteTime">
            <span class="pt-1.5 text-xs text-slate-400 dark:text-zinc-500 tabular-nums whitespace-nowrap">
              {{ crumb.relativeTime }}
            </span>
          </UTooltip>
        </button>
        <pre
          v-if="open.has(crumb.index)"
          class="mx-4 sm:mx-5 mb-3 ml-14 sm:ml-15 text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg p-3 whitespace-pre-wrap break-all"
          >{{ JSON.stringify(crumb.raw.data ?? crumb.raw, null, 2) }}</pre
        >
      </li>
    </ol>

    <button
      v-if="hiddenCount > 0"
      type="button"
      class="w-full px-5 py-2 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 transition-colors"
      @click="showAll = true"
    >
      Show {{ hiddenCount }} older breadcrumb{{ hiddenCount !== 1 ? 's' : '' }}
    </button>
  </ErrorSection>
</template>

<script lang="ts" setup>
import type { Breadcrumb, Event } from '@sentry/core';

const props = defineProps<{
  event: Event | null | undefined;
}>();

type Tone = 'red' | 'orange' | 'blue' | 'green' | 'gray';

const toneClasses: Record<Tone, string> = {
  red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
  orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
  blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  gray: 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400',
};

const INITIAL_COUNT = 15;
const showAll = ref(false);

const open = ref(new Set<number>());
function toggle(index: number) {
  const next = new Set(open.value);
  if (!next.delete(index)) {
    next.add(index);
  }
  open.value = next;
}

watch(
  () => props.event,
  () => {
    showAll.value = false;
    open.value = new Set();
  },
);

function formatRelative(seconds: number) {
  const abs = Math.abs(seconds);
  const sign = seconds < 0 ? '-' : '+';
  if (abs < 1) {
    return `${sign}${Math.round(abs * 1000)}ms`;
  }
  if (abs < 60) {
    return `${sign}${abs.toFixed(1)}s`;
  }
  const m = Math.floor(abs / 60);
  if (m < 60) {
    return `${sign}${m}m ${Math.round(abs % 60)}s`;
  }
  return `${sign}${Math.floor(m / 60)}h ${m % 60}m`;
}

function describe(crumb: Breadcrumb): { category: string; summary: string; icon: string; tone: Tone; mono: boolean } {
  const data = crumb.data ?? {};
  const isError = crumb.level === 'error' || crumb.level === 'fatal';

  switch (crumb.category) {
    case 'fetch':
    case 'xhr': {
      const status = data.status_code as number | undefined;
      const failed = isError || (status !== undefined && status >= 400);
      return {
        category: crumb.category === 'fetch' ? 'Fetch' : 'XHR',
        summary: [data.method, data.url].filter(Boolean).join(' ') + (status ? ` → ${status}` : ''),
        icon: 'i-lucide-arrow-right-left',
        tone: failed ? 'red' : 'green',
        mono: true,
      };
    }
    case 'navigation':
      return {
        category: 'Navigation',
        summary: data.from ? `${data.from} → ${data.to}` : String(data.to ?? crumb.message ?? ''),
        icon: 'i-lucide-map-pin',
        tone: 'blue',
        mono: true,
      };
    case 'ui.click':
    case 'ui.input':
      return {
        category: crumb.category === 'ui.click' ? 'Click' : 'Input',
        summary: crumb.message ?? '',
        icon: 'i-lucide-mouse-pointer',
        tone: 'blue',
        mono: true,
      };
    case 'console':
      return {
        category: 'Console',
        summary: crumb.message ?? '',
        icon: 'i-lucide-terminal',
        tone: isError ? 'red' : crumb.level === 'warning' ? 'orange' : 'gray',
        mono: true,
      };
    case 'sentry.event':
    case 'sentry.transaction':
      return {
        category: 'Event',
        summary: crumb.message ?? '',
        icon: 'i-lucide-flame',
        tone: 'red',
        mono: false,
      };
    default:
      return {
        category: crumb.category ?? crumb.type ?? 'Default',
        summary: crumb.message ?? (crumb.data ? JSON.stringify(crumb.data) : ''),
        icon: 'i-lucide-circle-dot',
        tone: isError ? 'red' : 'gray',
        mono: !crumb.message,
      };
  }
}

// newest first, the ones right before the error are the interesting ones
const breadcrumbs = computed(() => {
  const crumbs = props.event?.breadcrumbs ?? [];
  const eventTime = props.event?.timestamp;

  return crumbs
    .map((raw, index) => ({
      ...describe(raw),
      index,
      raw,
      hasDetails: !!raw.data && Object.keys(raw.data).length > 0,
      relativeTime: raw.timestamp && eventTime ? formatRelative(raw.timestamp - eventTime) : '',
      absoluteTime: raw.timestamp ? new Date(raw.timestamp * 1000).toLocaleString() : '',
    }))
    .toReversed();
});

const visibleBreadcrumbs = computed(() =>
  showAll.value ? breadcrumbs.value : breadcrumbs.value.slice(0, INITIAL_COUNT),
);
const hiddenCount = computed(() => breadcrumbs.value.length - visibleBreadcrumbs.value.length);
</script>
