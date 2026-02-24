<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-2 opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl p-4 flex items-start gap-3"
        >
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-slate-900 dark:text-zinc-100">{{ toast.title }}</p>
            <p v-if="toast.description" class="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              {{ toast.description }}
            </p>
          </div>
          <button
            class="flex-shrink-0 mt-0.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors rounded-md p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800"
            @click="remove(toast.id)"
          >
            <Icon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast();
</script>
