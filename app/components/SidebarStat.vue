<template>
  <div class="min-w-0 px-4 py-3">
    <dt class="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
      <Icon v-if="icon" :name="icon" class="w-3.5 h-3.5" /> {{ label }}
    </dt>
    <dd class="mt-0.5 text-base font-semibold text-slate-900 dark:text-zinc-100 tabular-nums truncate">
      <slot />
    </dd>
    <dd v-if="$slots.sub" class="min-w-0 text-xs text-slate-500 dark:text-zinc-400 truncate">
      <slot name="sub" />
    </dd>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  icon?: string;
}>();
</script>
