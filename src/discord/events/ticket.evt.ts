import { dbTicketCategoryService, dbTicketService, type TicketSelectModel } from 'db/services';
import { ChannelType, type Message, type Client, type ThreadChannel } from 'discord.js';
import { loadMessageImages } from 'discord/actions/loadImages';
import { memberLeave } from 'discord/actions/memberLeave';
import { ArgsOf, Discord, On } from 'discordx';
import { logger } from 'logger';
import { fetchMessagesSeparate, fetchMessagesSeparateAfter } from 'utils/discord/message';
import { resolveMemberData } from 'utils/discord/resolve';

@Discord()
export class TicketEvents {
  @On({ event: 'ready' })
  public async checkDeletedCategories ([client]: ArgsOf<'ready'>): Promise<void> {
    const categories = await dbTicketCategoryService.selectAll();

    for (const category of categories) {
      const guild = client.guilds.cache.get(category.guildId) ?? await client.guilds.fetch(category.guildId).catch(() => null);
      if (guild == null) {
        logger.info(`[ChannelEvents][checkDeletedCategories]: Guild ${category.guildId} not found`);
        continue;
      };
      const channel = guild.channels.cache.get(category.channelId) ?? await guild.channels.fetch(category.channelId).catch(() => null);

      if (channel == null) {
        await dbTicketCategoryService.deleteByChannelId(category.channelId);
      }
    }
  }

  @On({ event: 'ready' })
  public async checkDeletedTickets ([client]: ArgsOf<'ready'>): Promise<void> {
    const tickets = await dbTicketService.getOpenTickets();

    for (const ticket of tickets) {
      const guild = client.guilds.cache.get(ticket.guildId) ?? await client.guilds.fetch(ticket.guildId).catch(() => null);
      if (guild == null) {
        logger.info(`[ChannelEvents][checkDeletedTickets]: Guild ${ticket.guildId} not found`);
        continue;
      };
      const channel = guild.channels.cache.get(ticket.channelId) ?? await guild.channels.fetch(ticket.channelId).catch(() => null);

      if (channel == null) {
        await dbTicketService.setTicketStatus(ticket.channelId, 'delete');
      }
    }
  }

  public async checkTicketMessages (client: Client, ticket: TicketSelectModel): Promise<void> {
    const guild = client.guilds.cache.get(ticket.guildId) ?? await client.guilds.fetch(ticket.guildId).catch(() => null);
    if (guild == null) {
      logger.info(`[ChannelEvents][checkMessages]: Guild ${ticket.guildId} not found`);
      return;
    };
    const channel = guild.channels.cache.get(ticket.channelId) as ThreadChannel | undefined ?? await guild.channels.fetch(ticket.channelId).catch(() => null) as ThreadChannel | null;

    if (channel == null) {
      logger.info(`[ChannelEvents][checkMessages]: Channel ${ticket.channelId} not found`);
      return;
    }

    const lastMessage = await dbTicketService.getLastTicketMessage(ticket.channelId);

    if (lastMessage == null) {
      for await (const message of fetchMessagesSeparate({ channel, limit: 100 })) {
        await this.messageCreate([message]);
      }
    } else {
      for await (const message of fetchMessagesSeparateAfter({ channel, limit: 100, after: lastMessage.messageId })) {
        await this.messageCreate([message]);
      }
    }
  }

  @On({ event: 'ready' })
  public async checkMessages ([client]: ArgsOf<'ready'>): Promise<void> {
    const tickets = await dbTicketService.getOpenTickets();

    for (const ticket of tickets) {
      try {
        await this.checkTicketMessages(client, ticket);
      } catch (err) {
        logger.error(err);
      }
    }
  }

  @On({ event: 'channelDelete' })
  public async channelDelete ([channel]: ArgsOf<'channelDelete'>): Promise<void> {
    await dbTicketCategoryService.deleteByChannelId(channel.id);
  }

  @On({ event: 'threadDelete' })
  public async threadDelete ([thread]: ArgsOf<'threadDelete'>): Promise<void> {
    if (thread.type !== ChannelType.PrivateThread) return;

    await dbTicketService.setTicketStatus(thread.id, 'delete');
  }

  @On({ event: 'messageCreate' })
  public async messageCreate ([message]: [Message]): Promise<void> {
    if (!message.inGuild()) return;
    if (!message.channel.isThread()) return;
    if (message.channel.type !== ChannelType.PrivateThread) return;

    // Ignore bot messages
    if (message.author.bot) return;

    const ticket = await dbTicketService.getTicketByChannelId(message.channel.id);
    if (ticket == null) return;

    const member = await resolveMemberData(message.guild, message.author.id);

    const files = await loadMessageImages(message);

    console.log(message);

    await dbTicketService.addTicketMessage(
      {
        channelId: message.channel.id,
        messageId: message.id,
        userId: message.author.id,
        text: message.content,
      },
      files,
      {
        id: message.author.id,
        username: member.username,
        displayName: member.displayName,
        displayAvatarUrl: member.displayAvatarUrl,
        bot: message.author.bot,
        webhook: message.webhookId != null,
      },
    );
  }

  @On({ event: 'messageUpdate' })
  public async messageUpdate ([newMessage]: ArgsOf<'messageUpdate'>): Promise<void> {
    if (!newMessage.inGuild()) return;
    if (!newMessage.channel.isThread()) return;
    if (newMessage.channel.type !== ChannelType.PrivateThread) return;

    await dbTicketService.updateTicketMessage(newMessage.id, newMessage.content);
  }

  @On({ event: 'messageDelete' })
  public async messageDelete ([message]: ArgsOf<'messageDelete'>): Promise<void> {
    if (!message.inGuild()) return;
    if (!message.channel.isThread()) return;
    if (message.channel.type === ChannelType.PrivateThread) return;

    await dbTicketService.setTicketStatus(message.id, 'delete');
  }

  @On({ event: 'guildMemberRemove' })
  public async guildMemberRemove ([member]: ArgsOf<'guildMemberRemove'>): Promise<void> {
    await memberLeave(member.guild, member);
  }
}
