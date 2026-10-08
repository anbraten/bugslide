<template>
  <span class="relative inline-flex w-[18px] h-[18px] shrink-0" :class="$attrs.class">
    <input
      type="checkbox"
      :checked="modelValue"
      :indeterminate="indeterminate"
      v-bind="{ ...$attrs, class: undefined }"
      class="peer appearance-none w-full h-full rounded-[5px] border-[1.5px] cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed"
      :class="
        modelValue || indeterminate
          ? 'bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600'
          : 'bg-white border-slate-300 hover:border-orange-400 dark:bg-zinc-900 dark:border-zinc-600 dark:hover:border-orange-400'
      "
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <Icon
      v-if="modelValue || indeterminate"
      :name="indeterminate ? 'i-lucide-minus' : 'i-lucide-check'"
      class="absolute inset-0 m-auto w-3.5 h-3.5 text-white pointer-events-none"
    />
  </span>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  modelValue?: boolean;
  indeterminate?: boolean;
}>();

defineEmits(['update:modelValue']);
</script>
