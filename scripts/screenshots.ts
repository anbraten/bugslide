// Regenerates the README screenshots (docs/screenshot_*.png) from a throwaway instance seeded with demo data.
// Usage: pnpm screenshots (once before: pnpm exec playwright install chromium)
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { sealSession } from 'h3';
import { chromium } from 'playwright';

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const AUTH_PASSWORD = 'a-32-plus-characters-long-password';
const SHOTS: [path: string, file: string][] = [
  ['/projects/1', 'docs/screenshot_errors_list.png'],
  ['/projects/1/errors/1', 'docs/screenshot_error.png'],
];

// inside the repo so the build dir can still resolve node_modules
const cacheDir = resolve('node_modules/.cache');
await mkdir(cacheDir, { recursive: true });
const tmp = await mkdtemp(join(cacheDir, 'screenshots-'));
const dbPath = join(tmp, 'demo.db');

await migrate();
await seed();

// separate build dir so a running dev server's .nuxt is left alone
const layer = join(tmp, 'layer');
await mkdir(layer);
await writeFile(join(layer, 'nuxt.config.ts'), `export default { buildDir: ${JSON.stringify(join(tmp, '.nuxt'))} };`);
const server = spawn('pnpm', ['nuxt', 'dev', '--port', String(PORT), '--no-qr', '--extends', layer], {
  detached: true,
  stdio: 'ignore',
  env: {
    ...process.env,
    // set explicitly so the values from .env are not used
    NUXT_DB_TURSO_DATABASE_URL: `file:${dbPath}`,
    NUXT_DB_TURSO_AUTH_TOKEN: '',
    NUXT_AUTH_PASSWORD: AUTH_PASSWORD,
    NUXT_MAIL_HOST: '',
    NUXT_S3_ENDPOINT: '',
  },
});

try {
  await waitForServer();

  const cookie = await sealSession(
    { context: { sessions: { h3: { id: randomUUID(), createdAt: Date.now(), data: { userId: 1 } } } } } as never,
    { password: AUTH_PASSWORD },
  );

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  await context.addCookies([{ name: 'h3', value: cookie, url: BASE_URL }]);
  const page = await context.newPage();

  for (const [path, file] of SHOTS) {
    await page.goto(BASE_URL + path, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '#nuxt-devtools-container { display: none !important; }' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: file });
    console.log(`Saved ${file}`);
  }

  await browser.close();
} finally {
  process.kill(-server.pid!);
  await rm(tmp, { recursive: true, force: true });
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(BASE_URL, { redirect: 'manual' });
      if (res.status < 500) {
        return;
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Dev server did not start');
}

async function migrate() {
  const db = createClient({ url: `file:${dbPath}` });
  const dir = 'server/migrations';
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    for (const statement of (await readFile(join(dir, file), 'utf8')).split('--> statement-breakpoint')) {
      if (statement.trim()) {
        await db.execute(statement);
      }
    }
  }
}

