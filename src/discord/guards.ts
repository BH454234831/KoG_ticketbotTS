import { PermissionFlagsBits } from "discord.js";
import { ArgsOf, GuardFunction } from "discordx";
import moment, { unitOfTime } from "moment";

export const ThreadModeratorGuard: GuardFunction<ArgsOf<'interactionCreate'>> = async ([interaction], client, next) => {
  if (!interaction.inGuild() || interaction.guild == null) return;
  if (interaction.channel == null) return;

  const member = interaction.guild.members.cache.get(interaction.user.id) ?? await interaction.guild.members.fetch(interaction.user.id);
  if (interaction.channel.permissionsFor(member, true).missing(PermissionFlagsBits.ManageThreads)) return;

  await next();
};

export function TooOldGuard (amount: number, unit: unitOfTime.DurationConstructor): GuardFunction<ArgsOf<'interactionCreate'>> {
  return async ([interaction], client, next) => {
    if ('message' in interaction && interaction.message != null) {
      const date = moment(interaction.message.createdTimestamp).add(amount, unit);
      if (moment().isAfter(date)) return;
    }

    await next();
  };
}
