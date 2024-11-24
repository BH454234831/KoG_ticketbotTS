import { type BaseInteraction, GuildMember, type Interaction } from 'discord.js';

export async function resolveInteractionMemberOrThrow (interaction: Interaction): Promise<GuildMember> {
  if (interaction.member instanceof GuildMember) return interaction.member;
  if (interaction.guild == null) throw new Error('guild is null');
  const cacheMember = interaction.guild.members.cache.get(interaction.user.id);
  if (cacheMember != null) return cacheMember;
  return await interaction.guild.members.fetch(interaction.user.id);
}

export async function resolveInteractionMember (interaction: Interaction): Promise<GuildMember | null> {
  try {
    return await resolveInteractionMemberOrThrow(interaction);
  } catch (err) {
    return null;
  }
}

export type ResolvedMemberData = {
  username: string | null;
  displayName: string | null;
  displayAvatarUrl: string | null;
};

export async function resolveInteractionMemberData (interaction: BaseInteraction<'cached'>, userId: string = interaction.user.id): Promise<ResolvedMemberData> {
  if (interaction.guild == null) throw new Error('guild is null');
  const member = interaction.guild.members.cache.get(userId) ?? await interaction.guild.members.fetch(userId).catch(() => null);
  if (member != null) {
    return {
      username: member.user.username,
      displayName: member.displayName,
      displayAvatarUrl: member.displayAvatarURL(),
    };
  }
  const user = await interaction.client.users.fetch(userId).catch(() => null);
  if (user != null) {
    return {
      username: user.username,
      displayName: null,
      displayAvatarUrl: user.displayAvatarURL(),
    };
  }
  return {
    username: null,
    displayName: null,
    displayAvatarUrl: null,
  };
}
