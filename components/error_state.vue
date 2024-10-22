<template>
  <UBadge v-if="error.state === 'open'" variant="subtle" :ui="{ rounded: 'rounded-full' }" color="orange" size="sm"
    >Open</UBadge
  >
  <UBadge
    v-else-if="error.state === 'closed'"
    variant="subtle"
    :ui="{ rounded: 'rounded-full' }"
    color="green"
    size="sm"
    >Resolved</UBadge
  >
  <UBadge
    v-else-if="error.state === 'ignored'"
    variant="subtle"
    :ui="{ rounded: 'rounded-full' }"
    color="gray"
    size="sm"
    >Ignored</UBadge
  >
</template>

<script lang="ts" setup>
defineProps<{
  error: CaughtError;
}>();
</script>
