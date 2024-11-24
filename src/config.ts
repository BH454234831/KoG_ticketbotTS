/* eslint-disable no-console */
/* eslint-disable require-extensions/require-extensions */
import { parse as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { zodStringInt, zodStringJSON } from './utils/zod';
import { watch, readFileSync } from 'fs';
import path from 'path';
import { projectDir } from './globals';

const envPgOptionsShape = z.object({
  ssl: z.union([z.literal('require'), z.literal('allow'), z.literal('prefer'), z.literal('verify-full'), z.boolean()]),
  max: z.number(),
  idle_timeout: z.number(),
  connect_timeout: z.number(),
  prepare: z.boolean(),
}, { description: 'Environment Postgres options' }).partial();

const envShape = z.object({
  LOGGER_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),

  TRANSCRIPT_CHANNEL_ID: z.string().min(1),

  POSTGRES_SERVER: z.string().min(1),
  POSTGRES_PORT: zodStringInt.pipe(z.number().min(1).max(65535)),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_OPTIONS: z.optional(zodStringJSON(envPgOptionsShape)),
}, { description: 'Environment variables' });

export const NODE_ENV = process.env.NODE_ENV?.toLowerCase();

export const envPaths: readonly string[] = [
  ...(NODE_ENV != null ? [path.resolve(projectDir, `.env.${NODE_ENV.trimEnd()}`.trimEnd())] : []),
  ...(NODE_ENV != null ? [path.resolve(projectDir, `${NODE_ENV.trimEnd()}.env`)] : []),
  path.resolve(projectDir, '.env'),
];

function loadConfigDotenv (...envPaths: readonly string[]): { config: Record<string, string>; envPath: string } | null {
  for (const envPath of envPaths) {
    try {
      console.info('Loading env file', envPath);
      const buffer = readFileSync(envPath);
      return { config: dotenvConfig(buffer), envPath };
    } catch (err) {
      console.error(`Invalid env file path ${envPath}`);
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function loadConfig (...envPaths: readonly string[]) {
  const envConfig = loadConfigDotenv(...envPaths);
  if (envConfig == null) {
    throw new Error(`No env file found for ENV=${NODE_ENV != null ? `'${NODE_ENV}'` : 'null'}`);
  }
  // Object.assign(envConfig, process.env);

  const rawConfigData = envShape.safeParse(envConfig.config);

  if (rawConfigData.error != null) {
    throw new Error(`Invalid config: ${rawConfigData.error.message}`);
  }

  const { data: rawConfig } = rawConfigData;

  const POSTGRES_URL = `postgresql://${rawConfig.POSTGRES_USER}:${rawConfig.POSTGRES_PASSWORD}@${rawConfig.POSTGRES_SERVER}:${rawConfig.POSTGRES_PORT}/${rawConfig.POSTGRES_DB}`;

  return {
    config: {
      ...rawConfig,
      NODE_ENV,
      POSTGRES_URL,
    },
    envPath: envConfig.envPath,
  } as const;
}

export const { config, envPath: configPath } = loadConfig(...envPaths);

export function reloadConfig (...paths: readonly string[]): void {
  console.log('Reloading config');
  try {
    const newConfig = loadConfigDotenv(...paths);
    if (newConfig == null) {
      console.error(new Error(`[reloadConfig] No env files found for paths ${paths.join(', ')}`));
      return;
    }
    Object.assign(config, newConfig.config);
  } catch (err) {
    console.error(new Error('Failed to reload config', { cause: err }));
  }
}

console.log(`Watching env file ${configPath}`);
export const configWatcher = watch(configPath, { persistent: false });
configWatcher.on('change', (eventType) => {
  console.log(`Env file ${configPath} changed, type: ${eventType}`);
  reloadConfig(configPath);
});
