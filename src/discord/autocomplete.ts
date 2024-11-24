import { dbTicketCategoryService } from "db/services";
import { AutocompleteInteraction } from "discord.js";

export async function categoryAutocomplete (interaction: AutocompleteInteraction): Promise<void> {
  const categories = await dbTicketCategoryService.selectSearch(interaction.options.getFocused());

  await interaction.respond(categories.slice(0, 25).map(category => {
    return {
      name: category.name['en'],
      value: category.id.toString(),
    };
  }));
}
