<template>
  <div>
    <UCard v-if="error">
      <UButton :to="`/projects/${projectId}`" icon="i-mdi-arrow-left" label="Back" color="gray" class="mb-4" />

      <div class="flex flex-col p-2">
        <div class="flex gap-4 mt-2 items-center">
          <span class="font-bold text-xl">{{ error.title }} </span>

          <ErrorState :error />

          <div class="flex flex-col items-center ml-auto">
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

          <div v-if="error.state === 'open'" class="flex gap-2">
            <UButton
              icon="i-heroicons-check"
              color="green"
              label="Resolve"
              size="sm"
              @click="changeState('closed')"
              class="ml-2"
            />
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              label="Ignore"
              size="sm"
              @click="changeState('ignored')"
              class="ml-2"
            />
          </div>
          <UButton
            v-else-if="error.state === 'closed' || error.state === 'ignored'"
            icon="i-heroicons-arrow-uturn-left"
            color="gray"
            label="Reopen"
            size="sm"
            @click="changeState('open')"
            class="ml-4"
          />
        </div>

        <pre class="p-2 bg-gray-200 dark:bg-gray-800 rounded-md whitespace-pre-wrap w-full mt-2 mb-4">{{
          error.value
        }}</pre>

        <div v-if="errorEvent?.event" class="flex flex-col items-start mb-4">
          <span class="mb-2 font-bold">Event metadata ({{ errorEvent.event.event_id?.slice(0, 8) }})</span>

          <table class="striped">
            <tbody class="text-left">
              <tr>
                <th>Reported at</th>
                <td>{{ errorEvent?.createdAt }}</td>
              </tr>
              <tr v-if="errorEvent?.event.level">
                <th>Level</th>
                <td>{{ errorEvent?.event.level }}</td>
              </tr>
              <tr v-if="errorEvent?.event.platform">
                <th>Platform</th>
                <td>{{ errorEvent?.event.platform }}</td>
              </tr>
              <tr v-if="errorEvent?.event.environment">
                <th class="pr-4">Environment</th>
                <td>{{ errorEvent?.event.environment }}</td>
              </tr>
              <tr v-if="errorEvent?.event.release">
                <th>Release</th>
                <td>{{ errorEvent?.event.release }}</td>
              </tr>
              <tr v-if="errorEvent?.event.transaction">
                <th>Transaction</th>
                <td>{{ errorEvent?.event.transaction }}</td>
              </tr>
              <tr v-if="errorEvent?.event.request?.url">
                <th>Url</th>
                <td>
                  <router-link :to="errorEvent?.event.request?.url" class="text-blue-500">{{
                    errorEvent?.event.request?.url
                  }}</router-link>
                </td>
              </tr>
              <tr v-if="userAgent?.browser.name">
                <th>Browser</th>
                <td>{{ userAgent?.browser.name }} {{ userAgent?.browser.version }}</td>
              </tr>
              <tr v-if="userAgent?.os.name">
                <th>OS</th>
                <td>{{ userAgent?.os.name }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex border-b border-gray-200 dark:border-gray-800 mb-2 items-center gap-2">
          <UHorizontalNavigation v-if="error && errorEvent" :links="subPages" />

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

        <NuxtPage v-if="error && errorEvent" :error :errorEvent />
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { UAParser } from 'ua-parser-js';

const route = useRoute();

const projectId = computed(() => route.params.projectId as string);
const errorId = computed(() => route.params.errorId as string);
const { data: error, refresh: refreshError } = await useFetch(() => `/api/${projectId.value}/errors/${errorId.value}`);

const errorEventId = ref(1);
const { data: errorEvent } = await useFetch(
  () => `/api/${projectId.value}/errors/${errorId.value}/events/${errorEventId.value}`,
);

useSeoMeta({
  title: () => error.value?.title ?? `Error: ${errorId.value}`,
});

const subPages = computed(() => [
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
]);

const userAgent = computed(() => {
  const headers = errorEvent.value?.event?.request?.headers;
  if (!headers) {
    return undefined;
  }

  const ua = new UAParser(headers['User-Agent']);
  return {
    browser: ua.getBrowser(),
    os: ua.getOS(),
  };
});

async function changeState(state: 'open' | 'closed' | 'ignored') {
  await fetch(`/api/${projectId.value}/errors/${errorId.value}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state }),
  });
  await refreshError();
}
</script>

<style scoped>
table.striped tr:nth-child(odd) {
  @apply bg-gray-100 dark:bg-gray-800;
}

table th,
table td {
  @apply font-normal px-2 py-1;
}
</style>
