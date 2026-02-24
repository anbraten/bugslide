<template>
  <div class="flex flex-col gap-4">
    <!-- Toolbar: status tabs + search -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <!-- Status tabs -->
      <div class="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="
            state === tab.value
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm'
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

      <!-- Search -->
      <div class="relative sm:ml-auto w-full sm:w-64">
        <Icon
          name="i-lucide-search"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Search errors…"
          class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Count -->
    <p class="text-sm text-slate-500 dark:text-zinc-400 -mt-1">
      {{ filteredErrors.length }} {{ state }} error{{ filteredErrors.length !== 1 ? 's' : '' }}
      <span v-if="search">
        matching <em class="not-italic font-medium text-slate-700 dark:text-zinc-300">"{{ search }}"</em></span
      >
    </p>

    <!-- Empty state -->
    <div
      v-if="filteredErrors.length === 0"
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
        v-for="error in filteredErrors"
        :key="error.id"
        :to="`/projects/${projectId}/errors/${error.id}`"
        class="group flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
      >
        <!-- Colored status dot -->
        <div class="mt-1.5 shrink-0">
          <span
            class="block w-2.5 h-2.5 rounded-full"
            :class="{
              'bg-orange-500 shadow-[0_0_0_3px] shadow-orange-500/20': error.state === 'open',
              'bg-emerald-500 shadow-[0_0_0_3px] shadow-emerald-500/20': error.state === 'resolved',
              'bg-slate-300 dark:bg-zinc-600': error.state === 'ignored',
            }"
          />
        </div>

        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 flex-wrap">
            <span
              class="font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
            >
              {{ error.title }}
            </span>
          </div>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-zinc-400 line-clamp-1">{{ error.value }}</p>
          <div class="flex items-center gap-3 mt-2 flex-wrap">
            <span class="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Icon name="i-lucide-clock" class="w-3 h-3" />
              First seen {{ timeAgo(error.createdAt) }} ago
            </span>
            <span class="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Icon name="i-lucide-refresh-cw" class="w-3 h-3" />
              Last seen {{ timeAgo(error.lastOccurrence) }} ago
            </span>
          </div>
        </div>

        <!-- Events count -->
        <div class="shrink-0 text-right">
          <div class="text-xl font-bold text-slate-800 dark:text-zinc-200 tabular-nums leading-none">
            {{ error.events }}
          </div>
          <div class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">events</div>
        </div>

        <!-- Arrow -->
        <Icon
          name="i-lucide-chevron-right"
          class="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-orange-400 transition-colors shrink-0 self-center"
        />
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const state = ref<'open' | 'resolved' | 'ignored'>('open');
const search = ref('');
const projectId = computed(() => route.params.projectId);

const tabs = [
  { label: 'Open', value: 'open' as const },
  { label: 'Resolved', value: 'resolved' as const },
  { label: 'Ignored', value: 'ignored' as const },
];

const { data: errors } = await useFetch(() => `/api/projects/${projectId.value}/errors`, {
  query: computed(() => ({ state: state.value })),
  default: () => [],
  watch: [state],
});

const filteredErrors = computed(() => {
  if (!search.value.trim()) return errors.value;
  const q = search.value.toLowerCase();
  return errors.value.filter((e: any) => e.title?.toLowerCase().includes(q) || e.value?.toLowerCase().includes(q));
});
</script>
