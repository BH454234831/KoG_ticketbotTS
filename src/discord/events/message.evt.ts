import { dbImportantMessageService, dbTicketService } from "db/services";
import { PrivateThreadChannel } from "discord.js";
import { ArgsOf, Discord, On } from "discordx";
import { logger } from "logger";

@Discord()
export class MessageEvents {
  @On({ event: 'ready' })
  public async loadImportantMessages ([client]: ArgsOf<'ready'>): Promise<void> {
    const messages = await dbImportantMessageService.selectAll();

    for (const message of messages) {
      const guild = client.guilds.cache.get(message.guildId);
      if (guild == null) {
        logger.info(`[MessageEvents][loadImportantMessages]: Guild ${message.guildId} not found`);
        return;
      }
      
      const channel = guild.channels.cache.get(message.channelId) as PrivateThreadChannel | undefined;
      if (channel == null) {
        logger.info(`[MessageEvents][loadImportantMessages]: Channel ${message.channelId} not found`);
        return;
      }

      try {
        await channel.messages.fetch(message.messageId);
        logger.info(`[MessageEvents][loadImportantMessages]: Message ${message.messageId} loaded`);
      } catch (err) {
        logger.info(`[MessageEvents][loadImportantMessages]: Message ${message.messageId} not found`);
        await dbImportantMessageService.delete(message.messageId);
      }
    }
  }

  @On({ event: 'messageDelete' })
  public async onMessageDelete ([message]: ArgsOf<'messageDelete'>): Promise<void> {
    await dbImportantMessageService.delete(message.id);
  }
}
