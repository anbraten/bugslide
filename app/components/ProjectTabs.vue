<template>
  <UHorizontalNavigation :links="links" />
</template>

<script setup lang="ts">
const props = defineProps<{
  projectId: string;
}>();

// not awaited: the project page already loaded this, so it renders right away
const {
  openErrors: { data: errors },
  releases: { data: releases },
} = useProjectHeader(() => props.projectId);

const links = computed(() => [
  {
    label: 'Errors',
    icon: 'i-lucide-flame',
    to: `/projects/${props.projectId}`,
    exact: true,
    activeFor: [`/projects/${props.projectId}/errors/`],
    badge: errors.value?.total ?? 0,
  },
  {
    label: 'Releases',
    icon: 'i-lucide-rocket',
    to: `/projects/${props.projectId}/releases`,
    badge: releases.value?.length ?? 0,
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: `/projects/${props.projectId}/settings`,
  },
]);
</script>
