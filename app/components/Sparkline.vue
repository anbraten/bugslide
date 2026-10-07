<template>
  <svg :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`" preserveAspectRatio="none" class="block" aria-hidden="true">
    <rect
      v-for="(bar, i) in bars"
      :key="i"
      :x="bar.x"
      :y="VIEW_H - bar.h"
      :width="bar.w"
      :height="bar.h"
      rx="1"
      :class="bar.count > 0 ? 'fill-orange-400/70 dark:fill-orange-400/60' : 'fill-slate-200 dark:fill-zinc-700'"
    />
  </svg>
</template>

<script lang="ts" setup>
const props = defineProps<{
  data: number[];
}>();

const VIEW_W = 100;
const VIEW_H = 24;
const GAP = 1.5;

const bars = computed(() => {
  const max = Math.max(...props.data, 1);
  const barW = VIEW_W / Math.max(props.data.length, 1);

  return props.data.map((count, i) => ({
    x: i * barW + GAP / 2,
    w: Math.max(1, barW - GAP),
    h: count > 0 ? Math.max(3, (count / max) * VIEW_H) : 1.5,
    count,
  }));
});
</script>
