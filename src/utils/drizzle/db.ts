import { type PgDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core';

export type PgGenericDatabase = PgDatabase<PgQueryResultHKT>;
