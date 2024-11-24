import { config } from "config";
import { dbTicketCategoryService, dbTicketService } from "db/services";
import { ButtonInteraction, ButtonStyle, ChannelType, GuildTextBasedChannel, TextChannel } from "discord.js";
import { ThreadModeratorGuard } from "discord/guards";
import { ButtonComponent, Discord, Guard } from "discordx";
import { i18n } from "i18n/instance";
import { Language } from "i18n/constants";
import { createButtons } from "utils/discord/buttons";
import { resolveInteractionMemberData } from "utils/discord/resolve";
import discordTranscripts from 'discord-html-transcripts';
import { logger } from "logger";

export type TicketCloseAction = 'accept' | 'reject' | 'delete';

@Discord()
export class CloseTicketButton {
  @ButtonComponent({ id: /^thread@[a-z\-]+@close$/i })
  @Guard(ThreadModeratorGuard)
  public async closeTicket (interaction: ButtonInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const [, language] = interaction.customId.split('@') as [string, Language];

    const buttonRows = createButtons([
      {
        id: `thread@${language}@close@accept`,
        label: i18n.__('{{thread_buttons.close.accept.labels}}', undefined, language),
        style: ButtonStyle.Success,
      },
      {
        id: `thread@${language}@close@reject`,
        label: i18n.__('{{thread_buttons.close.reject.labels}}', undefined, language),
        style: ButtonStyle.Danger,
      },
      {
        id: `thread@${language}@close@delete`,
        label: i18n.__('{{thread_buttons.close.delete.labels}}', undefined, language),
        style: ButtonStyle.Danger,
      },
    ]);

    await interaction.editReply({
      content: i18n.__('{{thread_buttons.close.text}}', undefined, language),
      components: buttonRows,
    });
  }

  @ButtonComponent({ id: /^thread@[a-z\-]+@close@[a-z]+$/i })
  @Guard(ThreadModeratorGuard)
  public async closeTicketCancel (interaction: ButtonInteraction<'cached'>): Promise<void> {
    const [, language,, action] = interaction.customId.split('@') as [string, Language, string, TicketCloseAction];

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
      filename: `${ticket.createdAt.toUTCString()}_${language}-${category.name['en']}_${ticketMemberData.displayName}.html`,
      footerText: `${ticket.createdAt.toUTCString()}\n${language}-${category.name['en']}\n${ticketMemberData.displayName}`,
    });

    await transcriptChannel.send({
      content: `Ticket ${language} ${category.name['en']} by <@${ticket.userId}> (${ticketMemberData.displayName}) deleted by <@${interaction.user.id}> (${memberData.displayName})`,
      files: [transcript],
    });

    await channel.delete();
  }
}
