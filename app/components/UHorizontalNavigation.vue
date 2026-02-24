<template>
  <nav class="flex items-center gap-0.5" v-bind="$attrs">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :exact="link.exact"
      class="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
      :class="
        isActive(link)
          ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
      "
    >
      <Icon v-if="link.icon" :name="link.icon" class="w-4 h-4 flex-shrink-0" />
      <span>{{ link.label }}</span>
      <span
        v-if="link.badge !== undefined && link.badge !== 0"
        class="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-xs font-semibold rounded-full"
        :class="
          isActive(link)
            ? 'bg-orange-200 dark:bg-orange-500/30 text-orange-700 dark:text-orange-300'
            : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
        "
      >
        {{ link.badge }}
      </span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

type NavLink = {
  label: string;
  icon?: string;
  to: string;
  exact?: boolean;
  badge?: number;
};

defineProps<{
  links?: NavLink[];
}>();

const route = useRoute();

function isActive(link: NavLink): boolean {
  if (link.exact) {
    return route.path === link.to;
  }
  return route.path.startsWith(link.to);
}
</script>
