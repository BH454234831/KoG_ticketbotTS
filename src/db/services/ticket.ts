import { ticketMessageFileTable, ticketMessageTable, type TicketStatus, ticketTable, ticketUserTable } from 'db/schema';
import { and, desc, eq, type InferInsertModel, type InferSelectModel, isNotNull, isNull, not } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type DbUserService, type UserInsertModel } from './user.js';
import { type PgGenericDatabase } from 'utils/drizzle';

export type TicketInsertModel = InferInsertModel<typeof ticketTable>;
export type TicketSelectModel = InferSelectModel<typeof ticketTable>;

export type TicketUserSelectModel = InferSelectModel<typeof ticketUserTable>;

export type TicketMessageInsertModel = InferInsertModel<typeof ticketMessageTable>;
export type TicketMessageSelectModel = InferSelectModel<typeof ticketMessageTable>;

export type TicketMessageFileInsertModel = InferInsertModel<typeof ticketMessageFileTable>;
export type TicketMessageFileSelectModel = InferSelectModel<typeof ticketMessageFileTable>;

export type DbTicketServiceOptions = {
  db: PostgresJsDatabase;
  dbUserService: DbUserService;
};

export class DbTicketService {
  public readonly db: PostgresJsDatabase;
  public readonly dbUserService: DbUserService;

  public constructor (options: DbTicketServiceOptions) {
    this.db = options.db;
    this.dbUserService = options.dbUserService;
  }

  public async createTicket (ticketData: TicketInsertModel, userData: UserInsertModel, firstMessageId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.dbUserService.upsert(userData, tx);

      await tx
        .insert(ticketTable)
        .values(ticketData)
        .execute();

      await this._addTicketUser(ticketData.channelId, userData, tx);
    });
  }

  public async getTicketByChannelId (channelId: string): Promise<TicketSelectModel | null> {
    const [ticket] = await this.db
      .select()
      .from(ticketTable)
      .where(eq(ticketTable.channelId, channelId))
      .execute();

    return ticket ?? null;
  }

  public async getOpenTickets (): Promise<TicketSelectModel[]> {
    const tickets = await this.db
      .select()
      .from(ticketTable)
      .where(eq(ticketTable.status, 'open'))
      .execute();

    return tickets;
  }

  public async getOpenTicketsByUserId (userId: string, categoryId?: string): Promise<TicketSelectModel[]> {
    const tickets = await this.db
      .select()
      .from(ticketUserTable)
      .innerJoin(ticketTable, eq(ticketTable.channelId, ticketUserTable.channelId))
      .where(and(
        eq(ticketUserTable.userId, userId),
        isNotNull(ticketUserTable.deletedAt),
        categoryId != null ? eq(ticketTable.categoryId, categoryId) : undefined,
        eq(ticketTable.status, 'open'),
      ))
      .execute();

    return tickets.map(ticket => ticket.ticket);
  }

  public async setTicketStatus (channelId: string, status: TicketStatus): Promise<TicketSelectModel | null> {
    const [ticket] = await this.db
      .update(ticketTable)
      .set({ status })
      .where(eq(ticketTable.channelId, channelId))
      .returning()
      .execute();
    return ticket ?? null;
  }

  public async updateTicketCategory (channelId: string, categoryId: string, newChannelId: string): Promise<TicketSelectModel | null> {
    const [ticket] = await this.db
      .update(ticketTable)
      .set({ categoryId, channelId: newChannelId })
      .where(eq(ticketTable.channelId, channelId))
      .returning()
      .execute();
    return ticket ?? null;
  }

  public async addTicketMessage (messageData: TicketMessageInsertModel, files: TicketMessageFileInsertModel[], userData: UserInsertModel): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.dbUserService.upsert(userData, tx);

      await tx
        .insert(ticketMessageTable)
        .values(messageData)
        .onConflictDoNothing()
        .execute();

      if (files.length > 0) {
        await tx
          .insert(ticketMessageFileTable)
          .values(files)
          .onConflictDoNothing()
          .execute();
      }
    });
  }

  public async updateTicketMessage (messageId: string, text: string): Promise<void> {
    await this.db
      .update(ticketMessageTable)
      .set({ text })
      .where(eq(ticketMessageTable.messageId, messageId))
      .execute();
  }

  public async deleteTicketMessage (messageId: string): Promise<void> {
    await this.db
      .update(ticketMessageTable)
      .set({ deletedAt: new Date() })
      .where(eq(ticketMessageTable.messageId, messageId))
      .execute();
  }

  public async getTicketUsers (channelId: string, exceptId?: string): Promise<TicketUserSelectModel[]> {
    const members = await this.db
      .select()
      .from(ticketUserTable)
      .where(and(
        eq(ticketUserTable.channelId, channelId),
        isNull(ticketUserTable.deletedAt),
        exceptId != null ? not(eq(ticketUserTable.userId, exceptId)) : undefined,
      ))
      .execute();

    return members;
  }

  protected async _addTicketUser (channelId: string, userData: UserInsertModel, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx
      .insert(ticketUserTable)
      .values({
        channelId,
        userId: userData.id,
      })
      .onConflictDoUpdate({
        target: [ticketUserTable.channelId, ticketUserTable.userId],
        set: {
          deletedAt: null,
        },
      })
      .execute();
  }

  public async addTicketUser (channelId: string, userData: UserInsertModel, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx.transaction(async (tx) => {
      await this.dbUserService.upsert(userData, tx);

      await this._addTicketUser(channelId, userData, tx);
    });
  }

  public async deleteTicketUser (channelId: string, userId: string, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx
      .update(ticketUserTable)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(ticketUserTable.channelId, channelId),
        eq(ticketUserTable.userId, userId),
      ))
      .execute();
  }

  public async getLastTicketMessage (channelId: string): Promise<TicketMessageSelectModel | null> {
    const [message] = await this.db
      .select()
      .from(ticketMessageTable)
      .where(eq(ticketMessageTable.channelId, channelId))
      .orderBy(desc(ticketMessageTable.createdAt))
      .limit(1)
      .execute();

    return message ?? null;
  }
}
