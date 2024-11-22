import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import { i18n, languages } from "i18n/instance";
import _ from "lodash";

@Discord()
export class InitCommands {
  @Slash({
    name: 'doticketbutton',
    description: 'Create ticket buttons',
    defaultMemberPermissions: 0n,
    dmPermission: false,
  })
  public async doticketbutton (interaction: CommandInteraction): Promise<void> {
    if (!interaction.channel?.isSendable()) {
      return;
    }

    await interaction.deferReply({
      ephemeral: true,
    })

    const buttonRows = _.chunk(languages, 5).map(langs => {
      const buttons = langs.map(lang => {
        return new ButtonBuilder()
          .setCustomId(lang)
          .setLabel(i18n.__('{{ticket_buttons.labels}}', undefined, lang))
          .setStyle(ButtonStyle.Primary)
          .setEmoji({ name: i18n.__('{{ticket_buttons.emojis}}', undefined, lang) });
      });

      const buttonGroup = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(...buttons);

      return buttonGroup;
    });

    await interaction.channel.send({
      content: i18n.__('{{ticket_buttons.text}}', undefined),
      components: buttonRows,
    });

    await interaction.editReply({
      content: i18n.__('{{ticket_buttons.success}}', undefined),
    });
  }
}
