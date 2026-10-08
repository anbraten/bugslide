<template>
  <ErrorSection title="Context" icon="i-lucide-info" flush>
    <div v-if="tags.length > 0" class="flex flex-wrap gap-1.5 px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
      <span
        v-for="[key, value] in tags"
        :key="key"
        class="inline-flex max-w-full items-center text-xs rounded-md ring-1 ring-inset ring-slate-200 dark:ring-zinc-700 overflow-hidden"
      >
        <span class="px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">{{ key }}</span>
        <span class="px-1.5 py-0.5 text-slate-800 dark:text-zinc-200 font-mono truncate">{{ value }}</span>
      </span>
    </div>

    <div class="grid sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-100 dark:divide-zinc-800">
      <div
        v-for="group in groups"
        :key="group.title"
        class="px-4 sm:px-5 py-3 border-slate-100 dark:border-zinc-800 sm:border-b sm:odd:border-r min-w-0"
      >
        <h3 class="flex items-center gap-1.5 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
          <Icon :name="group.icon" class="w-3.5 h-3.5" />
          {{ group.title }}
        </h3>
        <dl class="text-sm">
          <div v-for="[label, value] in group.items" :key="label" class="grid grid-cols-[7rem_1fr] gap-2 py-0.5">
            <dt class="text-slate-500 dark:text-zinc-400 truncate" :title="label">{{ label }}</dt>
            <dd class="text-slate-900 dark:text-zinc-100 break-all min-w-0">
              <NuxtLink
                v-if="label === 'Release' && group.title === 'Event'"
                :to="`/projects/${projectId}/releases/${encodeURIComponent(value)}`"
                class="font-mono text-orange-600 dark:text-orange-400 hover:underline"
                >{{ value }}</NuxtLink
              >
              <a
                v-else-if="/^https?:\/\//.test(value)"
                :href="value"
                target="_blank"
                rel="noopener noreferrer"
                class="text-orange-600 dark:text-orange-400 hover:underline"
                >{{ value }}</a
              >
              <template v-else>{{ value }}</template>
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <details class="group border-t border-slate-100 dark:border-zinc-800">
      <summary
        class="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer select-none list-none"
      >
        <Icon name="i-lucide-chevron-right" class="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
        Raw event JSON
      </summary>
      <div class="relative">
        <button
          type="button"
          class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-2 py-1 cursor-pointer"
          @click="copyJson"
        >
          <Icon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="w-3.5 h-3.5" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
        <pre
          class="bg-zinc-950 dark:bg-black text-zinc-100 text-xs font-mono p-4 overflow-x-auto max-h-[32rem]"
        >{{ eventJson }}</pre>
      </div>
    </details>
  </ErrorSection>
</template>

<script lang="ts" setup>
import type { Event } from '@sentry/core';
import { UAParser } from 'ua-parser-js';

const props = defineProps<{
  projectId: string;
  event: Event | null | undefined;
}>();

const eventJson = computed(() => JSON.stringify(props.event, null, 2));
const copied = ref(false);

async function copyJson() {
  try {
    await navigator.clipboard.writeText(eventJson.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // clipboard unavailable (e.g. insecure context)
  }
}

type Group = { title: string; icon: string; items: [string, string][] };

function stringify(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function group(title: string, icon: string, entries: [string, unknown][]): Group | null {
  const items = entries
    .map(([label, value]) => [label, stringify(value)] as [string, string | null])
    .filter((e): e is [string, string] => e[1] !== null);
  return items.length > 0 ? { title, icon, items } : null;
}

const tags = computed(() =>
  Object.entries(props.event?.tags ?? {})
    .map(([k, v]) => [k, stringify(v)] as const)
    .filter((t): t is readonly [string, string] => t[1] !== null),
);

const contextIcons: Record<string, string> = {
  os: 'i-lucide-monitor',
  runtime: 'i-lucide-cpu',
  device: 'i-lucide-smartphone',
  browser: 'i-lucide-globe',
  app: 'i-lucide-app-window',
  culture: 'i-lucide-languages',
};

const groups = computed(() => {
  const event = props.event;
  if (!event) {
    return [];
  }

  const headers = event.request?.headers ?? {};
  const userAgent = headers['User-Agent'] ?? headers['user-agent'];
  const ua = userAgent ? new UAParser(userAgent) : undefined;
  const browser = ua?.getBrowser();
  const os = ua?.getOS();
  const device = ua?.getDevice();

  const contexts = Object.entries(event.contexts ?? {})
    // trace ids are noise until there is tracing support
    .filter(([name, ctx]) => name !== 'trace' && ctx && typeof ctx === 'object')
    .map(([name, ctx]) =>
      group(
        name.charAt(0).toUpperCase() + name.slice(1),
        contextIcons[name] ?? 'i-lucide-box',
        Object.entries(ctx as Record<string, unknown>).filter(([key]) => key !== 'type'),
      ),
    );

  return [
    group('Event', 'i-lucide-flame', [
      ['ID', event.event_id],
      ['Time', event.timestamp ? new Date(event.timestamp * 1000).toLocaleString() : null],
      ['Level', event.level],
      ['Environment', event.environment],
      ['Release', event.release],
      ['Transaction', event.transaction],
      ['Server', event.server_name],
      ['Platform', event.platform],
      ['SDK', event.sdk ? `${event.sdk.name} ${event.sdk.version}` : null],
    ]),
    group('User', 'i-lucide-user', [
      ['ID', event.user?.id],
      ['Email', event.user?.email],
      ['Username', event.user?.username],
      ['IP', event.user?.ip_address === '{{auto}}' ? null : event.user?.ip_address],
      ['Location', [event.user?.geo?.city, event.user?.geo?.country_code].filter(Boolean).join(', ')],
    ]),
    group('Request', 'i-lucide-globe', [
      ['Method', event.request?.method],
      ['URL', event.request?.url],
      ['Query', event.request?.query_string],
      ['Referer', headers['Referer'] ?? headers['referer']],
    ]),
    ua
      ? group('Client', 'i-lucide-monitor-smartphone', [
          ['Browser', [browser?.name, browser?.version].filter(Boolean).join(' ')],
          ['OS', [os?.name, os?.version].filter(Boolean).join(' ')],
          ['Device', [device?.vendor, device?.model].filter(Boolean).join(' ')],
        ])
      : null,
    ...contexts,
    group('Additional data', 'i-lucide-database', Object.entries(event.extra ?? {})),
  ].filter((g): g is Group => g !== null);
});
</script>
