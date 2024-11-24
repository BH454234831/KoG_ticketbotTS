import { config } from "config";
import { dbTicketCategoryService, dbTicketService } from "db/services";
import { ButtonInteraction, ButtonStyle, ChannelType, CommandInteraction, GuildTextBasedChannel, TextChannel } from "discord.js";
import { ThreadModeratorGuard } from "discord/guards";
import { ButtonComponent, Discord, Guard, Slash } from "discordx";
import { i18n } from "i18n/instance";
import { Language } from "i18n/constants";
import { createButtons } from "utils/discord/buttons";
import { resolveInteractionMemberData } from "utils/discord/resolve";
import discordTranscripts from 'discord-html-transcripts';
import { logger } from "logger";
import { closeTicket } from "discord/actions/closeTicket";

export type TicketCloseAction = 'accept' | 'reject' | 'delete';

@Discord()
export class CloseTicketButton {
  @ButtonComponent({ id: /^thread@[a-z\-]+@close$/i })
  @Guard(ThreadModeratorGuard)
  public async closeTicketRequest (interaction: ButtonInteraction<'cached'>): Promise<void> {
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
  public async closeTicketAction (interaction: ButtonInteraction<'cached'>): Promise<void> {
    const [, language,, action] = interaction.customId.split('@') as [string, Language, string, TicketCloseAction];

    await closeTicket(interaction, language, action);
  }
}
