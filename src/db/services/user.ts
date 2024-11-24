import { userTable } from "db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { coalesce, excluded, PgGenericDatabase } from "utils/drizzle";

export type UserInsertModel = InferInsertModel<typeof userTable>;
export type UserSelectModel = InferSelectModel<typeof userTable>;

export type DbUserServiceOptions = {
  db: PostgresJsDatabase;
};

export class DbUserService {
  public readonly db: PostgresJsDatabase;

  public constructor (options: DbUserServiceOptions) {
    this.db = options.db;
  }

  public async upsert (user: UserInsertModel, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx
      .insert(userTable)
      .values(user)
      .onConflictDoUpdate({
        target: [userTable.id],
        set: {
          displayName: excluded(userTable.displayName),
          displayAvatarUrl: coalesce(excluded(userTable.displayAvatarUrl), userTable.displayAvatarUrl),
        },
      })
      .execute();
  }
}
