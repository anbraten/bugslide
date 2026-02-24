<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  color?: 'orange' | 'green' | 'gray' | 'blue' | 'red' | 'primary';
  variant?: 'solid' | 'subtle' | 'outline';
  size?: 'xs' | 'sm' | 'md';
}>();

const classes = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full whitespace-nowrap';

  const sizes: Record<string, string> = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  const color = props.color ?? 'gray';
  const variant = props.variant ?? 'subtle';

  const colorVariantMap: Record<string, Record<string, string>> = {
    orange: {
      solid: 'bg-orange-500 text-white',
      subtle:
        'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400 ring-1 ring-inset ring-orange-400/30 dark:ring-orange-500/30',
      outline: 'ring-1 ring-inset ring-orange-400 text-orange-700 dark:ring-orange-500/50 dark:text-orange-400',
    },
    green: {
      solid: 'bg-emerald-500 text-white',
      subtle:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-1 ring-inset ring-emerald-400/30 dark:ring-emerald-500/30',
      outline: 'ring-1 ring-inset ring-emerald-400 text-emerald-700 dark:ring-emerald-500/50 dark:text-emerald-400',
    },
    gray: {
      solid: 'bg-slate-500 text-white dark:bg-zinc-600',
      subtle:
        'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 ring-1 ring-inset ring-slate-300 dark:ring-zinc-700',
      outline: 'ring-1 ring-inset ring-slate-400 text-slate-700 dark:ring-zinc-600 dark:text-zinc-400',
    },
    blue: {
      solid: 'bg-blue-500 text-white',
      subtle:
        'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 ring-1 ring-inset ring-blue-400/30 dark:ring-blue-500/30',
      outline: 'ring-1 ring-inset ring-blue-400 text-blue-700 dark:ring-blue-500/50 dark:text-blue-400',
    },
    red: {
      solid: 'bg-red-500 text-white',
      subtle:
        'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-1 ring-inset ring-red-400/30 dark:ring-red-500/30',
      outline: 'ring-1 ring-inset ring-red-400 text-red-700 dark:ring-red-500/50 dark:text-red-400',
    },
    primary: {
      solid: 'bg-orange-500 text-white',
      subtle:
        'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400 ring-1 ring-inset ring-orange-400/30',
      outline: 'ring-1 ring-inset ring-orange-400 text-orange-700 dark:ring-orange-500/50 dark:text-orange-400',
    },
  };

  const sizeClass = sizes[props.size ?? 'sm'];
  const colorClass =
    colorVariantMap[color]?.[variant] ?? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400';
  return [base, sizeClass, colorClass];
});
</script>
