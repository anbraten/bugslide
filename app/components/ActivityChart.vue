<template>
  <div class="flex flex-col gap-1.5">
    <div
      ref="container"
      class="relative select-none cursor-crosshair"
      @mousemove="onMouseMove"
      @mouseleave="hoveredIndex = null"
    >
      <!-- Bar chart -->
      <svg viewBox="0 0 300 56" preserveAspectRatio="none" class="w-full" style="height: 56px; display: block">
        <rect
          v-for="(bar, i) in bars"
          :key="i"
          :x="bar.x"
          :y="56 - bar.h"
          :width="bar.w"
          :height="bar.h"
          rx="1.5"
          :class="[
            'transition-colors duration-75',
            hoveredIndex === i ? 'fill-orange-500 dark:fill-orange-400' : 'fill-orange-400/40 dark:fill-orange-400/30',
          ]"
        />
      </svg>

      <!-- Tooltip -->
      <div v-if="hoveredItem" class="absolute bottom-full mb-2 pointer-events-none z-10" :style="tooltipStyle">
        <div
          class="bg-slate-900 dark:bg-zinc-700 text-white text-xs rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg"
        >
          <span class="font-semibold">{{ hoveredItem.count }}</span>
          <span class="text-slate-300 dark:text-zinc-300 ml-1"> event{{ hoveredItem.count !== 1 ? 's' : '' }} </span>
          <div class="text-slate-400 dark:text-zinc-400 mt-0.5">{{ formatDate(hoveredItem.date) }}</div>
        </div>
      </div>
    </div>

    <!-- X-axis labels -->
    <div class="flex justify-between text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
      <span>30d ago</span>
      <span>Today</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  data: { date: string; count: number }[];
}>();

const container = ref<HTMLElement | null>(null);
const hoveredIndex = ref<number | null>(null);
const hoveredItem = computed(() => (hoveredIndex.value !== null ? (props.data[hoveredIndex.value] ?? null) : null));

const BAR_COUNT = 30;
const VIEW_W = 300;
const VIEW_H = 56;
const GAP = 2;

const bars = computed(() => {
  const maxCount = Math.max(...props.data.map((d) => d.count), 1);
  const barW = VIEW_W / BAR_COUNT;

  return props.data.map((d, i) => ({
    x: i * barW + GAP / 2,
    w: Math.max(1, barW - GAP),
    h: Math.max(2, (d.count / maxCount) * VIEW_H),
    count: d.count,
    date: d.date,
  }));
});

const tooltipStyle = computed(() => {
  if (hoveredIndex.value === null) return {};
  const pct = ((hoveredIndex.value + 0.5) / BAR_COUNT) * 100;
  // Clamp so the tooltip doesn't go offscreen
  const clampedPct = Math.max(5, Math.min(95, pct));
  return {
    left: `${clampedPct}%`,
    transform: 'translateX(-50%)',
  };
});

function onMouseMove(e: MouseEvent) {
  const el = container.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const idx = Math.floor((x / rect.width) * BAR_COUNT);
  hoveredIndex.value = Math.max(0, Math.min(BAR_COUNT - 1, idx));
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>
