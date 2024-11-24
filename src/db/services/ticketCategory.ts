import { ticketCategoryTable } from 'db/schema';
import { and, eq, ilike, type InferInsertModel, type InferSelectModel, isNull } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type Language } from 'i18n/constants';
import { jsonFieldDeep } from 'utils/drizzle';

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
        eq(ticketCategoryTable.id, BigInt(categoryId)),
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

  public async selectSearch (name: string): Promise<TicketCategorySelectNodel[]> {
    return await this.db
      .select()
      .from(ticketCategoryTable)
      .where(and(
        ilike(jsonFieldDeep(ticketCategoryTable.name, ['en']), `%${name}%`),
        isNull(ticketCategoryTable.deletedAt),
      ))
      .execute();
  }

  public async updateName (categoryId: string, language: Language, name: string): Promise<void> {
    const category = await this.select(categoryId);
    if (category == null) return;

    await this.db
      .update(ticketCategoryTable)
      .set({ name: { ...category.name, [language]: name } })
      .where(eq(ticketCategoryTable.id, BigInt(categoryId)))
      .execute();
  }

  public async updateWelcome (categoryId: string, language: Language, welcomes: Record<Language, string>): Promise<void> {
    await this.db
      .update(ticketCategoryTable)
      .set({ welcome: welcomes })
      .where(eq(ticketCategoryTable.id, BigInt(categoryId)))
      .execute();
  }

  public async addRequiredRole (categoryId: string, roleId: string): Promise<void> {
    const category = await this.select(categoryId);
    if (category == null) return;

    const roles = new Set(category.requiredRoleIds ?? []);
    roles.add(roleId);

    const newRoles = Array.from(roles);

    await this.db
      .update(ticketCategoryTable)
      .set({ requiredRoleIds: newRoles })
      .where(eq(ticketCategoryTable.id, BigInt(categoryId)))
      .execute();
  }

  public async removeRequiredRole (categoryId: string, roleId: string): Promise<void> {
    const category = await this.select(categoryId);
    if (category == null) return;
    if (category.requiredRoleIds == null) return;

    const roles = new Set(category.requiredRoleIds);
    roles.delete(roleId);

    const newRoles = roles.size > 0 ? Array.from(roles) : null;

    await this.db
      .update(ticketCategoryTable)
      .set({ requiredRoleIds: newRoles })
      .where(eq(ticketCategoryTable.id, BigInt(categoryId)))
      .execute();
  }

  public async delete (categoryId: string): Promise<void> {
    await this.db
      .update(ticketCategoryTable)
      .set({ deletedAt: new Date() })
      .where(eq(ticketCategoryTable.id, BigInt(categoryId)))
      .execute();
  }

  public async deleteByChannelId (channelId: string): Promise<void> {
    await this.db
      .update(ticketCategoryTable)
      .set({ deletedAt: new Date() })
      .where(eq(ticketCategoryTable.channelId, channelId))
      .execute();
  }
}
