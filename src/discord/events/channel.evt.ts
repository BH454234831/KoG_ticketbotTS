import { dbTicketCategoryService } from "db/services";
import { ArgsOf, Discord, On } from "discordx";
import { logger } from "logger";

@Discord()
export class ChannelEvents {
  @On({ event: 'channelDelete' })
  public async channelDelete ([channel]: ArgsOf<'channelDelete'>): Promise<void> {
    await dbTicketCategoryService.deleteByChannelId(channel.id);
  }

  @On({ event: 'ready' })
  public async ready ([client]: ArgsOf<'ready'>): Promise<void> {
    const categories = await dbTicketCategoryService.selectAll();

    for (const category of categories) {
      const guild = client.guilds.cache.get(category.guildId) ?? await client.guilds.fetch(category.guildId).catch(() => null);
      if (guild == null) {
        logger.info(`[ChannelEvents][ready]: Guild ${category.guildId} not found`);
        continue;
      };
      const channel = guild.channels.cache.get(category.channelId) ?? await guild.channels.fetch(category.channelId).catch(() => null);

      if (channel == null) {
        await dbTicketCategoryService.deleteByChannelId(category.channelId);
      }
    }
  }
}