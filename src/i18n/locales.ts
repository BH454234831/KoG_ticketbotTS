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
  'thread_buttons.close.labels': {
    'en': 'Close',
    'ru': 'Закрыть',
    'fr': 'Fermer',
    'de': 'Schließen',
    'tr': 'Kapat',
  },
  'thread_buttons.close.text': {
    'en': '**Are you sure you want to close this thread?**',
    'ru': '**Вы уверены, что хотите закрыть этот тикет?**',
    'fr': '**Etes-vous sur de vouloir fermer ce thread?**',
    'de': '**Sind Sie sicher, dass Sie diesen Thread schließen wollen?**',
    'tr': '**Bu tıkete kapatmak istediginizden emin misiniz?**',
  },
  'thread_buttons.close.accept.labels': {
    'en': 'Accept',
    'ru': 'Подтвердить',
    'fr': 'Accepter',
    'de': 'Akzeptieren',
    'tr': 'Kabul et',
  },
  'thread_buttons.close.reject.labels': {
    'en': 'Reject',
    'ru': 'Отклонить',
    'fr': 'Rejeter',
    'de': 'Ablehnen',
    'tr': 'Reddet',
  },
  'thread_buttons.close.delete.labels': {
    'en': 'Delete',
    'ru': 'Удалить',
    'fr': 'Supprimer',
    'de': 'Löschen',
    'tr': 'Sil',
  },
  'thread_buttons.close.cancel.labels': {
    'en': 'Cancel',
    'ru': 'Отменить',
    'fr': 'Annuler',
    'de': 'Abbrechen',
    'tr': 'Iptal et',
  },
} as const satisfies LocaleRecords;
