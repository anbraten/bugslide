<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-xl font-semibold text-slate-900 dark:text-zinc-100 mb-6">Account Settings</h1>

    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-slate-900 dark:text-zinc-100">MCP Server</h2>
      </template>

      <div class="flex flex-col gap-4">
        <p class="text-sm text-slate-600 dark:text-zinc-400">
          Let AI agents like Claude Code list, inspect and resolve the errors of all your projects.
        </p>

        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300 block mb-1.5">Personal API Token</label>
          <div class="flex items-center gap-2">
            <code
              class="flex-1 block text-xs bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 font-mono overflow-x-auto"
            >
              {{ token ?? 'No token generated yet' }}
            </code>
            <UButton
              icon="i-lucide-refresh-cw"
              :label="token ? 'Regenerate' : 'Generate'"
              variant="outline"
              color="gray"
              size="sm"
              :disabled="generatingToken"
              @click="generateToken"
            />
          </div>
          <p class="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
            The token grants access to all of your projects. Regenerating it invalidates the old one.
          </p>
        </div>

        <div v-if="token">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300 block mb-1.5">Add to Claude Code</label>
          <code
            class="block text-xs bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 font-mono overflow-x-auto whitespace-pre"
            >{{ mcpCommand }}</code
          >
        </div>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const toast = useToast();

const { data: tokenData } = await useFetch<{ token: string | null }>('/api/user/token');
const token = computed(() => tokenData.value?.token ?? null);
const requestUrl = useRequestURL();

const mcpCommand = computed(
  () =>
    `claude mcp add --scope user --transport http bugslide ${requestUrl.origin}/api/mcp \\\n  --header "Authorization: Bearer ${token.value}"`,
);

const generatingToken = ref(false);

async function generateToken() {
  if (token.value && !window.confirm('Regenerating the token invalidates the current one. Continue?')) {
    return;
  }

  generatingToken.value = true;

  try {
    tokenData.value = await $fetch<{ token: string }>('/api/user/token', { method: 'POST' });
  } catch (error) {
    toast.add({
      title: 'Failed to generate token',
      description: error instanceof Error ? error.message : 'Please try again.',
      color: 'red',
    });
  } finally {
    generatingToken.value = false;
  }
}
</script>
