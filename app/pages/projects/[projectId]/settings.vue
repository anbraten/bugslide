<template>
  <div>
    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-slate-900 dark:text-zinc-100">Project Settings</h2>
      </template>

      <div class="flex flex-col gap-4">
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300 block mb-1.5">DSN</label>
          <div class="flex items-center gap-2">
            <code
              class="flex-1 block text-xs bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 font-mono overflow-x-auto"
            >
              {{ dsn }}
            </code>
          </div>
          <p class="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">Use this DSN in your Sentry SDK configuration.</p>
        </div>

        <div class="pt-2">
          <UButton
            icon="i-lucide-book-open"
            label="View setup guide"
            variant="outline"
            color="gray"
            size="sm"
            :to="`/projects/${route.params.projectId}/setup`"
          />
        </div>
      </div>
    </UCard>

    <UCard class="mt-6 border-red-200 dark:border-red-900/50">
      <template #header>
        <h2 class="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
      </template>

      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-slate-900 dark:text-zinc-100">Delete this project</p>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            This will permanently delete the project and all of its errors, releases, and uploaded source maps.
          </p>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          label="Delete project"
          color="red"
          variant="outline"
          size="sm"
          :disabled="deleting"
          @click="deleteProject"
        />
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import type { Project } from '#server/utils/db';

const route = useRoute();
const toast = useToast();

const { data: project } = await useFetch<Project>(`/api/projects/${route.params.projectId as string}`);

const dsn = computed(
  () =>
    `${window?.location?.protocol}//${project.value?.publicSecret ?? ''}@${window?.location?.host}/${
      route.params.projectId
    }`,
);

const deleting = ref(false);

async function deleteProject() {
  const typedName = window.prompt(`This will permanently delete this project. Type "${project.value?.name}" to confirm.`);
  if (typedName !== project.value?.name) {
    return;
  }

  deleting.value = true;

  try {
    await $fetch(`/api/projects/${route.params.projectId as string}`, { method: 'DELETE' });

    toast.add({
      title: 'Project deleted',
      description: `"${project.value?.name}" has been deleted`,
    });

    await navigateTo('/');
  } catch (error) {
    toast.add({
      title: 'Failed to delete project',
      description: error instanceof Error ? error.message : 'Please try again.',
      color: 'red',
    });
  } finally {
    deleting.value = false;
  }
}
</script>
