import { dbTicketCategoryService, dbTicketService } from 'db/services';
import { type ThreadChannel } from 'discord.js';
import { resolveMemberDataUser } from 'discord/resolve';
import { type ResolvedMemberData } from 'utils/discord/resolve';

export async function addTicketUser (thread: ThreadChannel, userId: string, options?: { saveDb?: boolean; memberData?: ResolvedMemberData }): Promise<void> {
  const channel = thread.parent;
  if (channel == null) throw new Error('channel is null');

  await channel.permissionOverwrites.create(userId, {
    ViewChannel: true,
  });

  await thread.members.add(userId);

  if (options?.saveDb === true) {
    const memberData = options?.memberData ?? await resolveMemberDataUser(channel.guild, userId);

    await dbTicketService.addTicketUser(thread.id, { id: userId, ...memberData });
  }
}

export async function removeTicketUser (thread: ThreadChannel, userId: string, options?: { saveDb?: boolean }): Promise<void> {
  const channel = thread.parent;
  if (channel == null) throw new Error('channel is null');

  const category = await dbTicketCategoryService.select(channel.id);
  if (category == null) throw new Error('category is null');

  const otherTickets = await dbTicketService.getOpenTicketsByUserId(userId, category.id.toString());

  await thread.members.remove(userId);

  if (otherTickets.length === 0) {
    await channel.permissionOverwrites.delete(userId);
  }

  if (options?.saveDb === true) {
    await dbTicketService.deleteTicketUser(thread.id, userId);
  }
}

export async function removeTicketUsers (thread: ThreadChannel, options?: { saveDb?: boolean }): Promise<void> {
  const members = await dbTicketService.getTicketUser(thread.id);

  for (const member of members) {
    await removeTicketUser(thread, member.userId, options);
  }
}
