import { PermissionFlagsBits } from "discord.js";
import { ArgsOf, GuardFunction } from "discordx";

export const ThreadModeratorGuard: GuardFunction<ArgsOf<'interactionCreate'>> = async ([interaction], client, next) => {
  if (!interaction.inGuild() || interaction.guild == null) return;
  if (interaction.channel == null) return;

  const member = interaction.guild.members.cache.get(interaction.user.id) ?? await interaction.guild.members.fetch(interaction.user.id);
  if (interaction.channel.permissionsFor(member, true).missing(PermissionFlagsBits.ManageThreads)) return;

  await next();
};