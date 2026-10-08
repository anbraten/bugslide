<template>
  <div class="min-w-0">
    <button
      type="button"
      class="w-full text-left group"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <div class="flex items-baseline gap-2 mb-1.5">
        <span class="text-sm font-medium text-slate-700 dark:text-zinc-300">{{ tag.key }}</span>
        <span class="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
          {{ tag.distinct }} value{{ tag.distinct !== 1 ? 's' : '' }}
        </span>
        <Icon
          name="i-lucide-chevron-down"
          class="ml-auto w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform group-hover:text-slate-600 dark:group-hover:text-zinc-300"
          :class="expanded ? 'rotate-180' : ''"
        />
      </div>

      <!-- stacked share of the top values -->
      <div class="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <div
          v-for="(segment, i) in segments"
          :key="segment.value"
          class="h-full"
          :class="i < colors.length ? colors[i] : otherColor"
          :style="{ width: `${segment.pct}%` }"
          :title="`${segment.value}: ${formatPct(segment.pct)}`"
        />
      </div>
    </button>

    <ul class="mt-2 space-y-1">
      <li v-for="(item, i) in listed" :key="item.value" class="flex items-center gap-2 text-xs">
        <span class="w-2 h-2 rounded-full shrink-0" :class="i < colors.length ? colors[i] : otherColor" />
        <span class="flex-1 min-w-0 truncate text-slate-700 dark:text-zinc-300 font-mono" :title="item.value">
          {{ item.value }}
        </span>
        <span class="text-slate-500 dark:text-zinc-400 tabular-nums">{{ formatPct(item.pct) }}</span>
      </li>
      <li v-if="!expanded && hidden > 0" class="text-xs text-slate-400 dark:text-zinc-500 pl-4">
        + {{ hidden }} more
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { TagDistribution } from '#shared/types/error-summary';

const props = defineProps<{
  tag: TagDistribution;
}>();

const colors = ['bg-orange-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-400'];
const otherColor = 'bg-slate-300 dark:bg-zinc-600';

const COLLAPSED_COUNT = 3;
const expanded = ref(false);

const values = computed(() =>
  props.tag.values.map((v) => ({ ...v, pct: props.tag.total > 0 ? (v.count / props.tag.total) * 100 : 0 })),
);

const segments = computed(() => {
  const top = values.value.slice(0, colors.length);
  const rest = 100 - top.reduce((sum, v) => sum + v.pct, 0);
  return rest > 0.05 ? [...top, { value: 'Other', count: 0, pct: rest }] : top;
});

const listed = computed(() => (expanded.value ? values.value : values.value.slice(0, COLLAPSED_COUNT)));
const hidden = computed(() => props.tag.distinct - listed.value.length);

function formatPct(pct: number) {
  return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
}
</script>
