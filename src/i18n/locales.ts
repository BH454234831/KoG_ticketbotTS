/* eslint-disable quote-props */
/* eslint-disable @typescript-eslint/quotes */
import { type LocaleRecords } from './i18n.js';

export default {
  'ticket_buttons.labels': {
    'en': 'English',
    'ru': 'Русский',
    'fr': 'Français',
    'de': 'Deutsch',
    'tr': 'Türkçe',
  },
  'ticket_buttons.emojis': {
    'en': '🇬🇧',
    'ru': '🇷🇺',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'tr': '🇹🇷',
  },
  'ticket_buttons.text': {
    'en': '**Pick a language for ticket creation.**',
  },
  'ticket_buttons.success': {
    'en': '**Ticket buttons created successfully.**',
  },
} as const satisfies LocaleRecords;
