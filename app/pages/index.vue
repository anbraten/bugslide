<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-zinc-100">Projects</h1>
        <p class="mt-0.5 text-base text-slate-500 dark:text-zinc-400">Monitor and manage errors from your projects</p>
      </div>
      <UButton icon="i-lucide-plus" label="New project" size="sm" to="/projects/create" />
    </div>

    <div v-if="projects.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon name="i-lucide-folder-open" class="w-6 h-6 text-slate-400 dark:text-zinc-500" />
      </div>
      <h3 class="text-base font-medium text-slate-900 dark:text-zinc-100">No projects yet</h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-zinc-400">Create your first project to start tracking errors.</p>
      <UButton icon="i-lucide-plus" label="Create project" size="sm" class="mt-4" to="/projects/create" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <router-link
        v-for="project in projects"
        :to="`/projects/${project.id}`"
        :key="project.id"
        class="group block bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-md transition-all duration-200"
      >
        <div class="flex items-start justify-between">
          <div
            class="w-11 h-11 bg-orange-50 dark:bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <Icon name="i-lucide-flame" class="w-5 h-5 text-orange-500" />
          </div>
          <Icon
            name="i-lucide-arrow-right"
            class="w-5 h-5 text-slate-300 dark:text-zinc-600 group-hover:text-orange-400 transition-colors mt-1"
          />
        </div>
        <div class="mt-3">
          <h3
            class="font-semibold text-base text-slate-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
          >
            {{ project.name }}
          </h3>
          <p class="mt-0.5 text-sm text-slate-400 dark:text-zinc-500">Click to view errors</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { data: projects } = await useFetch(`/api/projects`, {
  default: () => [],
});
</script>
