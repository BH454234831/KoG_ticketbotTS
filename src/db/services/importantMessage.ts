import { importantMessageTable } from "db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { PgGenericDatabase } from "utils/drizzle";

export type ImportantMessageSelectModel = InferSelectModel<typeof importantMessageTable>;

export type DbImportantMessageServiceOptions = {
  db: PostgresJsDatabase;
};

export class DbImportantMessageService {
  public readonly db: PostgresJsDatabase;

  public constructor (options: DbImportantMessageServiceOptions) {
    this.db = options.db;
  }

  public async insert (message: { guildId: string; channelId: string; messageId: string }, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx
      .insert(importantMessageTable)
      .values(message)
      .execute();
  }

  public async selectAll (): Promise<ImportantMessageSelectModel[]> {
    return this.db
      .select()
      .from(importantMessageTable)
      .execute();
  }

  public async delete (messageId: string, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx
      .delete(importantMessageTable)
      .where(eq(importantMessageTable.messageId, messageId))
      .execute();
  }
}
