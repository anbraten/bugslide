<template>
  <div>
    <UButton :to="`/projects/${projectId}`" icon="i-mdi-arrow-left" label="Back" color="gray" class="mb-4" />

    <UCard v-if="error">
      <div class="flex flex-col p-2">
        <div class="flex gap-4 mt-2 items-center">
          <span class="font-bold text-xl">{{ error.title }} </span>

          <UBadge variant="subtle" :ui="{ rounded: 'rounded-full' }" color="orange" size="sm">New</UBadge>
        </div>

        <div class="flex gap-4 justify-around my-8 max-w-2xl w-full mx-auto">
          <div class="flex flex-col items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Events</span>
            <span class="text-xl">{{ error.events }}</span>
          </div>

          <div class="flex flex-col items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Last Seen</span>
            <span class="text-xl">{{ timeAgo(error.lastOccurrence) }}</span>
          </div>

          <div class="flex flex-col items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">First Seen</span>
            <span class="text-xl">{{ timeAgo(error.createdAt) }}</span>
          </div>
        </div>

        <pre class="p-2 bg-gray-200 dark:bg-gray-800 rounded-md whitespace-pre-wrap w-full mt-2 mb-4">{{
          error.value
        }}</pre>

        <div v-if="errorEvent?.event" class="flex flex-col items-start mb-4">
          <span class="mb-2 font-bold">Event metadata</span>

          <table class="striped">
            <tbody class="text-left">
              <tr>
                <th>Level</th>
                <td>{{ errorEvent?.event.level }}</td>
              </tr>
              <tr>
                <th>Platform</th>
                <td>{{ errorEvent?.event.platform }}</td>
              </tr>
              <tr>
                <th class="pr-4">Environment</th>
                <td>{{ errorEvent?.event.environment }}</td>
              </tr>
              <tr>
                <th>Release</th>
                <td>{{ errorEvent?.event.release }}</td>
              </tr>
              <tr>
                <th>Transaction</th>
                <td>{{ errorEvent?.event.transaction }}</td>
              </tr>
              <tr>
                <th>Reported at</th>
                <td>{{ errorEvent?.createdAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex border-b border-gray-200 dark:border-gray-800 mb-2 items-center gap-2">
          <UHorizontalNavigation :links="subPages" />

          <span class="ml-auto">[{{ errorEventId }}]</span>

          <UButton
            icon="i-mdi-chevron-left"
            color="gray"
            size="sm"
            :disabled="errorEventId === 1"
            @click="errorEventId = errorEventId - 1"
          />
          <UButton
            icon="i-mdi-chevron-right"
            color="gray"
            size="sm"
            :disabled="errorEventId === error.events"
            @click="errorEventId = errorEventId + 1"
          />
        </div>

        <NuxtPage :error :errorEvent />
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const projectId = computed(() => route.params.projectId as string);
const errorId = computed(() => route.params.errorId as string);
const { data: error } = await useFetch(() => `/api/${projectId.value}/errors/${errorId.value}`);

const errorEventId = ref(1);
const { data: errorEvent } = await useFetch(
  () => `/api/${projectId.value}/errors/${errorId.value}/events/${errorEventId.value}`,
);

useSeoMeta({
  title: () => error.value?.title ?? `Error: ${errorId.value}`,
});

const subPages = [
  {
    label: 'Stacktrace',
    icon: 'i-heroicons-bolt-solid',
    to: `/projects/${projectId.value}/errors/${errorId.value}/`,
    exact: true,
  },
  {
    label: 'Breadcrumbs',
    icon: 'i-heroicons-document-magnifying-glass-16-solid',
    to: `/projects/${projectId.value}/errors/${errorId.value}/breadcrumbs`,
    exact: true,
  },
  {
    label: 'Details',
    icon: 'i-heroicons-document-magnifying-glass',
    to: `/projects/${projectId.value}/errors/${errorId.value}/details`,
    exact: true,
  },
];
</script>

<style scoped>
table.striped tr:nth-child(odd) {
  @apply bg-gray-100 dark:bg-gray-800;
}

table th {
  @apply font-normal px-2 py-1;
}
</style>
