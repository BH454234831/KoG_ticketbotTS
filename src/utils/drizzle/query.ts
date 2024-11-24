/* eslint-disable require-extensions/require-extensions */
import { type ColumnsSelection, getTableColumns, isNotNull, isNull, type SQL, sql, type SQLWrapper, type Table } from 'drizzle-orm';
import { type SubqueryWithSelection, type PgColumn } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import _ from 'lodash';

export function pickSelect<T extends Table, Columns extends keyof T['_']['columns']> (table: T, ...columns: Columns[]): Pick<T['_']['columns'], Columns> {
  return _.pick(getTableColumns(table), ...columns);
}

export function omitSelect<T extends Table, Columns extends keyof T['_']['columns']> (table: T, ...columns: Columns[]): Omit<T['_']['columns'], Columns> {
  return _.omit(getTableColumns(table), ...columns);
}

export const NullableOptionSchema = z.enum(['null', 'not null', 'all']);

export type NullableOption = z.infer<typeof NullableOptionSchema>;

export function nullable (column: SQLWrapper, option: NullableOption | null | undefined): SQL | undefined {
  return option === 'not null'
    ? isNotNull(column)
    : option === 'null'
      ? isNull(column)
      : undefined;
}

export function coalesce (value1: SQLWrapper, value2: SQLWrapper): SQL {
  return sql`coalesce(${value1}, ${value2})`;
}

export function excluded (column: PgColumn): SQL {
  return sql.raw(`excluded."${column.name}"`);
}

export function isDistinct (value1: SQLWrapper, value2: SQLWrapper): SQL {
  return sql`${value1} IS DISTINCT FROM ${value2}`;
}

export function pickExcluded<T extends Table, Columns extends keyof T['_']['columns']> (table: T, ...columns: Columns[]): Record<Columns, SQL> {
  return Object.fromEntries(Object.entries<PgColumn>(pickSelect(table, ...columns)).map(([key, value]) => [key, excluded(value)])) as Record<Columns, SQL>;
}

export function omitExcluded<T extends Table, Columns extends keyof T['_']['columns']> (table: T, ...columns: Columns[]): Record<Columns, SQL> {
  return Object.fromEntries(Object.entries<PgColumn>(omitSelect(table, ...columns)).map(([key, value]) => [key, excluded(value)])) as Record<Columns, SQL>;
}

export function increment (column: PgColumn): SQL {
  return sql`${column} + 1`;
}

export function count (column?: PgColumn): SQL<number> {
  if (column == null) return sql`count(*)`.mapWith(Number);
  else return sql`count(${column})`.mapWith(Number);
}

export function lower (column: SQLWrapper): SQL {
  return sql`lower(${column})`;
}

export function dateTruncHour (column: SQLWrapper): SQL<Date> {
  return sql`date_trunc('hour', ${column})`;
}

export function dateTruncDay (column: SQLWrapper): SQL<Date> {
  return sql`date_trunc('day', ${column})`;
}

export function columnName (column: PgColumn): SQL.Aliased {
  return sql.raw(`"${column.name}"`).as(column.name);
}

export function remapSubquerySelect<TSelection extends ColumnsSelection, TAlias extends string> (sq: SubqueryWithSelection<TSelection, TAlias>): SubqueryWithSelection<TSelection, TAlias>['_']['selectedFields'] {
  return Object.fromEntries(
    Object.entries(sq._.selectedFields).map(([key, value]) => [sql.raw(`"${sq._.alias}"."${key}"`), value]),
  );
}
