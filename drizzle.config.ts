/* eslint-disable require-extensions/require-extensions */
import { config } from './src/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.POSTGRES_URL,
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations',
  }
});
