<template>
  <Icon :name="name" v-bind="$attrs" />
</template>

<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>
