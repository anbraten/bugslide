<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<template>
  <div
    class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm"
    v-bind="$attrs"
  >
    <div v-if="$slots.header" class="px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
      <slot name="header" />
    </div>
    <div class="p-5">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="px-5 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 rounded-b-xl"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
