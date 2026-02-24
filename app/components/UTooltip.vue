<template>
  <div class="relative inline-flex group">
    <slot />
    <div
      class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    >
      <div
        class="bg-zinc-900 dark:bg-zinc-700 text-zinc-100 text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap max-w-xs shadow-lg"
      >
        {{ text }}
      </div>
      <div class="w-2 h-2 bg-zinc-900 dark:bg-zinc-700 rotate-45 mx-auto -mt-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
}>();
</script>
