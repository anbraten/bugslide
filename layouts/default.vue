<template>
  <div class="flex flex-col w-full h-screen">
    <header class="flex gap-4 p-4 w-full">
      <router-link class="flex items-center gap-2" to="/">
        <UIcon name="i-heroicons-fire-16-solid" class="w-5 h-5" />
        <h1 class="text-xl">Bugslide</h1>
      </router-link>

      <UInput placeholder="Search for errors ..." size="lg" class="flex-grow max-w-2xl mx-auto" />

      <div class="ml-auto flex items-center gap-2">
        <ColorMode />
        <UDropdown
          v-if="user"
          :items="items"
          :ui="{ item: { disabled: 'cursor-text select-text' } }"
          :popper="{ placement: 'bottom-start' }"
        >
          <UAvatar :src="user?.avatarUrl ?? ''" />

          <template #account="{ item }">
            <div class="text-left">
              <p>Signed in as</p>
              <p class="truncate font-medium text-gray-900 dark:text-white">
                {{ item.label }}
              </p>
            </div>
          </template>

          <template #item="{ item }">
            <span class="truncate">{{ item.label }}</span>

            <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto" />
          </template>
        </UDropdown>
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
