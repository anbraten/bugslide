// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  sourcemap: true,
  app: {
    head: {
      title: 'BugSlide',
      viewport: 'width=device-width, initial-scale=1',
    },
  },
  runtimeConfig: {
    public: {
      SENTRY_DSN_PUBLIC: '',
      RELEASE: '',
    },
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
      public: {
        SENTRY_DSN_PUBLIC: 'http://public@localhost:3000/3',
        RELEASE: 'commit:abcdefg12345',
      },
      publicHost: 'http://localhost:3000',
      auth: {
        password: 'a-32-plus-characters-long-password',
      },
    },
  },
  // nitro: {
  //   preset: './preset',
  // },
});
