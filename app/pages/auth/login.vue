<template>
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/30"
      >
        <Icon name="i-lucide-flame" class="w-6 h-6 text-white" />
      </div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-zinc-100">Welcome to BugSlide</h1>
      <p class="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">Sign in to track and manage your errors</p>
    </div>

    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
      <UButton
        icon="i-ion-logo-github"
        label="Continue with GitHub"
        size="lg"
        class="w-full justify-center"
        @click="login()"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { login } = await useAuth();

definePageMeta({ layout: 'blank' });
</script>
