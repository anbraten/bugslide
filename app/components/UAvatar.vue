<template>
  <div
    class="relative inline-flex items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0"
    v-bind="$attrs"
  >
    <img v-if="src" :src="src" :alt="alt ?? ''" class="w-full h-full object-cover" @error="imgError = true" />
    <span v-if="!src || imgError" class="text-sm font-medium text-slate-600 dark:text-zinc-300">
      {{ initials }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  src?: string;
  alt?: string;
}>();

const imgError = ref(false);
const initials = computed(() => {
  if (!props.alt) return '?';
  return props.alt
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});
</script>
