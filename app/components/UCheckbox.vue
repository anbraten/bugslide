<template>
  <input
    type="checkbox"
    :checked="modelValue"
    v-bind="$attrs"
    class="h-4 w-4 rounded border-slate-300 dark:border-zinc-600 text-orange-500 focus:ring-orange-500 dark:bg-zinc-800 cursor-pointer"
    @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean;
}>();

defineEmits(['update:modelValue']);
</script>
