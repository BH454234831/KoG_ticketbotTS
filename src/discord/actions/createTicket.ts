import { dbTicketCategoryService, dbTicketService } from 'db/services';
import { ChannelType, type Message, PermissionFlagsBits, type Guild, type ThreadChannel } from 'discord.js';
import { logger } from 'logger';
import { type ResolvedMemberData, resolveMemberData } from 'utils/discord/resolve';
import { addTicketUser } from './ticketUser.js';
import { createButtons } from 'utils/discord/buttons';
import { i18n } from 'i18n/instance';
import { type Language } from 'i18n/constants';

export async function createTicketChannel (guild: Guild, categoryId: string, language: Language, userId: string, addedUserIds?: string[]): Promise<{ thread: ThreadChannel; ticketMessage: Message; memberData: ResolvedMemberData }> {
  const category = await dbTicketCategoryService.select(categoryId);
  if (category == null) throw new Error(`category ${categoryId} is null`);

  const channel = guild.channels.cache.get(category.channelId);
  if (channel == null) {
    logger.info(`[OpenTicketButtons][openTicket] channel not found: ${category.channelId}`);
    await dbTicketCategoryService.delete(categoryId);
    throw new Error(`channel ${category.channelId} not found`);
  }
  if (!channel.isTextBased()) {
    logger.info(`[OpenTicketButtons][openTicket] channel is not text based: ${category.channelId}`);
    await dbTicketCategoryService.delete(categoryId);
    throw new Error(`channel ${category.channelId} is not text based`);
  }
  if (!('threads' in channel)) {
    logger.info(`[OpenTicketButtons][openTicket] channel has no threads: ${category.channelId}`);
    await dbTicketCategoryService.delete(categoryId);
    throw new Error(`channel ${category.channelId} has no threads`);
  }

  const clientMember = guild.members.me ?? await guild.members.fetchMe();
  const channelMissingPermissions = channel.permissionsFor(clientMember, true).missing(PermissionFlagsBits.CreatePrivateThreads | PermissionFlagsBits.ManageThreads | PermissionFlagsBits.ManageChannels);

  if (channelMissingPermissions.length > 0) {
    logger.info(`[OpenTicketButtons][openTicket] missing permissions: ${channelMissingPermissions.join(',')}`);
    throw new Error(`missing permissions: ${channelMissingPermissions.join(',')}`);
  }

  const memberData = await resolveMemberData(guild, userId);

  const thread = await channel.threads.create({
    name: `${language}-${memberData.displayName}`,
    type: ChannelType.PrivateThread as any,
    invitable: false as any,
  });

  const threadMissingPermissions = thread.permissionsFor(clientMember, true).missing(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory);

  if (threadMissingPermissions.length > 0) {
    logger.info(`[OpenTicketButtons][openTicket] missing permissions: ${threadMissingPermissions.join(',')}`);
    await thread.delete();
    throw new Error(`missing permissions: ${threadMissingPermissions.join(',')}`);
  }

  await addTicketUser(thread, userId, { memberData });

  for (const userId of addedUserIds ?? []) {
    await addTicketUser(thread, userId);
  }

  const buttonRows = createButtons([
    { id: `thread@${language}@close`, label: i18n.__('{{thread_buttons.close.labels}}', undefined, language), emoji: '🔒' },
  ]);

  const ticketMessage = await thread.send({
    content: category.welcome != null
      ? i18n.__(category.welcome[language], {
        username: memberData.displayName ?? memberData.username ?? userId,
        userId,
        userTag: `<@${userId}>`,
        language,
      }, language)
      : undefined,
    components: buttonRows,
  });

  return { thread, ticketMessage, memberData };
}

export async function createTicket (guild: Guild, categoryId: string, language: Language, userId: string, addedUserIds?: string[]): Promise<{ thread: ThreadChannel; ticketMessage: Message; memberData: ResolvedMemberData }> {
  const { thread, ticketMessage, memberData } = await createTicketChannel(guild, categoryId, language, userId, addedUserIds);

  await dbTicketService.createTicket(
    {
      channelId: thread.id,
      guildId: guild.id,
      userId,
      language,
      categoryId,
    },
    {
      id: userId,
      username: memberData.username,
      displayName: memberData.displayName,
      displayAvatarUrl: memberData.displayAvatarUrl,
    },
    ticketMessage.id,
  );

  return { thread, ticketMessage, memberData };
};
