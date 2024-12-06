import { type LocalizationMap, type LocaleString } from 'discord.js';
import { type ApplicationCommandOptions, ContextMenu, type MethodDecoratorEx, type NotEmpty, type ParameterDecoratorEx, Slash, SlashOption, type SlashOptionOptions, type TransformerFunction, type VerifyName } from 'discordx';
import { type Language, languages } from './constants.js';
import { i18n } from './instance.js';

export function mapDiscordLanguage (language: Language): LocaleString {
  switch (language) {
    case 'en': return 'en-US';
    default: return language;
  }
}

export function unmapDiscordLanguage (language: LocaleString): Language | undefined {
  switch (language) {
    case 'en-US': return 'en';
    case 'de': return 'de';
    case 'fr': return 'fr';
    case 'ru': return 'ru';
    case 'tr': return 'tr';
    default: return undefined;
  }
}

function loadTranslations (localeKey?: string, options?: { nameLocalizations?: LocalizationMap; descriptionLocalizations?: LocalizationMap }): { nameLocalizations: LocalizationMap; descriptionLocalizations: LocalizationMap } {
  const nameLocalizations: LocalizationMap = Object.assign({}, options?.nameLocalizations);
  const descriptionLocalizations: LocalizationMap = Object.assign({}, options?.descriptionLocalizations);

  if (localeKey != null) {
    const nameKey = `${localeKey}.name`;
    if (i18n.has(nameKey)) {
      for (const language of languages) {
        const mappedLanguage = mapDiscordLanguage(language);
        if (options?.nameLocalizations?.[mappedLanguage] != null) continue;
        nameLocalizations[mappedLanguage] = i18n.__impl(`{{${nameKey}}}`, undefined, language);
      }
    }

    // translate description
    const descriptionKey = `${localeKey}.description`;
    if (i18n.has(descriptionKey)) {
      for (const language of languages) {
        const mappedLanguage = mapDiscordLanguage(language);
        if (options?.descriptionLocalizations?.[mappedLanguage] != null) continue;
        descriptionLocalizations[mappedLanguage] = i18n.__impl(`{{${descriptionKey}}}`, undefined, language);
      }
    }
  }

  return { nameLocalizations, descriptionLocalizations };
}

export type TranslatableSlashOptions<T extends string, TD extends string> = ApplicationCommandOptions<VerifyName<T>, NotEmpty<TD>> & {
  localeKey?: string;
};

export function TranslatableSlash<T extends string, TD extends string> (options: TranslatableSlashOptions<T, TD>): MethodDecoratorEx {
  const { nameLocalizations, descriptionLocalizations } = loadTranslations(options.localeKey, options);
  return Slash({ ...options, nameLocalizations, descriptionLocalizations });
}

export type TranslatableSlashOptionOptions<T extends string, TD extends string> = SlashOptionOptions<VerifyName<T>, NotEmpty<TD>> & {
  localeKey?: string;
};

export function TranslatableSlashOption<T extends string, TD extends string> (options: TranslatableSlashOptionOptions<T, TD>, transformer?: TransformerFunction): ParameterDecoratorEx {
  const { descriptionLocalizations } = loadTranslations(options.localeKey);
  return SlashOption({ ...options, descriptionLocalizations }, transformer);
}

export type TranslatableContextMenuOptions<TName extends string> = Parameters<typeof ContextMenu<TName>>[0] & {
  localeKey?: string;
  localeUseDescription?: boolean;
};

export function TranslatableContextMenu<TName extends string> (options: TranslatableContextMenuOptions<TName>): MethodDecoratorEx {
  const { nameLocalizations, descriptionLocalizations } = loadTranslations(options.localeKey, options);
  const _nameLocalizations = options.localeUseDescription === true ? descriptionLocalizations : nameLocalizations;
  return ContextMenu({ ...options, nameLocalizations: _nameLocalizations });
}
