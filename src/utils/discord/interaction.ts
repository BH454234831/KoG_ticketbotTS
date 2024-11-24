import { type InteractionReplyOptions, type Interaction } from 'discord.js';
import { DisplayError, IssueError } from 'error';

export async function interactionReply (interaction: Interaction<any>, message: InteractionReplyOptions): Promise<void> {
  if (!interaction.isRepliable()) return;

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(message);
  } else {
    await interaction.reply(message);
  }
}

export async function interactionReplyError (interaction: Interaction, error: any): Promise<void> {
  if (error instanceof DisplayError) {
    await interactionReply(interaction, { content: error.displayMessage, ephemeral: true });
    return;
  }
  if (error instanceof IssueError) {
    return;
  }

  await interactionReply(interaction, { content: 'There was an error while executing this command.', ephemeral: true });
}
