<template>
  <div>
    <div
      v-if="!error"
      class="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl"
    >
      <Icon name="i-lucide-search-x" class="w-6 h-6 text-slate-400 mb-3" />
      <h3 class="text-base font-medium text-slate-900 dark:text-zinc-100">Error not found</h3>
      <UButton label="Back to errors" variant="soft" size="sm" class="mt-4" :to="`/projects/${projectId}`" />
    </div>

    <div v-else class="flex flex-col gap-5">
      <!-- Header: what broke, how bad, and what to do about it -->
      <header class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <ErrorState :error />
              <UTooltip
                v-if="error.state === 'open' && error.regressedAt"
                :text="`Reopened after resolve ${timeAgo(error.regressedAt)} ago`"
              >
                <UBadge color="red" variant="subtle" size="sm">Regressed</UBadge>
              </UTooltip>
              <span class="text-xs font-mono text-slate-400 dark:text-zinc-500">#{{ errorId }}</span>
            </div>
            <h1
              class="text-xl sm:text-2xl font-bold leading-snug text-slate-900 dark:text-zinc-100 wrap-break-word line-clamp-3"
            >
              {{ error.value || error.title }}
            </h1>
            <p class="mt-1.5 text-sm font-mono min-w-0 truncate">
              <span class="font-semibold text-slate-700 dark:text-zinc-300">{{ error.title }}</span>
              <template v-if="culprit">
                <span class="text-slate-300 dark:text-zinc-600 mx-1.5">·</span>
                <span class="text-slate-500 dark:text-zinc-400">{{ culprit }}</span>
              </template>
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <UTooltip text="Copy error, stack trace and breadcrumbs as markdown">
              <UButton
                :icon="copied ? 'i-lucide-check' : 'i-lucide-sparkles'"
                label="Copy for AI"
                color="gray"
                variant="outline"
                size="sm"
                :loading="copying"
                @click="copyForAi"
              />
            </UTooltip>
            <template v-if="error.state === 'open'">
              <UButton icon="i-lucide-check" label="Resolve" color="green" size="sm" @click="changeState('resolved')" />
              <UButton
                icon="i-lucide-eye-off"
                label="Ignore"
                color="gray"
                variant="outline"
                size="sm"
                @click="changeState('ignored')"
              />
            </template>
            <UButton
              v-else
              icon="i-lucide-rotate-ccw"
              label="Reopen"
              color="gray"
              variant="outline"
              size="sm"
              @click="changeState('open')"
            />
          </div>
        </div>

        <!-- Full error value, only when the headline can't show all of it -->
        <div
          v-if="error.value && (error.value.length > 200 || error.value.includes('\n'))"
          class="px-4 sm:px-5 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 max-h-64 overflow-y-auto"
        >
          <pre class="text-sm text-slate-700 dark:text-zinc-300 font-mono whitespace-pre-wrap break-all">{{
            error.value
          }}</pre>
        </div>
      </header>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
        <!-- The selected event -->
        <div class="flex flex-col gap-5 min-w-0">
          <div
            class="sticky top-24 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-slate-200 dark:border-zinc-800 rounded-xl"
          >
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0 flex-1 text-sm">
              <span class="font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                Event {{ errorEventId }}
                <span class="font-normal text-slate-400 dark:text-zinc-500">of {{ error.events }}</span>
              </span>
              <UTooltip v-if="errorEvent" :text="formatAbsolute(errorEvent.createdAt)">
                <span class="text-slate-500 dark:text-zinc-400 cursor-default whitespace-nowrap">
                  {{ timeAgo(errorEvent.createdAt) }} ago
                </span>
              </UTooltip>
              <NuxtLink
                v-if="eventRelease"
                :to="releaseLink(eventRelease)"
                class="text-xs font-mono text-slate-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate max-w-48"
                :title="eventRelease"
              >
                <Icon name="i-lucide-rocket" class="w-3 h-3 align-[-1px]" /> {{ eventRelease }}
              </NuxtLink>
            </div>
            <div class="flex items-center gap-0.5">
              <UButton
                icon="i-lucide-chevrons-left"
                color="gray"
                variant="ghost"
                size="xs"
                aria-label="Oldest event"
                :disabled="errorEventId <= 1"
                @click="goToEvent(1)"
              />
              <UButton
                icon="i-lucide-chevron-left"
                label="Older"
                color="gray"
                variant="ghost"
                size="xs"
                :disabled="errorEventId <= 1"
                @click="goToEvent(errorEventId - 1)"
              />
              <UButton
                icon="i-lucide-chevron-right"
                icon-position="right"
                label="Newer"
                color="gray"
                variant="ghost"
                size="xs"
                :disabled="errorEventId >= error.events"
                @click="goToEvent(errorEventId + 1)"
              />
              <UButton
                icon="i-lucide-chevrons-right"
                color="gray"
                variant="ghost"
                size="xs"
                aria-label="Newest event"
                :disabled="errorEventId >= error.events"
                @click="goToEvent(error.events)"
              />
            </div>
          </div>

          <template v-if="errorEvent">
            <ErrorStacktrace
              :project-id="projectId"
              :stacktrace="errorEvent.stacktrace"
              :exception
              :event="errorEvent.event"
              :release="eventRelease"
            />
            <ErrorBreadcrumbs :event="errorEvent.event" />
            <ErrorContext :project-id="projectId" :event="errorEvent.event" />
          </template>
          <p
            v-else
            class="px-5 py-10 text-center text-sm text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl"
          >
            This event is no longer available.
          </p>
        </div>

        <!-- Aggregates over all events -->
        <aside class="flex flex-col gap-5 min-w-0">
          <!-- how bad -->
          <SidebarStats>
            <SidebarStat label="Events" icon="i-lucide-activity">
              {{ error.events.toLocaleString() }}
            </SidebarStat>
            <SidebarStat label="Users" icon="i-lucide-users">
              {{ summary ? summary.users.toLocaleString() : '—' }}
            </SidebarStat>
            <SidebarStat label="First seen" icon="i-lucide-clock">
              <UTooltip :text="formatAbsolute(error.createdAt)">
                <span class="cursor-default">{{ timeAgo(error.createdAt) }} ago</span>
              </UTooltip>
              <template v-if="summary?.firstRelease" #sub>
                <NuxtLink
                  :to="releaseLink(summary.firstRelease)"
                  class="font-mono hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  :title="summary.firstRelease"
                >
                  in {{ shortRelease(summary.firstRelease) }}
                </NuxtLink>
              </template>
            </SidebarStat>
            <SidebarStat label="Last seen" icon="i-lucide-refresh-cw">
              <UTooltip :text="formatAbsolute(error.lastOccurrence)">
                <span class="cursor-default">{{ timeAgo(error.lastOccurrence) }} ago</span>
              </UTooltip>
              <template v-if="summary?.lastRelease" #sub>
                <NuxtLink
                  :to="releaseLink(summary.lastRelease)"
                  class="font-mono hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  :title="summary.lastRelease"
                >
                  in {{ shortRelease(summary.lastRelease) }}
                </NuxtLink>
              </template>
            </SidebarStat>
          </SidebarStats>

          <ErrorSection title="Last 30 days" icon="i-lucide-chart-column">
            <template #actions>
              <span class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                {{ events30d.toLocaleString() }} event{{ events30d !== 1 ? 's' : '' }}
              </span>
            </template>
            <ActivityChart v-if="errorActivity.length" :data="errorActivity" />
            <div v-else class="h-16 bg-slate-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </ErrorSection>

          <ErrorSection title="Tags" icon="i-lucide-tags">
            <div v-if="summaryStatus === 'pending' && !summary" class="flex flex-col gap-4">
              <div v-for="i in 3" :key="i" class="h-10 bg-slate-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
            </div>
            <p v-else-if="!summary?.tags.length" class="text-sm text-slate-500 dark:text-zinc-400">
              No tags recorded for this error.
            </p>
            <div v-else class="flex flex-col gap-5">
              <ErrorTagDistribution v-for="tag in summary.tags" :key="tag.key" :tag />
            </div>
          </ErrorSection>
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Event, Stacktrace } from '@sentry/core';
import type { ErrorSummary } from '#shared/types/error-summary';

