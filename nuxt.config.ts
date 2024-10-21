// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    auth: {
      password: '',
      clientId: '',
      clientSecret: '',
    },
    db: {
      tursoDatabaseUrl: '',
      tursoAuthToken: '',
    },
  },
  $development: {
    runtimeConfig: {
      auth: {
        password: 'a-32-plus-characters-long-password',
      },
    },
  },
});
