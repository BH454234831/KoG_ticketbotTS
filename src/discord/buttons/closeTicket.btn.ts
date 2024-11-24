import { config } from "config";
import { dbTicketCategoryService, dbTicketService } from "db/services";
import { ButtonInteraction, ButtonStyle } from "discord.js";
import { ThreadModeratorGuard } from "discord/guards";
import { ButtonComponent, Discord, Guard } from "discordx";
import { i18n, Language } from "i18n/instance";
import { createButtons } from "utils/discord/buttons";
import { resolveInteractionMemberData } from "utils/discord/resolve";
import discordTranscripts from 'discord-html-transcripts';

export type TicketCloseAction = 'accept' | 'reject' | 'delete' | 'cancel';

@Discord()
export class CloseTicketButton {
  @ButtonComponent({ id: /thread@[a-z\-]+@close/i })
  @Guard(ThreadModeratorGuard)
  public async closeTicket (interaction: ButtonInteraction): Promise<void> {
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
      {
        id: `thread@${language}@close@cancel`,
        label: i18n.__('{{thread_buttons.close.cancel.labels}}', undefined, language),
        style: ButtonStyle.Success,
      },
    ]);

    await interaction.editReply({
      content: i18n.__('{{thread_buttons.close.text}}', undefined, language),
      components: buttonRows,
    });
  }

  @ButtonComponent({ id: /thread@[a-z\-]+@close@[a-z]+/i })
  @Guard(ThreadModeratorGuard)
  public async closeTicketCancel (interaction: ButtonInteraction): Promise<void> {
    const [, language,, action] = interaction.customId.split('@') as [string, Language, string, TicketCloseAction];

    if (action === 'cancel') {
      await interaction.deferReply({ ephemeral: true });
      await interaction.message.delete();
      await interaction.deleteReply();
      return;
    }

    if (interaction.guild == null) return;
    if (interaction.channel == null) return;
    if (!interaction.channel.isThread()) return;
    if (interaction.channel.parent == null) return;

    const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) return;

    const category = await dbTicketCategoryService.select(ticket.categoryId);
    if (category == null) return;

    await interaction.deferReply({ ephemeral: true });

    await dbTicketService.setTicketStatus(interaction.channelId, action);

    const otherTickets = await dbTicketService.getOpenTicketsByUserId(interaction.user.id, ticket.categoryId);

    await interaction.channel.members.remove(interaction.user);

    if (otherTickets.length === 0) {
      await interaction.channel.parent.permissionOverwrites.delete(interaction.user);
    }

    await interaction.channel.delete();

    const transcriptChannel = interaction.guild.channels.cache.get(config.TRANSCRIPT_CHANNEL_ID);
    if (transcriptChannel == null) return;
    if (!transcriptChannel.isTextBased()) return;

    const ticketMemberData = await resolveInteractionMemberData(interaction, ticket.userId);
    const memberData = await resolveInteractionMemberData(interaction);

    const transcript = await discordTranscripts.createTranscript(interaction.channel, {
      saveImages: true,
      poweredBy: false,
      filename: `${ticket.createdAt.toUTCString()}_${language}-${category.name['en']}_${ticketMemberData.displayName}.html`,
      footerText: `${ticket.createdAt.toUTCString()}\n${language}-${category.name['en']}\n${ticketMemberData.displayName}`,
    });

    await transcriptChannel.send({
      content: `Ticket ${language} ${category.name['en']} by <@${ticket.userId}> (${ticketMemberData.displayName}) deleted by <@${interaction.user.id}> (${memberData.displayName})`,
      files: [transcript],
    });
  }
}
