export const languages = ['en', 'ru', 'fr', 'de', 'tr'] as const;
export type Language = typeof languages[number];
