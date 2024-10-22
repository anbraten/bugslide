import * as Sentry from '@sentry/vue';

async function lazyLoadSentryIntegrations() {
  // don't load on server
  if (!import.meta.client) return;

  const { replayIntegration } = await import('@sentry/vue');
  Sentry.addIntegration(
    replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  );
}

function getSentryIntegrations() {
  const integrations = [];

  integrations.push(
    Sentry.captureConsoleIntegration({
      levels: ['error'],
    }),
  );

  if (import.meta.client) {
    const router = useRouter();
    const browserTracing = Sentry.browserTracingIntegration({
      router,
    });
    integrations.push(browserTracing);
  }

  return integrations;
}

export default defineNuxtPlugin({
  name: 'sentry',
  parallel: true,
  async setup(nuxtApp) {
    const vueApp = nuxtApp.vueApp;

    const config = useRuntimeConfig();

    Sentry.init({
      app: vueApp,
      dsn: config.public.SENTRY_DSN_PUBLIC ?? undefined,
      integrations: getSentryIntegrations(),
      environment: import.meta.dev ? 'development' : 'production',
      release: config.public.RELEASE,

      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: config.public.SENTRY_TRACES_SAMPLE_RATE as number,

      logErrors: true,
    });

    // Lazy-load the replay integration to reduce bundle size
    lazyLoadSentryIntegrations();
  },
});
