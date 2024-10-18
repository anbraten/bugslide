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
            <th></th>
            <th>Events</th>
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
                  <UBadge variant="subtle" :ui="{ rounded: 'rounded-full' }" color="orange" size="sm">{{
                    error.state
                  }}</UBadge>
                  <span>{{ timeAgo(error.lastOccurrence) }} ago | {{ timeAgo(error.createdAt) }} old</span>
                </div>
              </div>
            </td>
            <td class="text-center">
              <span>{{ error.events }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
const route = useRoute();

const projectId = computed(() => route.params.projectId);
const { data: errors } = await useFetch(() => `/api/${projectId.value}/errors`, {
  default: () => [],
});
</script>
