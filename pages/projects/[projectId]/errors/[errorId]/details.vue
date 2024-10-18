<template>
  <div>
    <pre>{{ errorEvent.event }}</pre>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  error: any;
  errorEvent: any;
}>();
</script>
