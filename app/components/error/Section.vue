<template>
  <section class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
    <header
      class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-zinc-800"
    >
      <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
        <Icon v-if="icon" :name="icon" class="w-4 h-4 text-slate-400 dark:text-zinc-500" />
        {{ title }}
        <span v-if="count !== undefined" class="text-xs font-normal text-slate-400 dark:text-zinc-500 tabular-nums">
          {{ count }}
        </span>
      </h2>
      <div class="ml-auto flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <div :class="flush ? '' : 'p-4 sm:p-5'">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  icon?: string;
  count?: number;
  // content brings its own padding, e.g. full-width lists
  flush?: boolean;
}>();
</script>
