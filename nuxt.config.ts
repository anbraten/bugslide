// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    publicHost: '',
    auth: {
      password: '',
      clientId: '',
      clientSecret: '',
    },
    db: {
      tursoDatabaseUrl: '',
      tursoAuthToken: '',
    },
    mail: {
      host: '',
      port: 0,
      username: '',
      password: '',
      secure: false,
      requireTLS: false,
      from: '',
    },
  },
  $development: {
    runtimeConfig: {
      publicHost: 'http://localhost:3000',
      auth: {
        password: 'a-32-plus-characters-long-password',
      },
    },
  },
});
