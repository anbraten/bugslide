<template>
  <div ref="container" class="relative min-w-0">
    <button
      type="button"
      class="flex items-center gap-2 min-w-0 rounded-md px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500"
      :class="open ? 'bg-slate-100 dark:bg-zinc-800' : ''"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <span
        class="flex items-center justify-center w-5 h-5 shrink-0 rounded bg-orange-500 text-[11px] font-bold uppercase text-white"
        aria-hidden="true"
      >
        {{ project?.name?.charAt(0) ?? '' }}
      </span>
      <span class="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
        {{ project?.name ?? '...' }}
      </span>
      <Icon name="i-lucide-chevrons-up-down" class="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="open"
        class="absolute left-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] origin-top-left bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden"
        role="menu"
      >
        <p class="px-3 pt-2.5 pb-1 text-xs font-medium text-slate-400 dark:text-zinc-500">Projects</p>

        <div class="max-h-72 overflow-y-auto p-1">
          <template v-if="projects.length">
            <NuxtLink
              v-for="p in projects"
              :key="p.id"
              :to="switchTo(p.id)"
              role="menuitem"
              class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors"
              :class="
                p.id === Number(projectId)
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                  : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
              "
              @click="open = false"
            >
              <span
                class="flex items-center justify-center w-5 h-5 shrink-0 rounded text-[11px] font-bold uppercase"
                :class="
                  p.id === Number(projectId)
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                "
                aria-hidden="true"
              >
                {{ p.name?.charAt(0) }}
              </span>
              <span class="truncate flex-1">{{ p.name }}</span>
              <span
                v-if="p.openErrors > 0"
                class="shrink-0 text-xs tabular-nums text-slate-400 dark:text-zinc-500"
                :title="`${p.openErrors} open issues`"
              >
                {{ p.openErrors }}
              </span>
              <Icon
                v-if="p.id === Number(projectId)"
                name="i-lucide-check"
                class="w-4 h-4 shrink-0 text-orange-500"
              />
            </NuxtLink>
          </template>
          <div v-else-if="status !== 'success'" class="flex flex-col gap-1">
            <div v-for="i in 3" :key="i" class="h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        <div class="border-t border-slate-100 dark:border-zinc-800 p-1">
          <NuxtLink
            to="/"
            role="menuitem"
            class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            @click="open = false"
          >
            <Icon name="i-lucide-layout-grid" class="w-4 h-4 shrink-0 text-slate-400 dark:text-zinc-500" />
            All projects
          </NuxtLink>
          <NuxtLink
            to="/projects/create"
            role="menuitem"
            class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            @click="open = false"
          >
            <Icon name="i-lucide-plus" class="w-4 h-4 shrink-0 text-slate-400 dark:text-zinc-500" />
            New project
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  projectId: string;
}>();

const route = useRoute();

// not awaited: the project page already loaded this, so it renders right away
const {
  project: { data: project },
} = useProjectHeader(() => props.projectId);

// the list carries stats per project, so only load it once the menu is opened
const {
  data: projects,
  status,
  execute: loadProjects,
} = useFetch('/api/projects', {
  key: 'project-switcher',
  server: false,
  immediate: false,
  default: () => [],
});

const open = ref(false);
const container = ref<HTMLElement | null>(null);

function toggle() {
  open.value = !open.value;
  if (open.value && status.value === 'idle') {
    loadProjects();
  }
}

// stay in the same section when switching, detail pages fall back to their list
function switchTo(id: number) {
  const base = `/projects/${id}`;
  const section = route.path.split('/')[3];
  if (section === 'releases' || section === 'settings') {
    return `${base}/${section}`;
  }
  return base;
}

watch(
  () => route.fullPath,
  () => {
    open.value = false;
  },
);

function onDocumentClick(event: Event) {
  if (container.value && !container.value.contains(event.target as Node)) {
    open.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeydown);
});
</script>
