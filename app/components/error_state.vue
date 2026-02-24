<template>
  <UBadge v-if="error.state === 'open'" variant="subtle" color="orange" size="sm">Open</UBadge>
  <UBadge v-else-if="error.state === 'resolved'" variant="subtle" color="green" size="sm">Resolved</UBadge>
  <UBadge v-else-if="error.state === 'ignored'" variant="subtle" color="gray" size="sm">Ignored</UBadge>
</template>

<script lang="ts" setup>
defineProps<{
  error: CaughtError;
}>();
</script>
