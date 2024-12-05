import { dbTicketCategoryService } from 'db/services';
import { ApplicationCommandOptionType, ChannelType, CommandInteraction, PermissionFlagsBits, type Role, TextChannel } from 'discord.js';
import { categoryAutocomplete } from 'discord/autocomplete';
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from 'discordx';
import { Language, languages } from 'i18n/constants';
import { translateService } from 'services';

@Discord()
@SlashGroup({
  name: 'categories',
  description: 'Manage categories',
  defaultMemberPermissions: PermissionFlagsBits.ManageThreads,
  dmPermission: false,
})

@SlashGroup('categories')
export class CategoriesCommands {
  @Slash({
    name: 'list',
    description: 'List categories',
  })
  public async listCategories (interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const categories = await dbTicketCategoryService.selectAll();

    await interaction.editReply({
      embeds: [{
        title: 'Categories',
        fields: categories.map(category => {
          const requiredRoles = category.requiredRoleIds?.map(roleId => `<@&${roleId}>`) ?? [];

          return {
            name: category.name.en,
            value: `Channel: <#${category.channelId}>\nRequired roles: ${requiredRoles.join(', ')}`,
          };
        }),
      }],
    });
  }

  @Slash({
    name: 'info',
    description: 'Get category info',
  })
  public async getCategoryInfo (
    @SlashOption({
      name: 'category',
      description: 'Category',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: categoryAutocomplete,
    })
      categoryId: string,

      interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const category = await dbTicketCategoryService.select(categoryId);
    if (category == null) {
      await interaction.editReply({
        content: 'Category not found',
      });
      return;
    }

    const names = Object.entries(category.name).map(([language, name]) => {
      return `${language}: ${name}`;
    });

    const welcomes = category.welcome != null
      ? Object.entries(category.welcome).map(([language, welcome]) => {
        return `${language}: ${welcome.slice(0, 100)}...`;
      })
      : null;

    await interaction.editReply({
      embeds: [{
        title: category.name.en,
        fields: [
          {
            name: 'Channel',
            value: `<#${category.channelId}>`,
          },
          {
            name: 'Required roles',
            value: category.requiredRoleIds?.map(roleId => `<@&${roleId}>`).join(', ') ?? 'None',
          },
          {
            name: 'Names',
            value: names.join('\n'),
          },
          ...(welcomes != null
            ? [{
                name: 'Welcome messages',
                value: welcomes.join('\n'),
              }]
            : []),
        ],
      }],
    });
  }

  @Slash({
    name: 'create',
    description: 'Create category',
  })
  public async createCategory (
    @SlashOption({
      name: 'channel',
      description: 'Category channel',
      required: true,
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
    })
      channel: TextChannel,

      @SlashOption({
        name: 'name-en',
        description: 'Category name in English',
        required: true,
        type: ApplicationCommandOptionType.String,
        maxLength: 60,
      })
      nameEn: string,

      @SlashOption({
        name: 'welcome-en',
        description: 'Category welcome message in English',
        required: false,
        type: ApplicationCommandOptionType.String,
        maxLength: 1900,
      })
      welcomeEn: string | undefined,

      @SlashOption({
        name: 'required-role',
        description: 'Category required role',
        required: false,
        type: ApplicationCommandOptionType.Role,
      })
      requiredRole: Role | undefined,

      @SlashOption({
        name: 'autodelete-minutes',
        description: 'Category autodelete in minutes',
        required: false,
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
      })
      autodeleteMinutes: number | undefined,

      interaction: CommandInteraction<'cached' | 'raw'>,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const names = await translateService.translateToAll(nameEn);
    const welcomes = welcomeEn != null ? await translateService.translateToAll(welcomeEn) : null;

    await dbTicketCategoryService.create({
      channelId: channel.id,
      guildId: interaction.guildId,
      name: names,
      welcome: welcomes,
      requiredRoleIds: requiredRole != null ? [requiredRole.id] : null,
      autodeleteMinutes,
    });

    await interaction.editReply({
      content: `Category ${names.en} created`,
    });
  }

  @Slash({
    name: 'delete',
    description: 'Delete category',
  })
  public async deleteCategory (
    @SlashOption({
      name: 'category',
      description: 'Category',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: categoryAutocomplete,
    })
      categoryId: string,

      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const category = await dbTicketCategoryService.select(categoryId);
    if (category == null) {
      await interaction.editReply({
        content: 'Category not found',
      });
      return;
    }

    await dbTicketCategoryService.delete(categoryId);

    await interaction.editReply({
      content: `Category ${category.name.en} deleted`,
    });
  }
}
@Discord()
@SlashGroup({
  name: 'localisation',
  root: 'categories',
  description: 'Manage categories localisation',
})

@SlashGroup('localisation', 'categories')
export class CategoriesLocalisationCommands {
  @Slash({
    name: 'setwelcome',
    description: 'change welcome message localisation',
  })
  public async setWelcome (
    @SlashOption({
      name: 'category',
      description: 'Category',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: categoryAutocomplete,
    })
      categoryId: string,
      @SlashChoice(...languages)
      @SlashOption({
        name: 'language',
        description: 'language',
        required: true,
        type: ApplicationCommandOptionType.String,
      })
      lang: Language,
      @SlashOption({
        name: 'text',
        description: 'text',
        required: true,
        type: ApplicationCommandOptionType.String,
        maxLength: 1900,
      })
      text: string,
      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const category = await dbTicketCategoryService.select(categoryId);
    if (category == null) return;

    if (category.welcome == null) {
      const welcomes = await translateService.translateToAll(text, lang);
      await dbTicketCategoryService.updateWelcome(categoryId, welcomes);
      await interaction.reply('Welcome message updated and translated to all languages succesfuly');
    } else {
      await dbTicketCategoryService.updateWelcome(categoryId, { ...category.welcome, [lang]: text });
      await interaction.reply('Welcome message updated succesfuly');
    }
  }

  @Slash({
    name: 'setname',
    description: 'change welcome message localisation',
  })
  public async setName (
    @SlashOption({
      name: 'category',
      description: 'Category',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: categoryAutocomplete,
    })
      categoryId: string,
      @SlashChoice(...languages)
      @SlashOption({
        name: 'language',
        description: 'language',
        required: true,
        type: ApplicationCommandOptionType.String,
      })
      lang: Language,
      @SlashOption({
        name: 'text',
        description: 'text',
        required: true,
        type: ApplicationCommandOptionType.String,
        maxLength: 60,
      })
      text: string,
      interaction: CommandInteraction<'cached'>,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const category = await dbTicketCategoryService.select(categoryId);
    if (category == null) return;

    await dbTicketCategoryService.updateName(categoryId, lang, text);
    await interaction.reply('Welcome message updated succesfuly');
  }
}
