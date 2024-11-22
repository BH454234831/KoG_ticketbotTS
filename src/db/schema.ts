import { bigint, foreignKey, index, jsonb, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { Language } from "i18n/instance";
import { bigintString, bytea, createdAtTimestampDate, deletedAtTimestampDate, updatedAtTimestampDate } from "utils/drizzle";

export const ticketStatusValues = ['open', 'accepted', 'rejected', 'deleted'] as const;
export type TicketStatus = typeof ticketStatusValues[number];
export const ticketStatusEnum = pgEnum('ticket_status', ticketStatusValues);

export const ticketCategoryTable = pgTable('ticket_category', {
  id: bigintString('id').primaryKey(),
  name: jsonb('name').$type<Record<Language, string>>().notNull(),
  welcome: jsonb('welcome').$type<Record<Language, string>>().notNull(),

  createdAt: createdAtTimestampDate,
  updatedAt: updatedAtTimestampDate,
  deletedAt: deletedAtTimestampDate,
});

export const ticketTable = pgTable('ticket', {
  channelId: bigintString('channel_id').notNull().primaryKey(),
  userId: bigintString('user_id').notNull(),
  language: varchar('language', { length: 8 }).notNull(),
  category: bigintString('category').notNull(),
  status: ticketStatusEnum('ticket_status').notNull().default('open'),

  userName: varchar('user_name', { length: 64 }).notNull(),
  userIcon: varchar('user_icon', { length: 256 }).notNull(),

  createdAt: createdAtTimestampDate,
}, (table) => [
  foreignKey({ name: 'fk__ticket__category', columns: [table.category], foreignColumns: [ticketCategoryTable.id] }).onUpdate('cascade').onDelete('cascade'),
  index('idx__ticket__created_at').on(table.createdAt),
  index('idx__ticket__user_id').on(table.userId, table.createdAt),
  index('idx__ticket__channel_id').on(table.channelId),
]);

export const ticketMessageTable = pgTable('ticket_message', {
  messageId: bigintString('message_id').primaryKey(),
  channelId: bigintString('channel_id').notNull(),
  userId: bigintString('user_id').notNull(),
  userName: varchar('user_name', { length: 64 }).notNull(),
  userIcon: varchar('user_icon', { length: 256 }).notNull(),

  createdAt: createdAtTimestampDate,
}, (table) => [
  foreignKey({ name: 'fk__ticket_message__channel_id', columns: [table.channelId], foreignColumns: [ticketTable.channelId] }).onUpdate('cascade').onDelete('cascade'),
  index('idx__ticket_message__channel_id').on(table.channelId, table.userId),
  index('idx__ticket_message__created_at').on(table.createdAt),
]);

export const ticketMessageFileTable = pgTable('ticket_message_file', {
  id: bigint('id', { mode: 'bigint' }).generatedAlwaysAsIdentity().primaryKey(),
  messageId: bigintString('message_id').notNull(),

  file: bytea('file').notNull(),
  mime: varchar('mime', { length: 256 }).notNull(),
  name: varchar('name', { length: 256 }).notNull(),

  createdAt: createdAtTimestampDate,
}, (table) => [
  foreignKey({ name: 'fk__ticket_message_file__message_id', columns: [table.messageId], foreignColumns: [ticketMessageTable.messageId] }).onUpdate('cascade').onDelete('cascade'),
  index('idx__ticket_message_file__message_id').on(table.messageId),
]);
