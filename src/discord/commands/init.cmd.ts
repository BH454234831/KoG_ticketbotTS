import { CommandInteraction } from 'discord.js';
import { Discord, Slash } from 'discordx';
import { i18n } from 'i18n/instance';
import { languages } from 'i18n/constants';
import { createButtons } from 'utils/discord/buttons';
import { IssueError } from 'error';
import { resolveInteractionErrorData } from 'utils/discord/resolve';

@Discord()
export class InitCommands {
  @Slash({
    name: 'doticketbutton',
    description: 'Create ticket buttons',
    defaultMemberPermissions: 0n,
    dmPermission: false,
  })
  public async doticketbutton (interaction: CommandInteraction<'cached'>): Promise<void> {
    const errorData = resolveInteractionErrorData(interaction);

    if (interaction.channel?.isSendable() !== true) {
      throw new IssueError({
        message: '[doticketbutton] Channel is not sendable',
        data: errorData,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const buttonRows = createButtons(languages.map(lang => {
      return {
        id: `language@${lang}`,
        label: i18n.__('{{ticket_buttons.labels}}', undefined, lang),
        emoji: i18n.__('{{ticket_buttons.emojis}}', undefined, lang),
      };
    }));

    await interaction.channel.send({
      content: i18n.__('{{ticket_buttons.text}}', undefined),
      components: buttonRows,
    });

    await interaction.editReply({
      content: i18n.__('{{ticket_buttons.success}}', undefined),
    });
  }
}
