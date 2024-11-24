export const languages = ['en', 'ru', 'fe', 'de', 'tr'] as const;
export type Language = typeof languages[number];
