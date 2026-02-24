export async function useAuth() {
  const { data, refresh: updateSession } = await useFetch('/api/user', {
    deep: true,
  });

  const user = computed(() => data.value?.user ?? null);

  const isAuthenticated = computed(() => !!user.value?.id);

  function login() {
    window.location.href = `/api/auth/login`;
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' });
    await updateSession();
    await navigateTo('/auth/login');
  }

  return {
    isAuthenticated,
    user,
    login,
    logout,
    updateSession,
  };
}
