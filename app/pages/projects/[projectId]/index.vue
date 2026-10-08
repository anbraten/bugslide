<template>
  <div class="flex flex-col gap-4">
    <dl class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <HeaderStat label="Events · 30d" icon="i-lucide-activity">
        {{ totalEvents30d.toLocaleString() }}
      </HeaderStat>
      <HeaderStat label="Today" icon="i-lucide-calendar-clock">
        {{ eventsToday.toLocaleString() }}
      </HeaderStat>
      <HeaderStat label="Daily average" icon="i-lucide-gauge">
        {{ dailyAverage.toLocaleString() }}
      </HeaderStat>
      <HeaderStat label="Peak day" icon="i-lucide-trending-up">
        {{ peakDay?.count.toLocaleString() ?? '—' }}
        <template v-if="peakDay" #sub>{{ formatDay(peakDay.date) }}</template>
      </HeaderStat>
    </dl>

    <!-- Error-rate chart card -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div class="px-5 py-4">
        <ActivityChart v-if="activity" :data="activity" />
        <div v-else class="h-16 bg-slate-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </div>
    </div>

    <!-- Toolbar: status tabs + sort + search -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <!-- Status tabs -->
      <div class="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors"
          :class="
            state === tab.value
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          "
          @click="state = tab.value"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-orange-500': tab.value === 'open',
              'bg-emerald-500': tab.value === 'resolved',
              'bg-slate-400 dark:bg-zinc-500': tab.value === 'ignored',
            }"
          />
          {{ tab.label }}
        </button>
      </div>

      <!-- Sort -->
      <div class="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
        <button
          v-for="s in sortOptions"
          :key="s.value"
          class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          :class="
            sort === s.value
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          "
          @click="sort = s.value"
        >
          <Icon :name="s.icon" class="w-4 h-4" />
          {{ s.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="relative sm:ml-auto w-full sm:w-64">
        <Icon
          name="i-lucide-search"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500 pointer-events-none"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Search errors…"
          class="w-full pl-10 pr-3 py-2.5 text-base rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Count + pagination info, or bulk actions while errors are selected -->
    <div class="flex items-center justify-between gap-3 -mt-1 min-h-8">
      <div v-if="selected.length > 0" class="flex items-center gap-3 flex-wrap">
        <label
          class="flex items-center gap-3 pl-5 text-sm font-medium text-slate-700 dark:text-zinc-300 cursor-pointer"
        >
          <UCheckbox
            :model-value="allSelected"
            :indeterminate="!allSelected"
            aria-label="Select all errors on this page"
            @update:model-value="toggleAll"
          />
          {{ selected.length }} selected
        </label>
        <template v-if="state === 'open'">
          <UButton
            icon="i-lucide-check"
            label="Resolve"
            color="green"
            size="sm"
            :disabled="updating"
            @click="changeSelectedState('resolved')"
          />
          <UButton
            icon="i-lucide-eye-off"
            label="Ignore"
            color="gray"
            variant="outline"
            size="sm"
            :disabled="updating"
            @click="changeSelectedState('ignored')"
          />
        </template>
        <UButton
          v-else
          icon="i-lucide-rotate-ccw"
          label="Reopen"
          color="gray"
          variant="outline"
          size="sm"
          :disabled="updating"
          @click="changeSelectedState('open')"
        />
      </div>
      <p v-else class="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
        <UCheckbox
          v-if="errors.length > 0"
          :model-value="false"
          class="ml-5"
          aria-label="Select all errors on this page"
          @update:model-value="toggleAll"
        />
        {{ response?.total ?? 0 }} {{ state }} error{{ (response?.total ?? 0) !== 1 ? 's' : '' }}
        <span v-if="search">
          matching <em class="not-italic font-medium text-slate-700 dark:text-zinc-300">"{{ search }}"</em></span
        >
      </p>
      <p v-if="(response?.pages ?? 0) > 1" class="text-sm text-slate-400 dark:text-zinc-500">
        Page {{ response?.page }} of {{ response?.pages }}
      </p>
    </div>

    <!-- Empty state -->
    <div
      v-if="errors.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl"
    >
      <div
        class="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        :class="search ? 'bg-slate-100 dark:bg-zinc-800' : 'bg-emerald-50 dark:bg-emerald-500/10'"
      >
        <Icon
          :name="search ? 'i-lucide-search-x' : 'i-lucide-check-circle'"
          class="w-6 h-6"
          :class="search ? 'text-slate-400' : 'text-emerald-500'"
        />
      </div>
      <h3 class="text-base font-medium text-slate-900 dark:text-zinc-100">
        {{ search ? 'No matching errors' : `No ${state} errors` }}
      </h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-zinc-400 max-w-xs">
        {{
          search
            ? 'Try a different search term.'
            : state === 'open'
              ? 'No errors to show. Set up the SDK to start capturing.'
              : `No ${state} errors found.`
        }}
      </p>
      <UButton
        v-if="state === 'open' && !search"
        icon="i-lucide-book-open"
        label="View setup guide"
        variant="soft"
        size="sm"
        class="mt-4"
        :to="`/projects/${projectId}/setup`"
      />
    </div>

    <!-- Error list -->
    <div
      v-else
      class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800"
    >
      <NuxtLink
        v-for="error in errors"
        :key="error.id"
        :to="`/projects/${projectId}/errors/${error.id}`"
        class="group flex items-start gap-4 px-5 py-5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
      >
        <!-- Selection; the label keeps clicks from navigating to the error -->
        <label class="-m-2 p-2 shrink-0 cursor-pointer" @click.stop>
          <UCheckbox
            :model-value="selected.includes(error.id)"
            :aria-label="`Select ${error.value || error.title}`"
            class="mt-[3px]"
            @update:model-value="toggle(error.id, $event)"
          />
        </label>

        <!-- Colored status dot -->
        <div class="mt-1.5 shrink-0">
          <span
            class="block w-3 h-3 rounded-full"
            :class="{
              'bg-orange-500 shadow-[0_0_0_3px] shadow-orange-500/20': error.state === 'open',
              'bg-emerald-500 shadow-[0_0_0_3px] shadow-emerald-500/20': error.state === 'resolved',
              'bg-slate-300 dark:bg-zinc-600': error.state === 'ignored',
            }"
          />
        </div>

        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="font-semibold text-base text-slate-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 sm:line-clamp-1 wrap-break-word"
            >
              {{ error.value || error.title }}
            </span>
            <UBadge v-if="isNew(error)" color="orange" variant="subtle" size="xs" class="shrink-0">New</UBadge>
            <UTooltip
              v-else-if="error.state === 'open' && error.regressedAt"
              :text="`Reopened after resolve ${timeAgo(error.regressedAt)} ago`"
            >
              <UBadge color="red" variant="subtle" size="xs" class="shrink-0">Regressed</UBadge>
            </UTooltip>
          </div>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-zinc-400 font-mono truncate">
            <span class="font-semibold text-slate-600 dark:text-zinc-300">{{ error.title }}</span>
            <template v-if="error.culprit">
              <span class="text-slate-300 dark:text-zinc-600 mx-1.5">·</span>{{ error.culprit }}
            </template>
          </p>
          <div class="flex items-center gap-3 mt-2 flex-wrap">
            <UTooltip :text="formatAbsolute(error.createdAt)">
              <span class="text-sm text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 cursor-default">
                <Icon name="i-lucide-clock" class="w-4 h-4" />
                First seen {{ timeAgo(error.createdAt) }} ago
              </span>
            </UTooltip>
            <UTooltip :text="formatAbsolute(error.lastOccurrence)">
              <span class="text-sm text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 cursor-default">
                <Icon name="i-lucide-refresh-cw" class="w-4 h-4" />
                Last seen {{ timeAgo(error.lastOccurrence) }} ago
              </span>
            </UTooltip>
          </div>
        </div>

        <!-- 14-day trend -->
        <div class="hidden sm:block shrink-0 self-center">
          <UTooltip text="Events in the last 14 days">
            <Sparkline :data="error.trend" class="w-28 h-7" />
          </UTooltip>
        </div>

        <!-- Events count -->
        <div class="shrink-0 text-right w-16">
          <div class="text-2xl font-bold text-slate-800 dark:text-zinc-200 tabular-nums leading-none">
            {{ error.events }}
          </div>
          <div class="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">events</div>
        </div>

        <!-- Arrow -->
        <Icon
          name="i-lucide-chevron-right"
          class="w-5 h-5 text-slate-300 dark:text-zinc-600 group-hover:text-orange-400 transition-colors shrink-0 self-center"
        />
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="(response?.pages ?? 0) > 1" class="flex items-center justify-between gap-2">
      <UButton
        icon="i-lucide-chevron-left"
        label="Previous"
        color="gray"
        variant="outline"
        size="sm"
        :disabled="page === 1"
        @click="page--"
      />

      <div class="flex items-center gap-1">
        <button
          v-for="p in response.pages"
          :key="p"
          class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
          :class="
            p === page
              ? 'bg-orange-500 text-white'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          "
          @click="page = p"
        >
          {{ p }}
        </button>
      </div>

      <UButton
        label="Next"
        icon="i-lucide-chevron-right"
        icon-position="right"
        color="gray"
        variant="outline"
        size="sm"
        :disabled="page === response.pages"
        @click="page++"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const state = ref<'open' | 'resolved' | 'ignored'>('open');
const sort = ref<'lastSeen' | 'firstSeen' | 'events'>('lastSeen');
const search = ref('');
const debouncedSearch = ref('');
const page = ref(1);
const LIMIT = 20;
const projectId = computed(() => route.params.projectId);

const tabs = [
  { label: 'Open', value: 'open' as const },
  { label: 'Resolved', value: 'resolved' as const },
  { label: 'Ignored', value: 'ignored' as const },
];

const sortOptions = [
  { label: 'Last seen', value: 'lastSeen' as const, icon: 'i-lucide-clock' },
  { label: 'First seen', value: 'firstSeen' as const, icon: 'i-lucide-calendar' },
  { label: 'Events', value: 'events' as const, icon: 'i-lucide-bar-chart-2' },
];

// Debounce search so we don't hit the API on every keystroke
let searchTimer: ReturnType<typeof setTimeout>;
watch(search, (val) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val;
  }, 300);
});

