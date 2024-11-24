import { dbTicketCategoryService, dbTicketService } from "db/services";
import { ButtonInteraction, ChannelType, PermissionFlagsBits } from "discord.js";
import { TooOldGuard } from "discord/guards";
import { ButtonComponent, Discord, Guard } from "discordx";
import { Language } from "i18n/constants";
import { i18n } from "i18n/instance";
import { createButtons } from "utils/discord/buttons";
import { resolveInteractionMemberData } from "utils/discord/resolve";

@Discord()
export class OpenTicketButtons {
  @ButtonComponent({ id: /category@[a-z\-]+@[a-z0-9\-]/i })
  @Guard(TooOldGuard(1, 'minutes'))
  public async openTicket (interaction: ButtonInteraction): Promise<void> {
    await interaction.deferReply({
      ephemeral: true,
    })
    await interaction.message.delete();

    const [, language, categoryId] = interaction.customId.split('@') as [string, Language, string];

    if (interaction.guild == null) return;

    const category = await dbTicketCategoryService.select(categoryId);
    if (category == null) return;

    const channel = interaction.guild.channels.cache.get(category.channelId);
    if (channel == null) return;
    if (!channel.isTextBased()) return;
    if (!('threads' in channel)) return;

    const clientMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
    const clientPermissions = channel.permissionsFor(clientMember, true);

    if (clientPermissions.missing(PermissionFlagsBits.CreatePrivateThreads | PermissionFlagsBits.ManageThreads | PermissionFlagsBits.ManageChannels)) return;

    const memberData = await resolveInteractionMemberData(interaction);

    const thread = await channel.threads.create({
      name: `${language}-${memberData.displayName}`,
      type: ChannelType.PrivateThread as any,
      invitable: false as any,
    });

    if (clientPermissions.missing(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory)) {
      await thread.delete();
      return;
    }

    await channel.permissionOverwrites.create(interaction.user, {
      'ViewChannel': true,
    });

    await thread.members.add(interaction.user);

    await dbTicketService.createTicket(
      {
        channelId: thread.id,
        userId: interaction.user.id,
        language,
        categoryId,
      },
      {
        id: interaction.user.id,
        username: memberData.username,
        displayName: memberData.displayName,
        displayAvatarUrl: memberData.displayAvatarUrl,
      }
    );

    const buttonRows = createButtons([
      { id: `thread@${language}@close`, label: i18n.__('{{thread_buttons.close.labels}}', undefined, language), emoji: '🔒' },
    ]);

    await thread.send({
      content: i18n.__(category.welcome[language], { username: interaction.user.username, userId: interaction.user.id }, language),
      components: buttonRows,
    });

    await interaction.editReply({
      content: i18n.__('{{category_buttons.success}}', { channelId: thread.id }, language),
    });
  }
}
