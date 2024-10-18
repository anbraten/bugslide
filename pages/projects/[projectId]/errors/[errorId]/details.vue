<template>
  <div>
    <pre>{{ errorEvent.event }}</pre>
  </div>
</template>

<script lang="ts" setup>
import type { Breadcrumb, Event, Exception } from '@sentry/types';

defineProps<{
  error: Exception;
  errorEvent: { event: Event };
}>();
</script>
