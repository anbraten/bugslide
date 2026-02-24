<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
    <header
      class="sticky top-0 z-30 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm"
    >
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <router-link
          class="flex items-center gap-2 font-bold text-slate-900 dark:text-zinc-100 hover:opacity-80 transition-opacity"
          to="/"
        >
          <span class="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg">
            <Icon name="i-lucide-flame" class="w-5 h-5 text-white" />
          </span>
          <span class="text-lg tracking-tight">BugSlide</span>
        </router-link>

        <div class="ml-auto flex items-center gap-1">
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
    </header>

    <main class="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
      <slot />
    </main>

    <footer class="py-4 text-center text-sm text-slate-400 dark:text-zinc-600">Built with ❤️</footer>

    <UNotifications />
  </div>
</template>

<script setup lang="ts">
const { user, logout } = await useAuth();

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
