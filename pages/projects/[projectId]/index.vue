<template>
  <UCard>
    <div class="rounded-md border dark:border-gray-800">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-800">
            <th>
              <div class="flex p-2">
                <UCheckbox class="mb-auto mx-auto" />
              </div>
            </th>
            <th>
              <div class="flex">
                <USelect v-model="state" :options="['open', 'resolved', 'ignored']" />
              </div>
            </th>
            <th>Last</th>
            <th>Count</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="error in errors" :key="error.id" class="border-t dark:border-gray-700">
            <td>
              <div class="flex p-2">
                <UCheckbox class="mb-auto mx-auto" />
              </div>
            </td>
            <td>
              <div class="flex flex-col p-2">
                <router-link :to="`/projects/${projectId}/errors/${error.id}`" class="flex flex-col">
                  <span class="font-bold">{{ error.title }}</span>
                  <span>{{ error.value }}</span>
                </router-link>

                <div class="flex gap-4 mt-2">
                  <ErrorState :error />
                  <span>{{ timeAgo(error.createdAt) }} old</span>
                </div>
              </div>
            </td>
            <td class="text-center">
              <span>{{ timeAgo(error.lastOccurrence) }}</span>
            </td>
            <td class="text-center">
              <span>{{ error.events }}</span>
            </td>
          </tr>
          <tr v-if="errors.length === 0">
            <td class="text-center p-4" colspan="3">
              <div class="flex flex-col">
                <span class="text-lg">No errors yet! 😊</span>
                <router-link :to="`/projects/${projectId}/setup`" class="text-blue-500 dark:text-blue-400"
                  >Setup</router-link
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
const route = useRoute();

const state = ref<'open' | 'resolved' | 'ignored'>('open');
const projectId = computed(() => route.params.projectId);
const { data: errors } = await useFetch(() => `/api/projects/${projectId.value}/errors`, {
  query: computed(() => ({
    state: state.value,
  })),
  default: () => [],
  watch: [state],
});
</script>
