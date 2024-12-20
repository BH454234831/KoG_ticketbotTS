import { userTable } from 'db/schema';
import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { coalesce, excluded, type PgGenericDatabase } from 'utils/drizzle';

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

  public async getById (id: string): Promise<UserSelectModel | null> {
    const [user] = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .execute();

    return user ?? null;
  }

  public async upsert (user: UserInsertModel, dbtx: PgGenericDatabase = this.db): Promise<void> {
    await dbtx
      .insert(userTable)
      .values(user)
      .onConflictDoUpdate({
        target: [userTable.id],
        set: {
          displayName: coalesce(excluded(userTable.displayName), userTable.displayName),
          displayAvatarUrl: coalesce(excluded(userTable.displayAvatarUrl), userTable.displayAvatarUrl),
        },
      })
      .execute();
  }
}
