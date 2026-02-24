<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled"
    v-bind="$attrs"
    :class="classes"
    @click="$emit('click', $event)"
  >
    <Icon v-if="icon && iconPosition === 'left'" :name="icon" class="w-4 h-4 flex-shrink-0" />
    <span v-if="label">{{ label }}</span>
    <slot />
    <Icon v-if="icon && iconPosition === 'right'" :name="icon" class="w-4 h-4 flex-shrink-0" />
  </component>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const NuxtLink = resolveComponent('NuxtLink');
const props = defineProps<{
  label?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  color?: 'primary' | 'gray' | 'green' | 'red' | 'white';
  variant?: 'solid' | 'ghost' | 'outline' | 'soft';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  to?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}>();

defineEmits(['click']);

const iconPosition = computed(() => props.iconPosition ?? 'left');

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 disabled:opacity-40 disabled:pointer-events-none cursor-pointer';

  const sizes: Record<string, string> = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  const color = props.color ?? 'primary';
  const variant = props.variant ?? 'solid';

  const colorVariantMap: Record<string, Record<string, string>> = {
    primary: {
      solid: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500 shadow-sm',
      ghost:
        'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 focus-visible:ring-orange-500',
      outline:
        'border border-orange-400 text-orange-600 hover:bg-orange-50 dark:border-orange-500/50 dark:text-orange-400 dark:hover:bg-orange-500/10',
      soft: 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20',
    },
    gray: {
      solid:
        'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 focus-visible:ring-slate-400 shadow-sm',
      ghost:
        'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 focus-visible:ring-slate-400',
      outline:
        'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
      soft: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
    },
    green: {
      solid: 'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500 shadow-sm',
      ghost: 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
      outline:
        'border border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/50',
      soft: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400',
    },
    red: {
      solid: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-sm',
      ghost: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10',
      outline: 'border border-red-500 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-500/50',
      soft: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400',
    },
    white: {
      solid: 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm',
      ghost: 'text-white hover:bg-white/10',
      outline: 'border border-white/30 text-white hover:bg-white/10',
      soft: 'bg-white/10 text-white hover:bg-white/20',
    },
  };

  const sizeClass = sizes[props.size ?? 'md'];
  const colorClass =
    colorVariantMap[color]?.[variant] ??
    'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700';

  return [base, sizeClass, colorClass];
});
</script>
