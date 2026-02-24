<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 mb-5 text-sm" aria-label="Breadcrumb">
      <NuxtLink
        to="/"
        class="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
      >
        Projects
      </NuxtLink>
      <Icon name="i-lucide-chevron-right" class="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" />
      <NuxtLink
        :to="`/projects/${projectId}`"
        class="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors truncate max-w-[12rem]"
      >
        {{ project?.name ?? projectId }}
      </NuxtLink>
      <Icon name="i-lucide-chevron-right" class="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" />
      <span class="text-slate-700 dark:text-zinc-300 font-medium truncate max-w-[20rem]">
        {{ error?.title ?? errorId }}
      </span>
    </nav>

    <div v-if="error" class="flex flex-col gap-5">
      <!-- Error header card -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <!-- Top bar: title + actions -->
        <div class="p-5 border-b border-slate-100 dark:border-zinc-800">
          <div class="flex flex-wrap items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <ErrorState :error />
                <span class="text-xs text-slate-400 dark:text-zinc-500 font-mono">{{ errorId }}</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 dark:text-zinc-100 break-words">{{ error.title }}</h1>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <template v-if="error.state === 'open'">
                <UButton
                  icon="i-lucide-check"
                  label="Resolve"
                  color="green"
                  size="sm"
                  @click="changeState('resolved')"
                />
                <UButton
                  icon="i-lucide-x"
                  label="Ignore"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  @click="changeState('ignored')"
                />
              </template>
              <UButton
                v-else-if="error.state === 'resolved' || error.state === 'ignored'"
                icon="i-lucide-rotate-ccw"
                label="Reopen"
                color="gray"
                size="sm"
                @click="changeState('open')"
              />
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 divide-x divide-slate-100 dark:divide-zinc-800">
          <div class="px-5 py-3">
            <p class="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Events</p>
            <p class="mt-0.5 text-2xl font-bold text-slate-900 dark:text-zinc-100">{{ error.events }}</p>
          </div>
          <div class="px-5 py-3">
            <p class="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Last seen</p>
            <UTooltip :text="formatAbsolute(error.lastOccurrence)">
              <p class="mt-0.5 text-lg font-semibold text-slate-900 dark:text-zinc-100 cursor-default">
                {{ timeAgo(error.lastOccurrence) }} ago
              </p>
            </UTooltip>
          </div>
          <div class="px-5 py-3">
            <p class="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">First seen</p>
            <UTooltip :text="formatAbsolute(error.createdAt)">
              <p class="mt-0.5 text-lg font-semibold text-slate-900 dark:text-zinc-100 cursor-default">
                {{ timeAgo(error.createdAt) }} ago
              </p>
            </UTooltip>
          </div>
        </div>

        <!-- Error value -->
        <div
          v-if="error.value"
          class="px-5 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50"
        >
          <pre class="text-sm text-slate-700 dark:text-zinc-300 font-mono whitespace-pre-wrap">{{ error.value }}</pre>
        </div>
      </div>

      <!-- Event metadata card -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div class="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex-1">
            Event metadata
            <span
              v-if="errorEvent?.event?.event_id"
              class="text-xs font-normal text-slate-400 dark:text-zinc-500 font-mono ml-1"
            >
              {{ errorEvent.event.event_id.slice(0, 8) }}
            </span>
          </h2>
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-chevron-left"
              label="Older"
              color="gray"
              variant="ghost"
              size="sm"
              :disabled="errorEventId === 1"
              @click="errorEventId = errorEventId - 1"
            />
            <span class="text-xs text-slate-400 dark:text-zinc-500 px-1">{{ errorEventId }} / {{ error.events }}</span>
            <UButton
              icon="i-lucide-chevron-right"
              label="Newer"
              icon-position="right"
              color="gray"
              variant="ghost"
              size="sm"
              :disabled="errorEventId === error.events"
              @click="errorEventId = errorEventId + 1"
            />
          </div>
        </div>

        <div v-if="errorEvent?.event" class="divide-y divide-slate-100 dark:divide-zinc-800">
          <div class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40">
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Reported at</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100">{{
              new Date(errorEvent.createdAt).toLocaleString()
            }}</span>
          </div>
          <div
            v-if="errorEvent.event.level"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Level</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100 capitalize">{{ errorEvent.event.level }}</span>
          </div>
          <div
            v-if="errorEvent.event.platform"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Platform</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100">{{ errorEvent.event.platform }}</span>
          </div>
          <div
            v-if="errorEvent.event.environment"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Environment</span>
            <div>
              <UBadge color="blue" variant="subtle" size="xs">{{ errorEvent.event.environment }}</UBadge>
            </div>
          </div>
          <div
            v-if="errorEvent.event.release"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Release</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100 font-mono">{{ errorEvent.event.release }}</span>
          </div>
          <div
            v-if="errorEvent.event.transaction"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Transaction</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100 font-mono truncate">{{
              errorEvent.event.transaction
            }}</span>
          </div>
          <div
            v-if="errorEvent.event.server_name"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Server</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100">{{ errorEvent.event.server_name }}</span>
          </div>
          <div
            v-if="errorEvent.event.request?.url"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">URL</span>
            <a
              :href="errorEvent.event.request.url"
              target="_blank"
              class="text-sm text-orange-600 dark:text-orange-400 hover:underline truncate"
            >
              {{ errorEvent.event.request.url }}
            </a>
          </div>
          <div
            v-if="userAgent?.browser.name"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">Browser</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100"
              >{{ userAgent.browser.name }} {{ userAgent.browser.version }}</span
            >
          </div>
          <div
            v-if="userAgent?.os.name"
            class="grid grid-cols-[10rem_1fr] px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
          >
            <span class="text-sm font-medium text-slate-500 dark:text-zinc-400">OS</span>
            <span class="text-sm text-slate-900 dark:text-zinc-100">{{ userAgent.os.name }}</span>
          </div>
        </div>
      </div>

      <!-- Sub-page tabs + content -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div class="px-3 pt-1 border-b border-slate-200 dark:border-zinc-800">
          <UHorizontalNavigation v-if="error && errorEvent" :links="subPages" />
        </div>
        <div class="p-5">
          <NuxtPage v-if="error && errorEvent" :error :errorEvent />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UAParser } from 'ua-parser-js';

