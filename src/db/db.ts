import { config } from 'config';
import { drizzle } from 'drizzle-orm/postgres-js/driver';
import { logger } from 'logger';
import postgres from 'postgres';

function jsonBigintReplacer (value: any) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export const dbConnection = postgres(config.POSTGRES_URL, {
  debug: (channel, query, parameters) => {
    logger.debug(`[Query][${channel}]: ${query}\nParams: ${JSON.stringify(parameters, jsonBigintReplacer)}`);
  },
});

export const db = drizzle(dbConnection, {
  logger: {
    logQuery: (query, params) => {
      // logger.debug(`Query: ${query}\nParams: ${JSON.stringify(params)}`);
    },
  },
});
