<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
    <header
      class="sticky top-0 z-30 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs"
    >
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center gap-1.5">
        <router-link
          class="flex shrink-0 items-center gap-2 font-bold text-slate-900 dark:text-zinc-100 hover:opacity-80 transition-opacity"
          to="/"
          aria-label="BugSlide"
        >
          <span class="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg">
            <Icon name="i-lucide-flame" class="w-5 h-5 text-white" />
          </span>
          <!-- inside a project the trail needs the room on small screens -->
          <span class="text-lg tracking-tight" :class="{ 'hidden sm:inline': projectId }">BugSlide</span>
        </router-link>

        <nav v-if="projectId" class="flex items-center gap-1.5 min-w-0 ml-1.5" aria-label="Breadcrumb">
          <span class="shrink-0 text-lg font-light text-slate-300 dark:text-zinc-700" aria-hidden="true">/</span>
          <ProjectSwitcher :project-id="projectId" />
          <template v-if="detailCrumb">
            <span class="shrink-0 text-lg font-light text-slate-300 dark:text-zinc-700" aria-hidden="true">/</span>
            <span
              class="truncate font-mono text-[13px] font-medium text-slate-900 dark:text-zinc-100"
              :title="detailCrumb.title"
            >
              {{ detailCrumb.label }}
            </span>
          </template>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-1">
          <ColorMode />

          <UDropdown v-if="user" :items="items" :popper="{ placement: 'bottom-start' }">
            <button
              class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
            >
              <UAvatar :src="user?.avatarUrl ?? ''" class="w-7 h-7" />
              <span class="hidden sm:block">{{ user?.email?.split('@')[0] }}</span>
              <Icon name="i-lucide-chevron-down" class="w-4 h-4" />
            </button>

            <template #account="{ item }">
              <div class="px-1 py-0.5">
                <p class="text-xs text-slate-400 dark:text-zinc-500">Signed in as</p>
                <p class="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">{{ item.label }}</p>
              </div>
            </template>
          </UDropdown>
        </div>
      </div>

      <div v-if="projectId" class="max-w-7xl mx-auto px-1.5">
        <ProjectTabs :project-id="projectId" />
      </div>
    </header>

    <main class="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
      <slot />
    </main>

    <footer class="py-4 text-center text-sm text-slate-400 dark:text-zinc-600"><a href="https://github.com/anbraten/bugslide" target="_blank" rel="noopener" class="hover:underline">Built with ❤️</a></footer>

    <UNotifications />
  </div>
</template>

<script setup lang="ts">
const { user, logout } = await useAuth();

const route = useRoute();

// The route changes before the new page has finished loading, so following it directly would
// show the project tabs above the old page and push it down. Switch together with the page.
const params = shallowRef({ ...route.params });
onScopeDispose(
  useNuxtApp().hook('page:finish', () => {
    params.value = { ...route.params };
  }),
);

const projectId = computed(() => (params.value.projectId ? String(params.value.projectId) : undefined));

// the tabs already say which section we're in, so detail pages only add their own id
const detailCrumb = computed(() => {
  if (params.value.errorId) {
    return { label: `#${params.value.errorId}`, title: undefined };
  }
  if (params.value.releaseId) {
    const release = String(params.value.releaseId);
    return { label: shortRelease(release), title: release };
  }
  return undefined;
});

const items = computed(() => [
  [
    {
      label: user.value?.email ?? '...',
      slot: 'account',
      disabled: true,
    },
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
    {
      label: 'GitHub',
      icon: 'i-ion-logo-github',
      to: 'https://github.com/anbraten/bugslide',
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-heroicons-arrow-left-on-rectangle',
      click: logout,
    },
  ],
]);
</script>
