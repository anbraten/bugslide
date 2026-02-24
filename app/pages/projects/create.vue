<template>
  <div class="max-w-md mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-zinc-100">Create project</h1>
      <p class="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">Set up a new project to start capturing errors</p>
    </div>

    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
      <form class="flex flex-col gap-4" @submit.prevent="createProject">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300" for="project-name">Project name</label>
          <UInput id="project-name" v-model="project.name" placeholder="e.g. My Awesome App" required />
        </div>

        <UButton icon="i-lucide-plus" label="Create project" type="submit" />
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
const project = ref({
  name: '',
});

const toast = useToast();

async function createProject() {
  const _project = await $fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project.value),
  });

  toast.add({
    title: 'Project created',
    description: `"${project.value.name}" has been created successfully`,
  });

  await navigateTo(`/projects/${_project.id}`);
}
</script>
