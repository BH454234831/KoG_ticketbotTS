import { logger } from '#logger';
import { dbTicketCategoryService } from 'db/services';
import { ButtonInteraction } from 'discord.js';
import { closeTicketByThread } from 'discord/actions/closeTicket';
import { createTicket } from 'discord/actions/createTicket';
import { TooOldGuard } from 'discord/guards';
import { ButtonComponent, Discord, Guard } from 'discordx';
import { type Language } from 'i18n/constants';
import { i18n } from 'i18n/instance';

@Discord()
export class OpenTicketButtons {
  @ButtonComponent({ id: /^category@[a-z-]+@[a-z0-9-]$/i })
  @Guard(TooOldGuard(1, 'minutes'))
  public async openTicket (interaction: ButtonInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({
      ephemeral: true,
    });

    const [, language, categoryId] = interaction.customId.split('@') as [string, Language, string];

    const { thread } = await createTicket(interaction.guild, categoryId, language, interaction.user.id);
    const category = await dbTicketCategoryService.select(categoryId);

    await interaction.editReply({
      content: i18n.__('{{category_buttons.success}}', { channelId: thread.id }, language),
    });
    if (category == null) return;
    if (category.autodeleteMinutes != null) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(() => {
        closeTicketByThread(thread, language, 'done')
          .catch((err) => {
            logger.error(err);
          });
      }, category.autodeleteMinutes * 60 * 1000);
    }
  }
}
