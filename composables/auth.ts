export async function useAuth() {
  const { data: user, refresh: updateSession } = await useFetch('/api/user');

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
