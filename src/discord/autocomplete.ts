import { dbTicketCategoryService, dbTicketService } from 'db/services';
import { type AutocompleteInteraction } from 'discord.js';
import { logger } from 'logger';

export async function categoryAutocomplete (interaction: AutocompleteInteraction): Promise<void> {
  const categories = await dbTicketCategoryService.selectSearch(interaction.options.getFocused());

  await interaction.respond(categories.slice(0, 25).map(category => {
    return {
      name: category.name.en,
      value: category.id.toString(),
    };
  }));
}

export async function categoryAutocompleteExceptCurrent (interaction: AutocompleteInteraction): Promise<void> {
  if (!interaction.inGuild()) {
    return;
  }
  if (interaction.channel?.parentId == null) {
    logger.debug('[Autocomplete][categoryAutocompleteExceptCurrent] channel.parentId is null');
    await interaction.respond([]);
    return;
  }

  const ticket = await dbTicketService.getTicketByChannelId(interaction.channel.id);
  if (ticket == null) {
    logger.debug('[Autocomplete][categoryAutocompleteExceptCurrent] ticket is null');
    await interaction.respond([]);
    return;
  }

  const currentCategory = await dbTicketCategoryService.select(ticket.categoryId);
  if (currentCategory == null) {
    logger.debug('[Autocomplete][categoryAutocompleteExceptCurrent] currentCategory is null');
    await interaction.respond([]);
    return;
  }

  const categories = await dbTicketCategoryService.selectSearch(interaction.options.getFocused(), currentCategory.id);

  await interaction.respond(categories.slice(0, 25).map(category => {
    return {
      name: category.name.en,
      value: category.id.toString(),
    };
  }));
}
