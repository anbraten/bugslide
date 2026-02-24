<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :class="[
      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
      modelValue ? 'bg-orange-500' : 'bg-slate-200 dark:bg-zinc-700',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
        modelValue ? 'translate-x-4' : 'translate-x-0',
      ]"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean;
}>();

defineEmits(['update:modelValue']);
</script>
