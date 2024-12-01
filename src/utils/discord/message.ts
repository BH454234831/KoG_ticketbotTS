import { type ThreadChannel, type Message, type GuildTextBasedChannel, Collection } from 'discord.js';

export type MessageFetcherOptions = {
  channel: GuildTextBasedChannel | ThreadChannel;
  limit: number;
  before?: string;
};

export async function * fetchMessages ({ channel, limit, before }: MessageFetcherOptions): AsyncGenerator<Collection<string, Message>> {
  if (limit <= 0) {
    throw new Error('Invalid limit');
  }

  while (true) {
    const batch = await channel.messages.fetch({ limit, before });

    yield batch;

    if (batch.size < limit) {
      return;
    }

    before = batch.last()!.id;
  }
}

export async function * fetchMessagesSeparate (options: MessageFetcherOptions): AsyncGenerator<Message> {
  for await (const batch of fetchMessages(options)) {
    for (const message of batch.values()) {
      yield message;
    }
  }
}

export async function fetchMessagesAll (options: MessageFetcherOptions): Promise<Collection<string, Message>> {
  const messages = new Collection<string, Message>();

  for await (const message of fetchMessagesSeparate(options)) {
    messages.set(message.id, message);
  }

  return messages;
}

export type MessageFetcherAfterOptions = {
  channel: GuildTextBasedChannel | ThreadChannel;
  limit: number;
  after: string;
};

export async function * fetchMessagesAfter ({ channel, limit, after }: MessageFetcherAfterOptions): AsyncGenerator<Collection<string, Message>> {
  if (limit <= 0) {
    throw new Error('Invalid limit');
  }

  while (true) {
    const batch = await channel.messages.fetch({ limit, after });

    yield batch;

    if (batch.size < limit) {
      return;
    }

    after = batch.first()!.id;
  }
}

export async function * fetchMessagesSeparateAfter (options: MessageFetcherAfterOptions): AsyncGenerator<Message> {
  for await (const batch of fetchMessagesAfter(options)) {
    for (const message of batch.values().toArray().reverse()) {
      yield message;
    }
  }
}

export async function * fetchMessagesAllAfter (options: MessageFetcherAfterOptions): AsyncGenerator<Message> {
  const messages = new Collection<string, Message>();

  for await (const message of fetchMessagesSeparateAfter(options)) {
    messages.set(message.id, message);
  }

  return messages;
}
