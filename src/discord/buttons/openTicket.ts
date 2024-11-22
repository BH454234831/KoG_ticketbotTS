import { dbTicketCategoryService, dbTicketService } from "db/services";
import { ButtonInteraction, ChannelType, PermissionFlagsBits } from "discord.js";
import { ButtonComponent, Discord } from "discordx";
import { i18n, Language } from "i18n/instance";

@Discord()
export class OpenTicketButtons {
  @ButtonComponent({ id: /category@[a-z\-]@[a-z0-9\-]/i })
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

    if (channel.permissionsFor(clientMember).missing(PermissionFlagsBits.CreatePrivateThreads | PermissionFlagsBits.ManageThreads | PermissionFlagsBits.ManageChannels)) return;

    const thread = await channel.threads.create({
      name: `${language} - ${interaction.user.username}`,
      type: ChannelType.PrivateThread as any,
      invitable: false as any,
    });

    await channel.permissionOverwrites.create(interaction.user, {
      'ViewChannel': true,
    });

    await thread.members.add(interaction.user);

    await dbTicketService.createTicket({
      channelId: thread.id,
      userId: interaction.user.id,
      language,
      category: categoryId,
      userName: interaction.user.username,
      userIcon: interaction.user.displayAvatarURL(),
    });

    await interaction.editReply({
      content: i18n.__('{{category_buttons.success}}', { channelId: thread.id }, language),
    });
  }
}
