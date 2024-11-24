import { config } from 'config';
import { GatewayIntentBits, Interaction } from 'discord.js';
import { Client } from 'discordx';
import { consoleWinstonTransport, fileErrorWinstonTransport, logger } from 'logger';
import { dirname, importx } from "@discordx/importer";
import { register } from 'tsx/esm/api';
import 'reflect-metadata';
const __dirname = dirname(import.meta.url);

Error.stackTraceLimit = Infinity;

const unregister = register();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.on('debug', message => {
  logger.debug(message);
});
client.on('warn', message => {
  logger.warn(message);
});
client.on('error', message => {
  logger.error(message);
});

async function interactionReplyError (interaction: Interaction, error: any): Promise<void> {
  try {
    if (interaction.isRepliable()) {
      if (interaction.replied) {
        await interaction.editReply({
          content: 'There was an error while executing this command.',
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command.',
          ephemeral: true,
        });
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

client.on('interactionCreate', async interaction => {
  try {
    await client.executeInteraction(interaction);
  } catch (err) {
    logger.error(err);
    await interactionReplyError(interaction, err);
  }
});

logger.info('Loading commands...');
await importx(`${__dirname}/discord/**/*.{cmd,btn}.{js,ts}`)


logger.info('Logging in...');
await client.login(config.DISCORD_TOKEN);

client.on('ready', async() => {
logger.info('Initializing application commands...');
await client.initApplicationCommands();
logger.info(`Ready! logged in as ${client.user?.username}`);
})

logger.exceptions.handle(consoleWinstonTransport, fileErrorWinstonTransport);
logger.rejections.handle(consoleWinstonTransport, fileErrorWinstonTransport);


