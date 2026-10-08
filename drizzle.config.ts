import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso',
  schema: './server/utils/db.ts',
  out: './server/migrations',
  dbCredentials: {
    url: (process.env.NUXT_DB_TURSO_DATABASE_URL || process.env.LIBSQL_URL)!,
    authToken: process.env.NUXT_DB_TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
  },
});
