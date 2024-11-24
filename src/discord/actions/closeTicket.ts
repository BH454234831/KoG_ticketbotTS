import { config } from 'config';
import { dbTicketCategoryService, dbTicketService } from 'db/services';
import { logger } from 'logger';
import { resolveInteractionMemberData } from 'utils/discord/resolve';
import discordTranscripts from 'discord-html-transcripts';
import { type ButtonInteraction, type CommandInteraction, type TextChannel } from 'discord.js';
import { type Language } from 'i18n/constants';

export type TicketCloseAction = 'accept' | 'reject' | 'delete';

export async function closeTicket (interaction: CommandInteraction<'cached'> | ButtonInteraction<'cached'>, language: Language, action: TicketCloseAction): Promise<void> {
  const channel = interaction.channel ?? interaction.guild.channels.cache.get(interaction.channelId);

  if (channel == null) {
    logger.info(`[CloseTicketButton][closeTicketCancel] channel not found: ${interaction.channelId}`);
    return;
  }
  if (!channel.isThread()) {
    logger.info(`[CloseTicketButton][closeTicketCancel] channel is not thread: ${interaction.channelId}`);
    return;
  }
  if (channel.parentId == null) {
    logger.info(`[CloseTicketButton][closeTicketCancel] channel has no parent: ${interaction.channelId}`);
    return;
  }

  const parent = channel.parent ?? interaction.guild.channels.cache.get(channel.parentId) as TextChannel | undefined;

  if (parent == null) {
    logger.info(`[CloseTicketButton][closeTicketCancel] parent not found: ${channel.parentId}`);
    return;
  }

  const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
  if (ticket == null) {
    logger.info(`[CloseTicketButton][closeTicketCancel] ticket not found: ${interaction.channelId}`);
    return;
  }

  const category = await dbTicketCategoryService.select(ticket.categoryId);
  if (category == null) return;

  await interaction.deferReply({ ephemeral: true });

  await dbTicketService.setTicketStatus(interaction.channelId, action);

  const otherTickets = await dbTicketService.getOpenTicketsByUserId(interaction.user.id, ticket.categoryId);

  await channel.members.remove(interaction.user);

  if (otherTickets.length === 0) {
    await parent.permissionOverwrites.delete(interaction.user);
  }

  const transcriptChannel = interaction.guild.channels.cache.get(config.TRANSCRIPT_CHANNEL_ID);
  if (transcriptChannel == null) return;
  if (!transcriptChannel.isTextBased()) return;

  const ticketMemberData = await resolveInteractionMemberData(interaction, ticket.userId);
  const memberData = await resolveInteractionMemberData(interaction);

  const transcript = await discordTranscripts.createTranscript(channel, {
    saveImages: true,
    poweredBy: false,
    filename: `${ticket.createdAt.toUTCString()}_${language}-${category.name.en}_${ticketMemberData.displayName}.html`,
    footerText: `${ticket.createdAt.toUTCString()}\n${language}-${category.name.en}\n${ticketMemberData.displayName}`,
  });

  await transcriptChannel.send({
    embeds: [{
      title: 'Ticket closed',
      color: 16711680,
      fields: [
        {
          name: 'Ticket category',
          value: `${language} ${category.name.en}`,
        },
        {
          name: 'Deleted by',
          value: `<@${interaction.user.id}> (${memberData.displayName})`,
          inline: false,
        },
        {
          name: 'Created by',
          value: `<@${ticket.userId}> (${ticketMemberData.displayName})`,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    }],
    files: [transcript],
  });

  await channel.delete();
}
