import { PermissionsBitField, type PermissionResolvable } from 'discord.js';
import { type ArgsOf, type GuardFunction } from 'discordx';
import { PermissionGuard as DiscordxPermissionGuard, type PermissionHandler } from '@discordx/utilities';
import moment, { type unitOfTime } from 'moment';

export function InteractionDeferGuard (ephemeral?: boolean): GuardFunction<ArgsOf<'interactionCreate'>> {
  return async (arg, client, next) => {
    const interaction = arg instanceof Array ? arg[0] : arg;
    if (interaction.isRepliable()) {
      await interaction.deferReply({ ephemeral });
    }
    await next();
  };
}

export function PermissionGuard (permission: PermissionResolvable): GuardFunction<PermissionHandler> {
  return DiscordxPermissionGuard(new PermissionsBitField(permission).toArray(), {
    content: 'You do not have permission to use this command.',
    ephemeral: true,
  });
}

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
