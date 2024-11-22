/* eslint-disable require-extensions/require-extensions */
import { Placeholder, sql } from 'drizzle-orm';
import { customType, timestamp } from 'drizzle-orm/pg-core';

export const bigintString = customType<{
  data: string;
  driverData: bigint;
}>({
  dataType: () => 'bigint',
  toDriver: (value: string | Placeholder) => {
    if (value instanceof Placeholder) return value.getSQL();
    return BigInt(value);
  },
  fromDriver: (value) => {
    return String(value);
  },
});

export const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType () {
    return 'bytea';
  },
});

export const byteaHex = customType<{ data: string; driverData: Buffer; notNull: false; default: false }>({
  dataType () {
    return 'bytea';
  },
  toDriver (value: string | Placeholder) {
    if (value instanceof Placeholder) return value.getSQL();

    if (value.startsWith('0x')) {
      return Buffer.from(value.slice(2), 'hex');
    }

    return Buffer.from(value, 'hex');
  },
  fromDriver (val) {
    return val.toString('hex');
  },
});

export const createdAtTimestampDate = timestamp('created_at', { precision: 3 }).notNull().default(sql`now()`).$default(() => new Date());
export const updatedAtTimestampDate = timestamp('updated_at', { precision: 3 }).notNull().default(sql`now()`).$default(() => new Date()).$onUpdate(() => new Date());
export const deletedAtTimestampDate = timestamp('deleted_at', { precision: 3 });
