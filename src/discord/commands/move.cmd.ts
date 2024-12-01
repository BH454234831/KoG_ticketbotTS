import { dbTicketService } from 'db/services';
import { ApplicationCommandOptionType, CommandInteraction, type ThreadChannel } from 'discord.js';
import { moveTicket } from 'discord/actions/moveTicket';
import { categoryAutocompleteExceptCurrent } from 'discord/autocomplete';
import { Discord, Slash, SlashOption } from 'discordx';

@Discord()
export class MoveCommand {
  @Slash({
    name: 'move',
    description: 'Move a ticket to another category',
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

    const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) {
      await interaction.editReply({ content: 'Ticket not found.' });
      return;
    }

    await moveTicket(interaction.channel as ThreadChannel, categoryId, { ticket });
  }
}
