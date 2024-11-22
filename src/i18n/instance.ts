import { I18n } from './i18n.js';
import Module from 'node:module';

const require = Module.createRequire(import.meta.url);

export const languages = ['en', 'ru', 'fe', 'de', 'tr'] as const;
export type Language = typeof languages[number];

export const i18n = new I18n<typeof languages[number], string>('en', require.resolve('./locales.js'));
