import { dbTicketService } from 'db/services';
import { ApplicationCommandOptionType, ApplicationCommandType, CommandInteraction, type ContextMenuCommandInteraction } from 'discord.js';
import { closeTicket } from 'discord/actions/closeTicket';
import { defaultTicketPermissions } from 'discord/constants';
import { PermissionGuard } from 'discord/guards';
import { Discord, Guard, SlashChoice, SlashOption } from 'discordx';
import { TranslatableContextMenu, TranslatableSlash } from 'i18n/discord';

@Discord()
export class CloseCommand {
  public static async closeTicket (interaction: CommandInteraction<'cached'> | ContextMenuCommandInteraction<'cached'>, action: 'done' | 'delete' | undefined): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) {
      await interaction.editReply({ content: 'Ticket not found.' });
      return;
    }
    await closeTicket(interaction, ticket.language, action ?? 'done', ticket);
  }

  @TranslatableSlash({
    name: 'close',
    description: 'Close a ticket',
    localeKey: 'commands.close',
    defaultMemberPermissions: defaultTicketPermissions,
    dmPermission: false,
  })
  @Guard(PermissionGuard(defaultTicketPermissions))
  public async closeTicketCommand (
    @SlashChoice('done', 'delete')
    @SlashOption({
      name: 'action',
      description: 'Action',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
      action: 'done' | 'delete' | undefined,

      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await CloseCommand.closeTicket(interaction, action);
  }

  @TranslatableContextMenu({
    name: 'Close ticket',
    type: ApplicationCommandType.Message,
    localeKey: 'commands.close.done',
    localeUseDescription: true,
  })
  public async closeTicketContextMenu (interaction: ContextMenuCommandInteraction<'cached'>): Promise<void> {
    await CloseCommand.closeTicket(interaction, 'done');
  }

  @TranslatableContextMenu({
    name: 'Delete ticket (spam)',
    type: ApplicationCommandType.Message,
    localeKey: 'commands.close.delete',
    localeUseDescription: true,
  })
  public async deleteTicketContextMenu (interaction: ContextMenuCommandInteraction<'cached'>): Promise<void> {
    await CloseCommand.closeTicket(interaction, 'delete');
  }
}
