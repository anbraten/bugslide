<template>
  <div ref="container" class="relative inline-flex">
    <!-- Trigger -->
    <div class="cursor-pointer" @click.stop="toggle">
      <slot />
    </div>

    <!-- Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-1.5 z-50 min-w-[11rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden"
      >
        <template v-for="(group, gi) in items" :key="gi">
          <div v-if="gi > 0" class="border-t border-slate-100 dark:border-zinc-800" />
          <template v-for="item in group" :key="item.label">
            <component
              :is="item.to ? NuxtLink : 'button'"
              :to="item.to"
              :disabled="item.disabled"
              type="button"
              :class="[
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                item.disabled
                  ? 'opacity-50 cursor-default text-slate-500 dark:text-zinc-500'
                  : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer',
              ]"
              @click="onItemClick(item)"
            >
              <!-- Custom slot for item type -->
              <slot v-if="item.slot" :name="item.slot" :item="item" />
              <template v-else>
                <slot name="item" :item="item">
                  <Icon
                    v-if="item.icon"
                    :name="item.icon"
                    class="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500"
                  />
                  <span class="truncate flex-1">{{ item.label }}</span>
                </slot>
              </template>
            </component>
          </template>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const NuxtLink = resolveComponent('NuxtLink');

type DropdownItem = {
  label?: string;
  icon?: string;
  to?: string;
  click?: () => void;
  disabled?: boolean;
  slot?: string;
};

defineProps<{
  items?: DropdownItem[][];
  popper?: { placement?: string };
}>();

const open = ref(false);
const container = ref<HTMLElement | null>(null);

function toggle() {
  open.value = !open.value;
}

function onItemClick(item: DropdownItem) {
  if (item.disabled) return;
  if (item.click) {
    item.click();
  }
  open.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

function handleOutsideClick(event: Event) {
  if (container.value && !container.value.contains(event.target as Node)) {
    open.value = false;
  }
}
</script>
