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

        <div class="ml-auto">
          <ColorMode />
        </div>
      </div>
    </header>

    <main class="flex-1 flex items-center justify-center p-6">
      <slot />
    </main>

    <footer class="py-4 text-center text-sm text-slate-400 dark:text-zinc-600">Built with ❤️</footer>

    <UNotifications />
  </div>
</template>

<style>
body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
    sans-serif;
  @apply bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased;
}
</style>
