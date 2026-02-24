<template>
  <select
    :value="modelValue"
    v-bind="$attrs"
    class="block rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="opt in normalizedOptions" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
type SelectOption = { label: string; value: string } | string;

const props = defineProps<{
  modelValue?: string;
  options?: SelectOption[];
}>();

defineEmits(['update:modelValue']);

const normalizedOptions = computed(() =>
  (props.options ?? []).map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt)),
);
</script>
