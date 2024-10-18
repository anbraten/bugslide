<template>
  <div class="flex flex-col w-full h-screen">
    <header class="flex gap-4 p-4 w-full">
      <router-link class="flex items-center gap-2" to="/">
        <UIcon name="i-heroicons-fire-16-solid" class="w-5 h-5" />
        <h1 class="text-xl">Bugslide</h1>
      </router-link>

      <UInput placeholder="Search for errors ..." size="lg" class="flex-grow max-w-2xl mx-auto" />

      <div class="ml-auto">
        <ColorMode />
      </div>
    </header>

    <main class="p-4">
      <slot />
    </main>

    <footer class="p-4 mt-auto w-full flex">
      <p class="mx-auto">Build with &lt;3</p>
    </footer>

    <UNotifications />
  </div>
</template>

<style>
/* @media (prefers-color-scheme: dark) {
  :root {
    --theme: rgb(29, 30, 32);
  }
} */

body {
  font-family: -apple-system, BlinkMacSystemFont, segoe ui, Roboto, Oxygen, Ubuntu, Cantarell, open sans, helvetica neue,
    sans-serif;
  @apply bg-neutral-100 dark:bg-neutral-900;
}
</style>
