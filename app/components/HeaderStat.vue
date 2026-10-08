<template>
  <div
    class="min-w-0 flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl"
  >
    <div
      v-if="icon"
      class="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
    >
      <Icon :name="icon" class="w-4 h-4" />
    </div>
    <div class="min-w-0 flex-1">
      <dt class="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">{{ label }}</dt>
      <dd
        class="mt-0.5 min-w-0 text-xl font-semibold leading-7 text-slate-900 dark:text-zinc-100 tabular-nums truncate"
      >
        <slot />
      </dd>
      <dd v-if="$slots.sub" class="min-w-0 text-xs text-slate-500 dark:text-zinc-400 truncate">
        <slot name="sub" />
      </dd>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  icon?: string;
}>();
</script>
