import { dbUserService } from 'db/services';
import { type Guild } from 'discord.js';
import { type ResolvedMemberData, resolveMemberData } from 'utils/discord/resolve';

export async function resolveMemberDataUser (guild: Guild, userId: string): Promise<ResolvedMemberData> {
  const data = await resolveMemberData(guild, userId);
  const dbData = await dbUserService.getById(userId);

  return {
    username: data.username,
    displayName: data.displayName ?? dbData?.displayName ?? null,
    displayAvatarUrl: data.displayAvatarUrl ?? dbData?.displayAvatarUrl ?? null,
  };
}
