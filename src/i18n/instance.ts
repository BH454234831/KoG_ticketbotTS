import { type Language } from './constants.js';
import { I18n } from './i18n.js';
import Module from 'node:module';

const require = Module.createRequire(import.meta.url);

export const i18n = new I18n<Language, string>('en', require.resolve('./locales.js'));
export const languages = ['en', 'ru', 'fe', 'de', 'tr'] as const;