const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.projectId as string);
const errorId = computed(() => route.params.errorId as string);
const { data: error, refresh: refreshError } = await useFetch(
  () => `/api/projects/${projectId.value}/errors/${errorId.value}`,
);

// the selected event lives in the url so it can be shared, without one we show the newest (the one an alert points to)
const errorEventId = computed(() => {
  const fromQuery = parseInt(String(route.query.event ?? ''), 10);
  const newest = error.value?.events ?? 1;
  return fromQuery >= 1 && fromQuery <= newest ? fromQuery : newest;
});

function goToEvent(eventId: number) {
  router.replace({
    query: { ...route.query, event: eventId === error.value?.events ? undefined : String(eventId) },
  });
}

// typed by hand, the inferred serialized type doesn't match @sentry/core's
const { data: errorEvent } = await useFetch<{
  createdAt: string;
  release: string | null;
  stacktrace: Stacktrace | null;
  event: Event | null;
}>(() => `/api/projects/${projectId.value}/errors/${errorId.value}/events/${errorEventId.value}`);

function releaseLink(version: string) {
  return `/projects/${projectId.value}/releases/${encodeURIComponent(version)}`;
}

const eventRelease = computed(() => errorEvent.value?.release ?? errorEvent.value?.event?.release ?? null);
// an event can carry a chain of exceptions, this error was grouped by one of them
const exception = computed(() => {
  const values = errorEvent.value?.event?.exception?.values ?? [];
  return (
    values.find((v) => v.type === error.value?.title && (v.value ?? '') === (error.value?.value ?? '')) ??
    values.at(-1) ??
    null
  );
});
const culprit = computed(() => getCulprit(errorEvent.value?.stacktrace));

// aggregates are not needed for the first paint
const { data: summary, status: summaryStatus } = useFetch<ErrorSummary>(
  () => `/api/projects/${projectId.value}/errors/${errorId.value}/summary`,
  { lazy: true, server: false },
);

const { data: errorActivity } = useFetch<{ date: string; count: number }[]>(
  () => `/api/projects/${projectId.value}/errors/${errorId.value}/activity`,
  { lazy: true, server: false, default: () => [] },
);
const events30d = computed(() => errorActivity.value.reduce((sum, d) => sum + d.count, 0));

useSeoMeta({
  title: () => error.value?.value || error.value?.title || `Error: ${errorId.value}`,
});

const { add: addToast } = useToast();

const copying = ref(false);
const copied = ref(false);
async function copyForAi() {
  copying.value = true;
  try {
    const { markdown } = await $fetch<{ markdown: string }>(
      `/api/projects/${projectId.value}/errors/${errorId.value}/events/${errorEventId.value}/markdown`,
    );
    await navigator.clipboard.writeText(markdown);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
    addToast({ title: 'Copied for AI', description: 'Paste it into your assistant.', color: 'green' });
  } catch {
    addToast({ title: 'Something went wrong', description: 'Failed to copy the error.', color: 'red' });
  } finally {
    copying.value = false;
  }
}

async function changeState(state: 'open' | 'resolved' | 'ignored') {
  try {
    await $fetch(`/api/projects/${projectId.value}/errors/${errorId.value}`, {
      method: 'PATCH',
      body: { state },
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
