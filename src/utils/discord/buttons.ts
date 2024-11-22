import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import _ from "lodash";

export function createButtons (values: Array<{ id: string; label: string; emoji?: string; style?: ButtonStyle }>): ActionRowBuilder<ButtonBuilder>[] {
  return _.chunk(values, 5).map(vals => {
    const buttons = vals.map(val => {
      let button = new ButtonBuilder()
        .setCustomId(val.id)
        .setLabel(val.label)
        .setStyle(val.style ?? ButtonStyle.Primary);

      if (val.emoji != null) {
        button = button.setEmoji({ name: val.emoji });
      }

      return button;
    });

    const buttonGroup = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(...buttons);

    return buttonGroup;
  });
}
