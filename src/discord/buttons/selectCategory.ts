import { dbTicketCategoryService } from "db/services";
import { ButtonInteraction, GuildMember } from "discord.js";
import { ButtonComponent, Discord } from "discordx";
import { i18n, Language, languages } from "i18n/instance";
import { createButtons } from "utils/discord/buttons";
import { resolveInteractionMemberOrThrow } from "utils/discord/resolve";

@Discord()
export class SelectCategoryButtons {
  @ButtonComponent({ id: /language@[a-z\-]+/i })
  public async handleticketbutton (interaction: ButtonInteraction): Promise<void> {
    if (interaction.guild == null) return;

    await interaction.deferReply({
      ephemeral: true,
    });

    const [, language] = interaction.customId.split('@') as [string, Language];

    const categories = await dbTicketCategoryService.selectAll();

    const member = await resolveInteractionMemberOrThrow(interaction) as GuildMember;

    const allowedCategories = categories.filter(category => {
      if (category.requiredRoleIds != null && category.requiredRoleIds.length > 0) {
        if (!member.roles.cache.hasAny(...category.requiredRoleIds)) {
          return false;
        }
      }
      return true;
    });

    const buttonsRows = createButtons(allowedCategories.map(category => {
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
