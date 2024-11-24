import { ticketMessageFileTable, ticketMessageTable, TicketStatus, ticketTable, ticketUserTable } from "db/schema";
import { and, eq, InferInsertModel, InferSelectModel, isNotNull } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { type DbUserService, UserInsertModel } from "./user";
import { PgGenericDatabase } from "utils/drizzle";

export type TicketInsertModel = InferInsertModel<typeof ticketTable>;
export type TicketSelectModel = InferSelectModel<typeof ticketTable>;

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

      await this._upsertTicketUser(ticketData.channelId, userData, tx);
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

  public async setTicketStatus (channelId: string, status: TicketStatus): Promise<void> {
    await this.db
      .update(ticketTable)
      .set({ status })
      .where(eq(ticketTable.channelId, channelId))
      .execute();
  }

  public async addTicketUser (channelId: string, userData: UserInsertModel, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx.transaction(async (tx) => {
      await this.dbUserService.upsert(userData, tx);

      await this._upsertTicketUser(channelId, userData, tx);
    })
  }

  public async deleteTicketUser (channelId: string, userId: string): Promise<void> {
    await this.db
      .update(ticketUserTable)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(ticketUserTable.channelId, channelId),
        eq(ticketUserTable.userId, userId),
      ))
      .execute();
  }

  public async addTicketMessage (messageData: TicketMessageInsertModel, files: TicketMessageFileInsertModel[], userData: UserInsertModel): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.dbUserService.upsert(userData, tx);

      await tx
        .insert(ticketMessageTable)
        .values(messageData)
        .execute();

      await tx
        .insert(ticketMessageFileTable)
        .values(files)
        .execute();
    });
  }

  protected async _upsertTicketUser (channelId: string, userData: UserInsertModel, dbtx: PgGenericDatabase = this.db): Promise<void> {
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
}
