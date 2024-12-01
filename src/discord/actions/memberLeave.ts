import { dbTicketService } from 'db/services';
import { type Guild, type ThreadChannel, type GuildMember, type PartialGuildMember } from 'discord.js';
import { resolveMemberDataUser } from 'discord/resolve';
import { i18n } from 'i18n/instance';

export async function memberLeave (guild: Guild, member: GuildMember | PartialGuildMember): Promise<void> {
  const tickets = await dbTicketService.getOpenTicketsByUserId(member.id);
  const memberData = await resolveMemberDataUser(guild, member.id);

  for (const ticket of tickets) {
    const channel = guild.channels.cache.get(ticket.channelId) as ThreadChannel | undefined;
    if (channel == null) {
      await dbTicketService.setTicketStatus(ticket.channelId, 'delete');
      continue;
    }

    await channel.send({
      content: i18n.__('{{ticket_messages.leave}}', { userId: member.id, displayName: memberData.displayName ?? member.user.username }, ticket.language),
    });

    await dbTicketService.deleteTicketUser(ticket.channelId, member.id);
  }
}
