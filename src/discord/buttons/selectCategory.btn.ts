import { dbTicketCategoryService } from "db/services";
import { ButtonInteraction, GuildMember } from "discord.js";
import { TooOldGuard } from "discord/guards";
import { ButtonComponent, Discord, Guard } from "discordx";
import { i18n } from "i18n/instance";
import { Language } from "i18n/constants";
import { createButtons } from "utils/discord/buttons";
import { resolveInteractionMemberOrThrow } from "utils/discord/resolve";

@Discord()
export class SelectCategoryButtons {
  @ButtonComponent({ id: /language@[a-z\-]+/i })
  @Guard(TooOldGuard(1, 'minutes'))
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
