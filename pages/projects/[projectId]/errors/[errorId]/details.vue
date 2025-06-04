<template>
  <div>
    <pre>{{ errorEvent.event }}</pre>
  </div>
</template>

<script lang="ts" setup>
import type { Event, Exception } from '@sentry/core';

defineProps<{
  error: Exception;
  errorEvent: { event: Event };
}>();
</script>
