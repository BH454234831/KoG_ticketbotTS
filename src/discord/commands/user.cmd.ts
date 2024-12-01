import { dbTicketService } from 'db/services';
import { ApplicationCommandOptionType, CommandInteraction, User, type ThreadChannel } from 'discord.js';
import { addTicketUser, removeTicketUser } from 'discord/actions/ticketUser';
import { defaultTicketPermissions } from 'discord/constants';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { i18n } from 'i18n/instance';
import { resolveInteractionMemberOrThrow } from 'utils/discord/resolve';

@Discord()
@SlashGroup({
  name: 'user',
  description: 'Ticket User Commands',
  defaultMemberPermissions: defaultTicketPermissions,
  dmPermission: false,
})
@SlashGroup('user')
export class UserCommands {
  @Slash({
    name: 'add',
    description: 'Add a user to a ticket',
  })
  public async addTicketUser (
    @SlashOption({
      name: 'user',
      description: 'User',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
      user: User,

      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await interaction.deferReply();

    const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) {
      await interaction.editReply({ content: 'Ticket not found.' });
      return;
    }

    const member = await resolveInteractionMemberOrThrow(interaction, user.id);

    await dbTicketService.addTicketUser(interaction.channelId, member);

    await addTicketUser(interaction.channel as ThreadChannel, user.id);

    await interaction.editReply({
      content: i18n.__('{{ticket.user_add}}', { userId: user.id }, 'en'),
    });
  }

  @Slash({
    name: 'remove',
    description: 'Remove a user from a ticket',
  })
  public async removeTicketUser (
    @SlashOption({
      name: 'user',
      description: 'User',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
      user: User,

      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await interaction.deferReply();

    const ticket = await dbTicketService.getTicketByChannelId(interaction.channelId);
    if (ticket == null) {
      await interaction.editReply({ content: 'Ticket not found.' });
      return;
    }

    await dbTicketService.deleteTicketUser(interaction.channelId, user.id);

    await removeTicketUser(interaction.channel as ThreadChannel, user.id);

    await interaction.editReply({
      content: i18n.__('{{ticket.user_remove}}', { userId: user.id }, 'en'),
    });
  }
}
