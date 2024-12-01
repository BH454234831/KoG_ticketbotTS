import { AttachmentBuilder, type ThreadChannel, WebhookClient } from 'discord.js';
import { createTicketChannel } from './createTicket.js';
import { dbTicketService, type TicketSelectModel } from 'db/services';
import { fetchMessagesAll } from 'utils/discord/message';
import { resolveMemberData } from 'utils/discord/resolve';
import { loadMessageImages } from './loadImages.js';

export async function moveTicket (oldThread: ThreadChannel, categoryId: string, options?: { ticket?: TicketSelectModel }): Promise<{ thread: ThreadChannel }> {
  const ticket = options?.ticket ?? await dbTicketService.getTicketByChannelId(oldThread.id);
  if (ticket == null) {
    throw new Error(`Ticket ${oldThread.id} not found`);
  }

  const ticketUsers = await dbTicketService.getTicketUsers(oldThread.id, ticket.userId);
  const ticketUserIds = ticketUsers.map((user) => user.userId);

  const { thread } = await createTicketChannel(oldThread.guild, categoryId, ticket.language, ticket.userId, ticketUserIds);

  await dbTicketService.updateTicketCategory(oldThread.id, categoryId, thread.id);

  if (thread.parent == null) {
    throw new Error(`Thread ${thread.id} parent is null`);
  }

  const webhook = await thread.parent.createWebhook({
    name: 'TicketMover',
  });

  const webhookClient = new WebhookClient({ url: webhook.url });

  const _messages = await fetchMessagesAll({ channel: oldThread, limit: 3 });
  const messages = _messages.values().toArray();
  messages.reverse();

  for (const message of messages) {
    const files = await loadMessageImages(message);

    if (message.content === '' && files.length === 0) continue;

    const memberData = await resolveMemberData(oldThread.guild, message.author.id);
    const attachments = files.map((file) => {
      return new AttachmentBuilder(file.file, {
        name: file.name,
      });
    });

    await webhookClient.send({
      content: message.content,
      username: memberData.displayName ?? message.author.username ?? message.author.id,
      avatarURL: memberData.displayAvatarUrl ?? message.author.avatarURL() ?? message.author.defaultAvatarURL,
      threadId: thread.id,
      files: attachments,
    });
  }

  await oldThread.delete();

  return { thread };
}