async function seed() {
  const db = createClient({ url: `file:${dbPath}` });
  const now = Math.floor(Date.now() / 1000);
  const DAY = 86400;
  // deterministic random so screenshots only change when the UI does
  let state = 42;
  const rand = () => (state = (state * 16807) % 2147483647) / 2147483647;
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)]!;

  await db.execute(`insert into users (id, name, email) values (1, 'Demo User', 'demo@example.com')`);
  for (const [i, name] of ['storefront', 'checkout-api', 'admin-dashboard'].entries()) {
    await db.execute({ sql: 'insert into projects (id, name, publicSecret) values (?, ?, ?)', args: [i + 1, name, `demo${i}`] });
    await db.execute({ sql: 'insert into user_projects (userId, projectId) values (1, ?)', args: [i + 1] });
  }

  const releases: [projectId: number, version: string, daysAgo: number][] = [
    [1, '2.3.0', 13],
    [1, '2.3.1', 8],
    [1, '2.4.0', 3],
    [2, '1.12.0', 10],
    [2, '1.13.0', 4],
    [3, '0.9.2', 12],
  ];
  for (const [projectId, version, daysAgo] of releases) {
    await db.execute({
      sql: 'insert into releases (projectId, version, createdAt) values (?, ?, ?)',
      args: [projectId, version, now - daysAgo * DAY],
    });
  }

  const users = ['mia', 'lukas', 'sofia', 'noah', 'emma', 'liam'].map((name, i) => ({
    id: `u_${1000 + i}`,
    email: `${name}@example.com`,
  }));
  const browsers = [['Chrome', '141.0.0'], ['Chrome', '140.0.0'], ['Firefox', '143.0'], ['Safari', '26.0'], ['Edge', '141.0.0']];
  const oses = [['Windows', '11'], ['macOS', '15.6'], ['Linux', ''], ['iOS', '26.0'], ['Android', '16']];

  const frame = (filename: string, fn: string, lineno: number, colno: number, code?: [string[], string, string[]]) => ({
    filename,
    function: fn,
    lineno,
    colno,
    in_app: !filename.includes('vendor'),
    ...(code ? { pre_context: code[0], context_line: code[1], post_context: code[2] } : {}),
  });

  type Issue = {
    project: number;
    type: string;
    value: string;
    days: [newest: number, oldest: number];
    perDay: (daysAgo: number) => number;
    state: 'open' | 'resolved' | 'ignored';
    regressed?: boolean;
    releases: string[];
    url: string;
    frames?: ReturnType<typeof frame>[];
    breadcrumbs?: Record<string, unknown>[];
  };

  const issues: Issue[] = [
    {
      project: 1,
      type: 'TypeError',
      value: "Cannot read properties of undefined (reading 'price')",
      days: [0, 13],
      perDay: (d) => (d < 3 ? 9 : 2),
      state: 'open',
      releases: ['2.3.1', '2.4.0'],
      url: 'https://shop.example.com/cart',
      frames: [
        frame('https://shop.example.com/assets/vendor.js', 'callWithAsyncErrorHandling', 1, 18234),
        frame('https://shop.example.com/assets/vendor.js', 'ReactiveEffect.run', 1, 9921),
        frame('/src/pages/cart.vue', 'onMounted', 42, 5, [
          ['onMounted(async () => {', '  const items = await cart.load();'],
          '  total.value = calculateTotal(items);',
          ['  loading.value = false;', '});'],
        ]),
        frame('/src/composables/useCart.ts', 'calculateTotal', 87, 31, [
          ['export function calculateTotal(items: CartItem[]) {', '  return items.reduce((sum, item) => {', '    const discount = item.discount ?? 0;'],
          '    return sum + item.product.price * item.quantity - discount;',
          ['  }, 0);', '}'],
        ]),
      ],
      breadcrumbs: [
        { category: 'navigation', data: { from: '/products/42', to: '/cart' } },
        { category: 'ui.click', message: 'button#add-to-cart' },
        { category: 'fetch', data: { method: 'GET', url: '/api/cart', status_code: 200 } },
        { category: 'fetch', data: { method: 'GET', url: '/api/products?ids=42,77', status_code: 200 } },
        { category: 'console', level: 'warning', message: 'Product 77 is no longer available' },
      ],
    },
    {
      project: 1,
      type: 'ChunkLoadError',
      value: 'Loading chunk 812 failed. (timeout: https://shop.example.com/assets/checkout.812.js)',
      days: [0, 3],
      perDay: () => 5,
      state: 'open',
      releases: ['2.4.0'],
      url: 'https://shop.example.com/checkout',
      frames: [frame('/src/router/index.ts', 'loadRoute', 58, 12, [['const routes = ['], "  { path: '/checkout', component: () => import('../pages/checkout.vue') },", [']']])],
    },
    {
      project: 1,
      type: 'Error',
      value: 'Payment provider returned 502 Bad Gateway',
      days: [0, 9],
      perDay: (d) => (d === 1 ? 6 : 1),
      state: 'open',
      regressed: true,
      releases: ['2.3.1', '2.4.0'],
      url: 'https://shop.example.com/checkout/pay',
      frames: [
        frame('/src/services/payment.ts', 'authorize', 121, 11, [
          ['const res = await fetch(`${PAYMENT_URL}/authorize`, { method: "POST", body });', 'if (!res.ok) {'],
          '  throw new Error(`Payment provider returned ${res.status} ${res.statusText}`);',
          ['}'],
        ]),
      ],
      breadcrumbs: [
        { category: 'ui.click', message: 'button.pay-now' },
        { category: 'fetch', data: { method: 'POST', url: '/api/payments/authorize', status_code: 502 } },
      ],
    },
    {
      project: 1,
      type: 'SyntaxError',
      value: 'Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON',
      days: [2, 11],
      perDay: () => 1,
      state: 'open',
      releases: ['2.3.0', '2.3.1'],
      url: 'https://shop.example.com/account/orders',
      frames: [frame('/src/api/client.ts', 'request', 34, 22, [['const res = await fetch(url, init);'], '  return (await res.json()) as T;', ['}']])],
      breadcrumbs: [{ category: 'fetch', data: { method: 'GET', url: '/api/orders', status_code: 404 } }],
    },
    {
      project: 1,
      type: 'Error',
      value: 'ResizeObserver loop completed with undelivered notifications.',
      days: [0, 13],
      perDay: () => 4,
      state: 'ignored',
      releases: ['2.3.0', '2.3.1', '2.4.0'],
      url: 'https://shop.example.com/',
    },
    {
      project: 1,
      type: 'RangeError',
      value: 'Invalid time value',
      days: [5, 12],
      perDay: () => 2,
      state: 'resolved',
      releases: ['2.3.0'],
      url: 'https://shop.example.com/account',
      frames: [frame('/src/utils/date.ts', 'formatDate', 12, 10, [['export function formatDate(value: string) {'], '  return new Intl.DateTimeFormat(locale).format(new Date(value));', ['}']])],
    },
    {
      project: 2,
      type: 'SqliteError',
      value: 'database is locked',
      days: [0, 6],
      perDay: (d) => (d < 2 ? 4 : 1),
      state: 'open',
      releases: ['1.13.0'],
      url: 'https://api.example.com/orders',
    },
    {
      project: 2,
      type: 'TimeoutError',
      value: 'Request to inventory service timed out after 5000ms',
      days: [1, 9],
      perDay: () => 2,
      state: 'open',
      releases: ['1.12.0', '1.13.0'],
      url: 'https://api.example.com/stock',
    },
    {
      project: 3,
      type: 'TypeError',
      value: 'Failed to fetch',
      days: [0, 12],
      perDay: () => 1,
      state: 'open',
      releases: ['0.9.2'],
      url: 'https://admin.example.com/reports',
    },
  ];

  for (const [i, issue] of issues.entries()) {
    const errorId = i + 1;
    const timestamps: number[] = [];
    for (let d = issue.days[1]; d >= issue.days[0]; d--) {
      const count = Math.round(issue.perDay(d) * (0.5 + rand()));
      for (let n = 0; n < count; n++) {
        timestamps.push(now - d * DAY - Math.floor(rand() * (d === 0 ? 6 * 3600 : DAY)));
      }
    }
    timestamps.sort((a, b) => a - b);
    const first = timestamps[0]!;
    const last = timestamps.at(-1)!;

    await db.execute({
      sql: `insert into errors (id, projectId, createdAt, updatedAt, title, value, state, events, lastOccurrence, regressedAt)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [errorId, issue.project, first, last, issue.type, issue.value, issue.state, timestamps.length, last, issue.regressed ? now - DAY : null],
    });

    for (const [index, timestamp] of timestamps.entries()) {
      const release = issue.releases[Math.floor((index / timestamps.length) * issue.releases.length)]!;
      const [browser, browserVersion] = pick(browsers);
      const [os, osVersion] = pick(oses);
      const stacktrace = issue.frames ? { frames: issue.frames } : null;
      const event = {
        event_id: randomUUID().replaceAll('-', ''),
        timestamp,
        platform: 'javascript',
        level: 'error',
        environment: rand() < 0.85 ? 'production' : 'staging',
        release,
        transaction: new URL(issue.url).pathname,
        request: { url: issue.url },
        user: { ...pick(users), ip_address: '{{auto}}' },
        tags: { locale: pick(['en-US', 'de-DE', 'fr-FR', 'en-GB']), tenant: pick(['acme', 'globex', 'initech']) },
        contexts: { browser: { name: browser, version: browserVersion }, os: { name: os, version: osVersion } },
        sdk: { name: 'sentry.javascript.vue', version: '10.17.0' },
        exception: {
          values: [{ type: issue.type, value: issue.value, stacktrace, mechanism: { type: 'onerror', handled: false } }],
        },
        breadcrumbs: (issue.breadcrumbs ?? []).map((crumb, n) => ({
          type: 'default',
          level: 'info',
          ...crumb,
          timestamp: timestamp - 40 + n * 6,
        })),
      };

      await db.execute({
        sql: 'insert into error_events (eventId, error, createdAt, stacktrace, release, event) values (?, ?, ?, ?, ?, ?)',
        args: [index + 1, errorId, timestamp, stacktrace && JSON.stringify(stacktrace), release, JSON.stringify(event)],
      });
    }
  }
}
