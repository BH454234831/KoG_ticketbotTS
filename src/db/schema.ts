import { bigint, foreignKey, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, varchar } from 'drizzle-orm/pg-core';
import { languages, type Language } from 'i18n/constants';
import { bigintString, bytea, createdAtTimestampDate, deletedAtTimestampDate, updatedAtTimestampDate } from 'utils/drizzle';

export const languageEnum = pgEnum('language', languages);

export const ticketStatusValues = ['open', 'accept', 'reject', 'delete'] as const;
export type TicketStatus = typeof ticketStatusValues[number];
export const ticketStatusEnum = pgEnum('ticket_status', ticketStatusValues);

export const userTable = pgTable('user', {
  id: bigintString('id').primaryKey(),
  username: varchar('username', { length: 32 }),
  displayName: varchar('display_name', { length: 64 }),
  displayAvatarUrl: varchar('display_icon_url', { length: 256 }),

  createdAt: createdAtTimestampDate,
  updatedAt: updatedAtTimestampDate,
});

export const ticketCategoryTable = pgTable('ticket_category', {
  id: bigint('id', { mode: 'bigint' }).generatedAlwaysAsIdentity().primaryKey(),
  guildId: bigintString('guild_id').notNull(),
  channelId: bigintString('channel_id').notNull(),
  name: jsonb('name').$type<Record<Language, string>>().notNull(),
  welcome: jsonb('welcome').$type<Record<Language, string>>(),
  requiredRoleIds: bigintString('required_role_id').array(),

  autodeleteMinutes: integer('autodelete_minutes'),

  createdAt: createdAtTimestampDate,
  updatedAt: updatedAtTimestampDate,
  deletedAt: deletedAtTimestampDate,
});

export const ticketTable = pgTable('ticket', {
  channelId: bigintString('channel_id').notNull().primaryKey(),
  guildId: bigintString('guild_id').notNull(),
  userId: bigintString('user_id').notNull(),
  language: languageEnum('language').notNull(),
  categoryId: bigintString('category').notNull(),
  status: ticketStatusEnum('ticket_status').notNull().default('open'),

  createdAt: createdAtTimestampDate,
  updatedAt: updatedAtTimestampDate,
}, (table) => [
  foreignKey({ name: 'fk__ticket__category_id', columns: [table.categoryId], foreignColumns: [ticketCategoryTable.id] }).onUpdate('cascade').onDelete('cascade'),
  foreignKey({ name: 'fk__ticket__user_id', columns: [table.userId], foreignColumns: [userTable.id] }).onUpdate('cascade').onDelete('cascade'),
  index('idx__ticket__created_at').on(table.createdAt),
  index('idx__ticket__user_id').on(table.userId, table.createdAt),
  index('idx__ticket__channel_id').on(table.channelId),
]);

export const ticketUserTable = pgTable('ticket_user', {
  channelId: bigintString('id').notNull(),
  userId: bigintString('user_id').notNull(),

  createdAt: createdAtTimestampDate,
  updatedAt: updatedAtTimestampDate,
  deletedAt: deletedAtTimestampDate,
}, (table) => [
  primaryKey({ name: 'pk__ticket_user', columns: [table.channelId, table.userId] }),
  foreignKey({ name: 'fk__ticket_user__channel_id', columns: [table.channelId], foreignColumns: [ticketTable.channelId] }).onUpdate('cascade').onDelete('cascade'),
  foreignKey({ name: 'fk__ticket_user__user_id', columns: [table.userId], foreignColumns: [userTable.id] }).onUpdate('cascade').onDelete('cascade'),
  index('idx__ticket_user__channel_id').on(table.channelId),
  index('idx__ticket_user__user_id').on(table.userId),
]);

export const ticketMessageTable = pgTable('ticket_message', {
  messageId: bigintString('message_id').primaryKey(),
  channelId: bigintString('channel_id').notNull(),
  userId: bigintString('user_id').notNull(),

  text: text('text').notNull(),

  createdAt: createdAtTimestampDate,
  updatedAt: updatedAtTimestampDate,
  deletedAt: deletedAtTimestampDate,
}, (table) => [
  foreignKey({ name: 'fk__ticket_message__channel_id', columns: [table.channelId], foreignColumns: [ticketTable.channelId] }).onUpdate('cascade').onDelete('cascade'),
  foreignKey({ name: 'fk__ticket_message__user_id', columns: [table.userId], foreignColumns: [userTable.id] }).onUpdate('cascade').onDelete('cascade'),
  index('idx__ticket_message__channel_id').on(table.channelId),
  index('idx__ticket_message__user_id').on(table.userId),
  index('idx__ticket_message__created_at').on(table.createdAt),
]);

export const ticketMessageFileTable = pgTable('ticket_message_file', {
  id: bigint('id', { mode: 'bigint' }).generatedAlwaysAsIdentity().primaryKey(),
  messageId: bigintString('message_id').notNull(),

  file: bytea('file').notNull(),
  mime: varchar('mime', { length: 32 }),
  name: varchar('name', { length: 256 }).notNull(),
  url: varchar('url', { length: 256 }).notNull(),

  createdAt: createdAtTimestampDate,
}, (table) => [
  foreignKey({ name: 'fk__ticket_message_file__message_id', columns: [table.messageId], foreignColumns: [ticketMessageTable.messageId] }).onUpdate('cascade').onDelete('cascade'),
  index('idx__ticket_message_file__message_id').on(table.messageId),
]);
