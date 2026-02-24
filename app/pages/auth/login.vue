<template>
  <div class="flex flex-col gap-4 items-center">
    <UButton icon="i-ion-logo-github" label="Login with GitHub" @click="login()" />
  </div>
</template>

<script lang="ts" setup>
const { login } = await useAuth();

definePageMeta({ layout: 'blank' });
</script>
