import { GuildMember, Interaction } from "discord.js";

export async function resolveInteractionMemberOrThrow (interaction: Interaction): Promise<GuildMember | null> {
  if (interaction.member instanceof GuildMember) return interaction.member;
  if (interaction.guild == null) return null;
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
  displayName: string;
  displayAvatarUrl: string | null;
};

export async function resolveInteractionMemberData (interaction: Interaction, userId: string = interaction.user.id): Promise<ResolvedMemberData> {
  if (interaction.guild == null) throw new Error('guild is null');
  const member = interaction.guild.members.cache.get(userId) ?? await interaction.guild.members.fetch(userId).catch(() => null);
  if (member != null) return {
    displayName: member.displayName,
    displayAvatarUrl: member.displayAvatarURL(),
  };
  const user = await interaction.client.users.fetch(userId).catch(() => null);
  if (user != null) return {
    displayName: user.username,
    displayAvatarUrl: user.displayAvatarURL(),
  }
  return {
    displayName: userId,
    displayAvatarUrl: null,
  };
}
