import { ticketCategoryTable } from "db/schema";
import { and, eq, InferInsertModel, InferSelectModel, isNull } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Language } from "i18n/instance";

export type TicketCategoryInsertModel = InferInsertModel<typeof ticketCategoryTable>;
export type TicketCategorySelectNodel = InferSelectModel<typeof ticketCategoryTable>;

export type DbTicketCategoryServiceOptions = {
  db: PostgresJsDatabase;
};

export class DbTicketCategoryService {
  public readonly db: PostgresJsDatabase;

  public constructor (options: DbTicketCategoryServiceOptions) {
    this.db = options.db;
  }

  public async create (data: TicketCategoryInsertModel): Promise<void> {
    await this.db
      .insert(ticketCategoryTable)
      .values(data)
      .execute();
  }

  public async select (categoryId: string): Promise<TicketCategorySelectNodel | null> {
    const [category] = await this.db
      .select()
      .from(ticketCategoryTable)
      .where(and(
        eq(ticketCategoryTable.id, categoryId),
        isNull(ticketCategoryTable.deletedAt),
      ))
      .execute();

    return category ?? null;
  }

  public async selectAll (): Promise<TicketCategorySelectNodel[]> {
    return await this.db
      .select()
      .from(ticketCategoryTable)
      .where(isNull(ticketCategoryTable.deletedAt))
      .execute();
  }

  public async updateName (categoryId: string, language: Language, name: string): Promise<void> {
    const category = await this.select(categoryId);
    if (category == null) return;

    await this.db
      .update(ticketCategoryTable)
      .set({ name: { ...category.name, [language]: name } })
      .where(eq(ticketCategoryTable.id, categoryId))
      .execute();
  }

  public async updateWelcome (categoryId: string, language: Language, welcome: string): Promise<void> {
    const category = await this.select(categoryId);
    if (category == null) return;

    await this.db
      .update(ticketCategoryTable)
      .set({ welcome: { ...category.welcome, [language]: welcome } })
      .where(eq(ticketCategoryTable.id, categoryId))
      .execute();
  }

  public async delete (categoryId: string): Promise<void> {
    await this.db
      .update(ticketCategoryTable)
      .set({ deletedAt: new Date() })
      .where(eq(ticketCategoryTable.id, categoryId))
      .execute();
  }
}
