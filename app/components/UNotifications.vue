<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-[-8px] opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 rounded-xl shadow-lg px-4 py-3.5 text-white"
          :class="{
            'bg-emerald-600': toast.color === 'green',
            'bg-red-600': toast.color === 'red',
            'bg-orange-500': toast.color === 'orange',
            'bg-zinc-800': !toast.color || toast.color === 'gray',
          }"
        >
          <!-- Icon -->
          <Icon
            :name="
              toast.color === 'green'
                ? 'i-lucide-circle-check'
                : toast.color === 'red'
                  ? 'i-lucide-circle-x'
                  : toast.color === 'orange'
                    ? 'i-lucide-triangle-alert'
                    : 'i-lucide-info'
            "
            class="w-5 h-5 flex-shrink-0 opacity-90"
          />
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm leading-snug">{{ toast.title }}</p>
            <p v-if="toast.description" class="text-sm opacity-75 mt-0.5 leading-snug">{{ toast.description }}</p>
          </div>
          <!-- Close -->
          <button
            class="flex-shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/15 transition-all"
            @click="remove(toast.id)"
          >
            <Icon name="i-lucide-x" class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast();
</script>
