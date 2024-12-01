import { type TicketMessageFileInsertModel } from 'db/services';
import { type Message } from 'discord.js';

export async function loadMessageImages (message: Message): Promise<TicketMessageFileInsertModel[]> {
  const files = await Promise.all(message.attachments.map(async (attachment) => {
    // Save images only that are less than 10MB
    if (attachment.contentType == null || !attachment.contentType.startsWith('image/')) return null;
    if (attachment.size > 10 * 1024 * 1024) return null;

    const file = await fetch(attachment.proxyURL);
    const buffer = Buffer.from(await file.arrayBuffer());

    return {
      messageId: message.id,
      file: buffer,
      mime: attachment.contentType,
      name: attachment.name,
      url: attachment.url,
    };
  }));

  return files.filter((file) => file != null);
}
