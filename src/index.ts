import { config } from 'config';
import { Client, GatewayIntentBits } from 'discord.js';
import { consoleWinstonTransport, fileErrorWinstonTransport, logger } from 'logger';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

await client.login(config.DISCORD_TOKEN);

logger.exceptions.handle(consoleWinstonTransport, fileErrorWinstonTransport);
logger.rejections.handle(consoleWinstonTransport, fileErrorWinstonTransport);
