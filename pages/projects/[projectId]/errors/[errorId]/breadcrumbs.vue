<template>
  <div>
    <pre>{{ errorEvent.event.breadcrumbs }}</pre>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  error: any;
  errorEvent: any;
}>();
</script>