const route = useRoute();

const projectId = computed(() => route.params.projectId as string);
const errorId = computed(() => route.params.errorId as string);
const { data: project } = await useFetch(() => `/api/projects/${projectId.value}`);
const { data: error, refresh: refreshError } = await useFetch(
  () => `/api/projects/${projectId.value}/errors/${errorId.value}`,
);

const errorEventId = ref(1);
const { data: errorEvent } = await useFetch(
  () => `/api/projects/${projectId.value}/errors/${errorId.value}/events/${errorEventId.value}`,
);

useSeoMeta({
  title: () => error.value?.title ?? `Error: ${errorId.value}`,
});

const subPages = computed(() => [
  {
    label: 'Stacktrace',
    icon: 'i-lucide-code-xml',
    to: `/projects/${projectId.value}/errors/${errorId.value}/`,
    exact: true,
  },
  {
    label: 'Breadcrumbs',
    icon: 'i-lucide-list-tree',
    to: `/projects/${projectId.value}/errors/${errorId.value}/breadcrumbs`,
    exact: true,
  },
  {
    label: 'Details',
    icon: 'i-lucide-file-search',
    to: `/projects/${projectId.value}/errors/${errorId.value}/details`,
    exact: true,
  },
]);

const userAgent = computed(() => {
  const headers = errorEvent.value?.event?.request?.headers;
  if (!headers) return undefined;
  const ua = new UAParser(headers['User-Agent']);
  return { browser: ua.getBrowser(), os: ua.getOS() };
});

const { add: addToast } = useToast();

async function changeState(state: 'open' | 'resolved' | 'ignored') {
  try {
    await fetch(`/api/projects/${projectId.value}/errors/${errorId.value}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    await refreshError();
    const messages = {
      resolved: { title: 'Error resolved', color: 'green' as const },
      ignored: { title: 'Error ignored', color: 'gray' as const },
      open: { title: 'Error reopened', color: 'orange' as const },
    };
    addToast(messages[state]);
  } catch {
    addToast({ title: 'Something went wrong', description: 'Failed to update error state.', color: 'red' });
  }
}
</script>
