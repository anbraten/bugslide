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
              <div class="flex" />
            </th>
            <th>Releases</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="release in releases" :key="release.id" class="border-t dark:border-gray-700">
            <td>
              <div class="flex p-2">
                <UCheckbox class="mb-auto mx-auto" />
              </div>
            </td>
            <td>
              <div class="flex p-2">
                <router-link :to="`/projects/${projectId}/releases/${release.id}`" class="flex flex-col">
                  <span class="font-bold">{{ release.version }}</span>
                </router-link>
              </div>
            </td>
            <td class="text-center">
              <div class="flex p-2">
                <span>{{ timeAgo(release.createdAt) }} ago</span>
              </div>
            </td>
          </tr>
          <tr v-if="releases.length === 0">
            <td class="text-center p-4" colspan="3">
              <div class="flex flex-col">
                <span class="text-lg">No releases yet! 😊</span>
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

const projectId = computed(() => route.params.projectId);
const { data: releases } = await useFetch(() => `/api/projects/${projectId.value}/releases`, {
  default: () => [],
});
</script>
