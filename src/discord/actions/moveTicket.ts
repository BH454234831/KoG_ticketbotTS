import { type ThreadChannel, WebhookClient } from 'discord.js';
import { createTicketChannel } from './createTicket.js';
import { dbTicketService, type TicketSelectModel } from 'db/services';
import { fetchMessages } from 'utils/discord/message';
import { resolveMemberData } from 'utils/discord/resolve';

export async function moveTicket (oldThread: ThreadChannel, categoryId: string, options?: { ticket?: TicketSelectModel }): Promise<{ thread: ThreadChannel }> {
  const ticket = options?.ticket ?? await dbTicketService.getTicketByChannelId(oldThread.id);
  if (ticket == null) {
    throw new Error(`Ticket ${oldThread.id} not found`);
  }

  const ticketUsers = await dbTicketService.getTicketUsers(oldThread.id, ticket.userId);
  const ticketUserIds = ticketUsers.map((user) => user.userId);

  const { thread } = await createTicketChannel(oldThread.guild, categoryId, ticket.language, ticket.userId, ticketUserIds);

  await dbTicketService.updateTicketCategory(oldThread.id, thread.id);

  if (thread.parent == null) {
    throw new Error(`Thread ${thread.id} parent is null`);
  }

  const webhook = await thread.parent.createWebhook({
    name: 'TicketMover',
  });

  const webhookClient = new WebhookClient({ url: webhook.url });

  for await (const batch of fetchMessages({ channel: oldThread, limit: 100 })) {
    for (const message of batch.values()) {
      const memberData = await resolveMemberData(oldThread.guild, message.author.id);

      await webhookClient.send({
        content: message.content,
        username: memberData.displayName ?? message.author.username ?? message.author.id,
        avatarURL: memberData.displayAvatarUrl ?? message.author.avatarURL() ?? message.author.defaultAvatarURL,
        threadId: thread.id,
      });
    }
  }

  await oldThread.delete();

  return { thread };
}
