import { PermissionFlagsBits } from 'discord.js';
import { type ArgsOf, type GuardFunction } from 'discordx';
import { logger } from 'logger';
import moment, { type unitOfTime } from 'moment';

export const ThreadModeratorGuard: GuardFunction<ArgsOf<'interactionCreate'>> = async (arg, client, next) => {
  const interaction = arg instanceof Array ? arg[0] : arg;
  if (!interaction.inGuild() || interaction.guild == null) return;
  if (interaction.channel == null) return;

  const member = interaction.guild.members.cache.get(interaction.user.id) ?? await interaction.guild.members.fetch(interaction.user.id);
  const missingPermissions = interaction.channel.permissionsFor(member, true).missing(PermissionFlagsBits.ManageThreads);
  if (missingPermissions.length > 0) {
    logger.info(`[ThreadModeratorGuard] Missing permissions: ${missingPermissions.join(', ')}`);
    return;
  }

  await next();
};

export function TooOldGuard (amount: number, unit: unitOfTime.DurationConstructor): GuardFunction<ArgsOf<'interactionCreate'>> {
  return async (arg, client, next) => {
    const interaction = arg instanceof Array ? arg[0] : arg;
    if ('message' in interaction && interaction.message != null) {
      const date = moment(interaction.message.createdTimestamp).add(amount, unit);
      if (moment().isAfter(date)) return;
    }

    await next();
  };
}
