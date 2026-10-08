<template>
  <!-- scrolls sideways on narrow screens, without showing a scrollbar -->
  <nav
    class="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    v-bind="$attrs"
  >
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="group relative shrink-0 pb-2 text-sm font-medium transition-colors focus-visible:outline-hidden"
      :class="
        isActive(link)
          ? 'text-slate-900 dark:text-zinc-100'
          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
      "
    >
      <span
        class="flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-zinc-800 group-focus-visible:ring-2 group-focus-visible:ring-orange-500"
      >
        <Icon v-if="link.icon" :name="link.icon" class="w-4 h-4 shrink-0" />
        {{ link.label }}
        <span
          v-if="link.badge !== undefined && link.badge !== 0"
          class="min-w-[1.25rem] rounded px-1 text-center text-xs tabular-nums"
          :class="
            isActive(link)
              ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
          "
        >
          {{ link.badge }}
        </span>
      </span>
      <span
        v-if="isActive(link)"
        class="absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-orange-500"
        aria-hidden="true"
      />
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
  // further path prefixes that belong to this link, e.g. detail pages
  activeFor?: string[];
  badge?: number;
};

defineProps<{
  links?: NavLink[];
}>();

const route = useRoute();

function isActive(link: NavLink): boolean {
  if (link.activeFor?.some((prefix) => route.path.startsWith(prefix))) {
    return true;
  }
  if (link.exact) {
    return route.path === link.to;
  }
  return route.path.startsWith(link.to);
}
</script>
