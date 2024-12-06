import { defaultTicketPermissions } from '#discord/constants';
import { dbTicketCategoryService, dbTicketService, type TicketSelectModel } from 'db/services';
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, CommandInteraction, ContextMenuCommandInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, type ThreadChannel } from 'discord.js';
import { moveTicket } from 'discord/actions/moveTicket';
import { categoryAutocompleteExceptCurrent } from 'discord/autocomplete';
import { Discord, SelectMenuComponent, SlashOption } from 'discordx';
import { TranslatableContextMenu, TranslatableSlash, unmapDiscordLanguage } from 'i18n/discord';
import { i18n } from 'i18n/instance';

@Discord()
export class MoveCommand {
  public static async moveTicket (interaction: CommandInteraction<'cached'> | ContextMenuCommandInteraction<'cached'> | StringSelectMenuInteraction<'cached'>, categoryId: string, options?: { ticket: TicketSelectModel }): Promise<void> {
    const ticket = options?.ticket ?? await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) {
      await interaction.editReply({ content: 'Ticket not found.' });
      return;
    }

    await moveTicket(interaction.channel as ThreadChannel, categoryId, { ticket });
  }

  @TranslatableSlash({
    name: 'move',
    description: 'Move a ticket to another category',
    localeKey: 'commands.move',
    defaultMemberPermissions: defaultTicketPermissions,
  })
  public async move (
    @SlashOption({
      name: 'category',
      description: 'Category',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: categoryAutocompleteExceptCurrent,
    })
      categoryId: string,

      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await interaction.deferReply({
      ephemeral: true,
    });

    await MoveCommand.moveTicket(interaction, categoryId);
  }

  @TranslatableContextMenu({
    name: 'Move ticket',
    type: ApplicationCommandType.Message,
    defaultMemberPermissions: defaultTicketPermissions,
    localeKey: 'commands.move.short',
    localeUseDescription: true,
  })
  public async moveMessage (interaction: ContextMenuCommandInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({
      ephemeral: true,
    });

    const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) {
      await interaction.editReply({ content: 'Ticket not found.' });
      return;
    }

    let otherCategories = await dbTicketCategoryService.selectAll({ exceptCategoryId: BigInt(ticket.categoryId) });
    otherCategories = otherCategories.slice(0, 25);

    const language = unmapDiscordLanguage(interaction.locale) ?? 'en';

    if (otherCategories.length === 0) {
      await interaction.editReply({ content: i18n.__('{{commands.move.noOtherCategories}}', undefined, language) });
      return;
    }

    const categorySelectMenu = new StringSelectMenuBuilder()
      .setCustomId('select@move@category')
      .setPlaceholder('Select a category')
      .setOptions(otherCategories.map(category => {
        return {
          label: category.name[language],
          value: category.id.toString(),
        };
      }));
    const actionRowBuilder = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categorySelectMenu);

    await interaction.editReply({
      content: i18n.__('{{commands.move.select}}', undefined, language),
      components: [actionRowBuilder],
    });
  }

  @SelectMenuComponent({
    id: 'select@move@category',
  })
  public async selectCategory (interaction: StringSelectMenuInteraction<'cached'>): Promise<void> {
    const categoryId = interaction.values[0]!;
    await MoveCommand.moveTicket(interaction, categoryId);
  }
}
