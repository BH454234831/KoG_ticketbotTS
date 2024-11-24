import { config } from 'config';
import { GatewayIntentBits, type Interaction, InteractionType } from 'discord.js';
import { Client } from 'discordx';
import { consoleWinstonTransport, fileErrorWinstonTransport, logger } from 'logger';
import { dirname, importx } from '@discordx/importer';
import { register } from 'tsx/esm/api';
import 'reflect-metadata';
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(import.meta.url);

Error.stackTraceLimit = Infinity;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      if (interaction.replied || interaction.deferred) {
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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    logger.debug(`[Interaction][Command]: ${interaction.user.username} ${interaction.commandName} [${JSON.stringify(interaction.options.data)}] [${interaction.id}]`);
  } else if (interaction.isMessageComponent()) {
    logger.debug(`[Interaction][MessageComponent]: ${interaction.user.username} ${interaction.customId} [${interaction.id}]`);
  } else {
    logger.debug(`[Interaction][${InteractionType[interaction.type]}]: ${interaction.user.username} [${interaction.id}]`);
  }

  try {
    await client.executeInteraction(interaction);
  } catch (err) {
    logger.error(err);
    await interactionReplyError(interaction, err);
  }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
client.on('ready', async () => {
  logger.info('Initializing application commands...');
  await client.initApplicationCommands();
  logger.info(`Ready! logged in as ${client.user?.username}`);
});

logger.info('Loading commands...');
await importx(`${__dirname}/discord/**/*.{cmd,btn,evt}.{js,ts}`);

logger.info('Logging in...');
await client.login(config.DISCORD_TOKEN);

logger.exceptions.handle(consoleWinstonTransport, fileErrorWinstonTransport);
logger.rejections.handle(consoleWinstonTransport, fileErrorWinstonTransport);
