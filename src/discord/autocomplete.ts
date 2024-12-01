import { dbTicketCategoryService } from 'db/services';
import { type AutocompleteInteraction } from 'discord.js';

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
    await interaction.respond([]);
    return;
  }

  const currentCategory = await dbTicketCategoryService.select(interaction.channel.parentId);
  if (currentCategory == null) {
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