// Reset to page 1 when filters change
watch([state, sort, debouncedSearch], () => {
  page.value = 1;
});

const { data: response, refresh: refreshErrors } = await useFetch(() => `/api/projects/${projectId.value}/errors`, {
  query: computed(() => ({
    state: state.value,
    sort: sort.value,
    search: debouncedSearch.value || undefined,
    page: page.value,
    limit: LIMIT,
  })),
  default: () => ({ items: [], total: 0, page: 1, limit: LIMIT, pages: 0 }),
  watch: [state, sort, debouncedSearch, page],
});

const errors = computed(() => response.value?.items ?? []);

// selection only spans the current page, so drop it whenever the page content changes
const selected = ref<number[]>([]);
watch(errors, () => {
  selected.value = [];
});

const allSelected = computed(() => errors.value.length > 0 && selected.value.length === errors.value.length);

function toggle(id: number, checked: boolean) {
  selected.value = checked ? [...selected.value, id] : selected.value.filter((s) => s !== id);
}

function toggleAll(checked: boolean) {
  selected.value = checked ? errors.value.map((e) => e.id) : [];
}

const { add: addToast } = useToast();

const updating = ref(false);
async function changeSelectedState(newState: 'open' | 'resolved' | 'ignored') {
  updating.value = true;
  try {
    const { updated } = await $fetch(`/api/projects/${projectId.value}/errors`, {
      method: 'PATCH',
      body: { ids: selected.value, state: newState },
    });
    await refreshErrors();
    const titles = { resolved: 'resolved', ignored: 'ignored', open: 'reopened' };
    const colors = { resolved: 'green' as const, ignored: 'gray' as const, open: 'orange' as const };
    addToast({ title: `${updated} error${updated !== 1 ? 's' : ''} ${titles[newState]}`, color: colors[newState] });
  } catch {
    addToast({ title: 'Something went wrong', description: 'Failed to update errors.', color: 'red' });
  } finally {
    updating.value = false;
  }
}

function isNew(error: { createdAt: string | Date }) {
  return Date.now() - new Date(error.createdAt).getTime() < 24 * 60 * 60 * 1000;
}

const { data: activity } = await useFetch<{ date: string; count: number }[]>(
  () => `/api/projects/${projectId.value}/activity`,
  { default: () => [] },
);

const totalEvents30d = computed(() => activity.value?.reduce((sum, d) => sum + d.count, 0) ?? 0);
const eventsToday = computed(() => activity.value?.at(-1)?.count ?? 0);
const dailyAverage = computed(() =>
  activity.value?.length ? Math.round(totalEvents30d.value / activity.value.length) : 0,
);
function formatDay(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
const peakDay = computed(() =>
  activity.value?.length ? activity.value.reduce((max, d) => (d.count > max.count ? d : max)) : null,
);
</script>
