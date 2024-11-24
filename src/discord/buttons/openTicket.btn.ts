import { dbTicketCategoryService, dbTicketService } from "db/services";
import { ButtonInteraction, ChannelType, PermissionFlagsBits } from "discord.js";
import { TooOldGuard } from "discord/guards";
import { ButtonComponent, Discord, Guard } from "discordx";
import { Language } from "i18n/constants";
import { i18n } from "i18n/instance";
import { logger } from "logger";
import { createButtons } from "utils/discord/buttons";
import { resolveInteractionMemberData } from "utils/discord/resolve";

@Discord()
export class OpenTicketButtons {
  @ButtonComponent({ id: /^category@[a-z\-]+@[a-z0-9\-]$/i })
  @Guard(TooOldGuard(1, 'minutes'))
  public async openTicket (interaction: ButtonInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({
      ephemeral: true,
    });

    const [, language, categoryId] = interaction.customId.split('@') as [string, Language, string];

    const category = await dbTicketCategoryService.select(categoryId);
    if (category == null) return;

    const channel = interaction.guild.channels.cache.get(category.channelId);
    if (channel == null) {
      logger.info(`[OpenTicketButtons][openTicket] channel not found: ${category.channelId}`);
      await dbTicketCategoryService.delete(categoryId);
      return;
    }
    if (!channel.isTextBased()) {
      logger.info(`[OpenTicketButtons][openTicket] channel is not text based: ${category.channelId}`);
      await dbTicketCategoryService.delete(categoryId);
      return;
    }
    if (!('threads' in channel)) {
      logger.info(`[OpenTicketButtons][openTicket] channel has no threads: ${category.channelId}`);
      await dbTicketCategoryService.delete(categoryId);
      return;
    }

    const clientMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
    const channelMissingPermissions = channel.permissionsFor(clientMember, true).missing(PermissionFlagsBits.CreatePrivateThreads | PermissionFlagsBits.ManageThreads | PermissionFlagsBits.ManageChannels)

    if (channelMissingPermissions.length > 0) {
      logger.info(`[OpenTicketButtons][openTicket] missing permissions: ${channelMissingPermissions}`);
      return;
    }

    const memberData = await resolveInteractionMemberData(interaction);

    const thread = await channel.threads.create({
      name: `${language}-${memberData.displayName}`,
      type: ChannelType.PrivateThread as any,
      invitable: false as any,
    });

    const threadMissingPermissions = thread.permissionsFor(clientMember, true).missing(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory);

    if (threadMissingPermissions.length > 0) {
      logger.info(`[OpenTicketButtons][openTicket] missing permissions: ${threadMissingPermissions}`);
      await thread.delete();
      return;
    }

    await channel.permissionOverwrites.create(interaction.user, {
      'ViewChannel': true,
    });

    await thread.members.add(interaction.user);

    const buttonRows = createButtons([
      { id: `thread@${language}@close`, label: i18n.__('{{thread_buttons.close.labels}}', undefined, language), emoji: '🔒' },
    ]);

    const ticketMessage = await thread.send({
      content: category.welcome != null
        ? i18n.__(category.welcome[language], {
          username: memberData.displayName ?? interaction.user.username,
          userId: interaction.user.id,
          userTag: `<@${interaction.user.id}>`,
        }, language)
        : undefined,
      components: buttonRows,
    });

    await dbTicketService.createTicket(
      {
        channelId: thread.id,
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        language,
        categoryId,
      },
      {
        id: interaction.user.id,
        username: memberData.username,
        displayName: memberData.displayName,
        displayAvatarUrl: memberData.displayAvatarUrl,
      },
      ticketMessage.id,
    );

    await interaction.editReply({
      content: i18n.__('{{category_buttons.success}}', { channelId: thread.id }, language),
    });
  }
}
