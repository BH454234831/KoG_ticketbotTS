import { ButtonInteraction, ButtonStyle } from 'discord.js';
import { PermissionGuard } from 'discord/guards';
import { ButtonComponent, Discord, Guard } from 'discordx';
import { i18n } from 'i18n/instance';
import { type Language } from 'i18n/constants';
import { createButtons } from 'utils/discord/buttons';
import { closeTicket, type TicketCloseAction } from 'discord/actions/closeTicket';
import { defaultTicketPermissions } from 'discord/constants';

@Discord()
export class CloseTicketButton {
  @ButtonComponent({ id: /^thread@[a-z-]+@close$/i })
  @Guard(PermissionGuard(defaultTicketPermissions))
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

  @ButtonComponent({ id: /^thread@[a-z-]+@close@[a-z]+$/i })
  @Guard(PermissionGuard(defaultTicketPermissions))
  public async closeTicketAction (interaction: ButtonInteraction<'cached'>): Promise<void> {
    const [, language,, action] = interaction.customId.split('@') as [string, Language, string, TicketCloseAction];

    await closeTicket(interaction, language, action);
  }
}
