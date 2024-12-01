import { dbTicketService } from 'db/services';
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import { closeTicket } from 'discord/actions/closeTicket';
import { defaultTicketPermissions } from 'discord/constants';
import { PermissionGuard } from 'discord/guards';
import { Discord, Guard, Slash, SlashChoice, SlashOption } from 'discordx';

@Discord()
export class CloseCommand {
  @Slash({
    name: 'close',
    description: 'Close a ticket',
    defaultMemberPermissions: defaultTicketPermissions,
    dmPermission: false,
  })
  @Guard(PermissionGuard(defaultTicketPermissions))
  public async closeTicket (
    @SlashChoice('accept', 'reject', 'delete')
    @SlashOption({
      name: 'action',
      description: 'Action',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
      action: 'accept' | 'reject' | 'delete' | undefined,

      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) {
      await interaction.editReply({ content: 'Ticket not found.' });
      return;
    }

    await closeTicket(interaction, ticket.language, action ?? 'delete', ticket);
  }
}
