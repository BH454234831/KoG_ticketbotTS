import { ticketMessageFileTable, ticketMessageTable, TicketStatus, ticketTable } from "db/schema";
import { and, eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type TicketInsertModel = InferInsertModel<typeof ticketTable>;
export type TicketSelectModel = InferSelectModel<typeof ticketTable>;

export type TicketMessageInsertModel = InferInsertModel<typeof ticketMessageTable>;
export type TicketMessageSelectModel = InferSelectModel<typeof ticketMessageTable>;

export type TicketMessageFileInsertModel = InferInsertModel<typeof ticketMessageFileTable>;
export type TicketMessageFileSelectModel = InferSelectModel<typeof ticketMessageFileTable>;

export type DbTicketServiceOptions = {
  db: PostgresJsDatabase;
};

export class DbTicketService {
  public readonly db: PostgresJsDatabase;

  public constructor (options: DbTicketServiceOptions) {
    this.db = options.db;
  }

  public async createTicket (data: TicketInsertModel): Promise<void> {
    await this.db
      .insert(ticketTable)
      .values(data)
      .execute();
  }

  public async getTicketByChannelId (channelId: string): Promise<TicketSelectModel | null> {
    const [ticket] = await this.db
      .select()
      .from(ticketTable)
      .where(eq(ticketTable.channelId, channelId))
      .execute();

    return ticket ?? null;
  }

  public async getOpenTicketsByUserId (userId: string, categoryId?: string): Promise<TicketSelectModel[]> {
    return await this.db
      .select()
      .from(ticketTable)
      .where(and(
        eq(ticketTable.userId, userId),
        categoryId != null ? eq(ticketTable.categoryId, categoryId) : undefined,
        eq(ticketTable.status, 'open'),
      ))
      .execute();
  }

  public async setTicketStatus (channelId: string, status: TicketStatus): Promise<void> {
    await this.db
      .update(ticketTable)
      .set({ status })
      .where(eq(ticketTable.channelId, channelId))
      .execute();
  }

  public async createMessage (data: TicketMessageInsertModel, files: TicketMessageFileInsertModel[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(ticketMessageTable)
        .values(data);

      await tx
        .insert(ticketMessageFileTable)
        .values(files);
    });
  }
}
