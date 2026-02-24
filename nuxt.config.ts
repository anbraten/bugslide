// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/icon', '@nuxtjs/color-mode', '@nuxtjs/tailwindcss'],
  colorMode: {
    classSuffix: '',
  },
  icon: {
    serverBundle: 'local',
  },
  sourcemap: true,
  app: {
    head: {
      title: 'BugSlide',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        {
          rel: 'icon',
          href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.90em%22 font-size=%2290%22>🔥</text></svg>',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      host: '',
    },
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
    s3: {
      endpoint: '',
      forcePathStyle: true,
      region: 'unknown',
      accessKey: '',
      secretKey: '',
      bucket: '',
    },
  },
  $development: {
    runtimeConfig: {
      public: {
        host: 'http://localhost:3000',
      },
      auth: {
        password: 'a-32-plus-characters-long-password',
      },
    },
  },
});
