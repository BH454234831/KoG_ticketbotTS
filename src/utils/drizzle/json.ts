/* eslint-disable require-extensions/require-extensions */
import { type ColumnBaseConfig, type ColumnDataType, type SQL, sql } from 'drizzle-orm';
import { type PgColumn, type ExtraConfigColumn } from 'drizzle-orm/pg-core';
import type { Leaves } from '../types';

function jsonPathConcat (path: ReadonlyArray<string | number | symbol>): SQL {
  return sql.raw(`{${path.join(',')}}`);
}

export type PgColumnJson<T> = PgColumn<ColumnBaseConfig<'json', string> & { data: T }>;
export type PgExtraConfigJson = ExtraConfigColumn<ColumnBaseConfig<ColumnDataType, string>>;

export function jsonField<T extends object> (column: PgColumnJson<T>, key: keyof T & (string | number)): SQL {
  if (typeof key === 'number') return sql`${column}->>${sql.raw(String(key))}`;
  else return sql`${column}->>'${sql.raw(String(key))}'`;
}

export function jsonFieldDeep<T extends object> (column: PgColumnJson<T>, keys: Leaves<T, 3>): SQL {
  return sql`${column}#>>'{${sql.raw((keys as string[]).join(','))}}'`;
}

export function extraJsonField (column: PgExtraConfigJson, key: string | number): SQL {
  if (typeof key === 'number') return sql`(${column}->>${String(key)})`;
  else return sql`(${column}->>'${sql.raw(String(key))}')`;
}

export function extraJsonFieldDeep (column: PgExtraConfigJson, keys: Array<string | number>): SQL {
  return sql.raw(`("${column.name}" #>> '{${(keys as string[]).join(',')}}')`);
}

export function jsonbSet<T> (column: PgColumnJson<T>, keys: Leaves<T, 3>, value: string | number): SQL {
  return sql`jsonb_set(${column}, ${jsonPathConcat(keys)}, ${value})`;
}
