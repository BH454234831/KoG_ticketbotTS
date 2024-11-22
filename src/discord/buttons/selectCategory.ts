import { dbTicketCategoryService } from "db/services";
import { ButtonInteraction } from "discord.js";
import { ButtonComponent, Discord } from "discordx";
import { i18n, Language, languages } from "i18n/instance";
import { createButtons } from "utils/discord/buttons";

@Discord()
export class SelectCategoryButtons {
  @ButtonComponent({ id: /language@[a-z\-]+/i })
  public async handleticketbutton (interaction: ButtonInteraction): Promise<void> {
    await interaction.deferReply({
      ephemeral: true,
    });

    const [, language] = interaction.customId.split('@') as [string, Language];

    const categories = await dbTicketCategoryService.selectAll();

    const buttonsRows = createButtons(categories.map(category => {
      return {
        id: `category@${language}@${category.id}`,
        label: category.name[language],
      };
    }));

    await interaction.editReply({
      content: i18n.__('{{category_buttons.labels}}', undefined, language),
      components: buttonsRows,
    });
  }
}
