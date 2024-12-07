<template>
  <div class="flex flex-col items-center">
    <form class="flex flex-col gap-2" @submit.prevent="createProject">
      <UInput
        v-model="project.name"
        label="Project name"
        placeholder="Enter the project name"
        required
      />

      <UButton
        icon="i-heroicons-plus"
        color="primary"
        size="sm"
        label="Create project"
        type="submit"
      />
    </form>
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
    description: `The project "${project.value.name}" has been created successfully`,
  });

  await navigateTo(`/projects/${_project.id}`);
}
</script>