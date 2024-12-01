import { type ThreadChannel, type Collection, type Message, type GuildTextBasedChannel } from 'discord.js';

export type MessageFetcherRangeOptions =
  | { before: string; after?: undefined }
  | { after?: string; before?: undefined };

export type MessageFetcherOptions = MessageFetcherRangeOptions & {
  channel: GuildTextBasedChannel | ThreadChannel;
  limit: number;
};

export async function * fetchMessages ({ channel, limit, before, after }: MessageFetcherOptions): AsyncGenerator<Collection<string, Message>> {
  if (limit <= 0) {
    throw new Error('Invalid limit');
  }

  while (true) {
    const batch = await channel.messages.fetch({ limit, before, after });

    yield batch;

    if (batch.size < limit) {
      return;
    }

    if (before != null) {
      before = batch.last()!.id;
    } else {
      after = batch.first()!.id;
    }
  }
}

export async function * fetchMessagesSeparate (options: MessageFetcherOptions): AsyncGenerator<Message> {
  for await (const batch of fetchMessages(options)) {
    for (const message of batch.values()) {
      yield message;
    }
  }
}
