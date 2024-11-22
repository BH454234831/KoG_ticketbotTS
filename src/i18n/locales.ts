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
  'category_buttons.labels': {
    'en': 'Select a category',
    'ru': 'Выберите категорию',
    'fr': 'Choisissez une categorie',
    'de': 'Kategorie auswählen',
    'tr': 'Kategori seçin',
  },
  'category_buttons.success': {
    'en': 'Ticket created successfully. <#{{channelId}}>',
    'ru': 'Тикет создан успешно. <#{{channelId}}>',
    'fr': 'Ticket cree avec success. <#{{channelId}}>',
    'de': 'Ticket erfolgreich erstellt. <#{{channelId}}>',
    'tr': 'Tiket basariyla olusturuldu. <#{{channelId}}>',
  },
} as const satisfies LocaleRecords;
